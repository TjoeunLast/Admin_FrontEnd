// app/global/support/notice.tsx (또는 해당 버튼이 있는 곳)
import { noticeApi, NoticeResponse } from '@/app/features/shared/api/notice_api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NoticeList() {
  /*
  const notices = [
    { id: 1, title: "[공지] 설 연휴 기간 고객센터 운영 안내", date: "2026.02.01", views: 1240 },
    { id: 2, title: "[업데이트] 바로트럭 정산 시스템 자동화 패치 완료", date: "2026.01.25", views: 850 },
  ];
  */

  const [notices, setNotices] = useState<NoticeResponse[]>([]);

  // 목록 로드하기
  const fetchNotices = async () => {
    try {
      const res = await noticeApi.getAll();
      setNotices(res.data);
    } catch(err) {
      console.error("공지사항 로드 실패", err);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  // 공지 삭제하기
  const handleDelete = async (id: number) => {
    if(!confirm("공지를 삭제하시겠습니까? 삭제하면 되돌릴 수 없습니다.")) return;

    try {
      await noticeApi.delete(id);
      alert("삭제를 성공하였습니다!");
      fetchNotices(); // 목록 새로고침(Reload)
    } catch(err) {
      alert("삭제를 하지 못했습니다.");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm">
      <div className="p-5 border-b flex justify-between items-center">
        <h3 className="font-bold text-[#1e293b]">등록된 공지사항</h3>
        {/* 🔗 이 버튼이 /global/support/notice/new 경로로 이동하게 합니다. */}
        <Link href="/global/support/notice/new">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all active:scale-95">
            + 새 공지 작성
          </button>
        </Link>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-[#f8fafc] text-[#64748b] border-b">
          <tr>
            <th className="p-4 text-center">번호</th>
            <th className="p-4 text-left">제목</th>
            <th className="p-4 text-center">작성자</th>
            <th className="p-4 text-center">작성일</th>
            <th className="p-4 text-center">조회수</th> 
            <th className="p-4 text-center">관리</th>
          </tr>
        </thead>
        <tbody>
          {notices.map((n) => (
            <tr key={n.noticeId} className="border-b hover:bg-slate-50 cursor-pointer transition-colors">
              <td className="p-4 text-center">{n.noticeId}</td>
              <td className="p-4 font-medium text-blue-600 hover:underline">
                {/* 🔗 상세보기 링크 추가 */}
                <Link href={`/global/support/notice/${n.noticeId}`}>
                  {n.isPinned === "Y" && <span className="text-red-500 mr-1">[중요]</span>}
                  {n.title}
                </Link>
              </td>
              <td className="p-4 text-center">{n.adminName}</td>
              <td className="p-4 text-center text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</td>
              {/* ✅ 조회수 표시 (데이터가 없을 경우 0으로 표시) */}
              <td className="p-4 text-center text-slate-400">
                0
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
          ))}
        </tbody>
      </table>
    </div>
  );
}