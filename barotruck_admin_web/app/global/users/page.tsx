// app/global/users/page.tsx
"use client";

import { useEffect, useState } from "react"; // ✅ 상태 관리를 위해 추가
import UserApprovalList from "../../features/user/users/user_approval_list";
import { getUserStats } from "@/app/features/shared/api/user_api"; // ✅ 통계 API 임포트

export default function UserPage() {
  // ✅ 1. 통계 데이터를 저장할 상태 생성
  const [stats, setStats] = useState({ pending: 0, drivers: 0, shippers: 0 });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterRole, setFilterRole] = useState("전체 회원");

  // ✅ 2. 페이지 로드 시 실시간 데이터 가져오기
  useEffect(() => {
    getUserStats().then(data => {
      setStats({
        pending: data.pendingCount,
        drivers: data.driverCount,
        shippers: data.shipperCount
      });
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">👥 회원 자격 관리</h1>
          <p className="text-sm text-slate-500 mt-1">실시간 데이터 연동을 통해 회원을 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
            엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 요약 현황 카드 - 데이터 반영 완료 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">신규 승인 대기</p>
          {/* ✅ "실시간" 대신 stats.pending 반영 */}
          <p className="text-2xl font-black text-orange-500 mt-1">{stats.pending}건</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">전체 차주</p>
          {/* ✅ "현황" 대신 stats.drivers 반영 */}
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.drivers}명</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">전체 화주</p>
          {/* ✅ "조회" 대신 stats.shippers 반영 */}
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.shippers}명</p>
        </div>
      </div>

      {/* 검색 필터 및 리스트 영역 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-center">
        <select 
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option>전체 회원</option>
          <option>차주</option>
          <option>화주</option>
        </select>
        <input 
          type="text" 
          placeholder="이름, 연락처 검색" 
          className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
          검색
        </button>
      </div>

      <UserApprovalList searchKeyword={searchKeyword} filterRole={filterRole} />
    </div>
  );
}