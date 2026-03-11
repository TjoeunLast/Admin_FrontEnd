"use client";

import { Suspense, use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchOrderDetail,
  AdminOrderDetailResponse,
} from "@/app/features/shared/api/order_api";
import {
  GatewayTransactionStatusResponse,
  paymentAdminApi,
  CreatePaymentDisputeRequest,
  PaymentApiTestContextResponse,
  PaymentDisputeStatus,
  PaymentDisputeStatusResponse,
  SettlementResponse,
  TossPaymentComparisonResponse,
} from "@/app/features/shared/api/payment_admin_api";
import {
  getBillingAmount,
  getEffectiveOrderStatus,
  getEffectivePaymentStatus,
  getEffectiveSettlementStatus,
  getFeeAmount,
  getPayoutAmount,
  isPaymentCompleted,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_LABELS,
} from "@/app/features/shared/lib/admin_settlement_overview";
import { PaymentQuickActions } from "@/app/features/shared/components/payment_quick_actions";
import { PaymentDisputeCreateModal } from "@/app/features/shared/components/payment_dispute_create_modal";
import { PaymentDisputeResolutionPanel } from "@/app/features/shared/components/payment_dispute_resolution_panel";
import { PaymentDebugContextPanel } from "@/app/features/shared/components/payment_debug_context_panel";
import { PaymentTossOpsPanel } from "@/app/features/shared/components/payment_toss_ops_panel";
import { TossPaymentCancelModal } from "@/app/features/shared/components/toss_payment_cancel_modal";
import {
  SettlementTimeline,
  type SettlementTimelineItem,
} from "@/app/features/shared/components/settlement_timeline";
import { StatusChip } from "@/app/features/shared/components/status_chip";

const formatAmount = (value?: number | null) =>
  new Intl.NumberFormat("ko-KR").format(value ?? 0);

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

const requiresTransferProof = (settlement: SettlementResponse) =>
  String(settlement.paymentMethod ?? "").toUpperCase() === "TRANSFER";

const getOrderStatusTone = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "COMPLETED") return "emerald" as const;
  if (normalized === "CANCELLED") return "rose" as const;
  if (normalized === "REQUESTED") return "slate" as const;
  return "blue" as const;
};

const getRecommendationToneClass = (tone: "emerald" | "amber" | "rose" | "blue") => {
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

const getHttpStatus = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return null;
  }

  const response = (error as { response?: { status?: number } }).response;
  return typeof response?.status === "number" ? response.status : null;
};

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: { data?: { message?: string } | string };
      }
    ).response;
    const responseData = response?.data;

    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }

    if (
      typeof responseData === "object" &&
      responseData !== null &&
      "message" in responseData &&
      typeof responseData.message === "string" &&
      responseData.message.trim()
    ) {
      return responseData.message;
    }
  }

  return error instanceof Error ? error.message : fallbackMessage;
};

const isMissingDataStatus = (error: unknown) => {
  const status = getHttpStatus(error);
  return status === 400 || status === 404;
};

const isLookupEndpointUnavailable = (error: unknown) => {
  const status = getHttpStatus(error);
  return status === 404 || status === 405 || status === 501;
};

function ShipperDetailPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const orderId = Number(id);
  const isDebugMode = searchParams.get("debug") === "1";

  const [orderDetail, setOrderDetail] = useState<AdminOrderDetailResponse | null>(null);
  const [settlement, setSettlement] = useState<SettlementResponse | null>(null);
  const [disputeStatus, setDisputeStatus] =
    useState<PaymentDisputeStatusResponse | null>(null);
  const [debugContext, setDebugContext] =
    useState<PaymentApiTestContextResponse | null>(null);
  const [tossComparison, setTossComparison] =
    useState<TossPaymentComparisonResponse | null>(null);
  const [fallbackGatewayStatus, setFallbackGatewayStatus] =
    useState<GatewayTransactionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isTossLookupLoading, setIsTossLookupLoading] = useState(false);
  const [isCancelSubmitting, setIsCancelSubmitting] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [disputeErrorMessage, setDisputeErrorMessage] = useState<string | null>(null);
  const [tossLookupErrorMessage, setTossLookupErrorMessage] = useState<string | null>(null);
  const [isTossLookupUnavailable, setIsTossLookupUnavailable] = useState(false);
  const [cancelResultMessage, setCancelResultMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTossComparison = useCallback(async () => {
    try {
      setIsTossLookupLoading(true);
      setTossLookupErrorMessage(null);
      setIsTossLookupUnavailable(false);

      const comparison = await paymentAdminApi.lookupTossPaymentByOrder(orderId);
      setTossComparison(comparison);
      setFallbackGatewayStatus(comparison.gatewayTransaction ?? null);
    } catch (error) {
      setTossComparison(null);

      if (isLookupEndpointUnavailable(error)) {
        setIsTossLookupUnavailable(true);

        try {
          const gatewayStatus = await paymentAdminApi.getTossOrderStatus(orderId);
          setFallbackGatewayStatus(gatewayStatus);
          setTossLookupErrorMessage(null);
        } catch (fallbackError) {
          setFallbackGatewayStatus(null);
          if (isMissingDataStatus(fallbackError)) {
            setTossLookupErrorMessage("연결된 Toss 거래가 없습니다.");
          } else {
            setTossLookupErrorMessage(
              getErrorMessage(fallbackError, "내부 Gateway 상태를 불러오지 못했습니다.")
            );
          }
        }
        return;
      }

      setFallbackGatewayStatus(null);
      if (isMissingDataStatus(error)) {
        setTossLookupErrorMessage("Toss 실조회 대상 거래가 없습니다.");
      } else {
        setTossLookupErrorMessage(
          getErrorMessage(error, "Toss 실조회 결과를 불러오지 못했습니다.")
        );
      }
    } finally {
      setIsTossLookupLoading(false);
    }
  }, [orderId]);

  const loadDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [orderData, settlementData] = await Promise.all([
        fetchOrderDetail(orderId),
        paymentAdminApi.getSettlement(orderId),
      ]);

      setOrderDetail(orderData);
      setSettlement(settlementData);

      try {
        const dispute = await paymentAdminApi.getPaymentDisputeStatus(orderId);
        setDisputeStatus(dispute);
        setDisputeErrorMessage(null);
      } catch (error) {
        if (getHttpStatus(error) === 404) {
          setDisputeStatus(null);
          setDisputeErrorMessage(null);
        } else {
          const message =
            error instanceof Error ? error.message : "분쟁 상태를 불러오지 못했습니다.";
          setDisputeStatus(null);
          setDisputeErrorMessage(message);
        }
      }

      if (isDebugMode) {
        try {
          const context = await paymentAdminApi.getPaymentApiTestContext(orderId);
          setDebugContext(context);
        } catch {
          setDebugContext(null);
        }
      } else {
        setDebugContext(null);
      }

      void loadTossComparison();
    } catch (error) {
      const message = getErrorMessage(error, "상세 정보를 불러오지 못했습니다.");
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [isDebugMode, loadTossComparison, orderId]);

  useEffect(() => {
    if (Number.isNaN(orderId)) {
      setErrorMessage("유효하지 않은 주문 번호입니다.");
      setIsLoading(false);
      return;
    }
    void loadDetail();
  }, [loadDetail, orderId]);

  const paymentStatus = useMemo(
    () => (settlement ? getEffectivePaymentStatus(settlement) : "READY"),
    [settlement]
  );
  const settlementStatus = useMemo(
    () => (settlement ? getEffectiveSettlementStatus(settlement) : "READY"),
    [settlement]
  );
  const orderStatus = useMemo(
    () => (settlement ? getEffectiveOrderStatus(settlement) : null),
    [settlement]
  );
  const recommendation = useMemo(() => {
    if (tossComparison?.mismatch) {
      return {
        tone: "rose" as const,
        title: "PG 비교 결과 불일치",
        description:
          tossComparison.mismatchReason ||
          "내부 결제 상태와 Toss 실조회 상태가 다릅니다. PG 실조회 / 취소 운영 패널에서 먼저 동기화를 검토하세요.",
      };
    }
    if (paymentStatus === "READY") {
      return {
        tone: "blue" as const,
        title: "입금 반영 대기",
        description: "아직 결제가 반영되지 않았습니다. 입금 반영 또는 결제 상태 변경이 먼저 필요합니다.",
      };
    }
    if (paymentStatus === "PAID" && settlementStatus === "READY") {
      return {
        tone: "emerald" as const,
        title: "지급 준비 완료",
        description: "화주 입금이 끝났습니다. 차주 확인 및 지급 요청 단계로 넘길 수 있는 상태입니다.",
      };
    }
    if (paymentStatus === "DISPUTED" || paymentStatus === "ADMIN_HOLD") {
      return {
        tone: "amber" as const,
        title: "분쟁 또는 보류 처리 우선",
        description: "분쟁 상태를 먼저 정리해야 이후 지급 흐름이 꼬이지 않습니다. 분쟁 처리 패널을 확인하세요.",
      };
    }
    return {
      tone: "blue" as const,
      title: "운영 모니터링 상태",
      description: "현재 상태를 유지하며 PG 실조회, 분쟁, 정산 이력을 함께 점검하는 구간입니다.",
    };
  }, [paymentStatus, settlementStatus, tossComparison]);
  const timelineItems = useMemo<SettlementTimelineItem[]>(
    () => [
      {
        key: "order-created",
        title: "주문 생성",
        value: formatDateTime(orderDetail?.createdAt),
        description: `주문 상태 ${orderDetail?.status || "-"}`,
        tone: "blue" as const,
      },
      {
        key: "transport-state",
        title: "운송 상태",
        value: orderStatus ? ORDER_STATUS_LABELS[orderStatus] : orderDetail?.status || "-",
        description: `${orderDetail?.startPlace || "-"} → ${orderDetail?.endPlace || "-"}`,
        tone: orderStatus === "COMPLETED" ? "emerald" : "blue",
      },
      {
        key: "payment-paid",
        title: "결제 승인",
        value: formatDateTime(settlement?.paidAt),
        description: `현재 결제 상태 ${PAYMENT_STATUS_LABELS[paymentStatus]}`,
        tone: isPaymentCompleted(settlement as SettlementResponse) ? "emerald" : "slate",
      },
      {
        key: "driver-confirmed",
        title: "차주 확인",
        value: formatDateTime(settlement?.confirmedAt),
        description: "차주 확인 시점이 없으면 결제만 완료된 상태입니다.",
        tone: settlement?.confirmedAt ? "emerald" : "amber",
      },
      {
        key: "settlement-complete",
        title: "정산 완료",
        value: formatDateTime(settlement?.feeCompleteDate),
        description: `현재 정산 상태 ${SETTLEMENT_STATUS_LABELS[settlementStatus]}`,
        tone: settlementStatus === "COMPLETED" ? "emerald" : settlementStatus === "WAIT" ? "amber" : "slate",
      },
      {
        key: "payout-status",
        title: "차주 지급",
        value: settlement?.payoutCompletedAt
          ? formatDateTime(settlement.payoutCompletedAt)
          : settlement?.payoutRequestedAt
            ? `요청 ${formatDateTime(settlement.payoutRequestedAt)}`
            : "지급 대기",
        description: settlement?.payoutFailureReason || settlement?.payoutRef || "지급 원장이 아직 생성되지 않았습니다.",
        tone: settlement?.payoutCompletedAt
          ? "emerald"
          : settlement?.payoutFailureReason
            ? "rose"
            : settlement?.payoutRequestedAt
              ? "blue"
              : "slate",
      },
    ],
    [orderDetail, orderStatus, paymentStatus, settlement, settlementStatus]
  );

  const handleMarkPaid = useCallback(async () => {
    if (!settlement) {
      return;
    }
    if (paymentStatus !== "READY") {
      alert("결제 준비 상태에서만 빠른 입금 반영을 사용할 수 있습니다.");
      return;
    }

    let proofUrl = settlement.proofUrl ?? null;
    if (requiresTransferProof(settlement)) {
      const input = window.prompt(
        "계좌이체 결제는 증빙 URL이 필요합니다. URL을 입력하세요.",
        settlement.proofUrl ?? ""
      );
      if (input === null) {
        return;
      }
      proofUrl = input.trim() || null;
      if (!proofUrl) {
        alert("계좌이체 결제는 증빙 URL이 필요합니다.");
        return;
      }
    }

    if (!confirm(`주문 #${settlement.orderId} 건을 즉시 입금 반영하시겠습니까?`)) {
      return;
    }

    try {
      setIsMutating(true);
      await paymentAdminApi.markPaymentPaid(settlement.orderId, {
        method: settlement.paymentMethod ?? undefined,
        paymentTiming: settlement.paymentTiming ?? undefined,
        proofUrl,
        paidAt: new Date().toISOString(),
      });
      await loadDetail();
      alert("입금 반영이 완료되었습니다.");
    } catch (error) {
      const message = getErrorMessage(error, "입금 반영 중 오류가 발생했습니다.");
      alert(message);
    } finally {
      setIsMutating(false);
    }
  }, [loadDetail, paymentStatus, settlement]);

  const handleCreateDispute = useCallback(
    async (payload: CreatePaymentDisputeRequest) => {
      if (disputeErrorMessage) {
        alert("분쟁 상태 조회 실패 상태에서는 분쟁을 생성할 수 없습니다. 새로고침 후 다시 시도하세요.");
        return;
      }

      if (!settlement?.driverUserId) {
        alert("분쟁 생성에 필요한 차주 정보가 없습니다.");
        return;
      }

      try {
        setIsMutating(true);
        await paymentAdminApi.createPaymentDispute(orderId, {
          ...payload,
          requesterUserId: settlement.driverUserId,
        });
        setIsDisputeModalOpen(false);
        await loadDetail();
        alert("분쟁이 생성되었습니다.");
      } catch (error) {
        const message = getErrorMessage(error, "분쟁 생성 중 오류가 발생했습니다.");
        alert(message);
      } finally {
        setIsMutating(false);
      }
    },
    [disputeErrorMessage, loadDetail, orderId, settlement]
  );

  const handleApplyDisputeStatus = useCallback(
    async (status: PaymentDisputeStatus, adminMemo: string | null) => {
      if (!disputeStatus) {
        alert("먼저 분쟁을 생성하세요.");
        return;
      }
      if (disputeErrorMessage) {
        alert("분쟁 상태 조회 실패 상태에서는 분쟁 처리를 진행할 수 없습니다. 새로고침 후 다시 시도하세요.");
        return;
      }

      if (!confirm(`분쟁 상태를 ${status}로 변경하시겠습니까?`)) {
        return;
      }

      try {
        setIsMutating(true);
        await paymentAdminApi.updatePaymentDisputeStatus(orderId, disputeStatus.disputeId, {
          status,
          adminMemo,
        });
        await loadDetail();
        alert("분쟁 상태가 변경되었습니다.");
      } catch (error) {
        const message = getErrorMessage(error, "분쟁 상태 변경 중 오류가 발생했습니다.");
        alert(message);
      } finally {
        setIsMutating(false);
      }
    },
    [disputeErrorMessage, disputeStatus, loadDetail, orderId]
  );

  const handleSubmitCancel = useCallback(
    async (cancelReason: string) => {
      if (!settlement) {
        return;
      }

      if (
        !confirm(
          `주문 #${settlement.orderId} 건을 Toss 실취소하시겠습니까?\n전액 취소만 지원하며, 내부 상태보다 PG 호출이 먼저 실패할 수 있습니다.`
        )
      ) {
        return;
      }

      try {
        setIsCancelSubmitting(true);
        setCancelResultMessage(null);
        await paymentAdminApi.cancelTossOrderPayment(orderId, {
          cancelReason,
        });
        setIsCancelModalOpen(false);
        setCancelResultMessage({
          type: "success",
          text: "Toss 실취소 요청이 완료되었습니다. 최신 상태를 다시 조회했습니다.",
        });
        await loadDetail();
      } catch (error) {
        const status = getHttpStatus(error);
        const message =
          status === 404
            ? "실취소 API가 아직 백엔드에 연결되지 않았습니다."
            : getErrorMessage(error, "실취소 요청 중 오류가 발생했습니다.");
        setCancelResultMessage({
          type: "error",
          text: message,
        });
      } finally {
        setIsCancelSubmitting(false);
      }
    },
    [loadDetail, orderId, settlement]
  );

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">정산 상세 정보를 불러오는 중...</div>;
  }

  if (errorMessage || !orderDetail || !settlement) {
    return (
      <main className="space-y-6 p-8">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {errorMessage ?? "상세 정보를 찾을 수 없습니다."}
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
        >
          목록으로 돌아가기
        </button>
      </main>
    );
  }

  return (
    <main className="space-y-8 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Shipper Settlement Detail
          </div>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            주문 #{orderDetail.orderId} 결제/정산 운영
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            주문 기본 정보, 결제 상태, 분쟁 처리 흐름을 한 화면에서 관리합니다.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          목록으로 돌아가기
        </button>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <div className="text-sm font-medium text-slate-300">총 청구액</div>
          <div className="mt-2 text-3xl font-black">₩{formatAmount(getBillingAmount(settlement))}</div>
          <div className="mt-3 text-xs text-slate-400">주문 기준 청구/결제 스냅샷</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">결제 상태</div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {PAYMENT_STATUS_LABELS[paymentStatus]}
          </div>
          <div className="mt-3 text-xs text-slate-400">
            결제 완료 여부: {isPaymentCompleted(settlement) ? "완료" : "대기"}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">정산 상태</div>
          <div className="mt-2 text-2xl font-black text-blue-600">
            {SETTLEMENT_STATUS_LABELS[settlementStatus]}
          </div>
          <div className="mt-3 text-xs text-slate-400">
            정산 완료 시각: {formatDateTime(settlement.feeCompleteDate)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">플랫폼 수수료</div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ₩{formatAmount(getFeeAmount(settlement))}
          </div>
          <div className="mt-3 text-xs text-slate-400">
            차주 지급액: ₩{formatAmount(getPayoutAmount(settlement))}
          </div>
        </div>
      </section>

      <section
        className={`rounded-3xl border px-5 py-4 ${getRecommendationToneClass(
          recommendation.tone
        )}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-wider opacity-80">다음 액션 추천</div>
            <div className="mt-2 text-lg font-black">{recommendation.title}</div>
            <div className="mt-2 text-sm leading-6">{recommendation.description}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {orderStatus ? (
              <StatusChip
                label={ORDER_STATUS_LABELS[orderStatus]}
                tone={getOrderStatusTone(orderStatus)}
                minWidthClassName="min-w-[84px]"
              />
            ) : null}
            <StatusChip
              label={PAYMENT_STATUS_LABELS[paymentStatus]}
              tone={paymentStatus === "READY" ? "slate" : paymentStatus === "DISPUTED" || paymentStatus === "ADMIN_HOLD" ? "amber" : "emerald"}
              minWidthClassName="min-w-[84px]"
            />
            <StatusChip
              label={SETTLEMENT_STATUS_LABELS[settlementStatus]}
              tone={settlementStatus === "COMPLETED" ? "emerald" : settlementStatus === "WAIT" ? "amber" : "slate"}
              minWidthClassName="min-w-[84px]"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SettlementTimeline items={timelineItems} />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">운영 체크 포인트</h2>
          <p className="mt-1 text-sm text-slate-500">
            PG 실조회, 분쟁 처리, 정산/지급 단계에서 바로 확인해야 할 참조값입니다.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">결제 원장</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>paymentId {settlement.paymentId ?? "-"}</div>
                <div>pgTid {settlement.pgTid ?? "-"}</div>
                <div>proofUrl {settlement.proofUrl ?? "-"}</div>
                <div>입금 완료 {formatDateTime(settlement.paidAt)}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">정산 / 지급</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>정산 ID #{settlement.settlementId}</div>
                <div>지급 참조 {settlement.payoutRef ?? "-"}</div>
                <div>지급 요청 {formatDateTime(settlement.payoutRequestedAt)}</div>
                <div>지급 완료 {formatDateTime(settlement.payoutCompletedAt)}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">화주 / 차주</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>화주 {settlement.shipperName}</div>
                <div>차주 {settlement.driverName || "-"}</div>
                <div>사업자번호 {settlement.bizNumber}</div>
                <div>계좌 {settlement.bankName || "-"} {settlement.accountNum || ""}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">예외 신호</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>PG mismatch {tossComparison?.mismatch ? "있음" : "없음"}</div>
                <div>분쟁 상태 {disputeStatus?.status ?? "없음"}</div>
                <div>지급 실패 사유 {settlement.payoutFailureReason || "-"}</div>
                <div>최근 오류 {tossLookupErrorMessage || disputeErrorMessage || "-"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PaymentQuickActions
        settlement={settlement}
        isBusy={isMutating || isCancelSubmitting}
        onMarkPaid={() => void handleMarkPaid()}
      />

      {cancelResultMessage ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            cancelResultMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {cancelResultMessage.text}
        </div>
      ) : null}

      <PaymentTossOpsPanel
        settlement={settlement}
        comparison={tossComparison}
        fallbackGatewayStatus={fallbackGatewayStatus}
        isLoading={isTossLookupLoading}
        errorMessage={tossLookupErrorMessage}
        isLookupUnavailable={isTossLookupUnavailable}
        isCancelSubmitting={isCancelSubmitting}
        onRefresh={() => void loadTossComparison()}
        onOpenCancel={() => {
          setCancelResultMessage(null);
          setIsCancelModalOpen(true);
        }}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">주문 기본 정보</h2>
              <p className="mt-1 text-sm text-slate-500">
                주문 상세 API와 정산 API를 조합해 표시합니다.
              </p>
            </div>
            {orderStatus ? (
              <StatusChip
                label={ORDER_STATUS_LABELS[orderStatus]}
                tone={getOrderStatusTone(orderStatus)}
                minWidthClassName="min-w-[88px]"
              />
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                주문 상태 {orderDetail.status}
              </span>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                운송 구간
              </div>
              <div className="mt-2 text-base font-black text-slate-900">
                {orderDetail.startPlace || "미지정"} → {orderDetail.endPlace || "미지정"}
              </div>
              <div className="mt-3 text-sm text-slate-500">
                {orderDetail.startAddr || "-"} / {orderDetail.endAddr || "-"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                화물 정보
              </div>
              <div className="mt-2 text-base font-black text-slate-900">
                {orderDetail.cargoContent || "정보 없음"}
              </div>
              <div className="mt-3 text-sm text-slate-500">
                {orderDetail.reqCarType || "-"} / {orderDetail.reqTonnage || "-"} /{" "}
                {orderDetail.workType || "-"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                주문 타임라인
              </div>
              <div className="mt-2 text-sm font-bold text-slate-900">
                생성 {formatDateTime(orderDetail.createdAt)}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                상차 예정 {orderDetail.startSchedule || "-"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                하차 예정 {orderDetail.endSchedule || "-"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                결제 메타 정보
              </div>
              <div className="mt-2 text-sm font-bold text-slate-900">
                결제 수단 {settlement.paymentMethod || orderDetail.payMethod || "-"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                결제 시점 {settlement.paymentTiming || "-"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                PG/증빙 {settlement.pgTid || settlement.proofUrl || "-"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">정산/증빙 요약</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                정산 정보
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>정산 ID #{settlement.settlementId}</div>
                <div>정산 생성 {formatDateTime(settlement.feeDate)}</div>
                <div>입금 완료 {formatDateTime(settlement.paidAt)}</div>
                <div>차주 확인 {formatDateTime(settlement.confirmedAt)}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                화주/차주
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>화주 {settlement.shipperName}</div>
                <div>사업자번호 {settlement.bizNumber}</div>
                <div>차주 {settlement.driverName || "-"}</div>
                <div>
                  계좌 {settlement.bankName || "-"} {settlement.accountNum || ""}
                </div>
              </div>
            </div>
            {orderDetail.proofSummary ? (
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  운송 증빙
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div>수령인 {orderDetail.proofSummary.recipientName || "-"}</div>
                  <div>영수증 {orderDetail.proofSummary.receiptImageUrl || "-"}</div>
                  <div>서명 {orderDetail.proofSummary.signatureImageUrl || "-"}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <PaymentDisputeResolutionPanel
        dispute={disputeStatus}
        paymentStatus={paymentStatus}
        statusLoadError={disputeErrorMessage}
        isSubmitting={isMutating}
        onOpenCreate={() => setIsDisputeModalOpen(true)}
        onApplyStatus={handleApplyDisputeStatus}
      />

      {isDebugMode ? (
        <PaymentDebugContextPanel
          context={debugContext}
          isLoading={isLoading}
        />
      ) : null}

      <PaymentDisputeCreateModal
        key={`${orderId}-${isDisputeModalOpen ? "open" : "closed"}`}
        isOpen={isDisputeModalOpen}
        isSubmitting={isMutating || isCancelSubmitting}
        onClose={() => setIsDisputeModalOpen(false)}
        onSubmit={handleCreateDispute}
      />

      <TossPaymentCancelModal
        key={`${orderId}-${isCancelModalOpen ? "cancel-open" : "cancel-closed"}`}
        isOpen={isCancelModalOpen}
        isSubmitting={isCancelSubmitting}
        billingAmount={getBillingAmount(settlement)}
        onClose={() => setIsCancelModalOpen(false)}
        onSubmit={handleSubmitCancel}
      />
    </main>
  );
}

export default function ShipperDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">정산 상세를 불러오는 중...</div>}>
      <ShipperDetailPageContent {...props} />
    </Suspense>
  );
}
