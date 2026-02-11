"use client";

import { useState } from "react";
import Link from 'next/link';

export default function ShipperSettlementPage() {
  const [shippers] = useState([
    { id: 1, name: "(주)위시운송", bizNumber: "123-45-67890", amount: 5400000, status: "입금 완료", date: "2026.02.01" },
    { id: 2, name: "(주)세븐틴물류", bizNumber: "987-65-43210", amount: 2850000, status: "입금 대기", date: "2026.02.05" },
    { id: 3, name: "(주)라이즈택배", bizNumber: "555-88-12345", amount: 1200000, status: "미납", date: "2026.01.20" },
  ]);

  const formatAmount = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

  return (
    <main className="space-y-8">
      {/* 1. 헤더 및 탭 섹션 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1e293b]">정산 및 매출 관리</h1>
          <p className="text-sm text-[#64748b] mt-1">화주 청구 및 차주 지급 현황을 통합 관리합니다.</p>
        </div>
        <div className="bg-[#e2e8f0] p-1 rounded-xl flex gap-1 shadow-inner">
          <Link href="/global/billing/settlement/driver">
            <button className="px-5 py-2 rounded-lg text-sm font-bold text-[#64748b] hover:bg-white/50 transition-all">
              차주 정산
            </button>
          </Link>
          <button className="px-5 py-2 rounded-lg text-sm font-bold bg-white text-[#1e293b] shadow-sm">
            화주 정산
          </button>
        </div>
      </div>

      {/* 2. 요약 위젯 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-[#3b82f6] text-white p-6 rounded-2xl shadow-lg shadow-blue-100">
          <div className="text-sm opacity-90 font-medium">이번 달 화주 총 청구액</div>
          <div className="text-2xl font-black mt-1">₩320,500,000</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-[#ef4444] border border-[#e2e8f0] shadow-sm">
          <div className="text-sm text-[#64748b] font-medium">화주 미수금 (미입금)</div>
          <div className="text-2xl font-black text-[#ef4444] mt-1">₩40,500,000</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-[#10b981] border border-[#e2e8f0] shadow-sm">
          <div className="text-sm text-[#64748b] font-medium">화주 입금 완료</div>
          <div className="text-2xl font-black text-[#10b981] mt-1">₩280,000,000</div>
        </div>
        <div className="bg-[#eff6ff] p-6 rounded-2xl border border-[#3b82f6] shadow-sm">
          <div className="text-sm text-[#3b82f6] font-bold">예상 중개 수익 (10%)</div>
          <div className="text-2xl font-black text-[#3b82f6] mt-1">₩32,050,000</div>
        </div>
      </div>

      {/* 3. 리스트 상단 컨트롤 */}
      <div className="flex justify-between items-center mt-10">
        <h3 className="text-lg font-bold text-[#1e293b]">청구 및 입금 목록 (화주)</h3>
        <div className="flex gap-2">
          <button className="bg-white border border-[#e2e8f0] px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">
            엑셀 다운로드
          </button>
          <Link href="/global/billing/tax_invoice">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
              일괄 세금계산서 발행
            </button>
          </Link>
        </div>
      </div>

      {/* 4. 필터 영역 */}
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          placeholder="화주사명을 검색하세요" 
          className="border border-[#e2e8f0] rounded-lg px-4 py-2 text-sm w-64 outline-none focus:border-blue-500"
        />
        <select className="border border-[#e2e8f0] rounded-lg px-4 py-2 text-sm outline-none">
          <option>전체 상태</option>
          <option>입금 완료</option>
          <option>입금 대기</option>
          <option>미납</option>
        </select>
      </div>

      {/* 5. 테이블 섹션 */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[#f8fafc] border-b-2 border-[#e2e8f0]">
            <tr className="text-[#64748b] font-bold">
              <th className="p-4 text-center w-12"><input type="checkbox" /></th>
              <th className="p-4 text-left">화주사명 / 사업자번호</th>
              <th className="p-4 text-center">최종 청구일</th>
              <th className="p-4 text-right">총 청구 금액</th>
              <th className="p-4 text-center">상태</th>
              <th className="p-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {shippers.map((s) => (
              <tr key={s.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all group">
                <td className="p-4 text-center"><input type="checkbox" /></td>
                <td className="p-4">
                  <div className="font-bold text-[#1e293b] group-hover:text-blue-600 transition-colors">{s.name}</div>
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">{s.bizNumber}</div>
                </td>
                <td className="p-4 text-center text-[#64748b] font-medium">{s.date}</td>
                <td className="p-4 text-right font-black text-[#1e293b]">₩{formatAmount(s.amount)}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    s.status === '입금 완료' ? 'bg-green-50 text-green-600' : 
                    s.status === '입금 대기' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-4 text-center flex justify-center gap-2">
                  <Link href={`/global/billing/settlement/shipper/${s.id}`}>
                    <button className="bg-white border border-[#cbd5e1] text-[#64748b] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all">
                      내역보기
                    </button>
                  </Link>
                  <button className="bg-[#1e293b] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black transition-all">
                    입금확인
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