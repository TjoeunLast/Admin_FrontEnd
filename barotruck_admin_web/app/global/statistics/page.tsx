"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { fetchOrders } from "@/app/features/shared/api/order_api";

export default function StatisticsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const MAIN_COLOR = "#4E46E5";

  useEffect(() => {
    const loadRawData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOrders();
        setOrders(data || []);
      } catch (error) {
        console.error("오더 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRawData();
  }, []);

  const stats = useMemo(() => {
    if (!orders.length)
      return {
        totalSales: 0,
        averageAmount: 0,
        averageDistance: 155,
        regionalTop10: [],
        routeTop10: [],
      };

    const totalSales = orders.reduce(
      (acc, cur) => acc + (cur.basePrice || 0),
      0,
    );
    const averageAmount = Math.floor(totalSales / orders.length);
    const totalDistance = orders.reduce(
      (acc, cur) => acc + (Number(cur.distance) || 0),
      0,
    );
    const averageDistance =
      orders.length > 0 ? (totalDistance / orders.length).toFixed(1) : "155";

    const regionCounts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.puProvince) {
        regionCounts[o.puProvince] = (regionCounts[o.puProvince] || 0) + 1;
      }
    });
    const regionalTop10 = Object.entries(regionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const routeCounts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.puProvince && o.doProvince) {
        const routeName = `${o.puProvince.substring(0, 2)}→${o.doProvince.substring(0, 2)}`;
        routeCounts[routeName] = (routeCounts[routeName] || 0) + 1;
      }
    });
    const routeTop10 = Object.entries(routeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      totalSales,
      averageAmount,
      averageDistance,
      regionalTop10,
      routeTop10,
    };
  }, [orders]);

  if (isLoading)
    return (
      <div className="p-10 text-center text-slate-500 font-medium">
        데이터를 분석 중입니다...
      </div>
    );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* 1. 상단 헤더: 주문 목록과 동일한 디자인 */}
      <header className="mb-8 pl-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          통계 분석 리포트
        </h1>
      </header>

      {/* 2. 상단 통계 위젯: 주문 목록과 동일한 카드 디자인 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">전체 매출</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-slate-900">
              {stats.totalSales.toLocaleString()}
            </p>
            <span className="text-sm font-medium text-slate-400">원</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">
            평균 운송 금액
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-blue-600">
              {stats.averageAmount.toLocaleString()}
            </p>
            <span className="text-sm font-medium text-slate-400">원</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">
            평균 운송 거리
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-slate-900">
              {stats.averageDistance}
            </p>
            <span className="text-sm font-medium text-slate-400">km</span>
          </div>
        </div>
      </div>

      {/* 3. 차트 섹션: 주문 목록 테이블 영역과 유사한 카드 스타일 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 지역별 물동량 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-[14px] font-bold text-slate-800 mb-8 pb-4 border-b border-slate-50">
            지역별 물동량 TOP 10
          </h3>
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.regionalTop10}
                layout="vertical"
                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    fill: "#64748b",
                  }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill={MAIN_COLOR}
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                >
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(val: any) => `${val}건`}
                    style={{
                      fontSize: "11px",
                      fontWeight: "black",
                      fill: "#94a3b8",
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 노선별 물동량 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="text-[14px] font-bold text-slate-800 mb-8 pb-4 border-b border-slate-50">
            노선별 물동량 TOP 10
          </h3>
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.routeTop10}
                layout="vertical"
                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={120}
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    fill: "#64748b",
                  }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                >
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(val: any) => `${val}건`}
                    style={{
                      fontSize: "11px",
                      fontWeight: "black",
                      fill: "#94a3b8",
                    }}
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
