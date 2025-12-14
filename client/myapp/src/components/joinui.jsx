import React from 'react';
import {useSocket} from '../socketContext'
import {  useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Joinui() {
    const navigate=useNavigate();
    const socket = useSocket()
    const [username , setUsername]= useState('');


    const handlejoin = ()=>{
      if(!username.trim()) {
        alert('Please enter a username');
        return;
      }

      // Check if already connected
      if(socket.connected) {
        socket.emit('joinRoom',username)
        navigate('/chat',{state:{username}})
        return;
      }

      // Set up connection handlers
      const onConnect = ()=>{
        console.log('Socket connected');
        socket.emit('joinRoom',username)
        navigate('/chat',{state:{username}})
      }

      const onConnectError = (error)=>{
        console.error('Connection error:', error);
        alert('Failed to connect to server. Please try again.');
      }

      socket.once('connect', onConnect);
      socket.once('connect_error', onConnectError);
      
      console.log('Attempting to connect to:', socket.io.uri);
      socket.connect();

      // Timeout after 25 seconds (longer than socket timeout of 20s)
      const timeoutId = setTimeout(() => {
        if(!socket.connected) {
          socket.off('connect', onConnect);
          socket.off('connect_error', onConnectError);
          alert('Connection timeout. Please check your internet connection and try again.');
        }
      }, 25000);

      // Clean up timeout if connection succeeds
      socket.once('connect', () => clearTimeout(timeoutId));
      socket.once('connect_error', () => clearTimeout(timeoutId));
    }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-purple-500">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-80 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Join Us 🚀</h1>
        
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
          className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition duration-200"
          onClick={handlejoin}
        >
          Join
        </button>
      </div>
    </div>
  )
}

export default Joinui