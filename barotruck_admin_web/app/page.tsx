// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800">📊 실시간 운송 관제 대시보드</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm mb-1">오늘의 신규 오더</p>
          <h3 className="text-3xl font-bold text-blue-600">24건</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm mb-1">배차 대기 중</p>
          <h3 className="text-3xl font-bold text-orange-500">8건</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm mb-1">금일 완료 건수</p>
          <h3 className="text-3xl font-bold text-green-600">112건</h3>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 h-96 flex items-center justify-center">
        <p className="text-slate-400 italic">대시보드 통계 데이터가 여기에 표시됩니다.</p>
      </div>
    </div>
  );
}