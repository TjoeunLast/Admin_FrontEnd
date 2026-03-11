import {
  OrderWorkflowStatus,
  PayoutItemStatus,
  SettlementResponse,
  SettlementWorkflowStatus,
  TransportPaymentStatus,
} from "@/app/features/shared/api/payment_admin_api";

const COMPLETED_SETTLEMENT_STATUSES = new Set(["COMPLETED"]);
const COMPLETED_PAYMENT_STATUSES = new Set([
  "PAID",
  "CONFIRMED",
  "COMPLETED",
  "ADMIN_FORCE_CONFIRMED",
]);
const WAITING_SETTLEMENT_PAYMENT_STATUSES = new Set([
  "DISPUTED",
  "ADMIN_HOLD",
  "ADMIN_REJECTED",
]);
const PAYMENT_STATUSES = new Set<TransportPaymentStatus>([
  "READY",
  "PAID",
  "CONFIRMED",
  "DISPUTED",
  "ADMIN_HOLD",
  "ADMIN_FORCE_CONFIRMED",
  "ADMIN_REJECTED",
  "CANCELLED",
]);
const SETTLEMENT_STATUSES = new Set<SettlementWorkflowStatus>([
  "READY",
  "WAIT",
  "COMPLETED",
]);
const PAYOUT_STATUSES = new Set<PayoutItemStatus>([
  "READY",
  "REQUESTED",
  "COMPLETED",
  "FAILED",
  "RETRYING",
]);
const ORDER_STATUSES = new Set<OrderWorkflowStatus>([
  "REQUESTED",
  "ACCEPTED",
  "LOADING",
  "IN_TRANSIT",
  "UNLOADING",
  "COMPLETED",
  "CANCELLED",
]);

export const PAYMENT_STATUS_LABELS: Record<TransportPaymentStatus, string> = {
  READY: "결제대기",
  PAID: "입금완료",
  CONFIRMED: "확인완료",
  DISPUTED: "이의접수",
  ADMIN_HOLD: "지급보류",
  ADMIN_FORCE_CONFIRMED: "강제확정",
  ADMIN_REJECTED: "관리반려",
  CANCELLED: "결제취소",
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementWorkflowStatus, string> = {
  READY: "지급대기",
  WAIT: "지급보류",
  COMPLETED: "지급완료",
};

export const PAYOUT_STATUS_LABELS: Record<PayoutItemStatus, string> = {
  READY: "지급준비",
  REQUESTED: "지급요청",
  COMPLETED: "지급완료",
  FAILED: "지급실패",
  RETRYING: "재시도중",
};

export const ORDER_STATUS_LABELS: Record<OrderWorkflowStatus, string> = {
  REQUESTED: "접수완료",
  ACCEPTED: "배차완료",
  LOADING: "상차진행",
  IN_TRANSIT: "운송중",
  UNLOADING: "하차진행",
  COMPLETED: "운송완료",
  CANCELLED: "주문취소",
};

export interface AdminSettlementOverview {
  totalBillingAmount: number;
  completedBillingAmount: number;
  pendingBillingAmount: number;
  totalPayoutAmount: number;
  completedPayoutAmount: number;
  pendingPayoutAmount: number;
  totalFeeAmount: number;
  totalCount: number;
  completedPaymentCount: number;
  pendingPaymentCount: number;
  payoutTargetCount: number;
  completedSettlementCount: number;
  pendingSettlementCount: number;
}

export interface AdminSettlementQueueItem {
  key: string;
  title: string;
  amount: number;
  count: number;
  tone: "slate" | "blue" | "amber" | "rose" | "emerald";
}

const EMPTY_OVERVIEW: AdminSettlementOverview = {
  totalBillingAmount: 0,
  completedBillingAmount: 0,
  pendingBillingAmount: 0,
  totalPayoutAmount: 0,
  completedPayoutAmount: 0,
  pendingPayoutAmount: 0,
  totalFeeAmount: 0,
  totalCount: 0,
  completedPaymentCount: 0,
  pendingPaymentCount: 0,
  payoutTargetCount: 0,
  completedSettlementCount: 0,
  pendingSettlementCount: 0,
};

const toAmount = (value?: number | null): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, value);
};

const normalizeStatus = (value?: string | null) => String(value ?? "").trim().toUpperCase();

export const isPaymentCompleted = (settlement: SettlementResponse): boolean => {
  // 데이터가 없다면 false
  if (!settlement) return false;
  
  if (settlement.confirmedAt || settlement.paidAt) {
    return true;
  }

  const paymentStatus = normalizeStatus(settlement.paymentStatus);
  if (paymentStatus) {
    return COMPLETED_PAYMENT_STATUSES.has(paymentStatus);
  }

  return isSettlementCompleted(settlement);
};

export const isSettlementCompleted = (settlement: SettlementResponse): boolean =>
  Boolean(settlement.feeCompleteDate) ||
  COMPLETED_SETTLEMENT_STATUSES.has(normalizeStatus(settlement.status));

export const getEffectivePaymentStatus = (
  settlement: SettlementResponse
): TransportPaymentStatus => {
  const rawStatus = normalizeStatus(settlement.paymentStatus) as TransportPaymentStatus;
  if (PAYMENT_STATUSES.has(rawStatus)) {
    return rawStatus;
  }
  if (settlement.confirmedAt) {
    return "CONFIRMED";
  }
  if (settlement.paidAt) {
    return "PAID";
  }
  if (isSettlementCompleted(settlement)) {
    return "CONFIRMED";
  }
  return "READY";
};

export const getEffectiveSettlementStatus = (
  settlement: SettlementResponse
): SettlementWorkflowStatus => {
  if (isSettlementCompleted(settlement)) {
    return "COMPLETED";
  }

  const paymentStatus = getEffectivePaymentStatus(settlement);
  if (WAITING_SETTLEMENT_PAYMENT_STATUSES.has(paymentStatus)) {
    return "WAIT";
  }
  if (
    paymentStatus === "PAID" ||
    paymentStatus === "CONFIRMED" ||
    paymentStatus === "ADMIN_FORCE_CONFIRMED"
  ) {
    return "READY";
  }

  const rawStatus = normalizeStatus(settlement.status) as SettlementWorkflowStatus;
  if (SETTLEMENT_STATUSES.has(rawStatus)) {
    return rawStatus;
  }
  return "READY";
};

export const getEffectiveOrderStatus = (
  settlement: SettlementResponse
): OrderWorkflowStatus | null => {
  const rawStatus = normalizeStatus(settlement.orderStatus) as OrderWorkflowStatus;
  return ORDER_STATUSES.has(rawStatus) ? rawStatus : null;
};

export const getEffectivePayoutStatus = (
  settlement: SettlementResponse
): PayoutItemStatus | null => {
  const rawStatus = normalizeStatus(settlement.payoutStatus) as PayoutItemStatus;
  if (PAYOUT_STATUSES.has(rawStatus)) {
    return rawStatus;
  }
  if (isSettlementCompleted(settlement)) {
    return "COMPLETED";
  }
  if (isPaymentCompleted(settlement)) {
    return "READY";
  }
  return null;
};

export const hasPaymentTracking = (settlement: SettlementResponse): boolean =>
  Boolean(
    settlement.paymentId ||
      settlement.paymentStatus ||
      settlement.paymentMethod ||
      settlement.paymentTiming ||
      settlement.pgTid ||
      settlement.paidAt ||
      settlement.confirmedAt ||
      settlement.proofUrl ||
      toAmount(settlement.paymentAmount) > 0 ||
      toAmount(settlement.paymentFeeAmount) > 0 ||
      toAmount(settlement.paymentNetAmount) > 0
  );

export const getBillingAmount = (settlement: SettlementResponse): number => {
  const paymentAmount = toAmount(settlement.paymentAmount);
  return paymentAmount > 0 ? paymentAmount : toAmount(settlement.totalPrice);
};

export const getPayoutAmount = (settlement: SettlementResponse): number => {
  const netAmount = toAmount(settlement.paymentNetAmount);
  return netAmount > 0 ? netAmount : toAmount(settlement.totalPrice);
};

export const getFeeAmount = (settlement: SettlementResponse): number => {
  const feeAmount = toAmount(settlement.paymentFeeAmount);
  if (feeAmount > 0) {
    return feeAmount;
  }

  const billingAmount = getBillingAmount(settlement);
  const payoutAmount = getPayoutAmount(settlement);
  if (billingAmount > payoutAmount) {
    return billingAmount - payoutAmount;
  }

  return 0;
};

export const calculateAdminSettlementOverview = (
  settlements: SettlementResponse[]
): AdminSettlementOverview => {
  if (!settlements.length) {
    return EMPTY_OVERVIEW;
  }

  return settlements.reduce<AdminSettlementOverview>((acc, settlement) => {
    const billingAmount = getBillingAmount(settlement);
    const payoutAmount = getPayoutAmount(settlement);
    const feeAmount = getFeeAmount(settlement);
    const paymentDone = isPaymentCompleted(settlement);
    const settlementDone = isSettlementCompleted(settlement);

    acc.totalBillingAmount += billingAmount;
    acc.totalCount += 1;

    if (paymentDone) {
      acc.completedBillingAmount += billingAmount;
      acc.completedPaymentCount += 1;
      acc.totalPayoutAmount += payoutAmount;
      acc.totalFeeAmount += feeAmount;
      acc.payoutTargetCount += 1;
    } else {
      acc.pendingBillingAmount += billingAmount;
      acc.pendingPaymentCount += 1;
    }

    if (paymentDone && settlementDone) {
      acc.completedPayoutAmount += payoutAmount;
      acc.completedSettlementCount += 1;
    } else if (paymentDone) {
      acc.pendingPayoutAmount += payoutAmount;
      acc.pendingSettlementCount += 1;
    }

    return acc;
  }, { ...EMPTY_OVERVIEW });
};

export const calculateAdminSettlementQueues = (
  settlements: SettlementResponse[]
): AdminSettlementQueueItem[] => {
  const summary = {
    paymentReady: { count: 0, amount: 0 },
    driverConfirmWait: { count: 0, amount: 0 },
    settlementReady: { count: 0, amount: 0 },
    payoutRequested: { count: 0, amount: 0 },
    payoutFailed: { count: 0, amount: 0 },
    holdOrDispute: { count: 0, amount: 0 },
  };

  settlements.forEach((settlement) => {
    const billingAmount = getBillingAmount(settlement);
    const payoutAmount = getPayoutAmount(settlement);
    const paymentStatus = getEffectivePaymentStatus(settlement);
    const settlementStatus = getEffectiveSettlementStatus(settlement);
    const payoutStatus = getEffectivePayoutStatus(settlement);

    if (paymentStatus === "READY") {
      summary.paymentReady.count += 1;
      summary.paymentReady.amount += billingAmount;
    }

    if (paymentStatus === "PAID") {
      summary.driverConfirmWait.count += 1;
      summary.driverConfirmWait.amount += billingAmount;
    }

    if (settlementStatus === "READY" && (!payoutStatus || payoutStatus === "READY")) {
      summary.settlementReady.count += 1;
      summary.settlementReady.amount += payoutAmount;
    }

    if (payoutStatus === "REQUESTED" || payoutStatus === "RETRYING") {
      summary.payoutRequested.count += 1;
      summary.payoutRequested.amount += payoutAmount;
    }

    if (payoutStatus === "FAILED") {
      summary.payoutFailed.count += 1;
      summary.payoutFailed.amount += payoutAmount;
    }

    if (
      settlementStatus === "WAIT" ||
      paymentStatus === "DISPUTED" ||
      paymentStatus === "ADMIN_HOLD" ||
      paymentStatus === "ADMIN_REJECTED"
    ) {
      summary.holdOrDispute.count += 1;
      summary.holdOrDispute.amount += billingAmount;
    }
  });

  return [
    {
      key: "paymentReady",
      title: "결제대기",
      amount: summary.paymentReady.amount,
      count: summary.paymentReady.count,
      tone: "slate",
    },
    {
      key: "driverConfirmWait",
      title: "확인대기",
      amount: summary.driverConfirmWait.amount,
      count: summary.driverConfirmWait.count,
      tone: "blue",
    },
    {
      key: "settlementReady",
      title: "지급준비",
      amount: summary.settlementReady.amount,
      count: summary.settlementReady.count,
      tone: "amber",
    },
    {
      key: "payoutRequested",
      title: "지급요청",
      amount: summary.payoutRequested.amount,
      count: summary.payoutRequested.count,
      tone: "blue",
    },
    {
      key: "payoutFailed",
      title: "지급실패",
      amount: summary.payoutFailed.amount,
      count: summary.payoutFailed.count,
      tone: "rose",
    },
    {
      key: "holdOrDispute",
      title: "보류/분쟁",
      amount: summary.holdOrDispute.amount,
      count: summary.holdOrDispute.count,
      tone: "amber",
    },
  ];
};
