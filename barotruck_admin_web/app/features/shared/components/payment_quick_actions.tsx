"use client";

import {
  SettlementResponse,
} from "@/app/features/shared/api/payment_admin_api";
import {
  getEffectivePaymentStatus,
  PAYMENT_STATUS_LABELS,
} from "@/app/features/shared/lib/admin_settlement_overview";

interface PaymentQuickActionsProps {
  settlement: SettlementResponse;
  isBusy: boolean;
  onMarkPaid: () => void;
}

export function PaymentQuickActions({
  settlement,
  isBusy,
  onMarkPaid,
}: PaymentQuickActionsProps) {
  const paymentStatus = getEffectivePaymentStatus(settlement);
  const canMarkPaid = paymentStatus === "READY";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">빠른 액션</h2>
          <p className="mt-1 text-sm text-slate-500">
            가장 자주 쓰는 결제 전환 액션만 분리했습니다.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          현재 상태 {PAYMENT_STATUS_LABELS[paymentStatus]}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={onMarkPaid}
          disabled={!canMarkPaid || isBusy}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            !canMarkPaid || isBusy
              ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
              : "border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {isBusy ? "처리중..." : "입금 반영"}
        </button>
        <div className="text-xs text-slate-400">
          READY 상태에서만 빠르게 `PAID`로 전환합니다.
        </div>
      </div>
    </section>
  );
}
