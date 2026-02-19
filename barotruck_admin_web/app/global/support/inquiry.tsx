"use client";
import Link from "next/link";

export default function InquiryList() {
  // 채팅형에 맞춰 데이터 구조를 약간 보강합니다.
  const inquiries = [
    { 
      id: 1, 
      status: "상담중", 
      title: "결제 수단 변경은 어떻게 하나요?", 
      lastMessage: "관리자: 확인 후 연락드리겠습니다.",
      author: "김희철(화주)", 
      date: "14:20", 
      unreadCount: 2,
      color: "text-[#3b82f6]" 
    },
    { 
      id: 2, 
      status: "종료", 
      title: "운송 완료 후 인수증 승인이 늦어지고 있습니다.", 
      lastMessage: "상담이 종료되었습니다.",
      author: "노지선(기사)", 
      date: "2026.02.03", 
      unreadCount: 0,
      color: "text-[#94a3b8]" 
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-[#f8f9fa] border-b-2 border-[#eee]">
          <tr>
            <th className="p-4 text-center text-sm font-bold text-[#475569] w-[100px]">상태</th>
            <th className="p-4 text-left text-sm font-bold text-[#475569]">상담 내용</th>
            <th className="p-4 text-center text-sm font-bold text-[#475569] w-[150px]">관리</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inq) => (
            <tr key={inq.id} className="border-b border-[#eee] hover:bg-slate-50 transition-colors">
              <td className="p-5 text-center font-bold text-sm">
                <span className={inq.color}>{inq.status}</span>
              </td>
              <td className="p-5">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-[#1e293b] text-base">{inq.title}</div>
                  {inq.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {inq.unreadCount}
                    </span>
                  )}
                </div>
                <div className="text-[#7f8c8d] text-sm mt-1 truncate max-w-[500px]">
                  {inq.lastMessage}
                </div>
                <div className="text-[#94a3b8] text-xs mt-1 font-medium">
                  {inq.author} | {inq.date}
                </div>
              </td>
              <td className="p-5 text-center">
                <Link href={`/global/support/inquiry/${inq.id}`}>
                  <button className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm ${
                    inq.status === '상담중' 
                      ? 'bg-[#3b82f6] hover:bg-blue-600' 
                      : 'bg-white !text-[#64748b] border border-[#e2e8f0] hover:bg-gray-50'
                  }`}>
                    {inq.status === '상담중' ? '채팅방 입장' : '상담 기록보기'}
                  </button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}