// app/global/support/ReportModal.tsx
import { useState, useEffect } from "react";
import { reportApi, ReportResponse } from "@/app/features/shared/api/report_api";

interface Props {
  report: ReportResponse;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ReportModal({ report, onClose, onRefresh }: Props) {
  const [suspensionDays, setSuspensionDays] = useState<number>(7);
  const [isPermanent, setIsPermanent] = useState<boolean>(false); // 영구 정지 체크 상태

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING": return { text: "대기 중", class: "bg-gray-100 text-gray-500 border-gray-200" };
      case "PROCESSING": return { text: "처리 중", class: "bg-blue-50 text-blue-600 border-blue-200" };
      case "RESOLVED": return { text: "해결 완료", class: "bg-green-50 text-green-600 border-green-200" };
      default: return { text: status, class: "bg-gray-100 text-gray-500" };
    }
  };
  
  useEffect(() => {
    if (report.status === "PENDING") {
      reportApi.updateReportStatus(report.reportId, "PROCESSING");
    }
  }, [report.reportId, report.status]);

  const handleDelete = async () => {
    if (confirm("이 신고 건을 삭제(취소)하시겠습니까?")) {
      try {
        const success = await reportApi.deleteReport(report.reportId);
        if (success) {
          onRefresh();
          onClose();
        }
      } catch (err) { alert("삭제 실패"); }
    }
  };

  // 통합된 정지 처리 핸들러
  const handleSuspendAction = async () => {
    const nextStatus = "RESOLVED"; 
    // 영구 정지 체크 시 일수는 의미 없으므로 백엔드 정책에 따라 처리 (예: -1 또는 특정 값)
    const days = isPermanent ? 99999 : suspensionDays; 
    const confirmMsg = isPermanent 
      ? `${report.targetNickname}님을 영구 정지하고 신고를 완료하시겠습니까?`
      : `${report.targetNickname}님을 ${days}일간 정지하고 신고를 완료하시겠습니까?`;

    if (confirm(confirmMsg)) {
      try {
        const success = await reportApi.updateReportStatus(report.reportId, nextStatus);
        if (success) {
          alert("정지 처리가 완료되었습니다.");
          onRefresh();
          onClose();
        }
      } catch (err) { alert("처리 실패"); }
    }
  };

  const badge = getStatusBadge(report.status);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-[#1e293b]">신고 상세 내역</h3>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}>
              {badge.text}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-2xl">&times;</button>
        </div>

        <div className="p-8 space-y-8">
          {/* 신고 정보 섹션 */}
          <section className="space-y-4">
            <h4 className="text-[13px] font-bold text-blue-400">신고 대상 및 사유</h4>
            <div className="bg-[#f8fafc] p-5 rounded-2xl space-y-3">
              <div className="text-sm">
                <span className="font-bold text-gray-800">피신고자: </span>
                <span className="text-blue-600 font-bold">{report.targetNickname}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 text-sm leading-relaxed text-gray-700 min-h-[80px]">
                {report.description}
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 계정 처리 섹션 (개편된 UI) */}
          <section className="space-y-4">
            <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-tight">계정 처리 및 관리</h4>
            
            {/* 기간 입력 및 영구정지 체크박스 한 줄 배치 */}
            <div className="flex items-center gap-4">
              <div className={`flex-1 flex items-center bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-2.5 ${isPermanent ? 'opacity-50' : ''}`}>
                <input 
                  type="number" 
                  disabled={isPermanent}
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(Number(e.target.value))}
                  className="bg-transparent w-full outline-none font-bold text-center text-[#1e293b]"
                />
                <span className="font-bold text-gray-400 ml-2 text-sm">일</span>
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={isPermanent}
                  onChange={(e) => setIsPermanent(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm font-bold text-gray-600 group-hover:text-blue-600 transition-colors">영구 정지</span>
              </label>
            </div>

            {/* 메인 액션 버튼 그룹 */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleSuspendAction}
                className="py-4 bg-[#ef4444] text-white font-bold rounded-2xl hover:bg-[#dc2626] transition-all shadow-lg shadow-red-50 flex justify-center items-center gap-2"
              >
                🚫 정지 처리
              </button>
              <button 
                onClick={handleDelete}
                className="py-4 border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all flex justify-center items-center gap-2"
              >
                🗑️ 신고 취소
              </button>
            </div>

            <button 
              onClick={() => alert("경고 메시지가 발송되었습니다.")}
              className="w-full py-3.5 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex justify-center items-center gap-2"
            >
              ⚠️ 경고 조치
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
