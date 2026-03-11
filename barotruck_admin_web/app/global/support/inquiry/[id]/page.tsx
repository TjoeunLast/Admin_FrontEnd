"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { reportApi, ReportResponse } from "@/app/features/shared/api/report_api";
import { toReportStatusLabel } from "@/app/features/orders/type";

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
}

function getStatusClass(status: string) {
  if (status === "RESOLVED") {
    return "border border-emerald-100 bg-emerald-50 text-emerald-700";
  }
  if (status === "PROCESSING") {
    return "border border-amber-100 bg-amber-50 text-amber-700";
  }
  return "border border-[#DDD6FE] bg-[#EDECFC] text-[#4E46E5]";
}

const INQUIRY_STATUS_FLOW = ["PENDING", "PROCESSING", "RESOLVED"] as const;

function getNextInquiryStatus(currentStatus: string) {
  const currentIndex = INQUIRY_STATUS_FLOW.findIndex((status) => status === currentStatus);
  if (currentIndex < 0) return INQUIRY_STATUS_FLOW[1];
  const nextIndex = (currentIndex + 1) % INQUIRY_STATUS_FLOW.length;
  return INQUIRY_STATUS_FLOW[nextIndex];
}

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const inquiryId = Number(rawId);

  const [inquiry, setInquiry] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusActionMessage, setStatusActionMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadInquiryDetail = async () => {
    if (!Number.isFinite(inquiryId)) {
      setInquiry(null);
      setErrorMessage("유효하지 않은 문의 ID입니다.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await reportApi.getDetail(inquiryId);
      setInquiry(data);
    } catch (error) {
      console.error("문의 상세 로드 실패:", error);
      setInquiry(null);
      setErrorMessage("문의 상세 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInquiryDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryId]);

  const mailtoLink = useMemo(() => {
    if (!inquiry?.email) return null;
    const subject = inquiry.title
      ? `[바로트럭 문의 답변] ${inquiry.title}`
      : `[바로트럭 문의 답변] 문의 #${inquiry.reportId}`;
    return `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}`;
  }, [inquiry]);

  const nextStatus = useMemo(
    () => getNextInquiryStatus(inquiry?.status ?? "PENDING"),
    [inquiry?.status],
  );

  const handleChangeStatus = async () => {
    if (!inquiry || isUpdatingStatus) return;

    try {
      setIsUpdatingStatus(true);
      setStatusActionMessage(null);

      await reportApi.updateReportStatus(inquiry.reportId, nextStatus);

      setInquiry((prev) => {
        if (!prev) return prev;
        return { ...prev, status: nextStatus };
      });
      setStatusActionMessage(`상태가 "${toReportStatusLabel(nextStatus)}"으로 변경되었습니다.`);
    } catch (error) {
      console.error("문의 상태 변경 실패:", error);
      setStatusActionMessage("상태 변경에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] p-8">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center text-slate-400 font-semibold">
          문의 상세를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto max-w-[1200px] p-8 space-y-4">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-5 text-red-700 text-sm font-semibold">
          {errorMessage}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void loadInquiryDetail()}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold hover:bg-slate-50"
          >
            다시 시도
          </button>
          <button
            onClick={() => router.push("/global/support?tab=inquiry")}
            className="px-4 py-2 rounded-xl bg-[#4E46E5] text-white text-sm font-bold hover:bg-[#4338CA]"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="mx-auto max-w-[1200px] p-8">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center text-slate-400 font-semibold">
          문의 정보를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-20">
      <section className="rounded-[24px] border border-slate-200 bg-white px-7 py-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-[#EDECFC] px-3 py-1 text-[11px] font-black tracking-[0.14em] text-[#4E46E5]">
              INQUIRY DETAIL
            </span>
            <h1 className="mt-3 text-[28px] font-black tracking-tight text-[#0F172A]">
              {inquiry.title || "제목 없음"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">문의 번호 #{inquiry.reportId}</p>
          </div>
          <button
            onClick={() => router.push("/global/support?tab=inquiry")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
          >
            목록으로
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-7 py-5">
          <span className={`rounded-lg px-3 py-1.5 text-xs font-black ${getStatusClass(inquiry.status)}`}>
            {toReportStatusLabel(inquiry.status)}
          </span>
          <div className="text-xs font-semibold text-slate-500">
            등록일: <span className="font-bold text-slate-700">{formatDate(inquiry.createdAt)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-7 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">문의자</p>
            <p className="text-base font-bold text-slate-900">{inquiry.reporterNickname || "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">회신 이메일</p>
            <p className="text-base font-bold text-slate-900 break-all">{inquiry.email || "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">문의 유형</p>
            <p className="text-base font-bold text-slate-900">{inquiry.reportType || inquiry.type || "-"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">관련 주문</p>
            <p className="text-base font-bold text-slate-900">{inquiry.orderId ? `#${inquiry.orderId}` : "-"}</p>
          </div>
        </div>

        <div className="px-7 pb-7">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">문의 내용</p>
          <article className="min-h-[220px] rounded-2xl border border-slate-200 bg-slate-50 p-6 text-[15px] leading-7 text-slate-800 whitespace-pre-wrap break-words">
            {inquiry.description || "본문이 없습니다."}
          </article>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-7 py-5">
          <button
            onClick={() => {
              if (!mailtoLink) return;
              window.location.href = mailtoLink;
            }}
            disabled={!mailtoLink}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            이메일 답장
          </button>
          <button
            onClick={() => void handleChangeStatus()}
            disabled={isUpdatingStatus}
            className="px-4 py-2 rounded-xl bg-[#4E46E5] text-white text-sm font-bold hover:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isUpdatingStatus ? "변경 중..." : `${toReportStatusLabel(nextStatus)}로 변경`}
          </button>
        </div>

        {statusActionMessage && (
          <div className="px-7 pb-6 text-right text-xs font-semibold text-slate-600">
            {statusActionMessage}
          </div>
        )}
      </section>
    </div>
  );
}
