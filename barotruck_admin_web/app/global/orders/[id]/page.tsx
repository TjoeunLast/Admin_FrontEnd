"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchOrderDetail, fetchOrderDrivers } from "../../../features/shared/api/order_api";
import { ORDER_DRIVING_STATUS_MAP } from "../../../features/orders/type";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if(!orderId) return;
      try {
        setIsLoading(true);
        const [orderData, driverDataList] = await Promise.all([
            fetchOrderDetail(orderId),
            fetchOrderDrivers(orderId).catch(() => null)
        ]);
        setOrder(orderData);
        const drivers = driverDataList as any[];
        if (drivers && drivers.length > 0) {
            setDriver(drivers[0]);
        } else {
            setDriver(null);
        }
      } catch(error) {
        console.error("데이터 로드 실패: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [orderId]);

  if(isLoading) return <div className="p-20 text-center font-bold text-gray-400 animate-pulse uppercase tracking-widest">Loading Data...</div>;
  if(!order) return <div className="p-20 text-center font-bold text-red-500">ORDER NOT FOUND</div>;

  const isCancelled = order.status?.includes('CANCELLED');
  
  // ✅ 타임라인 단계별 고유 색상 정의
  const timelineSteps = [
    { id: 'PENDING', label: '접수 대기', dotColor: 'bg-slate-300' },
    { id: 'REQUESTED', label: '배차 대기', dotColor: 'bg-amber-400' },
    { id: 'ACCEPTED', label: '배차 확정', dotColor: 'bg-indigo-500' },
    { id: 'LOADING', label: '상차 중', dotColor: 'bg-blue-500' },
    { id: 'IN_TRANSIT', label: '운송 중', dotColor: 'bg-sky-500' },
    { id: 'UNLOADING', label: '하차 중', dotColor: 'bg-cyan-500' },
    { id: 'COMPLETED', label: '운송 완료', dotColor: 'bg-emerald-500' },
  ];
  
  const currentStatusIndex = timelineSteps.findIndex(step => step.id === order.status);
  const totalPrice = order.basePrice != null 
    ? (order.basePrice || 0) + (order.laborFee || 0) + (order.packagingPrice || 0) + (order.insuranceFee || 0)
    : null;

  return (
    <div className="max-w-[1800px] mx-auto p-8 space-y-10 min-h-screen relative pb-40 bg-[#fcfdfe]">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-end border-b border-gray-100 pb-8">
        <div>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Order Logistics Detail</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-4">
            주문 상세 정보 <span className="text-gray-300 font-light">/</span> <span className="text-blue-600">{orderId}</span>
          </h1>
        </div>
        <span className="px-5 py-2 bg-white text-gray-700 text-xs font-black rounded-xl border border-gray-200 shadow-sm uppercase tracking-tighter">
          Current Status: {ORDER_DRIVING_STATUS_MAP?.[order.status] || order.status}
        </span>
      </div>

      {/* 가로 4단 레이아웃 + 세로 공간 확장 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
        
        {/* 1. 운송 구간 정보 (세로 확장) */}
        <section className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50 flex flex-col min-h-[600px]">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-12">Transportation Route</h3>
          <div className="flex-1 flex flex-col justify-around relative">
            {/* 연결 선 */}
            <div className="absolute left-[15px] top-[10%] bottom-[10%] w-px bg-dashed bg-gray-100 border-l border-dashed" />
            
            <div className="flex gap-6 items-start z-10">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border-4 border-white shadow-md">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider">상차지 (Origin)</p>
                <p className="font-black text-gray-900 text-xl mt-2 leading-tight">{order.startPlace}</p>
                <p className="text-xs font-bold text-gray-400 mt-3">{order.startSchedule}</p>
              </div>
            </div>

            <div className="flex gap-6 items-start z-10">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border-4 border-white shadow-md">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">하차지 (Destination)</p>
                <p className="font-black text-gray-900 text-xl mt-2 leading-tight">{order.endPlace}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. 요청 화주 정보 (세로 확장) */}
        <section className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50 flex flex-col min-h-[600px]">
          <div className="flex-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-12">Shipper Information</h3>
            <div className="space-y-10">
              <InfoBlock label="화주명" value={order.user.nickname || "정보 없음"} subValue={order.shipperPhone} />
              <InfoBlock label="물품 정보" value={order.cargoContent} />
            </div>
          </div>
          <div className="pt-10 border-t border-gray-50 mt-10">
            <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Total Fare</p>
            <p className="text-3xl font-black text-blue-600 tracking-tighter">
              {totalPrice != null ? `${totalPrice.toLocaleString()}원` : "0원"}
            </p>
          </div>
        </section>

        {/* 3. 담당 차주 정보 (세로 확장) */}
        <section className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50 flex flex-col min-h-[600px]">
          <div className="flex-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-12">Driver Information</h3>
            {driver ? (
              <div className="space-y-10">
                <InfoBlock label="차주명" value={driver.nickname} subValue={driver.phone} />
                <InfoBlock label="차량 제원" value={`${driver.tonnage}톤 ${driver.carType}`} />
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-50 rounded-3xl">
                <p className="text-sm font-bold text-gray-300 italic">배차 대기 중</p>
              </div>
            )}
          </div>
          <div className="pt-10 border-t border-gray-50 mt-10">
            <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Proof of Delivery</p>
            <button className="text-sm font-black text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-2">
              인수증 파일 확인 <span>→</span>
            </button>
          </div>
        </section>

        {/* 4. 운송 타임라인 (상태별 점 색상 차별화) */}
        <section className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50 flex flex-col min-h-[600px]">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-12">Status Timeline</h3>
          <div className="flex-1 flex flex-col justify-between">
            {isCancelled ? (
              <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                <p className="text-xs font-black text-red-600 uppercase mb-2">Order Cancelled</p>
                <p className="text-sm font-bold text-red-800">{order.cancellation?.cancelReason || "관리자에 의한 취소"}</p>
              </div>
            ) : (
              timelineSteps.map((step, i) => {
                const isDone = currentStatusIndex >= i;
                const isActive = currentStatusIndex === i;
                
                return (
                  <div key={step.id} className="flex items-center gap-6 group">
                    {/* ✅ 상태별 고유 점 색상 적용 */}
                    <div className={`w-3 h-3 rounded-full shrink-0 transition-all duration-500 shadow-sm ${
                      isDone ? step.dotColor : 'bg-gray-100'
                    } ${isActive ? 'ring-8 ring-offset-2 ring-gray-50' : ''}`} />
                    
                    <div className="flex-1">
                      <p className={`text-sm font-black transition-colors ${
                        isActive ? 'text-gray-900' : isDone ? 'text-gray-600' : 'text-gray-300'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      {/* 우측 하단 뒤로 가기 버튼 (스타일 강조) */}
      <div className="fixed bottom-12 right-12 z-50">
        <button 
          onClick={() => router.back()} 
          className="bg-gray-950 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 
          Return to List
        </button>
      </div>
    </div>
  );
}

/**
 * 정보 블록 컴포넌트
 */
function InfoBlock({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="font-black text-gray-900 text-lg leading-tight">{value}</p>
      {subValue && <p className="text-sm font-bold text-gray-500">{subValue}</p>}
    </div>
  );
}