"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchOrderDetail,
  AdminOrderDetailResponse,
} from "@/app/features/shared/api/order_api";
import {
  paymentAdminApi,
  CreatePaymentDisputeRequest,
  PaymentApiTestContextResponse,
  PaymentDisputeStatus,
  PaymentDisputeStatusResponse,
  SettlementResponse,
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

export default function ShipperDetailPage({
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
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeErrorMessage, setDisputeErrorMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "상세 정보를 불러오지 못했습니다.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [isDebugMode, orderId]);

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
      const message =
        error instanceof Error ? error.message : "입금 반영 중 오류가 발생했습니다.";
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
        const message =
          error instanceof Error ? error.message : "분쟁 생성 중 오류가 발생했습니다.";
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
        const message =
          error instanceof Error ? error.message : "분쟁 상태 변경 중 오류가 발생했습니다.";
        alert(message);
      } finally {
        setIsMutating(false);
      }
    },
    [disputeErrorMessage, disputeStatus, loadDetail, orderId]
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

      <PaymentQuickActions
        settlement={settlement}
        isBusy={isMutating}
        onMarkPaid={() => void handleMarkPaid()}
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
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              주문 상태 {orderDetail.status}
            </span>
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
        isSubmitting={isMutating}
        onClose={() => setIsDisputeModalOpen(false)}
        onSubmit={handleCreateDispute}
      />
    </main>
  );
}
