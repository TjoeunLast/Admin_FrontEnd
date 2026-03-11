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
  /* 상태 정의 */
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const MAIN_COLOR = "#4E46E5";

  /* 데이터 호출 */
  useEffect(() => {
    const loadRawData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOrders();
        setOrders(data || []);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRawData();
  }, []);

  /* 통계 계산 */
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
      if (o.puProvince)
        regionCounts[o.puProvince] = (regionCounts[o.puProvince] || 0) + 1;
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
        데이터 분석 중...
      </div>
    );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* 페이지 헤더 */}
      <header className="mb-8 pl-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          통계 분석 리포트
        </h1>
      </header>

      {/* 요약 통계 위젯 */}
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

      {/* 분석 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 지역별 통계 */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              지역별 물동량 TOP 10
            </h3>
          </div>
          <div className="p-8">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.regionalTop10}
                  layout="vertical"
                  margin={{ top: 0, right: 60, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    vertical={true}
                    stroke="#f1f5f9"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={100}
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      fill: "#64748b",
                    }}
                  />
                  <Tooltip cursor={false} contentStyle={{ display: "none" }} />
                  <Bar
                    dataKey="value"
                    fill={MAIN_COLOR}
                    radius={[0, 6, 6, 0]}
                    barSize={24}
                  >
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(val: any) => `${val}건`}
                      style={{
                        fontSize: "12px",
                        fontWeight: "800",
                        fill: "#475569",
                      }}
                      offset={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 노선별 통계 */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              노선별 물동량 TOP 10
            </h3>
          </div>
          <div className="p-8">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.routeTop10}
                  layout="vertical"
                  margin={{ top: 0, right: 70, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    vertical={true}
                    stroke="#f1f5f9"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={110}
                    style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      fill: "#64748b",
                    }}
                  />
                  <Tooltip cursor={false} contentStyle={{ display: "none" }} />
                  <Bar
                    dataKey="value"
                    fill="#10b981"
                    radius={[0, 6, 6, 0]}
                    barSize={24}
                  >
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(val: any) => `${val}건`}
                      style={{
                        fontSize: "12px",
                        fontWeight: "800",
                        fill: "#475569",
                      }}
                      offset={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
