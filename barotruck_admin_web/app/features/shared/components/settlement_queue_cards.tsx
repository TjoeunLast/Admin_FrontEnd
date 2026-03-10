"use client";

import { AdminSettlementQueueItem } from "@/app/features/shared/lib/admin_settlement_overview";

interface SettlementQueueCardsProps {
  items: AdminSettlementQueueItem[];
}

const toneClassMap: Record<AdminSettlementQueueItem["tone"], string> = {
  slate: "border-slate-200 bg-white text-slate-900",
  blue: "border-blue-100 bg-blue-50 text-blue-900",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-900",
  amber: "border-amber-100 bg-amber-50 text-amber-900",
  rose: "border-rose-100 bg-rose-50 text-rose-900",
};

const amountToneClassMap: Record<AdminSettlementQueueItem["tone"], string> = {
  slate: "text-slate-900",
  blue: "text-blue-700",
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  rose: "text-rose-700",
};

const formatAmount = (value: number) =>
  `₩${new Intl.NumberFormat("ko-KR").format(value || 0)}`;

export function SettlementQueueCards({ items }: SettlementQueueCardsProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-bold text-slate-700">운영 큐</h2>
        <p className="text-xs text-slate-400">지금 바로 처리해야 할 상태별 건수를 분리해 보여줍니다.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        {items.map((item) => (
          <div
            key={item.key}
            className={`rounded-2xl border p-4 shadow-sm ${toneClassMap[item.tone]}`}
          >
            <div className="text-xs font-bold uppercase tracking-wider opacity-70">
              {item.title}
            </div>
            <div className={`mt-2 text-xl font-black ${amountToneClassMap[item.tone]}`}>
              {formatAmount(item.amount)}
            </div>
            <div className="mt-2 text-xs opacity-70">{item.count}건</div>
          </div>
        ))}
      </div>
    </section>
  );
}
