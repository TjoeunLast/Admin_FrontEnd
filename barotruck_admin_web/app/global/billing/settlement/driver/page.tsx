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

export default function DriverSettlementPage() {
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [showPaymentColumns, setShowPaymentColumns] = useState(false);
  const [submittingOrderId, setSubmittingOrderId] = useState<number | null>(null);
  const [selectedSettlementStatusByOrder, setSelectedSettlementStatusByOrder] =
    useState<Record<number, SettlementWorkflowStatus>>({});

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

  const formatAmount = (value: number) => new Intl.NumberFormat("ko-KR").format(value);

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
      await paymentAdminApi.updateSettlementStatus(orderId, "COMPLETED");
      alert("지급 처리가 완료되었습니다.");
      await loadSettlements();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "지급 처리 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setSubmittingOrderId((prev) => (prev === orderId ? null : prev));
    }
  };

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
        alert("정산 상태가 변경되었습니다.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "정산 상태 변경 중 오류가 발생했습니다.";
        alert(message);
      } finally {
        setSubmittingOrderId((prev) => (prev === settlement.orderId ? null : prev));
      }
    },
    [loadSettlements, selectedSettlementStatusByOrder]
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

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        차주 정산 상태는 서버의 관리자 정산 상태 API로 전환됩니다. `지급 보류`, `지급 대기`, `지급 완료`를 변경하면 백엔드가 결제/분쟁 상태도 같이 정리합니다.
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <table className="w-full text-sm text-center">
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
              <tr><td colSpan={showPaymentColumns ? 13 : 7} className="p-10 text-slate-400">데이터를 불러오는 중...</td></tr>
            ) : filteredSettlements.length === 0 ? (
              <tr><td colSpan={showPaymentColumns ? 13 : 7} className="p-10 text-slate-400">표시할 정산 내역이 없습니다.</td></tr>
            ) : (
              filteredSettlements.map((s) => {
                const settlementStatus = getEffectiveSettlementStatus(s);
                const settlementDone = isSettlementCompleted(s);
                const settlementHeld = settlementStatus === "WAIT";
                const paymentLocked =
                  hasPaymentTracking(s) && !isPaymentCompleted(s);
                const isSubmitting = submittingOrderId === s.orderId;
                const selectedSettlementStatus =
                  selectedSettlementStatusByOrder[s.orderId] ?? settlementStatus;

                return (
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
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
