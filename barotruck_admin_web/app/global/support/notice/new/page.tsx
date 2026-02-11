"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewNoticePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    target: "전체",
    isImportant: false,
    content: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 추후 Java 백엔드 API와 연결될 로직입니다.
    alert("공지사항이 등록되었습니다.");
    router.push("/global/support"); // 리스트로 돌아가기
  };

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-[#1e293b]">📢 새 공지사항 작성</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          {/* 옵션 설정 영역 */}
          <div className="flex items-center gap-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-slate-600">공지 대상</label>
              <select 
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:border-blue-500"
                value={formData.target}
                onChange={(e) => setFormData({...formData, target: e.target.value})}
              >
                <option>전체</option>
                <option>차주(기사)</option>
                <option>화주(업체)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                id="important"
                className="w-4 h-4 accent-red-500"
                checked={formData.isImportant}
                onChange={(e) => setFormData({...formData, isImportant: e.target.checked})}
              />
              <label htmlFor="important" className="text-sm font-bold text-red-500 cursor-pointer">중요 공지(상단 고정)</label>
            </div>
          </div>

          {/* 제목 입력 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">공지 제목</label>
            <input 
              type="text" 
              placeholder="공지사항 제목을 입력해주세요"
              className="w-full p-3 border border-slate-200 rounded-xl text-lg font-bold outline-none focus:border-blue-500 transition-all"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          {/* 본문 입력 (에디터 대체 영역) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">공지 내용</label>
            <textarea 
              placeholder="내용을 작성해주세요..."
              className="w-full h-[400px] p-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none leading-relaxed"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
            />
            <p className="text-[11px] text-slate-400">* 이미지나 서식은 추후 Rich Text Editor 연동 시 지원될 예정입니다.</p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all"
          >
            취소
          </button>
          <button 
            type="submit"
            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            공지 등록하기
          </button>
        </div>
      </form>
    </div>
  );
}