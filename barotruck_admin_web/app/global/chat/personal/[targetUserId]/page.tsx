"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChatRoomResponse,
  findExistingPersonalRoomId,
  inquiryApi,
} from "@/app/features/shared/api/inquiry_api";

const toPositiveId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? Math.trunc(id) : null;
};

const resolveErrorMessage = (error: unknown): string => {
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

  if (response?.status === 400) {
    return "채팅방 생성 요청이 거절되었습니다. 대상 사용자 ID 또는 권한을 확인해주세요.";
  }

  if (response?.status === 403) {
    return "채팅방 생성 권한이 없습니다.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "채팅방을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.";
};

export default function PersonalChatStartPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTargetUserId = Array.isArray(params.targetUserId)
    ? params.targetUserId[0]
    : params.targetUserId;
  const targetUserId = toPositiveId(rawTargetUserId);
  const targetNickname = searchParams.get("nickname");

  const [isStarting, setIsStarting] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const goToRoom = (roomId: number) => {
    router.replace(`/global/chat/room/${roomId}`);
  };

  const findRoomByHistorySender = async (
    rooms: ChatRoomResponse[],
    userId: number,
  ): Promise<number | null> => {
    const candidateRoomIds = rooms
      .map((room) => toPositiveId(room.roomId))
      .filter((id): id is number => id !== null)
      .slice(0, 20);

    for (const candidateRoomId of candidateRoomIds) {
      try {
        const historyRes = await inquiryApi.getDetail(candidateRoomId);
        const hasTargetMessage = (historyRes.data.messages ?? []).some(
          (message) => Number(message.senderId) === userId,
        );
        if (hasTargetMessage) {
          return candidateRoomId;
        }
      } catch (error) {
        console.warn("채팅 히스토리 조회 실패:", error);
      }
    }

    return null;
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

      const [roomsResult, myInfoResult] = await Promise.allSettled([
        inquiryApi.getRooms(),
        inquiryApi.getMyInfo(),
      ]);

      const rooms: ChatRoomResponse[] =
        roomsResult.status === "fulfilled" ? roomsResult.value : [];
      const myUserId =
        myInfoResult.status === "fulfilled"
          ? toPositiveId(myInfoResult.value?.data?.userId)
          : null;

      if (myUserId && myUserId === targetUserId) {
        setErrorMessage("본인과의 1:1 채팅방은 생성할 수 없습니다.");
        setIsStarting(false);
        return;
      }

      const existingRoomId = findExistingPersonalRoomId(rooms, targetUserId, myUserId, {
        targetNickname,
      });
      if (existingRoomId) {
        goToRoom(existingRoomId);
        return;
      }

      try {
        const roomId = await inquiryApi.createOrEnterPersonalRoom(targetUserId);
        goToRoom(roomId);
        return;
      } catch (createError) {
        const status = (createError as { response?: { status?: number } })?.response?.status;
        if (status === 400 || status === 409) {
          // 생성 실패여도 서버 정책상 기존 방이 존재할 수 있어 재조회 후 재진입 시도
          try {
            const refreshedRooms = await inquiryApi.getRooms();
            const retriedRoomId = findExistingPersonalRoomId(
              refreshedRooms,
              targetUserId,
              myUserId,
              { targetNickname },
            );
            if (retriedRoomId) {
              goToRoom(retriedRoomId);
              return;
            }

            const roomByHistory = await findRoomByHistorySender(refreshedRooms, targetUserId);
            if (roomByHistory) {
              goToRoom(roomByHistory);
              return;
            }
          } catch (roomsRetryError) {
            console.warn("채팅방 재조회 실패:", roomsRetryError);
          }
        }

        throw createError;
      }
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 400 || status === 409) {
        console.warn("개인 채팅 시작 실패(요청 거절):", error);
      } else {
        console.error("개인 채팅 시작 실패:", error);
      }
      setErrorMessage(resolveErrorMessage(error));
      setIsStarting(false);
    }
  };

  useEffect(() => {
    void startChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, targetNickname]);

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
            {targetNickname ? ` · 닉네임: ${targetNickname}` : ""}
          </p>
        </div>

        {isStarting && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-600">
            기존 1:1 채팅방을 확인하고 있습니다. 없으면 새 채팅방을 생성합니다.
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
