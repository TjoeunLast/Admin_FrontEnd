/**
 * `app/global` 아래 관리자 페이지 파일 위치 안내용 맵입니다.
 * 팀원이 구조를 빠르게 찾을 때 참고하는 용도입니다.
 * 각 항목 위 주석에 해당 파일이 맡는 화면/기능을 적어둡니다.
 */
export const GLOBAL_ROUTE_FILE_MAP = {
  // 관리자 로그인 진입 페이지
  login: "app/global/login/page.tsx",

  // 주문 전체 목록 페이지
  orders: "app/global/orders/page.tsx",

  // 관리자 주문 등록 페이지
  orderNew: "app/global/orders/new/page.tsx",

  // 주문 상세, 상태 변경, 배차/정산 확인 페이지
  orderDetail: "app/global/orders/[id]/page.tsx",


  // 회원 전체 목록 페이지
  users: "app/global/users/page.tsx",

  // 회원 상세, 상태/권한/정보 확인 페이지
  userDetail: "app/global/users/[userId]/page.tsx",

  // 통계 대시보드 페이지
  statistics: "app/global/statistics/page.tsx",

  // 차주 정산 목록/운영 페이지
  billingDriverSettlement: "app/global/billing/settlement/driver/page.tsx",

  // 화주 정산 목록 페이지
  billingShipperSettlement: "app/global/billing/settlement/shipper/page.tsx",

  // 화주 정산 상세 페이지
  billingShipperSettlementDetail: "app/global/billing/settlement/shipper/[id]/page.tsx",

  // 고객지원 메인 탭 페이지
  supportHome: "app/global/support/page.tsx",

  // 공지사항 목록 탭 컴포넌트
  supportNoticeList: "app/global/support/notice.tsx",

  // 공지사항 신규 작성 페이지
  supportNoticeNew: "app/global/support/notice/new/page.tsx",

  // 공지사항 상세/수정 페이지
  supportNoticeDetail: "app/global/support/notice/[id]/page.tsx",

  // 1:1 문의 목록 탭 컴포넌트
  supportInquiryList: "app/global/support/inquiry.tsx",

  // 1:1 문의 상세 답변 페이지
  supportInquiryDetail: "app/global/support/inquiry/[id]/page.tsx",

  // 신고 목록 탭 컴포넌트
  supportReportList: "app/global/support/report.tsx",

  // 리뷰 목록 탭 컴포넌트
  supportReviewList: "app/global/support/review.tsx",

  // 리뷰 상세 페이지
  supportReviewDetail: "app/global/support/review/[id]/page.tsx",

  // 관리자 내 프로필 페이지
  profile: "app/global/profile/page.tsx",

  // 전역 운영 정책/알림/정산 설정 페이지
  settings: "app/global/settings/page.tsx",
} as const;
