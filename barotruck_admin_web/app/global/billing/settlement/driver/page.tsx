"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { settlementApi, SettlementResponse } from "@/app/features/shared/api/settlement_api";
import SettlementSummaryCards from "@/app/features/user/billing/settlements_card";

export default function DriverSettlementPage() {
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로드 함수
  const loadSettlements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await settlementApi.getAll(); 
      setSettlements(data || []); // 데이터가 없을 경우 빈 배열 세팅
    } catch (error: any) {
      // 404 에러 발생 시 콘솔에 상세 정보 출력
      console.error("정산 데이터 로드 실패:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  // 지급 실행 함수
  const handlePayout = async (orderId: number) => {
    if (!confirm("해당 건의 지급을 확정하시겠습니까?")) return;
    try {
      await settlementApi.completeByUser(orderId);
      alert("지급 처리가 완료되었습니다.");
      loadSettlements(); // 목록 새로고침
    } catch (error) {
      alert("지급 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <main className="space-y-8 p-6">
      {/* 1. 헤더 및 탭 섹션 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e293b]">정산 및 매출 관리</h1>
          <p className="text-sm text-[#64748b] mt-1">화주 청구 및 차주 지급 현황을 통합 관리합니다.</p>
        </div>
        <div className="bg-[#e2e8f0] p-1 rounded-xl flex gap-1 shadow-inner">
          <button className="px-5 py-2 rounded-lg text-sm font-bold bg-white text-[#1e293b] shadow-sm">
            차주 정산
          </button>
          <Link href="/global/billing/settlement/shipper">
            <button className="px-5 py-2 rounded-lg text-sm font-bold text-[#64748b] hover:bg-white/50 transition-all">
              화주 정산
            </button>
          </Link>
        </div>
      </div>

      {/* 2. 요약 카드 섹션 (기존 UI 유지) */}
      <SettlementSummaryCards data={settlements} type="driver" />

      {/* 3. 리스트 상단 컨트롤 */}
      <div className="flex justify-between items-center mt-10">
        <h3 className="text-lg font-bold text-[#1e293b]">지급 실행 목록 (차주)</h3>
        <button className="bg-[#f1f5f9] text-[#1e293b] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#e2e8f0] transition-all">
          선택 항목 일괄 지급 승인
        </button>
      </div>

      {/* 4. 필터 영역 */}
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          placeholder="차주명을 검색하세요" 
          className="border border-[#e2e8f0] rounded-lg px-4 py-2 text-sm w-64 outline-none focus:border-blue-500"
        />
        <select className="border border-[#e2e8f0] rounded-lg px-4 py-2 text-sm outline-none">
          <option>전체 상태</option>
          <option>지급 대기</option>
          <option>지급 완료</option>
        </select>
      </div>

      {/* 5. 테이블 섹션: settlements 데이터를 맵핑 */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <table className="w-full text-sm text-center">
          <thead className="bg-[#f8fafc] border-b-2 border-[#e2e8f0]">
            <tr className="text-[#64748b] font-bold">
              <th className="p-4 w-12"><input type="checkbox" /></th>
              <th className="p-4">지급 대상(차주)</th>
              <th className="p-4">은행/계좌번호</th>
              <th className="p-4">운송 완료일</th>
              <th className="p-4">총 지급액</th>
              <th className="p-4">상태</th>
              <th className="p-4">관리</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-10 text-slate-400">데이터를 불러오는 중...</td></tr>
            ) : settlements.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-slate-400">표시할 정산 내역이 없습니다.</td></tr>
            ) : (
              settlements.map((s) => (
                <tr key={s.settlementId} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all">
                  <td className="p-4"><input type="checkbox" /></td>
                  <td className="p-4 text-center font-bold">
                    {/* ★ ID(숫자) 대신 차주의 실명을 출력 */}
                    {s.driverName || `차주(${s.driverUserId})`} 
                  </td>
                  <td className="p-4 text-center text-slate-500">
                    {s.bankName && s.accountNum 
                      ? `${s.bankName} ${s.accountNum}` 
                      : "계좌 정보 없음"}
                  </td>
                  <td className="p-4 text-slate-500">
                    {s.feeDate ? new Date(s.feeDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="p-4 font-black text-slate-900">
                    {s.totalPrice?.toLocaleString()}원
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      s.status === 'COMPLETED' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'
                    }`}>
                      {s.status === 'COMPLETED' ? '지급 완료' : '지급 대기'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handlePayout(s.orderId)}
                      disabled={s.status === 'COMPLETED'}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        s.status === 'COMPLETED' 
                        ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                        : 'bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      지급 실행
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}