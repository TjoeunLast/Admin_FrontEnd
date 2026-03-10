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

interface DriverPayoutMonitorPanelProps {
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

  if (
    normalized === "COMPLETED" ||
    normalized === "ACTIVE" ||
    normalized === "APPROVED"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    normalized === "FAILED" ||
    normalized.includes("REJECT") ||
    normalized.includes("SUSPEND")
  ) {
    return "bg-rose-50 text-rose-700";
  }

  if (
    normalized === "REQUESTED" ||
    normalized === "RETRYING" ||
    normalized === "READY" ||
    normalized.includes("WAIT") ||
    normalized.includes("PENDING")
  ) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
};

const getWebhookReflectedAt = (
  payoutItem: DriverPayoutItemStatusResponse | null
) => {
  if (!payoutItem) {
    return {
      value: null,
      sourceLabel: "데이터 없음",
      usingFallback: false,
    };
  }

  if (payoutItem.lastWebhookProcessedAt) {
    return {
      value: payoutItem.lastWebhookProcessedAt,
      sourceLabel: "webhook processedAt",
      usingFallback: false,
    };
  }

  if (payoutItem.lastWebhookReceivedAt) {
    return {
      value: payoutItem.lastWebhookReceivedAt,
      sourceLabel: "webhook receivedAt",
      usingFallback: false,
    };
  }

  if (payoutItem.completedAt) {
    return {
      value: payoutItem.completedAt,
      sourceLabel: "payout completedAt fallback",
      usingFallback: true,
    };
  }

  if (payoutItem.requestedAt) {
    return {
      value: payoutItem.requestedAt,
      sourceLabel: "payout requestedAt fallback",
      usingFallback: true,
    };
  }

  return {
    value: null,
    sourceLabel: "데이터 없음",
    usingFallback: false,
  };
};

const getLookupFallbackState = (
  payoutItem: DriverPayoutItemStatusResponse | null
) => {
  if (!payoutItem) {
    return {
      badgeText: "대상 없음",
      badgeClassName: "bg-slate-100 text-slate-600",
      helperText: "주문 기준 payout item이 아직 생성되지 않았습니다.",
    };
  }

  if (!payoutItem.payoutRef) {
    return {
      badgeText: "지급 요청 전",
      badgeClassName: "bg-amber-50 text-amber-700",
      helperText: "payoutRef가 생성되면 PG 실조회 대상으로 연결할 수 있습니다.",
    };
  }

  return {
    badgeText: "API 연결 대기",
    badgeClassName: "bg-sky-50 text-sky-700",
    helperText:
      "백엔드 payout 실조회 API가 아직 없어 현재는 payout item 스냅샷과 payoutRef만 표시합니다.",
  };
};

export function DriverPayoutMonitorPanel({
  settlement,
  payoutItem,
  payoutItemMessage,
  sellerInfo,
  sellerMessage,
  isLoading,
  onRefresh,
}: DriverPayoutMonitorPanelProps) {
  const settlementStatus = getEffectiveSettlementStatus(settlement);
  const webhookInfo = getWebhookReflectedAt(payoutItem);
  const sellerStatus = sellerInfo?.sellerStatus ?? payoutItem?.sellerStatus ?? null;
  const sellerId = sellerInfo?.sellerId ?? payoutItem?.sellerId ?? null;
  const sellerRef = sellerInfo?.sellerRef ?? payoutItem?.sellerRef ?? null;
  const payoutStatus = payoutItem?.status ?? null;
  const webhookStatus = payoutItem?.webhookStatus ?? null;
  const webhookConflict =
    Boolean(webhookStatus) &&
    Boolean(payoutStatus) &&
    webhookStatus !== payoutStatus;
  const settlementMismatch =
    payoutItem?.status === "COMPLETED" && settlementStatus !== "COMPLETED";
  const lookupFallback = getLookupFallbackState(payoutItem);

  const warnings = [
    settlementMismatch
      ? {
          key: "settlement-mismatch",
          className: "border-rose-200 bg-rose-50 text-rose-700",
          title: "내부 정산 mismatch",
          description: `payout item은 완료인데 내부 정산 상태는 ${SETTLEMENT_STATUS_LABELS[settlementStatus]}입니다. 운영 확인이 필요합니다.`,
        }
      : null,
    webhookConflict
      ? {
          key: "webhook-conflict",
          className: "border-amber-200 bg-amber-50 text-amber-800",
          title: "polling / webhook 충돌",
          description: `polling 기준 ${getPayoutStatusLabel(
            payoutStatus
          )}, webhook 기준 ${getPayoutStatusLabel(
            webhookStatus
          )}입니다. 최신 webhook 원장을 우선 확인하세요.`,
        }
      : null,
    payoutItem?.status === "FAILED"
      ? {
          key: "payout-failed",
          className: "border-rose-200 bg-rose-50 text-rose-700",
          title: "지급 실패 상태",
          description:
            payoutItem.failureReason ??
            "payout item이 FAILED 상태입니다. 실패 사유와 재시도 여부를 확인하세요.",
        }
      : null,
  ].filter((warning): warning is NonNullable<typeof warning> => Boolean(warning));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">차주 지급 운영 패널</h3>
          <p className="mt-1 text-sm font-medium text-slate-700">
            payout item, seller 상태, 최근 webhook 반영 시각, payout 실조회 연결 상태를 주문 단위로 확인합니다.
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
          {isLoading ? "조회중..." : "운영 상태 새로고침"}
        </button>
      </div>

      {warnings.length ? (
        <div className="mt-4 space-y-3">
          {warnings.map((warning) => (
            <div
              key={warning.key}
              className={`rounded-2xl border px-4 py-3 text-sm ${warning.className}`}
            >
              <div className="font-bold">{warning.title}</div>
              <div className="mt-1">{warning.description}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
            payout item 상태
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                payoutStatus
              )}`}
            >
              {getPayoutStatusLabel(payoutStatus)}
            </span>
            <span className="text-xs font-semibold text-slate-600">order #{settlement.orderId}</span>
          </div>
          <div className="mt-4 space-y-2 text-sm font-medium text-slate-800">
            <div>itemId {payoutItem?.itemId ?? "-"}</div>
            <div>batchId {payoutItem?.batchId ?? "-"}</div>
            <div>retryCount {payoutItem?.retryCount ?? "-"}</div>
            <div>requestedAt {formatDateTime(payoutItem?.requestedAt)}</div>
            <div>completedAt {formatDateTime(payoutItem?.completedAt)}</div>
            <div>payoutRef {payoutItem?.payoutRef ?? "-"}</div>
          </div>
          {payoutItemMessage ? (
            <div className="mt-4 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-700">
              {payoutItemMessage}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
            seller 상태
          </div>
          <div className="mt-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                sellerStatus
              )}`}
            >
              {sellerStatus ?? "연결 대기"}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm font-medium text-slate-800">
            <div>sellerId {sellerId ?? "-"}</div>
            <div>sellerRef {sellerRef ?? "-"}</div>
            <div>차주 {settlement.driverName || `차주(${settlement.driverUserId})`}</div>
            <div>
              계좌 {settlement.bankName || "-"} {settlement.accountNum || ""}
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-700">
            {sellerMessage ?? "seller 상태 전용 필드가 아직 없으면 연결 대기로 표시합니다."}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
            최근 webhook 반영
          </div>
          <div className="mt-3 text-xl font-black text-slate-900">
            {formatDateTime(webhookInfo.value)}
          </div>
          <div className="mt-2 text-xs font-medium text-slate-600">{webhookInfo.sourceLabel}</div>
          <div className="mt-4 space-y-2 text-sm font-medium text-slate-800">
            <div>pollingStatus {payoutStatus ?? "-"}</div>
            <div>webhookStatus {webhookStatus ?? "-"}</div>
            <div>정산 상태 {SETTLEMENT_STATUS_LABELS[settlementStatus]}</div>
          </div>
          <div className="mt-4 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-700">
            {webhookInfo.usingFallback
              ? "webhook 시각 미노출 상태라 payout item 시간으로 대체 표시 중입니다."
              : "webhook 기준 값이 있으면 payout item 시간보다 우선 표시합니다."}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
            payout 실조회
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${lookupFallback.badgeClassName}`}
            >
              {lookupFallback.badgeText}
            </span>
            <span className="text-xs font-semibold text-slate-600">실조회 후보</span>
          </div>
          <div className="mt-4 space-y-2 text-sm font-medium text-slate-800">
            <div>payoutRef {payoutItem?.payoutRef ?? "-"}</div>
            <div>internalStatus {payoutStatus ?? "-"}</div>
            <div>requestedAt {formatDateTime(payoutItem?.requestedAt)}</div>
            <div>completedAt {formatDateTime(payoutItem?.completedAt)}</div>
          </div>
          <div className="mt-4 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-700">
            {lookupFallback.helperText}
          </div>
        </div>
      </div>
    </section>
  );
}
