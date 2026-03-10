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
  if (
    status === "PAID" ||
    status === "CONFIRMED" ||
    status === "ADMIN_FORCE_CONFIRMED"
  ) {
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  }
  if (status === "DISPUTED" || status === "ADMIN_HOLD") {
    return "bg-amber-50 text-amber-600 border-amber-100";
  }
  if (status === "ADMIN_REJECTED" || status === "CANCELLED") {
    return "bg-rose-50 text-rose-600 border-rose-100";
  }
  return "bg-slate-50 text-slate-500 border-slate-200";
};

const needsPaymentMemo = (status: TransportPaymentStatus): boolean =>
  status === "DISPUTED" || status.startsWith("ADMIN_");

const needsProofUrl = (settlement: SettlementResponse): boolean =>
  String(settlement.paymentMethod ?? "").toUpperCase() === "TRANSFER";

const getPaymentStatusColumnText = (settlement: SettlementResponse): string => {
  const paymentStatus = getEffectivePaymentStatus(settlement);
  return (
    PAYMENT_STATUS_LABELS[paymentStatus] ?? settlement.paymentStatus ?? "-"
  );
};

export default function ShipperSettlementPage() {
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaymentColumns, setShowPaymentColumns] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState<number | null>(
    null,
  );
  const [selectedPaymentStatusByOrder, setSelectedPaymentStatusByOrder] =
    useState<Record<number, TransportPaymentStatus>>({});
  const itemsPerPage = 20;

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

  const formatAmount = (num: number) =>
    new Intl.NumberFormat("ko-KR").format(num);
  const overview = useMemo(
    () => calculateAdminSettlementOverview(settlements),
    [settlements],
  );

  const stats = useMemo(
    () => [
      {
        title: "화주 총 청구액",
        value: overview.totalBillingAmount,
        label: "원",
        color: "text-slate-900",
      },
      {
        title: "화주 입금액",
        value: overview.completedBillingAmount,
        label: "원",
        color: "text-emerald-600",
      },
      {
        title: "화주 미수금 (미입금)",
        value: overview.pendingBillingAmount,
        label: "원",
        color: "text-rose-600",
      },
      {
        title: "플랫폼 수수료 수익",
        value: overview.totalFeeAmount,
        label: "원",
        color: "text-blue-600",
      },
    ],
    [overview],
  );

  const filteredSettlements = useMemo(() => {
    let filtered = settlements;
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.shipperName.toLowerCase().includes(term) ||
          s.bizNumber.toLowerCase().includes(term),
      );
    }
    if (statusFilter !== "전체 상태") {
      if (statusFilter === "입금 완료")
        filtered = filtered.filter((s) => isPaymentCompleted(s));
      else if (statusFilter === "입금 대기")
        filtered = filtered.filter((s) => !isPaymentCompleted(s));
    }
    return filtered;
  }, [searchTerm, statusFilter, settlements]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, settlements.length]);
  const totalPages = Math.ceil(filteredSettlements.length / itemsPerPage);
  const paginatedSettlements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSettlements.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredSettlements]);

  const handleApplyPaymentStatus = useCallback(
    async (settlement: SettlementResponse) => {
      const currentStatus = getEffectivePaymentStatus(settlement);
      const nextStatus =
        selectedPaymentStatusByOrder[settlement.orderId] ?? currentStatus;
      if (nextStatus === currentStatus) {
        alert("변경할 결제 상태를 선택하세요.");
        return;
      }
      let adminMemo: string | null = null;
      if (needsPaymentMemo(nextStatus)) {
        const input = window.prompt("관리 메모를 입력하세요.", "");
        if (input === null) return;
        adminMemo = input.trim() || null;
      }
      if (!confirm(`주문 #${settlement.orderId} 결제 상태를 변경하시겠습니까?`))
        return;
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
        alert("변경되었습니다.");
      } catch (error) {
        alert("오류가 발생했습니다.");
      } finally {
        setSubmittingOrderId(null);
      }
    },
    [loadSettlements, selectedPaymentStatusByOrder],
  );

  const handleQuickMarkPaid = useCallback(
    async (settlement: SettlementResponse) => {
      if (getEffectivePaymentStatus(settlement) !== "READY") {
        alert("결제 준비 상태에서만 가능합니다.");
        return;
      }
      let proofUrl = settlement.proofUrl ?? null;
      if (needsProofUrl(settlement)) {
        const input = window.prompt(
          "증빙 URL을 입력하세요.",
          settlement.proofUrl ?? "",
        );
        if (input === null) return;
        proofUrl = input.trim() || null;
        if (!proofUrl) {
          alert("증빙 URL이 필요합니다.");
          return;
        }
      }
      if (!confirm(`입금 반영하시겠습니까?`)) return;
      try {
        setSubmittingOrderId(settlement.orderId);
        await paymentAdminApi.markPaymentPaid(settlement.orderId, {
          method: settlement.paymentMethod ?? undefined,
          paymentTiming: settlement.paymentTiming ?? undefined,
          proofUrl,
          paidAt: new Date().toISOString(),
        });
        await loadSettlements();
        alert("반영되었습니다.");
      } catch (error) {
        alert("오류가 발생했습니다.");
      } finally {
        setSubmittingOrderId(null);
      }
    },
    [loadSettlements],
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
      <header className="mb-8 pl-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          정산 및 매출 관리
        </h1>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <Link href="/global/billing/settlement/driver">
            <button className="text-slate-500 px-4 py-2 rounded-lg font-bold text-sm hover:bg-white/50 transition-all">
              차주 정산
            </button>
          </Link>
          <button className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-sm">
            화주 정산
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((s) => (
          <div
            key={s.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500 mb-1">{s.title}</p>
            <div className="flex items-baseline gap-1">
              <p className={`text-3xl font-bold ${s.color}`}>
                {formatAmount(s.value)}
              </p>
              <span className="text-sm font-medium text-slate-400">
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 필터 섹션 통일 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 flex gap-4 items-end shadow-sm">
        <div className="w-44">
          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">
            입금 상태
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="전체 상태">전체 상태</option>
            <option value="입금 완료">입금 완료</option>
            <option value="입금 대기">입금 대기</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">
            화주 검색
          </label>
          <input
            type="text"
            placeholder="화주명 또는 사업자번호를 입력하세요"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            id="payCol"
            checked={showPaymentColumns}
            onChange={(e) => setShowPaymentColumns(e.target.checked)}
          />
          <label
            htmlFor="payCol"
            className="text-sm font-bold text-slate-500 cursor-pointer"
          >
            상세 컬럼
          </label>
        </div>
      </div>

      {/* 테이블 영역 통일 */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="w-44 p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  청구 대상
                </th>
                <th className="w-32 p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  청구일
                </th>
                <th className="w-32 p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  청구액
                </th>
                {showPaymentColumns && (
                  <th className="w-32 p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    결제금액
                  </th>
                )}
                <th className="p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28">
                  상태
                </th>
                <th className="p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider w-64">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-center">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-10 text-slate-400 font-medium">
                    로딩 중...
                  </td>
                </tr>
              ) : (
                paginatedSettlements.map((s) => {
                  const pStatus = getEffectivePaymentStatus(s);
                  return (
                    <tr
                      key={s.settlementId}
                      className="hover:bg-slate-50/50 transition-all group"
                    >
                      <td className="p-5 text-left">
                        <div className="font-bold text-slate-800 text-sm">
                          {s.shipperName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {s.bizNumber}
                        </div>
                      </td>
                      <td className="p-5 text-xs text-slate-500">
                        {s.feeDate
                          ? new Date(s.feeDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="p-5 text-sm font-bold text-slate-900">
                        {formatAmount(getBillingAmount(s))}원
                      </td>
                      {showPaymentColumns && (
                        <td className="p-5 text-sm font-bold text-blue-600">
                          {s.paymentAmount
                            ? `${formatAmount(s.paymentAmount)}원`
                            : "-"}
                        </td>
                      )}
                      <td className="p-5">
                        <span
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${getPaymentStatusBadgeClass(pStatus)}`}
                        >
                          {PAYMENT_STATUS_LABELS[pStatus]}
                        </span>
                      </td>
                      <td className="p-5 flex items-center justify-center gap-2">
                        <select
                          value={
                            selectedPaymentStatusByOrder[s.orderId] ?? pStatus
                          }
                          onChange={(e) =>
                            setSelectedPaymentStatusByOrder((prev) => ({
                              ...prev,
                              [s.orderId]: e.target.value as any,
                            }))
                          }
                          className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none"
                        >
                          {PAYMENT_STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {PAYMENT_STATUS_LABELS[opt]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleQuickMarkPaid(s)}
                          disabled={
                            pStatus !== "READY" ||
                            submittingOrderId === s.orderId
                          }
                          className="bg-emerald-600 text-white px-2 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 disabled:opacity-30"
                        >
                          입금
                        </button>
                        <button
                          onClick={() => handleApplyPaymentStatus(s)}
                          disabled={submittingOrderId === s.orderId}
                          className="bg-slate-900 text-white px-2 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 disabled:opacity-30"
                        >
                          적용
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
