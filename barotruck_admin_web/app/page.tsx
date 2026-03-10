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
import { BarChart, Home, Users } from "lucide-react";

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
        const [orderData, userData, settlementData] = await Promise.all([
          fetchOrders(),
          getUsers(),
          paymentAdminApi.getSettlements("COMPLETED"),
        ]);
        setOrders(orderData);
        setUsers(userData);
        setSettlements(settlementData);
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
    const today = new Date().toISOString().split("T")[0];
    const newOrdersList = orders.filter((o) => o.status === "REQUESTED");
    const recentMembers = users.filter(
      (u) => u.enrollDate?.includes(today) || u.enrolldate?.includes(today)
    ).length;
    const todayCompleted = orders.filter((o) => o.status === "ACCEPTED");

    return {
      newOrders: newOrdersList,
      recentMemberCount: recentMembers || users.length,
      completedCount: todayCompleted.length,
      settledList: settlements.slice(0, 5),
    };
  }, [orders, users, settlements]);

  if (isLoading)
    return <div className="min-h-screen p-10 text-center text-sm text-[#475569]">관제 데이터를 연결 중입니다...</div>;

  return (
    <div className="min-h-screen space-y-8 bg-gradient-to-b from-[#f8fafc] to-[#fbfbff] p-6 font-sans">
      <header className="space-y-2 rounded-[26px] border border-[#E2E8F0] bg-white/70 px-6 py-5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9] text-[#4E46E5]">
            <Home size={24} strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#94A3B8]">LIVE MONITORING</p>
            <h1 className="text-3xl font-black text-[#0F172A]">통합 관제 대시보드</h1>
          </div>
        </div>
        <p className="text-sm text-[#64748B]">
          최근 주문·회원·정산 흐름을 한 화면에서 확인하고 필요하면 빠르게 설정으로 이동해 보세요.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DashboardCard title="신규 오더" value={stats.newOrders.length} label="건" colorClass="text-[#4E46E5]" />
        <DashboardCard title="오늘 신규 회원" value={stats.recentMemberCount} label="명" colorClass="text-[#0f766e]" />
        <DashboardCard title="오늘 배차 완료" value={stats.completedCount} label="건" colorClass="text-[#0F172A]" />
      </section>

      <SettlementSummaryCard summary={settlementSummary} isLoading={isSummaryLoading} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[26px] border border-[#E2E8F0] bg-white/70 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E0F2FE] text-[#0E7490]">
                <BarChart size={18} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-[#94A3B8]">배차 대기</p>
                <h2 className="text-xl font-black text-[#0F172A]">신규 오더 현황</h2>
              </div>
            </div>
            <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#4E46E5]">
              최대 5개
            </span>
          </div>
          <div className="mt-5 divide-y divide-[#E2E8F0]">
            {stats.newOrders.slice(0, 5).map((order) => (
              <div key={order.orderId} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-base font-bold text-[#0F172A]">{order.startPlace} → {order.endPlace}</p>
                  <p className="text-xs font-semibold text-[#94A3B8]">{order.cargoContent || "상세 정보 없음"}</p>
                </div>
                <span className="rounded-full bg-[#EDECFC] px-3 py-1 text-[11px] font-bold text-[#4E46E5]">
                  배차 대기
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[26px] border border-[#E2E8F0] bg-white/70 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
              <Users size={18} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-[#94A3B8]">정산 히스토리</p>
              <h2 className="text-xl font-black text-[#0F172A]">최근 지급 내역</h2>
            </div>
          </div>
          <div className="mt-5 space-y-4 divide-y divide-[#E2E8F0]/60">
            {stats.settledList.map((item) => (
              <div key={item.settlementId} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-black text-[#0F172A]">{item.driverName} 차주님</p>
                  <p className="text-xs text-[#94A3B8]">
                    {item.bankName} · {item.accountNum}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-[#0F172A]">{item.totalPrice.toLocaleString()}원</p>
                  <span className="text-[11px] font-bold text-[#047857]">지급 완료</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
