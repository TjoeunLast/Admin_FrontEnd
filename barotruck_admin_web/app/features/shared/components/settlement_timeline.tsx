"use client";

export interface SettlementTimelineItem {
  key: string;
  title: string;
  value: string;
  description?: string;
  tone?: "slate" | "blue" | "emerald" | "amber" | "rose";
}

interface SettlementTimelineProps {
  title?: string;
  description?: string;
  items: SettlementTimelineItem[];
}

const dotToneClassMap: Record<NonNullable<SettlementTimelineItem["tone"]>, string> = {
  slate: "bg-slate-400",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export function SettlementTimeline({
  title = "상태 타임라인",
  description = "주문 생성부터 결제/정산/지급 단계까지 시간 흐름으로 정리합니다.",
  items,
}: SettlementTimelineProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="mt-6 space-y-4">
        {items.map((item, index) => (
          <div key={item.key} className="flex gap-4">
            <div className="flex w-5 flex-col items-center">
              <span
                className={`mt-1 h-2.5 w-2.5 rounded-full ${dotToneClassMap[item.tone ?? "slate"]}`}
              />
              {index < items.length - 1 ? (
                <span className="mt-2 h-full w-px bg-slate-200" />
              ) : null}
            </div>
            <div className="flex-1 pb-4">
              <div className="text-sm font-bold text-slate-900">{item.title}</div>
              <div className="mt-1 text-sm text-slate-600">{item.value}</div>
              {item.description ? (
                <div className="mt-1 text-xs text-slate-400">{item.description}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
