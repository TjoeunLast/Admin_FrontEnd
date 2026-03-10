"use client";

interface StatusChipProps {
  label: string;
  tone?: "slate" | "blue" | "emerald" | "amber" | "rose";
  minWidthClassName?: string;
}

const toneClassMap: Record<NonNullable<StatusChipProps["tone"]>, string> = {
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-600",
};

export function StatusChip({
  label,
  tone = "slate",
  minWidthClassName = "min-w-[72px]",
}: StatusChipProps) {
  return (
    <span
      className={`inline-flex ${minWidthClassName} justify-center rounded-full px-3 py-1 text-[11px] font-bold ${toneClassMap[tone]}`}
    >
      {label}
    </span>
  );
}
