// app/features/shared/api/inquiry_api.ts
import client from "./client";

export interface ChatMessageResponse {
    messageId: number;
    senderId: number;
    senderNickname: string;
    content: string;
    type: string; // TEXT, IMAGE, ENTER 등
    createdAt?: string;
}

export interface ChatHistoryResponse {
    roomId: number;
    messages: ChatMessageResponse[];
    currentPage: number;
    hasNext: boolean;
}

export interface ChatRoomResponse {
    roomId: number;
    roomName: string;
    type: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    status?: string;
}

export interface ChatMessageRequest {
    roomId: number;
    senderId: number;
    content: string;
    type: 'TEXT' | 'ENTER'; // 현재는 텍스트와 입장 타입만 사용
}

export interface UserInfo {
    userId: number;
    nickname: string;
}

export const inquiryApi = {
    // 1. 목록 조회
    getAll: () => client.get<ChatRoomResponse[]>("/api/chat/room"),
    
    getMyInfo: () => client.get<UserInfo>("/api/user/me"),
    // 3. 채팅방 히스토리 상세 조회 (ChatHistoryResponse 반환)
    getDetail: (roomId: number) => client.get<ChatHistoryResponse>(`/api/chat/room/${roomId}`)
};