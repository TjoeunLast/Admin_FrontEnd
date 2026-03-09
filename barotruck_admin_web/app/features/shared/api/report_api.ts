// app/features/shared/api/report_api.ts
import client from "./client";

export interface ReportResponse {
    reportId: number;
    orderId: number;
    reporterNickname: string;
    targetNickname: string;
    reportType: string;
    description: string;
    status: 'PENDING' | 'PROCESSING' | 'RESOLVED'; // 상태 타입 구체화
    createdAt: string;
}

export const reportApi = {
    getAll: async (): Promise<ReportResponse[]> => {
        const response = await client.get("/api/reports/admin/all");
        return response.data;
    },

    // status: 'PROCESSING' 또는 'RESOLVED'로 전송
    updateReportStatus: async (reportId: number, status: string, days?: number): Promise<boolean> => {
        const response = await client.patch(`/api/reports/admin/${reportId}/status`, null, {
            params: { status, days }
        });
        return response.data;
    },

    // 신고 삭제(취소)하기 (관리자용)
    deleteReport: async (reportId: number): Promise<boolean> => {
        const response = await client.delete(`/api/reports/admin/${reportId}`);
        return response.data;
    }
}