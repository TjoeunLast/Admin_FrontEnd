"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import ChatBubble from "@/app/features/user/support/ChatBubble";
import {
  ChatMessageResponse,
  UserInfo,
  inquiryApi,
} from "@/app/features/shared/api/inquiry_api";
import { getBackendWebSocketUrl } from "@/app/features/shared/lib/backend_origin";

const toPositiveId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? Math.trunc(id) : null;
};

const resolveErrorMessage = (error: unknown): string => {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    "message" in responseData &&
    typeof (responseData as { message?: unknown }).message === "string"
  ) {
    return (responseData as { message: string }).message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "채팅 데이터를 처리하는 중 오류가 발생했습니다.";
};

const getCreatedAtMs = (createdAt?: string) => {
  if (!createdAt) return 0;
  const value = new Date(createdAt).getTime();
  return Number.isFinite(value) ? value : 0;
};

const sortMessagesByTime = (items: ChatMessageResponse[]) =>
  [...items].sort((a, b) => getCreatedAtMs(a.createdAt) - getCreatedAtMs(b.createdAt));

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();

  const rawRoomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
  const roomId = toPositiveId(rawRoomId);

  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [input, setInput] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const stompClient = useRef<Client | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadHistory = async () => {
    if (!roomId) {
      setHistoryError("유효하지 않은 채팅방 ID입니다.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setHistoryError(null);
      setSendError(null);

      const [userRes, historyRes] = await Promise.all([
        inquiryApi.getMyInfo(),
        inquiryApi.getDetail(roomId),
      ]);

      setCurrentUser(userRes.data);
      setMessages(sortMessagesByTime(historyRes.data.messages ?? []));
    } catch (error) {
      console.error("채팅 히스토리 로드 실패:", error);
      setHistoryError(resolveErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !currentUser) return;

    const stomp = new Client({
      webSocketFactory: () => new SockJS(getBackendWebSocketUrl()),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        setConnectionError(null);

        stomp.subscribe(`/sub/chat/room/${roomId}`, (payload) => {
          const newMessage = JSON.parse(payload.body) as ChatMessageResponse;
          setMessages((prev) => sortMessagesByTime([...prev, newMessage]));
        });
      },
      onStompError: (frame) => {
        console.error("STOMP 연결 오류:", frame);
        setIsConnected(false);
        setConnectionError("채팅 서버 연결 중 오류가 발생했습니다.");
      },
      onWebSocketError: (event) => {
        console.error("WebSocket 연결 오류:", event);
        setIsConnected(false);
        setConnectionError("웹소켓 연결에 실패했습니다. 네트워크를 확인해주세요.");
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
      stompClient.current = null;
    };
  }, [currentUser, roomId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!roomId) {
      setSendError("채팅방 ID가 올바르지 않습니다.");
      return;
    }

    if (!input.trim()) return;

    if (!currentUser) {
      setSendError("로그인 정보가 없어 메시지를 전송할 수 없습니다.");
      return;
    }

    if (!stompClient.current?.connected) {
      setSendError("채팅 서버 연결이 아직 완료되지 않았습니다.");
      return;
    }

    try {
      stompClient.current.publish({
        destination: "/pub/chat/message",
        body: JSON.stringify({
          roomId,
          senderId: currentUser.userId,
          content: input,
          type: "TEXT",
        }),
      });
      setSendError(null);
      setInput("");
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      setSendError(resolveErrorMessage(error));
    }
  };

  const roomTitle = useMemo(() => {
    if (!roomId) return "채팅방";
    return `채팅방 #${roomId}`;
  }, [roomId]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 pb-20">
      <section className="rounded-[24px] border border-slate-200 bg-white px-7 py-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-[#EDECFC] px-3 py-1 text-[11px] font-black tracking-[0.14em] text-[#4E46E5]">
              LIVE CHAT
            </span>
            <h1 className="mt-3 text-[28px] font-black tracking-tight text-[#0F172A]">{roomTitle}</h1>
            <p className="mt-2 text-sm text-slate-500">
              운영자와 사용자 간 실시간 대화를 관리합니다.
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
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold hover:bg-slate-50"
            >
              이전 화면
            </button>
          </div>
        </div>
      </section>

      {historyError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          <p>{historyError}</p>
          <button
            onClick={() => void loadHistory()}
            className="mt-3 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500"
          >
            다시 시도
          </button>
        </div>
      )}

      {connectionError && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
          {connectionError}
        </div>
      )}

      {sendError && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          {sendError}
        </div>
      )}

      <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="h-[560px] overflow-y-auto bg-slate-50 p-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-slate-400 font-medium">
              채팅 내역을 불러오는 중입니다...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-400">
              아직 대화 내역이 없습니다.
            </div>
          ) : (
            <div className="flex flex-col">
              {messages.map((message, index) => (
                <ChatBubble
                  key={message.messageId || `chat-msg-${index}`}
                  content={message.content}
                  senderRole={message.senderId === currentUser?.userId ? "ADMIN" : "USER"}
                  timestamp={message.createdAt || new Date().toISOString()}
                  senderName={message.senderNickname}
                  type={message.type}
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
