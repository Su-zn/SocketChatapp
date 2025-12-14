import express from "express";
import {createServer } from 'node:http'
import { Server } from "socket.io";
import { createClient } from "redis";
import { connectDB } from "./Database/db.js";
import Message from "./model/messageModel.js";
import dotenv from 'dotenv';

dotenv.config();
const app = express();

const REDIS_URL= process.env.REDIS_URL || 'redis://localhost:6379';

const redisPublisher=createClient({url:REDIS_URL})
const redisSubscriber=createClient({url:REDIS_URL})

redisPublisher.on('error',(err)=>console.log('Redis publisher error',err))
redisSubscriber.on('error',(err)=>console.log('Redis subscriber error',err))

async function initRedis(io,roomName) {
    try {
        await Promise.all([redisPublisher.connect(),redisSubscriber.connect()])
        console.log('Redis connected successfully');

        //Receive from all chat message and rebrocast to socket.io room
        // pSubscribe callback receives (pattern, channel, message)
        await redisSubscriber.pSubscribe('chat:*',async(pattern, channel, message)=>{
            let payload
            try{payload=JSON.parse(message)} catch{payload={text:message}}
            io.to(roomName).emit('chatMessage',payload)
        })
    } catch (error) {
        console.error('Redis connection failed:', error);
        // Continue without Redis if connection fails
    }
    
}

const server = createServer(app);

const io = new Server(server,{
    cors:{
        origin: process.env.CORS_ORIGIN || "*",
        methods:["GET","POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

const Room = 'room';

(async () => { 
    await connectDB();
    await initRedis(io, Room);
})();
const emitRoomCount=()=>{
    const count=io.sockets.adapter.rooms.get(Room)?.size || 0;
    io.to(Room).emit('roomSize',count)
}

io.on('connection',(Socket)=>{
    console.log("user connected",Socket.id);

    Socket.on('joinRoom',async(username)=>{
        console.log(`${username} joining the room`);
       await Socket.join(Room);

       io.to(Room).emit('userNotice',username)

       emitRoomCount();

       try {
        const chatHistory = await Message.find({room:Room}).sort({time:1}).limit(50).lean();

        Socket.emit('chatHistory',chatHistory)
        console.log('Chat history emitted to user',Socket.id);
       } catch (error) {
        console.error('Error emitting chat history to user',error);
       }

    })

    Socket.on('chatMessage',async(msg)=>{
        const payload = typeof msg === 'string' ? { text: msg, createdAt: Date.now() } : msg;
        
        // Publish to Redis if connected
        if (redisPublisher.isOpen) {
            try {
                await redisPublisher.publish('chat:room', JSON.stringify(payload));
            } catch (error) {
                console.error('Error publishing to Redis:', error);
            }
        } else {
            // If Redis is not available, broadcast directly
            io.to(Room).emit('chatMessage', payload);
        }

        try {
            const message = new Message({
                username:msg.username,
                text:msg.text,
                time:msg.time || new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
                room:Room,
            })
            await message.save();
            console.log('Message saved to database',message);
        } catch (error) {
            console.error('Error saving message to database',error);
        }

    })


    Socket.on('disconnect',()=>{
        setTimeout(()=>emitRoomCount(),0)
    })
})
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 4000;
server.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);  
})
