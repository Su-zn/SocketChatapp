import express from "express";
import {createServer } from 'node:http'
import { Server } from "socket.io";
import { createClient } from "redis";
import { connectDB } from "./Database/db.js";
import Message from "./model/messageModel.js";
import dotenv from 'dotenv';

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const REDIS_URL= process.env.REDIS_URL || 'redis://localhost:6379';

const redisPublisher=createClient({url:REDIS_URL})
const redisSubscriber=createClient({url:REDIS_URL})

redisPublisher.on('error',(err)=>console.log('Redis publisher error',err))
redisSubscriber.on('error',(err)=>console.log('Redis subscriber error',err))

async function initRedis(io,roomName) {
    try {
        await Promise.all([redisPublisher.connect(),redisSubscriber.connect()])
        console.log('Redis connected successfully');

        await redisSubscriber.pSubscribe('chat:*',async(pattern, channel, message)=>{
            let payload
            try{
                payload=JSON.parse(message)
            } catch(error){
                return;
            }
            
            if (!payload.username || payload.username.trim() === '') {
                return;
            }
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

    Socket.on('joinRoom',async(username)=>{
       await Socket.join(Room);

       io.to(Room).emit('userNotice',username)

       emitRoomCount();

       try {
        const chatHistory = await Message.find({room:Room}).sort({_id: 1}).limit(50).lean();
        Socket.emit('chatHistory', chatHistory);
       } catch (error) {
        console.error('Error emitting chat history to user', error);
       }

    })

    Socket.on('chatMessage',async(msg)=>{
        if (!msg || !msg.username || typeof msg.username !== 'string' || msg.username.trim() === '') {
            return;
        }
        
        const payload = {
            username: msg.username.trim(),
            text: msg.text || '',
            time: msg.time || new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
            Date: msg.Date || new Date().toLocaleTimeString()
        };
        
        try {
            const messageDoc = new Message({
                username: payload.username,
                text: payload.text,
                time: payload.time,
                room:Room,
            })
            const savedMessage = await messageDoc.save();
            payload._id = savedMessage._id.toString();
        } catch (error) {
            console.error('Error saving message to database:', error);
        }
        
        io.to(Room).emit('chatMessage', payload);
        
        if (redisPublisher.isOpen) {
            try {
                const redisPayload = JSON.stringify(payload);
                await redisPublisher.publish('chat:room', redisPayload);
            } catch (error) {
                console.error('Error publishing to Redis:', error);
            }
        }

    })


    Socket.on('disconnect',()=>{
        setTimeout(()=>emitRoomCount(),0)
    })
})
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    socketIO: "running",
    timestamp: new Date().toISOString()
  });
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
})
