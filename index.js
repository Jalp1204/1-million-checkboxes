import http from "node:http"
import path from "node:path";

import express from "express"
import { Server } from "socket.io";

const checkbox_ct=1000;
const state={
    checkboxes: new Array(checkbox_ct).fill(false)
}

async function main() {
    const PORT= process.env.PORT ?? 8000;

    const app=express();
    const server = http.createServer(app);

    const io=new Server(server);

    //socket io handlers
    io.on('connection', (socket) => {
        console.log(`Socket connected` , {id: socket.id});

        socket.on('client:checkbox:change' , (data)=>{
            console.log(`socket${socket.id}:client:checkbox:change`, data);
            io.emit('server:checkbox:change',data);
            state.checkboxes[data.index]=data.checked;
        })

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