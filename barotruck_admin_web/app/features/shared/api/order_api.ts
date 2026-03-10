// features/shared/api/order_api.ts
import apiClient from '../../shared/api/client';
import { AssignedDriverInfoResponse, OrderListResponse } from '../../orders/type';

export interface OrderUserSummary {
    userId: number;
    email?: string | null;
    phone?: string | null;
    nickname?: string | null;
    level?: number | null;
    role?: string | null;
}

export interface OrderPaymentSummary {
    paymentId: number;
    chargedAmount: number;
    receivedAmount: number;
    feeAmount: number;
    method: string;
    status: string;
    paidAt?: string | null;
    confirmedAt?: string | null;
}

export interface OrderProofSummary {
    proofId: number;
    receiptImageUrl?: string | null;
    signatureImageUrl?: string | null;
    recipientName?: string | null;
    createdAt?: string | null;
}

export interface OrderDisputeSummary {
    disputeId: number;
    requesterUserId: number;
    createdByUserId: number;
    reasonCode: string;
    description: string;
    attachmentUrl?: string | null;
    status: string;
    adminMemo?: string | null;
    requestedAt?: string | null;
    processedAt?: string | null;
}

export interface AdminOrderDetailResponse extends OrderListResponse {
    updated?: string | null;
    settlementStatus?: string | null;
    startAddr?: string | null;
    endAddr?: string | null;
    startType?: string | null;
    endType?: string | null;
    endSchedule?: string | null;
    puProvince?: string | null;
    doProvince?: string | null;
    driverNo?: number | null;
    startLat?: number | null;
    startLng?: number | null;
    loadMethod?: string | null;
    loadWeight?: number | null;
    memo?: string | null;
    payMethod?: string | null;
    tag?: string[] | null;
    startNbhId?: number | null;
    endNbhId?: number | null;
    user?: OrderUserSummary | null;
    paymentSummary?: OrderPaymentSummary | null;
    proofSummary?: OrderProofSummary | null;
    disputeSummary?: OrderDisputeSummary | null;
}

// 1. 전체 주문 목록 불러오기
export const fetchOrders = async () => {
    const response = await apiClient.get<OrderListResponse[]>('/api/v1/admin/orders');
    return response.data;
};

// 2. 특정 주문 상세 정보 불러오기
export const fetchOrderDetail = async (orderId: number) => {
    const response = await apiClient.get<AdminOrderDetailResponse>(`/api/v1/admin/orders/${orderId}`);
    return response.data;
}

// 3. 담당 차주 정보 불러오기
export const fetchOrderDrivers = async (orderId: number) => {
    const response = await apiClient.get<AssignedDriverInfoResponse[]>(`/api/v1/orders/${orderId}/applicants`);
    return response.data;
}

// 4. 운임 계산 연동하기
export const calculateFare = async (params: {
    pickupAt: string;
    distanceMeters: number;
    isHoliday: boolean;
}) => {
    const response = await apiClient.post<number>('/api/v1/orders/fare', params);
    return response.data; // 계산된 금액(예: 47400) 반환
};

// 5. 강제 배차 기능
export const forceAllocateOrder = async (
    orderId: number,
    driverId: number,
    reason: string
) => {
    // PatchMapping("/{orderId}/force-allocate")
    const response = await apiClient.patch(`/api/v1/admin/orders/${orderId}/force-allocate`, null, {
        params: {
            reason,
            driverID: driverId // 백엔드 @RequestParam("driverID")와 일치해야 함
        }
    });

    return response.data;
};

// 6. 취소된 오더 목록 조회
export const fetchCancelledOrders = async () => {
    const response = await apiClient.get<OrderListResponse[]>('/api/v1/admin/orders/cancelled');
    return response.data;
};

// 7. 오더 취소 실행 (관리자 권한)
export const cancelOrder = async (orderId: number, reason: string) => {
    const response = await apiClient.delete(`/api/v1/admin/orders/${orderId}/cancel`, {
        params: { reason }
    });
    return response.data;
};

// 8. 관리자 종합 통계 조회 (대시보드용)
export const fetchAdminSummary = async (period: string = 'month') => {
    const response = await apiClient.get('/api/v1/admin/orders/summary', {
        params: { period }
    });
    return response.data;
};

// 9. 지역별 통계 조회 (추가 기능 제안)
export const fetchProvinceStats = async (period: string = 'month') => {
    const response = await apiClient.get('/api/v1/admin/orders/provinces', {
        params: { period }
    });
    return response.data;
};
