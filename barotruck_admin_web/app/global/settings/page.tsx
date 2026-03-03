"use client";

import { useState } from "react";

export default function System_Setting_Page() {
  // 💡 개인 정보(name, email) 상태를 제거하고 서비스 정책 설정만 남깁니다.
  const [formData, setFormData] = useState({
    commissionRate: 10,       // 기본 중개 수수료율
    settlementDays: 3,         // 정산 자동 확정일
    dispatchTimeout: 15,       // 배차 수락 제한 시간
    trackingInterval: '1분 (실시간)', // 위치 공유 간격
    allowPush: true,           // 웹 푸시 알림
    allowSms: false,           // 중요 장애 SMS
    operationStatus: '정상 운영' // 서비스 운영 상태 (예시 추가)
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* 1. 상단 헤더 */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b]">⚙️ 시스템 제어 센터</h1>
          <p className="text-sm text-[#64748b] mt-1">운송 정책 및 전역 시스템 설정을 관리합니다.</p>
        </div>
        <button className="bg-[#3b82f6] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg active:scale-95">
          설정값 일괄 적용
        </button>
      </div>

      {/* 2. 그리드 레이아웃: 개인 정보 카드를 빼고 정책 중심으로 재배치 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 카드 1: 정산 정책 */}
        <section className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg text-emerald-500">💰</span>
            <h2 className="font-bold text-[#1e293b]">정산 정책</h2>
          </div>
          <div className="space-y-6 flex-grow">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-600">중개 수수료율</span>
              <div className="flex items-center gap-2">
                <input type="number" name="commissionRate" value={formData.commissionRate} onChange={handleChange} className="w-12 text-right font-bold text-blue-600 bg-transparent outline-none" />
                <span className="text-sm font-bold">%</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-600">자동 확정일</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">완료 후</span>
                <input type="number" name="settlementDays" value={formData.settlementDays} onChange={handleChange} className="w-8 text-center font-bold text-blue-600 bg-transparent outline-none" />
                <span className="text-sm font-bold">일</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
            * 수수료율 변경 시 익일 00시 주문부터 적용됩니다.
          </p>
        </section>

        {/* 카드 2: 배차 운영 */}
        <section className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg text-orange-500">🚚</span>
            <h2 className="font-bold text-[#1e293b]">배차 운영</h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">배차 수락 제한 시간</label>
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl">
                <input type="range" name="dispatchTimeout" min="5" max="60" step="5" value={formData.dispatchTimeout} onChange={handleChange} className="flex-grow h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                <span className="text-sm font-bold w-10 text-right text-blue-600">{formData.dispatchTimeout}분</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">위치 공유 주기</label>
              <select name="trackingInterval" value={formData.trackingInterval} onChange={handleChange} className="w-full p-3 border border-[#e2e8f0] rounded-xl text-sm bg-slate-50 font-medium outline-none focus:ring-1 focus:ring-blue-500">
                <option>1분 (실시간)</option>
                <option>5분 (일반)</option>
                <option>10분 (절전)</option>
              </select>
            </div>
          </div>
        </section>

        {/* 카드 3: 서비스 상태 (새로 추가하거나 기존 알림 카드를 배치) */}
        <section className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg text-blue-500">🌐</span>
            <h2 className="font-bold text-[#1e293b]">서비스 가용성</h2>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-blue-700">현재 시스템 상태</span>
              <span className="px-2 py-1 bg-blue-500 text-white text-[10px] rounded-full font-bold">정상</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            현재 전국의 모든 배차 및 위치 추적 서버가 정상 작동 중입니다. 점검 예약이 필요한 경우 시스템 관리자에게 문의하세요.
          </p>
        </section>

        {/* 카드 4: 업무 알림 설정 (하단에 넓게 배치) */}
        <section className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm lg:col-span-3">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg text-purple-500">🔔</span>
            <h2 className="font-bold text-[#1e293b]">전역 알림 설정</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-700">실시간 브라우저 푸시</p>
                <p className="text-[11px] text-slate-400">관리자 대시보드 내 신규 주문 및 문의 발생 알림 활성화</p>
              </div>
              <input type="checkbox" name="allowPush" checked={formData.allowPush} onChange={handleChange} className="w-5 h-5 accent-blue-500" />
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-700">긴급 SMS 알림</p>
                <p className="text-[11px] text-slate-400">시스템 장애 및 보안 이슈 발생 시 등록된 비상 연락처로 발송</p>
              </div>
              <input type="checkbox" name="allowSms" checked={formData.allowSms} onChange={handleChange} className="w-5 h-5 accent-blue-500" />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}