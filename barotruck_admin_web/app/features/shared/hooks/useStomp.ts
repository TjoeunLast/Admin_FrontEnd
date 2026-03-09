// app/features/shared/hooks/useStomp.ts
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client, over } from 'stompjs';
import { getBackendWebSocketUrl } from '@/app/features/shared/lib/backend_origin';

type StompMessage = Record<string, unknown>;

export const useStomp = (roomId: string) => {
  const [messages, setMessages] = useState<StompMessage[]>([]);
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    const socket = new SockJS(getBackendWebSocketUrl());
    stompClient.current = over(socket);

    stompClient.current.connect({}, () => {
      // 해당 문의방(Room) 구독
      stompClient.current?.subscribe(`/topic/chat/room/${roomId}`, (tick) => {
        const newMessage = JSON.parse(tick.body) as StompMessage;
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
