"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { fetchOrders, fetchOrdersPage } from "./../../features/shared/api/order_api";
import {
  OrderListResponse,
  ORDER_DRIVING_STATUS_MAP,
} from "../../features/orders/type";

// 정렬 타입 정의
type SortConfig = {
  key: keyof OrderListResponse | "totalPrice";
  direction: "asc" | "desc" | null;
};

export default function Order_Page() {
  const router = useRouter(); // 행 클릭 이동을 위해 추가
  const [orders, setOrders] = useState<OrderListResponse[]>([]);
  const [allOrders, setAllOrders] = useState<OrderListResponse[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "orderId",
    direction: "desc",
  });

  const stats = useMemo(() => {
    const source = allOrders.length > 0 ? allOrders : orders;
    const total = allOrders.length > 0 ? allOrders.length : totalElements;
    const active = source.filter(
      (o) => o.status !== "COMPLETED" && !o.status.includes("CANCEL"),
    ).length;
    const completed = source.filter((o) => o.status === "COMPLETED").length;
    const cancelled = source.filter((o) => o.status.includes("CANCEL")).length;
    return { total, active, completed, cancelled };
  }, [allOrders, orders, totalElements]);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const data = await fetchOrdersPage(page, pageSize);
        setOrders(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } catch (error) {
        console.error("주문 목록 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, [page, pageSize]);

  useEffect(() => {
    const loadAllOrdersForStats = async () => {
      setIsStatsLoading(true);
      try {
        const allOrderData = await fetchOrders();
        setAllOrders(allOrderData);
      } catch (error) {
        console.error("전체 주문 통계 로드 실패:", error);
      } finally {
        setIsStatsLoading(false);
      }
    };
    loadAllOrdersForStats();
  }, []);

  useEffect(() => {
    let result = [...orders];
    if (statusFilter !== "ALL")
      result = result.filter((order) => order.status === statusFilter);
    if (searchTerm.trim() !== "") {
      const keyword = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          String(order.orderId).includes(keyword) ||
          order.startPlace?.toLowerCase().includes(keyword) ||
          order.endPlace?.toLowerCase().includes(keyword),
      );
    }
    if (sortConfig.direction !== null) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        if (sortConfig.key === "totalPrice") {
          aValue =
            a.totalPrice || Number(a.basePrice || 0) + Number(a.laborFee || 0);
          bValue =
            b.totalPrice || Number(b.basePrice || 0) + Number(b.laborFee || 0);
        } else {
          aValue = a[sortConfig.key as keyof OrderListResponse];
          bValue = b[sortConfig.key as keyof OrderListResponse];
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    setFilteredOrders(result);
  }, [orders, statusFilter, searchTerm, sortConfig]);

  const requestSort = (key: SortConfig["key"]) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
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
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  if (isLoading || isStatsLoading)
    return (
      <div className="p-20 text-center text-slate-400 font-black text-lg">
        데이터 분석 중...
      </div>
    );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
      <header className="mb-8 pl-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            주문 목록 관리
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-400">
            전체 운송 주문의 실시간 상태 및 배차 정보를 관리합니다.
          </p>
        </div>
        <Link href="/global/orders/new">
          <button className="bg-[#4E46E5] text-white px-6 py-2.5 rounded-xl font-black text-xs hover:opacity-90 active:scale-95 transition-all shadow-md">
            배차 관리
          </button>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[
          { label: "전체 오더", val: stats.total, color: "text-slate-900" },
          {
            label: "진행 중인 오더",
            val: stats.active,
            color: "text-blue-600",
          },
          {
            label: "완료된 오더",
            val: stats.completed,
            color: "text-emerald-600",
          },
          {
            label: "취소된 오더",
            val: stats.cancelled,
            color: "text-rose-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500 mb-1">{s.label}</p>
            <div className="flex items-baseline gap-1">
              <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
              <span className="text-sm font-medium text-slate-400">건</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-6 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="w-48 flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            운송 상태
          </label>
          <div className="relative">
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#4E46E5] transition-all cursor-pointer appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">전체 상태</option>
              <option value="REQUESTED">배차 대기</option>
              <option value="ACCEPTED">배차 확정</option>
              <option value="IN_TRANSIT">운송 중</option>
              <option value="COMPLETED">운송 완료</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-[300px] flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            주문 통합 검색
          </label>
          <input
            type="text"
            placeholder="주문번호, 상차지, 하차지 키워드 입력"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#4E46E5] transition-all placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr className="text-[12px] font-black text-slate-500 uppercase tracking-widest">
              <th
                onClick={() => requestSort("orderId")}
                className="w-32 p-6 text-center cursor-pointer hover:text-[#4E46E5] transition-colors"
              >
                오더 번호{" "}
                <span
                  className={
                    sortConfig.key === "orderId"
                      ? "text-[#4E46E5]"
                      : "text-slate-200"
                  }
                >
                  {sortConfig.key === "orderId" &&
                  sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"}
                </span>
              </th>
              <th className="p-6 text-center">운송 경로</th>
              <th className="p-6 text-center w-[20%]">물품 정보</th>
              <th className="p-6 text-center w-[15%]">차량 정보</th>
              <th
                onClick={() => requestSort("totalPrice")}
                className="w-32 p-6 text-center cursor-pointer hover:text-[#4E46E5] transition-colors"
              >
                운임{" "}
                <span
                  className={
                    sortConfig.key === "totalPrice"
                      ? "text-[#4E46E5]"
                      : "text-slate-200"
                  }
                >
                  {sortConfig.key === "totalPrice" &&
                  sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"}
                </span>
              </th>
              <th className="p-6 text-center w-48">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((order) => {
              const displayPrice =
                order.totalPrice ||
                (Number(order.basePrice) || 0) + (Number(order.laborFee) || 0);
              return (
                <tr
                  key={order.orderId}
                  onClick={() => router.push(`/global/orders/${order.orderId}`)}
                  className="odd:bg-white even:bg-slate-50/30 hover:bg-indigo-50/50 cursor-pointer transition-all group"
                >
                  <td className="p-6 text-slate-900 text-center text-sm font-black border-r border-slate-50">
                    #{order.orderId}
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <span className="font-black text-slate-800 text-[15px]">
                        {order.startPlace}
                      </span>
                      <span className="text-slate-300 text-xs font-light">
                        →
                      </span>
                      <span className="font-black text-slate-800 text-[15px]">
                        {order.endPlace}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-center text-slate-600 font-bold text-sm truncate">
                    {order.cargoContent || "일반 화물"}
                  </td>
                  <td className="p-6 text-center text-slate-500 text-sm font-bold">
                    {order.reqCarType}{" "}
                    <span className="text-slate-200 font-normal mx-1">|</span>{" "}
                    {order.reqTonnage}
                  </td>
                  <td className="p-6 text-center font-black text-slate-900 text-sm">
                    {displayPrice.toLocaleString()}원
                  </td>
                  <td className="p-6 text-center">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${getStatusClass(order.status)}`}
                    >
                      {ORDER_DRIVING_STATUS_MAP[order.status] || order.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-10 py-10 border-t border-slate-100 bg-white font-black">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="text-sm text-slate-400 disabled:opacity-20 hover:text-slate-900 transition-all active:scale-90"
            >
              이전
            </button>
            <div className="flex gap-6">
              {Array.from({ length: totalPages }, (_, i) => i).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`text-sm transition-all ${page === num ? "text-slate-900 underline underline-offset-8 decoration-[3px]" : "text-slate-400 hover:text-slate-600"}`}
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
              className="text-sm text-slate-400 disabled:opacity-20 hover:text-slate-900 transition-all active:scale-90"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
