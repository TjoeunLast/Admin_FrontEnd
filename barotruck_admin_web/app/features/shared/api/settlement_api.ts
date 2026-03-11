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
    orderStatus?: string | null;
    paymentId?: number | null;
    paymentMethod?: string | null;
    paymentTiming?: string | null;
    paymentStatus?: string | null;
    paymentAmount?: number | null;
    paymentFeeAmount?: number | null;
    paymentNetAmount?: number | null;
    baseAmount?: number | null;
    shipperFeeRate?: number | null;
    shipperFeeAmount?: number | null;
    shipperPromoApplied?: boolean | null;
    shipperChargeAmount?: number | null;
    driverFeeRate?: number | null;
    driverFeeAmount?: number | null;
    driverPromoApplied?: boolean | null;
    driverPayoutAmount?: number | null;
    tossFeeRate?: number | null;
    tossFeeAmount?: number | null;
    platformGrossRevenue?: number | null;
    platformNetRevenue?: number | null;
    negativeMargin?: boolean | null;
    feePolicyId?: number | null;
    feePolicyAppliedAt?: string | null;
    pgTid?: string | null;
    proofUrl?: string | null;
    paidAt?: string | null;
    confirmedAt?: string | null;
    totalPrice: number;
    status: string;
    payoutStatus?: string | null;
    payoutFailureReason?: string | null;
    payoutRef?: string | null;
    payoutRequestedAt?: string | null;
    payoutCompletedAt?: string | null;
    feeDate: string;
    feeCompleteDate?: string | null;
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
        const response = await client.get<ApiResponse<SettlementResponse[]>>("/api/v1/settlements/admin/list", {
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
