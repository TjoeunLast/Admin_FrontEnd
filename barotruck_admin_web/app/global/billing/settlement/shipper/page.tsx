"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  paymentAdminApi,
  SettlementResponse,
  TransportPaymentStatus,
} from "@/app/features/shared/api/payment_admin_api";
import {
  calculateAdminSettlementOverview,
  calculateAdminSettlementQueues,
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
import { SettlementQueueCards } from "@/app/features/shared/components/settlement_queue_cards";
import { SettlementOpsFilterBar } from "@/app/features/shared/components/settlement_ops_filter_bar";
import { StatusChip } from "@/app/features/shared/components/status_chip";

const ITEMS_PER_PAGE = 20;
const PAYMENT_STATUS_OPTIONS: TransportPaymentStatus[] = [
  "READY",
  "PAID",
  "CONFIRMED",
  "DISPUTED",
  "ADMIN_HOLD",
  "ADMIN_FORCE_CONFIRMED",
  "ADMIN_REJECTED",
  "CANCELLED",
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

const formatAmount = (value: number) => `₩${new Intl.NumberFormat("ko-KR").format(value || 0)}`;
const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : "-");
const getPaymentMethodLabel = (value?: string | null) =>
  PAYMENT_METHOD_LABELS[String(value ?? "").trim().toUpperCase()] ?? value ?? "-";
const getPaymentTimingLabel = (value?: string | null) =>
  PAYMENT_TIMING_LABELS[String(value ?? "").trim().toUpperCase()] ?? value ?? "-";
const getLastSyncedAt = (settlement: SettlementResponse) =>
  settlement.confirmedAt ?? settlement.paidAt ?? settlement.feeCompleteDate ?? settlement.feeDate;

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

const needsPaymentMemo = (status: TransportPaymentStatus) =>
  status === "DISPUTED" || status.startsWith("ADMIN_");
const requiresTransferProof = (settlement: SettlementResponse) =>
  String(settlement.paymentMethod ?? "").toUpperCase() === "TRANSFER";

export default function ShipperSettlementPage() {
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체 정산");
  const [paymentFilter, setPaymentFilter] = useState("전체 결제");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaymentColumns, setShowPaymentColumns] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState<number | null>(null);
  const [selectedPaymentStatusByOrder, setSelectedPaymentStatusByOrder] = useState<
    Record<number, TransportPaymentStatus>
  >({});

  const loadSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      setSettlements(await paymentAdminApi.getSettlements());
    } catch (error) {
      console.error("화주 정산 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettlements();
  }, [loadSettlements]);

  const overview = useMemo(() => calculateAdminSettlementOverview(settlements), [settlements]);
  const queueItems = useMemo(() => calculateAdminSettlementQueues(settlements), [settlements]);
  const cards = useMemo(
    () => [
      { title: "화주 총 청구액", amount: overview.totalBillingAmount, meta: `청구 ${overview.totalCount}건`, tone: "text-slate-900" },
      { title: "화주 입금액", amount: overview.completedBillingAmount, meta: `입금 완료 ${overview.completedPaymentCount}건`, tone: "text-emerald-600" },
      { title: "화주 미수금", amount: overview.pendingBillingAmount, meta: `미입금 ${overview.pendingPaymentCount}건`, tone: "text-rose-600" },
      { title: "플랫폼 수수료 수익", amount: overview.totalFeeAmount, meta: "입금 완료 기준", tone: "text-blue-600" },
    ],
    [overview]
  );

  const filteredSettlements = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return settlements.filter((settlement) => {
      const paymentStatus = getEffectivePaymentStatus(settlement);
      const settlementStatus = getEffectiveSettlementStatus(settlement);
      const matchesSearch =
        !term ||
        String(settlement.orderId).includes(term) ||
        settlement.shipperName?.toLowerCase().includes(term) ||
        settlement.bizNumber?.toLowerCase().includes(term) ||
        settlement.driverName?.toLowerCase().includes(term);
      const matchesSettlement =
        statusFilter === "전체 정산" ||
        SETTLEMENT_STATUS_LABELS[settlementStatus] === statusFilter;
      const matchesPayment =
        paymentFilter === "전체 결제" ||
        (paymentFilter === "추적없음"
          ? !settlement.paymentStatus && !settlement.paymentMethod && !settlement.pgTid
          : PAYMENT_STATUS_LABELS[paymentStatus] === paymentFilter);
      return matchesSearch && matchesSettlement && matchesPayment;
    });
  }, [paymentFilter, searchTerm, settlements, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredSettlements.length, paymentFilter, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSettlements.length / ITEMS_PER_PAGE));
  const paginatedSettlements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSettlements.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredSettlements]);

  const handleApplyPaymentStatus = useCallback(
    async (settlement: SettlementResponse) => {
      const currentStatus = getEffectivePaymentStatus(settlement);
      const nextStatus = selectedPaymentStatusByOrder[settlement.orderId] ?? currentStatus;
      if (nextStatus === currentStatus) return alert("변경할 결제 상태를 선택하세요.");

      let adminMemo: string | null | undefined;
      if (needsPaymentMemo(nextStatus)) {
        const input = window.prompt("관리 메모를 입력하세요. 비워두면 메모 없이 처리됩니다.", "");
        if (input === null) return;
        adminMemo = input.trim() || null;
      }

      if (!confirm(`주문 #${settlement.orderId} 결제 상태를 ${PAYMENT_STATUS_LABELS[nextStatus]}로 변경하시겠습니까?`)) {
        return;
      }

      try {
        setSubmittingOrderId(settlement.orderId);
        await paymentAdminApi.updatePaymentStatus(settlement.orderId, {
          status: nextStatus,
          method: settlement.paymentMethod,
          paymentTiming: settlement.paymentTiming,
          proofUrl: settlement.proofUrl,
          adminMemo,
        });
        await loadSettlements();
        setSelectedPaymentStatusByOrder((prev) => {
          const next = { ...prev };
          delete next[settlement.orderId];
          return next;
        });
        alert("결제 상태가 변경되었습니다.");
      } catch (error) {
        alert(error instanceof Error ? error.message : "결제 상태 변경 중 오류가 발생했습니다.");
      } finally {
        setSubmittingOrderId((prev) => (prev === settlement.orderId ? null : prev));
      }
    },
    [loadSettlements, selectedPaymentStatusByOrder]
  );

  const handleQuickMarkPaid = useCallback(
    async (settlement: SettlementResponse) => {
      if (getEffectivePaymentStatus(settlement) !== "READY") {
        return alert("결제 준비 상태에서만 빠른 입금 반영을 사용할 수 있습니다.");
      }

      let proofUrl = settlement.proofUrl ?? null;
      if (requiresTransferProof(settlement)) {
        const input = window.prompt("계좌이체 결제는 증빙 URL이 필요합니다. URL을 입력하세요.", settlement.proofUrl ?? "");
        if (input === null) return;
        proofUrl = input.trim() || null;
        if (!proofUrl) return alert("계좌이체 결제는 증빙 URL이 필요합니다.");
      }

      if (!confirm(`주문 #${settlement.orderId} 건을 즉시 입금 반영하시겠습니까?`)) return;

      try {
        setSubmittingOrderId(settlement.orderId);
        await paymentAdminApi.markPaymentPaid(settlement.orderId, {
          method: settlement.paymentMethod ?? undefined,
          paymentTiming: settlement.paymentTiming ?? undefined,
          proofUrl,
          paidAt: new Date().toISOString(),
        });
        await loadSettlements();
        alert("입금 반영이 완료되었습니다.");
      } catch (error) {
        alert(error instanceof Error ? error.message : "입금 반영 중 오류가 발생했습니다.");
      } finally {
        setSubmittingOrderId((prev) => (prev === settlement.orderId ? null : prev));
      }
    },
    [loadSettlements]
  );

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">정산 및 매출 관리</h1>
          <p className="mt-1 text-sm text-slate-500">청구, 입금, 정산 상태를 분리해 화주 결제 운영을 처리합니다.</p>
        </div>
        <div className="flex rounded-2xl bg-slate-100 p-1 shadow-inner">
          <Link href="/global/billing/settlement/driver" className="rounded-xl px-5 py-2 text-sm font-bold text-slate-500 hover:bg-white/60">차주 정산</Link>
          <button className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-slate-900 shadow-sm">화주 정산</button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-bold text-slate-500">{card.title}</div>
            <div className={`mt-2 text-2xl font-black ${card.tone}`}>{formatAmount(card.amount)}</div>
            <div className="mt-2 text-xs text-slate-400">{card.meta}</div>
          </div>
        ))}
      </section>

      <SettlementQueueCards items={queueItems} />

      <SettlementOpsFilterBar
        searchPlaceholder="주문번호, 화주명, 사업자번호, 차주명을 검색하세요"
        searchValue={searchTerm}
        statusValue={statusFilter}
        statusOptions={STATUS_FILTER_OPTIONS}
        paymentValue={paymentFilter}
        paymentOptions={PAYMENT_FILTER_OPTIONS}
        showExtraColumns={showPaymentColumns}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onPaymentChange={setPaymentFilter}
        onToggleExtraColumns={setShowPaymentColumns}
      />

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className={`w-full min-w-[1120px] text-sm ${showPaymentColumns ? "xl:min-w-[1580px]" : ""}`}>
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr className="text-left text-xs font-black uppercase tracking-wider">
                <th className="px-5 py-4">주문 / 화주</th>
                <th className="px-4 py-4">차주</th>
                <th className="px-4 py-4">운송상태</th>
                <th className="px-4 py-4">결제상태</th>
                <th className="px-4 py-4">정산상태</th>
                <th className="px-4 py-4 text-right">총청구액</th>
                <th className="px-4 py-4">최근 동기화</th>
                {showPaymentColumns ? (
                  <>
                    <th className="px-4 py-4">결제수단</th>
                    <th className="px-4 py-4">결제시점</th>
                    <th className="px-4 py-4 text-right">수수료</th>
                    <th className="px-4 py-4">PG / 증빙</th>
                    <th className="px-4 py-4">입금시각</th>
                  </>
                ) : null}
                <th className="px-5 py-4 text-right">운영</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={showPaymentColumns ? 13 : 8} className="px-5 py-12 text-center text-slate-400">
                    데이터를 불러오는 중입니다.
                  </td>
                </tr>
              ) : paginatedSettlements.length === 0 ? (
                <tr>
                  <td colSpan={showPaymentColumns ? 13 : 8} className="px-5 py-12 text-center text-slate-400">
                    조건에 맞는 결제 운영 건이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedSettlements.map((settlement) => {
                  const orderStatus = getEffectiveOrderStatus(settlement);
                  const paymentStatus = getEffectivePaymentStatus(settlement);
                  const settlementStatus = getEffectiveSettlementStatus(settlement);
                  const selectedStatus =
                    selectedPaymentStatusByOrder[settlement.orderId] ?? paymentStatus;
                  const isSubmitting = submittingOrderId === settlement.orderId;
                  const needsAttention =
                    paymentStatus === "DISPUTED" ||
                    paymentStatus === "ADMIN_HOLD" ||
                    paymentStatus === "ADMIN_REJECTED" ||
                    !isPaymentCompleted(settlement);

                  return (
                    <tr key={settlement.orderId} className={needsAttention ? "bg-amber-50/40" : "bg-white"}>
                      <td className="px-5 py-5 align-top">
                        <Link
                          href={`/global/billing/settlement/shipper/${settlement.orderId}`}
                          className="text-sm font-black text-slate-900 hover:text-blue-700"
                        >
                          주문 #{settlement.orderId}
                        </Link>
                        <div className="mt-2 text-sm font-bold text-slate-700">{settlement.shipperName}</div>
                        <div className="mt-1 text-xs text-slate-400">{settlement.bizNumber}</div>
                      </td>
                      <td className="px-4 py-5 align-top">
                        <div className="text-sm font-bold text-slate-900">
                          {settlement.driverName || `차주 #${settlement.driverUserId}`}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          지급액 {formatAmount(getPayoutAmount(settlement))}
                        </div>
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
                      <td className="px-4 py-5 text-right align-top">
                        <div className="text-base font-black text-slate-900">
                          {formatAmount(getBillingAmount(settlement))}
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
                            {formatAmount(getFeeAmount(settlement))}
                          </td>
                          <td className="px-4 py-5 align-top text-sm text-slate-600">
                            <div className="max-w-[220px] truncate">{settlement.pgTid || settlement.proofUrl || "-"}</div>
                          </td>
                          <td className="px-4 py-5 align-top text-sm text-slate-600">
                            {formatDateTime(settlement.paidAt)}
                          </td>
                        </>
                      ) : null}
                      <td className="px-5 py-5 align-top">
                        <div className="flex flex-col items-end gap-2">
                          <select
                            value={selectedStatus}
                            onChange={(event) =>
                              setSelectedPaymentStatusByOrder((prev) => ({
                                ...prev,
                                [settlement.orderId]: event.target.value as TransportPaymentStatus,
                              }))
                            }
                            className="h-10 min-w-[112px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                          >
                            {PAYMENT_STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {PAYMENT_STATUS_LABELS[option]}
                              </option>
                            ))}
                          </select>
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => void handleApplyPaymentStatus(settlement)}
                              disabled={isSubmitting}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              상태 적용
                            </button>
                            <button
                              onClick={() => void handleQuickMarkPaid(settlement)}
                              disabled={isSubmitting || getEffectivePaymentStatus(settlement) !== "READY"}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              입금 반영
                            </button>
                          </div>
                          <Link
                            href={`/global/billing/settlement/shipper/${settlement.orderId}`}
                            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                          >
                            상세 운영
                          </Link>
                        </div>
                      </td>
                    </tr>
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
