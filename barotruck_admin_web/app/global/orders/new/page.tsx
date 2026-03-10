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
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"all" | "cancelled">("all");
  
  // 모달 제어 상태
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  
  // 차주 목록 관련 상태
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [isDriversLoading, setIsDriversLoading] = useState(false);

  // 검색어 상태 추가
  const [driverSearchTerm, setDriverSearchTerm] = useState("");

  // 1. 데이터 불러오기
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

  // 2. 차주 목록 불러오기 (AdminUserController 활용)
  const fetchDriverList = async () => {
    setIsDriversLoading(true);
    try {
      const drivers = await fetchDriversForAllocation();
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error("차주 목록 로드 실패:", error);
      alert("차주 목록을 불러오지 못했습니다.");
    } finally {
      setIsDriversLoading(false);
    }
  };

  // 3. 배차 모달 열기
  const handleOpenAllocateModal = (orderId: number) => {
    setSelectedOrder(orderId);
    fetchDriverList();
  };

  // 4. 강제 배차 실행
  const handleConfirmAllocate = async (driverId: number, driverName: string) => {
    if (!selectedOrder) return;
    
    const isConfirmed = confirm(`${driverName} 기사님을 #${selectedOrder} 오더에 배차하시겠습니까?`);
    if (!isConfirmed) return;

    try {
      // driverID와 사유를 파라미터로 전달
      await forceAllocateOrder(selectedOrder, driverId, "관리자 직접 지정");
      alert("배차가 완료되었습니다.");
      closeForceAllocateModal();
      loadPageData();
    } catch (error) {
      alert("배차 실패: 서버 오류가 발생했습니다.");
    }
  };

  // 5. 오더 취소 실행
  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    if (!cancelReason.trim()) return alert("취소 사유를 입력해주세요.");

    try {
      await cancelOrder(cancelTargetId, cancelReason); 
      alert("오더가 취소되었습니다.");
      closeCancelModal();
      loadPageData();
    } catch (error) {
      alert("취소 처리 중 오류가 발생했습니다.");
    }
  };

  // 6. 검색어에 따라 필터링된 기사 목록 계산 (클라이언트 사이드 필터링 예시)
  const filteredDrivers = availableDrivers.filter(driver => 
    driver.nickname?.includes(driverSearchTerm) || 
    driver.phone?.includes(driverSearchTerm)
  );

  const closeCancelModal = () => {
    setCancelTargetId(null);
    setCancelReason("");
  };

  const closeForceAllocateModal = () => {
    setSelectedOrder(null);
    setAvailableDrivers([]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen font-sans">
      <header className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/global/orders')}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
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
                
                <td className="p-6 text-right space-x-2">
                  {viewMode === "all" && (
                    <>
                      {order.status === 'REQUESTED' && (
                        <button 
                          onClick={() => handleOpenAllocateModal(order.orderId)}
                          className="px-4 py-2 bg-blue-600 text-white text-[11px] font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                        >
                          배차
                        </button>
                      )}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 강제 배차 모달 - 검색창 추가 버전 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-2">기사 배정</h2>
            <p className="text-slate-500 text-sm mb-6 font-medium">오더 <span className="text-blue-600 font-bold">#{selectedOrder}</span>번에 배정할 기사를 선택하세요.</p>
            
            {/* 검색 입력창 추가 */}
            <div className="relative mb-4">
              <input 
                type="text"
                placeholder="기사 이름 또는 전화번호 검색"
                className="w-full bg-slate-100 border-none p-4 pl-12 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 font-bold text-sm transition-all"
                value={driverSearchTerm}
                onChange={(e) => setDriverSearchTerm(e.target.value)}
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>

            {/* 기사 리스트 (필터링된 목록 출력) */}
            <div className="max-h-64 overflow-y-auto mb-6 space-y-2 pr-1 custom-scrollbar">
              {isDriversLoading ? (
                <div className="text-center py-10 text-slate-400 font-bold">데이터 로드 중...</div>
              ) : filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver) => (
                  <button
                    key={driver.userId}
                    onClick={() => handleConfirmAllocate(driver.userId, driver.nickname)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-slate-800 group-hover:text-blue-700">{driver.nickname}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{driver.phone || "연락처 없음"}</p>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-100/50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">선택</span>
                  </button>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 font-medium">검색 결과가 없습니다.</div>
              )}
            </div>
            
            <button 
              onClick={closeForceAllocateModal}
              className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 취소 사유 입력 모달 */}
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
