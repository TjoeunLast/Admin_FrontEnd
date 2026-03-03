"use client";

import { useState, useEffect } from "react";
import { 
  fetchOrders, 
  fetchCancelledOrders, 
  forceAllocateOrder, 
  cancelOrder, 
  fetchAdminSummary 
} from "@/app/features/shared/api/order_api";
import { useRouter } from "next/navigation";
import apiClient from "@/app/features/shared/api/client"; // 취소 API 등을 위해 필요

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
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null); // 통계 데이터 상태 추가
  const [viewMode, setViewMode] = useState<"all" | "cancelled">("all");
  
  // 모달 제어 상태
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null); // 강제배차용
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null); // 취소용
  const [cancelReason, setCancelReason] = useState(""); // 취소 사유 입력값
  const [driverIdInput, setDriverIdInput] = useState("");

  // 1. 데이터 불러오기 (탭 변경 시마다 호출)
  const loadPageData = async () => {
    try {
      const summaryData = await fetchAdminSummary('month');
      setSummary(summaryData);
      const orderData = viewMode === "all" ? await fetchOrders() : await fetchCancelledOrders();
      setOrders(orderData);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    loadPageData();
  }, [viewMode]);

  // 2. 강제 배차 실행 (PATCH)
  const handleForceAllocate = async (orderId: number) => {
    try {
      await forceAllocateOrder(orderId, Number(driverIdInput), "관리자 직접 지정");
      alert("배차 완료");
      setDriverIdInput("");
      setSelectedOrder(null);
      loadPageData();
    } catch (error) { alert("배차 실패"); }
  };

  // 3. 오더 취소 실행 (DELETE)
  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    if (!cancelReason.trim()) return alert("취소 사유를 입력해주세요.");

    try {
      // API 호출 시 입력받은 cancelReason을 전송
      await cancelOrder(cancelTargetId, cancelReason); 
      alert("오더가 취소되었습니다.");
      closeCancelModal();
      loadPageData();
    } catch (error) {
      alert("취소 처리 중 오류가 발생했습니다.");
    }
  };

  const closeCancelModal = () => {
    setCancelTargetId(null);
    setCancelReason("");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen font-sans">
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* 목록으로 돌아가기 버튼 추가 */}
          <button 
            onClick={() => router.push('/global/orders')} // 또는 router.back()
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            title="목록으로 돌아가기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">오더 관리 센터</h1>
            <p className="text-slate-500 mt-1 font-medium">실시간 데이터베이스 연동 관제 시스템</p>
          </div>
        </div>
        
        {/* 탭 메뉴 */}
        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode("all")}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === "all" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            실시간 오더
          </button>
          <button 
            onClick={() => setViewMode("cancelled")}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === "cancelled" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            취소된 목록
          </button>
        </div>
      </header>

      {/* 대시보드 요약 섹션 추가 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 font-sans">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase mb-1">이달의 총 오더</p>
          <p className="text-2xl font-black text-slate-900">{summary?.totalCount || 0}건</p>
        </div>
        <div className="bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-100 text-white">
          <p className="text-blue-100 text-xs font-black uppercase mb-1">진행 중인 오더</p>
          <p className="text-2xl font-black">{summary?.activeCount || 0}건</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-rose-400 text-xs font-black uppercase mb-1">취소된 오더</p>
          <p className="text-2xl font-black text-rose-600">{summary?.cancelledCount || 0}건</p>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-widest font-black">
              <th className="p-6">오더 번호</th>
              <th className="p-6">화주사 닉네임</th>
              <th className="p-6 text-center">상태</th>
              <th className="p-6 text-right">관리 제어</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => (
              <tr key={order.orderId} className="hover:bg-blue-50/40 transition-colors group">
                <td className="p-6 font-bold text-slate-900 text-sm">#{order.orderId}</td>
                <td className="p-6">
                  <span className="font-bold text-slate-700 text-sm">{order.user?.nickname || "미지정"}</span>
                </td>
                <td className="p-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${statusConfig[order.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {order.status}
                  </span>
                </td>
                
                {/* 관리 제어 버튼 영역 수정 */}
                <td className="p-6 text-right space-x-2">
                  {/* viewMode가 "all" (실시간 오더)일 때만 배차/취소 버튼 노출 */}
                  {viewMode === "all" && (
                    <>
                      {/* 배차 대기 중일 때만 강제 배차 버튼 표시 */}
                      {order.status === 'REQUESTED' && (
                        <button 
                          onClick={() => setSelectedOrder(order.orderId)}
                          className="px-4 py-2 bg-blue-600 text-white text-[11px] font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                        >
                          배차
                        </button>
                      )}
                      
                      {/* 이미 취소된 상태가 아닐 때만 취소 버튼 표시 */}
                      {!order.status.includes('CANCELLED') && (
                        <button 
                          onClick={() => setCancelTargetId(order.orderId)}
                          className="px-4 py-2 bg-white text-rose-600 border border-rose-100 text-[11px] font-black rounded-xl hover:bg-rose-50 transition-all"
                        >
                          취소
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* 취소된 목록 탭(viewMode === "cancelled")에서는 버튼이 렌더링되지 않음 */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 강제 배차 모달 - 디자인 개선 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[32px] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2">기사 강제 할당</h2>
            <p className="text-slate-500 text-sm mb-6">오더 <span className="text-blue-600 font-bold">#{selectedOrder}</span>번에 직접 기사를 배정합니다.</p>
            
            <input 
              type="number" 
              placeholder="배차할 기사 고유 ID"
              className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl mb-6 outline-none focus:border-blue-500 focus:bg-white transition-all font-bold"
              value={driverIdInput}
              onChange={(e) => setDriverIdInput(e.target.value)}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleForceAllocate(selectedOrder)}
                className="bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                배차 확정
              </button>
              <button 
                onClick={closeCancelModal}
                className="bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 취소 사유 입력 모달 (신규 추가) */}
      {cancelTargetId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[40px] w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-slate-900 mb-2">오더 취소 사유</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">오더 <span className="text-rose-500 font-bold">#{cancelTargetId}</span>번을 취소하는 이유를 입력하세요.</p>
            
            <textarea 
              placeholder="예: 화주 요청에 의한 취소"
              className="w-full bg-slate-100 border-none p-5 rounded-2xl mb-6 outline-none focus:ring-4 ring-rose-500/10 font-bold text-sm h-32 resize-none"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleConfirmCancel}
                className="bg-rose-600 text-white py-4 rounded-2xl font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
              >
                취소 확정
              </button>
              <button 
                onClick={closeCancelModal}
                className="bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}