"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  reportApi,
  ReportResponse,
} from "@/app/features/shared/api/report_api";
import { toReportStatusLabel } from "@/app/features/orders/type";

const INQUIRY_STATUS_FLOW = ["PENDING", "PROCESSING", "RESOLVED"] as const;

function getNextInquiryStatus(currentStatus: string) {
  if (currentStatus === "RESOLVED") return null;
  const currentIndex = INQUIRY_STATUS_FLOW.findIndex(
    (status) => status === currentStatus,
  );
  if (currentIndex < 0) return INQUIRY_STATUS_FLOW[1];
  const nextIndex = currentIndex + 1;
  return INQUIRY_STATUS_FLOW[nextIndex] || null;
}

function getStatusBadgeClass(status: string) {
  if (status === "RESOLVED")
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (status === "PROCESSING")
    return "bg-amber-50 text-amber-600 border-amber-100";
  return "bg-indigo-50 text-[#4E46E5] border-indigo-100";
}

function InquiryDetailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id");
  const inquiryId = Number(rawId);

  const [inquiry, setInquiry] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadInquiryDetail = async () => {
    if (!Number.isFinite(inquiryId)) return;
    try {
      setIsLoading(true);
      const data = await reportApi.getDetail(inquiryId);
      setInquiry(data);
    } catch (error) {
      console.error("문의 상세 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiryDetail();
  }, [inquiryId]);

  const mailtoLink = useMemo(() => {
    if (!inquiry?.email) return null;
    const subject = `[바로트럭 문의 답변] ${inquiry.title || `문의 #${inquiry.reportId}`}`;
    return `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}`;
  }, [inquiry]);

  const nextStatus = useMemo(
    () => getNextInquiryStatus(inquiry?.status ?? "PENDING"),
    [inquiry?.status],
  );

  const handleChangeStatus = async () => {
    if (!inquiry || !nextStatus || isUpdatingStatus) return;

    try {
      setIsUpdatingStatus(true);
      await reportApi.updateReportStatus(inquiry.reportId, nextStatus);
      setInquiry((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      alert(`상태가 "${toReportStatusLabel(nextStatus)}"으로 변경되었습니다.`);
    } catch (error) {
      alert("상태 변경에 실패했습니다.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-20 text-center text-slate-400 font-black italic text-sm">
        데이터 분석 중...
      </div>
    );
  if (!inquiry)
    return (
      <div className="p-20 text-center text-slate-400 font-black text-sm">
        정보를 찾을 수 없습니다.
      </div>
    );

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-24 font-sans text-slate-900">
      <header className="flex items-center justify-between px-1 mb-8">
        <div className="flex items-center gap-4 overflow-hidden">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 shrink-0"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex items-center gap-3 overflow-hidden">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight truncate">
              {inquiry.title || "제목 없음"}
            </h1>
            <span
              className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusBadgeClass(inquiry.status)}`}
            >
              {toReportStatusLabel(inquiry.status)}
            </span>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleChangeStatus}
            disabled={isUpdatingStatus || !nextStatus}
            className={`px-5 py-2 text-[11px] font-bold rounded-lg transition-all shadow-sm active:scale-95 ${
              !nextStatus
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                : "bg-[#4E46E5] text-white hover:bg-blue-700"
            }`}
          >
            {isUpdatingStatus
              ? "변경 중"
              : nextStatus
                ? `${toReportStatusLabel(nextStatus)}로 변경`
                : "처리 완료됨"}
          </button>

          <button
            onClick={() => mailtoLink && (window.location.href = mailtoLink)}
            className="px-5 py-2 bg-white text-slate-600 border border-slate-200 text-[11px] font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm"
          >
            이메일 답장
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100 w-40">
                문의 번호
              </td>
              <td className="p-6 pl-10 text-slate-900 font-black text-[15px]">
                #{inquiry.reportId}
              </td>
            </tr>
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100">
                문의자 정보
              </td>
              <td className="p-6 pl-10">
                <div className="flex items-center gap-6 text-sm font-bold text-slate-600">
                  <span className="text-slate-900 font-black">
                    {inquiry.reporterNickname || "-"}
                  </span>
                  <div className="w-px h-3 bg-slate-200" />
                  <span className="text-[#4E46E5] underline underline-offset-4">
                    {inquiry.email || "-"}
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100">
                문의 유형
              </td>
              <td className="p-6 pl-10 text-slate-700 font-bold text-sm">
                {inquiry.reportType || inquiry.type || "-"}
                {inquiry.orderId && (
                  <span className="ml-4 text-slate-300 font-medium italic">
                    연관 주문: #{inquiry.orderId}
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100">
                등록 일시
              </td>
              <td className="p-6 pl-10 text-slate-500 font-bold text-sm">
                {new Date(inquiry.createdAt).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100 align-top">
                상세 문의 내용
              </td>
              <td className="p-6 pl-12 min-h-[500px] align-top">
                <div className="text-[16px] leading-[1.8] text-slate-700 font-medium whitespace-pre-wrap min-h-[400px]">
                  {inquiry.description || "본문이 없습니다."}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={() => router.push("/global/support?tab=inquiry")}
          className="px-8 py-3bg-transparent text-slate-500 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-slate-100 hover:text-slate-900"
        >
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default function InquiryDetailPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-400 font-black italic text-sm">데이터 분석 중...</div>}>
      <InquiryDetailPageContent />
    </Suspense>
  );
}
