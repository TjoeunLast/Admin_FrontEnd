"use client";

import {
  DriverPayoutItemStatusResponse,
  SettlementResponse,
} from "@/app/features/shared/api/payment_admin_api";
import {
  getEffectiveSettlementStatus,
  SETTLEMENT_STATUS_LABELS,
} from "@/app/features/shared/lib/admin_settlement_overview";

export interface DriverSellerOpsInfo {
  sellerId: string | null;
  sellerRef: string | null;
  sellerStatus: string | null;
}

interface DriverPayoutOpsPanelProps {
  settlement: SettlementResponse;
  payoutItem: DriverPayoutItemStatusResponse | null;
  payoutItemMessage: string | null;
  sellerInfo: DriverSellerOpsInfo | null;
  sellerMessage: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  READY: "지급 준비",
  REQUESTED: "지급 요청",
  COMPLETED: "지급 완료",
  FAILED: "지급 실패",
  RETRYING: "재시도 중",
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

const getPayoutStatusLabel = (status?: string | null) =>
  status ? PAYOUT_STATUS_LABELS[status] ?? status : "데이터 없음";

const getStatusBadgeClass = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "COMPLETED") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (normalized === "FAILED") {
    return "bg-rose-50 text-rose-700";
  }
  if (normalized === "REQUESTED" || normalized === "RETRYING") {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-slate-100 text-slate-600";
};

const getWebhookReflectedAt = (payoutItem: DriverPayoutItemStatusResponse | null) => {
  if (!payoutItem) {
    return {
      value: null,
      sourceLabel: "데이터 없음",
    };
  }

  if (payoutItem.lastWebhookProcessedAt) {
    return {
      value: payoutItem.lastWebhookProcessedAt,
      sourceLabel: "webhook processedAt",
    };
  }

  if (payoutItem.lastWebhookReceivedAt) {
    return {
      value: payoutItem.lastWebhookReceivedAt,
      sourceLabel: "webhook receivedAt",
    };
  }

  if (payoutItem.completedAt) {
    return {
      value: payoutItem.completedAt,
      sourceLabel: "payout completedAt fallback",
    };
  }

  if (payoutItem.requestedAt) {
    return {
      value: payoutItem.requestedAt,
      sourceLabel: "payout requestedAt fallback",
    };
  }

  return {
    value: null,
    sourceLabel: "데이터 없음",
  };
};

export function DriverPayoutOpsPanel({
  settlement,
  payoutItem,
  payoutItemMessage,
  sellerInfo,
  sellerMessage,
  isLoading,
  onRefresh,
}: DriverPayoutOpsPanelProps) {
  const settlementStatus = getEffectiveSettlementStatus(settlement);
  const webhookInfo = getWebhookReflectedAt(payoutItem);
  const sellerStatus = sellerInfo?.sellerStatus ?? payoutItem?.sellerStatus ?? null;
  const sellerId = sellerInfo?.sellerId ?? payoutItem?.sellerId ?? null;
  const sellerRef = sellerInfo?.sellerRef ?? payoutItem?.sellerRef ?? null;
  const payoutStatus = payoutItem?.status ?? null;
  const webhookConflict =
    payoutItem?.webhookStatus &&
    payoutItem.status &&
    payoutItem.webhookStatus !== payoutItem.status;
  const settlementMismatch =
    payoutItem?.status === "COMPLETED" && settlementStatus !== "COMPLETED";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">payout / seller 운영 패널</h3>
          <p className="mt-1 text-sm text-slate-500">
            지급 아이템 상태와 seller 상태, 최근 webhook 반영 시각을 주문 단위로 확인합니다.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
            isLoading
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          {isLoading ? "조회중..." : "운영 패널 새로고침"}
        </button>
      </div>

      {settlementMismatch ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          payout item은 완료인데 내부 정산 상태는{" "}
          {SETTLEMENT_STATUS_LABELS[settlementStatus]}입니다. 운영 확인이 필요합니다.
        </div>
      ) : null}

      {webhookConflict ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          polling 기준 payout 상태와 webhook 기준 상태가 다릅니다. 최신 webhook 원장을 확인하세요.
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            payout item
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                payoutStatus
              )}`}
            >
              {getPayoutStatusLabel(payoutStatus)}
            </span>
            <span className="text-xs text-slate-400">order #{settlement.orderId}</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>itemId {payoutItem?.itemId ?? "-"}</div>
            <div>batchId {payoutItem?.batchId ?? "-"}</div>
            <div>retryCount {payoutItem?.retryCount ?? "-"}</div>
            <div>requestedAt {formatDateTime(payoutItem?.requestedAt)}</div>
            <div>completedAt {formatDateTime(payoutItem?.completedAt)}</div>
            <div>payoutRef {payoutItem?.payoutRef ?? "-"}</div>
          </div>
          {payoutItem?.failureReason ? (
            <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
              실패 사유: {payoutItem.failureReason}
            </div>
          ) : null}
          {payoutItemMessage ? (
            <div className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
              {payoutItemMessage}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            seller 상태
          </div>
          <div className="mt-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                sellerStatus
              )}`}
            >
              {sellerStatus ?? "확인 API 대기"}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>sellerId {sellerId ?? "-"}</div>
            <div>sellerRef {sellerRef ?? "-"}</div>
            <div>차주 {settlement.driverName || `차주(${settlement.driverUserId})`}</div>
            <div>
              계좌 {settlement.bankName || "-"} {settlement.accountNum || ""}
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
            {sellerMessage ??
              "현재 관리자 API에 seller 상태 전용 필드가 없으면 화면에는 연결 대기 상태로 표시됩니다."}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            최근 webhook 반영
          </div>
          <div className="mt-3 text-xl font-black text-slate-900">
            {formatDateTime(webhookInfo.value)}
          </div>
          <div className="mt-2 text-xs text-slate-400">{webhookInfo.sourceLabel}</div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>webhookStatus {payoutItem?.webhookStatus ?? "-"}</div>
            <div>정산 상태 {SETTLEMENT_STATUS_LABELS[settlementStatus]}</div>
            <div>운송 완료일 {formatDateTime(settlement.feeDate)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
