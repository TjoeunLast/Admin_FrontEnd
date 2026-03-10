// app/global/support/report.tsx
"use client";
import { useEffect, useState } from "react";
import { reportApi, ReportResponse } from "@/app/features/shared/api/report_api";
import Link from "next/link"; // 이동을 위해 추가

export default function ReportList() {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const buildUserDetailHref = (userId?: number | null) =>
    userId ? `/global/users/${userId}` : null;

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

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusStyle = (type: string) => {
    // 긴급도가 높은 유형 정의
    const isCritical = type === "ACCIDENT";

    if(isCritical) {
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
  }

  if (loading) {
    return <div className="p-10 text-center text-gray-500 font-medium">데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="max-w-[1000px] space-y-5">
      <h2 className="text-[#c53030] text-xl font-extrabold flex items-center gap-2 mb-6">
        🚨 긴급 신고 현황
      </h2>
      
      {reports.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-[#e2e8f0] text-center text-gray-400">
          접수된 신고 내역이 없습니다.
        </div>
      ) : (
        reports.map((r) => {
          const style = getStatusStyle(r.reportType);
          return (
            <div 
              key={r.reportId} 
              className={`bg-white p-6 rounded-2xl border border-[#e2e8f0] border-l-[6px] ${style.borderColor} shadow-sm flex justify-between items-center transition-all hover:scale-[1.01]`}
            >
              <div className="flex-1">
                <span className={`${style.bgColor} ${style.textColor} px-2.5 py-1 rounded-md text-xs font-black`}>
                  [{r.reportType}]
                </span>
                <div className="mt-4 text-lg font-bold text-[#1e293b]">
                  대상: {r.targetNickname} | 신고자: {r.reporterNickname}
                </div>
                <p className="text-sm text-[#64748b] mt-2 font-medium leading-relaxed">
                  내용: {r.description}
                </p>
                <div className="mt-3 text-[11px] text-[#94a3b8]">
                  신고 일시: {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="ml-6 flex shrink-0 flex-col gap-2">
                {buildUserDetailHref(r.reporterUser?.userId) ? (
                  <Link href={buildUserDetailHref(r.reporterUser?.userId)!}>
                    <button className="w-[170px] px-6 py-3 bg-[#1e293b] hover:bg-black rounded-xl font-bold text-sm text-white transition-all shadow-md active:scale-95">
                      신고자 정보 확인
                    </button>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-[170px] px-6 py-3 bg-slate-100 rounded-xl font-bold text-sm text-slate-400 cursor-not-allowed"
                  >
                    신고자 정보 없음
                  </button>
                )}

                {buildUserDetailHref(r.targetUser?.userId) ? (
                  <Link href={buildUserDetailHref(r.targetUser?.userId)!}>
                    <button className="w-[170px] px-6 py-3 bg-white border border-[#cbd5e1] hover:bg-slate-50 rounded-xl font-bold text-sm text-[#1e293b] transition-all shadow-sm active:scale-95">
                      신고대상 정보 확인
                    </button>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-[170px] px-6 py-3 bg-slate-100 rounded-xl font-bold text-sm text-slate-400 cursor-not-allowed"
                  >
                    신고대상 정보 없음
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/*
  // 예시는 참고용
  const reports = [
    {
      type: "허위 인수증 제출",
      target: "윤은석(기사)",
      reporter: "(주)라이즈택배",
      content: "실제 하차하지 않았는데 하차 완료 처리했습니다. (증빙 사진 없음)",
      level: "critical",
      bgColor: "bg-[#fee2e2]",
      textColor: "text-[#ef4444]",
      borderColor: "border-l-[#ef4444]"
    },
    {
      type: "연락두절",
      target: "박재민(기사)",
      reporter: "(주)드림운송",
      content: "상차 예정 시간 1시간이 지났는데 연락을 받지 않습니다.",
      level: "warning",
      bgColor: "bg-[#fef3c7]",
      textColor: "text-[#d97706]",
      borderColor: "border-l-[#f59e0b]"
    }
  ];
  */
