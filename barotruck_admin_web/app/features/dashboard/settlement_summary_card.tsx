"use client";

import { AdminSettlementOverview } from "@/app/features/shared/lib/admin_settlement_overview";

interface SettlementSummaryCardProps {
  overview: AdminSettlementOverview;
  isLoading: boolean;
  errorMessage?: string | null;
}

const formatAmount = (value: number) =>
  `₩${new Intl.NumberFormat("ko-KR").format(value || 0)}`;

const buildCardValue = (
  isLoading: boolean,
  errorMessage: string | null | undefined,
  value: number
) => {
  if (isLoading) {
    return "-";
  }
  if (errorMessage) {
    return "오류";
  }
  return formatAmount(value);
};

const buildCardMeta = (
  isLoading: boolean,
  errorMessage: string | null | undefined,
  value: string
) => {
  if (isLoading) {
    return "집계 불러오는 중";
  }
  if (errorMessage) {
    return errorMessage;
  }
  return value;
};

export function SettlementSummaryCard({
  overview,
  isLoading,
  errorMessage,
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
      title: "플랫폼 수수료 수익",
      amount: overview.totalFeeAmount,
      meta: "입금 완료 건 기준 누적 수수료",
      accent: "text-blue-700",
      border: "border-blue-100",
    },
  ];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-bold text-slate-700">정산 운영 요약</h2>
        <p className="text-xs text-slate-400">핵심 지표 4개만 표시합니다.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl border ${card.border} bg-white p-5 shadow-sm`}
          >
            <div className="text-sm font-medium text-slate-500 mb-1">
              {card.title}
            </div>
            <div className={`mt-2 text-2xl font-black ${card.accent}`}>
              {buildCardValue(isLoading, errorMessage, card.amount)}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {buildCardMeta(isLoading, errorMessage, card.meta)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
