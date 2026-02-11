"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function InquiryDetailPage() {
  const router = useRouter();
  const { id } = useParams(); // URL에서 문의 ID를 가져옵니다.

  // 샘플 데이터 (추후 API 연동)
  const inquiryData = {
    title: "결제 수단 변경은 어떻게 하나요?",
    author: "김희철(화주)",
    date: "2026.01.26",
    content: "카드로 결제 등록을 했는데, 나중에 무통장 입금으로 결제 수단을 변경할 수 있는지 궁금합니다. 현재 메뉴에서는 찾기가 어렵네요.",
    status: "답변 대기",
    images: ["/sample-inquiry.jpg"] // 문의 시 첨부한 이미지
  };

  const [answer, setAnswer] = useState("");

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("답변이 성공적으로 등록되었습니다.");
    router.push("/global/support");
  };

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[#1e293b]">1:1 문의 상세 확인</h1>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${inquiryData.status === '답변 대기' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
          {inquiryData.status}
        </span>
      </div>

      {/* 1. 문의 원문 섹션 */}
      <section className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-[#e2e8f0]">
          <h2 className="text-lg font-bold text-[#1e293b]">{inquiryData.title}</h2>
          <div className="flex gap-4 mt-2 text-xs text-slate-500 font-medium">
            <span>작성자: {inquiryData.author}</span>
            <span>작성일: {inquiryData.date}</span>
            <span>문의번호: {id}</span>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <p className="text-[#475569] leading-relaxed whitespace-pre-wrap">
            {inquiryData.content}
          </p>
          {/* 첨부 이미지 영역 */}
          <div className="flex gap-4">
            <div className="w-32 h-32 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
              첨부 이미지 1
            </div>
          </div>
        </div>
      </section>

      {/* 2. 답변 작성 섹션 */}
      <section className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden font-sans">
        <div className="p-6 border-b border-[#e2e8f0]">
          <h2 className="text-lg font-bold text-[#1e293b]">관리자 답변 작성</h2>
        </div>
        <form onSubmit={handleAnswerSubmit} className="p-8 space-y-4">
          <textarea 
            className="w-full h-48 p-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all resize-none leading-relaxed"
            placeholder="사용자에게 전달할 답변을 정성껏 작성해주세요."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              취소
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              답변 등록 완료
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}