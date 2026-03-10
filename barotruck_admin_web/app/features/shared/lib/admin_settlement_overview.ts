import {
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

export const PAYMENT_STATUS_LABELS: Record<TransportPaymentStatus, string> = {
  READY: "결제 준비",
  PAID: "결제 완료",
  CONFIRMED: "차주 확인",
  DISPUTED: "이의 제기",
  ADMIN_HOLD: "관리자 보류",
  ADMIN_FORCE_CONFIRMED: "강제 확정",
  ADMIN_REJECTED: "관리자 반려",
  CANCELLED: "결제 취소",
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementWorkflowStatus, string> = {
  READY: "지급 대기",
  WAIT: "지급 보류",
  COMPLETED: "지급 완료",
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
