"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchOrders } from "@/app/features/shared/api/order_api"; 

export default function ShipperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        // 1. API 호출
        const data = await fetchOrders(); 
        
        // 2. 필터링: DB의 USER_ID와 URL의 id가 같은 것만 필터링
        // ※ 중요: 현재 DB에 USER_ID가 5인 주문은 없으므로, 테스트 시 주소를 /shipper/8 등으로 접속하세요.
        const filtered = data.filter((order: any) => order.orderId === Number(id));
        setOrders(filtered);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [id]);

  const formatAmount = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

  if (loading) return <div className="p-8 text-center text-gray-500">정보 로딩 중...</div>;

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">화주(ID: {id}) 상세 내역</h1>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
            <tr className="text-[#64748b] font-bold">
              <th className="p-4">주문번호 / 생성일</th>
              <th className="p-4">차량 정보</th>
              <th className="p-4 text-blue-600">운송 구간</th>
              <th className="p-4 text-right">기본 운임</th>
              <th className="p-4 text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.orderId} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                  <td className="p-4">
                    <div className="font-bold">ORD-{order.orderId}</div>
                    <div className="text-[11px] text-[#94a3b8]">{order.createdAt}</div>
                  </td>
                  <td className="p-4">{order.tonnage}톤 차량</td>
                  <td className="p-4 font-medium">
                    {order.startPlace || "미지정"} → {order.endPlace || "미지정"}
                  </td>
                  <td className="p-4 text-right font-bold">₩{formatAmount(order.basePrice || 0)}</td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-20 text-center text-gray-400">
                  ID {id}번에 해당하는 주문 데이터가 DB에 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
    </main>
  );
}