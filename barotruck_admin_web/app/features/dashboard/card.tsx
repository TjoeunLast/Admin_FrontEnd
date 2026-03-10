// app/features/dashboard/card.tsx
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <h3 className={`text-3xl font-bold text-slate-900 ${colorClass}`}>
          {value}
        </h3>
        <span className="text-sm font-medium text-slate-400">{label}</span>
      </div>
    </div>
  );
};
