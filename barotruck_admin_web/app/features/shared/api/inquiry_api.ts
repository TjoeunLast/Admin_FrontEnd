// app/features/shared/api/inquiry_api.ts
import client from "./client";

export interface ChatMessageResponse {
  messageId: number;
  senderId: number;
  senderNickname: string;
  content: string;
  type: string;
  createdAt?: string;
}

export interface ChatHistoryResponse {
  roomId: number;
  messages: ChatMessageResponse[];
  currentPage: number;
  hasNext: boolean;
}

type ChatUserLike = {
  userId?: number | string;
  id?: number | string;
  user_id?: number | string;
  [key: string]: unknown;
};

export interface ChatRoomResponse {
  roomId: number;
  roomName?: string;
  type?: string;
  roomType?: string;
  lastMessage?: string;
  lastMessageTime?: string | number;
  unreadCount?: number;
  status?: string;

  updatedAt?: string | number;
  updated_at?: string | number;
  lastMessageAt?: string | number;
  last_message_at?: string | number;
  modifiedAt?: string | number;
  modified_at?: string | number;
  lastChatAt?: string | number;
  latestMessageTime?: string | number;
  latest_message_time?: string | number;
  recentMessageTime?: string | number;
  recent_message_time?: string | number;
  createdAt?: string | number;
  created_at?: string | number;

  otherUserId?: number | string;
  partnerId?: number | string;
  targetId?: number | string;
  opponentId?: number | string;
  memberId?: number | string;
  userId?: number | string;

  otherUser?: ChatUserLike;
  partner?: ChatUserLike;
  target?: ChatUserLike;
  opponent?: ChatUserLike;

  participants?: ChatUserLike[];
  members?: ChatUserLike[];
  users?: ChatUserLike[];

  [key: string]: unknown;
}

export interface ChatMessageRequest {
  roomId: number;
  senderId: number;
  content: string;
  type: "TEXT" | "ENTER";
}

export interface UserInfo {
  userId: number;
  nickname: string;
}

export type EnsurePersonalChatRoomErrorCode =
  | "UNAUTHORIZED"
  | "TARGET_NOT_FOUND"
  | "ROOM_NOT_FOUND"
  | "DUPLICATE_ROOM_RECOVERY_FAILED"
  | "UNKNOWN";

export class EnsurePersonalChatRoomError extends Error {
  code: EnsurePersonalChatRoomErrorCode;
  status: number | null;
  originalError?: unknown;

  constructor(
    message: string,
    code: EnsurePersonalChatRoomErrorCode,
    status: number | null = null,
    originalError?: unknown,
  ) {
    super(message);
    this.name = "EnsurePersonalChatRoomError";
    this.code = code;
    this.status = status;
    this.originalError = originalError;
  }
}

const ROOM_TIME_KEYS: string[] = [
  "updatedAt",
  "updated_at",
  "lastMessageTime",
  "last_message_time",
  "lastMessageAt",
  "last_message_at",
  "modifiedAt",
  "modified_at",
  "lastChatAt",
  "latestMessageTime",
  "latest_message_time",
  "recentMessageTime",
  "recent_message_time",
  "createdAt",
  "created_at",
];

const DEBUG_ROOM_ID = 40;
const isDevMode = process.env.NODE_ENV !== "production";

const chatDebug = (label: string, payload: Record<string, unknown>) => {
  if (!isDevMode) return;
  console.debug(`[chat-debug] ${label}`, payload);
};

const toPositiveId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? Math.trunc(id) : null;
};

const getResponseStatus = (error: unknown): number | null => {
  const status = (error as { response?: { status?: unknown } })?.response?.status;
  return typeof status === "number" ? status : null;
};

const getErrorText = (error: unknown): string => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;

  if (data && typeof data === "object") {
    const payload = data as Record<string, unknown>;
    const candidates = [payload.message, payload.error, payload.detail, payload.reason];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "";
};

const isTargetRelatedFailure = (status: number | null, message: string): boolean => {
  if (status === 404) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes("target") ||
    lower.includes("user not found") ||
    lower.includes("not found user") ||
    lower.includes("없는 사용자") ||
    lower.includes("존재하지 않는")
  );
};

const toEnsureRoomError = (
  error: unknown,
  fallbackMessage = "채팅방 생성에 실패했습니다.",
): EnsurePersonalChatRoomError => {
  if (error instanceof EnsurePersonalChatRoomError) {
    return error;
  }

  const status = getResponseStatus(error);
  const message = getErrorText(error) || fallbackMessage;

  if (status === 401 || status === 403) {
    return new EnsurePersonalChatRoomError(
      "로그인이 만료되었거나 채팅 권한이 없습니다.",
      "UNAUTHORIZED",
      status,
      error,
    );
  }

  if (isTargetRelatedFailure(status, message)) {
    return new EnsurePersonalChatRoomError(
      "대상 사용자를 찾을 수 없습니다.",
      "TARGET_NOT_FOUND",
      status,
      error,
    );
  }

  return new EnsurePersonalChatRoomError(message, "UNKNOWN", status, error);
};

const normalizeRoomsPayload = (payload: unknown): ChatRoomResponse[] => {
  if (Array.isArray(payload)) return payload as ChatRoomResponse[];

  const root = payload as {
    rooms?: unknown[];
    content?: unknown[];
    data?: unknown[];
    result?: unknown[];
  };

  if (Array.isArray(root?.rooms)) return root.rooms as ChatRoomResponse[];
  if (Array.isArray(root?.content)) return root.content as ChatRoomResponse[];
  if (Array.isArray(root?.data)) return root.data as ChatRoomResponse[];
  if (Array.isArray(root?.result)) return root.result as ChatRoomResponse[];
  return [];
};

const resolveRoomIdFromPayload = (payload: unknown): number | null => {
  const direct = toPositiveId(payload);
  if (direct) return direct;

  const root = payload as {
    roomId?: unknown;
    id?: unknown;
    data?: unknown;
    result?: unknown;
  };

  const candidates = [
    root?.roomId,
    root?.id,
    (root?.data as { roomId?: unknown; id?: unknown } | undefined)?.roomId,
    (root?.data as { roomId?: unknown; id?: unknown } | undefined)?.id,
    (root?.result as { roomId?: unknown; id?: unknown } | undefined)?.roomId,
    (root?.result as { roomId?: unknown; id?: unknown } | undefined)?.id,
  ];

  for (const candidate of candidates) {
    const id = toPositiveId(candidate);
    if (id) return id;
  }

  return null;
};

const parseTimestampMs = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.trunc(value > 1e11 ? value : value * 1000);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseTimestampMs(numeric);
    }

    const parsed = Date.parse(trimmed);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const resolveRoomTimestampMs = (room: ChatRoomResponse): number | null => {
  const source = room as Record<string, unknown>;
  for (const key of ROOM_TIME_KEYS) {
    const parsed = parseTimestampMs(source[key]);
    if (parsed !== null) return parsed;
  }
  return null;
};

const resolveRoomType = (room: ChatRoomResponse): string => {
  const source = room as Record<string, unknown>;
  return String(room.type ?? room.roomType ?? source.type ?? source.roomType ?? "")
    .trim()
    .toUpperCase();
};

const isPersonalRoom = (room: ChatRoomResponse): boolean => {
  const roomType = resolveRoomType(room);
  if (!roomType) return true;
  return roomType === "PERSONAL" || roomType.includes("PERSONAL");
};

const collectIdsFromUnknown = (value: unknown): number[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap(collectIdsFromUnknown);
  }

  if (typeof value !== "object") {
    const parsed = toPositiveId(value);
    return parsed ? [parsed] : [];
  }

  const item = value as Record<string, unknown>;
  const candidates = [
    item.userId,
    item.user_id,
    item.targetUserId,
    item.target_user_id,
    item.adminId,
    item.admin_id,
    item.memberId,
    item.member_id,
    item.reporterId,
    item.reporter_id,
    item.senderId,
    item.sender_id,
    item.receiverId,
    item.receiver_id,
    item.ownerId,
    item.owner_id,
    item.writerId,
    item.writer_id,
    item.id,
    item.targetId,
    item.target_id,
    item.partnerId,
    item.partner_id,
    item.otherUserId,
    item.other_user_id,
  ];

  return candidates
    .map(toPositiveId)
    .filter((id): id is number => id !== null);
};

const collectParticipantIds = (room: ChatRoomResponse): number[] => {
  const source = room as Record<string, unknown>;

  const ids = [
    room.otherUserId,
    room.partnerId,
    room.targetId,
    room.opponentId,
    room.memberId,
    room.userId,
    room.otherUser?.userId,
    room.otherUser?.id,
    room.partner?.userId,
    room.partner?.id,
    room.target?.userId,
    room.target?.id,
    room.opponent?.userId,
    room.opponent?.id,
    ...(room.participants ?? []).flatMap((participant) => [participant?.userId, participant?.id]),
    ...(room.members ?? []).flatMap((participant) => [participant?.userId, participant?.id]),
    ...(room.users ?? []).flatMap((participant) => [participant?.userId, participant?.id]),
  ]
    .map(toPositiveId)
    .filter((id): id is number => id !== null);

  for (const [key, value] of Object.entries(source)) {
    const keyLower = key.toLowerCase();
    if (keyLower.includes("roomid") || keyLower === "roomid") continue;

    const looksLikeParticipantKey =
      keyLower.includes("userid") ||
      keyLower.includes("user_id") ||
      keyLower.includes("memberid") ||
      keyLower.includes("member_id") ||
      keyLower.includes("partnerid") ||
      keyLower.includes("partner_id") ||
      keyLower.includes("targetid") ||
      keyLower.includes("target_id") ||
      keyLower.includes("targetuserid") ||
      keyLower.includes("target_user_id") ||
      keyLower.includes("opponentid") ||
      keyLower.includes("opponent_id") ||
      keyLower.includes("adminid") ||
      keyLower.includes("admin_id") ||
      keyLower.includes("otheruserid") ||
      keyLower.includes("other_user_id") ||
      keyLower.includes("reporterid") ||
      keyLower.includes("reporter_id") ||
      keyLower.includes("senderid") ||
      keyLower.includes("sender_id") ||
      keyLower.includes("receiverid") ||
      keyLower.includes("receiver_id") ||
      keyLower.includes("ownerid") ||
      keyLower.includes("owner_id") ||
      keyLower.includes("writerid") ||
      keyLower.includes("writer_id") ||
      keyLower.includes("participant");

    if (!looksLikeParticipantKey) continue;

    ids.push(...collectIdsFromUnknown(value));
  }

  return Array.from(new Set(ids));
};

const collectParticipantIdsFromRoomDetail = (payload: unknown): number[] => {
  const root = payload as {
    room?: unknown;
    participants?: unknown;
    members?: unknown;
    users?: unknown;
    messages?: Array<{ senderId?: unknown; sender_id?: unknown }>;
  };

  const ids = [
    ...collectIdsFromUnknown(root?.room),
    ...collectIdsFromUnknown(root?.participants),
    ...collectIdsFromUnknown(root?.members),
    ...collectIdsFromUnknown(root?.users),
    ...(root?.messages ?? []).flatMap((message) => [
      toPositiveId(message?.senderId),
      toPositiveId(message?.sender_id),
    ]),
  ].filter((id): id is number => id !== null);

  return Array.from(new Set(ids));
};

type PersonalRoomCandidate = {
  roomId: number;
  apiIndex: number;
  timestampMs: number | null;
};

const hasTargetParticipantMatch = (
  participants: number[],
  targetUserId: number,
  _myUserId?: number | null,
): boolean => {
  // 서버 권한 체크를 신뢰하고, 클라이언트 후보 선택은 target ID 기준으로만 일치시킨다.
  return participants.includes(targetUserId);
};

const selectBestPersonalRoom = (candidates: PersonalRoomCandidate[]): number | null => {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    const aHasTime = a.timestampMs !== null;
    const bHasTime = b.timestampMs !== null;

    if (aHasTime && bHasTime && a.timestampMs !== b.timestampMs) {
      return (b.timestampMs as number) - (a.timestampMs as number);
    }

    if (aHasTime !== bHasTime) {
      return aHasTime ? -1 : 1;
    }

    if (a.apiIndex !== b.apiIndex) {
      return a.apiIndex - b.apiIndex;
    }

    return a.roomId - b.roomId;
  });

  return sorted[0]?.roomId ?? null;
};

const findExistingPersonalRoomIdByRoomDetail = async (
  rooms: ChatRoomResponse[],
  targetUserId: number,
  myUserId?: number | null,
): Promise<number | null> => {
  const normalizedTargetId = toPositiveId(targetUserId);
  if (!normalizedTargetId) return null;
  const baseRooms = rooms
    .map((room, apiIndex) => {
      const roomId = toPositiveId(room.roomId);
      if (!roomId || !isPersonalRoom(room)) return null;
      return {
        roomId,
        apiIndex,
        timestampMs: resolveRoomTimestampMs(room),
      };
    })
    .filter((item): item is PersonalRoomCandidate => item !== null);

  const candidates: PersonalRoomCandidate[] = [];

  await Promise.all(
    baseRooms.map(async (roomInfo) => {
      try {
        const detailResponse = await client.get<unknown>(`/api/chat/room/${roomInfo.roomId}`);
        const participantIds = collectParticipantIdsFromRoomDetail(detailResponse.data);

        if (hasTargetParticipantMatch(participantIds, normalizedTargetId, myUserId)) {
          candidates.push(roomInfo);
        }
      } catch (error) {
        console.warn("채팅방 상세 기반 참여자 복구 실패:", roomInfo.roomId, error);
      }
    }),
  );

  return selectBestPersonalRoom(candidates);
};

export const findExistingPersonalRoomId = (
  rooms: ChatRoomResponse[],
  targetUserId: number,
  myUserId?: number | null,
): number | null => {
  const normalizedTargetId = toPositiveId(targetUserId);
  if (!normalizedTargetId) return null;
  const candidates: PersonalRoomCandidate[] = [];

  rooms.forEach((room, index) => {
    const roomId = toPositiveId(room.roomId);
    if (!roomId) return;
    if (!isPersonalRoom(room)) return;

    const participants = collectParticipantIds(room);
    if (!hasTargetParticipantMatch(participants, normalizedTargetId, myUserId)) return;

    candidates.push({
      roomId,
      apiIndex: index,
      timestampMs: resolveRoomTimestampMs(room),
    });
  });

  return selectBestPersonalRoom(candidates);
};

export const ensurePersonalChatRoom = async (
  targetUserId: number,
  options?: {
    createIfMissing?: boolean;
  },
): Promise<number> => {
  const normalizedTargetId = toPositiveId(targetUserId);
  if (!normalizedTargetId) {
    throw new EnsurePersonalChatRoomError(
      "대상 사용자 ID가 올바르지 않습니다.",
      "TARGET_NOT_FOUND",
      400,
    );
  }

  let myUserId: number | null = null;

  try {
    const myInfoResponse = await client.get<UserInfo>("/api/user/me");
    myUserId = toPositiveId(myInfoResponse.data?.userId);
  } catch (error) {
    throw toEnsureRoomError(error, "내 사용자 정보를 불러오지 못했습니다.");
  }

  if (myUserId && myUserId === normalizedTargetId) {
    throw new EnsurePersonalChatRoomError(
      "본인과의 1:1 채팅은 시작할 수 없습니다.",
      "TARGET_NOT_FOUND",
      400,
    );
  }

  const createIfMissing = options?.createIfMissing === true;

  const loadAndFindExistingRoom = async (): Promise<number | null> => {
    const roomsResponse = await client.get<ChatRoomResponse[] | unknown>("/api/chat/room");
    const rooms = normalizeRoomsPayload(roomsResponse.data);
    const room40 = rooms.find((room) => toPositiveId(room.roomId) === DEBUG_ROOM_ID);
    const personalRooms = rooms.filter((room) => isPersonalRoom(room));
    const targetMatchedRooms = personalRooms.filter((room) =>
      collectParticipantIds(room).includes(normalizedTargetId),
    );

    const directRoomId = findExistingPersonalRoomId(rooms, normalizedTargetId, myUserId);

    chatDebug("room-list-check", {
      myUserId,
      targetUserId: normalizedTargetId,
      totalRooms: rooms.length,
      beforeFilterPersonalCount: personalRooms.length,
      afterFilterTargetCount: targetMatchedRooms.length,
      room40Exists: Boolean(room40),
      room40Info: room40
        ? {
            roomId: toPositiveId(room40.roomId),
            type: resolveRoomType(room40),
            participantIds: collectParticipantIds(room40),
            updatedAt: (room40 as Record<string, unknown>).updatedAt,
            updated_at: (room40 as Record<string, unknown>).updated_at,
            lastMessageTime: (room40 as Record<string, unknown>).lastMessageTime,
            last_message_time: (room40 as Record<string, unknown>).last_message_time,
            lastMessageAt: (room40 as Record<string, unknown>).lastMessageAt,
            last_message_at: (room40 as Record<string, unknown>).last_message_at,
            modifiedAt: (room40 as Record<string, unknown>).modifiedAt,
            modified_at: (room40 as Record<string, unknown>).modified_at,
            lastChatAt: (room40 as Record<string, unknown>).lastChatAt,
            latestMessageTime: (room40 as Record<string, unknown>).latestMessageTime,
            latest_message_time: (room40 as Record<string, unknown>).latest_message_time,
            recentMessageTime: (room40 as Record<string, unknown>).recentMessageTime,
            recent_message_time: (room40 as Record<string, unknown>).recent_message_time,
            createdAt: (room40 as Record<string, unknown>).createdAt,
            created_at: (room40 as Record<string, unknown>).created_at,
          }
        : null,
      selectedDirectRoomId: directRoomId,
    });

    if (directRoomId) return directRoomId;

    const detailFallbackRoomId = await findExistingPersonalRoomIdByRoomDetail(
      rooms,
      normalizedTargetId,
      myUserId,
    );

    chatDebug("room-detail-fallback", {
      myUserId,
      targetUserId: normalizedTargetId,
      selectedDetailFallbackRoomId: detailFallbackRoomId,
    });

    return detailFallbackRoomId;
  };

  try {
    const existingRoomId = await loadAndFindExistingRoom();
    if (existingRoomId) {
      return existingRoomId;
    }
  } catch (error) {
    throw toEnsureRoomError(error, "채팅방 목록 조회에 실패했습니다.");
  }

  if (!createIfMissing) {
    throw new EnsurePersonalChatRoomError(
      "사용자가 앱에서 관리자 채팅을 먼저 시작해야 합니다.",
      "ROOM_NOT_FOUND",
      404,
    );
  }

  try {
    const response = await client.post<number | unknown>(`/api/chat/room/personal/${normalizedTargetId}`);
    const roomId = resolveRoomIdFromPayload(response.data);
    if (!roomId) {
      throw new EnsurePersonalChatRoomError(
        "채팅방 생성 응답에서 roomId를 확인하지 못했습니다.",
        "UNKNOWN",
      );
    }
    return roomId;
  } catch (postError) {
    const status = getResponseStatus(postError);
    if (status === 400 || status === 409) {
      try {
        const recoveredRoomId = await loadAndFindExistingRoom();
        if (recoveredRoomId) {
          return recoveredRoomId;
        }
      } catch (reloadError) {
        throw toEnsureRoomError(reloadError, "중복 채팅방 복구 중 조회에 실패했습니다.");
      }

      throw new EnsurePersonalChatRoomError(
        "중복된 1:1 채팅방이 있어 자동 복구에 실패했습니다. 운영자에게 문의해주세요.",
        "DUPLICATE_ROOM_RECOVERY_FAILED",
        status,
        postError,
      );
    }

    throw toEnsureRoomError(postError, "채팅방 생성에 실패했습니다.");
  }
};

export const inquiryApi = {
  getAll: () => client.get<ChatRoomResponse[]>("/api/chat/room"),

  getRooms: async (): Promise<ChatRoomResponse[]> => {
    const response = await client.get<ChatRoomResponse[] | unknown>("/api/chat/room");
    return normalizeRoomsPayload(response.data);
  },

  getMyInfo: () => client.get<UserInfo>("/api/user/me"),

  getDetail: (roomId: number) => client.get<ChatHistoryResponse>(`/api/chat/room/${roomId}`),

  createOrEnterPersonalRoom: async (targetUserId: number): Promise<number> => {
    const response = await client.post<number | unknown>(`/api/chat/room/personal/${targetUserId}`);
    const roomId = resolveRoomIdFromPayload(response.data);
    if (!roomId) {
      throw new Error("Unable to resolve chat room id from response.");
    }
    return roomId;
  },

  ensurePersonalChatRoom,
};
