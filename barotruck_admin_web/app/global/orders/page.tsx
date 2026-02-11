// app/global/orders/page.tsx
"use client"
import Link from 'next/link'; // 1. Link 컴포넌트를 임포트합니다.

export default function Order_Page() {
    const orders = [
        { id: 'ORD-2026-0202-001', route: '전북 군산 → 경기 용인', client: '(주)세븐틴물류', driver: '오시온', vehicle: '5톤 카고', price: '290,000원', status: '운송 완료', statusClass: 'bg-green-100 text-green-700 border-green-200' },
        { id: 'ORD-2026-0203-002', route: '서울 송파 → 대구 달서', client: '(주)드림통상', driver: '김대영', vehicle: '1톤 탑차', price: '105,000원', status: '배차 대기', statusClass: 'bg-orange-100 text-orange-700 border-orange-200' },
        { id: 'ORD-2026-0204-003', route: '경기 과천 → 경남 경주', client: '(주)라이즈택배', driver: '이원희', vehicle: '11톤 윙바디', price: '470,000원', status: '운송 중', statusClass: 'bg-blue-100 text-blue-700 border-blue-200' },
    ];

    return (
        <div className="space-y-6">
            {/* 상단 헤더 영역 */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800">📦 주문 목록 관리</h1>
                <Link href="/global/orders/new">
                    <button className="bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-emerald-600 transition-colors">
                        + 수동 오더 등록
                    </button>
                </Link>
            </div>

            {/* 필터 영역 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex gap-5 items-end mb-8 shadow-sm">
                <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-2">운송 상태</label>
                <select className="w-full p-2.5 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500 transition-all">
                    <option>전체 상태</option>
                    <option>배차 대기</option>
                    <option>운송 중</option>
                    <option>운송 완료</option>
                </select>
                </div>
                <div className="flex-[2]">
                <label className="block text-xs font-bold text-slate-500 mb-2">검색어</label>
                <input 
                    type="text" 
                    placeholder="주문번호, 상차지, 차주명 검색" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all"
                />
                </div>
                <button className="bg-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold h-[45px] hover:bg-blue-600 transition-colors">
                조회
                </button>
            </div>

            {/* 테이블 영역 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                        <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase">주문번호</th>
                        <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase">상/하차지</th>
                        <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase">요청 화주</th>
                        <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase">차량/차주</th>
                        <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase">운임</th>
                        <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase text-center">상태</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-800">
                        {orders.map((order) => (
                        <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-default">
                            <td className="p-5 font-semibold text-center">
                                <Link 
                                    href={`/global/orders/${order.id}`}
                                    className="text-blue-500 hover:text-blue-700 hover:underline decoration-2 transition-colors"
                                >
                                    {order.id}
                                </Link>
                            </td>
                            <td className="p-5 text-center">{order.route}</td>
                            <td className="p-5 text-slate-600 text-center">{order.client}</td>
                            <td className="p-5 text-center">
                            <div className="font-semibold">{order.driver}</div>
                            <div className="text-xs text-slate-400">{order.vehicle}</div>
                            </td>
                            <td className="p-5 text-right font-bold text-base">{order.price}</td>
                            <td className="p-5 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${order.statusClass}`}>
                                {order.status}
                            </span>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}