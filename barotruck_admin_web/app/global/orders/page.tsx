// app/global/orders/page.tsx
"use client"
import Link from 'next/link'; // 1. Link 컴포넌트를 임포트합니다.
import { useEffect, useState } from 'react';
import { fetchOrders } from './../../features/shared/api/order_api';
import { OrderListResponse, ORDER_DRIVING_STATUS_MAP } from '../../features/orders/type';

export default function Order_Page() {
    /*
    const orders = [
        { id: 'ORD-2026-0202-001', route: '전북 군산 → 경기 용인', client: '(주)세븐틴물류', driver: '오시온', vehicle: '5톤 카고', price: '290,000원', status: '운송 완료', statusClass: 'bg-green-100 text-green-700 border-green-200' },
        { id: 'ORD-2026-0203-002', route: '서울 송파 → 대구 달서', client: '(주)드림통상', driver: '김대영', vehicle: '1톤 탑차', price: '105,000원', status: '배차 대기', statusClass: 'bg-orange-100 text-orange-700 border-orange-200' },
        { id: 'ORD-2026-0204-003', route: '경기 과천 → 경남 경주', client: '(주)라이즈택배', driver: '이원희', vehicle: '11톤 윙바디', price: '470,000원', status: '운송 중', statusClass: 'bg-blue-100 text-blue-700 border-blue-200' },
    ];
    */

    // 1. 전체 데이터와 화면에 보여줄 데이터(필터링 결과) 상태 분리
    const [orders, setOrders] = useState<OrderListResponse[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderListResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 2. 검색창, 필터 상태 관리
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const data = await fetchOrders();
                setOrders(data);
                setFilteredOrders(data); // 처음엔 필터 없이 전체 데이터를 보여줍니다.
            } catch(error) {
                console.error('주문 목록을 불러오는데 실패하였습니다.', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadOrders();
    }, []);

    // 3. 필터 및 검색 로직
    const handleSearch = () => {
        let res = orders;

        // 운송 상태
        if(statusFilter !== 'ALL') {
            res = res.filter(order => order.status === statusFilter);
        }

        // 텍스트 검색 (주문번호, 상차지, 하차지)
        if(searchTerm.trim() !== '') {
            const keyword = searchTerm.toLowerCase();
            res = res.filter(order => 
                String(order.orderId).includes(keyword) || 
                (order.startPlace && order.startPlace.toLowerCase().includes(keyword)) ||
                (order.endPlace && order.endPlace.toLowerCase().includes(keyword))
            );
        }

        setFilteredOrders(res);
    };

    // 4. 상태 필터(Select)가 변경될 때마다 자동 검색 실행 (UX 개선)
    useEffect(() => {
        handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, orders]);

    // 엔터키를 누르면 검색 실행
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if(e.key === 'Enter') {
            handleSearch();
        }
    };

    

    // 상태에 따른 배지 색상
    const getStatusClass = (status: string) => {
        switch(status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'REQUESTED': case 'APPLIED': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'IN_TRANSIT': case 'LOADING': case 'UNLOADING': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if(isLoading) return <div>데이터를 불러오는 중입니다...</div>;

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
                    <select 
                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white outline-none focus:border-blue-500 transition-all"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {/* 백엔드 Enum 명칭과 value를 일치시킵니다 */}
                        <option value="ALL">전체 상태</option>
                        <option value="REQUESTED">배차 대기</option>
                        <option value="ACCEPTED">배차 확정</option>
                        <option value="IN_TRANSIT">운송 중</option>
                        <option value="COMPLETED">운송 완료</option>
                    </select>
                </div>
                <div className="flex-[2]">
                    <label className="block text-xs font-bold text-slate-500 mb-2">검색어</label>
                    <input 
                        type="text" 
                        placeholder="주문번호, 상차지, 하차지 검색" 
                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown} // 엔터키 지원
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="bg-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold h-[45px] hover:bg-blue-600 transition-colors"
                >
                    조회
                </button>
            </div>

            {/* 테이블 영역 */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase">주문번호</th>
                            <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase">상차지</th>
                            <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase">하차지</th>
                            <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase">차량정보</th>
                            <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase">운임</th>
                            <th className="p-4 text-center text-xs font-bold text-slate-600 uppercase text-center">상태</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-slate-800">
                        {/* 검색 결과가 1개 이상일 때 */}
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                            <tr key={order.orderId} className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-default">
                                <td className="p-5 font-semibold text-center">
                                    <Link 
                                        href={`/global/orders/${order.orderId}`}
                                        className="text-blue-500 hover:text-blue-700 hover:underline decoration-2 transition-colors"
                                    >
                                        {order.orderId}
                                    </Link>
                                </td>
                                <td className="p-5 text-center">{order.startPlace}</td>
                                <td className="p-5 text-center">{order.endPlace}</td>
                                <td className="p-5 text-center">
                                    <div className="font-semibold">{order.reqCarType}</div>
                                    <div className="text-xs text-slate-400">{order.reqTonnage}</div>
                                </td>
                                <td className="p-5 text-right font-bold text-base">
                                    {order.totalPrice?.toLocaleString() || 0}원
                                </td>
                                <td className="p-5 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${getStatusClass(order.status)}`}>
                                        {ORDER_DRIVING_STATUS_MAP[order.status] || order.status}
                                    </span>
                                </td>
                            </tr>
                            ))
                        ) : (
                            /* 검색 결과가 0개일 때 */
                            <tr>
                                <td colSpan={6} className="p-10 text-center text-slate-500 font-bold">
                                    조건에 일치하는 주문이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}