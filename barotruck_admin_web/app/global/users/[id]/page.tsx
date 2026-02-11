"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  // 샘플 데이터 (차주 기준)
  const userData = {
    name: "오시온",
    type: "차주",
    phone: "010-1234-5678",
    email: "sion.oh@example.com",
    joinDate: "2026.02.04",
    status: "승인 대기",
    carInfo: "5톤 카고 / 12가 3456",
    documents: [
      { name: "사업자등록증", status: "검토중", url: "/docs/biz-license.jpg" },
      { name: "화물운송자격증", status: "확인완료", url: "/docs/cargo-license.jpg" },
      { name: "자동차등록증", status: "검토중", url: "/docs/car-reg.jpg" }
    ]
  };

  const handleApprove = () => {
    alert("회원 가입 승인이 완료되었습니다.");
    router.push("/global/users");
  };

  return (
    <div className="max-w-6xl space-y-6 pb-20 font-sans">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">⬅️</button>
          <h1 className="text-2xl font-bold text-[#1e293b]">회원 상세 정보 <span className="text-slate-400 text-lg ml-2">#{id}</span></h1>
        </div>
        <div className="flex gap-2">
          <button className="px-5 py-2.5 rounded-xl font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-all">승인 거절</button>
          <button onClick={handleApprove} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">최종 가입 승인</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 기본 인적 사항 */}
        <div className="space-y-6">
          <section className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl">👤</div>
              <div>
                <h3 className="text-xl font-bold text-[#1e293b]">{userData.name}</h3>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{userData.type}</span>
              </div>
            </div>
            <div className="space-y-4">
              <InfoRow label="연락처" value={userData.phone} />
              <InfoRow label="이메일" value={userData.email} />
              <InfoRow label="가입신청일" value={userData.joinDate} />
              <InfoRow label="차량정보" value={userData.carInfo} />
              <div className="pt-4 border-t border-slate-50">
                <p className="text-xs font-bold text-slate-400 mb-2 uppercase">현재 상태</p>
                <span className="text-sm font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full">{userData.status}</span>
              </div>
            </div>
          </section>
        </div>

        {/* 오른쪽: 증빙 서류 검토 섹션 */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-[#1e293b]">가입 증빙 서류 검토</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userData.documents.map((doc, i) => (
                <div key={i} className="group relative border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 transition-all">
                  <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center text-slate-300">
                    {/* 실제 환경에서는 img 태그 사용 */}
                    [서류 미리보기 이미지]
                  </div>
                  <div className="p-4 bg-white flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-[#1e293b]">{doc.name}</p>
                      <p className="text-[11px] text-slate-400">{doc.status}</p>
                    </div>
                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">🔍</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// 헬퍼 컴포넌트
function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase mb-1">{label}</p>
      <p className="text-[#1e293b] font-medium">{value}</p>
    </div>
  );
}