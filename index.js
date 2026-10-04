import http from "node:http"
import path from "node:path";

import express from "express"
import { Server } from "socket.io";

import { publisher , redis, subscriber } from "./redis-connection.js"; 


const checkbox_ct=1000;
const checkbox_state_key='checkbox-state';

async function main() {
    const PORT= process.env.PORT ?? 8000;

    const app=express();
    const server = http.createServer(app);

    const io=new Server(server);

    await subscriber.subscribe('internal-server:checkbox:change');
    subscriber.on('message', (channel,message)=>{
        if(channel==='internal-server:checkbox:change'){
            const {index,checked} = JSON.parse(message);
            io.emit('server:checkbox:change', {index,checked});
        }
    })

    //socket io handlers
    io.on('connection', (socket) => {
        console.log(`Socket connected` , {id: socket.id});

        socket.on('client:checkbox:change' , async (data)=>{
            console.log(`socket${socket.id}:client:checkbox:change`, data);

            const existing_state = await redis.get(checkbox_state_key);
            
            let remoteData;

            if(existing_state){
                remoteData = JSON.parse(existing_state);
            }
            else{
                 remoteData = new Array(checkbox_ct).fill(false);
            };
            remoteData[data.index]=data.checked;

            await redis.set(
            checkbox_state_key,
            JSON.stringify(remoteData)
            );

            await publisher.publish(
            'internal-server:checkbox:change',
            JSON.stringify(data)
            );
        });
        socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        });
    })

    //express handlers
    app.use(express.static(path.resolve('./public')));
    app.get('/health', (req,res) => res.json({healthy:true}));

    app.get('/checkboxes', async (req,res) => {
        const existing_state = await redis.get(checkbox_state_key);
        if(existing_state){
            const remoteData = JSON.parse(existing_state);
            return res.json({checkboxes: remoteData});
        }else{
            return res.json({checkboxes: new Array(checkbox_ct).fill(false)});
        }    
    })


    server.listen(PORT , () => {
        console.log(`server is running on http://localhost:${PORT}`);
    });
}

main();