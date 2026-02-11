// app/global/billing/verification/page.tsx
"use client";

export default function VerificationPage() {
  return (
    <main className="p-10 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-extrabold text-[#1e293b]">📸 인수증 검수</h1>
          <span className="bg-[#fef3c7] text-[#d97706] border border-[#fde68a] px-3 py-1 rounded-full text-xs font-bold">검수 대기중</span>
        </div>
        <p className="text-[#64748b] text-sm font-bold">검수 요청일: 2026.02.04 15:42</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 인수증 이미지 (HTML 반영) */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-[#e2e8f0] overflow-hidden shadow-sm">
          <div className="bg-[#f1f5f9] p-4 border-b flex justify-between">
            <h3 className="text-sm font-bold text-[#475569]">제출된 인수증 사진</h3>
          </div>
          <div className="p-10 bg-[#334155] flex justify-center">
            <img 
              src="https://mblogthumb-phinf.pstatic.net/MjAxOTEyMDRfNDgg/MDAxNTc1NDI2OTA4Njg1.TRTHS6AGHY0L8CNPUQOc1X74AUZQo_9fHmE8Pn9talIg.eE2EM6vmclvdWa492YjXRWL5kC01s1XwJTRe1o9aasAg.JPEG.yesformstory/SE-e1b05199-6747-44e6-8fe5-afbd11cd34a5.jpg?type=w800" 
              className="max-w-full rounded-lg shadow-2xl"
              alt="인수증"
            />
          </div>
        </div>

        {/* 상세 정보 및 액션 */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm">
            <h3 className="text-lg font-bold text-[#1e293b] border-b-2 border-blue-500 inline-block pb-1 mb-6">🔗 매칭 오더 정보</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-[#64748b]">주문번호</span><strong className="text-[#1e293b]">ORD-2026-0202-001</strong></div>
              <div className="flex justify-between"><span className="text-[#64748b]">운송구간</span><strong className="text-[#1e293b]">전북 군산 → 경기 용인</strong></div>
              <div className="flex justify-between"><span className="text-[#64748b]">차주명</span><strong className="text-[#1e293b]">오시온 (5톤 카고)</strong></div>
              <div className="pt-4 border-t border-dashed flex justify-between items-center">
                <span className="font-bold">최종 지급액</span>
                <span className="text-2xl font-black text-[#3b82f6]">290,000원</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#e2e8f0] shadow-sm">
            <label className="text-xs font-bold text-[#64748b] block mb-2">반려 사유 (반려 시 필수)</label>
            <textarea className="w-full h-24 p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-6" placeholder="이미지 식별 불가 등 사유 입력" />
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-[#3b82f6] text-white py-4 rounded-xl font-bold hover:bg-blue-600 shadow-md">검수 승인</button>
              <button className="bg-white text-[#ef4444] border-2 border-[#ef4444] py-4 rounded-xl font-bold hover:bg-red-50">검수 반려</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}