"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function InquiryChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawId = searchParams.get("id");
  const inquiryId = Number(rawId);

  const [inquiry, setInquiry] = useState<ReportResponse | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
        setIsConnected(true);
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
      onWebSocketError: () => {
        setIsConnected(false);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
    });

    stomp.activate();
    stompClient.current = stomp;

    return () => {
      setIsConnected(false);
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

  const title = useMemo(() => inquiry?.title || "1:1 문의 채팅", [inquiry?.title]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] p-8">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center text-slate-400 font-semibold">
          채팅 정보를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto max-w-[1200px] p-8 space-y-4">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-5 text-red-700 text-sm font-semibold">
          {errorMessage}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/global/support/inquiry/detail?id=${inquiryId}`)}
            className="px-4 py-2 rounded-xl bg-[#4E46E5] text-white text-sm font-bold hover:bg-[#4338CA]"
          >
            문의 상세로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 pb-20">
      <section className="rounded-[24px] border border-slate-200 bg-white px-7 py-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-[#EDECFC] px-3 py-1 text-[11px] font-black tracking-[0.14em] text-[#4E46E5]">
              INQUIRY CHAT
            </span>
            <h1 className="mt-3 text-[28px] font-black tracking-tight text-[#0F172A]">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">
              문의 #{inquiry?.reportId ?? inquiryId} · 채팅방 #{roomId ?? inquiryId}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}
            >
              {isConnected ? "연결됨" : "연결 중 또는 끊김"}
            </span>
            <button
              onClick={() => router.push(`/global/support/inquiry/detail?id=${inquiryId}`)}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-bold"
            >
              문의 상세로
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="min-h-[520px] flex-1 overflow-y-auto bg-slate-50 p-6">
          {messages.length === 0 ? (
            <div className="flex h-[480px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-400">
              아직 대화 내역이 없습니다.
            </div>
          ) : (
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
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
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
              className="flex-1 rounded-xl border border-slate-200 p-3 resize-none outline-none focus:border-[#4E46E5]"
              placeholder="메시지를 입력하세요..."
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-2 rounded-xl bg-[#4E46E5] text-white text-sm font-bold hover:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              전송
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function InquiryChatPage() {
  return (
    <Suspense fallback={<div className="max-w-[1200px] mx-auto px-4 py-16 text-sm font-semibold text-slate-400">채팅 정보를 불러오는 중...</div>}>
      <InquiryChatPageContent />
    </Suspense>
  );
}
