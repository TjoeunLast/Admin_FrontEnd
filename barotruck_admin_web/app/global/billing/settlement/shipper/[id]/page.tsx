"use client";

import {
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  getEffectivePaymentStatus,
  getEffectiveSettlementStatus,
  getFeeAmount,
  getPayoutAmount,
  isPaymentCompleted,
  PAYMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_LABELS,
} from "@/app/features/shared/lib/admin_settlement_overview";
import { PaymentQuickActions } from "@/app/features/shared/components/payment_quick_actions";
import { PaymentDisputeCreateModal } from "@/app/features/shared/components/payment_dispute_create_modal";
import { PaymentDisputeResolutionPanel } from "@/app/features/shared/components/payment_dispute_resolution_panel";
import { PaymentDebugContextPanel } from "@/app/features/shared/components/payment_debug_context_panel";
import { PaymentTossOpsPanel } from "@/app/features/shared/components/payment_toss_ops_panel";
import { TossPaymentCancelModal } from "@/app/features/shared/components/toss_payment_cancel_modal";

const formatAmount = (value?: number | null) =>
  new Intl.NumberFormat("ko-KR").format(value ?? 0);

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

const requiresTransferProof = (settlement: SettlementResponse) =>
  String(settlement.paymentMethod ?? "").toUpperCase() === "TRANSFER";

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

  const [orderDetail, setOrderDetail] =
    useState<AdminOrderDetailResponse | null>(null);
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
            error instanceof Error
              ? error.message
              : "분쟁 상태를 불러오지 못했습니다.";
          setDisputeStatus(null);
          setDisputeErrorMessage(message);
        }
      }

      if (isDebugMode) {
        try {
          const context =
            await paymentAdminApi.getPaymentApiTestContext(orderId);
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
    [settlement],
  );
  const settlementStatus = useMemo(
    () => (settlement ? getEffectiveSettlementStatus(settlement) : "READY"),
    [settlement],
  );

  const handleMarkPaid = useCallback(async () => {
    if (!settlement) return;
    if (paymentStatus !== "READY") {
      alert("결제 준비 상태에서만 빠른 입금 반영을 사용할 수 있습니다.");
      return;
    }
    let proofUrl = settlement.proofUrl ?? null;
    if (requiresTransferProof(settlement)) {
      const input = window.prompt(
        "계좌이체 결제는 증빙 URL이 필요합니다. URL을 입력하세요.",
        settlement.proofUrl ?? "",
      );
      if (input === null) return;
      proofUrl = input.trim() || null;
      if (!proofUrl) {
        alert("계좌이체 결제는 증빙 URL이 필요합니다.");
        return;
      }
    }
    if (
      !confirm(`주문 #${settlement.orderId} 건을 즉시 입금 반영하시겠습니까?`)
    )
      return;
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
        alert(
          "분쟁 상태 조회 실패 상태에서는 분쟁을 생성할 수 없습니다. 새로고침 후 다시 시도하세요.",
        );
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
    [disputeErrorMessage, loadDetail, orderId, settlement],
  );

  const handleApplyDisputeStatus = useCallback(
    async (status: PaymentDisputeStatus, adminMemo: string | null) => {
      if (!disputeStatus) {
        alert("먼저 분쟁을 생성하세요.");
        return;
      }
      if (!confirm(`분쟁 상태를 ${status}로 변경하시겠습니까?`)) return;
      try {
        setIsMutating(true);
        await paymentAdminApi.updatePaymentDisputeStatus(
          orderId,
          disputeStatus.disputeId,
          {
            status,
            adminMemo,
          },
        );
        await loadDetail();
        alert("분쟁 상태가 변경되었습니다.");
      } catch (error) {
        const message = getErrorMessage(error, "분쟁 상태 변경 중 오류가 발생했습니다.");
        alert(message);
      } finally {
        setIsMutating(false);
      }
    },
    [disputeStatus, loadDetail, orderId],
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
      <main className="max-w-[1600px] mx-auto space-y-6 p-10 font-sans">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 font-bold shadow-sm">
          {errorMessage ?? "상세 정보를 찾을 수 없습니다."}
        </div>
        <button
          onClick={() => router.back()}
          className="bg-[#4E46E5] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 shadow-sm transition-all"
        >
          목록으로 돌아가기
        </button>
      </main>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans p-6 text-slate-900">
      <header className="mb-8 pl-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          주문 #{orderDetail.orderId} 결제/정산 운영
        </h1>
        <button
          onClick={() => router.back()}
          className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
        >
          목록으로 돌아가기
        </button>
      </header>

      {/* 상단 통계 카드 */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 shadow-sm text-white">
          <p className="text-sm font-medium text-slate-400 mb-1">총 청구액</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold">
              ₩{formatAmount(getBillingAmount(settlement))}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">결제 상태</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-emerald-600">
              {PAYMENT_STATUS_LABELS[paymentStatus]}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">정산 상태</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-blue-600">
              {SETTLEMENT_STATUS_LABELS[settlementStatus]}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">
            플랫폼 수수료
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-slate-900">
              ₩{formatAmount(getFeeAmount(settlement))}
            </p>
          </div>
        </div>
      </section>

      {/* 퀵 액션 섹션 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PaymentQuickActions
          settlement={settlement}
          isBusy={isMutating}
          onMarkPaid={() => void handleMarkPaid()}
        />
      </div>

      {/* 주문 정보 섹션\ */}
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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              주문 기본 정보
            </h2>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black border border-slate-200">
              주문 상태 {orderDetail.status}
            </span>
          </div>

          <div className="p-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  운송 구간
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {orderDetail.startPlace || "미지정"} →{" "}
                  {orderDetail.endPlace || "미지정"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {orderDetail.startAddr || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {orderDetail.endAddr || "-"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  화물 정보
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {orderDetail.cargoContent || "정보 없음"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {orderDetail.reqCarType} / {orderDetail.reqTonnage} /{" "}
                  {orderDetail.workType}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  주문 타임라인
                </p>
                <p className="text-xs font-bold text-slate-700">
                  생성: {formatDateTime(orderDetail.createdAt)}
                </p>
                <p className="text-xs text-slate-500 mt-1 italic">
                  상차 예정: {orderDetail.startSchedule || "-"}
                </p>
                <p className="text-xs text-slate-500 italic">
                  하차 예정: {orderDetail.endSchedule || "-"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  결제 메타 정보
                </p>
                <p className="text-xs font-bold text-slate-700">
                  수단:{" "}
                  {settlement.paymentMethod || orderDetail.payMethod || "-"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  시점: {settlement.paymentTiming || "-"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  PG/증빙: {settlement.pgTid || settlement.proofUrl || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 정산/증빙 요약 박스 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              정산/증빙 요약
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="divide-y divide-slate-100">
              <div className="py-3 flex justify-between text-sm">
                <span className="font-medium text-slate-500">정산 ID</span>
                <span className="font-bold text-slate-900">
                  #{settlement.settlementId}
                </span>
              </div>
              <div className="py-3 flex justify-between text-sm">
                <span className="font-medium text-slate-500">화주 정보</span>
                <span className="font-bold text-slate-900 text-right">
                  {settlement.shipperName}
                  <br />
                  <span className="text-xs font-normal text-slate-400">
                    {settlement.bizNumber}
                  </span>
                </span>
              </div>
              <div className="py-3 flex justify-between text-sm">
                <span className="font-medium text-slate-500">차주 정보</span>
                <span className="font-bold text-slate-900 text-right">
                  {settlement.driverName || "-"}
                  <br />
                  <span className="text-xs font-normal text-slate-400">
                    {settlement.bankName || ""} {settlement.accountNum || ""}
                  </span>
                </span>
              </div>
            </div>

            {orderDetail.proofSummary && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  운송 증빙 서류
                </p>
                <div className="text-[11px] font-medium text-slate-600 space-y-1">
                  <p className="truncate">
                    수령인: {orderDetail.proofSummary.recipientName || "-"}
                  </p>
                  <p className="truncate">
                    영수증 URL:{" "}
                    {orderDetail.proofSummary.receiptImageUrl || "-"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 하단 패널들 */}
      <div className="space-y-6">
        <PaymentDisputeResolutionPanel
          dispute={disputeStatus}
          paymentStatus={paymentStatus}
          statusLoadError={disputeErrorMessage}
          isSubmitting={isMutating}
          onOpenCreate={() => setIsDisputeModalOpen(true)}
          onApplyStatus={handleApplyDisputeStatus}
        />

        {isDebugMode && (
          <PaymentDebugContextPanel
            context={debugContext}
            isLoading={isLoading}
          />
        )}
      </div>

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
    <Suspense
      fallback={
        <div className="p-10 text-center text-slate-500 font-medium">
          정산 상세를 불러오는 중입니다...
        </div>
      }
    >
      <ShipperDetailPageContent {...props} />
    </Suspense>
  );
}
