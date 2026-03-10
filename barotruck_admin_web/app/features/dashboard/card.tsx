// app/features/dashboard/card.tsx
import React from 'react';

interface DashCardProps {
  title: string;
  value: string | number;
  label: string;
  colorClass: string;
}

export const DashboardCard = ({ title, value, label, colorClass }: DashCardProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <p className="text-slate-500 text-xs font-black uppercase mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <h3 className={`text-3xl font-black ${colorClass}`}>{value}</h3>
        <span className="text-slate-600 text-sm font-bold">{label}</span>
      </div>
    </div>
  );
};