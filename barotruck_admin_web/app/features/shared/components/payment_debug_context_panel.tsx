"use client";

import { PaymentApiTestContextResponse } from "@/app/features/shared/api/payment_admin_api";

interface PaymentDebugContextPanelProps {
  context: PaymentApiTestContextResponse | null;
  isLoading: boolean;
}

const contextEntries = (context: PaymentApiTestContextResponse | null) => [
  ["orderId", context?.orderId ?? "-"],
  ["disputeId", context?.disputeId ?? "-"],
  ["invoiceId", context?.invoiceId ?? "-"],
  ["shipperId", context?.shipperId ?? "-"],
  ["itemId", context?.itemId ?? "-"],
  ["driverUserId", context?.driverUserId ?? "-"],
  ["pgOrderId", context?.pgOrderId ?? "-"],
  ["paymentKey", context?.paymentKey ?? "-"],
  ["amount", context?.amount ?? "-"],
];

export function PaymentDebugContextPanel({
  context,
  isLoading,
}: PaymentDebugContextPanelProps) {
  return (
    <details className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer text-sm font-bold text-slate-700">
        QA Debug Context
      </summary>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {contextEntries(context).map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {label}
            </div>
            <div className="mt-2 break-all font-mono text-sm text-slate-700">
              {isLoading ? "불러오는 중..." : String(value)}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
