# socket.io-chatapp

ChatApp Socket is a simple real-time group chat application built using React (client) and Express + Socket.IO (server). It allows users to join chat rooms and exchange messages instantly through WebSocket connections.

## Monorepo Structure
`
chatappSocket/
  client/
    myapp/        # React app (CRA)
  server/         # Express + Socket.IO server
`

Key files:
- server/ws.js: Socket.IO server (room join, message broadcast, user count)
- client/myapp/src/socketContext.js: Provides a singleton Socket.IO client
- client/myapp/src/components/joinui.jsx: Join screen (username)
- client/myapp/src/components/chatui.jsx: Chat UI and message list

## Prerequisites
- Node.js 18+ and npm

## Installation
`ash
# clone
git clone https://github.com/Su-zn/socket.io-chatapp.git
cd socket.io-chatapp

# install deps
cd server && npm install
cd ../client/myapp && npm install
`

## Run Locally
`ash
# start server (port 4000)
cd server
npm start

# in a new terminal: start client (port 3000)
cd client/myapp
npm start
`

Open http://localhost:3000 in your browser.

## Known Issues and Solutions

### Message Duplication in Chat
Currently, messages may appear twice in the chat due to the simultaneous use of both Socket.IO direct emission and Redis pub/sub patterns. Here's what's happening:

Current implementation (causes duplication):
```javascript
// In ws.js
Socket.on('chatMessage', async(msg) => {
    // First emission - direct Socket.IO
    io.to(Room).emit('chatMessage', msg)

    // Second emission - through Redis
    const payload = typeof msg === 'string' ? { text: msg, createdAt: Date.now() } : msg;
    await redisPublisher.publish('chat:room', JSON.stringify(payload));
})

// Redis subscriber also emits the message
await redisSubscriber.pSubscribe('chat:*', async(message) => {
    let payload
    try { payload = JSON.parse(message) } catch { payload = {text: message} }
    io.to(roomName).emit('chatMessage', payload)  // Third emission
})
```

To fix this, you should choose either the direct Socket.IO method OR the Redis pub/sub method, but not both. Here's the recommended solution using only Redis pub/sub (better for scalability):

```javascript
Socket.on('chatMessage', async(msg) => {
    // Only publish to Redis, let the subscriber handle the broadcast
    const payload = typeof msg === 'string' ? { text: msg, createdAt: Date.now() } : msg;
    await redisPublisher.publish('chat:room', JSON.stringify(payload));
})
```

This approach:
- Eliminates duplicate messages
- Maintains consistency in message handling
- Preserves the Redis pub/sub pattern for future scaling
- Allows multiple server instances to work together seamlessly

## Configuration
- Client Socket URL: update the server URL if not running locally.
  - File: client/myapp/src/socketContext.js
  - Example:
    `js
    socket.current = io('http://localhost:4000', { autoConnect: false })
    `
    Change to your deployed server URL when hosting.
- Server CORS: adjust allowed origins for production in server/ws.js.

## Scripts
- Server: 
pm start (in server/)
- Client: 
pm start (in client/myapp/)

## License
MIT
