// app/global/statistics/statistics_page.tsx
"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// 샘플 데이터 (추후 백엔드 API와 연결)
const salesData = [
  { name: '9월', sales: 245000000, profit: 24500000 },
  { name: '10월', sales: 210000000, profit: 21000000 },
  { name: '11월', sales: 285000000, profit: 28500000 },
  { name: '12월', sales: 340000000, profit: 34000000 },
  { name: '1월', sales: 310500000, profit: 31050000 },
  { name: '2월', sales: 320500000, profit: 32050000 }, // 이미지 내 당월 총 매출 반영
];

export function SalesTrendChart() {
  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={salesData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            {/* 매출 그래프를 위한 그라데이션 설정 */}
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          {/* 격자선 설정 */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            dy={10}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(value) => `${(value / 100000000).toFixed(1)}억`}
          />
          
          {/* 마우스 호버 툴팁 커스텀 */}
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
            }}
            // 수정된 부분: value의 타입을 명시하거나 체크해줍니다.
            formatter={(value: any) => {
                if (value === undefined || value === null) return ['', ''];
                const numericValue = typeof value === 'number' ? value : Number(value);
                return [`₩${numericValue.toLocaleString()}`, '매출액'];
            }}
          />

          {/* 매출 (영역형 그래프) */}
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorSales)"
            name="매출"
          />

          {/* 수익 (점선 그래프) */}
          <Area
            type="monotone"
            dataKey="profit"
            stroke="#cbd5e1"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="transparent"
            name="수익(10%)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Statistics_Page() {
  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">📊 통계 분석 리포트</h1>
          <p className="text-sm text-[#64748b] mt-1">운송 매출 및 물동량 데이터를 분석합니다.</p>
        </div>
        <div className="flex gap-2">
          <select className="border border-[#e2e8f0] bg-white px-3 py-2 rounded-lg text-sm font-bold outline-none">
            <option>2026년 2월</option>
            <option>2026년 1월</option>
            <option>2025년 12월</option>
          </select>
          <button className="bg-white border border-[#e2e8f0] px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50">리포트 다운로드</button>
        </div>
      </div>

      {/* 1. 핵심 지표 요약 (KPI) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "당월 총 매출", value: "₩320,500,000", trend: "+12.5%", color: "text-blue-600" },
          { label: "완료된 운송", value: "1,240건", trend: "+5.2%", color: "text-emerald-600" },
          { label: "평균 운송 운임", value: "₩258,000", trend: "-2.1%", color: "text-slate-800" },
          { label: "신규 가입 차주", value: "48명", trend: "+15.0%", color: "text-orange-600" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm">
            <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">{kpi.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${kpi.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. 차트 영역 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 매출 추이 그래프 (Line Chart 자리) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-[#1e293b]">월별 매출 및 수익 추이</h3>
            <div className="flex gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-blue-500"><div className="w-3 h-3 bg-blue-500 rounded-full" /> 매출</span>
              <span className="flex items-center gap-1.5 text-slate-300"><div className="w-3 h-3 bg-slate-300 rounded-full" /> 수익(10%)</span>
            </div>
          </div>
          <div className="flex-1 w-full">
            <SalesTrendChart />
          </div>
        </div>

        {/* 차량 비중 (Pie Chart 자리) */}
        <div className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col">
          <h3 className="font-bold text-[#1e293b] mb-8">차종별 운송 비중</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
             <div className="w-48 h-48 rounded-full border-[15px] border-blue-500 border-t-emerald-400 border-r-orange-400 border-l-slate-200 relative mb-6">
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                   <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                   <span className="text-xl font-black text-slate-800">1,240</span>
                </div>
             </div>
             <div className="w-full space-y-3">
                {[
                  { type: "5톤 카고", ratio: "45%", color: "bg-blue-500" },
                  { type: "11톤 윙바디", ratio: "25%", color: "bg-emerald-400" },
                  { type: "1톤 탑차", ratio: "20%", color: "bg-orange-400" },
                  { type: "기타", ratio: "10%", color: "bg-slate-200" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-600">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} /> {item.type}
                    </div>
                    <span className="font-black text-slate-800">{item.ratio}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* 3. 인기 노선 순위 */}
      <div className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm">
        <h3 className="font-bold text-[#1e293b] mb-6">최다 운송 구간 TOP 5</h3>
        <div className="space-y-4">
          {[
            { route: "경기 화성 → 경남 창원", count: "142건", amount: "₩42,000,000" },
            { route: "전북 군산 → 경기 용인", count: "98건", amount: "₩28,400,000" },
            { route: "서울 송파 → 부산 강서", count: "85건", amount: "₩32,000,000" },
            { route: "인천항 → 충남 당진", count: "72건", amount: "₩15,800,000" },
            { route: "경북 구미 → 경기 평택", count: "64건", amount: "₩19,200,000" },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
              <span className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg font-black text-slate-500 text-sm">{i + 1}</span>
              <div className="flex-1 font-bold text-[#1e293b]">{r.route}</div>
              <div className="text-sm font-bold text-blue-600 w-24 text-right">{r.count}</div>
              <div className="text-sm font-black text-slate-800 w-32 text-right">{r.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}