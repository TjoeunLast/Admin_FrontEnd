import client from "./client";

export interface NoticeRequest {
    title: string;
    content: string;
    isPinned: "Y" | "N";
}

export interface NoticeResponse {
    noticeId: number;
    title: string;
    content: string;
    isPinned: "Y" | "N";
    adminName: string;
    createdAt: string;
}

export const noticeApi = {
    // 공지사항 목록 조회
    getAll: () => client.get<NoticeResponse[]>("/api/notices"),

    // 공지사항 상세 조회
    getDetail: (id: number) => client.get<NoticeResponse>(`/api/notices/${id}`),

    // 공지사항 작성
    create: (data: NoticeRequest) => client.post<number>("/api/notices", data),

    // 공지사항 수정
    update: (id: number, data: NoticeRequest) => client.put(`/api/notices/${id}`, data),

    // 공지사항 삭제
    delete: (id: number) => client.delete(`/api/notices/${id}`),
};