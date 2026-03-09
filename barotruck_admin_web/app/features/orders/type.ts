import { CANCELLED } from "dns";

// app/features/orders/types.ts
export const ORDER_DRIVING_STATUS_MAP: Record<string, string> = {
  REQUESTED: '배차 대기',
  APPLIED: '승인 대기',
  ACCEPTED: '배차 확정',
  LOADING: '상차 중',
  IN_TRANSIT: '이동 중',
  UNLOADING: '하차 중',
  COMPLETED: '운송 완료',
  CANCELLED: '취소',
  CANCELLED_BY_ADMIN: '취소(관리자)',
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
  cargoContent: string;
  nickname: string;
  
  // cancellation 객체 구조 추가
  cancellation?: {
    cancelReason: string;
    cancelledAt: string;
    cancelledBy: string;
  };
  
  startPlace: string; // 상차지
  endPlace: string; // 하차지
  distance: number; // 거리
  totalPrice: number; // 총 요금

  basePrice?: number;      // 기본 운임
  laborFee?: number;       // 수작업비
  packagingPrice?: number; // 포장비
  insuranceFee?: number;   // 보험료
  tonnage?: number;        // 무게

  startSchedule: string; // 시작 시간
  reqCarType: string; // 요구 차종
  reqTonnage: string; // 요구 무게
  workType: string;
  
  createdAt: string; // 주문 생성 시간
  aiRecommended: boolean; // 추천 여부
  driveMode: string; // 운송 유형
  status: string;
}