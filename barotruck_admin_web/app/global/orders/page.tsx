"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { fetchOrdersPage } from "./../../features/shared/api/order_api";
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
  /* 상태 관리 및 데이터 정의 */
  const [orders, setOrders] = useState<OrderListResponse[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  /* 상단 통계 요약 계산 */
  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter(
      (o) => o.status !== "COMPLETED" && !o.status.includes("CANCEL"),
    ).length;
    const completed = orders.filter((o) => o.status === "COMPLETED").length;
    const cancelled = orders.filter((o) => o.status.includes("CANCEL")).length;

    return { total, active, completed, cancelled };
  }, [orders]);

  /* API 데이터 호출 */
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const data = await fetchOrdersPage(page, pageSize);
        setOrders(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } catch (error) {
        console.error("주문 목록을 불러오는데 실패하였습니다.", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, [page, pageSize]);

  /* 필터링 및 정렬 처리 */
  useEffect(() => {
    let result = [...orders];

    if (statusFilter !== "ALL") {
      result = result.filter((order) => order.status === statusFilter);
    }

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

  /* 유틸리티 함수 */
  const requestSort = (key: SortConfig["key"]) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
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

  if (isLoading)
    return (
      <div className="p-10 text-center text-slate-500 font-medium">
        데이터를 불러오는 중입니다...
      </div>
    );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* 페이지 헤더 */}
      <header className="mb-8 pl-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          주문 목록 관리
        </h1>
        <Link href="/global/orders/new">
          <button className="bg-[#4E46E5] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-2">
            <span>배차 관리</span>
          </button>
        </Link>
      </header>

      {/* 통계 위젯 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">전체 오더</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            <span className="text-sm font-medium text-slate-400">건</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">
            진행 중인 오더
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
            <span className="text-sm font-medium text-slate-400">건</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">완료된 오더</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-emerald-600">
              {stats.completed}
            </p>
            <span className="text-sm font-medium text-slate-400">건</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">취소된 오더</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-rose-600">
              {stats.cancelled}
            </p>
            <span className="text-sm font-medium text-slate-400">건</span>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 영역 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 flex gap-4 items-center shadow-sm">
        <div className="w-48 flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            운송 상태
          </label>
          <div className="relative">
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">전체 상태</option>
              <option value="REQUESTED">배차 대기</option>
              <option value="ACCEPTED">배차 확정</option>
              <option value="IN_TRANSIT">운송 중</option>
              <option value="COMPLETED">운송 완료</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            주문 검색
          </label>
          <input
            type="text"
            placeholder="주문번호, 상차지, 하차지 키워드 입력"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 주문 목록 테이블 */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th
                onClick={() => requestSort("orderId")}
                className="w-20 p-5 text-center cursor-pointer hover:text-blue-600 transition-colors"
              >
                오더 번호{" "}
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
              <th className="w-[28%] p-5 text-center">운송 경로</th>
              <th className="w-[18%] p-5 text-center">물품 정보</th>
              <th className="w-[15%] p-5 text-center">차량 정보</th>
              <th
                onClick={() => requestSort("totalPrice")}
                className="w-32 p-5 text-center cursor-pointer hover:text-blue-600 transition-colors"
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
              <th className="p-5 text-center w-28">상태</th>
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
                    <div className="flex items-center gap-2 justify-center">
                      <span className="font-bold text-slate-800 text-sm">
                        {order.startPlace}
                      </span>
                      <span className="text-slate-300 text-xs font-light">
                        →
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {order.endPlace}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 text-center text-slate-600 font-semibold text-sm truncate">
                    {order.cargoContent || "일반 화물"}
                  </td>
                  <td className="p-5 text-center text-slate-500 text-[13px] font-bold">
                    {order.reqCarType}{" "}
                    <span className="text-slate-200 font-normal mx-1">|</span>{" "}
                    {order.reqTonnage}
                  </td>
                  <td className="p-5 text-center">
                    <span className="text-sm font-bold text-slate-900">
                      {displayPrice.toLocaleString()}원
                    </span>
                  </td>
                  <td className="p-5 text-center">
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

        {/* 페이지네이션 처리 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-8 py-6 border-t border-slate-100 bg-white">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="text-xs font-bold text-slate-400 disabled:opacity-20 transition-colors hover:text-slate-600"
            >
              이전
            </button>
            <div className="flex items-center gap-4">
              {Array.from({ length: totalPages }, (_, i) => i).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`text-xs font-bold transition-colors ${
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
              className="text-xs font-bold text-slate-400 disabled:opacity-20 transition-colors hover:text-slate-600"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
