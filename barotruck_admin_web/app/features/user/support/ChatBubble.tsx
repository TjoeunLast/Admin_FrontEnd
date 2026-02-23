// app/global/support/components/ChatBubble.tsx
'use client';

interface ChatBubbleProps {
  content: string;
  senderRole: 'ADMIN' | 'USER';
  timestamp: string;
  senderName?: string;
}

export default function ChatBubble({ content, senderRole, timestamp, senderName }: ChatBubbleProps) {
  const isAdmin = senderRole === 'ADMIN';

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