"use client";

import { useState } from "react";
import {
  PaymentDisputeStatus,
  PaymentDisputeStatusResponse,
  TransportPaymentStatus,
} from "@/app/features/shared/api/payment_admin_api";
import { PAYMENT_STATUS_LABELS } from "@/app/features/shared/lib/admin_settlement_overview";

interface PaymentDisputeResolutionPanelProps {
  dispute: PaymentDisputeStatusResponse | null;
  paymentStatus: TransportPaymentStatus;
  statusLoadError?: string | null;
  isSubmitting: boolean;
  onOpenCreate: () => void;
  onApplyStatus: (status: PaymentDisputeStatus, adminMemo: string | null) => Promise<void>;
}

const DISPUTE_STATUS_LABELS: Record<PaymentDisputeStatus, string> = {
  PENDING: "접수됨",
  ADMIN_HOLD: "관리자 보류",
  ADMIN_FORCE_CONFIRMED: "강제 확정",
  ADMIN_REJECTED: "관리자 반려",
};

const ACTIONS: { status: PaymentDisputeStatus; label: string }[] = [
  { status: "ADMIN_HOLD", label: "보류" },
  { status: "ADMIN_FORCE_CONFIRMED", label: "강제 확정" },
  { status: "ADMIN_REJECTED", label: "반려" },
];

export function PaymentDisputeResolutionPanel({
  dispute,
  paymentStatus,
  statusLoadError,
  isSubmitting,
  onOpenCreate,
  onApplyStatus,
}: PaymentDisputeResolutionPanelProps) {
  const [adminMemo, setAdminMemo] = useState("");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">분쟁 처리</h2>
          <p className="mt-1 text-sm text-slate-500">
            분쟁 생성과 관리자 처리 상태 전환을 이 영역에서 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            결제 상태 {PAYMENT_STATUS_LABELS[paymentStatus]}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            {dispute ? DISPUTE_STATUS_LABELS[dispute.status] : "분쟁 없음"}
          </span>
        </div>
      </div>

      {statusLoadError ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div className="text-sm font-bold text-rose-700">분쟁 상태 조회 실패</div>
          <div className="mt-1 text-sm text-rose-600">
            현재 분쟁이 없는지 확인할 수 없어서 분쟁 생성/처리를 잠금했습니다.
          </div>
          <div className="mt-2 text-xs text-rose-500 break-all">{statusLoadError}</div>
        </div>
      ) : !dispute ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
          <div className="text-sm font-bold text-slate-700">등록된 분쟁이 없습니다.</div>
          <div className="mt-1 text-sm text-slate-500">
            분쟁 등록이 필요한 건이면 생성 모달에서 사유와 설명을 입력하세요.
          </div>
          <button
            onClick={onOpenCreate}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
          >
            분쟁 생성
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                분쟁 ID
              </div>
              <div className="mt-2 text-sm font-black text-slate-900">
                #{dispute.disputeId}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                요청 시각
              </div>
              <div className="mt-2 text-sm font-bold text-slate-900">
                {dispute.requestedAt ? new Date(dispute.requestedAt).toLocaleString() : "-"}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                처리 시각
              </div>
              <div className="mt-2 text-sm font-bold text-slate-900">
                {dispute.processedAt ? new Date(dispute.processedAt).toLocaleString() : "-"}
              </div>
            </div>
          </div>

          <label className="block">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              관리자 메모
            </div>
            <textarea
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-900"
              placeholder="분쟁 처리 메모를 입력하세요."
            />
          </label>

          <div className="flex flex-wrap gap-3">
            {ACTIONS.map((action) => (
              <button
                key={action.status}
                onClick={() => void onApplyStatus(action.status, adminMemo.trim() || null)}
                disabled={isSubmitting}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  isSubmitting
                    ? "bg-slate-200 text-slate-500"
                    : "border border-slate-900 bg-white text-slate-900 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
