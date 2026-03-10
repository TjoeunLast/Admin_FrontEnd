"use client";

import { SettlementStatusSummaryResponse } from "@/app/features/shared/api/payment_admin_api";

interface SettlementSummaryCardProps {
  summary: SettlementStatusSummaryResponse | null;
  isLoading: boolean;
}

const formatAmount = (value: number) =>
  `${new Intl.NumberFormat("ko-KR").format(value || 0)}`;

export function SettlementSummaryCard({
  summary,
  isLoading,
}: SettlementSummaryCardProps) {
  const cards = [
    {
      title: "정산 총액",
      amount: summary?.totalAmount ?? 0,
      meta: `전체 ${summary?.totalCount ?? 0}건`,
      accent: "text-[#4E46E5]",
    },
    {
      title: "정산 대기",
      amount: summary?.pendingAmount ?? 0,
      meta: `대기 ${summary?.pendingCount ?? 0}건`,
      accent: "text-amber-500",
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
        <h2 className="text-md font-bold text-slate-700">정산 운영 요약</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-sm font-medium text-slate-500 mb-1">
              {card.title}
            </div>
            <div className={`text-3xl font-bold text-slate-900 ${card.accent}`}>
              {isLoading ? "-" : formatAmount(card.amount)}
              {""}
              <span className="text-sm font-bold text-slate-400 ml-0.5">
                원
              </span>
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
