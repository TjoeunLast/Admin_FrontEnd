'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import ChatBubble from '@/app/features/user/support/ChatBubble';
import { inquiryApi, ChatMessageResponse, UserInfo } from '@/app/features/shared/api/inquiry_api';
import { getBackendWebSocketUrl } from '@/app/features/shared/lib/backend_origin';

declare global {
  interface Window {
    stompClient?: Client | null;
  }
}

export default function InquiryChatPage() {
  const router = useRouter();
  const { id } = useParams();
  const roomId = Number(id);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [input, setInput] = useState('');
  const stompClient = useRef<Client | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 데이터 초기 로드 및 정렬 수정
  useEffect(() => {
    const initData = async () => {
      try {
        const [userRes, historyRes] = await Promise.all([
          inquiryApi.getMyInfo(),
          inquiryApi.getDetail(roomId)
        ]);
        setCurrentUser(userRes.data);
        
        // ★ 수정: 과거 내역을 시간 오름차순(오래된 것 -> 최신)으로 정렬
        const sortedMessages = historyRes.data.messages.sort((a, b) => 
          new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
        );
        setMessages(sortedMessages);
      } catch (error) {
        console.error("데이터 로드 실패", error);
      }
    };
    initData();
  }, [roomId]);

  // 2. 실시간 연결 및 전역 변수 등록
  useEffect(() => {
    if (!currentUser) return;

    const stomp = new Client({
      webSocketFactory: () => new SockJS(getBackendWebSocketUrl()),
      reconnectDelay: 5000,
      onConnect: () => {
        // ★ 테스트를 위해 콘솔에서 접근 가능하도록 등록
        window.stompClient = stomp;

        stomp.subscribe(`/sub/chat/room/${roomId}`, (payload) => {
          const newMessage = JSON.parse(payload.body) as ChatMessageResponse;
          setMessages((prev) => {
            const updated = [...prev, newMessage];
            // ★ 수신 시에도 항상 시간순 정렬 보장
            return updated.sort((a, b) => 
              new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
            );
          });
        });
      },
    });

    stomp.activate();
    stompClient.current = stomp;

    return () => {
      stomp.deactivate();
      window.stompClient = null;
    };
  }, [roomId, currentUser]);

  // 스크롤 하단 이동 (최신 메시지가 아래에 있으므로 필요함)
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !stompClient.current?.connected) return;

    const request = {
      roomId: roomId,
      senderId: currentUser?.userId,
      content: input,
      type: 'TEXT'
    };

    stompClient.current.publish({
      destination: '/pub/chat/message',
      body: JSON.stringify(request),
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 부분 */}
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg text-slate-800">1:1 문의 상담실</h2>
          <p className="text-xs text-slate-500">방 번호: {roomId}</p>
        </div>
        {/* 목록으로 버튼: 절대 경로 및 탭 파라미터 추가 */}
        <button 
          onClick={() => router.push('/global/support?tab=inquiry')} 
          className="text-sm px-4 py-2 border rounded-lg hover:bg-slate-50 font-bold"
        >
          목록으로
        </button>
      </div>

      {/* 채팅 메시지 영역: 시간순으로 아래쪽으로 정렬됨 */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        <div className="flex flex-col">
          {messages.map((msg, idx) => (
            <ChatBubble 
              key={msg.messageId || `msg-${idx}`}
              content={msg.content} 
              senderRole={msg.senderId === currentUser?.userId ? 'ADMIN' : 'USER'} 
              timestamp={msg.createdAt || new Date().toISOString()}
              senderName={msg.senderNickname}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* 입력창 (기존과 동일) */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            className="flex-1 border rounded-xl p-2 resize-none"
            placeholder="메시지를 입력하세요..."
          />
          <button onClick={handleSend} className="bg-blue-500 text-white px-4 py-2 rounded-xl">전송</button>
        </div>
      </div>
    </div>
  );
}
