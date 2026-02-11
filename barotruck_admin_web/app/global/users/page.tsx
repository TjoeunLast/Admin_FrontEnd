// app/global/users/user_page.tsx
"use client";

import UserApprovalList from "../../features/user/users/user_approval_list";

export default function UserPage() {
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

      {/* 요약 현황 카드 (하드코딩 상태이며, 필요시 API 연동 가능) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">신규 승인 대기</p>
          <p className="text-2xl font-black text-orange-500 mt-1">실시간</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">전체 차주</p>
          <p className="text-2xl font-black text-slate-800 mt-1">현황</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">전체 화주</p>
          <p className="text-2xl font-black text-slate-800 mt-1">조회</p>
        </div>
      </div>

      {/* 검색 필터 디자인 유지 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-center">
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
          <option>전체 회원</option>
          <option>차주</option>
          <option>화주</option>
        </select>
        <input 
          type="text" 
          placeholder="이름, 연락처 검색" 
          className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
          검색
        </button>
      </div>

      {/* 신규 데이터(6~12번 등)가 자동으로 출력되는 분리된 컴포넌트 */}
      <UserApprovalList />
    </div>
  );
}