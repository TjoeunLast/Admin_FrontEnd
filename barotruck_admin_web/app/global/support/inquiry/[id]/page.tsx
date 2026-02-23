'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import ChatBubble from '@/app/features/user/support/ChatBubble';

export default function InquiryChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const stompClient = useRef<Client | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. STOMP 클라이언트 설정
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-stomp'), // 백엔드 주소 확인
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // 2. 연결 성공 시 콜백
    client.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      
      // 문의방 전용 토픽 구독
      client.subscribe(`/topic/chat/room/${id}`, (payload) => {
        const newMessage = JSON.parse(payload.body);
        setMessages((prev) => [...prev, newMessage]);
      });
    };

    client.onStompError = (frame) => {
      console.error('STOMP Error:', frame.headers['message']);
    };

    // 3. 연결 활성화
    client.activate();
    stompClient.current = client;

    // 4. 언마운트 시 연결 해제
    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [id]);

  // 메시지 수신 시 하단 스크롤
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !stompClient.current?.connected) return;

    const chatMessage = {
      roomId: id,
      senderId: 'ADMIN', // 실제 세션 정보로 교체 권장
      senderName: '관리자',
      message: input,
      type: 'TALK'
    };

    stompClient.current.publish({
      destination: '/app/chat/message',
      body: JSON.stringify(chatMessage),
    });
    
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-50 border rounded-xl overflow-hidden shadow-lg">
      {/* 상단 헤더 */}
      <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
        <div>
          <h2 className="font-bold text-[#1e293b] text-lg">1:1 문의 실시간 상담</h2>
          <p className="text-xs text-slate-500">문의 ID: {id} | 상담원: 관리자</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="text-sm px-4 py-2 border rounded-lg hover:bg-slate-50 transition-colors"
        >
          목록으로
        </button>
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
        {messages.map((msg, idx) => (
          <ChatBubble 
            key={idx} 
            content={msg.message} 
            senderRole={msg.senderId === 'ADMIN' ? 'ADMIN' : 'USER'} 
            timestamp={msg.timestamp || new Date().toISOString()}
            senderName={msg.senderName}
          />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* 메시지 입력 영역 */}
      <div className="p-5 bg-white border-t">
        <div className="flex gap-3">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="상담 내용을 입력하세요..."
            className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all"
          />
          <button 
            onClick={handleSend}
            className="bg-[#3b82f6] text-white px-7 py-3 rounded-xl font-bold hover:bg-blue-600 shadow-md transition-all active:scale-95"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}