// app/features/shared/api/settlement_api.ts
import client from "./client";

// 백엔드 ApiResponse.java 구조 반영
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export interface SettlementResponse {
    bank: string;
    settlementId: number;
    orderId: number;
    shipperUserId: number;
    driverUserId: number;
    driverName: string; // ★ 추가: 차주의 이름
    bankName?: string;    // ★ 추가: 은행명
    accountNum?: string;  // ★ 추가: 은행 계좌번호
    shipperName: string;   // 화주 상호명
    bizNumber: string;     // 사업자 번호
    totalPrice: number;
    status: string; 
    feeDate: string;
}

export interface SettlementStatusSummaryResponse {
    totalAmount: number;
    pendingAmount: number;
    completedAmount: number;
    totalCount: number;
    pendingCount: number;
    completedCount: number;
}

export const settlementApi = {
    getAll: async (status?: string): Promise<SettlementResponse[]> => {
        // ★ 중요: client의 baseURL이 'http://localhost:8080/api/v1'이라면 
        // 아래 경로는 "/settlements/me"로 수정해야 합니다.
        const response = await client.get<ApiResponse<SettlementResponse[]>>("/api/v1/settlements/me", {
            params: { status }
        });
        
        // 백엔드 ApiResponse 구조 상 response.data(Axios) 안의 .data(백엔드)를 반환
        return response.data.data; 
    },

    getStatusSummary: async (): Promise<SettlementStatusSummaryResponse> => {
        const response = await client.get<ApiResponse<SettlementStatusSummaryResponse>>(
            "/api/v1/settlements/admin/status-summary"
        );
        return response.data.data;
    }
}
