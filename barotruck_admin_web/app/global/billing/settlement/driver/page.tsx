"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  paymentAdminApi,
  SettlementResponse,
  SettlementWorkflowStatus,
} from "@/app/features/shared/api/payment_admin_api";
import {
  calculateAdminSettlementOverview,
  getEffectiveSettlementStatus,
  getPayoutAmount,
  hasPaymentTracking,
  isPaymentCompleted,
  isSettlementCompleted,
  SETTLEMENT_STATUS_LABELS,
} from "@/app/features/shared/lib/admin_settlement_overview";

const SETTLEMENT_STATUS_OPTIONS: SettlementWorkflowStatus[] = [
  "READY",
  "WAIT",
  "COMPLETED",
];

export default function DriverSettlementPage() {
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPaymentColumns, setShowPaymentColumns] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState<number | null>(
    null,
  );
  const [selectedSettlementStatusByOrder, setSelectedSettlementStatusByOrder] =
    useState<Record<number, SettlementWorkflowStatus>>({});
  const itemsPerPage = 20;

  const loadSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await paymentAdminApi.getSettlements();
      setSettlements(data || []);
    } catch (error) {
      console.error("정산 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  const overview = useMemo(
    () => calculateAdminSettlementOverview(settlements),
    [settlements],
  );

  const stats = useMemo(
    () => [
      {
        title: "차주 총 지급 대상액",
        value: overview.totalPayoutAmount,
        label: "원",
        color: "text-slate-900",
      },
      {
        title: "차주 지급 대기액",
        value: overview.pendingPayoutAmount,
        label: "원",
        color: "text-amber-600",
      },
      {
        title: "차주 지급 완료액",
        value: overview.completedPayoutAmount,
        label: "원",
        color: "text-emerald-600",
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

  const totalPages = Math.ceil(filteredSettlements.length / itemsPerPage);
  const paginatedSettlements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSettlements.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredSettlements]);

  const formatAmount = (value: number) =>
    new Intl.NumberFormat("ko-KR").format(value);

  const getStatusClass = (status: SettlementWorkflowStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "WAIT":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  const handlePayout = async (orderId: number) => {
    const settlement = settlements.find((item) => item.orderId === orderId);
    if (!settlement) return;
    const settlementStatus = getEffectiveSettlementStatus(settlement);
    if (hasPaymentTracking(settlement) && !isPaymentCompleted(settlement)) {
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
      await paymentAdminApi.updateSettlementStatus(orderId, "COMPLETED");
      alert("지급 처리가 완료되었습니다.");
      await loadSettlements();
    } catch (error) {
      alert("오류가 발생했습니다.");
    } finally {
      setSubmittingOrderId(null);
    }
  };

  const handleApplySettlementStatus = useCallback(
    async (settlement: SettlementResponse) => {
      const currentStatus = getEffectiveSettlementStatus(settlement);
      const nextStatus =
        selectedSettlementStatusByOrder[settlement.orderId] ?? currentStatus;
      if (nextStatus === currentStatus) return;
      let adminMemo: string | null = null;
      if (nextStatus === "WAIT" || nextStatus === "READY") {
        const input = window.prompt("메모를 입력하세요.", "");
        if (input === null) return;
        adminMemo = input.trim() || null;
      }
      try {
        setSubmittingOrderId(settlement.orderId);
        await paymentAdminApi.updateSettlementStatus(
          settlement.orderId,
          nextStatus,
          adminMemo,
        );
        await loadSettlements();
        alert("정산 상태가 변경되었습니다.");
      } catch (error) {
        alert("변경 중 오류가 발생했습니다.");
      } finally {
        setSubmittingOrderId(null);
      }
    },
    [loadSettlements, selectedSettlementStatusByOrder],
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
      <header className="mb-8 pl-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          정산 및 매출 관리
        </h1>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-sm">
            차주 정산
          </button>
          <Link href="/global/billing/settlement/shipper">
            <button className="text-slate-500 px-4 py-2 rounded-lg font-bold text-sm hover:bg-white/50 transition-all">
              화주 정산
            </button>
          </Link>
        </div>
      </header>

      {/* 주문 목록 페이지와 동일한 카드 디자인 */}
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
            정산 상태
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="전체 상태">전체 상태</option>
            <option value="지급 대기">지급 대기</option>
            <option value="지급 완료">지급 완료</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">
            차주 검색
          </label>
          <input
            type="text"
            placeholder="차주명을 입력하세요"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            id="moreCol"
            checked={showPaymentColumns}
            onChange={(e) => setShowPaymentColumns(e.target.checked)}
          />
          <label
            htmlFor="moreCol"
            className="text-sm font-bold text-slate-500 cursor-pointer"
          >
            상세 컬럼
          </label>
        </div>
      </div>

      {/* 테이블 영역 통일 */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="w-24 p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                차주
              </th>
              <th className="w-[20%] p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                계좌 정보
              </th>
              <th className="w-32 p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                완료일
              </th>
              <th className="w-32 p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                지급액
              </th>
              {showPaymentColumns && (
                <th className="p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  결제상태
                </th>
              )}
              <th className="p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider w-28">
                상태
              </th>
              <th className="p-5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider w-44">
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
                const status = getEffectiveSettlementStatus(s);
                return (
                  <tr
                    key={s.settlementId}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="p-5 text-sm font-bold text-slate-800">
                      {s.driverName || `차주(${s.driverUserId})`}
                    </td>
                    <td className="p-5 text-xs text-slate-500 font-medium truncate">
                      {s.bankName} {s.accountNum || "정보없음"}
                    </td>
                    <td className="p-5 text-xs text-slate-500 font-medium">
                      {s.feeDate
                        ? new Date(s.feeDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-5 text-sm font-bold text-slate-900">
                      {formatAmount(getPayoutAmount(s))}원
                    </td>
                    {showPaymentColumns && (
                      <td className="p-5 text-xs font-bold text-blue-600">
                        {s.paymentStatus || "-"}
                      </td>
                    )}
                    <td className="p-5">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${getStatusClass(status)}`}
                      >
                        {SETTLEMENT_STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="p-5 flex items-center justify-center gap-2">
                      <select
                        value={
                          selectedSettlementStatusByOrder[s.orderId] ?? status
                        }
                        onChange={(e) =>
                          setSelectedSettlementStatusByOrder((prev) => ({
                            ...prev,
                            [s.orderId]: e.target.value as any,
                          }))
                        }
                        className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none"
                      >
                        {SETTLEMENT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {SETTLEMENT_STATUS_LABELS[opt]}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleApplySettlementStatus(s)}
                        disabled={submittingOrderId === s.orderId}
                        className="bg-slate-900 text-white px-2 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 disabled:opacity-30"
                      >
                        적용
                      </button>
                      <button
                        onClick={() => handlePayout(s.orderId)}
                        disabled={
                          isSettlementCompleted(s) ||
                          status === "WAIT" ||
                          submittingOrderId === s.orderId
                        }
                        className="border border-slate-900 text-slate-900 px-2 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-900 hover:text-white disabled:opacity-20"
                      >
                        {isSettlementCompleted(s) ? "완료" : "지급"}
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
  );
}
