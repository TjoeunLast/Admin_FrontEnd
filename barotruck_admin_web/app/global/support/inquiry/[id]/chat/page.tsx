"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import ChatBubble from "@/app/features/user/support/ChatBubble";
import {
  inquiryApi,
  ChatMessageResponse,
  UserInfo,
} from "@/app/features/shared/api/inquiry_api";
import { reportApi, ReportResponse } from "@/app/features/shared/api/report_api";
import { getBackendWebSocketUrl } from "@/app/features/shared/lib/backend_origin";

declare global {
  interface Window {
    stompClient?: Client | null;
  }
}

function getCreatedAtMs(value?: string) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export default function InquiryChatPage() {
  const router = useRouter();
  const params = useParams();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const inquiryId = Number(rawId);

  const [inquiry, setInquiry] = useState<ReportResponse | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stompClient = useRef<Client | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;

    const initData = async () => {
      if (!Number.isFinite(inquiryId)) {
        setErrorMessage("유효하지 않은 문의 ID입니다.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        let resolvedRoomId = inquiryId;
        let detail: ReportResponse | null = null;

        try {
          detail = await reportApi.getDetail(inquiryId);
          resolvedRoomId = detail.roomId ?? detail.chatRoomId ?? detail.reportId;
        } catch (detailError) {
          console.warn("문의 상세 조회 실패, URL ID를 채팅방 ID로 사용합니다.", detailError);
        }

        const [userRes, historyRes] = await Promise.all([
          inquiryApi.getMyInfo(),
          inquiryApi.getDetail(resolvedRoomId),
        ]);

        if (isCancelled) return;

        setInquiry(detail);
        setRoomId(resolvedRoomId);
        setCurrentUser(userRes.data);
        setMessages(
          [...historyRes.data.messages].sort(
            (a, b) => getCreatedAtMs(a.createdAt) - getCreatedAtMs(b.createdAt),
          ),
        );
      } catch (error) {
        console.error("문의 채팅 로드 실패:", error);
        if (!isCancelled) {
          setErrorMessage("채팅 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void initData();

    return () => {
      isCancelled = true;
    };
  }, [inquiryId]);

  useEffect(() => {
    if (!currentUser || roomId === null) return;

    const stomp = new Client({
      webSocketFactory: () => new SockJS(getBackendWebSocketUrl()),
      reconnectDelay: 5000,
      onConnect: () => {
        window.stompClient = stomp;
        stomp.subscribe(`/sub/chat/room/${roomId}`, (payload) => {
          const newMessage = JSON.parse(payload.body) as ChatMessageResponse;
          setMessages((prev) =>
            [...prev, newMessage].sort(
              (a, b) => getCreatedAtMs(a.createdAt) - getCreatedAtMs(b.createdAt),
            ),
          );
        });
      },
    });

    stomp.activate();
    stompClient.current = stomp;

    return () => {
      void stomp.deactivate();
      window.stompClient = null;
    };
  }, [currentUser, roomId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !stompClient.current?.connected || !currentUser || roomId === null) {
      return;
    }

    const request = {
      roomId,
      senderId: currentUser.userId,
      content: input,
      type: "TEXT" as const,
    };

    stompClient.current.publish({
      destination: "/pub/chat/message",
      body: JSON.stringify(request),
    });

    setInput("");
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center text-slate-400 font-medium italic">
        채팅 정보를 불러오는 중입니다...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-[1200px] mx-auto p-8 space-y-4">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-5 text-red-700 text-sm font-semibold">
          {errorMessage}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/global/support/inquiry/${inquiryId}`)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
          >
            문의 상세로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center gap-4">
        <div>
          <h2 className="font-bold text-lg text-slate-900">
            {inquiry?.title || "1:1 문의 채팅"}
          </h2>
          <p className="text-xs text-slate-500">
            문의 #{inquiry?.reportId ?? inquiryId} · 채팅방 #{roomId ?? inquiryId}
          </p>
        </div>
        <button
          onClick={() => router.push(`/global/support/inquiry/${inquiryId}`)}
          className="text-sm px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold"
        >
          문의 상세로
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 min-h-[520px]">
        <div className="flex flex-col">
          {messages.map((msg, idx) => (
            <ChatBubble
              key={msg.messageId || `msg-${idx}`}
              content={msg.content}
              senderRole={msg.senderId === currentUser?.userId ? "ADMIN" : "USER"}
              timestamp={msg.createdAt || new Date().toISOString()}
              senderName={msg.senderNickname}
              type={msg.type}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 border border-slate-200 rounded-xl p-3 resize-none"
            placeholder="메시지를 입력하세요..."
            rows={2}
          />
          <button
            onClick={handleSend}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
