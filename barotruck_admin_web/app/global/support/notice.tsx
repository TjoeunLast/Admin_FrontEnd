// app/global/support/notice.tsx
"use client";

import { noticeApi, NoticeResponse } from '@/app/features/shared/api/notice_api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NoticeList() {
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 목록 로드 및 정렬
  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const res = await noticeApi.getAll();
      
      // 상단 고정(isPinned) 우선, 그 다음 최신순 정렬
      const sortedData = res.data.sort((a, b) => {
        if (a.isPinned === "Y" && b.isPinned === "N") return -1;
        if (a.isPinned === "N" && b.isPinned === "Y") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setNotices(sortedData);
    } catch(err) {
      console.error("공지사항 로드 실패", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchNotices(); 
  }, []);

  // 공지 삭제
  const handleDelete = async (id: number) => {
    if(!confirm("공지를 삭제하시겠습니까?")) return;
    try {
      await noticeApi.delete(id);
      alert("삭제되었습니다.");
      fetchNotices(); 
    } catch(err) {
      alert("삭제에 실패했습니다.");
    }
  };

  if (isLoading) return <div className="p-6 text-center text-slate-500">로딩 중...</div>;

  return (
    <div className="space-y-4">
      {/* ✅ 사라졌던 공지사항 작성 버튼 추가 */}
      <div className="flex justify-end">
        <Link href="/global/support/notice/new">
          <button className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
            + 새 공지사항 작성
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-bold text-slate-600 w-20">번호</th>
              <th className="p-4 font-bold text-slate-600 text-left">제목</th>
              <th className="p-4 font-bold text-slate-600 w-32">작성자</th>
              <th className="p-4 font-bold text-slate-600 w-32">등록일</th>
              <th className="p-4 font-bold text-slate-600 w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {notices.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400 italic">등록된 공지사항이 없습니다.</td>
              </tr>
            ) : (
              notices.map((n) => (
                <tr key={n.noticeId} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-center">{n.noticeId}</td>
                  <td className="p-4 font-medium text-blue-600">
                    {/* ✅ 경로가 /global/support/notice/1 형식이 되어야 함 */}
                    <Link href={`/global/support/notice/${n.noticeId}`} className="hover:underline">
                      {n.isPinned === "Y" && <span className="text-red-500 mr-1">[중요]</span>}
                      {n.title}
                    </Link>
                  </td>
                  <td className="p-4 text-center">{n.adminName}</td>
                  <td className="p-4 text-center text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-3">
                      <Link href={`/global/support/notice/new?id=${n.noticeId}`}>
                        <button className="text-blue-500 font-bold hover:underline">수정</button>
                      </Link>
                      <button 
                        onClick={() => handleDelete(n.noticeId)} 
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}