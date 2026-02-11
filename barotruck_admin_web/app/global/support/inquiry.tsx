// app/global/support/inquiry.tsx
"use client";
import Link from "next/link";

export default function InquiryList() {
  const inquiries = [
    { id: 1, status: "답변 대기", title: "결제 수단 변경은 어떻게 하나요?", author: "김희철(화주)", date: "2026.01.26", color: "text-[#e74c3c]" },
    { id: 2, status: "답변 완료", title: "운송 완료 후 인수증 승인이 늦어지고 있습니다.", author: "노지선(기사)", date: "2026.02.03", color: "text-[#27ae60]" }
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-[#f8f9fa] border-b-2 border-[#eee]">
          <tr>
            <th className="p-4 text-center text-sm font-bold text-[#475569] w-[120px]">상태</th>
            <th className="p-4 text-center text-sm font-bold text-[#475569]">문의 제목 및 작성 정보</th>
            <th className="p-4 text-center text-sm font-bold text-[#475569] w-[120px]">관리</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inq) => (
            <tr key={inq.id} className="border-b border-[#eee] hover:bg-slate-50 transition-colors">
              <td className="p-5 text-center font-bold text-sm">
                <span className={inq.color}>{inq.status}</span>
              </td>
              <td className="p-5">
                <div className="font-bold text-[#1e293b] text-base">{inq.title}</div>
                <div className="text-[#7f8c8d] text-xs mt-1.5 font-medium">작성자: {inq.author} | {inq.date}</div>
              </td>
              <td className="p-5 text-center">
                <Link href={`/global/support/inquiry/${inq.id}`}>
                  <button className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-all ${inq.status === '답변 대기' ? 'bg-[#3b82f6] hover:bg-blue-600' : 'bg-[#94a3b8] hover:bg-slate-500'}`}>
                    {inq.status === '답변 대기' ? '답변하기' : '상세보기'}
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