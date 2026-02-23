// app/features/shared/hooks/useStomp.ts
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client, over } from 'stompjs';

export const useStomp = (roomId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws-stomp'); // 백엔드 주소에 맞게 수정
    stompClient.current = over(socket);

    stompClient.current.connect({}, () => {
      // 해당 문의방(Room) 구독
      stompClient.current?.subscribe(`/topic/chat/room/${roomId}`, (tick) => {
        const newMessage = JSON.parse(tick.body);
        setMessages((prev) => [...prev, newMessage]);
      });
    });

    return () => {
      if (stompClient.current) stompClient.current.disconnect(() => {});
    };
  }, [roomId]);

  const sendMessage = (message: string, senderId: string) => {
    if (stompClient.current && message.trim()) {
      const chatMessage = {
        roomId,
        senderId,
        message,
        type: 'TALK'
      };
      stompClient.current.send('/app/chat/message', {}, JSON.stringify(chatMessage));
    }
  };

  return { messages, setMessages, sendMessage };
};