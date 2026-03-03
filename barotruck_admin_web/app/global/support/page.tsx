"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import NoticeList from "./notice";
import InquiryList from "./inquiry";
import ReportList from "./report";
import ReviewList from "./review"; // ✅ 새로 만든 리뷰 리스트 추가

export default function SupportPage() {
  // 💡 탭 타입에 "review" 추가
  const [activeTab, setActiveTab] = useState<"notice" | "inquiry" | "report" | "review">("notice");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    // 💡 허용되는 탭 파라미터에 "review" 포함
    if (["notice", "inquiry", "report", "review"].includes(tabParam || "")) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b]">📢 고객지원 및 운영 관리</h1>
        <p className="text-sm text-[#64748b] mt-1">공지사항 및 고객 문의, 리뷰 내역을 관리합니다.</p>
      </div>

      {/* 탭 내비게이션 - 리뷰 관리 버튼 추가 */}
      <div className="flex gap-1 bg-[#e2e8f0] p-1 rounded-xl w-fit shadow-inner">
        {[
          { id: "notice", label: "공지사항" },
          { id: "inquiry", label: "1:1 문의" },
          { id: "report", label: "신고 관리" },
          { id: "review", label: "리뷰 관리" } // ✅ 신규 추가
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id 
              ? 'bg-white text-[#1e293b] shadow-sm' 
              : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 영역 */}
      <div className="mt-8 transition-all duration-300">
        {activeTab === "notice" && <NoticeList />}
        {activeTab === "inquiry" && <InquiryList />}
        {activeTab === "report" && <ReportList />}
        {activeTab === "review" && <ReviewList />} {/* ✅ 리뷰 리스트 렌더링 */}
      </div>
    </div>
  );
}