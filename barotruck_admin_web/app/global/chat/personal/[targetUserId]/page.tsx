"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  EnsurePersonalChatRoomError,
  inquiryApi,
} from "@/app/features/shared/api/inquiry_api";

const toPositiveId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? Math.trunc(id) : null;
};

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof EnsurePersonalChatRoomError) {
    if (error.code === "UNAUTHORIZED") {
      return "로그인이 만료되었거나 채팅 권한이 없습니다. 다시 로그인 후 시도해주세요.";
    }
    if (error.code === "TARGET_NOT_FOUND") {
      return "채팅 대상 사용자를 찾을 수 없습니다.";
    }
    if (error.code === "ROOM_NOT_FOUND") {
      return "아직 사용자 측에서 관리자 채팅을 시작하지 않았습니다. 앱에서 먼저 채팅을 시작한 뒤 다시 시도해주세요.";
    }
    if (error.code === "DUPLICATE_ROOM_RECOVERY_FAILED") {
      return "중복된 1:1 채팅방 상태로 자동 복구에 실패했습니다. 운영자에게 문의해주세요.";
    }
    return error.message || "채팅 시작에 실패했습니다.";
  }

  const response = (error as { response?: { status?: number; data?: unknown } })?.response;
  const responseData = response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (responseData && typeof responseData === "object") {
    const root = responseData as Record<string, unknown>;
    const keys = ["message", "error", "detail", "reason"];
    for (const key of keys) {
      const value = root[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  if (response?.status === 401 || response?.status === 403) {
    return "로그인이 만료되었거나 채팅 권한이 없습니다. 다시 로그인 후 시도해주세요.";
  }

  if (response?.status === 404) {
    return "채팅 대상 사용자를 찾을 수 없습니다.";
  }

  if (response?.status === 400 || response?.status === 409) {
    return "중복된 1:1 채팅방 상태로 자동 복구에 실패했습니다. 운영자에게 문의해주세요.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "채팅방을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.";
};

export default function PersonalChatStartPage() {
  const params = useParams();
  const router = useRouter();

  const rawTargetUserId = Array.isArray(params.targetUserId)
    ? params.targetUserId[0]
    : params.targetUserId;
  const targetUserId = toPositiveId(rawTargetUserId);

  const [isStarting, setIsStarting] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const goToRoom = (roomId: number) => {
    router.replace(`/global/chat/room/${roomId}`);
  };

  const startChat = async () => {
    if (!targetUserId) {
      setErrorMessage("유효하지 않은 사용자 ID입니다.");
      setIsStarting(false);
      return;
    }

    try {
      setIsStarting(true);
      setErrorMessage(null);
      const roomId = await inquiryApi.ensurePersonalChatRoom(targetUserId, {
        createIfMissing: false,
      });
      goToRoom(roomId);
      return;
    } catch (error) {
      console.error("개인 채팅 시작 실패:", error);
      setErrorMessage(resolveErrorMessage(error));
      setIsStarting(false);
    }
  };

  useEffect(() => {
    void startChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  const titleText = useMemo(() => {
    if (isStarting) return "채팅방 연결 중입니다...";
    if (errorMessage) return "채팅 시작 실패";
    return "채팅방으로 이동 중입니다...";
  }, [errorMessage, isStarting]);

  return (
    <div className="max-w-[780px] mx-auto px-4 py-16">
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{titleText}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {targetUserId ? `대상 사용자 ID: ${targetUserId}` : "대상 사용자 정보가 없습니다."}
          </p>
        </div>

        {isStarting && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-600">
            기존 1:1 채팅방을 확인하고 있습니다. 관리자 웹에서는 새 채팅방을 생성하지 않습니다.
          </div>
        )}

        {errorMessage && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void startChat()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
              >
                다시 시도
              </button>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold hover:bg-slate-50"
              >
                이전 화면
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
