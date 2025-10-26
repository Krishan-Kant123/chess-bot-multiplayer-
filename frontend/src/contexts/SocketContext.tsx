// import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { io, Socket } from 'socket.io-client';
// import { useAuth } from './AuthContext';

// interface SocketContextType {
//   socket: Socket | null;
//   connected: boolean;
// }

// const SocketContext = createContext<SocketContextType>({
//   socket: null,
//   connected: false,
// });

// export const useSocket = () => {
//   return useContext(SocketContext);
// };

// interface SocketProviderProps {
//   children: ReactNode;
// }

// export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [connected, setConnected] = useState(false);
//   const { user } = useAuth();

//   useEffect(() => {
//     if (user) {
//       const newSocket = io('http://localhost:5000');
      
//       newSocket.on('connect', () => {
//         console.log('Connected to server');
//         setConnected(true);
        
//         // Authenticate with the server
//         const token = localStorage.getItem('token');
//         if (token) {
//           newSocket.emit('authenticate', token);
//         }
//       });

//       newSocket.on('disconnect', () => {
//         console.log('Disconnected from server');
//         setConnected(false);
//       });

//       newSocket.on('authenticated', (data) => {
//         console.log('Authenticated:', data);
//       });

//       newSocket.on('authentication_error', (error) => {
//         console.error('Authentication failed:', error);
//       });

//       setSocket(newSocket);

//       return () => {
//         newSocket.close();
//         setSocket(null);
//         setConnected(false);
//       };
//     }
//   }, [user]);

//   return (
//     <SocketContext.Provider value={{ socket, connected }}>
//       {children}
//     </SocketContext.Provider>
//   );
// };


// import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { io, Socket } from 'socket.io-client';
// import { useAuth } from './AuthContext';

// interface SocketContextType {
//   socket: Socket | null;
//   connected: boolean;
// }

// const SocketContext = createContext<SocketContextType>({
//   socket: null,
//   connected: false,
// });

// export const useSocket = () => useContext(SocketContext);

// interface SocketProviderProps {
//   children: ReactNode;
// }

// export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [connected, setConnected] = useState(false);
//   const { user } = useAuth();

//   useEffect(() => {
//     // Create socket connection regardless of user
//     const newSocket = io('http://localhost:5000', {
//       transports: ['websocket'], // optional, ensures websocket only
//       reconnectionAttempts: 5,
//       timeout: 10000,
//     });

//     newSocket.on('connect', () => {
//       console.log('Socket connected');
//       setConnected(true);

//       // Authenticate only if user exists
//       const token = user ? localStorage.getItem('token') : null;
//       if (token) {
//         newSocket.emit('authenticate', token);
//       }
//     });

//     newSocket.on('disconnect', (reason) => {
//       console.log('Socket disconnected:', reason);
//       setConnected(false);
//     });

//     newSocket.on('connect_error', (error) => {
//       console.error('Socket connection error:', error.message);
//     });

//     newSocket.on('authenticated', (data) => {
//       console.log('Socket authenticated:', data);
//     });

//     newSocket.on('authentication_error', (error) => {
//       console.error('Socket authentication failed:', error);
//     });

//     setSocket(newSocket);

//     // Cleanup on unmount
//     return () => {
//       newSocket.disconnect();
//       setSocket(null);
//       setConnected(false);
//     };
//   }, [user]); // Re-run if user changes (login/logout)

//   return (
//     <SocketContext.Provider value={{ socket, connected }}>
//       {children}
//     </SocketContext.Provider>
//   );
// };


import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
// import dotenv from 'dotenv';

// dotenv.config();


interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });
export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps { children: ReactNode; }

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
// 'http://localhost:5000'
    const newSocket = io(`${import.meta.env.VITE_BACKEND_URI}` , {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected', newSocket.id);
      setConnected(true);

      // Authenticate after reconnect
      const token = localStorage.getItem('token');
      if (token) newSocket.emit('authenticate', token);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('authenticated', (data) => console.log('Authenticated:', data));
    newSocket.on('authentication_error', (error) => console.error('Authentication failed:', error));

    setSocket(newSocket);

    return () => { newSocket.close(); setSocket(null); setConnected(false); };
  }, [user]);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
};
