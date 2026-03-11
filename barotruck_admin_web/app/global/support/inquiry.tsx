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
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  }
  if (status === "PROCESSING") {
    return "bg-amber-50 text-amber-600 border-amber-100";
  }
  return "bg-indigo-50 text-[#4E46E5] border-indigo-100";
}

export default function InquiryList() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<ReportResponse[]>([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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
      <div className="p-20 text-center text-slate-400 font-black italic text-sm">
        데이터 로드 중...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* 상단 필터*/}
      <div className="flex items-center justify-between pr-1">
        <div className="flex items-center gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-[12px] font-black transition-all border ${
                activeFilter === tab.id
                  ? "bg-[#4E46E5] text-white border-[#4E46E5] shadow-sm"
                  : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 opacity-60 ${activeFilter === tab.id ? "text-slate-300" : "text-slate-400"}`}
              >
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

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
              <th className="p-6 text-center w-32 border-r border-slate-50">
                상태
              </th>
              <th className="p-6 text-center w-40">문의자</th>
              <th className="p-6 text-center">문의 제목</th>
              <th className="p-6 text-center w-56">회신 이메일</th>
              <th className="p-6 text-center w-40">등록 일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-20 text-center text-slate-400 font-black italic text-sm"
                >
                  등록된 문의 내역이 없습니다.
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.reportId}
                  onClick={() =>
                    router.push(`/global/support/inquiry/detail?id=${item.reportId}`)
                  }
                  className="odd:bg-white even:bg-slate-50/30 hover:bg-indigo-50/50 cursor-pointer transition-all group active:bg-indigo-100/30"
                >
                  <td className="p-6 text-center border-r border-slate-50">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${getStatusBadgeClass(item.status)}`}
                    >
                      {toReportStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="p-6 text-slate-700 text-center text-sm font-bold tracking-tight">
                    {item.reporterNickname}
                  </td>
                  <td className="p-6">
                    <div className="text-center px-4">
                      <span className="text-slate-900 font-black text-[15px] truncate group-hover:text-[#4E46E5] transition-colors">
                        {item.title || "제목 없음"}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-[#4E46E5] text-center text-[13px] font-bold">
                    <span className="underline underline-offset-4 decoration-indigo-100">
                      {item.email || "-"}
                    </span>
                  </td>
                  <td className="p-6 text-slate-400 text-center text-sm font-medium uppercase">
                    {item.createdAt?.split("T")[0]}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-8 py-8 border-t border-slate-100 bg-slate-50/30">
            <button
              disabled={currentPage === 1}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((p) => p - 1);
              }}
              className="text-sm font-black text-slate-400 disabled:opacity-20 transition-all hover:text-slate-600"
            >
              이전
            </button>
            <div className="flex items-center gap-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNo) => (
                  <button
                    key={pageNo}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentPage(pageNo);
                    }}
                    className={`text-md font-black transition-all ${
                      currentPage === pageNo
                        ? "text-slate-900 underline underline-offset-8 decoration-2 decoration-[#4E46E5]"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {pageNo}
                  </button>
                ),
              )}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((p) => p + 1);
              }}
              className="text-sm font-black text-slate-400 disabled:opacity-20 transition-all hover:text-slate-600"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
