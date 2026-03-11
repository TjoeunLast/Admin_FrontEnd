"use client";

import {
  noticeApi,
  NoticeResponse,
} from "@/app/features/shared/api/notice_api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NoticeList() {
  const router = useRouter();
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const res = await noticeApi.getAll();
      const sortedData = res.data.sort((a, b) => {
        if (a.isPinned === "Y" && b.isPinned === "N") return -1;
        if (a.isPinned === "N" && b.isPinned === "Y") return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      setNotices(sortedData);
    } catch (err) {
      console.error("공지사항 로드 실패", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("공지를 삭제하시겠습니까?")) return;
    try {
      await noticeApi.delete(id);
      alert("삭제되었습니다.");
      fetchNotices();
    } catch (err) {
      alert("삭제에 실패했습니다.");
    }
  };

  if (isLoading)
    return (
      <div className="p-20 text-center text-slate-400 font-black italic text-sm">
        데이터 로드 중...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-end pr-1">
        <button
          onClick={() => router.push("/global/support/notice/new")}
          className="bg-transparent text-slate-600 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all flex items-center gap-1"
        >
          + 새 공지사항 작성
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr className="text-[12px] font-black text-slate-500 uppercase tracking-widest">
              <th className="p-6 text-center w-32">번호</th>
              <th className="p-6 text-center">제목</th>
              <th className="p-6 text-center w-40">작성자</th>
              <th className="p-6 text-center w-[15%]">등록일</th>
              <th className="p-6 text-center w-44">상태 관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {notices.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-20 text-center text-slate-400 font-black italic text-sm"
                >
                  등록된 공지사항이 없습니다.
                </td>
              </tr>
            ) : (
              notices.map((n) => (
                <tr
                  key={n.noticeId}
                  onClick={() =>
                    router.push(`/global/support/notice/${n.noticeId}`)
                  }
                  className="hover:bg-indigo-50/50 cursor-pointer transition-all group active:bg-indigo-100/50"
                >
                  <td className="p-6 text-slate-900 text-center text-sm font-black border-r border-slate-50">
                    #{n.noticeId}
                  </td>
                  <td className="p-6 text-center">
                    <div className="inline-flex items-center gap-2 max-w-full">
                      <span className="text-slate-900 font-black text-[15px] truncate group-hover:text-[#4E46E5] transition-colors">
                        {n.title}
                      </span>
                      {n.isPinned === "Y" && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black rounded-md">
                          중요
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-slate-700 text-center text-sm font-bold tracking-tight">
                    {n.adminName}
                  </td>
                  <td className="p-6 text-slate-400 text-center text-sm font-medium">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-6 text-center">
                    <div
                      className="flex justify-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          router.push(
                            `/global/support/notice/new?id=${n.noticeId}`,
                          )
                        }
                        className="px-3 py-1.5 bg-[#4E46E5] text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(n.noticeId)}
                        className="px-3 py-1.5 bg-white text-rose-600 border border-rose-100 text-[11px] font-bold rounded-lg hover:bg-rose-50 transition-all shadow-md active:scale-95"
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
