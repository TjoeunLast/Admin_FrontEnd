"use client";

import { useState } from "react";
import Link from "next/link";

export default function DriverSettlementPage() {
  const [drivers] = useState([
    { name: '오시온', type: '5톤 카고', bank: '하나 012-123456-78910', date: '2026.02.04', amount: '1,820,000원', status: '지급 대기' },
    { name: '김대영', type: '1톤 탑차', bank: '농협 987-3456-1234-000', date: '2026.02.05', amount: '730,000원', status: '지급 완료' },
    { name: '유지민', type: '11톤 카고', bank: '신한 167-3966-71052', date: '2026.01.23', amount: '2,053,000원', status: '지급 완료' },
    { name: '안유진', type: '5톤 윙바디', bank: '기업 010-8200-4000', date: '2026.01.15', amount: '5,771,000원', status: '지급 대기' },
  ]);

  return (
    <main className="space-y-8">
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

      {/* 2. 요약 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-[#3b82f6] text-white p-6 rounded-2xl shadow-lg shadow-blue-100 relative overflow-hidden">
          <div className="text-sm opacity-90 font-medium">이번 달 화주 총 청구액</div>
          <div className="text-2xl font-black mt-1">₩320,500,000</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-[#ef4444] border border-[#e2e8f0] shadow-sm">
          <div className="text-sm text-[#64748b] font-medium">화주 미수금 (미입금)</div>
          <div className="text-2xl font-black text-[#ef4444] mt-1">₩40,500,000</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-[#10b981] border border-[#e2e8f0] shadow-sm">
          <div className="text-sm text-[#64748b] font-medium">차주 지급 완료</div>
          <div className="text-2xl font-black text-[#10b981] mt-1">₩260,000,000</div>
        </div>
        <div className="bg-[#eff6ff] p-6 rounded-2xl border border-[#3b82f6] shadow-sm">
          <div className="text-sm text-[#3b82f6] font-bold">예상 중개 수익 (10%)</div>
          <div className="text-2xl font-black text-[#3b82f6] mt-1">₩32,050,000</div>
        </div>
      </div>

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

      {/* 5. 테이블 섹션 */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#f8fafc] border-b-2 border-[#e2e8f0]">
            <tr className="text-[#64748b] font-bold">
              <th className="p-4 text-center w-12"><input type="checkbox" /></th>
              <th className="p-4 text-center">지급 대상(차주)</th>
              <th className="p-4 text-center">은행/계좌번호</th>
              <th className="p-4 text-center">운송 완료일</th>
              <th className="p-4 text-center">총 지급액</th>
              <th className="p-4 text-center">상태</th>
              <th className="p-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d, i) => (
              <tr key={i} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all">
                <td className="p-4 text-center"><input type="checkbox" /></td>
                <td className="p-4 text-center font-bold">
                  {d.name} <span className="text-[10px] text-blue-500 font-normal ml-1">{d.type}</span>
                </td>
                <td className="p-4 text-center text-slate-500">{d.bank}</td>
                <td className="p-4 text-center text-slate-500">{d.date}</td>
                <td className="p-4 text-center font-bold">{d.amount}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    d.status === '지급 완료' ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'
                  }`}>
                    {d.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${
                    d.status === '지급 완료' 
                    ? 'bg-slate-50 text-slate-400 border-slate-200' 
                    : 'bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
                  }`}>
                    {d.status === '지급 완료' ? '지급 완료' : '지급 실행'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}