"use client";

import {
  GatewayTransactionStatusResponse,
  SettlementResponse,
  TossPaymentComparisonResponse,
  TransportPaymentStatus,
} from "@/app/features/shared/api/payment_admin_api";
import {
  getBillingAmount,
  getEffectivePaymentStatus,
  PAYMENT_STATUS_LABELS,
} from "@/app/features/shared/lib/admin_settlement_overview";

interface PaymentTossOpsPanelProps {
  settlement: SettlementResponse;
  comparison: TossPaymentComparisonResponse | null;
  fallbackGatewayStatus: GatewayTransactionStatusResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  isLookupUnavailable: boolean;
  isCancelSubmitting: boolean;
  onRefresh: () => void;
  onOpenCancel: () => void;
}

const GATEWAY_STATUS_LABELS: Record<string, string> = {
  PREPARED: "PG 준비",
  CONFIRMED: "PG 승인",
  FAILED: "PG 실패",
  CANCELED: "PG 취소",
};

const formatAmount = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? `₩${new Intl.NumberFormat("ko-KR").format(value)}`
    : "-";

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

const getGatewayStatusLabel = (status?: string | null) =>
  status ? GATEWAY_STATUS_LABELS[status] ?? status : "-";

const getStatusBadgeClass = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized.includes("CANCEL")) {
    return "bg-rose-50 text-rose-700";
  }
  if (normalized === "CONFIRMED" || normalized === "PAID") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (normalized === "FAILED") {
    return "bg-rose-50 text-rose-700";
  }
  if (normalized === "PREPARED" || normalized === "READY") {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-slate-100 text-slate-600";
};

const getInternalPaymentStatus = (
  settlement: SettlementResponse,
  comparison: TossPaymentComparisonResponse | null
): TransportPaymentStatus => {
  const transportStatus = comparison?.transportPayment?.status;
  if (transportStatus) {
    return transportStatus as TransportPaymentStatus;
  }
  return getEffectivePaymentStatus(settlement);
};

export function PaymentTossOpsPanel({
  settlement,
  comparison,
  fallbackGatewayStatus,
  isLoading,
  errorMessage,
  isLookupUnavailable,
  isCancelSubmitting,
  onRefresh,
  onOpenCancel,
}: PaymentTossOpsPanelProps) {
  const gatewayTransaction = comparison?.gatewayTransaction ?? fallbackGatewayStatus;
  const gatewayLookup = comparison?.gatewayLookup;
  const internalPaymentStatus = getInternalPaymentStatus(settlement, comparison);
  const tossLookupStatus = gatewayLookup?.status ?? gatewayTransaction?.status ?? null;
  const hasCancelledLookup =
    String(tossLookupStatus ?? "").toUpperCase().includes("CANCEL") ||
    Boolean(gatewayLookup?.cancels?.length);
  const cancelDisabled =
    isCancelSubmitting || internalPaymentStatus !== "PAID" || hasCancelledLookup;

  let cancelHelperText = "현재 백엔드 정책상 PAID 상태 + payout item 미생성 건만 실취소할 수 있습니다.";
  if (hasCancelledLookup) {
    cancelHelperText = "이미 Toss 취소 이력이 있는 건입니다.";
  } else if (internalPaymentStatus !== "PAID") {
    cancelHelperText = "내부 결제 상태가 PAID일 때만 실취소 요청을 열어둡니다.";
  } else if (isLookupUnavailable) {
    cancelHelperText = "실조회 API 미연결 상태입니다. 취소 요청 자체는 백엔드 연결 여부에 따라 실패할 수 있습니다.";
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">PG 실조회 / 취소 운영</h2>
          <p className="mt-1 text-sm text-slate-500">
            내부 결제 상태와 Toss 실상태를 비교하고, 필요 시 실취소를 요청합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
              isLoading
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {isLoading ? "조회중..." : "실조회 새로고침"}
          </button>
          <button
            onClick={onOpenCancel}
            disabled={cancelDisabled}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              cancelDisabled
                ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                : "border border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
            }`}
          >
            {isCancelSubmitting ? "취소 요청중..." : "실취소 / 환불"}
          </button>
        </div>
      </div>

      {comparison?.mismatch ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="font-bold">상태 mismatch 경고</div>
          <div className="mt-1">
            {comparison.mismatchReason || "내부 상태와 Toss 실상태가 일치하지 않습니다."}
          </div>
        </div>
      ) : null}

      {isLookupUnavailable ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Toss 실조회 API가 아직 연결되지 않아 최신 내부 원장 상태만 일부 표시합니다.
        </div>
      ) : null}

      {errorMessage && !isLookupUnavailable ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            내부 결제 상태
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                internalPaymentStatus
              )}`}
            >
              {PAYMENT_STATUS_LABELS[internalPaymentStatus]}
            </span>
            <span className="text-xs text-slate-400">
              청구액 {formatAmount(getBillingAmount(settlement))}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>paymentId {comparison?.transportPayment?.paymentId ?? settlement.paymentId ?? "-"}</div>
            <div>paidAt {formatDateTime(comparison?.transportPayment?.paidAt ?? settlement.paidAt)}</div>
            <div>
              confirmedAt{" "}
              {formatDateTime(
                comparison?.transportPayment?.confirmedAt ?? settlement.confirmedAt
              )}
            </div>
            <div>PG/증빙 {comparison?.transportPayment?.pgTid ?? settlement.pgTid ?? "-"}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            내부 Gateway 원장
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                gatewayTransaction?.status
              )}`}
            >
              {getGatewayStatusLabel(gatewayTransaction?.status)}
            </span>
            <span className="text-xs text-slate-400">
              txId {gatewayTransaction?.txId ?? "-"}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>provider {gatewayTransaction?.provider ?? "TOSS"}</div>
            <div>amount {formatAmount(gatewayTransaction?.amount)}</div>
            <div>approvedAt {formatDateTime(gatewayTransaction?.approvedAt)}</div>
            <div>nextRetryAt {formatDateTime(gatewayTransaction?.nextRetryAt)}</div>
            <div>
              fail {gatewayTransaction?.failCode || gatewayTransaction?.failMessage || "-"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Toss 실조회
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                gatewayLookup?.status
              )}`}
            >
              {gatewayLookup?.status ?? "조회 대기"}
            </span>
            <span className="text-xs text-slate-400">
              paymentKey {gatewayLookup?.paymentKey ?? "-"}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>orderId {gatewayLookup?.orderId ?? "-"}</div>
            <div>method {gatewayLookup?.method ?? "-"}</div>
            <div>totalAmount {formatAmount(gatewayLookup?.totalAmount)}</div>
            <div>approvedAt {formatDateTime(gatewayLookup?.approvedAt)}</div>
            <div>lastTransactionAt {formatDateTime(gatewayLookup?.lastTransactionAt)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        {cancelHelperText}
      </div>

      {gatewayLookup?.cancels?.length ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-900">Toss 취소 이력</h3>
          <div className="mt-4 space-y-3">
            {gatewayLookup.cancels.map((cancel, index) => (
              <div
                key={`${cancel.transactionKey ?? "cancel"}-${index}`}
                className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"
              >
                <div className="font-bold text-slate-900">
                  {cancel.cancelStatus ?? "취소"} / {formatAmount(cancel.cancelAmount)}
                </div>
                <div className="mt-1">사유 {cancel.cancelReason || "-"}</div>
                <div className="mt-1">시각 {formatDateTime(cancel.canceledAt)}</div>
                <div className="mt-1">transactionKey {cancel.transactionKey || "-"}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {gatewayLookup?.rawPayload ? (
        <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <summary className="cursor-pointer text-sm font-bold text-slate-900">
            Toss raw payload 요약
          </summary>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all text-xs text-slate-600">
            {gatewayLookup.rawPayload}
          </pre>
        </details>
      ) : null}
    </section>
  );
}
