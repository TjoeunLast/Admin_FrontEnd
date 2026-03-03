"use client";

import { useMemo } from "react";
import { SettlementResponse } from '@/app/features/shared/api/settlement_api';

interface SettlementSummaryProps {
    data: SettlementResponse[];
    type: "shipper" | "driver"; // 화주용인지 차주용인지 구분
}

export default function SettlementSummaryCards({ data, type }: SettlementSummaryProps) {
    // 실시간 데이터 계산 로직
    const summary = useMemo(() => {
        const initial = { total: 0, unpaid: 0, paid: 0, profit: 0 };

        if(!data || data.length === 0) return initial;

        return data.reduce((acc, s) => {
            const price = s.totalPrice || 0;
            acc.total += price; // 총액 (청구액 또는 정산액)
            
            if(s.status === 'COMPLETED') {
                acc.paid += price;
            } else {
                acc.unpaid += price; // 대기 (미수금 또는 지급 대기)
            }

            // 중개 수익은 총 거래액의 10%
            acc.profit = acc.total * 0.1;

            return acc;
        }, initial);
    }, [data]);

    const formatAmount = (num: number) => new Intl.NumberFormat('ko-KR').format(Math.floor(num));

    // 타입에 따른 라벨 설정
    const labels = {
        total: type === "shipper" ? "이번 달 화주 총 청구액" : "이번 달 차주 총 정산액",
        unpaid: type === "shipper" ? "화주 미수금 (미입금)" : "차주 지급 대기액",
        paid: type === "shipper" ? "화주 입금 완료" : "차주 지급 완료액",
        profit: "예상 중개 수익 (10%)"
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* 1. 총액 카드 */}
            <div className="bg-[#3b82f6] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="text-sm opacity-90 font-medium">{labels.total}</div>
                <div className="text-2xl font-black mt-1">₩{formatAmount(summary.total)}</div>
            </div>

            {/* 2. 대기/미수금 카드 */}
            <div className="bg-white p-6 rounded-2xl border-l-4 border-l-[#ef4444] border border-[#e2e8f0] shadow-sm">
                <div className="text-sm text-[#64748b] font-medium">{labels.unpaid}</div>
                <div className="text-2xl font-black text-[#ef4444] mt-1">₩{formatAmount(summary.unpaid)}</div>
            </div>

            {/* 3. 완료 카드 */}
            <div className="bg-white p-6 rounded-2xl border-l-4 border-l-[#10b981] border border-[#e2e8f0] shadow-sm">
                <div className="text-sm text-[#64748b] font-medium">{labels.paid}</div>
                <div className="text-2xl font-black text-[#10b981] mt-1">₩{formatAmount(summary.paid)}</div>
            </div>

            {/* 4. 중개 수익 카드 */}
            <div className="bg-[#eff6ff] p-6 rounded-2xl border border-[#3b82f6] shadow-sm">
                <div className="text-sm text-[#3b82f6] font-bold">{labels.profit}</div>
                <div className="text-2xl font-black text-[#3b82f6] mt-1">₩{formatAmount(summary.profit)}</div>
            </div>
        </div>
    )
}