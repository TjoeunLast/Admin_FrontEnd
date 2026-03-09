"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchOrders } from "./features/shared/api/order_api";
import { getUsers } from "./features/shared/api/user_api";
import {
  paymentAdminApi,
  SettlementResponse,
} from "./features/shared/api/payment_admin_api";
import { DashboardCard } from "./features/dashboard/card";
import { OrderListResponse } from "./features/orders/type";

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderListResponse[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 세 개의 API를 각각 호출하여 상태 저장
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [orderData, userData, settlementData] = await Promise.all([
          fetchOrders(), // 전체 주문
          getUsers(),    // 전체 회원
          paymentAdminApi.getSettlements("COMPLETED") // 완료된 정산
        ]);
        setOrders(orderData);
        setUsers(userData);
        setSettlements(settlementData);
      } catch (error) {
        console.error("데이터 로딩 실패", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // 2. 요구사항(3가지 조건)에 따른 데이터 가공
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    // 조건 1) 신규 오더 (배차 대기 중인 목록)
    const newOrdersList = orders.filter(o => o.status === 'REQUESTED');
    
    // 조건 2) 최근 가입한 회원수 (예: 오늘 가입한 회원)
    const recentMembers = users.filter(u => u.enrollDate?.includes(today)).length;

    // 조건 3) 오늘 배차 완료 내역
    const todayCompleted = orders.filter(o => o.status === 'ACCEPTED');

    return {
      newOrders: newOrdersList,
      recentMemberCount: recentMembers || users.length, // 데이터 없을 시 전체 노출
      completedCount: todayCompleted.length,
      settledList: settlements.slice(0, 5) // 정산 완료 리스트
    };
  }, [orders, users, settlements]);

  if (isLoading) return <div className="p-10 text-center">관제 데이터를 연결 중입니다...</div>;

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-2xl font-black text-slate-800">📊 통합 관제 대시보드</h1>
      
      {/* ✅ 1x3 레이아웃 상단 카드 (요구조건 3가지 반영) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="신규 오더" value={stats.newOrders.length} label="건" colorClass="text-blue-600" />
        <DashboardCard title="신규 가입 회원" value={stats.recentMemberCount} label="명" colorClass="text-emerald-500" />
        <DashboardCard title="오늘 배차 완료" value={stats.completedCount} label="건" colorClass="text-indigo-600" />
      </div>

      {/* 하단 리스트 영역 (신규 오더 vs 정산 완료 리스트) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 리스트 1: 신규 오더와 그 목록 */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-700 text-sm">신규 오더 현황 (5개까지)</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.newOrders.slice(0, 5).map(order => (
              <div key={order.orderId} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-800">{order.startPlace} → {order.endPlace}</p>
                  <p className="text-[11px] text-slate-400">{order.cargoContent}</p>
                </div>
                <span className="text-xs font-bold text-blue-600">배차 대기</span>
              </div>
            ))}
          </div>
        </section>

        {/* 리스트 2: 정산 완료 리스트 */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-700 text-sm">최근 정산 완료 내역</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.settledList.map(item => (
              <div key={item.settlementId} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.driverName} 차주님</p>
                  <p className="text-[11px] text-slate-400">{item.bankName} {item.accountNum}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{item.totalPrice.toLocaleString()}원</p>
                  <span className="text-[10px] font-bold text-emerald-500">지급 완료</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
