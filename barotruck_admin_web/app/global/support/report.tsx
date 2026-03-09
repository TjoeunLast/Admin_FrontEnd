// app/global/support/report.tsx
"use client";
import { useEffect, useState } from "react";
import { reportApi, ReportResponse } from "@/app/features/shared/api/report_api";
import ReportModal from "@/app/features/user/support/ReportModal";

export default function ReportList() {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportResponse | null>(null);

  const fetchReports = async () => {
    try {
      const data = await reportApi.getAll();
      setReports(data);
    } catch(err) {
      console.error("신고 목록을 불러오는데 실패하였습니다.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // 상태 배지 스타일 설정
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return { text: "대기 중", class: "bg-gray-100 text-gray-500 border-gray-200" };
      case "PROCESSING": return { text: "처리 중", class: "bg-blue-50 text-blue-600 border-blue-200" };
      case "RESOLVED": return { text: "해결 완료", class: "bg-green-50 text-green-600 border-green-200" };
      default: return { text: status, class: "bg-gray-100 text-gray-500" };
    }
  };

  const getStatusStyle = (type: string) => {
    const isCritical = type === "ACCIDENT";
    return isCritical 
      ? { bgColor: "bg-[#fee2e2]", textColor: "text-[#ef4444]", borderColor: "border-l-[#ef4444]" }
      : { bgColor: "bg-[#fef3c7]", textColor: "text-[#d97706]", borderColor: "border-l-[#f59e0b]" };
  }

  if (loading) return <div className="p-10 text-center">불러오는 중...</div>;

  return (
    <div className="max-w-[1000px] space-y-5">
      <h2 className="text-[#c53030] text-xl font-extrabold mb-6">🚨 긴급 신고 현황</h2>
      
      {reports.map((r) => {
        const style = getStatusStyle(r.reportType);
        const badge = getStatusBadge(r.status);
        return (
          <div key={r.reportId} className={`bg-white p-6 rounded-2xl border border-[#e2e8f0] border-l-[6px] ${style.borderColor} shadow-sm flex justify-between items-center transition-all hover:scale-[1.01]`}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`${style.bgColor} ${style.textColor} px-2.5 py-1 rounded-md text-xs font-black`}>[{r.reportType}]</span>
                {/* 상태 표시 추가 */}
                <span className={`${badge.class} px-2 py-0.5 rounded-full text-[10px] font-bold border`}>{badge.text}</span>
              </div>
              <div className="mt-4 text-lg font-bold text-[#1e293b]">대상: {r.targetNickname} | 신고자: {r.reporterNickname}</div>
              <p className="text-sm text-[#64748b] mt-2 font-medium">내용: {r.description}</p>
              <div className="mt-3 text-[11px] text-[#94a3b8]">신고 일시: {new Date(r.createdAt).toLocaleString()}</div>
            </div>

            <button 
              onClick={() => setSelectedReport(r)}
              className="px-6 py-3 bg-[#1e293b] hover:bg-black rounded-xl font-bold text-sm text-white transition-all shadow-md"
            >
              상세보기
            </button>
          </div>
        );
      })}

      {selectedReport && (
        <ReportModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
          onRefresh={fetchReports}
        />
      )}
    </div>
  );
}