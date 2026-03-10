"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  reportApi,
  ReportResponse,
} from "@/app/features/shared/api/report_api";
import { toReportStatusLabel } from "@/app/features/orders/type";

export default function InquiryList() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<ReportResponse[]>([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // 페이지네이션 설정
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 데이터 로딩
  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await reportApi.getAll();
      // 1:1 문의(DISCUSS) 데이터만 필터링
      const discussOnly = data.filter((item) => item.type === "DISCUSS");
      setInquiries(discussOnly);
    } catch (error) {
      console.error("문의 목록 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 필터링 및 페이지네이션 로직
  const filteredData = useMemo(() => {
    if (activeFilter === "ALL") return inquiries;
    return inquiries.filter((item) => item.status === activeFilter);
  }, [inquiries, activeFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (isLoading)
    return (
      <div className="p-20 text-center font-bold text-slate-300 animate-pulse uppercase tracking-widest">
        데이터를 불러오는 중입니다...
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquareIcon className="text-bt-primary" />
            <span className="text-[10px] font-black text-bt-primary uppercase tracking-widest">
              Support Center
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            1:1 문의 관리 센터
          </h1>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { id: "ALL", label: "전체" },
            { id: "PENDING", label: "접수됨" },
            { id: "PROCESSING", label: "처리 중" },
            { id: "RESOLVED", label: "처리 완료" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-5 py-2 rounded-2xl text-[12px] font-bold transition-all border ${
                activeFilter === tab.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              <span className="ml-2 opacity-40 font-medium text-[10px]">
                {
                  inquiries.filter((i) =>
                    tab.id === "ALL" ? true : i.status === tab.id,
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 메인 리스트 테이블 */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[700px]">
        <div className="overflow-x-auto">
          <table className="w-full text-center table-fixed min-w-[800px]">
            <thead className="bg-slate-50/50 border-b border-slate-50">
              <tr className="text-slate-400 text-[11px] uppercase tracking-widest font-black">
                <th className="p-6 w-28">상태</th>
                <th className="p-6 w-44 text-left pl-10">문의자</th>
                <th className="p-6">문의 제목</th>
                <th className="p-6 w-56">회신 이메일</th>
                <th className="p-6 w-36">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-32 text-slate-300 font-bold text-sm italic"
                  >
                    등록된 문의 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.reportId}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() =>
                      router.push(`/global/support/inquiry/${item.reportId}`)
                    }
                  >
                    <td className="p-6">
                      <span
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black shadow-sm ${
                          item.status === "RESOLVED"
                            ? "bg-bt-badge-complete-bg text-bt-badge-complete-text"
                            : "bg-bt-badge-request-bg text-bt-badge-request-text"
                        }`}
                      >
                        {toReportStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="p-6 text-left pl-10">
                      <p className="font-bold text-slate-800 text-[14px]">
                        {item.reporterNickname}
                      </p>
                    </td>
                    <td className="p-6">
                      <p className="font-bold text-slate-700 text-[13px] truncate text-center">
                        {item.title || "제목 없음"}
                      </p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2 text-bt-primary font-bold text-[12px]">
                        <MailIcon className="opacity-40 group-hover:scale-110 transition-transform" />
                        <span className="truncate">{item.email || "-"}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-slate-400 font-bold text-[11px]">
                        {item.createdAt?.split("T")[0]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 페이지네이션 */}
        <div className="p-8 border-t border-slate-50 flex justify-center items-center gap-4 bg-slate-50/20 mt-auto">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-all"
          >
            <ChevronLeftIcon />
          </button>

          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 rounded-xl text-[12px] font-black transition-all ${
                  currentPage === i + 1
                    ? "bg-slate-900 text-white shadow-md scale-110"
                    : "bg-white text-slate-400 hover:bg-slate-100 border border-transparent"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-all"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageSquareIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 10h10" />
      <path d="M7 14h6" />
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-3 w-3 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function ChevronLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
