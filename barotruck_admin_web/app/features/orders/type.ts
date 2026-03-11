// 주문 운송 상태
export const ORDER_DRIVING_STATUS_MAP: Record<string, string> = {
  REQUESTED: "배차 대기", // 화주가 주문을 올린 직후
  APPLIED: "승인 대기", // 차주가 지원하여 관리자 승인 기다리는 중
  ALLOCATED: "배차 확정", // 배차가 완료된 상태
  ACCEPTED: "배차 확정", // 서버에 따라 ACCEPTED로 내려오는 경우 대응
  LOADING: "상차 중", // 물건 싣는 중
  IN_TRANSIT: "이동 중", // 목적지로 이동 중
  UNLOADING: "하차 중", // 물건 내리는 중
  COMPLETED: "운송 완료", // 모든 프로세스 종료
  CANCELLED: "주문 취소", // 사용자/시스템 취소
  CANCELLED_BY_ADMIN: "관리자 취소", // 관리자 강제 취소
};

// 배차 기사 정보
export interface AssignedDriverInfoResponse {
  driverId: number;
  driverName: string; // 기사 성함
  phone: string; // 연락처
  carType: string; // 차종 (예: 카고, 윙바디)
  carNumber: string; // 차량번호 (예: 12가 3456)
  assignedAt: string; // 배차 확정 일시
}

// 주문 목록 및 상세 응답 데이터
export interface OrderListResponse {
  // 기본 정보
  orderId: number;
  status: string; // ORDER_DRIVING_STATUS_MAP의 키값
  createdAt: string; // 주문 생성 시간

  // 화주 및 물품 정보
  nickname: string; // 화주 닉네임
  cargoContent: string; // 화물 내용 (예: 가전제품, 가구 등)
  tonnage?: number; // 화물 실제 무게

  // 경로 및 시간
  startPlace: string; // 상차지 주소
  endPlace: string; // 하차지 주소
  distance: number; // 총 이동 거리 (km)
  startSchedule: string; // 상차 예정 시간

  // 차량 요청 정보
  reqCarType: string; // 요청 차종
  reqTonnage: string; // 요청 톤수
  driveMode: string; // 운송 유형 (독차, 혼적 등)
  workType: string; // 작업 유형

  // 운임 및 정산 정보
  totalPrice: number; // 총 결제 금액
  basePrice?: number; // 기본 운임
  laborFee?: number; // 수작업비
  packagingPrice?: number; // 포장비
  insuranceFee?: number; // 보험료

  // 시스템 부가 정보
  aiRecommended: boolean; // AI 추천 오더 여부
}

// 고객지원 및 신고 관리
// 상태 라벨 (PENDING, PROCESSING, RESOLVED)
export const REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: "접수대기",
  PROCESSING: "처리중",
  RESOLVED: "답변완료",
};

export interface ReportResponse {
  reportId: number;
  orderId?: number; // 관련 주문 번호
  reporterNickname: string; // 신고자
  targetNickname: string; // 대상자
  reportType?: string; // 유형 (ACCIDENT: 사고, NO_SHOW: 노쇼 등)
  description: string; // 내용
  status: string; // 처리 상태
  createdAt: string;

  // 1:1 문의 전용 필드
  type: "REPORT" | "DISCUSS"; // REPORT: 신고, DISCUSS: 일반문의
  title?: string; // 문의 제목
  email?: string; // 답변용 이메일
}

// 헬퍼 함수: 상태값 변환
export function toReportStatusLabel(status: string): string {
  return REPORT_STATUS_LABELS[status] || status;
}

export function toOrderStatusLabel(status: string): string {
  return ORDER_DRIVING_STATUS_MAP[status] || status;
}
