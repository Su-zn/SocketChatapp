import React , {createContext, useContext, useRef } from "react";
import { io } from "socket.io-client";



const socketContext = createContext()

export const ContextProvider = (props)=>{

    const socket = useRef()

    if(!socket.current){
        const url = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000'
        socket.current = io(url,{
            autoConnect:false,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000
        })
    }
    return(
        <socketContext.Provider value={socket.current}>
            {props.children}
        </socketContext.Provider>
    )
}



export const useSocket = ()=>{
    const context = useContext(socketContext)

    if(!context){
        throw new console.error("socket must be used with in the provide parameter");
        
    }
    return context
}