import React from 'react'
import { useSocket } from '../socketContext';
import {  useEffect , useState  } from 'react';
import { useLocation } from 'react-router-dom';

function Chatui() {
  const [notice,setNotice]=useState('');
  const [message,setMessage]=useState([])
  const [userCount,setUserCount]=useState(0)
  const [input,setInput]=useState('')
  const [chatHistory,setChatHistory]=useState([])
  const socket=useSocket()
  const location = useLocation()
  const username=location.state?.username

  const [displayName]=useState(location.state?.username)


  const onMessage=(msg)=>setMessage((prev)=>[...prev,msg])


  const onlineUser=(count)=>{
    setUserCount(count)
  }

  //chat history
  // Load chat history into messages when received
  useEffect(()=>{
    if(chatHistory.length > 0){
      setMessage(chatHistory)
    }
  }, [chatHistory])


  useEffect(()=>{
    if(!socket.connected) return;

    const onChatHistory = (history)=>{
      setChatHistory(history)
    }

    socket.on('chatHistory',onChatHistory)

    return ()=>socket.off('chatHistory',onChatHistory)

  },[socket,setChatHistory])



  
  //online users
  useEffect(()=>{
    socket.on('roomSize',onlineUser)
  },[socket])

  //chat message rendering
  useEffect(()=>{
    if(socket.connected){
      socket.on('chatMessage',onMessage)
      return ()=>socket.off('chatMessage',onMessage) 
    }
    else{
      socket.on('connect',()=>{
        socket.on('chatMessage',onMessage)
      })
    }

  },[socket])


  const sendMessage=(e)=>{
    e.preventDefault();

    const text = input.trim();

    const messageObject = {
      username:username,
      text:text,
      Date:new Date().toLocaleTimeString(),
      time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
    }

    if(! input.trim() || !socket.connected) return

    socket.emit('chatMessage',messageObject)

    setInput('')


  }


  //user joined notificaation
  useEffect(()=>{
    const onUserNotice = (username)=>setNotice(`${username} joined the chat`)
    socket.on('userNotice',onUserNotice)
    return ()=> socket.off('userNotice',onUserNotice)
  },[socket]);

  return (
    <div className="h-screen w-screen bg-gradient-to-r from-blue-400 to-purple-500 text-gray-900">
      <div className="h-full w-full flex items-center justify-center px-4 py-2">
        {/* Single conversation area */}
        <section className="w-full max-w-3xl h-[100vh] bg-white text-gray-800 rounded-2xl shadow-lg flex flex-col">
          {/* Chat header */}
          <header className="h-14 px-4 flex items-center justify-between bg-white border-b border-gray-200 rounded-t-2xl">
            <div className="flex items-center">
              <img className="w-8 h-8 rounded-full object-cover" src="https://i.pravatar.cc/40?img=1" alt="Alex" />
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                <p className="text-[11px] text-gray-500">online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-500">{userCount} users online</span>
            </div>
          </header>

          {/* Messages */}
          <main className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mx-auto">
              {/* Join notification */}
              <div className="flex justify-center my-2">
                <span className="px-3 py-1 text-[11px] rounded-md bg-blue-100 text-blue-700">{notice}</span>
              </div>

              {/* Chat History Divider */}
            {/* {chatHistory.length > 0 && (
              <div className="flex items-center justify-center my-3">
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-3 py-1 text-[11px] text-gray-500 bg-gray-50 rounded-full">
                    Chat history loaded
                  </span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
              </div>
            )} */}


              {message.map((item , index)=>{
                const messageKey = item._id || item.id || `msg-${index}`;
                return (
                  <div key={messageKey} className={`flex items-end mb-2 ${item.username === username ? 'justify-end' : 'justify-start'}`}>
                    {item.username===username?(
                      <div className="max-w-[75%] bg-blue-500 text-white rounded-lg rounded-tr-none px-3 py-2 shadow">
                        <p className="text-[13px] leading-relaxed">{item.text}</p>
                        <div className="mt-1 text-[10px] text-blue-100 text-right">
                          {item.time || item.Date || ''}
                        </div>
                      </div>
                    ):(
                      <div className="max-w-[75%] bg-gray-100 text-gray-800 rounded-lg rounded-tl-none px-3 py-2 shadow">
                        <div className="text-[11px] text-gray-700 font-bold mb-1">{item.username || 'Anonymous'}-</div>
                        <p className="text-[13px] leading-relaxed">{item.text}</p>
                        <div className="mt-1 text-[10px] text-gray-500 text-right">{item.time || item.Date || ''}</div>
                      </div>
                    )}
                  </div>
                )
})}

            </div>
          </main>

          {/* Composer */}
          <footer className="px-3 py-3 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="mx-auto">
              <form className="flex items-center gap-2">
                <button type="button" className="p-2 rounded-full hover:bg-gray-100" title="Emoji">😊</button>
                <button type="button" className="p-2 rounded-full hover:bg-gray-100" title="Attach">📎</button>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Type a message"
                    value={input}
                    onChange={(e)=>setInput(e.target.value)}
                    className="w-full bg-white text-gray-800 placeholder-gray-400 border border-gray-300 rounded-xl py-2 px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button type="submit" className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white" onClick={sendMessage} title="Send">➤</button>
              </form>
            </div>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default Chatui