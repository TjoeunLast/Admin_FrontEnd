// app/global/settings/setting_page.tsx
"use client";

export default function Integrated_Setting_Page() {
  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b]">⚙️ 시스템 통합 설정</h1>
        <p className="text-sm text-[#64748b] mt-1">관리자 계정 정보와 서비스 운영 정책을 한 화면에서 관리합니다.</p>
      </div>

      {/* 1. 👤 관리자 계정 설정 */}
      <section className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm space-y-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">👤</span>
          <h2 className="text-lg font-bold text-[#1e293b]">관리자 계정 설정</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#64748b] uppercase">이름</label>
            <input type="text" defaultValue="최고관리자" className="w-full p-2.5 border border-[#e2e8f0] rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#64748b] uppercase">부서</label>
            <input type="text" defaultValue="운영본부" className="w-full p-2.5 border border-[#e2e8f0] rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#64748b] uppercase">이메일 (ID)</label>
            <input type="email" defaultValue="admin@barotruck.com" disabled className="w-full p-2.5 border border-[#e2e8f0] rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#64748b] uppercase">비밀번호 변경</label>
            <button className="w-full p-2.5 border border-[#3b82f6] text-[#3b82f6] rounded-lg text-sm font-bold hover:bg-blue-50 transition-all">
              비밀번호 재설정 요청
            </button>
          </div>
        </div>
      </section>

      {/* 2. 💰 정산 및 수수료 정책 */}
      <section className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm space-y-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">💰</span>
          <h2 className="text-lg font-bold text-[#1e293b]">정산 및 수수료 정책</h2>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-[#64748b] mb-3">기본 중개 수수료율</label>
            <div className="flex items-center gap-2">
              <input type="number" defaultValue="10" className="w-24 p-2.5 border border-[#e2e8f0] rounded-lg text-center font-bold" />
              <span className="text-slate-600 font-bold">%</span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-3 font-medium">화주 결제 금액에서 차감될 서비스 수수료를 설정합니다.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#64748b] mb-3">정산 자동 확정일</label>
            <div className="flex items-center gap-3 font-bold">
              <span className="text-sm font-medium text-slate-700">운송 완료 후</span>
              <input type="number" defaultValue="3" className="w-20 p-2.5 border border-[#e2e8f0] rounded-lg text-center" />
              <span className="text-sm font-medium text-slate-700">일 뒤</span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-3 font-medium">인수증 승인 후 정산 대기 상태로 전환되는 유예 기간입니다.</p>
          </div>
        </div>
      </section>

      {/* 3. 🚚 배차 운영 설정 */}
      <section className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm space-y-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🚚</span>
          <h2 className="text-lg font-bold text-[#1e293b]">배차 운영 설정</h2>
        </div>

        <div className="grid grid-cols-2 gap-12">
          <div>
            <label className="block text-sm font-semibold text-[#64748b] mb-3">배차 수락 제한 시간</label>
            <div className="flex items-center gap-2 font-bold">
              <input type="number" defaultValue="15" className="w-24 p-2.5 border border-[#e2e8f0] rounded-lg text-center" />
              <span className="text-sm font-medium text-slate-700">분</span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-3 font-medium">미확정 시 자동 취소 시간</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#64748b] mb-3">위치 공유 간격</label>
            <select className="w-full p-2.5 border border-[#e2e8f0] rounded-lg bg-white font-bold outline-none">
              <option>1분 (권장)</option>
              <option>5분</option>
              <option>10분</option>
            </select>
            <p className="text-xs text-[#94a3b8] mt-3 font-medium">관제 지도 업데이트 주기</p>
          </div>
        </div>
      </section>

      {/* 💾 일괄 저장 버튼 */}
      <div className="flex justify-end pt-4">
        <button className="bg-[#3b82f6] text-white px-12 py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 active:scale-95">
          설정값 일괄 적용
        </button>
      </div>
    </div>
  );
}