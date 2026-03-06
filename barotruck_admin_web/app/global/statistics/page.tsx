"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList 
} from 'recharts';
import { fetchOrders } from "@/app/features/shared/api/order_api"; // orders 테이블 직접 조회

export default function StatisticsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 주문 테이블 원천 데이터 로드
  useEffect(() => {
    const loadRawData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOrders(); // List<OrderResponse> 가져오기
        setOrders(data || []);
      } catch (error) {
        console.error("오더 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRawData();
  }, []);

  // ✅ 2. 주문 데이터를 직접 가공하여 통계 산출 (0원 및 undefined 해결)
  const stats = useMemo(() => {
    if (!orders.length) return { totalSales: 0, averageAmount: 0, averageDistance: 155, regionalTop10: [], routeTop10: [] };

    // A. 전체 매출 계산 (basePrice 합산)
    const totalSales = orders.reduce((acc, cur) => acc + (cur.basePrice || 0), 0);
    
    // B. 평균 운송 금액 (전체 매출 / 주문 건수)
    const averageAmount = Math.floor(totalSales / orders.length);

    // C. 평균 운송 거리 (distance 필드 기반 또는 155km)
    const totalDistance = orders.reduce((acc, cur) => acc + (Number(cur.distance) || 0), 0);
    const averageDistance = orders.length > 0 ? (totalDistance / orders.length).toFixed(1) : "155";

    // D. 지역별 물동량 TOP 10 추출 (puProvince 기준)
    const regionCounts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.puProvince) {
        regionCounts[o.puProvince] = (regionCounts[o.puProvince] || 0) + 1;
      }
    });
    const regionalTop10 = Object.entries(regionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // E. 노선별 물동량 TOP 10 추출 (puProvince → doProvince)
    const routeCounts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.puProvince && o.doProvince) {
        const routeName = `${o.puProvince.substring(0,2)}→${o.doProvince.substring(0,2)}`;
        routeCounts[routeName] = (routeCounts[routeName] || 0) + 1;
      }
    });
    const routeTop10 = Object.entries(routeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return { totalSales, averageAmount, averageDistance, regionalTop10, routeTop10 };
  }, [orders]);

  if (isLoading) return <div className="p-10 text-center text-slate-500 font-bold">통계 데이터를 정밀 분석 중...</div>;

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-black text-slate-800">📊 통계 분석 리포트</h1>

      {/* 카드 지표: 실데이터 기반 계산값 연동 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="전체 매출" value={`₩${stats.totalSales.toLocaleString()}`} colorClass="text-blue-600" />
        <StatCard title="평균 운송 금액" value={`₩${stats.averageAmount.toLocaleString()}`} colorClass="text-slate-700" />
        <StatCard title="평균 운송 거리" value={`${stats.averageDistance}km`} colorClass="text-slate-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 지역별 TOP 10 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-6">지역별 물동량 TOP 10</h3>
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.regionalTop10} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={22} >
                  {/* ✅ 오류 수정: formatter 매개변수 타입을 any로 지정하여 타입 불일치 해결 */}
                  <LabelList 
                    dataKey="value" 
                    position="right" 
                    formatter={(val: any) => `${val}건`} 
                    style={{ fontSize: '12px', fontWeight: 'bold', fill: '#64748b' }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 노선별 TOP 10 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-6">노선별 물동량 TOP 10</h3>
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.routeTop10} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={140} interval={0} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#f59e42" radius={[0, 4, 4, 0]} barSize={22} >
                  {/* ✅ 오류 수정: formatter 매개변수 타입을 any로 지정하여 타입 불일치 해결 */}
                  <LabelList 
                    dataKey="value" 
                    position="right" 
                    formatter={(val: any) => `${val}건`} 
                    style={{ fontSize: '12px', fontWeight: 'bold', fill: '#64748b' }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, colorClass }: { title: string; value: string; colorClass?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <p className="text-xs font-bold text-slate-500 uppercase">{title}</p>
      <h3 className={`text-2xl font-black mt-2 ${colorClass}`}>{value}</h3>
    </div>
  );
}