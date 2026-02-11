// app/global/support/report.tsx
"use client";

export default function ReportList() {
  const reports = [
    {
      type: "허위 인수증 제출",
      target: "윤은석(기사)",
      reporter: "(주)라이즈택배",
      content: "실제 하차하지 않았는데 하차 완료 처리했습니다. (증빙 사진 없음)",
      level: "critical",
      bgColor: "bg-[#fee2e2]",
      textColor: "text-[#ef4444]",
      borderColor: "border-l-[#ef4444]"
    },
    {
      type: "연락두절",
      target: "박재민(기사)",
      reporter: "(주)드림운송",
      content: "상차 예정 시간 1시간이 지났는데 연락을 받지 않습니다.",
      level: "warning",
      bgColor: "bg-[#fef3c7]",
      textColor: "text-[#d97706]",
      borderColor: "border-l-[#f59e0b]"
    }
  ];

  return (
    <div className="max-w-[1000px] space-y-5">
      <h2 className="text-[#c53030] text-xl font-extrabold flex items-center gap-2 mb-6">🚨 긴급 신고 현황</h2>
      
      {reports.map((r, i) => (
        <div 
          key={i} 
          className={`bg-white p-6 rounded-2xl border border-[#e2e8f0] border-l-[6px] ${r.borderColor} shadow-sm flex justify-between items-center transition-all hover:scale-[1.01]`}
        >
          <div className="flex-1">
            <span className={`${r.bgColor} ${r.textColor} px-2.5 py-1 rounded-md text-xs font-black`}>
              [{r.type}]
            </span>
            <div className="mt-4 text-lg font-bold text-[#1e293b]">
              대상: {r.target} | 신고자: {r.reporter}
            </div>
            <p className="text-sm text-[#64748b] mt-2 font-medium leading-relaxed">
              내용: {r.content}
            </p>
          </div>
          <button className={`px-6 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md ${r.level === 'critical' ? 'bg-[#1e293b] hover:bg-black' : 'bg-[#f59e0b] hover:bg-[#d97706]'}`}>
            {r.level === 'critical' ? '계정 일시 정지' : '경고 발송'}
          </button>
        </div>
      ))}
    </div>
  );
}