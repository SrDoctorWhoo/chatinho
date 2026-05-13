'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';


export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log('[Socket] Initializing connection...');
    
    const s = io(typeof window !== 'undefined' ? window.location.origin : '', {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timestampRequests: true,
      extraHeaders: {
        'ngrok-skip-browser-warning': '1'
      }
    });

    s.on('connect', () => {
      console.log('[Socket] Connected! ID:', s.id, 'Transport:', s.io.engine.transport.name);
      setConnected(true);
    });

    s.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      // Log extra details if available
      if (err.message === 'xhr poll error') {
        console.warn('[Socket] XHR Poll Error detected. This often happens with ngrok or if the socket server is down.');
      }
      setConnected(false);
    });

    s.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
      // If disconnected due to transport error, try to switch to websocket directly
      if (reason === 'transport error') {
        console.log('[Socket] Transport error, will retry...');
      }
    });

    setSocket(s);

    return () => {
      console.log('[Socket] Cleaning up...');
      s.removeAllListeners();
      s.disconnect();
    };
  }, []);


  return { socket, connected };
}
