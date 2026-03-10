"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  reportApi,
  ReportResponse,
} from "@/app/features/shared/api/report_api";
import { toReportStatusLabel } from "@/app/features/orders/type";

const FILTER_TABS = [
  { id: "ALL", label: "전체" },
  { id: "PENDING", label: "접수됨" },
  { id: "PROCESSING", label: "처리 중" },
  { id: "RESOLVED", label: "처리 완료" },
] as const;

function getStatusBadgeClass(status: string) {
  if (status === "RESOLVED") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }
  if (status === "PROCESSING") {
    return "bg-amber-50 text-amber-700 border border-amber-100";
  }
  return "bg-[#EDECFC] text-[#4E46E5] border border-[#DDD6FE]";
}

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
  const pageNumbers = totalPages > 0 ? Array.from({ length: totalPages }, (_, i) => i + 1) : [];

  if (isLoading)
    return (
      <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest">
        데이터를 불러오는 중입니다...
      </div>
    );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-20">
      <section className="rounded-[24px] border border-slate-200 bg-white px-7 py-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EDECFC] px-3 py-1 text-[11px] font-black tracking-[0.14em] text-[#4E46E5]">
              <MessageSquareIcon className="h-3.5 w-3.5" />
              SUPPORT INQUIRY
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-[#0F172A]">
              1:1 문의 관리 센터
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              문의 접수 상태를 확인하고 상세 페이지 또는 채팅으로 바로 대응하세요.
            </p>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">전체 문의</p>
              <p className="mt-1 text-xl font-black text-slate-900">{inquiries.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">미해결</p>
              <p className="mt-1 text-xl font-black text-[#4E46E5]">
                {inquiries.filter((item) => item.status !== "RESOLVED").length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`rounded-xl border px-4 py-2 text-[12px] font-bold transition-all ${
                activeFilter === tab.id
                  ? "border-[#4E46E5] bg-[#4E46E5] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              <span className="ml-2 text-[10px] font-medium opacity-70">
                {
                  inquiries.filter((i) =>
                    tab.id === "ALL" ? true : i.status === tab.id,
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex min-h-[700px] flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-center table-fixed min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-[11px] uppercase tracking-widest font-black">
                <th className="p-6 w-32">상태</th>
                <th className="p-6 w-44 text-left pl-8">문의자</th>
                <th className="p-6">문의 제목</th>
                <th className="p-6 w-56">회신 이메일</th>
                <th className="p-6 w-36">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-32 text-slate-400 font-bold text-sm"
                  >
                    등록된 문의 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.reportId}
                    className="group cursor-pointer transition-colors hover:bg-slate-50/70"
                    onClick={() =>
                      router.push(`/global/support/inquiry/${item.reportId}`)
                    }
                  >
                    <td className="p-6">
                      <span
                        className={`inline-flex min-w-[74px] items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-black leading-none ${getStatusBadgeClass(item.status)}`}
                      >
                        {toReportStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="p-6 text-left pl-8">
                      <p className="font-bold text-slate-800 text-[14px]">
                        {item.reporterNickname}
                      </p>
                    </td>
                    <td className="p-6">
                      <p className="font-bold text-slate-700 text-[13px] truncate text-center group-hover:text-[#4E46E5] transition-colors">
                        {item.title || "제목 없음"}
                      </p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2 font-bold text-[12px] text-[#4E46E5]">
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

        <div className="mt-auto flex items-center justify-center gap-4 border-t border-slate-200 bg-slate-50 px-6 py-5">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-[#4E46E5] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeftIcon />
          </button>

          <div className="flex gap-2">
            {pageNumbers.map((pageNo) => (
              <button
                key={pageNo}
                onClick={() => setCurrentPage(pageNo)}
                className={`h-9 w-9 rounded-xl border text-[12px] font-black transition-all ${
                  currentPage === pageNo
                    ? "border-[#4E46E5] bg-[#4E46E5] text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                }`}
              >
                {pageNo}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-[#4E46E5] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </section>
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
