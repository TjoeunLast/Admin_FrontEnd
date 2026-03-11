"use client";

import { useState } from "react";

interface TossPaymentCancelModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  billingAmount: number;
  onClose: () => void;
  onSubmit: (cancelReason: string) => Promise<void>;
}

const formatAmount = (value: number) =>
  new Intl.NumberFormat("ko-KR").format(value);

export function TossPaymentCancelModal({
  isOpen,
  isSubmitting,
  billingAmount,
  onClose,
  onSubmit,
}: TossPaymentCancelModalProps) {
  const [cancelReason, setCancelReason] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    if (!cancelReason.trim()) {
      alert("취소 사유를 입력하세요.");
      return;
    }

    await onSubmit(cancelReason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Toss 실취소 / 환불</h2>
            <p className="mt-1 text-sm text-slate-500">
              현재 관리자 웹은 전액 취소만 지원합니다. 내부 상태보다 PG 호출이 먼저 실패할 수 있습니다.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
          >
            닫기
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              예상 취소 금액
            </div>
            <div className="mt-2 text-xl font-black text-slate-900">
              ₩{formatAmount(billingAmount)}
            </div>
          </div>

          <label className="block">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              취소 사유
            </div>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-900"
              placeholder="운영 메모와 PG 환불 사유를 함께 남기세요."
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500"
          >
            닫기
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              isSubmitting
                ? "bg-slate-200 text-slate-500"
                : "bg-rose-600 text-white hover:bg-rose-700"
            }`}
          >
            {isSubmitting ? "요청중..." : "실취소 요청"}
          </button>
        </div>
      </div>
    </div>
  );
}
