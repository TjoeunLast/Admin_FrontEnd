// features/shared/api/order_api.ts
import apiClient from '../../shared/api/client';
import { AssignedDriverInfoResponse, OrderListResponse } from '../../orders/type';

// 1. 전체 주문 목록 불러오기
export const fetchOrders = async () => {
    const response = await apiClient.get<OrderListResponse[]>('/api/v1/admin/orders');
    return response.data;
};

// 2. 특정 주문 상세 정보 불러오기 (💡 잘못 들어갔던 타입 제거)
export const fetchOrderDetail = async (orderId: number) => {
    const response = await apiClient.get(`/api/v1/admin/orders/${orderId}`);
    return response.data;
}

// 3. 담당 차주 정보 불러오기 (💡 이 함수가 지워져서 에러가 났습니다. 다시 추가!)
export const fetchOrderDrivers = async (orderId: number) => {
    const response = await apiClient.get<AssignedDriverInfoResponse[]>(`/api/v1/orders/${orderId}/applicants`);
    return response.data;
}