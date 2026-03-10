"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  paymentAdminApi,
  SettlementResponse,
  TransportPaymentStatus,
} from "@/app/features/shared/api/payment_admin_api";
import {
  calculateAdminSettlementOverview,
  getEffectivePaymentStatus,
  getBillingAmount,
  isPaymentCompleted,
  PAYMENT_STATUS_LABELS,
} from "@/app/features/shared/lib/admin_settlement_overview";

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

const getPaymentStatusBadgeClass = (status: TransportPaymentStatus): string => {
  if (status === "PAID" || status === "CONFIRMED" || status === "ADMIN_FORCE_CONFIRMED") {
    return "bg-green-50 text-green-600";
  }
  if (status === "DISPUTED" || status === "ADMIN_HOLD") {
    return "bg-amber-50 text-amber-700";
  }
  if (status === "ADMIN_REJECTED" || status === "CANCELLED") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-slate-100 text-slate-600";
};

const needsPaymentMemo = (status: TransportPaymentStatus): boolean =>
  status === "DISPUTED" || status.startsWith("ADMIN_");

const needsProofUrl = (settlement: SettlementResponse): boolean =>
  String(settlement.paymentMethod ?? "").toUpperCase() === "TRANSFER";

const getPaymentStatusColumnText = (settlement: SettlementResponse): string => {
  const paymentStatus = getEffectivePaymentStatus(settlement);
  return PAYMENT_STATUS_LABELS[paymentStatus] ?? settlement.paymentStatus ?? "-";
};

export default function ShipperSettlementPage() {
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [showPaymentColumns, setShowPaymentColumns] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState<number | null>(null);
  const [selectedPaymentStatusByOrder, setSelectedPaymentStatusByOrder] = useState<
    Record<number, TransportPaymentStatus>
  >({});

  const loadSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await paymentAdminApi.getSettlements();
      setSettlements(data);
    } catch (err) {
      console.error("화주 정산 데이터 로드 실패: ", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  const formatAmount = (num: number) => new Intl.NumberFormat("ko-KR").format(num);
  const overview = useMemo(
    () => calculateAdminSettlementOverview(settlements),
    [settlements]
  );
  const cards = useMemo(
    () => [
      {
        title: "화주 총 청구액",
        amount: overview.totalBillingAmount,
        meta: `청구 ${overview.totalCount}건`,
        className: "bg-[#0f172a] text-white shadow-sm",
        titleClassName: "text-sm text-slate-300 font-medium",
        amountClassName: "text-2xl font-black mt-1",
        metaClassName: "text-xs text-slate-400 mt-2",
      },
      {
        title: "화주 입금액",
        amount: overview.completedBillingAmount,
        meta: `입금 완료 ${overview.completedPaymentCount}건`,
        className: "bg-white border border-[#e2e8f0] shadow-sm",
        titleClassName: "text-sm text-[#64748b] font-medium",
        amountClassName: "text-2xl font-black text-[#10b981] mt-1",
        metaClassName: "text-xs text-slate-400 mt-2",
      },
      {
        title: "화주 미수금 (미입금)",
        amount: overview.pendingBillingAmount,
        meta: `미입금 ${overview.pendingPaymentCount}건`,
        className: "bg-white border border-[#e2e8f0] shadow-sm",
        titleClassName: "text-sm text-[#64748b] font-medium",
        amountClassName: "text-2xl font-black text-[#ef4444] mt-1",
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
    let filtered = settlements;

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.shipperName.toLowerCase().includes(term) ||
          s.bizNumber.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "전체 상태") {
      if (statusFilter === "입금 완료") {
        filtered = filtered.filter((s) => isPaymentCompleted(s));
      } else if (statusFilter === "입금 대기") {
        filtered = filtered.filter((s) => !isPaymentCompleted(s));
      }
    }

    return filtered;
  }, [searchTerm, statusFilter, settlements]);

  const handleApplyPaymentStatus = useCallback(
    async (settlement: SettlementResponse) => {
      const currentStatus = getEffectivePaymentStatus(settlement);
      const nextStatus =
        selectedPaymentStatusByOrder[settlement.orderId] ?? currentStatus;

      if (nextStatus === currentStatus) {
        alert("변경할 결제 상태를 선택하세요.");
        return;
      }

      let adminMemo: string | null | undefined;
      if (needsPaymentMemo(nextStatus)) {
        const input = window.prompt("관리 메모를 입력하세요. 비워두면 메모 없이 처리됩니다.", "");
        if (input === null) {
          return;
        }
        adminMemo = input.trim() || null;
      }

      if (!confirm(`주문 #${settlement.orderId} 결제 상태를 ${PAYMENT_STATUS_LABELS[nextStatus]}로 변경하시겠습니까?`)) {
        return;
      }

      try {
        setSubmittingOrderId(settlement.orderId);
        await paymentAdminApi.updatePaymentStatus(settlement.orderId, {
          status: nextStatus,
          adminMemo,
          method: settlement.paymentMethod,
          paymentTiming: settlement.paymentTiming,
          proofUrl: settlement.proofUrl,
        });
        await loadSettlements();
        setSelectedPaymentStatusByOrder((prev) => {
          const next = { ...prev };
          delete next[settlement.orderId];
          return next;
        });
        alert("결제 상태가 변경되었습니다.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "결제 상태 변경 중 오류가 발생했습니다.";
        alert(message);
      } finally {
        setSubmittingOrderId((prev) => (prev === settlement.orderId ? null : prev));
      }
    },
    [loadSettlements, selectedPaymentStatusByOrder]
  );

  const handleQuickMarkPaid = useCallback(
    async (settlement: SettlementResponse) => {
      if (getEffectivePaymentStatus(settlement) !== "READY") {
        alert("결제 준비 상태에서만 빠른 입금 반영을 사용할 수 있습니다.");
        return;
      }

      let proofUrl = settlement.proofUrl ?? null;
      if (needsProofUrl(settlement)) {
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
        const message =
          error instanceof Error ? error.message : "입금 반영 중 오류가 발생했습니다.";
        alert(message);
      } finally {
        setSubmittingOrderId((prev) => (prev === settlement.orderId ? null : prev));
      }
    },
    [loadSettlements]
  );

  return (
    <main className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e293b]">정산 및 매출 관리</h1>
          <p className="text-sm text-[#64748b] mt-1">화주 청구 및 차주 지급 현황을 통합 관리합니다.</p>
        </div>
        <div className="bg-[#e2e8f0] p-1 rounded-xl flex gap-1 shadow-inner">
          <Link href="/global/billing/settlement/driver">
            <button className="px-5 py-2 rounded-lg text-sm font-bold text-[#64748b] hover:bg-white/50 transition-all">
              차주 정산
            </button>
          </Link>
          <button className="px-5 py-2 rounded-lg text-sm font-bold bg-white text-[#1e293b] shadow-sm">
            화주 정산
          </button>
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
          placeholder="화주명 또는 사업자번호를 검색하세요"
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
          <option>입금 완료</option>
          <option>입금 대기</option>
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
        <table className={`w-full min-w-[960px] text-sm text-center ${showPaymentColumns ? "xl:min-w-[1480px]" : ""}`}>
          <thead className="bg-[#f8fafc] border-b-2 border-[#e2e8f0]">
            <tr className="text-[#64748b] font-bold">
              <th className="p-4 w-12"><input type="checkbox" /></th>
              <th className="p-4 min-w-[180px] whitespace-nowrap">청구 대상(화주)</th>
              <th className="p-4 min-w-[120px] whitespace-nowrap">청구 발생일</th>
              <th className="p-4 min-w-[120px] whitespace-nowrap">총 청구액</th>
              {showPaymentColumns ? (
                <>
                  <th className="p-4 min-w-[110px] whitespace-nowrap">결제 상태</th>
                  <th className="p-4 min-w-[110px] whitespace-nowrap">결제 수단</th>
                  <th className="p-4 min-w-[110px] whitespace-nowrap">결제 시점</th>
                  <th className="p-4 min-w-[120px] whitespace-nowrap">결제금액</th>
                  <th className="p-4 min-w-[110px] whitespace-nowrap">수수료</th>
                  <th className="p-4 min-w-[180px] whitespace-nowrap">PG/증빙</th>
                </>
              ) : null}
              <th className="p-4 min-w-[100px] whitespace-nowrap">입금 상태</th>
              <th className="p-4 min-w-[280px] whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={showPaymentColumns ? 12 : 6} className="p-10 text-center">데이터 로딩 중...</td></tr>
            ) : filteredSettlements.length === 0 ? (
              <tr><td colSpan={showPaymentColumns ? 12 : 6} className="p-10 text-center">정산 내역이 없습니다.</td></tr>
            ) : (
              filteredSettlements.map((s) => {
                const paymentStatus = getEffectivePaymentStatus(s);
                const isSubmitting = submittingOrderId === s.orderId;
                const selectedStatus =
                  selectedPaymentStatusByOrder[s.orderId] ?? paymentStatus;

                return (
                  <tr key={s.settlementId} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all">
                    <td className="p-4 text-center"><input type="checkbox" /></td>
                    <td className="p-4 text-center">
                      <div className="font-bold text-[#1e293b]">{s.shipperName}</div>
                      <div className="text-[11px] text-[#94a3b8] mt-0.5">{s.bizNumber}</div>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap text-[#64748b]">
                      {s.feeDate ? new Date(s.feeDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap font-black text-[#1e293b]">
                      ₩{formatAmount(getBillingAmount(s))}
                    </td>
                    {showPaymentColumns ? (
                      <>
                        <td
                          className="p-4 text-center text-[#64748b]"
                          title={s.paymentStatus || getPaymentStatusColumnText(s)}
                        >
                          <span className="inline-flex max-w-[92px] items-center justify-center truncate rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                            {getPaymentStatusColumnText(s)}
                          </span>
                        </td>
                        <td className="p-4 text-center text-[#64748b]">
                          <span className="inline-block max-w-[92px] truncate align-middle" title={s.paymentMethod || "-"}>
                            {s.paymentMethod || "-"}
                          </span>
                        </td>
                        <td className="p-4 text-center text-[#64748b]">
                          <span className="inline-block max-w-[92px] truncate align-middle" title={s.paymentTiming || "-"}>
                            {s.paymentTiming || "-"}
                          </span>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap text-[#64748b]">
                          {s.paymentAmount != null ? `₩${formatAmount(s.paymentAmount)}` : "-"}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap text-[#64748b]">
                          {s.paymentFeeAmount != null ? `₩${formatAmount(s.paymentFeeAmount)}` : "-"}
                        </td>
                        <td className="p-4 text-center text-[#64748b]">
                          <span className="inline-block max-w-[160px] truncate align-middle" title={s.pgTid || s.proofUrl || "-"}>
                            {s.pgTid || s.proofUrl || "-"}
                          </span>
                        </td>
                      </>
                    ) : null}
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        getPaymentStatusBadgeClass(paymentStatus)
                      }`}>
                        {PAYMENT_STATUS_LABELS[paymentStatus]}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <select
                          value={selectedStatus}
                          onChange={(e) =>
                            setSelectedPaymentStatusByOrder((prev) => ({
                              ...prev,
                              [s.orderId]: e.target.value as TransportPaymentStatus,
                            }))
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700"
                        >
                          {PAYMENT_STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {PAYMENT_STATUS_LABELS[option]}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => void handleQuickMarkPaid(s)}
                            disabled={isSubmitting || paymentStatus !== "READY"}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              isSubmitting || paymentStatus !== "READY"
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                            }`}
                          >
                            {isSubmitting ? "처리중..." : "입금 반영"}
                          </button>
                          <button
                            onClick={() => void handleApplyPaymentStatus(s)}
                            disabled={isSubmitting || selectedStatus === paymentStatus}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              isSubmitting || selectedStatus === paymentStatus
                                ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                                : "bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
                            }`}
                          >
                            {isSubmitting ? "처리중..." : "상태 적용"}
                          </button>
                          <Link href={`/global/billing/settlement/shipper/${s.orderId}`}>
                            <button className="bg-white border border-[#cbd5e1] text-[#64748b] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100">
                              내역보기
                            </button>
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </main>
  );
}
