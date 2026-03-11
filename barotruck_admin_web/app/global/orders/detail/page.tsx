"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchOrderDetail } from "@/app/features/shared/api/order_api";
import { fetchDriversForAllocation } from "@/app/features/shared/api/user_api";
import { ORDER_DRIVING_STATUS_MAP } from "@/app/features/orders/type";

function OrderDetailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = Number(searchParams.get("id"));

  const [order, setOrder] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const MAIN_COLOR = "#4E46E5";

  const loadData = useCallback(async () => {
    if (!orderId) return;
    try {
      setIsLoading(true);
      const orderData = await fetchOrderDetail(orderId);
      setOrder(orderData);

      if (orderData.driverNo) {
        const allDrivers = await fetchDriversForAllocation();
        const matchedDriver = allDrivers.find(
          (d: any) => d.userId === orderData.driverNo,
        );
        setDriver(matchedDriver || null);
      }
    } catch (error) {
      console.error("데이터 로드 실패: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading)
    return (
      <div className="p-10 text-center font-bold text-slate-300 text-xl">
        데이터 로딩 중...
      </div>
    );
  if (!order)
    return (
      <div className="p-10 text-center font-bold text-rose-500 text-xl">
        오더 정보 없음
      </div>
    );

  const isCancelled = ["CANCELLED", "CANCELLED_BY_ADMIN"].includes(
    order.status,
  );

  const timelineSteps = [
    { id: "REQUESTED", label: "배차대기", color: "#fbbf24" },
    { id: "ACCEPTED", label: "배차확정", color: "#4E46E5" },
    { id: "LOADING", label: "상차중", color: "#4E46E5" },
    { id: "IN_TRANSIT", label: "운송중", color: "#4E46E5" },
    { id: "UNLOADING", label: "하차중", color: "#4E46E5" },
    { id: "COMPLETED", label: "운송완료", color: "#10b981" },
  ];

  const currentStatusIndex = timelineSteps.findIndex(
    (step) => step.id === order.status,
  );
  const totalPrice =
    (order.basePrice || 0) +
    (order.laborFee || 0) +
    (order.packagingPrice || 0) +
    (order.insuranceFee || 0);

  return (
    <div className="w-full space-y-6 pb-10 font-sans text-black">
      {/* 1. 헤더: 배차 관리 페이지와 동일한 스타일 적용 */}
      <header className="mb-8 pl-1 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
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
            오더 상세 <span className="text-indigo-600">#{orderId}</span>
          </h1>
        </div>

        <div className="flex items-center">
          <span
            className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase ${
              isCancelled
                ? "bg-rose-50 text-rose-600 border-rose-100"
                : "bg-indigo-50 text-indigo-700 border-indigo-100"
            }`}
          >
            {ORDER_DRIVING_STATUS_MAP?.[order.status] || order.status}
          </span>
        </div>
      </header>

      {/* 2. 통합 경로 및 상태 바 */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
        {isCancelled && (
          <div className="bg-rose-50 px-6 py-2.5 flex items-center gap-2 border-b border-rose-100 text-rose-600 font-black text-[11px]">
            <span>취소된 오더</span>
          </div>
        )}

        <div className="p-10 flex items-start gap-12 relative">
          {/* 상차지 섹션 */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-[11px] font-black text-indigo-500 uppercase">
              상차 정보{" "}
              {order.startType && (
                <span className="text-rose-500 ml-2">● {order.startType}</span>
              )}
            </div>
            <div>
              <p className="text-2xl font-black leading-tight mb-1">
                {order.startPlace}
              </p>
              <p className="text-[15px] text-slate-500 font-bold">
                {order.startAddr}
              </p>
            </div>
            <div className="text-xs font-bold text-slate-400 italic">
              {order.startSchedule} 상차
            </div>
          </div>

          {/* 중앙 거리 표시 */}
          <div className="shrink-0 self-center flex flex-col items-center gap-1.5 px-6">
            <span className="text-sm font-black text-slate-700">
              {order.distance} km
            </span>
            <div className="h-[1.5px] w-16 bg-slate-100" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
              총 거리
            </span>
          </div>

          {/* 하차지 섹션 */}
          <div className="flex-1 space-y-4 text-right">
            <div className="flex items-center gap-2 justify-end text-[11px] font-black text-emerald-500 uppercase">
              {order.endType && (
                <span className="text-orange-500 mr-2">● {order.endType}</span>
              )}{" "}
              하차 정보
            </div>
            <div>
              <p className="text-2xl font-black leading-tight mb-1">
                {order.endPlace}
              </p>
              <p className="text-[15px] text-slate-500 font-bold">
                {order.endAddr}
              </p>
            </div>
          </div>
        </div>

        {/* 상태 타임라인 */}
        <div className="bg-slate-50/30 px-6 py-8 flex items-center justify-between">
          {timelineSteps.map((step, i) => {
            const isDone = currentStatusIndex >= i;
            const isActive = currentStatusIndex === i;
            return (
              <div
                key={step.id}
                className="flex flex-col items-center gap-3 flex-1 relative"
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all z-10 ${isActive ? "ring-4 ring-offset-2" : ""}`}
                  style={{
                    backgroundColor: isDone ? step.color : "#CBD5E1",
                    boxShadow: isActive ? `0 0 0 4px ${step.color}20` : "none",
                  }}
                />
                <p
                  className={`text-[13px] font-black whitespace-nowrap ${isActive ? "text-black" : isDone ? "text-slate-500" : "text-slate-300"}`}
                >
                  {step.label}
                </p>
                {i < timelineSteps.length - 1 && (
                  <div
                    className={`absolute top-[6px] left-[50%] w-full h-[2px] -z-0 ${isDone && currentStatusIndex > i ? "bg-indigo-200" : "bg-slate-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. 상세 정보 및 금액 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 font-black text-xs text-slate-800 tracking-wider">
            오더 상세 내역
          </div>
          <div className="divide-y divide-slate-50">
            <TableItem
              label="등록 일시"
              value={order.createdAt?.replace("T", " ")}
              highlight
            />
            <TableItem label="화물 내용" value={order.cargoContent} />
            <div className="grid grid-cols-2 divide-x divide-slate-50">
              <TableItem label="요청 차종" value={order.reqCarType} />
              <TableItem label="요청 톤수" value={order.reqTonnage} />
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-50">
              <TableItem label="운송 방식" value={order.driveMode} />
              <TableItem label="상차 방법" value={order.loadMethod} />
            </div>
            <TableItem label="관리자 메모" value={order.memo} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center font-black text-xs tracking-wider">
            운임 및 결제
            <span className="text-[11px] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              결제방식: {order.payMethod}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="grid grid-cols-2 divide-x divide-slate-50">
              <TableItem
                label="기본 운임"
                value={`${(order.basePrice || 0).toLocaleString()}원`}
              />
              <TableItem
                label="수작업비"
                value={`${(order.laborFee || 0).toLocaleString()}원`}
              />
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-50">
              <TableItem
                label="포장 비용"
                value={`${(order.packagingPrice || 0).toLocaleString()}원`}
              />
              <TableItem
                label="보험료"
                value={`${(order.insuranceFee || 0).toLocaleString()}원`}
              />
            </div>
            {/* 총 합계 금액 섹션*/}
            <div className="px-6 py-6 flex justify-between items-center bg-indigo-50/30">
              <p className="text-sm font-black text-indigo-400 uppercase tracking-widest">
                총 합계 금액
              </p>
              <p
                className={`text-2xl font-black ${isCancelled ? "text-slate-400 line-through" : "text-indigo-600"}`}
              >
                {totalPrice.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 관계자 정보 */}
      <div className="flex gap-4">
        <UserChip
          label="화주"
          name={order.user?.nickname}
          onClick={() =>
            router.push(`/global/users/detail?userId=${order.user?.userId}`)
          }
        />
        {driver ? (
          <UserChip
            label="차주"
            name={driver.nickname}
            isDriver
            onClick={() =>
              router.push(`/global/users/detail?userId=${driver.userId}`)
            }
          />
        ) : (
          <div className="flex items-center gap-3 pl-5 pr-5 py-3 rounded-full border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">
              차주
            </span>
            <span className="font-black text-[15px]">배차 대기 중</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-slate-300 text-xl">데이터 로딩 중...</div>}>
      <OrderDetailPageContent />
    </Suspense>
  );
}

function TableItem({ label, value, highlight = false }: any) {
  return (
    <div className="flex items-center px-6 py-5 hover:bg-slate-50/30 transition-colors">
      <div className="w-28 text-[11px] font-black text-slate-400 uppercase tracking-tighter">
        {label}
      </div>
      <div
        className={`flex-1 text-[16px] font-bold ${highlight ? "text-indigo-600" : "text-black"}`}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function UserChip({ label, name, isDriver, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 pl-5 pr-2 py-3 rounded-full border border-slate-200 transition-all hover:bg-white hover:shadow-md ${isDriver ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-700"}`}
    >
      <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">
        {label}
      </span>
      <span className="font-black text-[15px]">{name || "정보없음"}</span>
      <div
        className={`text-slate-400 ${isDriver ? "text-indigo-400" : "text-slate-400"}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  );
}
