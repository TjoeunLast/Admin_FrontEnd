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
  getPlatformNetRevenue,
  getPayoutAmount,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYOUT_STATUS_LABELS,
  SETTLEMENT_STATUS_LABELS,
  isNegativeMargin,
  isPaymentCompleted,
  isSettlementCompleted,
  sortAdminSettlementsByRecent,
} from "@/app/features/shared/lib/admin_settlement_overview";
import {
  DriverPayoutMonitorPanel,
  DriverSellerOpsInfo,
} from "./driver_payout_monitor_panel";
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
const MARGIN_FILTER_OPTIONS = ["전체 손익", "적자 주문", "흑자 주문"];
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

const formatAmount = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(value || 0);
const formatOptionalAmount = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? `${formatAmount(value)}원`
    : "-";
const formatSignedAmount = (value?: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatAmount(Math.abs(value))}원`;
};
const formatPercent = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? `${(value * 100).toFixed(1)}%`
    : "-";
const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";
const getPaymentMethodLabel = (value?: string | null) =>
  PAYMENT_METHOD_LABELS[
    String(value ?? "")
      .trim()
      .toUpperCase()
  ] ??
  value ??
  "-";
const getPaymentTimingLabel = (value?: string | null) =>
  PAYMENT_TIMING_LABELS[
    String(value ?? "")
      .trim()
      .toUpperCase()
  ] ??
  value ??
  "-";
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
  if (
    normalized === "PAID" ||
    normalized === "CONFIRMED" ||
    normalized === "ADMIN_FORCE_CONFIRMED"
  )
    return "emerald" as const;
  if (normalized === "DISPUTED" || normalized === "ADMIN_HOLD")
    return "amber" as const;
  if (normalized === "ADMIN_REJECTED" || normalized === "CANCELLED")
    return "rose" as const;
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
  if (normalized === "REQUESTED" || normalized === "RETRYING")
    return "blue" as const;
  if (normalized === "READY") return "amber" as const;
  return "slate" as const;
};

const getHttpStatus = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null || !("response" in error))
    return null;
  const response = (error as { response?: { status?: number } }).response;
  return typeof response?.status === "number" ? response.status : null;
};
const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string } | string } }
    ).response;
    const responseData = response?.data;
    if (typeof responseData === "string" && responseData.trim())
      return responseData;
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
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  return value as Record<string, unknown>;
};
const readStringValue = (
  source: Record<string, unknown> | null,
  ...keys: string[]
) => {
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
  const [marginFilter, setMarginFilter] = useState("전체 손익");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaymentColumns, setShowPaymentColumns] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState<number | null>(
    null,
  );
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [selectedSettlementStatusByOrder, setSelectedSettlementStatusByOrder] =
    useState<Record<number, SettlementWorkflowStatus>>({});
  const [opsPanelByOrder, setOpsPanelByOrder] = useState<
    Record<number, DriverPayoutOpsState>
  >({});

  const loadSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      setSettlements(
        sortAdminSettlementsByRecent(await paymentAdminApi.getSettlements()),
      );
    } catch (error) {
      console.error(
        "정산 데이터 로드 실패:",
        getErrorMessage(error, "알 수 없는 오류"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDriverOpsPanel = useCallback(
    async (settlement: SettlementResponse) => {
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
      const [payoutResult, sellerResult] = await Promise.all([
        payoutTask,
        sellerTask,
      ]);
      let payoutItem: DriverPayoutItemStatusResponse | null = null;
      let payoutItemMessage: string | null = null;
      let sellerInfo: DriverSellerOpsInfo | null = null;
      let sellerMessage: string | null = null;
      if (payoutResult.ok) payoutItem = payoutResult.value;
      else if (isMissingDataStatus(payoutResult.error))
        payoutItemMessage = "payout item이 아직 생성되지 않았습니다.";
      else
        payoutItemMessage = getErrorMessage(
          payoutResult.error,
          "지급 원장을 불러오지 못했습니다.",
        );
      if (sellerResult.ok) {
        sellerInfo = extractSellerInfo(sellerResult.value);
        if (!sellerInfo)
          sellerMessage =
            "seller 상태 전용 필드가 아직 없어 차주 기본 정보만 표시합니다.";
      } else if (isMissingDataStatus(sellerResult.error))
        sellerMessage = "차주 상세 정보를 찾지 못했습니다.";
      else
        sellerMessage = getErrorMessage(
          sellerResult.error,
          "차주 상세 정보를 불러오지 못했습니다.",
        );
      setOpsPanelByOrder((prev) => ({
        ...prev,
        [orderId]: {
          isLoading: false,
          payoutItem,
          payoutItemMessage,
          sellerInfo,
          sellerMessage,
        },
      }));
    },
    [],
  );

  useEffect(() => {
    void loadSettlements();
  }, [loadSettlements]);

  const overview = useMemo(
    () => calculateAdminSettlementOverview(settlements),
    [settlements],
  );
  const cards = useMemo(
    () => [
      {
        title: "차주 지급 대기액",
        amount: overview.pendingPayoutAmount,
        meta: `대기 ${overview.pendingSettlementCount}건`,
        tone: "text-amber-600",
      },
      {
        title: "차주 지급 완료액",
        amount: overview.completedPayoutAmount,
        meta: `완료 ${overview.completedSettlementCount}건`,
        tone: "text-emerald-600",
      },
      {
        title: "지급 대상 건수",
        amount: overview.payoutTargetCount,
        meta: `입금 완료 ${overview.completedPaymentCount}건 기준`,
        tone: "text-slate-900",
        countCard: true,
      },
      {
        title: "플랫폼 수수료 수익",
        amount: overview.totalFeeAmount,
        meta: "입금 완료 기준",
        tone: "text-[#4E46E5]",
      },
    ],
    [overview],
  );

  const filteredSettlements = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return settlements.filter((settlement) => {
      const paymentStatus = getEffectivePaymentStatus(settlement);
      const settlementStatus = getEffectiveSettlementStatus(settlement);
      const payoutStatus = getEffectivePayoutStatus(settlement);
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
          ? !settlement.paymentStatus &&
            !settlement.paymentMethod &&
            !settlement.pgTid
          : PAYMENT_STATUS_LABELS[paymentStatus] === paymentFilter);
      const matchesPayout =
        payoutFilter === "전체 지급" ||
        (payoutFilter === "미생성"
          ? !payoutStatus
          : payoutStatus &&
            PAYOUT_STATUS_LABELS[payoutStatus] === payoutFilter);
      const matchesMargin =
        marginFilter === "전체 손익" ||
        (marginFilter === "적자 주문"
          ? isNegativeMargin(settlement)
          : !isNegativeMargin(settlement));
      return (
        matchesSearch &&
        matchesSettlement &&
        matchesPayment &&
        matchesPayout &&
        matchesMargin
      );
    });
  }, [marginFilter, paymentFilter, payoutFilter, searchTerm, settlements, statusFilter]);

  const queueItems = useMemo(
    () => calculateAdminSettlementQueues(filteredSettlements),
    [filteredSettlements],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filteredSettlements.length,
    marginFilter,
    paymentFilter,
    payoutFilter,
    searchTerm,
    statusFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSettlements.length / ITEMS_PER_PAGE),
  );
  const paginatedSettlements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSettlements.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredSettlements]);

  const handleApplySettlementStatus = useCallback(
    async (settlement: SettlementResponse) => {
      const currentStatus = getEffectiveSettlementStatus(settlement);
      const nextStatus =
        selectedSettlementStatusByOrder[settlement.orderId] ?? currentStatus;
      if (currentStatus === nextStatus)
        return alert("변경할 정산 상태를 선택하세요.");
      const adminMemo =
        nextStatus === "WAIT"
          ? (window.prompt("지급 보류 사유를 입력하세요.", "")?.trim() ?? null)
          : null;
      if (nextStatus === "WAIT" && adminMemo === "") return;
      if (
        !confirm(
          `주문 #${settlement.orderId} 정산 상태를 ${SETTLEMENT_STATUS_LABELS[nextStatus]}로 변경하시겠습니까?`,
        )
      )
        return;
      try {
        setSubmittingOrderId(settlement.orderId);
        await paymentAdminApi.updateSettlementStatus(
          settlement.orderId,
          nextStatus,
          adminMemo,
        );
        await loadSettlements();
        setSelectedSettlementStatusByOrder((prev) => {
          const next = { ...prev };
          delete next[settlement.orderId];
          return next;
        });
        if (expandedOrderId === settlement.orderId)
          await loadDriverOpsPanel(settlement);
        alert("정산 상태가 변경되었습니다.");
      } catch (error) {
        alert(getErrorMessage(error, "정산 상태 변경 중 오류가 발생했습니다."));
      } finally {
        setSubmittingOrderId((prev) =>
          prev === settlement.orderId ? null : prev,
        );
      }
    },
    [
      expandedOrderId,
      loadDriverOpsPanel,
      loadSettlements,
      selectedSettlementStatusByOrder,
    ],
  );

  const handleRequestPayout = useCallback(
    async (settlement: SettlementResponse) => {
      if (!isPaymentCompleted(settlement))
        return alert("화주 입금 완료 건만 지급 요청할 수 있습니다.");
      if (isSettlementCompleted(settlement))
        return alert("이미 지급 완료된 건입니다.");
      if (
        !confirm(`주문 #${settlement.orderId} 건을 차주 지급 요청하시겠습니까?`)
      )
        return;
      try {
        setSubmittingOrderId(settlement.orderId);
        await paymentAdminApi.requestPayoutForOrder(settlement.orderId);
        await loadSettlements();
        if (expandedOrderId === settlement.orderId)
          await loadDriverOpsPanel(settlement);
        alert("차주 지급 요청이 완료되었습니다.");
      } catch (error) {
        alert(getErrorMessage(error, "지급 요청 중 오류가 발생했습니다."));
      } finally {
        setSubmittingOrderId((prev) =>
          prev === settlement.orderId ? null : prev,
        );
      }
    },
    [expandedOrderId, loadDriverOpsPanel, loadSettlements],
  );

  const handleSyncPayout = useCallback(
    async (settlement: SettlementResponse) => {
      try {
        setSubmittingOrderId(settlement.orderId);
        await paymentAdminApi.syncPayoutItemStatus(settlement.orderId);
        await loadSettlements();
        await loadDriverOpsPanel(settlement);
        setExpandedOrderId(settlement.orderId);
        alert("지급 상태를 동기화했습니다.");
      } catch (error) {
        alert(
          getErrorMessage(error, "지급 상태 동기화 중 오류가 발생했습니다."),
        );
      } finally {
        setSubmittingOrderId((prev) =>
          prev === settlement.orderId ? null : prev,
        );
      }
    },
    [loadDriverOpsPanel, loadSettlements],
  );

  const toggleExpanded = useCallback(
    (settlement: SettlementResponse) => {
      if (expandedOrderId === settlement.orderId)
        return setExpandedOrderId(null);
      setExpandedOrderId(settlement.orderId);
      void loadDriverOpsPanel(settlement);
    },
    [expandedOrderId, loadDriverOpsPanel],
  );

  return (
    <main className="max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* 헤더 섹션 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pl-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            정산 및 매출 관리
          </h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 shadow-sm">
          <button className="rounded-xl bg-white px-6 py-2.5 text-xs font-black text-[#4E46E5] shadow-md transition-all">
            차주 정산
          </button>
          <Link
            href="/global/billing/settlement/shipper"
            className="rounded-xl px-6 py-2.5 text-xs font-black text-slate-500 hover:text-slate-700 transition-colors"
          >
            화주 정산
          </Link>
        </div>
      </div>

      {/* 요약 카드 섹션 */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition-all"
          >
            <div className="text-sm font-medium text-slate-500 mb-1">
              {card.title}
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${card.tone}`}>
                {card.countCard
                  ? new Intl.NumberFormat("ko-KR").format(card.amount)
                  : formatAmount(card.amount).replace("₩", "")}
              </span>
              <span className="text-sm font-medium text-slate-400">
                {card.countCard ? "건" : "원"}
              </span>
            </div>
            <div className="mt-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {card.meta}
            </div>
          </div>
        ))}
      </section>

      {/* 워크플로우 현황 바 */}
      <div className="pl-1">
        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
          워크플로우 실시간 현황
        </h2>
        <section className="rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-slate-100">
            {queueItems.map((item) => (
              <div key={item.title} className="px-6 py-4 flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  {item.title}
                </span>
                <div className="flex items-baseline gap-0.5">
                  <span
                    className={`text-lg font-black ${
                      item.tone === "rose"
                        ? "text-rose-600"
                        : item.tone === "emerald"
                          ? "text-emerald-600"
                          : item.tone === "blue"
                            ? "text-[#4E46E5]"
                            : item.tone === "amber"
                              ? "text-amber-600"
                              : "text-slate-900"
                    }`}
                  >
                    {formatAmount(item.amount).replace("₩", "")}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">
                    원
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {item.count}건
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 검색 및 필터 바 */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[300px] flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            지급 데이터 검색
          </label>
          <input
            type="text"
            placeholder="주문번호, 차주명, 화주명, 계좌번호 검색"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#4E46E5] transition-all placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          {[
            {
              label: "정산 상태",
              val: statusFilter,
              set: setStatusFilter,
              opt: STATUS_FILTER_OPTIONS,
            },
            {
              label: "결제 상태",
              val: paymentFilter,
              set: setPaymentFilter,
              opt: PAYMENT_FILTER_OPTIONS,
            },
            {
              label: "지급 상태",
              val: payoutFilter,
              set: setPayoutFilter,
              opt: PAYOUT_FILTER_OPTIONS,
            },
            {
              label: "손익 상태",
              val: marginFilter,
              set: setMarginFilter,
              opt: MARGIN_FILTER_OPTIONS,
            },
          ].map((f) => (
            <div key={f.label} className="w-40 flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                {f.label}
              </label>
              <div className="relative">
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-[#4E46E5] transition-all"
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                >
                  {f.opt.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 px-2 pb-3">
            <input
              type="checkbox"
              id="colToggle"
              checked={showPaymentColumns}
              onChange={(e) => setShowPaymentColumns(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#4E46E5] focus:ring-[#4E46E5] cursor-pointer"
            />
            <label
              htmlFor="colToggle"
              className="text-xs font-bold text-slate-600 cursor-pointer select-none"
            >
              세부 컬럼
            </label>
          </div>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table
            className={`w-full min-w-[1340px] text-left border-collapse table-fixed ${showPaymentColumns ? "xl:min-w-[1960px]" : ""}`}
          >
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-4 w-44">주문 / 차주</th>
                <th className="px-4 py-4 w-40">화주 정보</th>
                <th className="px-4 py-4 w-28 text-center">운송상태</th>
                <th className="px-4 py-4 w-28 text-center">결제상태</th>
                <th className="px-4 py-4 w-28 text-center">정산상태</th>
                <th className="px-4 py-4 w-28 text-center">지급상태</th>
                <th className="px-4 py-4 w-32 text-center">실지급액</th>
                <th className="px-4 py-4 w-40 text-center">손익</th>
                <th className="px-4 py-4 w-36 text-center">최근 동기화</th>
                {showPaymentColumns && (
                  <>
                    <th className="px-4 py-4 w-24 text-center">수단/시점</th>
                    <th className="px-4 py-4 w-28 text-right">Gross</th>
                    <th className="px-4 py-4 w-28 text-right">Toss 비용</th>
                    <th className="px-4 py-4 w-36 text-center">입금시각</th>
                    <th className="px-4 py-4 w-48">계좌 / 사유</th>
                  </>
                )}
                <th className="px-5 py-4 w-40 text-center">관리 제어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={showPaymentColumns ? 15 : 10}
                    className="py-20 text-center text-slate-400 font-bold"
                  >
                    정산 데이터를 불러오는 중...
                  </td>
                </tr>
              ) : paginatedSettlements.length === 0 ? (
                <tr>
                  <td
                    colSpan={showPaymentColumns ? 15 : 10}
                    className="py-20 text-center text-slate-400 font-bold"
                  >
                    조건에 맞는 정산 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedSettlements.map((settlement) => {
                  const oStatus = getEffectiveOrderStatus(settlement);
                  const payStatus = getEffectivePaymentStatus(settlement);
                  const setStatus = getEffectiveSettlementStatus(settlement);
                  const outStatus = getEffectivePayoutStatus(settlement);
                  const isSubmitting = submittingOrderId === settlement.orderId;
                  const isExpanded = expandedOrderId === settlement.orderId;
                  const hasNegativeMargin = isNegativeMargin(settlement);
                  const platformNetRevenue = getPlatformNetRevenue(settlement);
                  const needsAttention =
                    outStatus === "FAILED" ||
                    setStatus === "WAIT" ||
                    payStatus === "DISPUTED";

                  return (
                    <Fragment key={settlement.orderId}>
                      <tr
                        className={`${
                          hasNegativeMargin
                            ? "bg-rose-50/40"
                            : needsAttention
                              ? "bg-amber-50/30"
                              : "hover:bg-slate-50/50"
                        } transition-all group`}
                      >
                        <td className="px-5 py-5 align-top">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/global/billing/settlement/shipper/${settlement.orderId}`}
                              className="text-sm font-black text-[#4E46E5] hover:underline transition-all"
                            >
                              #{settlement.orderId}
                            </Link>
                            {hasNegativeMargin ? (
                              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700">
                                적자
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1.5 text-sm font-bold text-slate-800 truncate">
                            {settlement.driverName ||
                              `차주 #${settlement.driverUserId}`}
                          </div>
                          <div className="mt-0.5 text-[11px] font-medium text-slate-400 truncate tracking-tight">
                            {settlement.bankName} {settlement.accountNum}
                          </div>
                        </td>
                        <td className="px-4 py-5 align-top">
                          <div className="text-sm font-bold text-slate-800 truncate">
                            {settlement.shipperName}
                          </div>
                          <div className="mt-1 text-[11px] font-medium text-slate-400 tracking-tight">
                            {settlement.bizNumber}
                          </div>
                        </td>
                        <td className="px-4 py-5 align-top text-center">
                          <StatusChip
                            label={
                              ORDER_STATUS_LABELS[
                                (oStatus ||
                                  "REQUESTED") as keyof typeof ORDER_STATUS_LABELS
                              ]
                            }
                            tone={getOrderStatusTone(oStatus)}
                          />
                        </td>
                        <td className="px-4 py-5 align-top text-center">
                          <StatusChip
                            label={PAYMENT_STATUS_LABELS[payStatus]}
                            tone={getPaymentStatusTone(payStatus)}
                          />
                        </td>
                        <td className="px-4 py-5 align-top text-center">
                          <StatusChip
                            label={SETTLEMENT_STATUS_LABELS[setStatus]}
                            tone={getSettlementStatusTone(setStatus)}
                          />
                        </td>
                        <td className="px-4 py-5 align-top text-center">
                          <StatusChip
                            label={
                              outStatus
                                ? PAYOUT_STATUS_LABELS[outStatus]
                                : "미생성"
                            }
                            tone={getPayoutStatusTone(outStatus)}
                          />
                        </td>
                        <td className="px-4 py-5 align-top text-center font-black text-slate-900">
                          {formatAmount(getPayoutAmount(settlement))}원
                        </td>
                        <td className="px-4 py-5 align-top text-center">
                        <div
                          className={`text-sm font-black ${
                              hasNegativeMargin ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                            {formatSignedAmount(platformNetRevenue)}
                        </div>
                          <div className="mt-1 text-[10px] font-medium leading-tight text-slate-400">
                            <div>gross {formatOptionalAmount(settlement.platformGrossRevenue)}</div>
                            <div>
                              toss {formatOptionalAmount(settlement.tossFeeAmount)} / rate{" "}
                              {formatPercent(settlement.tossFeeRate)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 align-top text-center text-[11px] font-medium text-slate-400 leading-tight">
                          {formatDateTime(getLastSyncedAt(settlement))
                            .split(" ")
                            .map((s, i) => (
                              <div key={i}>{s}</div>
                            ))}
                        </td>
                        {showPaymentColumns && (
                          <>
                            <td className="px-4 py-5 align-top text-center text-xs font-bold text-slate-600">
                              <div>
                                {getPaymentMethodLabel(
                                  settlement.paymentMethod,
                                )}
                              </div>
                              <div className="text-[10px] opacity-60 font-medium">
                                {getPaymentTimingLabel(
                                  settlement.paymentTiming,
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-5 align-top text-right font-bold text-slate-700 text-sm">
                              {formatOptionalAmount(settlement.platformGrossRevenue)}
                            </td>
                            <td className="px-4 py-5 align-top text-right font-bold text-slate-700 text-sm">
                              {formatOptionalAmount(settlement.tossFeeAmount)}
                            </td>
                            <td className="px-4 py-5 align-top text-center text-[11px] text-slate-400">
                              {formatDateTime(settlement.paidAt)}
                            </td>
                            <td className="px-4 py-5 align-top">
                              <div className="text-xs font-medium text-slate-600 truncate">
                                {settlement.bankName} / {settlement.accountNum}
                              </div>
                              {settlement.payoutFailureReason && (
                                <div className="mt-1 text-[10px] font-bold text-rose-500 leading-tight">
                                  {settlement.payoutFailureReason}
                                </div>
                              )}
                            </td>
                          </>
                        )}
                        <td className="px-5 py-5 align-top text-center">
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={
                                selectedSettlementStatusByOrder[
                                  settlement.orderId
                                ] ?? setStatus
                              }
                              onChange={(e) =>
                                setSelectedSettlementStatusByOrder((prev) => ({
                                  ...prev,
                                  [settlement.orderId]: e.target
                                    .value as SettlementWorkflowStatus,
                                }))
                              }
                              className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700 outline-none focus:border-[#4E46E5] transition-all cursor-pointer"
                            >
                              {SETTLEMENT_STATUS_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {SETTLEMENT_STATUS_LABELS[opt]}
                                </option>
                              ))}
                            </select>
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                onClick={() =>
                                  void handleApplySettlementStatus(settlement)
                                }
                                disabled={isSubmitting}
                                className="h-7 rounded-lg border border-slate-200 bg-white text-[10px] font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all active:scale-95"
                              >
                                상태적용
                              </button>
                              <button
                                onClick={() =>
                                  void handleRequestPayout(settlement)
                                }
                                disabled={
                                  isSubmitting ||
                                  !(
                                    isPaymentCompleted(settlement) &&
                                    !isSettlementCompleted(settlement)
                                  )
                                }
                                className="h-7 rounded-lg bg-slate-900 text-[10px] font-black text-white hover:bg-black disabled:bg-slate-200 transition-all active:scale-95"
                              >
                                지급요청
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                onClick={() =>
                                  void handleSyncPayout(settlement)
                                }
                                disabled={isSubmitting}
                                className="h-7 rounded-lg bg-blue-50 text-[10px] font-black text-[#4E46E5] hover:bg-blue-100 transition-all active:scale-95"
                              >
                                동기화
                              </button>
                              <button
                                onClick={() => toggleExpanded(settlement)}
                                className={`h-7 rounded-lg border text-[10px] font-black transition-all active:scale-95 ${isExpanded ? "bg-[#4E46E5] border-[#4E46E5] text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                              >
                                {isExpanded ? "닫기" : "운영보기"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td
                            colSpan={showPaymentColumns ? 15 : 10}
                            className="px-8 py-6"
                          >
                            <DriverPayoutMonitorPanel
                              settlement={settlement}
                              payoutItem={
                                opsPanelByOrder[settlement.orderId]
                                  ?.payoutItem ?? null
                              }
                              payoutItemMessage={
                                opsPanelByOrder[settlement.orderId]
                                  ?.payoutItemMessage ?? null
                              }
                              sellerInfo={
                                opsPanelByOrder[settlement.orderId]
                                  ?.sellerInfo ?? null
                              }
                              sellerMessage={
                                opsPanelByOrder[settlement.orderId]
                                  ?.sellerMessage ?? null
                              }
                              isLoading={
                                opsPanelByOrder[settlement.orderId]
                                  ?.isLoading ?? false
                              }
                              onRefresh={() =>
                                void loadDriverOpsPanel(settlement)
                              }
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center justify-center gap-8 py-8 border-t border-slate-100 bg-white font-bold">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-sm text-slate-400 disabled:opacity-20 hover:text-slate-900 transition-all active:scale-95"
          >
            이전
          </button>
          <div className="flex gap-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`text-md transition-all ${currentPage === num ? "text-slate-900 underline underline-offset-4 decoration-2" : "text-slate-400 hover:text-slate-600"}`}
              >
                {num}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-sm text-slate-400 disabled:opacity-20 hover:text-slate-900 transition-all active:scale-95"
          >
            다음
          </button>
        </div>
      </div>
    </main>
  );
}
