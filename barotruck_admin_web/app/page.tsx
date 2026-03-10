"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { fetchOrders } from "./features/shared/api/order_api";
import { getUsers } from "./features/shared/api/user_api";
import {
  paymentAdminApi,
  SettlementResponse,
  SettlementStatusSummaryResponse,
} from "./features/shared/api/payment_admin_api";
import { DashboardCard } from "./features/dashboard/card";
import { SettlementSummaryCard } from "./features/dashboard/settlement_summary_card";
import { OrderListResponse } from "./features/orders/type";

interface DashboardUser {
  enrollDate?: string;
  enrolldate?: string;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderListResponse[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [settlementSummary, setSettlementSummary] =
    useState<SettlementStatusSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsSummaryLoading(true);
      const summaryTask = paymentAdminApi
        .getSettlementStatusSummary()
        .then((summary) => {
          setSettlementSummary(summary);
        })
        .catch((error) => {
          console.error("정산 요약 로딩 실패", error);
          setSettlementSummary(null);
        })
        .finally(() => setIsSummaryLoading(false));

      try {
        const results = await Promise.allSettled([
          fetchOrders(),
          getUsers(),
          paymentAdminApi.getSettlements("COMPLETED"),
        ]);

        if (results[0].status === "fulfilled") {
          setOrders(results[0].value);
        }
        if (results[1].status === "fulfilled") {
          setUsers(results[1].value);
        }
        if (results[2].status === "fulfilled") {
          setSettlements(results[2].value);
        }
      } catch (error) {
        console.error("데이터 로딩 실패", error);
      } finally {
        setIsLoading(false);
      }

      await summaryTask;
    };
    loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const today = koreaTime.toISOString().split("T")[0];

    const newOrdersList = orders.filter((o) => o.status === "REQUESTED");
    const recentMembers = users.filter(
      (u) => u.enrollDate?.includes(today) || u.enrolldate?.includes(today),
    ).length;
    const todayCompleted = orders.filter((o) => o.status === "ACCEPTED");

    return {
      newOrders: newOrdersList,
      recentMemberCount: recentMembers,
      completedCount: todayCompleted.length,
      settledList: settlements.slice(0, 5),
    };
  }, [orders, users, settlements]);

  if (isLoading)
    return (
      <div className="min-h-screen p-10 text-center text-sm text-[#475569]">
        관제 데이터를 연결 중입니다...
      </div>
    );

  return (
    <div className="space-y-6 font-sans">
      <header className="mb-8 pl-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          통합 관제 대시보드
        </h1>
      </header>

      {/* 1. 상단 카드 섹션: 요청하신 대로 수치에 색상 포인트 적용 */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DashboardCard
          title="신규 오더"
          value={stats.newOrders.length}
          label="건"
          colorClass="text-[#4E46E5]"
        />
        <DashboardCard
          title="오늘 신규 회원"
          value={stats.recentMemberCount}
          label="명"
          colorClass="text-emerald-600"
        />
        <DashboardCard
          title="오늘 배차 완료"
          value={stats.completedCount}
          label="건"
          colorClass="text-slate-900"
        />
      </section>

      <SettlementSummaryCard
        summary={settlementSummary}
        isLoading={isSummaryLoading}
      />

      {/* 2. 하단 리스트 영역 */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-800">
                신규 오더 현황
              </h2>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-xs font-bold text-slate-500">
                배차 대기
              </span>
            </div>
            <span className="text-xs font-medium text-slate-400">최근 5건</span>
          </div>
          <div className="mt-5 divide-y divide-[#E2E8F0]">
            {stats.newOrders.slice(0, 5).map((order) => (
              <Link
                key={order.orderId}
                href={`/global/orders/${order.orderId}`}
                className="flex items-center justify-between gap-4 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-indigo-600">
                    #{order.orderId}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {order.startPlace} → {order.endPlace}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {order.reqCarType} · {order.reqTonnage} ·{" "}
                      {order.driveMode || "일반운송"}
                    </p>
                  </div>
                </div>
                {/* 오더 목록과 동일한 뱃지 스타일 적용 */}
                <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase">
                  배차대기
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">최근 지급 내역</h2>
            <span className="text-xs font-medium text-slate-400">
              정산 히스토리
            </span>
          </div>
          <div className="mt-5 space-y-4 divide-y divide-[#E2E8F0]/60">
            {stats.settledList.map((item) => (
              <div
                key={item.settlementId}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {item.driverName} 차주님
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {item.bankName} · {item.accountNum}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {item.totalPrice.toLocaleString()}원
                  </p>
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase">
                    지급 완료
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
