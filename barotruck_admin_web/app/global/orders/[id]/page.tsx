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
        
        // 💡 1. 주문 상세 정보와 차주 목록을 "동시에" 불러옵니다.
        const [orderData, driverDataList] = await Promise.all([
            fetchOrderDetail(orderId),
            fetchOrderDrivers(orderId).catch(() => null) // 차주가 없어도 에러 안 나게 방어
        ]);
        
        // 2. 주문 정보 세팅 (AdminOrderDetailResponse)
        setOrder(orderData);

        // 3. 차주 정보 세팅 (배열의 첫 번째 기사 정보를 세팅)
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

  if(isLoading) return <div className="p-10 font-bold text-slate-500">데이터를 불러오는 중입니다...</div>;
  if(!order) return <div className="p-10 font-bold text-red-500">주문 정보를 찾을 수 없습니다.</div>;

  // 💡 수정됨: 상태값에 'CANCELLED'라는 단어가 "포함"되어 있으면 무조건 취소로 처리합니다.
  // (CANCELLED_BY_ADMIN, CANCELLED_BY_SHIPPER 모두 정상 작동)
  const isCancelled = order.status?.includes('CANCELLED');

  const timelineSteps = [
    { id: 'PENDING', label: '접수 대기' },
    { id: 'REQUESTED', label: '배차 대기' },
    { id: 'ACCEPTED', label: '배차 확정' },
    { id: 'LOADING', label: '상차 중' },
    { id: 'IN_TRANSIT', label: '운송 중' },
    { id: 'UNLOADING', label: '하차 중' },
    { id: 'COMPLETED', label: '운송 완료' },
  ];

  const currentStatusIndex = timelineSteps.findIndex(step => step.id === order.status);

  // 💡 운임 합산 계산 (기본운임 + 수작업비 + 포장비 + 보험료)
  const calculateTotalPrice = () => {
      if (order.basePrice == null) return null;
      return (order.basePrice || 0) + (order.laborFee || 0) + (order.packagingPrice || 0) + (order.insuranceFee || 0);
  };
  const totalPrice = calculateTotalPrice();

  return (
    <div className="max-w-5xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-[#1e293b]">
          주문 상세 정보 <span className="text-blue-600 ml-2">#{orderId}</span>
          <span className="ml-4 text-sm font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full align-middle">
            {ORDER_DRIVING_STATUS_MAP?.[order.status] || order.status}
          </span>
        </h1>
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">뒤로 가기</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-[#1e293b]">운송 구간 정보</h3>
            <div className="space-y-8 relative">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-600 z-10" />
                  <div className="w-0.5 h-16 bg-slate-100" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase">상차지</p>
                  <p className="text-lg font-bold text-[#1e293b] mt-1">{order.startPlace}</p>
                  <p className="text-sm text-slate-400">{order.startSchedule}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-4 h-4 rounded-full bg-emerald-500 z-10" />
                <div>
                  <p className="text-xs font-bold text-emerald-500 uppercase">하차지</p>
                  <p className="text-lg font-bold text-[#1e293b] mt-1">{order.endPlace}</p>
                  <p className="text-sm text-slate-400">도착 예정 (API 연동 필요)</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">요청 화주</p>
              <p className="font-bold text-[#1e293b]">
                {/* 💡 수정됨: 화주 이름 뒤에 전화번호(shipperPhone)가 있으면 같이 띄워줍니다. */}
                {order.shipperNickname 
                  ? `${order.shipperNickname} ${order.shipperPhone ? `(${order.shipperPhone})` : ''}` 
                  : "화주 정보 없음"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">담당 차주</p>
              <p className="font-bold text-[#1e293b]">
                {/* 💡 driver API 응답을 통해 출력 */}
                {driver 
                  ? `${driver.nickname} (${driver.phone}) / ${driver.tonnage}톤 ${driver.carType}` 
                  : "배차 대기 중"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">최종 운임</p>
              <p className="text-xl font-black text-blue-600">
                {/* 💡 basePrice 등을 합산한 가격 출력 */}
                {totalPrice != null ? `${totalPrice.toLocaleString()}원` : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">인수증 확인</p>
              <button className="text-xs font-bold text-slate-500 underline hover:text-blue-600">파일 열기</button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm h-full">
            <h3 className="text-lg font-bold mb-8 text-[#1e293b]">운송 타임라인</h3>
            <div className="space-y-8">
              {/* 💡 수정된 isCancelled 로직 덕분에 취소된 주문은 이 부분이 랜더링됩니다. */}
              {isCancelled ? (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 z-10 ring-4 ring-red-100" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-600">주문 취소됨</p>
                    <p className="text-[11px] text-slate-400">
                      {order.cancellation?.cancelReason || "관리자 또는 화주에 의해 취소됨"}
                    </p>
                  </div>
                </div>
              ) : (
                timelineSteps.map((step, i) => {
                  const isDone = currentStatusIndex >= i;
                  const isActive = currentStatusIndex === i;
                  const isLineActive = currentStatusIndex > i;

                  return (
                    <div key={step.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full transition-colors ${
                          isDone ? 'bg-blue-600' : 'bg-slate-200'
                        } ${isActive ? 'ring-4 ring-blue-100' : ''}`} />
                        
                        {i !== timelineSteps.length - 1 && (
                          <div className={`w-0.5 h-10 transition-colors ${
                            isLineActive ? 'bg-blue-600' : 'bg-slate-100'
                          }`} />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-bold transition-colors ${
                          isActive ? 'text-blue-600' : isDone ? 'text-[#1e293b]' : 'text-slate-300'
                        }`}>
                          {step.label}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {i === 0 && order.startSchedule ? order.startSchedule : "-"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}