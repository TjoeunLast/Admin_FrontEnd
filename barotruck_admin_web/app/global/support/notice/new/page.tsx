"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { noticeApi } from "@/app/features/shared/api/notice_api";

export default function NewNoticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noticeId = searchParams.get("id"); // URL에 ?id=XX 가 있으면 수정 모드

  const [formData, setFormData] = useState({
    title: "",
    isPinned: "N" as "Y" | "N",
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
      });
    }
  }, [noticeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (noticeId) {
        await noticeApi.update(Number(noticeId), formData);
        alert("공지사항이 수정되었습니다!");
      } else {
        await noticeApi.create(formData);
        alert("공지사항이 등록되었습니다!");
      }
      router.push("/global/support");
    } catch(err) {
      alert("작업 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-[#1e293b]">
        {noticeId ? "📢 공지사항 수정" : "📢 새 공지사항 작성"}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="important"
                checked={formData.isPinned === "Y"}
                onChange={(e) => setFormData({...formData, isPinned: e.target.checked ? "Y" : "N"})}
              />
              <label htmlFor="important" className="text-sm font-bold text-red-500">중요 공지(상단 고정)</label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">제목</label>
            <input 
              type="text" 
              className="w-full p-3 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">내용</label>
            <textarea 
              className="w-full h-[400px] p-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 text-slate-500">취소</button>
          <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold">
            {noticeId ? "수정 완료" : "공지 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}