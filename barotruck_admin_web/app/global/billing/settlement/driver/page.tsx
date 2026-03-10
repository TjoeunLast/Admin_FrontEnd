"use client";

import { Fragment, useState, useEffect, useCallback, useMemo } from "react";
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
  getEffectiveSettlementStatus,
  getPayoutAmount,
  hasPaymentTracking,
  isPaymentCompleted,
  isSettlementCompleted,
  SETTLEMENT_STATUS_LABELS,
} from "@/app/features/shared/lib/admin_settlement_overview";
import {
  DriverPayoutMonitorPanel,
  DriverSellerOpsInfo,
} from "./driver_payout_monitor_panel";

const SETTLEMENT_STATUS_OPTIONS: SettlementWorkflowStatus[] = [
  "READY",
  "WAIT",
  "COMPLETED",
];

const getSettlementStatusBadgeClass = (
  status: SettlementWorkflowStatus
): string => {
  if (status === "COMPLETED") {
    return "bg-green-50 text-green-500";
  }
  if (status === "WAIT") {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-orange-50 text-orange-500";
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

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const readStringValue = (
  source: Record<string, unknown> | null,
  ...keys: string[]
): string | null => {
  if (!source) {
    return null;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
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

  if (!sellerId && !sellerRef && !sellerStatus) {
    return null;
  }

  return {
    sellerId,
    sellerRef,
    sellerStatus,
  };
};

interface DriverPayoutOpsState {
  isLoading: boolean;
  payoutItem: DriverPayoutItemStatusResponse | null;
  payoutItemMessage: string | null;
  sellerInfo: DriverSellerOpsInfo | null;
  sellerMessage: string | null;
}

export default function DriverSettlementPage() {
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaymentColumns, setShowPaymentColumns] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [selectedSettlementStatusByOrder, setSelectedSettlementStatusByOrder] =
    useState<Record<number, SettlementWorkflowStatus>>({});
  const [opsPanelByOrder, setOpsPanelByOrder] = useState<
    Record<number, DriverPayoutOpsState>
  >({});
  const itemsPerPage = 20;

  const loadSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await paymentAdminApi.getSettlements();
      setSettlements(data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      console.error("정산 데이터 로드 실패:", message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  const overview = useMemo(
    () => calculateAdminSettlementOverview(settlements),
    [settlements]
  );
  const cards = useMemo(
    () => [
      {
        title: "차주 총 지급 대상액",
        amount: overview.totalPayoutAmount,
        meta: `지급 대상 ${overview.totalCount}건`,
        className: "bg-[#0f172a] text-white shadow-sm",
        titleClassName: "text-sm text-slate-300 font-medium",
        amountClassName: "text-2xl font-black mt-1",
        metaClassName: "text-xs text-slate-400 mt-2",
      },
      {
        title: "차주 지급 대기액",
        amount: overview.pendingPayoutAmount,
        meta: `지급 대기 ${overview.pendingSettlementCount}건`,
        className: "bg-white border border-[#e2e8f0] shadow-sm",
        titleClassName: "text-sm text-[#64748b] font-medium",
        amountClassName: "text-2xl font-black text-[#f97316] mt-1",
        metaClassName: "text-xs text-slate-400 mt-2",
      },
      {
        title: "차주 지급 완료액",
        amount: overview.completedPayoutAmount,
        meta: `지급 완료 ${overview.completedSettlementCount}건`,
        className: "bg-white border border-[#e2e8f0] shadow-sm",
        titleClassName: "text-sm text-[#64748b] font-medium",
        amountClassName: "text-2xl font-black text-[#10b981] mt-1",
        metaClassName: "text-xs text-slate-400 mt-2",
      },
      {
        title: "플랫폼 수수료 수익",
        amount: overview.totalFeeAmount,
        meta: "결제/정산 데이터 기준",
        className: "bg-[#eff6ff] border border-[#bfdbfe] shadow-sm",
        titleClassName: "text-sm text-[#2563eb] font-bold",
        amountClassName: "text-2xl font-black text-[#2563eb] mt-1",
        metaClassName: "text-xs text-[#60a5fa] mt-2",
      },
    ],
    [overview]
  );

  const filteredSettlements = useMemo(() => {
    return settlements.filter((item) => {
      const matchesSearch =
        searchTerm.trim().length === 0 ||
        (item.driverName || `차주(${item.driverUserId})`)
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());

      const matchesStatus =
        statusFilter === "전체 상태" ||
        (statusFilter === "지급 완료" && isSettlementCompleted(item)) ||
        (statusFilter === "지급 대기" && !isSettlementCompleted(item));

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, settlements, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, settlements.length]);

  const totalPages = Math.ceil(filteredSettlements.length / itemsPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedSettlements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSettlements.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredSettlements]);

  const formatAmount = (value: number) => new Intl.NumberFormat("ko-KR").format(value);
  const formatCompactDateTime = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";
  const tableColumnCount = showPaymentColumns ? 13 : 7;

  const loadDriverOpsPanel = useCallback(async (settlement: SettlementResponse) => {
    setOpsPanelByOrder((prev) => ({
      ...prev,
      [settlement.orderId]: {
        isLoading: true,
        payoutItem: prev[settlement.orderId]?.payoutItem ?? null,
        payoutItemMessage: prev[settlement.orderId]?.payoutItemMessage ?? null,
        sellerInfo: prev[settlement.orderId]?.sellerInfo ?? null,
        sellerMessage: prev[settlement.orderId]?.sellerMessage ?? null,
      },
    }));

    const payoutPromise = paymentAdminApi.getPayoutItemStatus(settlement.orderId);
    const sellerPromise = settlement.driverUserId
      ? getUserDetail(settlement.driverUserId)
      : Promise.resolve(null);

    const [payoutResult, sellerResult] = await Promise.allSettled([
      payoutPromise,
      sellerPromise,
    ]);

    let payoutItem: DriverPayoutItemStatusResponse | null = null;
    let payoutItemMessage: string | null = null;
    let sellerInfo: DriverSellerOpsInfo | null = null;
    let sellerMessage: string | null = null;

    if (payoutResult.status === "fulfilled") {
      payoutItem = payoutResult.value;
    } else if (isMissingDataStatus(payoutResult.reason)) {
      payoutItemMessage = "주문 기준 payout item이 아직 생성되지 않았습니다.";
    } else {
      payoutItemMessage = getErrorMessage(
        payoutResult.reason,
        "payout item 상태를 불러오지 못했습니다."
      );
    }

    if (sellerResult.status === "fulfilled") {
      sellerInfo = extractSellerInfo(sellerResult.value);
      if (!sellerInfo) {
        sellerMessage = "현재 관리자 사용자 상세 응답에는 seller 상태 필드가 없습니다.";
      }
    } else if (isMissingDataStatus(sellerResult.reason)) {
      sellerMessage = "차주 상세 정보를 찾지 못했습니다.";
    } else {
      sellerMessage = getErrorMessage(
        sellerResult.reason,
        "차주 seller 상태를 불러오지 못했습니다."
      );
    }

    setOpsPanelByOrder((prev) => ({
      ...prev,
      [settlement.orderId]: {
        isLoading: false,
        payoutItem,
        payoutItemMessage,
        sellerInfo,
        sellerMessage,
      },
    }));
  }, []);

  const handlePayout = async (orderId: number) => {
    const settlement = settlements.find((item) => item.orderId === orderId);
    if (!settlement) {
      alert("정산 정보를 찾을 수 없습니다.");
      return;
    }

    const settlementStatus = getEffectiveSettlementStatus(settlement);
    const paymentLocked =
      hasPaymentTracking(settlement) && !isPaymentCompleted(settlement);
    if (paymentLocked) {
      alert("화주 입금이 완료된 뒤에만 지급 실행할 수 있습니다.");
      return;
    }
    if (settlementStatus === "WAIT") {
      alert("지급 보류 상태입니다. 상태를 지급 대기로 바꾼 뒤 실행하세요.");
      return;
    }

    if (!confirm("해당 건의 지급을 확정하시겠습니까?")) return;
    try {
      setSubmittingOrderId(orderId);
      const payoutItem = await paymentAdminApi.requestPayoutForOrder(orderId);
      if (payoutItem.status === "COMPLETED") {
        alert("지급 요청이 완료되어 즉시 지급 완료로 반영되었습니다.");
      } else if (payoutItem.status === "REQUESTED") {
        alert("지급 요청이 접수되었습니다. Toss 상태 반영 후 지급 완료로 동기화됩니다.");
      } else {
        alert(`지급 상태가 ${payoutItem.status}로 반영되었습니다.`);
      }
      await loadSettlements();
      if (expandedOrderId === orderId) {
        void loadDriverOpsPanel(settlement);
      }
    } catch (error) {
      const message = getErrorMessage(error, "지급 처리 중 오류가 발생했습니다.");
      alert(message);
    } finally {
      setSubmittingOrderId((prev) => (prev === orderId ? null : prev));
    }
  };

  const handleSyncPayout = useCallback(
    async (settlement: SettlementResponse) => {
      try {
        setSubmittingOrderId(settlement.orderId);
        const payoutItem = await paymentAdminApi.syncPayoutItemStatus(
          settlement.orderId
        );
        await loadSettlements();
        await loadDriverOpsPanel(settlement);

        if (payoutItem.status === "COMPLETED") {
          alert("Toss 지급 상태를 다시 확인했고, 지급 완료로 반영되었습니다.");
          return;
        }

        alert(`현재 지급 상태는 ${payoutItem.status} 입니다.`);
      } catch (error) {
        const message = getErrorMessage(
          error,
          "지급 상태 동기화 중 오류가 발생했습니다."
        );
        alert(message);
      } finally {
        setSubmittingOrderId((prev) =>
          prev === settlement.orderId ? null : prev
        );
      }
    },
    [loadDriverOpsPanel, loadSettlements]
  );

  const handleApplySettlementStatus = useCallback(
    async (settlement: SettlementResponse) => {
      const currentStatus = getEffectiveSettlementStatus(settlement);
      const nextStatus =
        selectedSettlementStatusByOrder[settlement.orderId] ?? currentStatus;

      if (nextStatus === currentStatus) {
        alert("변경할 정산 상태를 선택하세요.");
        return;
      }

      let message = "";
      if (nextStatus === "WAIT") {
        message = "지급 보류로 전환합니다. 서버가 결제/분쟁 상태를 함께 동기화합니다.";
      } else if (nextStatus === "READY") {
        message = "지급 대기로 전환합니다. 서버가 보류 상태를 해제하고 정산 상태를 동기화합니다.";
      } else {
        message = "지급 완료로 전환합니다.";
      }

      let adminMemo: string | null | undefined;
      if (nextStatus === "WAIT" || nextStatus === "READY") {
        const input = window.prompt(
          nextStatus === "WAIT"
            ? "보류 사유를 입력하세요. 비워두면 기본 메모로 처리됩니다."
            : "보류 해제 메모를 입력하세요. 비워두면 기본 메모로 처리됩니다.",
          ""
        );
        if (input === null) {
          return;
        }
        adminMemo = input.trim() || null;
      }

      if (
        !confirm(
          `주문 #${settlement.orderId} 정산 상태를 ${SETTLEMENT_STATUS_LABELS[nextStatus]}로 변경하시겠습니까?\n${message}`
        )
      ) {
        return;
      }

      try {
        setSubmittingOrderId(settlement.orderId);
        await paymentAdminApi.updateSettlementStatus(
          settlement.orderId,
          nextStatus,
          adminMemo
        );
        await loadSettlements();
        setSelectedSettlementStatusByOrder((prev) => {
          const next = { ...prev };
          delete next[settlement.orderId];
          return next;
        });
        if (expandedOrderId === settlement.orderId) {
          void loadDriverOpsPanel(settlement);
        }
        alert("정산 상태가 변경되었습니다.");
      } catch (error) {
        const message = getErrorMessage(error, "정산 상태 변경 중 오류가 발생했습니다.");
        alert(message);
      } finally {
        setSubmittingOrderId((prev) => (prev === settlement.orderId ? null : prev));
      }
    },
    [expandedOrderId, loadDriverOpsPanel, loadSettlements, selectedSettlementStatusByOrder]
  );

  return (
    <main className="space-y-8 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e293b]">정산 및 매출 관리</h1>
          <p className="text-sm text-[#64748b] mt-1">화주 청구 및 차주 지급 현황을 통합 관리합니다.</p>
        </div>
        <div className="bg-[#e2e8f0] p-1 rounded-xl flex gap-1 shadow-inner">
          <button className="px-5 py-2 rounded-lg text-sm font-bold bg-white text-[#1e293b] shadow-sm">
            차주 정산
          </button>
          <Link href="/global/billing/settlement/shipper">
            <button className="px-5 py-2 rounded-lg text-sm font-bold text-[#64748b] hover:bg-white/50 transition-all">
              화주 정산
            </button>
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`${card.className} p-6 rounded-2xl`}
          >
            <div className={card.titleClassName}>{card.title}</div>
            <div className={card.amountClassName}>₩{formatAmount(card.amount)}</div>
            <div className={card.metaClassName}>{card.meta}</div>
          </div>
        ))}
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input 
          type="text" 
          placeholder="차주명을 검색하세요" 
          className="border border-[#e2e8f0] rounded-lg px-4 py-2 text-sm w-64 outline-none focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border border-[#e2e8f0] rounded-lg px-4 py-2 text-sm outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>전체 상태</option>
          <option>지급 대기</option>
          <option>지급 완료</option>
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showPaymentColumns}
            onChange={(e) => setShowPaymentColumns(e.target.checked)}
          />
          추가 결제 컬럼 보기
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        <div className="overflow-x-auto">
          <table
            className={`w-full min-w-[980px] text-sm text-center ${
              showPaymentColumns ? "xl:min-w-[1440px]" : ""
            }`}
          >
          <thead className="bg-[#f8fafc] border-b-2 border-[#e2e8f0]">
            <tr className="text-[#64748b] font-bold">
              <th className="p-4 w-12"><input type="checkbox" /></th>
              <th className="p-4">지급 대상(차주)</th>
              <th className="p-4">은행/계좌번호</th>
              <th className="p-4">운송 완료일</th>
              <th className="p-4">총 지급액</th>
              {showPaymentColumns ? (
                <>
                  <th className="p-4">결제 상태</th>
                  <th className="p-4">결제 수단</th>
                  <th className="p-4">결제 시점</th>
                  <th className="p-4">수수료</th>
                  <th className="p-4">실지급액</th>
                  <th className="p-4">결제 완료시각</th>
                </>
              ) : null}
              <th className="p-4">상태</th>
              <th className="p-4">관리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={tableColumnCount} className="p-10 text-slate-400">데이터를 불러오는 중...</td></tr>
            ) : paginatedSettlements.length === 0 ? (
              <tr><td colSpan={tableColumnCount} className="p-10 text-slate-400">표시할 정산 내역이 없습니다.</td></tr>
            ) : (
              paginatedSettlements.map((s) => {
                const settlementStatus = getEffectiveSettlementStatus(s);
                const settlementDone = isSettlementCompleted(s);
                const settlementHeld = settlementStatus === "WAIT";
                const paymentLocked =
                  hasPaymentTracking(s) && !isPaymentCompleted(s);
                const isSubmitting = submittingOrderId === s.orderId;
                const selectedSettlementStatus =
                  selectedSettlementStatusByOrder[s.orderId] ?? settlementStatus;
                const opsState = opsPanelByOrder[s.orderId];
                const isOpsExpanded = expandedOrderId === s.orderId;

                return (
                  <Fragment key={s.settlementId}>
                    <tr key={s.settlementId} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all">
                      <td className="p-4"><input type="checkbox" /></td>
                      <td className="p-4 text-center font-bold">
                        {s.driverName || `차주(${s.driverUserId})`} 
                      </td>
                      <td className="p-4 text-center text-slate-500">
                        {s.bankName && s.accountNum 
                          ? `${s.bankName} ${s.accountNum}` 
                          : "계좌 정보 없음"}
                      </td>
                      <td className="p-4 text-slate-500">
                        {s.feeDate ? new Date(s.feeDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4 font-black text-slate-900">
                        {formatAmount(getPayoutAmount(s))}원
                      </td>
                      {showPaymentColumns ? (
                        <>
                          <td className="p-4 text-slate-600">{s.paymentStatus || "-"}</td>
                          <td className="p-4 text-slate-600">{s.paymentMethod || "-"}</td>
                          <td className="p-4 text-slate-600">{s.paymentTiming || "-"}</td>
                          <td className="p-4 text-slate-600">
                            {s.paymentFeeAmount != null ? `${formatAmount(s.paymentFeeAmount)}원` : "-"}
                          </td>
                          <td className="p-4 text-slate-600">
                            {s.paymentNetAmount != null ? `${formatAmount(s.paymentNetAmount)}원` : "-"}
                          </td>
                          <td className="p-4 text-slate-600">
                            {s.paidAt ? new Date(s.paidAt).toLocaleString() : "-"}
                          </td>
                        </>
                      ) : null}
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          getSettlementStatusBadgeClass(settlementStatus)
                        }`}>
                          {SETTLEMENT_STATUS_LABELS[settlementStatus]}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-2">
                          <select
                            value={selectedSettlementStatus}
                            onChange={(e) =>
                              setSelectedSettlementStatusByOrder((prev) => ({
                                ...prev,
                                [s.orderId]: e.target.value as SettlementWorkflowStatus,
                              }))
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700"
                          >
                            {SETTLEMENT_STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {SETTLEMENT_STATUS_LABELS[option]}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => void handleApplySettlementStatus(s)}
                              disabled={isSubmitting || selectedSettlementStatus === settlementStatus}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                isSubmitting || selectedSettlementStatus === settlementStatus
                                  ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                                  : "bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
                              }`}
                            >
                              {isSubmitting ? "처리중..." : "상태 적용"}
                            </button>
                            <button 
                              onClick={() => void handlePayout(s.orderId)}
                              disabled={settlementDone || settlementHeld || paymentLocked || isSubmitting}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                settlementDone
                                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : settlementHeld
                                    ? "bg-amber-50 text-amber-600 border-amber-200 cursor-not-allowed"
                                    : paymentLocked
                                      ? "bg-amber-50 text-amber-600 border-amber-200 cursor-not-allowed"
                                      : isSubmitting
                                        ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                                        : "bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
                              }`}
                            >
                              {settlementDone
                                ? "지급 완료"
                                : settlementHeld
                                  ? "지급 보류"
                                  : paymentLocked
                                    ? "입금 대기"
                                    : isSubmitting
                                      ? "처리중..."
                                      : "지급 실행"}
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              if (isOpsExpanded) {
                                setExpandedOrderId(null);
                                return;
                              }
                              setExpandedOrderId(s.orderId);
                              void loadDriverOpsPanel(s);
                            }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100"
                          >
                            {isOpsExpanded ? "운영 패널 닫기" : "지급 운영 보기"}
                          </button>
                          {isOpsExpanded ? (
                            <button
                              onClick={() => void handleSyncPayout(s)}
                              disabled={isSubmitting}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                                isSubmitting
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {isSubmitting ? "동기화중..." : "지급 상태 동기화"}
                            </button>
                          ) : null}
                          {opsState ? (
                            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] text-slate-500">
                              <div>payout {opsState.payoutItem?.status ?? "미생성"}</div>
                              <div>
                                seller{" "}
                                {opsState.sellerInfo?.sellerStatus ??
                                  opsState.payoutItem?.sellerStatus ??
                                  "연결 대기"}
                              </div>
                              <div>
                                webhook{" "}
                                {formatCompactDateTime(
                                  opsState.payoutItem?.lastWebhookProcessedAt ??
                                    opsState.payoutItem?.lastWebhookReceivedAt ??
                                    opsState.payoutItem?.completedAt ??
                                    opsState.payoutItem?.requestedAt
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {isOpsExpanded ? (
                      <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                        <td colSpan={tableColumnCount} className="p-4">
                          <DriverPayoutMonitorPanel
                            settlement={s}
                            payoutItem={opsState?.payoutItem ?? null}
                            payoutItemMessage={opsState?.payoutItemMessage ?? null}
                            sellerInfo={opsState?.sellerInfo ?? null}
                            sellerMessage={opsState?.sellerMessage ?? null}
                            isLoading={opsState?.isLoading ?? false}
                            onRefresh={() => void loadDriverOpsPanel(s)}
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
        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 border-t border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-9 min-w-9 rounded-lg px-3 text-sm font-bold ${
                  currentPage === page
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-500"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
