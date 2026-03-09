"use client";

import { SettlementStatusSummaryResponse } from "@/app/features/shared/api/payment_admin_api";

interface SettlementSummaryCardProps {
  summary: SettlementStatusSummaryResponse | null;
  isLoading: boolean;
}

const formatAmount = (value: number) => `₩${new Intl.NumberFormat("ko-KR").format(value || 0)}`;

export function SettlementSummaryCard({
  summary,
  isLoading,
}: SettlementSummaryCardProps) {
  const cards = [
    {
      title: "정산 총액",
      amount: summary?.totalAmount ?? 0,
      meta: `전체 ${summary?.totalCount ?? 0}건`,
      accent: "text-slate-900",
    },
    {
      title: "정산 대기",
      amount: summary?.pendingAmount ?? 0,
      meta: `대기 ${summary?.pendingCount ?? 0}건`,
      accent: "text-amber-600",
    },
    {
      title: "정산 완료",
      amount: summary?.completedAmount ?? 0,
      meta: `완료 ${summary?.completedCount ?? 0}건`,
      accent: "text-emerald-600",
    },
  ];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-bold text-slate-700">정산 운영 요약</h2>
        <p className="text-xs text-slate-400">관리자 정산 상태 요약 API 기준</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {card.title}
            </div>
            <div className={`mt-2 text-2xl font-black ${card.accent}`}>
              {isLoading ? "-" : formatAmount(card.amount)}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {isLoading ? "요약 불러오는 중" : card.meta}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
