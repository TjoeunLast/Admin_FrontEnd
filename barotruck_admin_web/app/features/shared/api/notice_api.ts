// app/features/shared/api/notice_api.ts
import client from "./client";

export interface NoticeRequest {
    title: string;
    content: string;
    isPinned: string; // "Y" or "N"
}

export interface NoticeResponse {
    noticeId: number;
    title: string;
    content: string;
    isPinned: string; // "Y" or "N"
    adminName: string;
    createdAt: string;
}

export const noticeApi = {
    getAll: () => client.get<NoticeResponse[]>("/api/admin/notices"),
    // ID 뒤에 불필요한 문자가 붙지 않도록 템플릿 리터럴을 정확히 작성합니다.
    getDetail: (id: number) => client.get<NoticeResponse>(`/api/admin/notices/${id}`),
    create: (data: NoticeRequest) => client.post<number>("/api/admin/notices", data),
    update: (id: number, data: NoticeRequest) => client.put(`/api/admin/notices/${id}`, data),
    delete: (id: number) => client.delete(`/api/admin/notices/${id}`),
};
