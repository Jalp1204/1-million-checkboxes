import http from "node:http"
import path from "node:path";

import express from "express"
import { Server } from "socket.io";

import { publisher , subscriber } from "./redis-connection.js"; 
import { channel } from "node:diagnostics_channel";

const checkbox_ct=1000;
const state={
    checkboxes: new Array(checkbox_ct).fill(false)
}

async function main() {
    const PORT= process.env.PORT ?? 8000;

    const app=express();
    const server = http.createServer(app);

    const io=new Server(server);

    await subscriber.subscribe('internal-server:checkbox:change');
    subscriber.on('message', (channel,message)=>{
        if(channel==='internal-server:checkbox:change'){
            const {index,checked} = JSON.parse(message);
            state.checkboxes[index]=checked;
            io.emit('server:checkbox:change', {index,checked});
        }
    })

    //socket io handlers
    io.on('connection', (socket) => {
        console.log(`Socket connected` , {id: socket.id});

        socket.on('client:checkbox:change' , async (data)=>{
            console.log(`socket${socket.id}:client:checkbox:change`, data);
            await publisher.publish('internal-server:checkbox:change', JSON.stringify(data));
        });
        socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        });
    })

    //express handlers
    app.use(express.static(path.resolve('./public')));
    app.get('/health', (req,res) => res.json({healthy:true}));

    app.get('/checkboxes', (req,res) => {
        return res.json({checkboxes: state.checkboxes});
    })


    server.listen(PORT , () => {
        console.log(`server is running on http://localhost:${PORT}`);
    });
}

main();