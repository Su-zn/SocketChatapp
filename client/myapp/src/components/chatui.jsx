import React from 'react'
import { useSocket } from '../socketContext';
import {  useEffect , useState, useCallback  } from 'react';
import { useLocation } from 'react-router-dom';

function Chatui() {
  const [notice,setNotice]=useState('');
  const [message,setMessage]=useState([])
  const [userCount,setUserCount]=useState(0)
  const [input,setInput]=useState('')
  const [chatHistory,setChatHistory]=useState([])
  const socket=useSocket()
  const location = useLocation()
  
  // Get username from location state or localStorage (for page reloads)
  const getUsername = () => {
    return location.state?.username || localStorage.getItem('chatUsername') || '';
  }
  
  const [username, setUsername] = useState(getUsername())

  // Load username from localStorage on mount if not in location state
  useEffect(() => {
    if (location.state?.username) {
      localStorage.setItem('chatUsername', location.state.username);
      setUsername(location.state.username);
    } else {
      // Try to load from localStorage if location state is not available
      const storedUsername = localStorage.getItem('chatUsername');
      if (storedUsername && !username) {
        setUsername(storedUsername);
      }
    }
  }, [location.state?.username, username])


  const onMessage = useCallback((msg)=>{
    if (!msg || !msg.username) {
      return;
    }
    
    setMessage((prev)=>{
      // Find and replace temp message with server message if it matches
      const tempIndex = prev.findIndex(existing => 
        existing.id && existing.id.startsWith('temp-') && 
        existing.username === msg.username && 
        existing.text === msg.text
      );
      
      if (tempIndex !== -1) {
        const newMessages = [...prev];
        newMessages[tempIndex] = msg;
        return newMessages;
      }
      
      // Check if message already exists (by _id or by content)
      const exists = prev.some(existing => {
        if (existing._id && msg._id && existing._id === msg._id) return true;
        if (existing.text === msg.text && 
            existing.username === msg.username &&
            existing.time === msg.time) return true;
        return false;
      });
      
      if (exists) {
        return prev;
      }
      
      // Add new message
      return [...prev, msg];
    });
  }, [])


  const onlineUser=(count)=>{
    setUserCount(count)
  }

  //chat history - load when received
  useEffect(()=>{
    if(chatHistory && chatHistory.length > 0){
      setMessage(prev => {
        // Create a map of existing messages by their unique identifier
        const existingMap = new Map();
        prev.forEach(m => {
          const key = m._id || `${m.username}-${m.text}-${m.time}`;
          existingMap.set(key, m);
        });
        
        // Add chat history messages that don't already exist
        chatHistory.forEach(m => {
          const key = m._id || `${m.username}-${m.text}-${m.time}`;
          if (!existingMap.has(key)) {
            existingMap.set(key, m);
          }
        });
        
        // Convert back to array and sort by _id (chronological) or time
        return Array.from(existingMap.values()).sort((a, b) => {
          // Prefer _id for sorting (MongoDB ObjectId contains timestamp)
          if (a._id && b._id) {
            return a._id.localeCompare(b._id);
          }
          // Fallback to time comparison
          const timeA = a.time || a.Date || '';
          const timeB = b.time || b.Date || '';
          return timeA.localeCompare(timeB);
        });
      });
    }
  }, [chatHistory])


  useEffect(()=>{
    if (!username) return; // Don't proceed if username is not available

    const joinRoomAndGetHistory = () => {
      if (username) {
        socket.emit('joinRoom', username);
      }
    }

    if(!socket.connected) {
      const onConnect = ()=>{
        if (username) {
          socket.emit('joinRoom', username);
        }
      }
      socket.once('connect', onConnect);
      return () => socket.off('connect', onConnect);
    } else {
      joinRoomAndGetHistory();
    }

    const onChatHistory = (history)=>{
      if (history && Array.isArray(history) && history.length > 0) {
        setChatHistory(history);
      }
    }

    socket.on('chatHistory', onChatHistory);

    return ()=>{
      socket.off('chatHistory', onChatHistory);
    }

  },[socket, username])



  
  //online users
  useEffect(()=>{
    socket.on('roomSize',onlineUser)
  },[socket])

  //chat message rendering - ensure listener is always active
  useEffect(()=>{
    if (!socket) return;

    // Always register the listener
    socket.on('chatMessage', onMessage);
    console.log('chatMessage listener registered');

    return ()=>{
      socket.off('chatMessage', onMessage);
      console.log('chatMessage listener removed');
    }
  },[socket, onMessage])


  const sendMessage=(e)=>{
    e.preventDefault();

    const text = input.trim();
    
    // Ensure username is available - get fresh value from localStorage if needed
    const currentUsername = (username || localStorage.getItem('chatUsername') || '').trim();
    if (!currentUsername) {
      alert('Username is missing. Please join again.');
      return;
    }

    if(! text || !socket.connected) return

    const messageObject = {
      username: currentUsername,
      text: text,
      Date: new Date().toLocaleTimeString(),
      time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
    }

    // Add message to local state immediately with a temporary ID
    const tempMessage = {
      ...messageObject,
      id: `temp-${Date.now()}`,
      _id: `temp-${Date.now()}`
    };
    setMessage((prev)=>[...prev, tempMessage]);

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
                <p className="text-sm font-semibold text-gray-800">{username || 'Guest'}</p>
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



              {message.map((item , index)=>{
                const messageKey = item._id || item.id || `msg-${index}`;
                // Get current username for comparison (from state or localStorage)
                const currentUsername = (username || localStorage.getItem('chatUsername') || '').trim().toLowerCase();
                const messageUsername = (item.username || '').trim().toLowerCase();
                const isOwnMessage = messageUsername && currentUsername && messageUsername === currentUsername;
                
                return (
                  <div key={messageKey} className={`flex items-end mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    {isOwnMessage ? (
                      <div className="max-w-[75%] bg-blue-500 text-white rounded-lg rounded-tr-none px-3 py-2 shadow">
                        <p className="text-[13px] leading-relaxed">{item.text}</p>
                        <div className="mt-1 text-[10px] text-blue-100 text-right">
                          {item.time || item.Date || ''}
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[75%] bg-gray-100 text-gray-800 rounded-lg rounded-tl-none px-3 py-2 shadow">
                        <div className="text-[11px] text-gray-700 font-bold mb-1">{item.username}-</div>
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