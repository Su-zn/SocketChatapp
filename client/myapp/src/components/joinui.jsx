import React from 'react';
import {useSocket} from '../socketContext'
import {  useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Joinui() {
    const navigate=useNavigate();
    const socket = useSocket()
    const [username , setUsername]= useState('');


    const handlejoin = ()=>{
      socket.once('connect',()=>{
        socket.emit('joinRoom',username)
          navigate('/chat',{state:{username}})
      })
      socket.connect()
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