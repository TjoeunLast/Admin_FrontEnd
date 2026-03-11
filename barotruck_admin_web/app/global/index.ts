/**
 * Route-to-file map for quick navigation in app/global.
 */
export const GLOBAL_ROUTE_FILE_MAP = {
  login: "app/global/login/page.tsx",

  orders: "app/global/orders/page.tsx",
  orderNew: "app/global/orders/new/page.tsx",
  orderDetail: "app/global/orders/detail/page.tsx",

  users: "app/global/users/page.tsx",
  userDetail: "app/global/users/detail/page.tsx",

  statistics: "app/global/statistics/page.tsx",

  billingDriverSettlement: "app/global/billing/settlement/driver/page.tsx",
  billingShipperSettlement: "app/global/billing/settlement/shipper/page.tsx",
  billingShipperSettlementDetail: "app/global/billing/settlement/shipper/detail/page.tsx",

  supportHome: "app/global/support/page.tsx",
  supportNoticeList: "app/global/support/notice.tsx",
  supportNoticeNew: "app/global/support/notice/new/page.tsx",
  supportNoticeDetail: "app/global/support/notice/detail/page.tsx",

  supportInquiryList: "app/global/support/inquiry.tsx",
  supportInquiryDetail: "app/global/support/inquiry/detail/page.tsx",

  supportReportList: "app/global/support/report.tsx",

  supportReviewList: "app/global/support/review.tsx",
  supportReviewDetail: "app/global/support/review/detail/page.tsx",

  personalChatStart: "app/global/chat/personal/page.tsx",
  personalChatRoom: "app/global/chat/room/page.tsx",

  profile: "app/global/profile/page.tsx",
  settings: "app/global/settings/page.tsx",
} as const;
