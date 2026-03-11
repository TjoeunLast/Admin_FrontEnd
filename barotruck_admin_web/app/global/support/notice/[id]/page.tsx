"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  noticeApi,
  NoticeResponse,
} from "@/app/features/shared/api/notice_api";

export default function NoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeResponse | null>(null);

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const noticeId = parseInt(rawId || "0", 10);

  useEffect(() => {
    if (!noticeId) return;
    noticeApi
      .getDetail(noticeId)
      .then((res) => {
        if (res.data) setNotice(res.data);
      })
      .catch((err) => {
        console.error("상세 조회 에러:", err);
        alert("글을 불러올 수 없습니다.");
        router.push("/global/support");
      });
  }, [noticeId, router]);

  const handleDelete = async () => {
    if (!confirm("이 공지사항을 정말 삭제하시겠습니까?")) return;
    try {
      await noticeApi.delete(noticeId);
      alert("삭제되었습니다.");
      router.push("/global/support?tab=notice");
    } catch (err) {
      alert("삭제에 실패했습니다.");
    }
  };

  if (!notice)
    return (
      <div className="p-20 text-center text-slate-400 font-black text-sm">
        데이터 로딩 중...
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
              {notice.title}
            </h1>
            {notice.isPinned === "Y" && (
              <span className="shrink-0 px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black rounded-lg uppercase">
                중요
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() =>
              router.push(`/global/support/notice/new?id=${noticeId}`)
            }
            className="px-5 py-2 bg-[#4E46E5] text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="px-5 py-2 bg-white text-rose-600 border border-rose-100 text-[11px] font-bold rounded-lg hover:bg-rose-50 transition-all shadow-sm"
          >
            삭제
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100 w-40">
                공지 번호
              </td>
              <td className="p-6 pl-10 text-slate-900 font-black text-[15px]">
                #{notice.noticeId}
              </td>
            </tr>
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100">
                작성자 정보
              </td>
              <td className="p-6 pl-10">
                <div className="flex items-center gap-6 text-sm font-bold text-slate-600">
                  <span className="flex items-center gap-2">
                    {notice.adminName}
                  </span>
                  <div className="w-px h-3 bg-slate-200" />
                  <span className="text-slate-400 font-medium">
                    등록 일시: {new Date(notice.createdAt).toLocaleString()}
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100 align-top">
                상세 공지 내용
              </td>
              <td className="p-6 pl-12 min-h-[500px] align-top">
                <div className="text-[16px] leading-[1.8] text-slate-700 font-medium whitespace-pre-wrap min-h-[400px]">
                  {notice.content}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={() => router.push("/global/support")}
          className="px-8 py-3bg-transparent text-slate-500 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-slate-100 hover:text-slate-900"
        >
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}
