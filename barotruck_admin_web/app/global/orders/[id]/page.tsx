"use client";

import { useRouter, useParams } from "next/navigation";

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  // 샘플 데이터 (추후 API 연동)
  const order = {
    orderNo: id,
    status: "운송 완료",
    shipper: "(주)세븐틴물류",
    driver: "오시온 (5톤 카고)",
    price: "290,000원",
    loadAddr: "전북 군산시 소룡동",
    unloadAddr: "경기 용인시 기흥구",
    loadDate: "2026.02.04 10:00",
    unloadDate: "2026.02.04 16:00",
    timeline: [
      { status: "배차 완료", date: "2026.02.04 09:10", done: true },
      { status: "상차 완료", date: "2026.02.04 10:20", done: true },
      { status: "운송 중", date: "2026.02.04 13:00", done: true },
      { status: "하차 완료", date: "2026.02.04 16:15", done: true },
    ]
  };

  return (
    <div className="max-w-5xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-[#1e293b]">주문 상세 정보 <span className="text-blue-600 ml-2">#{id}</span></h1>
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">뒤로 가기</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 상세 정보 섹션 */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-[#1e293b]">운송 구간 정보</h3>
            <div className="space-y-8 relative">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-600 z-10" />
                  <div className="w-0.5 h-16 bg-slate-100" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase">상차지</p>
                  <p className="text-lg font-bold text-[#1e293b] mt-1">{order.loadAddr}</p>
                  <p className="text-sm text-slate-400">{order.loadDate}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-4 h-4 rounded-full bg-emerald-500 z-10" />
                <div>
                  <p className="text-xs font-bold text-emerald-500 uppercase">하차지</p>
                  <p className="text-lg font-bold text-[#1e293b] mt-1">{order.unloadAddr}</p>
                  <p className="text-sm text-slate-400">{order.unloadDate}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">요청 화주</p>
              <p className="font-bold text-[#1e293b]">{order.shipper}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">담당 차주</p>
              <p className="font-bold text-[#1e293b]">{order.driver}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">최종 운임</p>
              <p className="text-xl font-black text-blue-600">{order.price}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">인수증 확인</p>
              <button className="text-xs font-bold text-slate-500 underline hover:text-blue-600">파일 열기</button>
            </div>
          </section>
        </div>

        {/* 오른쪽: 진행 타임라인 */}
        <div className="space-y-6">
          <section className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm h-full">
            <h3 className="text-lg font-bold mb-8 text-[#1e293b]">운송 타임라인</h3>
            <div className="space-y-8">
              {order.timeline.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${step.done ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    {i !== order.timeline.length - 1 && <div className="w-0.5 h-10 bg-slate-100" />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${step.done ? 'text-[#1e293b]' : 'text-slate-300'}`}>{step.status}</p>
                    <p className="text-[11px] text-slate-400">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}