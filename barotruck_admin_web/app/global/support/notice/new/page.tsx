// app/global/support/notice/new/page.tsx
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
    content: ""
  });

  useEffect(() => {
    if(noticeId) {
      noticeApi.getDetail(Number(noticeId)).then(res => {
        setFormData({
          title: res.data.title,
          isPinned: res.data.isPinned,
          content: res.data.content
        });
      }).catch(() => alert("데이터를 불러오는데 실패했습니다."));
    }
  }, [noticeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // 중복 제출 방지

    setIsSubmitting(true);
    try {
      if (noticeId) {
        await noticeApi.update(Number(noticeId), formData);
        alert("공지사항이 수정되었습니다!");
      } else {
        await noticeApi.create(formData);
        alert("공지사항이 등록되었습니다!");
      }
      router.push("/global/support");
      router.refresh(); // 데이터 최신화를 위해 리프레시 호출
    } catch(err) {
      console.error("저장 실패", err);
      alert("공지사항 저장에 실패했습니다. 내용을 다시 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          {noticeId ? "공지사항 수정" : "새 공지사항 작성"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="important" 
                className="w-4 h-4 text-blue-600 rounded"
                checked={formData.isPinned === "Y"}
                onChange={(e) => setFormData({...formData, isPinned: e.target.checked ? "Y" : "N"})}
              />
              <label htmlFor="important" className="text-sm font-bold text-red-500 cursor-pointer">
                중요 공지(상단 고정)
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">제목</label>
            <input 
              type="text" 
              className="w-full p-3 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500 transition-colors"
              placeholder="공지사항 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">내용</label>
            <textarea 
              className="w-full h-[400px] p-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none transition-colors"
              placeholder="공지사항 상세 내용을 입력하세요"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
          >
            취소
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-95'}`}
          >
            {isSubmitting ? "저장 중..." : (noticeId ? "수정 완료" : "공지 등록")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewNoticePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-6 text-slate-400">로딩 중...</div>}>
      <NewNoticePageContent />
    </Suspense>
  );
}
