// app/global/support/page.tsx
"use client";

import { useState } from "react";
// 각 기능별 컴포넌트는 같은 폴더 내에 생성합니다.
import NoticeList from "./notice";
import InquiryList from "./inquiry";
import ReportList from "./report";

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<"notice" | "inquiry" | "report">("notice");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b]">📢 고객지원 및 운영 관리</h1>
        <p className="text-sm text-[#64748b] mt-1">공지사항 게시 및 고객 문의, 신고 내역을 관리합니다.</p>
      </div>

      {/* 탭 내비게이션 */}
      <div className="flex gap-1 bg-[#e2e8f0] p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab("notice")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'notice' ? 'bg-white text-[#1e293b] shadow-sm' : 'text-[#64748b]'}`}
        >
          공지사항
        </button>
        <button 
          onClick={() => setActiveTab("inquiry")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inquiry' ? 'bg-white text-[#1e293b] shadow-sm' : 'text-[#64748b]'}`}
        >
          1:1 문의
        </button>
        <button 
          onClick={() => setActiveTab("report")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'report' ? 'bg-white text-[#1e293b] shadow-sm' : 'text-[#64748b]'}`}
        >
          신고 관리
        </button>
      </div>

      {/* 탭 콘텐츠 영역 */}
      <div className="mt-8 transition-all duration-300">
        {activeTab === "notice" && <NoticeList />}
        {activeTab === "inquiry" && <InquiryList />}
        {activeTab === "report" && <ReportList />}
      </div>
    </div>
  );
}