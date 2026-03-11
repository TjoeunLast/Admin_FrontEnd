"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import NoticeList from "./notice";
import InquiryList from "./inquiry";
import ReportList from "./report";
import ReviewList from "./review";

type SupportTab = "notice" | "inquiry" | "report" | "review";

const isSupportTab = (value: string | null): value is SupportTab =>
  value === "notice" ||
  value === "inquiry" ||
  value === "report" ||
  value === "review";

const SUPPORT_TABS: Array<{ id: SupportTab; label: string }> = [
  { id: "notice", label: "공지사항" },
  { id: "inquiry", label: "1:1 문의" },
  { id: "report", label: "신고 관리" },
  { id: "review", label: "리뷰 관리" },
];

function SupportPageContent() {
  const [selectedTab, setSelectedTab] = useState<SupportTab>("notice");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = isSupportTab(tabParam) ? tabParam : selectedTab;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-24 font-sans text-slate-900">
      <header className="mb-8 pl-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          고객지원 및 운영 관리
        </h1>
      </header>

      <div className="flex items-center gap-8 mb-10 border-b border-slate-100 px-1">
        {SUPPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`relative pb-4 text-[15px] font-black transition-all ${
              activeTab === tab.id
                ? "text-[#4E46E5]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#4E46E5] rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="transition-all duration-300">
        {activeTab === "notice" && <NoticeList />}
        {activeTab === "inquiry" && <InquiryList />}
        {activeTab === "report" && <ReportList />}
        {activeTab === "review" && <ReviewList />}
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 text-center text-slate-300 font-black italic text-sm">
          데이터 로드 중...
        </div>
      }
    >
      <SupportPageContent />
    </Suspense>
  );
}
