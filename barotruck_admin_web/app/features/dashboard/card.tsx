import React from "react";

interface DashCardProps {
  title: string;
  value: string | number;
  label: string;
  colorClass: string;
}

export const DashboardCard = ({
  title,
  value,
  label,
  colorClass,
}: DashCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>

      <div className="flex items-baseline gap-1">
        <h3 className={`text-3xl font-bold ${colorClass}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>

        <span className="text-sm font-medium text-slate-400">{label}</span>
      </div>
    </div>
  );
};
