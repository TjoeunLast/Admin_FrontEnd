"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { fetchOrders } from "./features/shared/api/order_api";
import { getUsers } from "./features/shared/api/user_api";
import {
  paymentAdminApi,
  SettlementResponse,
} from "./features/shared/api/payment_admin_api";
import {
  calculateAdminSettlementOverview,
  getPayoutAmount,
  isSettlementCompleted,
} from "./features/shared/lib/admin_settlement_overview";
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
  const [isLoading, setIsLoading] = useState(true);
  const [settlementError, setSettlementError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setSettlementError(null);
      try {
        const results = await Promise.allSettled([
          fetchOrders(),
          getUsers(),
          paymentAdminApi.getSettlements(),
        ]);

        if (results[0].status === "fulfilled") {
          setOrders(results[0].value);
        } else {
          console.error("대시보드 주문 데이터 로딩 실패:", results[0].reason);
        }

        if (results[1].status === "fulfilled") {
          setUsers(results[1].value);
        } else {
          console.error("대시보드 사용자 데이터 로딩 실패:", results[1].reason);
        }

        if (results[2].status === "fulfilled") {
          setSettlements(results[2].value);
        } else {
          console.error("대시보드 정산 데이터 로딩 실패:", results[2].reason);
          setSettlementError("정산 데이터를 불러오지 못했습니다.");
        }
      } catch (error) {
        console.error("데이터 로딩 실패", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const settlementOverview = useMemo(
    () => calculateAdminSettlementOverview(settlements),
    [settlements],
  );

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
      settledList: settlements
        .filter((item) => isSettlementCompleted(item))
        .sort((a, b) => {
          const aTime = new Date(a.feeCompleteDate ?? a.feeDate ?? 0).getTime();
          const bTime = new Date(b.feeCompleteDate ?? b.feeDate ?? 0).getTime();
          return bTime - aTime;
        })
        .slice(0, 5),
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

      {/* 상단 통계 카드 */}
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
        overview={settlementOverview}
        isLoading={isLoading}
        errorMessage={settlementError}
      />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 신규 오더 현황 */}
        <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-slate-800">
                신규 오더 현황
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              최근 5건
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.newOrders.slice(0, 5).map((order) => (
              <Link
                key={order.orderId}
                href={`/global/orders/${order.orderId}`}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-indigo-600 min-w-[45px] text-center">
                    #{order.orderId}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-[#4E46E5] transition-colors">
                      {order.startPlace} → {order.endPlace}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      {order.reqCarType} · {order.reqTonnage} ·{" "}
                      {order.driveMode || "일반운송"}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase">
                  배차대기
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 최근 지급 내역 */}
        <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">최근 지급 내역</h2>
            <span className="text-[11px] font-bold text-slate-400">
              정산 히스토리
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.settledList.map((item) => (
              <div
                key={item.settlementId}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {item.driverName} 차주님
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {item.bankName} · {item.accountNum}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">
                    {getPayoutAmount(item).toLocaleString()}원
                  </p>
                  <span className="mt-1 inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase">
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
