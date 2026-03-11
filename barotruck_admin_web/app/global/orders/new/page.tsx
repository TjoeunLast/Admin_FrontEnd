// app/admin/orders/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/app/features/shared/api/client";
import {
  fetchOrdersPage,
  fetchCancelledOrdersPage,
  forceAllocateOrder,
  cancelOrder,
  fetchAdminSummary,
} from "@/app/features/shared/api/order_api";

const ORDER_DRIVING_STATUS_MAP: Record<string, string> = {
  REQUESTED: "배차 대기", // 화주가 주문을 올린 직후
  APPLIED: "승인 대기", // 차주가 지원하여 관리자 승인 기다리는 중
  ALLOCATED: "배차 확정", // 배차가 완료된 상태
  ACCEPTED: "배차 확정", // 서버에 따라 ACCEPTED로 내려오는 경우 대응
  LOADING: "상차 중", // 물건 싣는 중
  IN_TRANSIT: "이동 중", // 목적지로 이동 중
  UNLOADING: "하차 중", // 물건 내리는 중
  COMPLETED: "운송 완료", // 모든 프로세스 종료
  CANCELLED: "주문 취소", // 사용자/시스템 취소
  CANCELLED_BY_ADMIN: "관리자 취소", // 관리자 강제 취소
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | null;
};

export default function AdminOrderListPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"all" | "cancelled">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [isDriversLoading, setIsDriversLoading] = useState(false);
  const [driverSearchTerm, setDriverSearchTerm] = useState("");

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "orderId",
    direction: "desc",
  });

  // useCallback으로 감싸 의존성 경고 해결
  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const summaryData = await fetchAdminSummary("month");
      setSummary(summaryData);
      const orderPage =
        viewMode === "all"
          ? await fetchOrdersPage(page, pageSize)
          : await fetchCancelledOrdersPage(page, pageSize);
      setOrders(orderPage.content);
      setTotalPages(orderPage.totalPages);
      setTotalElements(orderPage.totalElements);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, viewMode]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    setPage(0);
  }, [viewMode]);

  // 차주 목록 로드 함수
  const fetchDriverList = useCallback(async () => {
    setIsDriversLoading(true);
    try {
      const response = await apiClient.get("/api/v1/admin/user", {
        params: { role: "DRIVER" },
      });
      setAvailableDrivers(response.data);
    } catch (error) {
      console.error("차주 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 배차 버튼 클릭 시 목록 로드 로직 연결
  const handleOpenAllocate = (orderId: number) => {
    setSelectedOrder(orderId);
    fetchDriverList();
  };

  const handleConfirmAllocate = async (
    driverId: number,
    driverName: string,
  ) => {
    if (!selectedOrder) return;
    if (
      !confirm(
        `${driverName} 기사님을 #${selectedOrder} 오더에 배차하시겠습니까?`,
      )
    )
      return;
    try {
      await forceAllocateOrder(selectedOrder, driverId, "관리자 직접 지정");
      alert("배차가 완료되었습니다.");
      closeForceAllocateModal();
      loadPageData();
    } catch {
      alert("배차 실패: 서버 오류가 발생했습니다.");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    if (!cancelReason.trim()) return alert("취소 사유를 입력해주세요.");
    try {
      await cancelOrder(cancelTargetId, cancelReason);
      alert("오더가 취소되었습니다.");
      closeCancelModal();
      loadPageData();
    } catch {
      alert("취소 처리 중 오류가 발생했습니다.");
    }
  };

  const filteredDrivers = availableDrivers.filter(
    (d) =>
      d.nickname?.includes(driverSearchTerm) ||
      d.phone?.includes(driverSearchTerm),
  );

  const closeCancelModal = () => {
    setCancelTargetId(null);
    setCancelReason("");
  };

  const closeForceAllocateModal = () => {
    setSelectedOrder(null);
    setAvailableDrivers([]);
    setDriverSearchTerm("");
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "REQUESTED":
      case "APPLIED":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "IN_TRANSIT":
      case "LOADING":
      case "UNLOADING":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "CANCELLED":
      case "CANCELLED_BY_ADMIN":
        return "bg-rose-50 text-rose-600 border-rose-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // 정렬 로직 내 let을 const로 수정
  const sortedOrders = useMemo(() => {
    const result = [...orders];
    if (sortConfig.direction !== null) {
      result.sort((a, b) => {
        const aValue =
          sortConfig.key === "totalPrice"
            ? a.totalPrice || Number(a.basePrice || 0) + Number(a.laborFee || 0)
            : a[sortConfig.key];
        const bValue =
          sortConfig.key === "totalPrice"
            ? b.totalPrice || Number(b.basePrice || 0) + Number(b.laborFee || 0)
            : b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [orders, sortConfig]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
      <header className="mb-8 pl-1 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/global/orders")}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            오더 관리 센터
          </h1>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("all")}
            className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${viewMode === "all" ? "bg-white text-[#4E46E5] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            실시간 오더
          </button>
          <button
            onClick={() => setViewMode("cancelled")}
            className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${viewMode === "cancelled" ? "bg-white text-rose-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            취소된 목록
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th
                onClick={() => requestSort("orderId")}
                className="w-20 p-5 text-center cursor-pointer hover:text-blue-600 transition-colors"
              >
                오더번호{" "}
                <span
                  className={
                    sortConfig.key === "orderId"
                      ? "text-blue-600"
                      : "text-slate-200"
                  }
                >
                  {sortConfig.key === "orderId" &&
                  sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"}
                </span>
              </th>
              <th className="w-[22%] p-5 text-center">운송 경로</th>
              <th className="w-[12%] p-5 text-center">화주사</th>
              <th className="w-[14%] p-5 text-center">차량 정보</th>
              <th
                onClick={() => requestSort("totalPrice")}
                className="w-28 p-5 text-center cursor-pointer hover:text-blue-600 transition-colors"
              >
                운임{" "}
                <span
                  className={
                    sortConfig.key === "totalPrice"
                      ? "text-blue-600"
                      : "text-slate-200"
                  }
                >
                  {sortConfig.key === "totalPrice" &&
                  sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"}
                </span>
              </th>
              <th className="w-24 p-5 text-center">상태</th>
              <th className="w-32 p-5 text-center">관리 제어</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-10 text-center text-slate-500 font-medium"
                >
                  데이터를 불러오는 중입니다...
                </td>
              </tr>
            ) : (
              sortedOrders.map((order) => {
                const displayPrice =
                  order.totalPrice ||
                  (Number(order.basePrice) || 0) +
                    (Number(order.laborFee) || 0);
                return (
                  <tr
                    key={order.orderId}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="p-5 text-center">
                      <Link
                        href={`/global/orders/${order.orderId}`}
                        className="text-sm font-bold text-[#4E46E5] hover:underline"
                      >
                        {order.orderId}
                      </Link>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 justify-center font-bold text-slate-800 text-sm">
                        <span>{order.startPlace || "미지정"}</span>
                        <span className="text-slate-300 font-light">→</span>
                        <span>{order.endPlace || "미지정"}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center text-slate-600 font-semibold text-sm truncate">
                      {order.user?.nickname || "미지정"}
                    </td>
                    <td className="p-5 text-center text-slate-500 text-[13px] font-bold">
                      {order.reqCarType || "-"}{" "}
                      <span className="text-slate-200 font-normal mx-1">|</span>{" "}
                      {order.reqTonnage || "-"}
                    </td>
                    <td className="p-5 text-center font-bold text-slate-900 text-sm">
                      {displayPrice.toLocaleString()}원
                    </td>
                    <td className="p-5 text-center">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${getStatusClass(order.status)}`}
                      >
                        {ORDER_DRIVING_STATUS_MAP[order.status] || order.status}
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-2 pr-6">
                      {viewMode === "all" && (
                        <>
                          {order.status === "REQUESTED" && (
                            <button
                              onClick={() => handleOpenAllocate(order.orderId)}
                              className="px-3 py-1.5 bg-[#4E46E5] text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-all"
                            >
                              배차
                            </button>
                          )}
                          {!order.status.includes("CANCELLED") && (
                            <button
                              onClick={() => setCancelTargetId(order.orderId)}
                              className="px-3 py-1.5 bg-white text-rose-600 border border-rose-100 text-[11px] font-bold rounded-lg hover:bg-rose-50 transition-all"
                            >
                              취소
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-8 py-6 border-t border-slate-100 bg-white">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="text-sm font-bold text-slate-400 disabled:opacity-20 transition-colors hover:text-slate-600"
            >
              이전
            </button>
            <div className="flex items-center gap-4">
              {Array.from({ length: totalPages }, (_, i) => i).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`text-md font-bold transition-colors ${
                    page === num
                      ? "text-slate-900 underline underline-offset-4 decoration-2"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {num + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                setPage((prev) => (prev + 1 < totalPages ? prev + 1 : prev))
              }
              disabled={totalPages === 0 || page + 1 >= totalPages}
              className="text-sm font-bold text-slate-400 disabled:opacity-20 transition-colors hover:text-slate-600"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 강제 배차 모달 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-1">기사 배정</h2>
            <p className="text-sm font-semibold text-slate-400 mb-6">
              오더 <span className="text-blue-600">#{selectedOrder}</span>번에
              배정할 기사를 선택하세요.
            </p>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="기사 이름 또는 전화번호 검색"
                className="w-full bg-slate-50 border border-slate-200 p-3 pl-10 rounded-xl outline-none focus:border-blue-500 font-semibold text-sm placeholder:text-slate-300"
                value={driverSearchTerm}
                onChange={(e) => setDriverSearchTerm(e.target.value)}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <div className="max-h-60 overflow-y-auto mb-6 space-y-2 pr-1 custom-scrollbar">
              {isDriversLoading ? (
                <div className="text-center py-10 text-slate-400 text-sm font-bold">
                  데이터 로드 중...
                </div>
              ) : filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver) => (
                  <button
                    key={driver.userId}
                    onClick={() =>
                      handleConfirmAllocate(driver.userId, driver.nickname)
                    }
                    className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-slate-800 group-hover:text-blue-600 text-sm">
                        {driver.nickname}
                      </p>
                      <p className="text-[11px] text-slate-400 font-semibold">
                        {driver.phone || "연락처 없음"}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      선택
                    </span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm font-medium">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
            <button
              onClick={closeForceAllocateModal}
              className="w-full bg-slate-50 text-slate-500 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 취소 모달 */}
      {cancelTargetId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              오더 취소 사유
            </h2>
            <p className="text-sm font-semibold text-slate-400 mb-6">
              오더{" "}
              <span className="text-rose-500 font-bold">#{cancelTargetId}</span>{" "}
              번의 취소 이유를 입력하세요.
            </p>
            <textarea
              placeholder="예: 화주 요청에 의한 취소"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6 outline-none focus:border-rose-500 font-medium text-sm h-28 resize-none placeholder:text-slate-300"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleConfirmCancel}
                className="bg-rose-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-rose-700 transition-all"
              >
                취소 확정
              </button>
              <button
                onClick={closeCancelModal}
                className="bg-slate-50 text-slate-500 py-3 rounded-xl font-bold text-sm hover:bg-slate-100"
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
