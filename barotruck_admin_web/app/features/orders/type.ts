import { CANCELLED } from "dns";

// app/features/orders/types.ts
export const ORDER_DRIVING_STATUS_MAP: Record<string, string> = {
  REQUESTED: "배차 대기",
  APPLIED: "승인 대기",
  ACCEPTED: "배차 확정",
  LOADING: "상차 중",
  IN_TRANSIT: "이동 중",
  UNLOADING: "하차 중",
  COMPLETED: "운송 완료",
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

  basePrice?: number; // 기본 운임
  laborFee?: number; // 수작업비
  packagingPrice?: number; // 포장비
  insuranceFee?: number; // 보험료
  tonnage?: number; // 무게

  startSchedule: string; // 시작 시간
  reqCarType: string; // 요구 차종
  reqTonnage: string; // 요구 무게
  workType: string;

  createdAt: string; // 주문 생성 시간
  aiRecommended: boolean; // 추천 여부
  driveMode: string; // 운송 유형
  status: string;
}

/**
 * 리뷰 및 신고/문의 통합 관리 (REPORTS 테이블)
 */

// 상태 라벨 정의 (대시보드 노출용)
export const REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: "접수됨",
  PROCESSING: "처리 중",
  RESOLVED: "처리 완료",
};

// 신고/문의 응답 데이터 타입
export interface ReportResponse {
  reportId: number;
  orderId?: number;
  reporterNickname: string;
  targetNickname: string;
  reportType?: string; // 신고 유형 (ACCIDENT, NO_SHOW 등)
  description: string; // 본문 내용
  status: string; // 처리 상태 (PENDING, PROCESSING, RESOLVED)
  createdAt: string;

  // 앱 1:1 문의에서 보낸 추가 필드
  type: "REPORT" | "DISCUSS"; // DISCUSS가 1:1 문의
  email?: string; // 답변 받을 이메일
  title?: string; // 문의 제목
}

// 헬퍼 함수 (라벨 변환용)
export function toReportStatusLabel(status: string): string {
  return REPORT_STATUS_LABELS[status] || status;
}
