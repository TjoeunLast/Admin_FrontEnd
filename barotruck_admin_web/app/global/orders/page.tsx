"use client"
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { fetchOrders, fetchAdminSummary } from './../../features/shared/api/order_api';
import { OrderListResponse, ORDER_DRIVING_STATUS_MAP } from '../../features/orders/type';

// 정렬 타입 정의
type SortConfig = {
    key: keyof OrderListResponse | 'totalPrice';
    direction: 'asc' | 'desc' | null;
};

export default function Order_Page() {
    const [orders, setOrders] = useState<OrderListResponse[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderListResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    
    // ✅ 정렬 상태 추가
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'orderId', direction: 'desc' });

    // ✅ 프론트엔드에서 직접 계산하는 통계 데이터
    const stats = useMemo(() => {
        const total = orders.length;
        // 완료(COMPLETED)와 취소(CANCEL)를 제외한 나머지를 '진행 중'으로 간주
        const active = orders.filter(o => o.status !== 'COMPLETED' && !o.status.includes('CANCEL')).length;
        const completed = orders.filter(o => o.status === 'COMPLETED').length;
        const cancelled = orders.filter(o => o.status.includes('CANCEL')).length;
        
        return { total, active, completed,cancelled };
    }, [orders]);

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const data = await fetchOrders();
                setOrders(data);
            } catch(error) {
                console.error('주문 목록을 불러오는데 실패하였습니다.', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadOrders();
    }, []);

    // ✅ 필터링 및 정렬 로직 통합
    useEffect(() => {
        let result = [...orders];

        // 1. 필터링
        if(statusFilter !== 'ALL') {
            result = result.filter(order => order.status === statusFilter);
        }

        if(searchTerm.trim() !== '') {
            const keyword = searchTerm.toLowerCase();
            result = result.filter(order => 
                String(order.orderId).includes(keyword) || 
                (order.startPlace?.toLowerCase().includes(keyword)) ||
                (order.endPlace?.toLowerCase().includes(keyword))
            );
        }

        // 2. 정렬
        if (sortConfig.direction !== null) {
            result.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                // 가격 필드의 경우 합산 금액으로 비교
                if (sortConfig.key === 'totalPrice') {
                    aValue = a.totalPrice || (Number(a.basePrice || 0) + Number(a.laborFee || 0));
                    bValue = b.totalPrice || (Number(b.basePrice || 0) + Number(b.laborFee || 0));
                } else {
                    aValue = a[sortConfig.key as keyof OrderListResponse];
                    bValue = b[sortConfig.key as keyof OrderListResponse];
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredOrders(result);
    }, [orders, statusFilter, searchTerm, sortConfig]);

    // ✅ 정렬 핸들러
    const requestSort = (key: SortConfig['key']) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getStatusClass = (status: string) => {
        switch(status) {
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'REQUESTED': case 'APPLIED': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'IN_TRANSIT': case 'LOADING': case 'UNLOADING': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-200';
        }
    };

    if(isLoading) return <div className="p-10 text-center text-gray-500">데이터를 불러오는 중입니다...</div>;

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">주문 목록 관리</h1>
                    <p className="text-gray-500 text-sm mt-1">배차 현황 및 운송 내역을 조회하고 관리합니다.</p>
                </div>
                <Link href="/global/orders/new">
                    <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
                        <span>배차 관리</span>
                    </button>
                </Link>
            </div>

            {/* 상단 통계 위젯 추가 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-gray-400 text-[11px] font-black uppercase mb-1">전체 오더</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}건</p>
                </div>
                
                <div className="bg-blue-600 p-6 rounded-xl shadow-lg shadow-blue-100 text-white">
                    <p className="text-blue-100 text-[11px] font-black uppercase mb-1">진행 중인 오더</p>
                    <p className="text-2xl font-bold">{stats.active}건</p>
                </div>

                <div className="bg-green-600 p-6 rounded-xl shadow-lg shadow-blue-100 text-white">
                    <p className="text-blue-100 text-[11px] font-black uppercase mb-1">완료된 오더</p>
                    <p className="text-2xl font-bold">{stats.completed}건</p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-rose-500 text-[11px] font-black uppercase mb-1">취소된 오더</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.cancelled}건</p>
                </div>
            </div>

            {/* 필터 섹션 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 flex gap-4 items-end shadow-sm">
                <div className="w-44">
                    <label className="text-[11px] font-bold text-gray-400 mb-2 block uppercase tracking-tight">운송 상태</label>
                    <select 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 transition-all"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">전체 상태</option>
                        <option value="REQUESTED">배차 대기</option>
                        <option value="ACCEPTED">배차 확정</option>
                        <option value="IN_TRANSIT">운송 중</option>
                        <option value="COMPLETED">운송 완료</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-[11px] font-bold text-gray-400 mb-2 block uppercase tracking-tight">주문 검색</label>
                    <input 
                        type="text" 
                        placeholder="주문번호, 상차지, 하차지 키워드 입력" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium text-gray-700 outline-none focus:border-blue-500 transition-all placeholder:text-gray-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* 테이블 영역 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200">
                            {/* 클릭 시 정렬 가능하도록 th 수정 */}
                            <th onClick={() => requestSort('orderId')} className="w-20 p-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-tighter cursor-pointer hover:text-blue-600 transition-colors">
                                ID {sortConfig.key === 'orderId' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="w-[28%] p-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-tighter">운송 경로</th>
                            <th className="w-[18%] p-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-tighter">물품 정보</th>
                            <th className="w-[15%] p-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-tighter">차량 정보</th>
                            <th onClick={() => requestSort('totalPrice')} className="w-32 p-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-tighter cursor-pointer hover:text-blue-600 transition-colors">
                                운임 {sortConfig.key === 'totalPrice' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="w-28 p-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-tighter">상태</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrders.map((order) => {
                            const displayPrice = order.totalPrice || (
                                (Number(order.basePrice) || 0) + (Number(order.laborFee) || 0)
                            );
                            return (
                                <tr key={order.orderId} className="hover:bg-gray-50/50 transition-all group cursor-default">
                                    <td className="p-4 text-center">
                                        <Link href={`/global/orders/${order.orderId}`} className="text-sm font-bold text-blue-600 hover:underline">
                                            {order.orderId}
                                        </Link>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 justify-center">
                                            <span className="font-semibold text-gray-800 text-sm">{order.startPlace}</span>
                                            <span className="text-gray-300 text-xs font-light">→</span>
                                            <span className="font-semibold text-gray-800 text-sm">{order.endPlace}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-gray-700 font-medium text-sm truncate">{order.cargoContent || "일반 화물"}</td>
                                    <td className="p-4 text-center text-gray-600 text-[13px] font-semibold">
                                        {order.reqCarType} <span className="text-gray-300 font-normal mx-1">|</span> {order.reqTonnage}
                                    </td>
                                    <td className="p-4 text-right pr-8">
                                        <span className="text-sm font-bold text-gray-900">{displayPrice.toLocaleString()}원</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${getStatusClass(order.status)}`}>
                                            {ORDER_DRIVING_STATUS_MAP[order.status] || order.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}