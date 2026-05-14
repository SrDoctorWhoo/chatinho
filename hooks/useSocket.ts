'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';


export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    console.log('[Socket] Initializing connection to:', socketUrl);
    
    const s = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      extraHeaders: {
        'ngrok-skip-browser-warning': '1'
      }
    });

    s.on('connect', () => {
      console.log('[Socket] Connected! ID:', s.id, 'Transport:', s.io.engine.transport.name);
      setConnected(true);
    });

    s.on('connect_error', (err) => {
      if (err.message === 'xhr poll error') {
        console.warn('[Socket] Polling failed, retrying with websocket...');
      } else {
        console.error('[Socket] Connection error:', err.message);
      }
      setConnected(false);
    });

    s.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
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
