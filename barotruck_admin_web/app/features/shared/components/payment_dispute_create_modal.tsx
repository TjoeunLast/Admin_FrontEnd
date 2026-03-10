"use client";

import { useState } from "react";
import {
  CreatePaymentDisputeRequest,
  PaymentDisputeReason,
} from "@/app/features/shared/api/payment_admin_api";

interface PaymentDisputeCreateModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePaymentDisputeRequest) => Promise<void>;
}

const REASON_OPTIONS: { value: PaymentDisputeReason; label: string }[] = [
  { value: "PRICE_MISMATCH", label: "금액 불일치" },
  { value: "RECEIVED_AMOUNT_MISMATCH", label: "수령액 불일치" },
  { value: "PROOF_MISSING", label: "증빙 누락" },
  { value: "FRAUD_SUSPECTED", label: "사기 의심" },
  { value: "OTHER", label: "기타" },
];

export function PaymentDisputeCreateModal({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: PaymentDisputeCreateModalProps) {
  const [reasonCode, setReasonCode] = useState<PaymentDisputeReason>("OTHER");
  const [description, setDescription] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert("분쟁 설명을 입력하세요.");
      return;
    }

    await onSubmit({
      reasonCode,
      description: description.trim(),
      attachmentUrl: attachmentUrl.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">분쟁 생성</h2>
            <p className="mt-1 text-sm text-slate-500">
              주문 단위 분쟁을 생성하고 이후 관리자 처리 패널에서 상태를 전환합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
          >
            닫기
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              사유 코드
            </div>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as PaymentDisputeReason)}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-900"
            >
              {REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              상세 설명
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-900"
              placeholder="분쟁 배경과 요청 내용을 입력하세요."
            />
          </label>

          <label className="block">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              첨부 URL
            </div>
            <input
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-900"
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500"
          >
            취소
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              isSubmitting
                ? "bg-slate-200 text-slate-500"
                : "bg-slate-900 text-white hover:bg-slate-700"
            }`}
          >
            {isSubmitting ? "생성 중..." : "분쟁 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}
