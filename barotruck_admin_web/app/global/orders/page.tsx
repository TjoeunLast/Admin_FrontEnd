"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  fetchOrders,
  fetchAdminSummary,
} from "./../../features/shared/api/order_api";
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
  const [orders, setOrders] = useState<OrderListResponse[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ 정렬 상태 추가
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "orderId",
    direction: "desc",
  });

  // ✅ 프론트엔드에서 직접 계산하는 통계 데이터
  const stats = useMemo(() => {
    const total = orders.length;
    // 완료(COMPLETED)와 취소(CANCEL)를 제외한 나머지를 '진행 중'으로 간주
    const active = orders.filter(
      (o) => o.status !== "COMPLETED" && !o.status.includes("CANCEL"),
    ).length;
    const completed = orders.filter((o) => o.status === "COMPLETED").length;
    const cancelled = orders.filter((o) => o.status.includes("CANCEL")).length;

    return { total, active, completed, cancelled };
  }, [orders]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchOrders();
        setOrders(data);
      } catch (error) {
        console.error("주문 목록을 불러오는데 실패하였습니다.", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, []);

  // ✅ 필터링 및 정렬 로직 통합
  useEffect(() => {
    let result = [...orders];

    // 1. 필터링
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

    // 2. 정렬
    if (sortConfig.direction !== null) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        // 가격 필드의 경우 합산 금액으로 비교
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

  // ✅ 정렬 핸들러
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
      <div className="p-10 text-center text-gray-500">
        데이터를 불러오는 중입니다...
      </div>
    );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <header className="mb-8 pl-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              주문 목록 관리
            </h1>
          </div>
        </div>
        <Link href="/global/orders/new">
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
            <span>배차 관리</span>
          </button>
        </Link>
      </header>

      {/* 상단 통계 위젯 추가 */}
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

      {/* 필터 섹션 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 flex gap-4 items-end shadow-sm">
        <div className="w-44">
          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">
            운송 상태
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">전체 상태</option>
            <option value="REQUESTED">배차 대기</option>
            <option value="ACCEPTED">배차 확정</option>
            <option value="IN_TRANSIT">운송 중</option>
            <option value="COMPLETED">운송 완료</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">
            주문 검색
          </label>
          <input
            type="text"
            placeholder="주문번호, 상차지, 하차지 키워드 입력"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              {/* 클릭 시 정렬 가능하도록 th 수정 */}
              <th
                onClick={() => requestSort("orderId")}
                className="w-20 p-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
              >
                ID{" "}
                {sortConfig.key === "orderId" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="w-[28%] p-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                운송 경로
              </th>
              <th className="w-[18%] p-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                물품 정보
              </th>
              <th className="w-[15%] p-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                차량 정보
              </th>
              <th
                onClick={() => requestSort("totalPrice")}
                className="w-32 p-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
              >
                운임{" "}
                {sortConfig.key === "totalPrice" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="w-28 p-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                상태
              </th>
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
                  className="hover:bg-slate-50/50 transition-all group cursor-default"
                >
                  <td className="p-4 text-center">
                    <Link
                      href={`/global/orders/${order.orderId}`}
                      className="text-sm font-bold text-blue-600 hover:underline"
                    >
                      {order.orderId}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-center">
                      <span className="font-bold text-slate-700 text-sm">
                        {order.startPlace}
                      </span>
                      <span className="text-slate-300 text-xs font-light">
                        →
                      </span>
                      <span className="font-bold text-slate-700 text-sm">
                        {order.endPlace}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-slate-600 font-medium text-sm truncate">
                    {order.cargoContent || "일반 화물"}
                  </td>
                  <td className="p-4 text-center text-slate-500 text-[13px] font-semibold">
                    {order.reqCarType}{" "}
                    <span className="text-slate-300 font-normal mx-1">|</span>{" "}
                    {order.reqTonnage}
                  </td>
                  <td className="p-4 text-right pr-8">
                    <span className="text-sm font-bold text-slate-900">
                      {displayPrice.toLocaleString()}원
                    </span>
                  </td>
                  <td className="p-4 text-center">
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
      </div>
    </div>
  );
}
