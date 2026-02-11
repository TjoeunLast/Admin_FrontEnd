// app/global/support/notice.tsx (또는 해당 버튼이 있는 곳)
import Link from 'next/link';

export default function NoticeList() {
  const notices = [
    { id: 1, title: "[공지] 설 연휴 기간 고객센터 운영 안내", date: "2026.02.01", views: 1240 },
    { id: 2, title: "[업데이트] 바로트럭 정산 시스템 자동화 패치 완료", date: "2026.01.25", views: 850 },
  ];

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
            <th className="p-4 text-center">작성일</th>
            <th className="p-4 text-center">조회수</th>
          </tr>
        </thead>
        <tbody>
          {notices.map((n) => (
            <tr key={n.id} className="border-b hover:bg-slate-50 cursor-pointer transition-colors">
              <td className="p-4 text-center">{n.id}</td>
              <td className="p-4 font-medium">{n.title}</td>
              <td className="p-4 text-center text-slate-400">{n.date}</td>
              <td className="p-4 text-center text-slate-400">{n.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}