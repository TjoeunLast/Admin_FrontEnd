"use client";

import { AdminSettlementOverview } from "@/app/features/shared/lib/admin_settlement_overview";

interface SettlementSummaryCardProps {
  overview: AdminSettlementOverview;
  isLoading: boolean;
  errorMessage?: string | null;
}

const formatAmount = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(value || 0);

const buildCardValue = (
  isLoading: boolean,
  errorMessage: string | null | undefined,
  value: number,
) => {
  if (isLoading) return "-";
  if (errorMessage) return "오류";
  return formatAmount(value);
};

const buildCardMeta = (
  isLoading: boolean,
  errorMessage: string | null | undefined,
  value: string,
) => {
  if (isLoading) return "집계 불러오는 중";
  if (errorMessage) return errorMessage;
  return value;
};

export function SettlementSummaryCard({
  overview,
  isLoading,
  errorMessage,
}: SettlementSummaryCardProps) {
  const cards = [
    {
      title: "화주 총 청구액",
      amount: overview.totalBillingAmount,
      meta: `청구 ${overview.totalCount}건`,
      accent: "text-slate-900",
      border: "border-slate-200",
    },
    {
      title: "화주 미수금",
      amount: overview.pendingBillingAmount,
      meta: `미입금 ${overview.pendingPaymentCount}건`,
      accent: "text-rose-600",
      border: "border-slate-200",
    },
    {
      title: "차주 지급 대기액",
      amount: overview.pendingPayoutAmount,
      meta: `지급 대기 ${overview.pendingSettlementCount}건`,
      accent: "text-amber-600",
      border: "border-slate-200",
    },
    {
      title: "플랫폼 수수료 수익",
      amount: overview.totalFeeAmount,
      meta: "누적 수수료 기준",
      accent: "text-blue-700",
      border: "border-slate-200",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="pl-1">
        <h2 className="text-lg font-bold text-slate-800">정산 운영 요약</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl border ${card.border} bg-white p-6 shadow-sm`}
          >
            <div className="text-sm font-medium text-slate-500 mb-1">
              {card.title}
            </div>

            <div
              className={`flex items-baseline gap-0.5 font-bold ${card.accent}`}
            >
              <span className="text-3xl tracking-tight">
                {buildCardValue(isLoading, errorMessage, card.amount)}
              </span>
              <span className="text-base">원</span>
            </div>

            <div className="mt-2 text-[12px] font-medium text-slate-500">
              {buildCardMeta(isLoading, errorMessage, card.meta)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
