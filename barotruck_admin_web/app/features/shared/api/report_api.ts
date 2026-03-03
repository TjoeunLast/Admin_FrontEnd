// app/features/shared/api/report_api.ts
import client from "./client";

export interface ReportResponse {
    reportId: number;
    orderId: number;
    reporterNickname: string;
    targetNickname: string;
    reportType: string;
    description: string;
    status: string;
    createdAt: string;
}

export const reportApi = {
    // 관리자용 전체 신고 목록 조회
    getAll: async (): Promise<ReportResponse[]> => {
        const response = await client.get("/api/reports/admin/all");
        return response.data;
    },

    // 신고 상태 갱신하기 (관리자 주도)
    updateReportStatus: async (reportId: number, status: string): Promise<boolean> => {
        const response = await client.patch(`/api/reports/admin/${reportId}/status`, null, {
            params: {status}
        });

        return response.data;
    }
}