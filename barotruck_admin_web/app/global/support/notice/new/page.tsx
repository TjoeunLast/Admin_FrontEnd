"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { noticeApi } from "@/app/features/shared/api/notice_api";

function NewNoticePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noticeId = searchParams.get("id");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    isPinned: "N",
    content: "",
  });

  useEffect(() => {
    if (noticeId) {
      noticeApi
        .getDetail(Number(noticeId))
        .then((res) => {
          setFormData({
            title: res.data.title,
            isPinned: res.data.isPinned,
            content: res.data.content,
          });
        })
        .catch(() => alert("데이터를 불러오는데 실패했습니다."));
    }
  }, [noticeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (noticeId) {
        await noticeApi.update(Number(noticeId), formData);
        alert("공지사항이 수정되었습니다!");
      } else {
        await noticeApi.create(formData);
        alert("공지사항이 등록되었습니다!");
      }
      router.push("/global/support?tab=notice");
      router.refresh();
    } catch (err) {
      console.error("저장 실패", err);
      alert("공지사항 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-24 font-sans text-slate-900">
      {/* 1. 상단 헤더: 제목 스타일 통일 */}
      <header className="mb-8 pl-1 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {noticeId ? "공지사항 수정" : "새 공지사항 작성"}
        </h1>
      </header>

      {/* 2. 메인 입력 폼: 테이블 카드 레이아웃 적용 */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[32px] border border-slate-200 shadow-sm ring-1 ring-slate-100 overflow-hidden"
      >
        <table className="w-full text-left border-collapse table-fixed">
          <tbody className="divide-y divide-slate-100">
            {/* 공지 설정 행 (중요 공지 여부) */}
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100 w-40">
                공지 설정
              </td>
              <td className="p-6 pl-10">
                <label className="flex items-center gap-2 w-fit cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-slate-300 text-[#4E46E5] focus:ring-[#4E46E5] transition-all cursor-pointer"
                    checked={formData.isPinned === "Y"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isPinned: e.target.checked ? "Y" : "N",
                      })
                    }
                  />
                  <span
                    className={`text-[13px] font-black transition-colors ${formData.isPinned === "Y" ? "text-rose-500" : "text-slate-400 group-hover:text-slate-600"}`}
                  >
                    중요 공지로 상단에 고정합니다
                  </span>
                </label>
              </td>
            </tr>

            {/* 제목 입력 행 */}
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100">
                공지 제목
              </td>
              <td className="p-6 pl-10">
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl outline-none focus:border-[#4E46E5] focus:bg-white font-black text-slate-900 text-[15px] transition-all placeholder:text-slate-300"
                  placeholder="공지사항 제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </td>
            </tr>

            {/* 본문 입력 행 */}
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100 align-top">
                공지 내용
              </td>
              <td className="p-6 pl-10">
                <textarea
                  className="w-full h-[500px] bg-slate-50 border border-slate-100 p-6 rounded-xl outline-none focus:border-[#4E46E5] focus:bg-white font-medium text-slate-700 text-[15px] resize-none transition-all placeholder:text-slate-300"
                  placeholder="공지사항 상세 내용을 입력하세요"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  required
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* 3. 하단 제어 구역: 배경색 및 버튼 스타일 통일 */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 text-slate-400 font-black text-[13px] hover:text-slate-600 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-10 py-3 bg-[#4E46E5] text-white font-black text-[13px] rounded-2xl shadow-md transition-all ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-black active:scale-95"}`}
          >
            {isSubmitting
              ? "저장 중..."
              : noticeId
                ? "수정 내용 저장"
                : "공지사항 등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewNoticePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1200px] mx-auto p-20 text-center text-slate-300 font-black italic">
          로딩 중...
        </div>
      }
    >
      <NewNoticePageContent />
    </Suspense>
  );
}
