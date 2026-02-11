"use client";

import { use } from "react";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ShipperDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params); // Next.js 15+ 에서는 params를 unwrap해야 합니다.

  // 샘플 데이터 (ID에 따라 필터링하거나 API 호출)
  const shipperName = id === "1" ? "(주)위시운송" : "기타 화주";

  const details = [
    { no: "260205-01", date: "2026.02.05", route: "서울 → 부산", vehicle: "5톤 카고", amount: 450000, status: "청구완료" },
    { no: "260205-02", date: "2026.02.05", route: "인천 → 대구", vehicle: "11톤 윙바디", amount: 650000, status: "청구완료" },
  ];

  const formatAmount = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

  return (
    <main className="p-8 space-y-6">
      {/* 상단 네비게이션 */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">{shipperName} 상세 내역</h1>
          <p className="text-sm text-[#64748b]">ID: {id} | 해당 화주의 개별 운송 내역입니다.</p>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-[#64748b] font-medium">총 청구 금액 합계</p>
            <p className="text-3xl font-black text-blue-600 mt-1">₩1,100,000</p>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
            명세서 엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 테이블 상세 */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
            <tr className="text-[#64748b] font-bold">
              <th className="p-4">운송번호 / 날짜</th>
              <th className="p-4">구간</th>
              <th className="p-4">차량 정보</th>
              <th className="p-4 text-right">금액</th>
              <th className="p-4 text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d) => (
              <tr key={d.no} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                <td className="p-4">
                  <div className="font-bold text-[#1e293b]">{d.no}</div>
                  <div className="text-[11px] text-[#94a3b8]">{d.date}</div>
                </td>
                <td className="p-4 text-[#475569]">{d.route}</td>
                <td className="p-4 text-[#475569]">{d.vehicle}</td>
                <td className="p-4 text-right font-bold text-[#1e293b]">₩{formatAmount(d.amount)}</td>
                <td className="p-4 text-center">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold">
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}