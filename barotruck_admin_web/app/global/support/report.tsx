"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  reportApi,
  ReportResponse,
} from "@/app/features/shared/api/report_api";
import { toReportStatusLabel } from "@/app/features/orders/type";
import client from "@/app/features/shared/api/client";

const REPORT_TYPE_MAP: Record<string, string> = {
  ACCIDENT: "사고 발생",
  NO_SHOW: "노쇼",
  ETC: "기타 신고",
};

const FILTER_TABS = [
  { id: "ALL", label: "전체 신고" },
  { id: "RESOLVED", label: "답변완료" },
  { id: "UNRESOLVED", label: "접수대기" },
] as const;
type ReportFilter = (typeof FILTER_TABS)[number]["id"];

function getStatusBadgeClass(status: string) {
  if (status === "RESOLVED")
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (status === "PROCESSING")
    return "bg-amber-50 text-amber-600 border-amber-100";
  return "bg-indigo-50 text-[#4E46E5] border-indigo-100";
}

function getReportTypeBadgeClass(type?: string) {
  if (type === "ACCIDENT") return "bg-rose-50 text-rose-600 border-rose-100";
  if (type === "NO_SHOW")
    return "bg-orange-50 text-orange-600 border-orange-100";
  return "bg-slate-50 text-slate-500 border-slate-100";
}

type SuspensionOption = "NONE" | "DAYS" | "PERMANENT";

const toPositiveId = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
};

const resolveTargetUserId = (report: ReportResponse): number | null => {
  const candidate = report as ReportResponse & {
    targetUserId?: number;
    targetMemberId?: number;
    targetId?: number;
  };
  return (
    toPositiveId(report.targetUser?.userId) ??
    toPositiveId(candidate.targetUserId) ??
    toPositiveId(candidate.targetMemberId) ??
    toPositiveId(candidate.targetId) ??
    null
  );
};

const applyTemporarySuspension = async (
  userId: number,
  days: number,
): Promise<void> => {
  await client.post(`/api/v1/admin/user/suspend/${userId}`, { days });
};

export default function ReportList() {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const [activeReport, setActiveReport] = useState<ReportResponse | null>(null);
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [suspensionOption, setSuspensionOption] =
    useState<SuspensionOption>("NONE");
  const [suspensionDays, setSuspensionDays] = useState("7");
  const [isApplyingSuspension, setIsApplyingSuspension] = useState(false);

  const [activeFilter, setActiveFilter] = useState<ReportFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const buildUserDetailHref = (userId?: number | null) =>
    userId ? `/global/users/${userId}` : null;

  // 데이터 로드
  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await reportApi.getAll();
      setReports(data.filter((item) => item.type !== "DISCUSS"));
    } catch (error) {
      console.error("신고 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm("이 신고 내역을 삭제하시겠습니까?")) return;
    try {
      setDeletingReportId(reportId);
      const success = await reportApi.deleteReport(reportId);
      if (success) {
        setReports((prev) => prev.filter((item) => item.reportId !== reportId));
        alert("신고가 삭제되었습니다.");
      } else {
        alert("신고 삭제에 실패했습니다.");
      }
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingReportId(null);
    }
  };

  const filteredData = useMemo(() => {
    if (activeFilter === "ALL") return reports;
    if (activeFilter === "RESOLVED") {
      return reports.filter((item) => item.status === "RESOLVED");
    }
    // UNRESOLVED
    return reports.filter((item) => item.status !== "RESOLVED");
  }, [reports, activeFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const closeSuspensionModal = () => {
    if (isApplyingSuspension) return;
    setIsSuspensionModalOpen(false);
    setActiveReport(null);
    setSuspensionOption("NONE");
    setSuspensionDays("7");
  };

  const openSuspensionModal = (report: ReportResponse) => {
    setActiveReport(report);
    setSuspensionOption("NONE");
    setSuspensionDays("7");
    setIsSuspensionModalOpen(true);
  };

  const handleApplySuspension = async () => {
    if (!activeReport) return;
    const targetUserId = resolveTargetUserId(activeReport);
    const parsedDays = Number.parseInt(suspensionDays, 10);
    const validatedDays = Number.isFinite(parsedDays) ? parsedDays : 0;

    if (suspensionOption !== "NONE" && !targetUserId)
      return alert("신고 대상자 ID를 찾을 수 없습니다.");
    if (
      suspensionOption === "DAYS" &&
      (validatedDays < 1 || validatedDays > 3650)
    )
      return alert("정지 일수는 1~3650일 사이여야 합니다.");

    try {
      setIsApplyingSuspension(true);
      if (suspensionOption === "PERMANENT" && targetUserId)
        await client.post(`/api/v1/admin/user/delete/${targetUserId}`);
      if (suspensionOption === "DAYS" && targetUserId)
        await applyTemporarySuspension(targetUserId, validatedDays);

      await reportApi.updateReportStatus(activeReport.reportId, "RESOLVED");

      setReports((prev) =>
        prev.map((item) =>
          item.reportId === activeReport.reportId
            ? { ...item, status: "RESOLVED" }
            : item,
        ),
      );
      alert("처리가 완료되었습니다.");
      closeSuspensionModal();
    } catch (error) {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setIsApplyingSuspension(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center text-slate-400 font-black italic text-sm">
        데이터 분석 중...
      </div>
    );

  return (
    <div className="space-y-6">
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
                  reports.filter((r) => {
                    if (tab.id === "ALL") return true;
                    if (tab.id === "RESOLVED") return r.status === "RESOLVED";
                    if (tab.id === "UNRESOLVED") return r.status !== "RESOLVED";
                    return false;
                  }).length
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
              <th className="p-6 text-center w-32 border-r border-slate-100">
                유형
              </th>
              <th className="p-6 text-center w-32">상태</th>
              <th className="p-6 text-center w-40">신고/대상자</th>
              <th className="p-6 text-center">신고 내용</th>
              <th className="p-6 text-center w-40">접수 일시</th>
              <th className="p-6 text-center w-48">제재 관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-20 text-center text-slate-400 font-black italic text-sm"
                >
                  접수된 신고 내역이 없습니다.
                </td>
              </tr>
            ) : (
              paginatedData.map((report) => (
                <tr
                  key={report.reportId}
                  className="odd:bg-white even:bg-slate-50/30 hover:bg-indigo-50/50 transition-all group"
                >
                  <td className="p-6 text-center border-r border-slate-50">
                    <span
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black border ${getReportTypeBadgeClass(report.reportType)}`}
                    >
                      {REPORT_TYPE_MAP[report.reportType || ""] ||
                        report.reportType ||
                        "기타"}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <span
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black border ${getStatusBadgeClass(report.status)}`}
                    >
                      {toReportStatusLabel(report.status)}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-slate-900 font-black text-[13px]">
                        {report.reporterNickname || "-"}
                      </span>
                      <div className="w-4 h-px bg-slate-200" />
                      <span className="text-slate-400 font-bold text-[11px] italic">
                        {report.targetNickname || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 px-10 text-center">
                    <p className="text-slate-600 font-medium text-[14px] line-clamp-2 leading-relaxed tracking-tight">
                      {report.description || "-"}
                    </p>
                  </td>
                  <td className="p-6 text-slate-400 text-center text-[11px] font-medium leading-tight uppercase">
                    {new Date(report.createdAt)
                      .toLocaleString()
                      .split(" ")
                      .slice(0, 3)
                      .join(" ")}
                  </td>
                  <td className="p-6 text-center">
                    <div
                      className="flex flex-col gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openSuspensionModal(report)}
                        className="px-3 py-2 bg-slate-900 text-white text-[11px] font-black rounded-lg hover:bg-black transition-all shadow-sm active:scale-95"
                      >
                        제재 처리
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report.reportId)}
                        disabled={deletingReportId === report.reportId}
                        className="px-3 py-2 bg-white text-rose-600 border border-rose-100 text-[11px] font-black rounded-lg hover:bg-rose-50 transition-all shadow-sm"
                      >
                        {deletingReportId === report.reportId
                          ? "삭제중"
                          : "신고 삭제"}
                      </button>
                    </div>
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
              onClick={() => setCurrentPage((p) => p - 1)}
              className="text-sm font-black text-slate-400 disabled:opacity-20 transition-all hover:text-slate-600"
            >
              이전
            </button>
            <div className="flex items-center gap-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNo) => (
                  <button
                    key={pageNo}
                    onClick={() => setCurrentPage(pageNo)}
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
              onClick={() => setCurrentPage((p) => p + 1)}
              className="text-sm font-black text-slate-400 disabled:opacity-20 transition-all hover:text-slate-600"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {isSuspensionModalOpen && activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  신고 제재 처리
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  #{activeReport.reportId} 신고 건에 대한 대상자 제재 방식을
                  선택하세요.
                </p>
              </div>
              <button
                onClick={closeSuspensionModal}
                disabled={isApplyingSuspension}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
              >
                닫기
              </button>
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                신고 정보
              </div>
              <div className="mt-2 space-y-1">
                <p>
                  <span className="font-semibold text-slate-700">신고자:</span>{" "}
                  {activeReport.reporterNickname || "-"}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">대상자:</span>{" "}
                  {activeReport.targetNickname || "-"}
                </p>
                <p className="line-clamp-2">
                  <span className="font-semibold text-slate-700">내용:</span>{" "}
                  {activeReport.description || "-"}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {buildUserDetailHref(activeReport.reporterUser?.userId) ? (
                  <Link
                    href={
                      buildUserDetailHref(activeReport.reporterUser?.userId)!
                    }
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    신고자 정보 확인
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-100 px-3 text-xs font-bold text-slate-400"
                  >
                    신고자 정보 없음
                  </button>
                )}
                {buildUserDetailHref(activeReport.targetUser?.userId) ? (
                  <Link
                    href={buildUserDetailHref(activeReport.targetUser?.userId)!}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    대상자 정보 확인
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-100 px-3 text-xs font-bold text-slate-400"
                  >
                    대상자 정보 없음
                  </button>
                )}
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  정지 옵션
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(["NONE", "DAYS", "PERMANENT"] as SuspensionOption[]).map(
                    (option) => (
                      <button
                        key={option}
                        onClick={() => setSuspensionOption(option)}
                        className={`rounded-xl border px-3 py-3 text-sm font-bold transition-colors ${suspensionOption === option ? "border-[#4E46E5] bg-[#4E46E5] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                      >
                        {option === "NONE"
                          ? "정지 없음"
                          : option === "DAYS"
                            ? "기간 정지"
                            : "영구 정지"}
                      </button>
                    ),
                  )}
                </div>
              </div>
              {suspensionOption === "DAYS" && (
                <label className="block">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    정지 일수
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={suspensionDays}
                    onChange={(event) => setSuspensionDays(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-900"
                    placeholder="예: 7"
                  />
                </label>
              )}
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeSuspensionModal}
                disabled={isApplyingSuspension}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500"
              >
                취소
              </button>
              <button
                onClick={() => void handleApplySuspension()}
                disabled={isApplyingSuspension}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${isApplyingSuspension ? "bg-slate-200 text-slate-500" : "bg-[#4E46E5] text-white hover:bg-[#4338CA]"}`}
              >
                {isApplyingSuspension ? "처리 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertTriangleIcon({ className = "" }: { className?: string }) {
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
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
