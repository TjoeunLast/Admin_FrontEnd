"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    shipperName: "",
    loadAddr: "",
    unloadAddr: "",
    vehicleType: "5톤 카고",
    price: "",
    driverName: "", // 차주명 추가
    driverPhone: "", // 차주 연락처 추가
    isDirectAssign: false // 즉시 배차 여부
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("수동 오더 및 차주 배차가 완료되었습니다.");
    router.push("/global/orders");
  };

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">⬅️</button>
        <h1 className="text-2xl font-bold text-[#1e293b]">➕ 수동 오더 등록 (차주 지정 포함)</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden font-sans">
        <div className="p-8 space-y-8">
          {/* 01. 화주 정보 & 02. 운송 경로 (기존과 동일) */}
          <div className="grid grid-cols-2 gap-8">
             <section className="space-y-4 text-sm">
                <h3 className="font-black text-blue-600 uppercase tracking-widest">01. 화주 및 운임</h3>
                <input type="text" placeholder="화주사명" className="w-full p-3 border rounded-xl outline-none focus:border-blue-500" required />
                <input type="number" placeholder="운임 (원)" className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 font-bold" required />
             </section>
             <section className="space-y-4 text-sm">
                <h3 className="font-black text-emerald-600 uppercase tracking-widest">02. 상/하차지</h3>
                <input type="text" placeholder="상차지 주소" className="w-full p-3 border rounded-xl outline-none focus:border-emerald-500" required />
                <input type="text" placeholder="하차지 주소" className="w-full p-3 border rounded-xl outline-none focus:border-emerald-500" required />
             </section>
          </div>

          {/* 03. 차주 지정 섹션 (새로 추가된 핵심 부분) */}
          <section className="space-y-4 border-t pt-8">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">03. 차주 배차 설정 (선택)</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-blue-600"
                  checked={formData.isDirectAssign}
                  onChange={(e) => setFormData({...formData, isDirectAssign: e.target.checked})}
                />
                <span className="text-xs font-bold text-slate-500">지금 바로 차주 지정</span>
              </label>
            </div>

            {formData.isDirectAssign && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-blue-600 ml-1">차주명 검색</label>
                  <input 
                    type="text" 
                    placeholder="차주 이름 입력"
                    className="w-full p-2.5 bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 ring-blue-500/20 text-sm"
                    value={formData.driverName}
                    onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-blue-600 ml-1">차량 정보</label>
                  <input 
                    type="text" 
                    placeholder="자동 입력 (검색 시)"
                    className="w-full p-2.5 bg-slate-100 border border-blue-100 rounded-lg text-sm text-slate-400"
                    readOnly 
                  />
                </div>
                <div className="flex items-end">
                  <button type="button" className="w-full bg-blue-600 text-white h-[42px] rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                    차주 데이터 불러오기
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 font-sans">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-xl font-bold text-slate-500">취소</button>
          <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">
            {formData.isDirectAssign ? '배차 포함 등록' : '공구 오더로 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}