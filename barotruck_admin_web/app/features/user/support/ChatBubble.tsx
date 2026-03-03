// app/global/support/components/ChatBubble.tsx
'use client';

interface ChatBubbleProps {
  content: string;
  senderRole: 'ADMIN' | 'USER';
  timestamp: string;
  senderName?: string;
  type?: string; // 추가: 메시지 타입 (ENTER, TEXT 등)
}

export default function ChatBubble({ content, senderRole, timestamp, senderName, type }: ChatBubbleProps) {
  const isAdmin = senderRole === 'ADMIN';
  const isSystem = type === 'ENTER'; // 입장 메시지인지 확인

  // 시스템 메시지(입장 알림)인 경우의 디자인
  if (isSystem) {
    return (
      <div className="flex justify-center my-4 w-full animate-in fade-in duration-500">
        <div className="bg-slate-100 px-4 py-1.5 rounded-full shadow-sm border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500">
            {content}
          </span>
        </div>
      </div>
    );
  }

  // 일반 채팅 메시지 디자인 (기존 유지)
  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-5 w-full animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div className="flex items-center gap-2 mb-1.5 px-1">
          {!isAdmin && <span className="text-xs font-bold text-slate-700">{senderName || '사용자'}</span>}
          <span className="text-[10px] text-slate-400">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className={`p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
          isAdmin 
            ? 'bg-[#3b82f6] text-white rounded-tr-none' 
            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
        }`}>
          {content}
        </div>
      </div>
    </div>
  );
}