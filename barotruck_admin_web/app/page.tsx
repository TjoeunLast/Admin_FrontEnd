"use client";

import { useEffect, useState, useMemo } from "react";
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
import axios from "axios";

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
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsSummaryLoading(true);
      setSummaryError(null);
      const summaryTask = paymentAdminApi
        .getSettlementStatusSummary()
        .then((summary) => {
          setSettlementSummary(summary);
        })
        .catch((error) => {
          console.error("정산 요약 로딩 실패", error);
          setSettlementSummary(null);
          if (axios.isAxiosError(error) && error.response?.status === 403) {
            setSummaryError("관리자 권한이 필요합니다.");
            return;
          }
          setSummaryError("정산 요약을 불러오지 못했습니다.");
        })
        .finally(() => setIsSummaryLoading(false));

      try {
        // Promise.all을 allSettled로 변경하여 일부 API 실패 시에도 전체가 중단되지 않도록 수정
        const results = await Promise.allSettled([
          fetchOrders(),
          getUsers(),
          paymentAdminApi.getSettlements("COMPLETED"),
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
        summary={settlementSummary}
        isLoading={isSummaryLoading}
        errorMessage={summaryError}
      />

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
              <div
                key={order.orderId}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {order.startPlace} → {order.endPlace}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
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
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.bankName} · {item.accountNum}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {item.totalPrice.toLocaleString()}원
                  </p>
                  <span className="text-[10px] font-bold text-emerald-600">
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
