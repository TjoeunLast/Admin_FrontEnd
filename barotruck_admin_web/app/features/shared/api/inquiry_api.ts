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
};

export interface ChatRoomResponse {
  roomId: number;
  roomName?: string;
  type?: string;
  roomType?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  status?: string;

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

  otherUserNickname?: string;
  partnerNickname?: string;
  targetNickname?: string;
  opponentNickname?: string;
  userNickname?: string;
  partnerName?: string;
  userName?: string;
  name?: string;
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

const toPositiveId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? Math.trunc(id) : null;
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

const collectParticipantIds = (room: ChatRoomResponse): number[] => {
  const source = room as ChatRoomResponse & Record<string, unknown>;

  const dynamicIds = Object.entries(source)
    .flatMap(([key, value]) => {
      if (key === "roomId") return [];

      const keyLower = key.toLowerCase();
      const looksLikeUserIdKey =
        keyLower.includes("userid") ||
        keyLower.includes("user_id") ||
        keyLower.includes("memberid") ||
        keyLower.includes("member_id") ||
        keyLower.includes("partnerid") ||
        keyLower.includes("partner_id") ||
        keyLower.includes("targetid") ||
        keyLower.includes("target_id") ||
        keyLower.includes("opponentid") ||
        keyLower.includes("opponent_id") ||
        keyLower.includes("otheruserid") ||
        keyLower.includes("other_user_id");

      if (!looksLikeUserIdKey) return [];

      if (typeof value === "object" && value !== null) {
        const nested = value as { userId?: unknown; id?: unknown };
        return [nested.userId, nested.id];
      }

      return [value];
    })
    .map(toPositiveId)
    .filter((id): id is number => id !== null);

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
    ...dynamicIds,
  ]
    .map(toPositiveId)
    .filter((id): id is number => id !== null);

  return Array.from(new Set(ids));
};

export const findExistingPersonalRoomId = (
  rooms: ChatRoomResponse[],
  targetUserId: number,
  myUserId?: number | null,
  options?: {
    targetNickname?: string | null;
  },
): number | null => {
  const sortedRooms = [...rooms].sort((a, b) => {
    const aTime = new Date(a.lastMessageTime ?? "").getTime();
    const bTime = new Date(b.lastMessageTime ?? "").getTime();
    const aValid = Number.isFinite(aTime) ? aTime : 0;
    const bValid = Number.isFinite(bTime) ? bTime : 0;
    if (aValid !== bValid) return bValid - aValid;
    return (toPositiveId(b.roomId) ?? 0) - (toPositiveId(a.roomId) ?? 0);
  });

  const targetNickname = String(options?.targetNickname ?? "")
    .trim()
    .toLowerCase();

  for (const room of sortedRooms) {
    const roomId = toPositiveId(room.roomId);
    if (!roomId) continue;

    const participants = collectParticipantIds(room);
    if (participants.length > 0) {
      const hasTarget = participants.includes(targetUserId);
      const hasMe = myUserId ? participants.includes(myUserId) : true;
      if (hasTarget && hasMe) {
        return roomId;
      }
    }

    if (!targetNickname) continue;

    const source = room as ChatRoomResponse & Record<string, unknown>;
    const nameCandidates = [
      room.roomName,
      room.name,
      room.otherUserNickname,
      room.partnerNickname,
      room.targetNickname,
      room.opponentNickname,
      room.userNickname,
      room.partnerName,
      room.userName,
      source.otherUserName,
      source.targetName,
      source.opponentName,
    ]
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter((value) => value.length > 0);

    const roomType = String(room.type ?? room.roomType ?? source.type ?? source.roomType ?? "")
      .trim()
      .toUpperCase();
    const isPersonalLike = !roomType || roomType.includes("PERSONAL") || roomType.includes("DIRECT");

    if (isPersonalLike && nameCandidates.some((value) => value.includes(targetNickname))) {
      return roomId;
    }
  }

  return null;
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
};
