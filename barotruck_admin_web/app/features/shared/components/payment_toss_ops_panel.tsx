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

const getActionHighlightClass = (tone: "emerald" | "amber" | "rose" | "blue") => {
  switch (tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "rose":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "blue":
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
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
  const hasMismatch = Boolean(comparison?.mismatch);

  let cancelHelperText = "현재 백엔드 정책상 PAID 상태 + payout item 미생성 건만 실취소할 수 있습니다.";
  if (hasCancelledLookup) {
    cancelHelperText = "이미 Toss 취소 이력이 있는 건입니다.";
  } else if (internalPaymentStatus !== "PAID") {
    cancelHelperText = "내부 결제 상태가 PAID일 때만 실취소 요청을 열어둡니다.";
  } else if (isLookupUnavailable) {
    cancelHelperText =
      "실조회 API 미연결 상태입니다. 취소 요청 자체는 백엔드 연결 여부에 따라 실패할 수 있습니다.";
  }

  const actionGuide = hasMismatch
    ? {
        tone: "rose" as const,
        title: "상태 불일치 감지",
        description:
          comparison?.mismatchReason ||
          "내부 상태와 Toss 실상태가 일치하지 않습니다. 실조회 결과와 내부 원장을 먼저 대조하세요.",
        label: "Mismatch",
      }
    : hasCancelledLookup
      ? {
          tone: "amber" as const,
          title: "취소 이력 존재",
          description:
            "이미 Toss 취소 이력이 잡힌 건입니다. 재취소보다 내부 상태 동기화와 취소 이력 검증을 먼저 확인하세요.",
          label: "취소 이력",
        }
      : internalPaymentStatus === "PAID"
        ? {
            tone: "emerald" as const,
            title: "운영 조치 가능 상태",
            description:
              "내부 결제 상태가 PAID입니다. 실조회 결과와 취소 이력을 확인한 뒤 실취소/환불 요청을 진행할 수 있습니다.",
            label: "조치 가능",
          }
        : {
            tone: "blue" as const,
            title: "모니터링 우선 상태",
            description:
              "아직 실취소 조건이 아닙니다. 결제 확정 여부와 PG 원장 반영 시점을 먼저 확인하세요.",
            label: "모니터링",
          };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div
          className={`rounded-3xl border px-5 py-4 ${getActionHighlightClass(actionGuide.tone)}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-wider opacity-80">
                운영 판단
              </div>
              <div className="mt-2 text-lg font-black">{actionGuide.title}</div>
              <div className="mt-2 text-sm leading-6">{actionGuide.description}</div>
            </div>
            <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold">
              {actionGuide.label}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              실취소 가능 여부
            </div>
            <div className="mt-2 text-lg font-black text-slate-900">
              {cancelDisabled ? "지금은 불가" : "요청 가능"}
            </div>
            <div className="mt-2 text-xs leading-5 text-slate-500">{cancelHelperText}</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              핵심 참조값
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">paymentKey</span>
                <span className="max-w-[60%] truncate font-bold text-slate-900">
                  {gatewayLookup?.paymentKey ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">txId</span>
                <span className="max-w-[60%] truncate font-bold text-slate-900">
                  {gatewayTransaction?.txId ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">청구액</span>
                <span className="font-bold text-slate-900">
                  {formatAmount(getBillingAmount(settlement))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasMismatch ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="font-bold">상태 mismatch 경고</div>
          <div className="mt-1">
            {comparison?.mismatchReason || "내부 상태와 Toss 실상태가 일치하지 않습니다."}
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

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">상태 비교 스냅샷</h3>
            <p className="mt-1 text-xs text-slate-400">
              내부 결제, 내부 Gateway, Toss 실조회 상태를 같은 밀도로 비교합니다.
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  내부 결제 상태
                </div>
                <div className="mt-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                      internalPaymentStatus
                    )}`}
                  >
                    {PAYMENT_STATUS_LABELS[internalPaymentStatus]}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">청구액</div>
                <div className="mt-1 text-lg font-black text-slate-900">
                  {formatAmount(getBillingAmount(settlement))}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">paymentId</span>
                <span className="font-bold text-slate-900">
                  {comparison?.transportPayment?.paymentId ?? settlement.paymentId ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">paidAt</span>
                <span className="font-bold text-slate-900">
                  {formatDateTime(comparison?.transportPayment?.paidAt ?? settlement.paidAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">confirmedAt</span>
                <span className="font-bold text-slate-900">
                  {formatDateTime(
                    comparison?.transportPayment?.confirmedAt ?? settlement.confirmedAt
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">PG/증빙</span>
                <span className="max-w-[60%] truncate font-bold text-slate-900">
                  {comparison?.transportPayment?.pgTid ?? settlement.pgTid ?? "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  내부 Gateway 원장
                </div>
                <div className="mt-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                      gatewayTransaction?.status
                    )}`}
                  >
                    {getGatewayStatusLabel(gatewayTransaction?.status)}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
                {gatewayTransaction?.provider ?? "TOSS"}
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">txId</span>
                <span className="max-w-[60%] truncate font-bold text-slate-900">
                  {gatewayTransaction?.txId ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">amount</span>
                <span className="font-bold text-slate-900">
                  {formatAmount(gatewayTransaction?.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">approvedAt</span>
                <span className="font-bold text-slate-900">
                  {formatDateTime(gatewayTransaction?.approvedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">nextRetryAt</span>
                <span className="font-bold text-slate-900">
                  {formatDateTime(gatewayTransaction?.nextRetryAt)}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                실패 정보 {gatewayTransaction?.failCode || gatewayTransaction?.failMessage || "-"}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Toss 실조회
                </div>
                <div className="mt-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                      gatewayLookup?.status
                    )}`}
                  >
                    {gatewayLookup?.status ?? "조회 대기"}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
                {gatewayLookup?.method ?? "-"}
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">paymentKey</span>
                <span className="max-w-[60%] truncate font-bold text-slate-900">
                  {gatewayLookup?.paymentKey ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">orderId</span>
                <span className="font-bold text-slate-900">{gatewayLookup?.orderId ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">totalAmount</span>
                <span className="font-bold text-slate-900">
                  {formatAmount(gatewayLookup?.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">approvedAt</span>
                <span className="font-bold text-slate-900">
                  {formatDateTime(gatewayLookup?.approvedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">lastTxAt</span>
                <span className="font-bold text-slate-900">
                  {formatDateTime(gatewayLookup?.lastTransactionAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
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
