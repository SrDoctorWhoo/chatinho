'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Usa o origin atual da página (Serveo) para evitar bloqueios de segurança
    const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
    const s = io(url);

    s.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    s.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return { socket, connected };
}
