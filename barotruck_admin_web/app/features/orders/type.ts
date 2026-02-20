// app/features/orders/types.ts
export const ORDER_DRIVING_STATUS_MAP: Record<string, string> = {
  REQUESTED: '배차 대기',
  APPLIED: '승인 대기',
  ACCEPTED: '배차 확정',
  LOADING: '상차 중',
  IN_TRANSIT: '이동 중',
  UNLOADING: '하차 중',
  COMPLETED: '운송 완료'
};

// 배차 기사 정보
export interface AssignedDriverInfoResponse {
    driverId: number;
    driverName: string; // 기사 이름
    phone: string; // 기사 연락처
    carType: string; // 차종
    carNumber: string; // 차량번호
    assignedAt: string; // 배차 확정 시간
}

// 주문 정보
export interface OrderListResponse {
  orderId: number;
  startPlace: string; // 상차지
  endPlace: string; // 하차지
  distance: number; // 거리
  totalPrice: number; // 총 요금
  startSchedule: string; // 시작 시간
  reqCarType: string; // 요구 차종
  reqTonnage: string; // 요구 무게
  workType: string;
  aiRecommended: boolean; // 추천 여부
  driveMode: string; // 운송 유형
  status: string;
}