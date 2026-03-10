"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchOrders } from "./features/shared/api/order_api";
import { getUsers } from "./features/shared/api/user_api";
import {
  paymentAdminApi,
  SettlementResponse,
} from "./features/shared/api/payment_admin_api";
import { DashboardCard } from "./features/dashboard/card";
import { SettlementSummaryCard } from "./features/dashboard/settlement_summary_card";
import { OrderListResponse } from "./features/orders/type";
import {
  calculateAdminSettlementOverview,
  getPayoutAmount,
  isSettlementCompleted,
} from "./features/shared/lib/admin_settlement_overview";

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
    [settlements]
  );
  const listPrimaryTextClass = "text-sm font-bold leading-6 text-slate-800";
  const listSecondaryTextClass = "mt-0.5 text-xs leading-5 text-slate-500";

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
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              통합 관제 대시보드
            </h1>
          </div>
        </div>
      </header>
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
          colorClass="text-[#0f766e]"
        />
        <DashboardCard
          title="오늘 배차 완료"
          value={stats.completedCount}
          label="건"
          colorClass="text-[#0F172A]"
        />
      </section>

      <SettlementSummaryCard
        overview={settlementOverview}
        isLoading={isLoading}
        errorMessage={settlementError}
      />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
              <div
                key={order.orderId}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className={listPrimaryTextClass}>
                    {order.startPlace} → {order.endPlace}
                  </p>
                  <p className={listSecondaryTextClass}>
                    {order.cargoContent || "상세 정보 없음"}
                  </p>
                </div>
                <span className="px-2 py-1 rounded bg-indigo-50 text-[11px] font-bold text-indigo-600">
                  대기중
                </span>
              </div>
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
          <div className="mt-5 divide-y divide-[#E2E8F0]">
            {stats.settledList.map((item) => (
              <div
                key={item.settlementId}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className={listPrimaryTextClass}>
                    {item.driverName} 차주님
                  </p>
                  <p className={listSecondaryTextClass}>
                    {item.bankName} · {item.accountNum}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold leading-6 text-slate-900">
                    {getPayoutAmount(item).toLocaleString()}원
                  </p>
                  <span className="mt-0.5 block text-xs font-bold leading-5 text-emerald-600">
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
