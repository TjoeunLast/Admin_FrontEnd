// app/admin/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  fetchOrders, 
  fetchCancelledOrders,
  forceAllocateOrder, 
  cancelOrder, 
  fetchAdminSummary 
} from "@/app/features/shared/api/order_api";
import { fetchDriversForAllocation } from "@/app/features/shared/api/user_api";
import { useRouter } from "next/navigation";

// 상태별 뱃지 색상 정의
const statusConfig: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-700 border-amber-200",
  ACCEPTED: "bg-blue-100 text-blue-700 border-blue-200",
  LOADING: "bg-indigo-100 text-indigo-700 border-indigo-200",
  IN_TRANSIT: "bg-purple-100 text-purple-700 border-purple-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function AdminOrderListPage() {
  const [orders, setOrders] = useState<OrderListResponse[]>([]);
  const [summary, setSummary] = useState<any>(null); 
  const [viewMode, setViewMode] = useState<"all" | "cancelled">("all");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderData, summaryData] = await Promise.all([
        viewMode === "all" ? fetchOrders() : fetchCancelledOrders(),
        fetchAdminSummary()
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setSummary(summaryData);
      const orderData = viewMode === "all" ? await fetchOrders() : await fetchCancelledOrders();
      setOrders(orderData);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    loadPageData();
  }, [viewMode]);

  // 2. 차주 목록 불러오기 (AdminUserController 활용)
  const fetchDriverList = async () => {
    setIsDriversLoading(true);
    try {
      const drivers = await fetchDriversForAllocation();
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [viewMode]);

  const handleCancelOrder = async (orderId: number) => {
    const reason = prompt("취소 사유를 입력하세요:");
    if (reason) {
      await cancelOrder(orderId, reason);
      loadData();
    }
  };

  const handleForceAllocate = async (orderId: number) => {
    const driverId = prompt("기사 ID를 입력하세요:");
    const reason = prompt("배차 사유를 입력하세요:");
    if (driverId && reason) {
      await forceAllocateOrder(orderId, parseInt(driverId), reason);
      loadData();
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto bg-[#fafafa] min-h-screen text-[#1e293b]">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">통합 배차 관제</h1>
        </div>

        <div className="flex border-b border-slate-200 gap-8">
          <button onClick={() => setViewMode("all")} className={`pb-3 text-sm font-bold transition-all px-1 ${viewMode === "all" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}>
            실시간 주문
          </button>
          <button onClick={() => setViewMode("cancelled")} className={`pb-3 text-sm font-bold transition-all px-1 ${viewMode === "cancelled" ? "text-rose-500 border-b-2 border-rose-500" : "text-slate-400"}`}>
            취소 목록
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-300 font-bold">데이터 로드 중...</div>
        ) : orders.map((order) => (
          <div key={order.orderId} className="bg-white border border-slate-200 rounded-2xl p-7 flex items-center shadow-sm hover:border-slate-300 transition-all">
            {/* 1. ID 영역 */}
            <div className="w-16 h-16 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 mr-8 flex-shrink-0">
              <span className="text-[10px] font-bold text-slate-300 uppercase">ID</span>
              <span className="text-xl font-black text-slate-700">#{order.orderId}</span>
            </div>

            {/* 2. 정보 영역 (배지가 빠진 깔끔한 상태) */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{order.cargoContent || "일반화물"}</span>
                <h3 className="font-bold text-slate-800 text-lg">{order.nickname}</h3>
              </div>
              <div className="flex items-center text-base font-semibold text-slate-600">
                <span className="text-blue-500 mr-2 font-bold">상차</span> {order.startPlace}
                <span className="mx-4 text-slate-200 tracking-tighter">————</span>
                <span className="text-rose-500 mr-2 font-bold">하차</span> {order.endPlace}
              </div>
            </div>

            {/* 3. 취소 정보 (취소 목록 모드 시 중앙 배치) */}
            {viewMode === "cancelled" && order.cancellation && (
              <div className="flex-1 max-w-sm px-10 border-l border-slate-100">
                <p className="text-sm font-black text-rose-600 italic leading-relaxed">“ {order.cancellation.cancelReason} ”</p>
                <p className="text-[10px] text-rose-400 mt-2 font-medium tracking-wide">관리자: {order.cancellation.cancelledBy}</p>
              </div>
            )}

            {/* 4. 상태 및 제어 통합 영역 (상태 배지를 버튼 왼쪽으로 배치) */}
            <div className="flex items-center gap-8 ml-auto flex-shrink-0 min-h-[50px]">
              {/* 상태 배지: 버튼과 일정 거리(gap-8)를 두고 배치 */}
              <span className={`px-4 py-1.5 rounded-lg text-[11px] font-black border uppercase tracking-widest whitespace-nowrap shadow-sm ${
                order.status.includes('CANCEL') ? "bg-white text-rose-500 border-rose-200" : "bg-white text-blue-600 border-blue-200"
              }`}>
                {ORDER_DRIVING_STATUS_MAP[order.status] || order.status}
              </span>
              
              {/* 버튼 영역: '배차 대기' 상태일 때만 노출 */}
              {viewMode === "all" && order.status === 'REQUESTED' ? (
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleForceAllocate(order.orderId)}
                    className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all shadow-md active:scale-95 whitespace-nowrap"
                  >
                    기사 배정
                  </button>
                  <button 
                    onClick={() => handleCancelOrder(order.orderId)}
                    className="px-6 py-2.5 border-2 border-rose-100 text-rose-500 text-xs font-bold rounded-xl hover:bg-rose-50 transition-all active:scale-95 whitespace-nowrap"
                  >
                    오더 취소
                  </button>
                </div>
              ) : (
                /* 버튼이 없는 상태에서도 배지 위치를 유지하기 위한 빈 공간 확보 */
                <div className="w-[200px]" aria-hidden="true" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
