// app/global/support/report.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { reportApi, ReportResponse } from "@/app/features/shared/api/report_api";

export default function ReportList() {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await reportApi.getAll();
        // 신고 관리 탭에는 신고 타입만 표시하고, 1:1 문의(DISCUSS)는 제외한다.
        setReports(data.filter((item) => item.type !== "DISCUSS"));
      } catch (error) {
        console.error("신고 목록 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchReports();
  }, []);

  const getStatusStyle = (reportType: string) => {
    const isCritical = reportType === "ACCIDENT";

    if (isCritical) {
      return {
        bgColor: "bg-[#fee2e2]",
        textColor: "text-[#ef4444]",
        borderColor: "border-l-[#ef4444]",
      };
    }

    return {
      bgColor: "bg-[#fef3c7]",
      textColor: "text-[#d97706]",
      borderColor: "border-l-[#f59e0b]",
    };
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 font-medium">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] space-y-5">
      <h2 className="text-[#c53030] text-xl font-extrabold flex items-center gap-2 mb-6">
        긴급 신고 현황
      </h2>

      {reports.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-[#e2e8f0] text-center text-gray-400">
          접수된 신고 내역이 없습니다.
        </div>
      ) : (
        reports.map((report) => {
          const style = getStatusStyle(report.reportType);

          return (
            <div
              key={report.reportId}
              className={`bg-white p-6 rounded-2xl border border-[#e2e8f0] border-l-[6px] ${style.borderColor} shadow-sm flex justify-between items-center transition-all hover:scale-[1.01]`}
            >
              <div className="flex-1">
                <span
                  className={`${style.bgColor} ${style.textColor} px-2.5 py-1 rounded-md text-xs font-black`}
                >
                  [{report.reportType}]
                </span>
                <div className="mt-4 text-lg font-bold text-[#1e293b]">
                  대상: {report.targetNickname} | 신고자: {report.reporterNickname}
                </div>
                <p className="text-sm text-[#64748b] mt-2 font-medium leading-relaxed">
                  내용: {report.description}
                </p>
                <div className="mt-3 text-[11px] text-[#94a3b8]">
                  신고 일시: {new Date(report.createdAt).toLocaleString()}
                </div>
              </div>

              <Link href="/global/users">
                <button className="px-6 py-3 bg-[#1e293b] hover:bg-black rounded-xl font-bold text-sm text-white transition-all shadow-md active:scale-95">
                  회원 정보 확인
                </button>
              </Link>
            </div>
          );
        })
      )}
    </div>
  );
}
