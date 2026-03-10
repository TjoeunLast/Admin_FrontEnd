"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DriverPayoutItemStatusResponse,
  paymentAdminApi,
  SettlementResponse,
  SettlementWorkflowStatus,
} from "@/app/features/shared/api/payment_admin_api";
import { getUserDetail } from "@/app/features/shared/api/user_api";
import {
  calculateAdminSettlementOverview,
  calculateAdminSettlementQueues,
  getEffectiveOrderStatus,
  getEffectivePaymentStatus,
  getEffectivePayoutStatus,
  getEffectiveSettlementStatus,
  getPayoutAmount,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYOUT_STATUS_LABELS,
  SETTLEMENT_STATUS_LABELS,
  isPaymentCompleted,
  isSettlementCompleted,
} from "@/app/features/shared/lib/admin_settlement_overview";
import {
  DriverPayoutMonitorPanel,
  DriverSellerOpsInfo,
} from "./driver_payout_monitor_panel";
import { SettlementQueueCards } from "@/app/features/shared/components/settlement_queue_cards";
import { SettlementOpsFilterBar } from "@/app/features/shared/components/settlement_ops_filter_bar";
import { StatusChip } from "@/app/features/shared/components/status_chip";

const ITEMS_PER_PAGE = 20;
const SETTLEMENT_STATUS_OPTIONS: SettlementWorkflowStatus[] = [
  "READY",
  "WAIT",
  "COMPLETED",
];
const STATUS_FILTER_OPTIONS = ["전체 정산", "지급대기", "지급보류", "지급완료"];
const PAYMENT_FILTER_OPTIONS = [
  "전체 결제",
  "결제대기",
  "입금완료",
  "확인완료",
  "이의접수",
  "지급보류",
  "강제확정",
  "관리반려",
  "결제취소",
  "추적없음",
];
const PAYOUT_FILTER_OPTIONS = [
  "전체 지급",
  "지급준비",
  "지급요청",
  "지급완료",
  "지급실패",
  "재시도중",
  "미생성",
];
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: "카드",
  CASH: "현금",
  TRANSFER: "이체",
  BANK_TRANSFER: "이체",
};
const PAYMENT_TIMING_LABELS: Record<string, string> = {
  PREPAID: "선결제",
  POSTPAID: "후결제",
};

interface DriverPayoutOpsState {
  isLoading: boolean;
  payoutItem: DriverPayoutItemStatusResponse | null;
  payoutItemMessage: string | null;
  sellerInfo: DriverSellerOpsInfo | null;
  sellerMessage: string | null;
}

const formatAmount = (value: number) => `₩${new Intl.NumberFormat("ko-KR").format(value || 0)}`;
const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";
const getPaymentMethodLabel = (value?: string | null) =>
  PAYMENT_METHOD_LABELS[String(value ?? "").trim().toUpperCase()] ?? value ?? "-";
const getPaymentTimingLabel = (value?: string | null) =>
  PAYMENT_TIMING_LABELS[String(value ?? "").trim().toUpperCase()] ?? value ?? "-";
const getLastSyncedAt = (settlement: SettlementResponse) =>
  settlement.payoutCompletedAt ??
  settlement.payoutRequestedAt ??
  settlement.feeCompleteDate ??
  settlement.confirmedAt ??
  settlement.paidAt ??
  settlement.feeDate;

const getOrderStatusTone = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "COMPLETED") return "emerald" as const;
  if (normalized === "CANCELLED") return "rose" as const;
  if (normalized === "REQUESTED") return "slate" as const;
  return "blue" as const;
};

const getPaymentStatusTone = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "PAID" || normalized === "CONFIRMED" || normalized === "ADMIN_FORCE_CONFIRMED") {
    return "emerald" as const;
  }
  if (normalized === "DISPUTED" || normalized === "ADMIN_HOLD") return "amber" as const;
  if (normalized === "ADMIN_REJECTED" || normalized === "CANCELLED") return "rose" as const;
  return "slate" as const;
};

const getSettlementStatusTone = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "COMPLETED") return "emerald" as const;
  if (normalized === "WAIT") return "amber" as const;
  return "slate" as const;
};

const getPayoutStatusTone = (status?: string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "COMPLETED") return "emerald" as const;
  if (normalized === "FAILED") return "rose" as const;
  if (normalized === "REQUESTED" || normalized === "RETRYING") return "blue" as const;
  if (normalized === "READY") return "amber" as const;
  return "slate" as const;
};

const getHttpStatus = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null || !("response" in error)) return null;
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
    if (typeof responseData === "string" && responseData.trim()) return responseData;
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

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const readStringValue = (source: Record<string, unknown> | null, ...keys: string[]) => {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
};

const extractSellerInfo = (payload: unknown): DriverSellerOpsInfo | null => {
  const root = toRecord(payload);
  const data = toRecord(root?.data);
  const driver = toRecord(root?.driver);
  const dataDriver = toRecord(data?.driver);
  const sellerId =
    readStringValue(root, "tossPayoutSellerId", "sellerId") ??
    readStringValue(data, "tossPayoutSellerId", "sellerId") ??
    readStringValue(driver, "tossPayoutSellerId", "sellerId") ??
    readStringValue(dataDriver, "tossPayoutSellerId", "sellerId");
  const sellerRef =
    readStringValue(root, "tossPayoutSellerRef", "sellerRef") ??
    readStringValue(data, "tossPayoutSellerRef", "sellerRef") ??
    readStringValue(driver, "tossPayoutSellerRef", "sellerRef") ??
    readStringValue(dataDriver, "tossPayoutSellerRef", "sellerRef");
  const sellerStatus =
    readStringValue(root, "tossPayoutSellerStatus", "sellerStatus") ??
    readStringValue(data, "tossPayoutSellerStatus", "sellerStatus") ??
    readStringValue(driver, "tossPayoutSellerStatus", "sellerStatus") ??
    readStringValue(dataDriver, "tossPayoutSellerStatus", "sellerStatus");
  if (!sellerId && !sellerRef && !sellerStatus) return null;
  return { sellerId, sellerRef, sellerStatus };
};

export default function DriverSettlementPage() {
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체 정산");
  const [paymentFilter, setPaymentFilter] = useState("전체 결제");
  const [payoutFilter, setPayoutFilter] = useState("전체 지급");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaymentColumns, setShowPaymentColumns] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [selectedSettlementStatusByOrder, setSelectedSettlementStatusByOrder] =
    useState<Record<number, SettlementWorkflowStatus>>({});
  const [opsPanelByOrder, setOpsPanelByOrder] = useState<Record<number, DriverPayoutOpsState>>({});

  const loadSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      setSettlements(await paymentAdminApi.getSettlements());
    } catch (error) {
      console.error("정산 데이터 로드 실패:", getErrorMessage(error, "알 수 없는 오류"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDriverOpsPanel = useCallback(async (settlement: SettlementResponse) => {
    const orderId = settlement.orderId;
    setOpsPanelByOrder((prev) => ({
      ...prev,
      [orderId]: {
        isLoading: true,
        payoutItem: prev[orderId]?.payoutItem ?? null,
        payoutItemMessage: null,
        sellerInfo: prev[orderId]?.sellerInfo ?? null,
        sellerMessage: null,
      },
    }));

    const payoutTask = paymentAdminApi
      .getPayoutItemStatus(orderId)
      .then((value) => ({ ok: true as const, value }))
      .catch((error) => ({ ok: false as const, error }));
    const sellerTask = settlement.driverUserId
      ? getUserDetail(settlement.driverUserId)
          .then((value) => ({ ok: true as const, value }))
          .catch((error) => ({ ok: false as const, error }))
      : Promise.resolve({ ok: true as const, value: null });

    const [payoutResult, sellerResult] = await Promise.all([payoutTask, sellerTask]);
    let payoutItem: DriverPayoutItemStatusResponse | null = null;
    let payoutItemMessage: string | null = null;
    let sellerInfo: DriverSellerOpsInfo | null = null;
    let sellerMessage: string | null = null;

    if (payoutResult.ok) payoutItem = payoutResult.value;
    else if (isMissingDataStatus(payoutResult.error)) payoutItemMessage = "payout item이 아직 생성되지 않았습니다.";
    else payoutItemMessage = getErrorMessage(payoutResult.error, "지급 원장을 불러오지 못했습니다.");

    if (sellerResult.ok) {
      sellerInfo = extractSellerInfo(sellerResult.value);
      if (!sellerInfo) sellerMessage = "seller 상태 전용 필드가 아직 없어 차주 기본 정보만 표시합니다.";
    } else if (isMissingDataStatus(sellerResult.error)) {
      sellerMessage = "차주 상세 정보를 찾지 못했습니다.";
    } else {
      sellerMessage = getErrorMessage(sellerResult.error, "차주 상세 정보를 불러오지 못했습니다.");
    }

    setOpsPanelByOrder((prev) => ({
      ...prev,
      [orderId]: { isLoading: false, payoutItem, payoutItemMessage, sellerInfo, sellerMessage },
    }));
  }, []);

  useEffect(() => {
    void loadSettlements();
  }, [loadSettlements]);

  const overview = useMemo(() => calculateAdminSettlementOverview(settlements), [settlements]);
  const queueItems = useMemo(() => calculateAdminSettlementQueues(settlements), [settlements]);
  const cards = useMemo(
    () => [
      { title: "차주 지급 대기액", amount: overview.pendingPayoutAmount, meta: `대기 ${overview.pendingSettlementCount}건`, tone: "text-amber-600" },
      { title: "차주 지급 완료액", amount: overview.completedPayoutAmount, meta: `완료 ${overview.completedSettlementCount}건`, tone: "text-emerald-600" },
      { title: "지급 대상 건수", amount: overview.payoutTargetCount, meta: `입금 완료 ${overview.completedPaymentCount}건 기준`, tone: "text-slate-900", countCard: true },
      { title: "플랫폼 수수료 수익", amount: overview.totalFeeAmount, meta: "입금 완료 기준", tone: "text-blue-600" },
    ],
    [overview]
  );

  const filteredSettlements = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return settlements.filter((settlement) => {
      const paymentStatus = getEffectivePaymentStatus(settlement);
      const settlementStatus = getEffectiveSettlementStatus(settlement);
      const payoutStatus = getEffectivePayoutStatus(settlement);
      const orderStatus = getEffectiveOrderStatus(settlement);
      const matchesSearch =
        !term ||
        String(settlement.orderId).includes(term) ||
        settlement.driverName?.toLowerCase().includes(term) ||
        settlement.shipperName?.toLowerCase().includes(term) ||
        settlement.accountNum?.toLowerCase().includes(term) ||
        settlement.bankName?.toLowerCase().includes(term);
      const matchesSettlement =
        statusFilter === "전체 정산" ||
        SETTLEMENT_STATUS_LABELS[settlementStatus] === statusFilter;
      const matchesPayment =
        paymentFilter === "전체 결제" ||
        (paymentFilter === "추적없음"
          ? !settlement.paymentStatus && !settlement.paymentMethod && !settlement.pgTid
          : PAYMENT_STATUS_LABELS[paymentStatus] === paymentFilter);
      const matchesPayout =
        payoutFilter === "전체 지급" ||
        (payoutFilter === "미생성"
          ? !payoutStatus
          : payoutStatus && PAYOUT_STATUS_LABELS[payoutStatus] === payoutFilter);
      return matchesSearch && matchesSettlement && matchesPayment && matchesPayout && Boolean(orderStatus || true);
    });
  }, [paymentFilter, payoutFilter, searchTerm, settlements, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredSettlements.length, paymentFilter, payoutFilter, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSettlements.length / ITEMS_PER_PAGE));
  const paginatedSettlements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSettlements.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredSettlements]);

  const handleApplySettlementStatus = useCallback(async (settlement: SettlementResponse) => {
    const currentStatus = getEffectiveSettlementStatus(settlement);
    const nextStatus = selectedSettlementStatusByOrder[settlement.orderId] ?? currentStatus;
    if (currentStatus === nextStatus) {
      alert("변경할 정산 상태를 선택하세요.");
      return;
    }
    const adminMemo =
      nextStatus === "WAIT"
        ? window.prompt("지급 보류 사유를 입력하세요.", "")?.trim() ?? null
        : null;
    if (nextStatus === "WAIT" && adminMemo === "") return;
    if (!confirm(`주문 #${settlement.orderId} 정산 상태를 ${SETTLEMENT_STATUS_LABELS[nextStatus]}로 변경하시겠습니까?`)) return;
    try {
      setSubmittingOrderId(settlement.orderId);
      await paymentAdminApi.updateSettlementStatus(settlement.orderId, nextStatus, adminMemo);
      await loadSettlements();
      setSelectedSettlementStatusByOrder((prev) => {
        const next = { ...prev };
        delete next[settlement.orderId];
        return next;
      });
      if (expandedOrderId === settlement.orderId) await loadDriverOpsPanel(settlement);
      alert("정산 상태가 변경되었습니다.");
    } catch (error) {
      alert(getErrorMessage(error, "정산 상태 변경 중 오류가 발생했습니다."));
    } finally {
      setSubmittingOrderId((prev) => (prev === settlement.orderId ? null : prev));
    }
  }, [expandedOrderId, loadDriverOpsPanel, loadSettlements, selectedSettlementStatusByOrder]);

  const handleRequestPayout = useCallback(async (settlement: SettlementResponse) => {
    if (!isPaymentCompleted(settlement)) return alert("화주 입금 완료 건만 지급 요청할 수 있습니다.");
    if (isSettlementCompleted(settlement)) return alert("이미 지급 완료된 건입니다.");
    if (!confirm(`주문 #${settlement.orderId} 건을 차주 지급 요청하시겠습니까?`)) return;
    try {
      setSubmittingOrderId(settlement.orderId);
      await paymentAdminApi.requestPayoutForOrder(settlement.orderId);
      await loadSettlements();
      if (expandedOrderId === settlement.orderId) await loadDriverOpsPanel(settlement);
      alert("차주 지급 요청이 완료되었습니다.");
    } catch (error) {
      alert(getErrorMessage(error, "지급 요청 중 오류가 발생했습니다."));
    } finally {
      setSubmittingOrderId((prev) => (prev === settlement.orderId ? null : prev));
    }
  }, [expandedOrderId, loadDriverOpsPanel, loadSettlements]);

  const handleSyncPayout = useCallback(async (settlement: SettlementResponse) => {
    try {
      setSubmittingOrderId(settlement.orderId);
      await paymentAdminApi.syncPayoutItemStatus(settlement.orderId);
      await loadSettlements();
      await loadDriverOpsPanel(settlement);
      setExpandedOrderId(settlement.orderId);
      alert("지급 상태를 동기화했습니다.");
    } catch (error) {
      alert(getErrorMessage(error, "지급 상태 동기화 중 오류가 발생했습니다."));
    } finally {
      setSubmittingOrderId((prev) => (prev === settlement.orderId ? null : prev));
    }
  }, [loadDriverOpsPanel, loadSettlements]);

  const toggleExpanded = useCallback((settlement: SettlementResponse) => {
    if (expandedOrderId === settlement.orderId) return setExpandedOrderId(null);
    setExpandedOrderId(settlement.orderId);
    void loadDriverOpsPanel(settlement);
  }, [expandedOrderId, loadDriverOpsPanel]);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">정산 및 매출 관리</h1>
          <p className="mt-1 text-sm text-slate-500">운송, 결제, 정산, 지급 상태를 분리해 차주 지급 운영을 처리합니다.</p>
        </div>
        <div className="flex rounded-2xl bg-slate-100 p-1 shadow-inner">
          <button className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-slate-900 shadow-sm">차주 정산</button>
          <Link href="/global/billing/settlement/shipper" className="rounded-xl px-5 py-2 text-sm font-bold text-slate-500 hover:bg-white/60">화주 정산</Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-500">{card.title}</div>
            <div className={`mt-2 text-2xl font-black ${card.tone}`}>{card.countCard ? `${new Intl.NumberFormat("ko-KR").format(card.amount)}건` : formatAmount(card.amount)}</div>
            <div className="mt-2 text-xs text-slate-400">{card.meta}</div>
          </div>
        ))}
      </section>

      <SettlementQueueCards items={queueItems} />

      <SettlementOpsFilterBar
        searchPlaceholder="주문번호, 차주명, 화주명, 계좌번호를 검색하세요"
        searchValue={searchTerm}
        statusValue={statusFilter}
        statusOptions={STATUS_FILTER_OPTIONS}
        paymentValue={paymentFilter}
        paymentOptions={PAYMENT_FILTER_OPTIONS}
        payoutValue={payoutFilter}
        payoutOptions={PAYOUT_FILTER_OPTIONS}
        showExtraColumns={showPaymentColumns}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onPaymentChange={setPaymentFilter}
        onPayoutChange={setPayoutFilter}
        onToggleExtraColumns={setShowPaymentColumns}
      />

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className={`w-full min-w-[1180px] text-sm ${showPaymentColumns ? "xl:min-w-[1680px]" : ""}`}>
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr className="text-left text-xs font-black uppercase tracking-wider">
                <th className="px-5 py-4">주문 / 차주</th>
                <th className="px-4 py-4">화주</th>
                <th className="px-4 py-4">운송상태</th>
                <th className="px-4 py-4">결제상태</th>
                <th className="px-4 py-4">정산상태</th>
                <th className="px-4 py-4">지급상태</th>
                <th className="px-4 py-4 text-right">실지급액</th>
                <th className="px-4 py-4">최근 동기화</th>
                {showPaymentColumns ? (
                  <>
                    <th className="px-4 py-4">결제수단</th>
                    <th className="px-4 py-4">결제시점</th>
                    <th className="px-4 py-4 text-right">수수료</th>
                    <th className="px-4 py-4">입금시각</th>
                    <th className="px-4 py-4">계좌 / 실패사유</th>
                  </>
                ) : null}
                <th className="px-5 py-4 text-right">운영</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={showPaymentColumns ? 14 : 9} className="px-5 py-12 text-center text-slate-400">
                    데이터를 불러오는 중입니다.
                  </td>
                </tr>
              ) : paginatedSettlements.length === 0 ? (
                <tr>
                  <td colSpan={showPaymentColumns ? 14 : 9} className="px-5 py-12 text-center text-slate-400">
                    조건에 맞는 지급 운영 건이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedSettlements.map((settlement) => {
                  const orderStatus = getEffectiveOrderStatus(settlement);
                  const paymentStatus = getEffectivePaymentStatus(settlement);
                  const settlementStatus = getEffectiveSettlementStatus(settlement);
                  const payoutStatus = getEffectivePayoutStatus(settlement);
                  const selectedStatus =
                    selectedSettlementStatusByOrder[settlement.orderId] ?? settlementStatus;
                  const isSubmitting = submittingOrderId === settlement.orderId;
                  const isExpanded = expandedOrderId === settlement.orderId;
                  const opsState = opsPanelByOrder[settlement.orderId];
                  const canRequestPayout =
                    isPaymentCompleted(settlement) && !isSettlementCompleted(settlement);
                  const needsAttention =
                    payoutStatus === "FAILED" ||
                    settlementStatus === "WAIT" ||
                    paymentStatus === "DISPUTED" ||
                    paymentStatus === "ADMIN_HOLD";

                  return (
                    <Fragment key={settlement.orderId}>
                      <tr className={needsAttention ? "bg-amber-50/40" : "bg-white"}>
                        <td className="px-5 py-5 align-top">
                          <Link
                            href={`/global/billing/settlement/shipper/${settlement.orderId}`}
                            className="text-sm font-black text-slate-900 hover:text-blue-700"
                          >
                            주문 #{settlement.orderId}
                          </Link>
                          <div className="mt-2 text-sm font-bold text-slate-700">
                            {settlement.driverName || `차주 #${settlement.driverUserId}`}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {settlement.bankName || settlement.bank || "은행 미등록"} {settlement.accountNum || ""}
                          </div>
                        </td>
                        <td className="px-4 py-5 align-top">
                          <div className="text-sm font-bold text-slate-900">{settlement.shipperName}</div>
                          <div className="mt-1 text-xs text-slate-400">{settlement.bizNumber}</div>
                        </td>
                        <td className="px-4 py-5 align-top">
                          {orderStatus ? (
                            <StatusChip
                              label={ORDER_STATUS_LABELS[orderStatus]}
                              tone={getOrderStatusTone(orderStatus)}
                              minWidthClassName="min-w-[84px]"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">미확인</span>
                          )}
                        </td>
                        <td className="px-4 py-5 align-top">
                          <StatusChip
                            label={PAYMENT_STATUS_LABELS[paymentStatus]}
                            tone={getPaymentStatusTone(paymentStatus)}
                            minWidthClassName="min-w-[84px]"
                          />
                        </td>
                        <td className="px-4 py-5 align-top">
                          <StatusChip
                            label={SETTLEMENT_STATUS_LABELS[settlementStatus]}
                            tone={getSettlementStatusTone(settlementStatus)}
                            minWidthClassName="min-w-[84px]"
                          />
                        </td>
                        <td className="px-4 py-5 align-top">
                          {payoutStatus ? (
                            <StatusChip
                              label={PAYOUT_STATUS_LABELS[payoutStatus]}
                              tone={getPayoutStatusTone(payoutStatus)}
                              minWidthClassName="min-w-[84px]"
                            />
                          ) : (
                            <StatusChip label="미생성" tone="slate" minWidthClassName="min-w-[84px]" />
                          )}
                        </td>
                        <td className="px-4 py-5 text-right align-top">
                          <div className="text-base font-black text-slate-900">
                            {formatAmount(getPayoutAmount(settlement))}
                          </div>
                        </td>
                        <td className="px-4 py-5 align-top text-sm text-slate-600">
                          {formatDateTime(getLastSyncedAt(settlement))}
                        </td>
                        {showPaymentColumns ? (
                          <>
                            <td className="px-4 py-5 align-top text-sm text-slate-600">
                              {getPaymentMethodLabel(settlement.paymentMethod)}
                            </td>
                            <td className="px-4 py-5 align-top text-sm text-slate-600">
                              {getPaymentTimingLabel(settlement.paymentTiming)}
                            </td>
                            <td className="px-4 py-5 text-right align-top text-sm font-bold text-slate-700">
                              {formatAmount(settlement.paymentFeeAmount ?? 0)}
                            </td>
                            <td className="px-4 py-5 align-top text-sm text-slate-600">
                              {formatDateTime(settlement.paidAt)}
                            </td>
                            <td className="px-4 py-5 align-top">
                              <div className="max-w-[240px] text-sm text-slate-600">
                                <div className="truncate">
                                  {(settlement.bankName || settlement.bank || "은행 미등록") +
                                    (settlement.accountNum ? ` / ${settlement.accountNum}` : "")}
                                </div>
                                <div className="mt-1 truncate text-xs text-rose-500">
                                  {settlement.payoutFailureReason || "-"}
                                </div>
                              </div>
                            </td>
                          </>
                        ) : null}
                        <td className="px-5 py-5 align-top">
                          <div className="flex flex-col items-end gap-2">
                            <select
                              value={selectedStatus}
                              onChange={(event) =>
                                setSelectedSettlementStatusByOrder((prev) => ({
                                  ...prev,
                                  [settlement.orderId]: event.target.value as SettlementWorkflowStatus,
                                }))
                              }
                              className="h-10 min-w-[112px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                            >
                              {SETTLEMENT_STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {SETTLEMENT_STATUS_LABELS[option]}
                                </option>
                              ))}
                            </select>
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => void handleApplySettlementStatus(settlement)}
                                disabled={isSubmitting}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                              >
                                상태 적용
                              </button>
                              <button
                                onClick={() => void handleRequestPayout(settlement)}
                                disabled={isSubmitting || !canRequestPayout}
                                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                              >
                                지급 요청
                              </button>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => void handleSyncPayout(settlement)}
                                disabled={isSubmitting}
                                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                              >
                                상태 동기화
                              </button>
                              <button
                                onClick={() => toggleExpanded(settlement)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                              >
                                {isExpanded ? "운영 닫기" : "운영 보기"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr className="bg-slate-50/70">
                          <td colSpan={showPaymentColumns ? 14 : 9} className="px-5 py-5">
                            <DriverPayoutMonitorPanel
                              settlement={settlement}
                              payoutItem={opsState?.payoutItem ?? null}
                              payoutItemMessage={opsState?.payoutItemMessage ?? null}
                              sellerInfo={opsState?.sellerInfo ?? null}
                              sellerMessage={opsState?.sellerMessage ?? null}
                              isLoading={opsState?.isLoading ?? false}
                              onRefresh={() => void loadDriverOpsPanel(settlement)}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
          <div>
            총 {filteredSettlements.length}건 중 {paginatedSettlements.length}건 표시
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              이전
            </button>
            <span className="min-w-[88px] text-center font-bold text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
