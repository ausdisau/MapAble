
import { useEffect, useState } from 'react';

export default function useMessageSocket(setMessages) {
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');

    socket.onopen = () => console.log('Connected to message socket');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };

    return () => socket.close();
  }, [setMessages]);
}
