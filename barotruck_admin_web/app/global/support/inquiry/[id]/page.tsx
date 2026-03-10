"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { reportApi, ReportResponse } from "@/app/features/shared/api/report_api";
import { toReportStatusLabel } from "@/app/features/orders/type";

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getStatusClass(status: string) {
  if (status === "RESOLVED") {
    return "bg-bt-badge-complete-bg text-bt-badge-complete-text";
  }
  if (status === "PROCESSING") {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-bt-badge-request-bg text-bt-badge-request-text";
}

function toPositiveId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? Math.trunc(id) : null;
}

function resolveInquiryTargetUserId(inquiry: ReportResponse | null): number | null {
  if (!inquiry) return null;

  const source = inquiry as ReportResponse & Record<string, unknown>;
  const reporterUserSnake = source.reporter_user as { userId?: number | string } | undefined;

  // reporterId == userId 정책: reporter 계열 필드만 사용
  const candidates = [
    inquiry.reporterUser?.userId,
    inquiry.reporterId,
    inquiry.reporterUserId,
    inquiry.reporterMemberId,
    source.reporterUser?.userId,
    reporterUserSnake?.userId,
    source.reporter_id,
    source.REPORTER_ID,
  ];

  for (const candidate of candidates) {
    const id = toPositiveId(candidate);
    if (id) return id;
  }

  return null;
}

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const inquiryId = Number(rawId);

  const [inquiry, setInquiry] = useState<ReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const targetUserId = useMemo(() => resolveInquiryTargetUserId(inquiry), [inquiry]);
  const directRoomId = useMemo(() => toPositiveId(inquiry?.roomId ?? inquiry?.chatRoomId), [inquiry]);

  if (isLoading) {
    return <div className="p-20 text-center text-slate-400 font-medium italic">문의 상세를 불러오는 중입니다...</div>;
  }

  if (errorMessage) {
    return (
      <div className="max-w-[1200px] mx-auto p-8 space-y-4">
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
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return <div className="p-20 text-center text-slate-400 font-medium">문의 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-20">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/global/support?tab=inquiry")}
            className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            ← 목록으로
          </button>
          <h1 className="mt-3 text-2xl font-black text-slate-900 tracking-tight">{inquiry.title || "제목 없음"}</h1>
          <p className="mt-1 text-sm text-slate-500">문의 번호 #{inquiry.reportId}</p>
        </div>
      </header>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <span className={`px-3 py-1 rounded-lg text-xs font-black ${getStatusClass(inquiry.status)}`}>
            {toReportStatusLabel(inquiry.status)}
          </span>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">문의자</p>
            <p className="text-base font-bold text-slate-900">{inquiry.reporterNickname || "-"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">회신 이메일</p>
            <p className="text-base font-bold text-slate-900 break-all">{inquiry.email || "-"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">등록일</p>
            <p className="text-base font-bold text-slate-900">{formatDate(inquiry.createdAt)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">관련 주문</p>
            <p className="text-base font-bold text-slate-900">{inquiry.orderId ? `#${inquiry.orderId}` : "-"}</p>
          </div>
        </div>

        <div className="px-8 pb-6">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">문의 내용</p>
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-[15px] leading-7 text-slate-800 whitespace-pre-wrap break-words">
            {inquiry.description || "본문이 없습니다."}
          </article>
        </div>

        <div className="px-8 pb-8 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => {
              if (!mailtoLink) return;
              window.location.href = mailtoLink;
            }}
            disabled={!mailtoLink}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            이메일 답장
          </button>
          <button
            onClick={() => {
              if (targetUserId) {
                const nickname = encodeURIComponent(inquiry.reporterNickname || "");
                router.push(`/global/chat/personal/${targetUserId}?nickname=${nickname}`);
                return;
              }
              if (directRoomId) {
                router.push(`/global/chat/room/${directRoomId}`);
              }
            }}
            disabled={!targetUserId && !directRoomId}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            채팅 시작
          </button>
        </div>

        {!targetUserId && !directRoomId && (
          <div className="px-8 pb-8 text-right text-xs font-semibold text-amber-600">
            문의 데이터에 사용자 ID가 없어 채팅을 시작할 수 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
