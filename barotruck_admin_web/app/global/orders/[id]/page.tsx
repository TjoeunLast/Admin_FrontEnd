"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { fetchOrderDetail } from "@/app/features/shared/api/order_api";
import { fetchDriversForAllocation } from "@/app/features/shared/api/user_api";
import { ORDER_DRIVING_STATUS_MAP } from "@/app/features/orders/type";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = Number(params.id);

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
      <div className="p-10 text-center font-bold text-slate-300">
        로딩 중...
      </div>
    );
  if (!order)
    return (
      <div className="p-10 text-center font-bold text-rose-500">
        오더 정보 없음
      </div>
    );

  const timelineSteps = [
    { id: "REQUESTED", label: "배차 대기", color: "#fbbf24" },
    { id: "ACCEPTED", label: "배차 확정", color: MAIN_COLOR },
    { id: "LOADING", label: "상차 중", color: MAIN_COLOR },
    { id: "IN_TRANSIT", label: "운송 중", color: MAIN_COLOR },
    { id: "UNLOADING", label: "하차 중", color: MAIN_COLOR },
    { id: "COMPLETED", label: "운송 완료", color: "#10b981" },
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
    <div className="w-full space-y-4">
      {/* 1. 헤더 */}
      <div className="flex items-center gap-3 py-2 border-b border-slate-100">
        <button
          onClick={() => router.back()}
          className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-slate-900">
          오더 상세 정보 <span style={{ color: MAIN_COLOR }}>#{orderId}</span>
        </h1>
        <div className="ml-auto">
          <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-md uppercase">
            {ORDER_DRIVING_STATUS_MAP?.[order.status] || order.status}
          </span>
        </div>
      </div>

      {/* 2. 복합 그리드 레이아웃 (가로/세로 혼합) */}
      <div className="grid grid-cols-12 gap-4">
        {/* 상단 왼쪽: 운송 경로 (가로로 길게) */}
        <section className="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[13px] font-black text-slate-800 mb-6">
            운송 경로 상세
          </p>
          <div className="flex items-center justify-between relative px-4 py-4">
            <div className="absolute left-10 right-10 top-1/2 h-px border-t border-dashed border-slate-200 -translate-y-6" />

            <div className="flex flex-col items-center gap-3 z-10 bg-white px-4">
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center ring-2 ring-slate-100 shadow-sm">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: MAIN_COLOR }}
                />
              </div>
              <div className="text-center">
                <p
                  className="text-[11px] font-bold uppercase"
                  style={{ color: MAIN_COLOR }}
                >
                  상차지
                </p>
                <p className="font-bold text-slate-800 text-[15px] mt-1">
                  {order.startPlace}
                </p>
                <p className="text-[11px] text-slate-400">
                  {order.startSchedule}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 z-10 bg-white px-4">
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center ring-2 ring-slate-100 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-emerald-500 uppercase">
                  하차지
                </p>
                <p className="font-bold text-slate-800 text-[15px] mt-1">
                  {order.endPlace}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 상단 오른쪽: 진행 상태 (세로로 길게) */}
        <section className="col-span-12 lg:col-span-4 row-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <p className="text-[13px] font-black text-slate-800 mb-8">
            진행 상태 타임라인
          </p>
          <div className="flex-1 flex flex-col justify-between py-2">
            {timelineSteps.map((step, i) => {
              const isDone = currentStatusIndex >= i;
              const isActive = currentStatusIndex === i;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 transition-all ${isActive ? "scale-105 origin-left" : ""}`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${isActive ? "ring-4 animate-pulse" : ""}`}
                    style={{
                      backgroundColor: isDone ? step.color : "#f1f5f9",
                      boxShadow: isActive ? `0 0 10px ${step.color}` : "none",
                    }}
                  />
                  <p
                    className={`text-[13px] ${isActive ? "font-black text-slate-900" : isDone ? "font-bold text-slate-600" : "font-medium text-slate-200"}`}
                  >
                    {step.label}
                    {isActive && (
                      <span className="ml-2 text-[10px] inline-block opacity-50">
                        ●
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 하단 왼쪽 1: 오더 정보 (가로형) */}
        <section className="col-span-12 lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[13px] font-black text-slate-800 mb-6">
            오더 상세 내역
          </p>
          <div className="grid grid-cols-2 gap-y-5 gap-x-4">
            <InfoBlock label="물품 정보" value={order.cargoContent} />
            <InfoBlock
              label="차종/톤수"
              value={`${order.reqCarType} / ${order.reqTonnage}`}
            />
            <InfoBlock
              label="운송유형"
              value={order.driveMode === "SHARE" ? "혼적" : "독차"}
            />
            <InfoBlock label="상차방법" value={order.loadMethod || "미지정"} />
            <div className="col-span-2">
              <InfoBlock
                label="관리자 메모"
                value={order.memo || "등록된 메모 없음"}
              />
            </div>
          </div>
        </section>

        {/* 하단 왼쪽 2: 금액 정보 (가로형) */}
        <section className="col-span-12 lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[13px] font-black text-slate-800 mb-6">
              운임 및 결제
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <PriceRow label="기본 운임" value={order.basePrice} />
              <PriceRow label="수작업비" value={order.laborFee} />
              <PriceRow label="포장비" value={order.packagingPrice} />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
            <div>
              <p className="text-[13px] font-bold text-slate-300">
                결제 방식:{" "}
                <span className="text-black">{order.payMethod || "-"}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400">최종 합계</p>
              <p className="text-xl font-black" style={{ color: MAIN_COLOR }}>
                {totalPrice.toLocaleString()}원
              </p>
            </div>
          </div>
        </section>

        {/* 최하단 전체 가로: 인적 정보 */}
        <section className="col-span-12 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[13px] font-black text-slate-800 mb-6">
            화주 및 차주 정보
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex items-center gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-slate-300 border border-slate-100 shadow-sm">
                화
              </div>
              <div className="flex-1 grid grid-cols-3 items-center">
                <p className="text-[15px] font-bold text-slate-800">
                  {order.user?.nickname || "-"}
                </p>
                <p className="text-[13px] text-slate-500">
                  {order.user?.phone || order.shipperPhone || "-"}
                </p>
                <p className="text-[13px] text-slate-500 truncate">
                  {order.user?.email || "-"}
                </p>
              </div>
            </div>
            {driver ? (
              <div className="flex items-center gap-6 bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                <div
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black border border-blue-100 shadow-sm"
                  style={{ color: MAIN_COLOR }}
                >
                  차
                </div>
                <div className="flex-1 grid grid-cols-3 items-center">
                  <p
                    className="text-[15px] font-bold"
                    style={{ color: MAIN_COLOR }}
                  >
                    {driver.nickname}
                  </p>
                  <p className="text-[13px] text-slate-600">{driver.phone}</p>
                  <p className="text-[13px] text-slate-500 truncate">
                    {driver.email || "-"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-300 text-[13px] font-bold italic bg-slate-50/30">
                현재 배차 대기 중입니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p className="text-[13px] font-bold text-slate-700">
        {(value || 0).toLocaleString()}원
      </p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-black text-slate-300 uppercase">{label}</p>
      <p className="font-bold text-slate-800 text-[14px] leading-tight">
        {value}
      </p>
    </div>
  );
}
