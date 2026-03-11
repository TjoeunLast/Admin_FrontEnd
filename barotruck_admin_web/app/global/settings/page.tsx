"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  FeePolicyResponse,
  paymentAdminApi,
} from "@/app/features/shared/api/payment_admin_api";

const toPercent = (value?: number | null) =>
  Number((((value ?? 0) as number) * 100).toFixed(2));
const toRate = (value: number) => Number((value / 100).toFixed(4));
const formatAmount = (value?: number | null) =>
  new Intl.NumberFormat("ko-KR").format(Number(value ?? 0));

type PolicyRateKey =
  | "level0Rate"
  | "level1Rate"
  | "level2Rate"
  | "level3PlusRate";

type PolicySideForm = Record<PolicyRateKey, number>;

type PolicyForm = {
  shipperSide: PolicySideForm;
  driverSide: PolicySideForm;
  shipperFirstPaymentPromoRate: number;
  driverFirstTransportPromoRate: number;
  tossRate: number;
  minFee: number;
};

type OpsForm = {
  serviceStatus: string;
  signupApprovalMode: string;
  minimumAppVersion: string;
  forceUpdate: boolean;
  allowReservationOrders: boolean;
  allowUrgentDispatch: boolean;
  staleOrderWindow: string;
  dispatchPriority: string;
  browserPushEnabled: boolean;
  keepNightAlert: boolean;
  inquiryPriority: string;
  supportMemo: string;
};

const DEFAULT_POLICY: FeePolicyResponse = {
  level0Rate: 0.025,
  level1Rate: 0.02,
  level2Rate: 0.018,
  level3PlusRate: 0.015,
  firstPaymentPromoRate: 0.015,
  shipperSide: {
    level0Rate: 0.025,
    level1Rate: 0.02,
    level2Rate: 0.018,
    level3PlusRate: 0.015,
  },
  driverSide: {
    level0Rate: 0.025,
    level1Rate: 0.02,
    level2Rate: 0.018,
    level3PlusRate: 0.015,
  },
  shipperFirstPaymentPromoRate: 0.015,
  driverFirstTransportPromoRate: 0.015,
  tossRate: 0.1,
  minFee: 2000,
  updatedAt: null,
};

const INITIAL_OPS: OpsForm = {
  serviceStatus: "정상 운영",
  signupApprovalMode: "관리자 승인 후 활성화",
  minimumAppVersion: "1.0.0",
  forceUpdate: false,
  allowReservationOrders: true,
  allowUrgentDispatch: true,
  staleOrderWindow: "24시간",
  dispatchPriority: "직접 배차 우선",
  browserPushEnabled: true,
  keepNightAlert: true,
  inquiryPriority: "결제/정산 문의 우선",
  supportMemo: "야간 장애 이슈는 우선 대응 대상으로 분류합니다.",
};

const rateFields: Array<{ key: PolicyRateKey; label: string }> = [
  { key: "level0Rate", label: "레벨 0" },
  { key: "level1Rate", label: "레벨 1" },
  { key: "level2Rate", label: "레벨 2" },
  { key: "level3PlusRate", label: "레벨 3+" },
];

const labelClass =
  "mb-3 block text-[11px] font-black uppercase tracking-wider text-slate-400";
const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all focus:border-[#5B4FE9]";

const resolveSide = (
  policy: FeePolicyResponse,
  side: "shipperSide" | "driverSide",
): PolicySideForm => {
  const sidePolicy = policy[side];
  const fallback = {
    level0Rate: policy.level0Rate ?? DEFAULT_POLICY.level0Rate ?? 0,
    level1Rate: policy.level1Rate ?? DEFAULT_POLICY.level1Rate ?? 0,
    level2Rate: policy.level2Rate ?? DEFAULT_POLICY.level2Rate ?? 0,
    level3PlusRate:
      policy.level3PlusRate ?? DEFAULT_POLICY.level3PlusRate ?? 0,
  };

  return {
    level0Rate: toPercent(sidePolicy?.level0Rate ?? fallback.level0Rate),
    level1Rate: toPercent(sidePolicy?.level1Rate ?? fallback.level1Rate),
    level2Rate: toPercent(sidePolicy?.level2Rate ?? fallback.level2Rate),
    level3PlusRate: toPercent(
      sidePolicy?.level3PlusRate ?? fallback.level3PlusRate,
    ),
  };
};

const createPolicyForm = (policy: FeePolicyResponse): PolicyForm => ({
  shipperSide: resolveSide(policy, "shipperSide"),
  driverSide: resolveSide(policy, "driverSide"),
  shipperFirstPaymentPromoRate: toPercent(
    policy.shipperFirstPaymentPromoRate ??
      policy.firstPaymentPromoRate ??
      DEFAULT_POLICY.shipperFirstPaymentPromoRate ??
      0,
  ),
  driverFirstTransportPromoRate: toPercent(
    policy.driverFirstTransportPromoRate ??
      DEFAULT_POLICY.driverFirstTransportPromoRate ??
      0,
  ),
  tossRate: toPercent(policy.tossRate ?? DEFAULT_POLICY.tossRate ?? 0),
  minFee: Number(policy.minFee ?? DEFAULT_POLICY.minFee ?? 0),
});

export default function SystemSettingPage() {
  const [policyForm, setPolicyForm] = useState<PolicyForm>(
    createPolicyForm(DEFAULT_POLICY),
  );
  const [opsForm, setOpsForm] = useState<OpsForm>(INITIAL_OPS);
  const [isPolicyLoading, setIsPolicyLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        setIsPolicyLoading(true);
        const policy = await paymentAdminApi.getCurrentFeePolicy();
        setPolicyForm(createPolicyForm(policy));
      } catch (error) {
        console.error("수수료 정책 로드 실패:", error);
      } finally {
        setIsPolicyLoading(false);
      }
    };

    void loadPolicy();
  }, []);

  const updateFeeRate = (
    side: "shipperSide" | "driverSide",
    key: PolicyRateKey,
    value: number,
  ) => {
    setPolicyForm((prev) => ({
      ...prev,
      [side]: {
        ...prev[side],
        [key]: value,
      },
    }));
  };

  const updatePolicyField = (
    key:
      | "shipperFirstPaymentPromoRate"
      | "driverFirstTransportPromoRate"
      | "tossRate"
      | "minFee",
    value: number,
  ) => {
    setPolicyForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSavePolicy = async () => {
    try {
      setIsSaving(true);
      const saved = await paymentAdminApi.updateFeePolicy({
        shipperSide: {
          level0Rate: toRate(policyForm.shipperSide.level0Rate),
          level1Rate: toRate(policyForm.shipperSide.level1Rate),
          level2Rate: toRate(policyForm.shipperSide.level2Rate),
          level3PlusRate: toRate(policyForm.shipperSide.level3PlusRate),
        },
        driverSide: {
          level0Rate: toRate(policyForm.driverSide.level0Rate),
          level1Rate: toRate(policyForm.driverSide.level1Rate),
          level2Rate: toRate(policyForm.driverSide.level2Rate),
          level3PlusRate: toRate(policyForm.driverSide.level3PlusRate),
        },
        shipperFirstPaymentPromoRate: toRate(
          policyForm.shipperFirstPaymentPromoRate,
        ),
        driverFirstTransportPromoRate: toRate(
          policyForm.driverFirstTransportPromoRate,
        ),
        tossRate: toRate(policyForm.tossRate),
        minFee: policyForm.minFee,
        level0Rate: toRate(policyForm.shipperSide.level0Rate),
        level1Rate: toRate(policyForm.shipperSide.level1Rate),
        level2Rate: toRate(policyForm.shipperSide.level2Rate),
        level3PlusRate: toRate(policyForm.shipperSide.level3PlusRate),
        firstPaymentPromoRate: toRate(policyForm.shipperFirstPaymentPromoRate),
      });
      setPolicyForm(createPolicyForm(saved));
      alert("수수료 정책이 저장되었습니다.");
    } catch (error) {
      console.error("수수료 정책 저장 실패:", error);
      alert("수수료 정책 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateOpsField = <K extends keyof OpsForm>(key: K, value: OpsForm[K]) => {
    setOpsForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <main className="mx-auto max-w-[1680px] space-y-6 font-sans text-slate-900">
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="수수료 정책 관리"
          action={
            <button
              onClick={handleSavePolicy}
              disabled={isPolicyLoading || isSaving}
              className="rounded-xl bg-[#5B4FE9] px-5 py-2.5 text-xs font-black text-white transition-all hover:opacity-90 disabled:bg-slate-200"
            >
              {isSaving ? "저장 중..." : "정책 저장"}
            </button>
          }
        >
          {isPolicyLoading ? (
            <div className="py-16 text-center text-sm font-medium text-slate-400">
              수수료 정책을 불러오고 있습니다.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <FeeSideSection
                  title="화주 수수료"
                  side={policyForm.shipperSide}
                  promoLabel="첫 결제 프로모션"
                  promoValue={policyForm.shipperFirstPaymentPromoRate}
                  onRateChange={(key, value) =>
                    updateFeeRate("shipperSide", key, value)
                  }
                  onPromoChange={(value) =>
                    updatePolicyField("shipperFirstPaymentPromoRate", value)
                  }
                />
                <FeeSideSection
                  title="차주 수수료"
                  side={policyForm.driverSide}
                  promoLabel="첫 운송 프로모션"
                  promoValue={policyForm.driverFirstTransportPromoRate}
                  onRateChange={(key, value) =>
                    updateFeeRate("driverSide", key, value)
                  }
                  onPromoChange={(value) =>
                    updatePolicyField("driverFirstTransportPromoRate", value)
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PolicyMetricCard
                  label="토스 차감률"
                  value={policyForm.tossRate}
                  suffix="%"
                  step="0.1"
                  onChange={(value) => updatePolicyField("tossRate", value)}
                />
                <PolicyMetricCard
                  label="최소 수수료"
                  value={policyForm.minFee}
                  suffix="원"
                  step="100"
                  onChange={(value) => updatePolicyField("minFee", value)}
                />
              </div>
            </div>
          )}
        </Panel>

        <Panel title="기본 운영 설정">
          <div className="space-y-5">
            <FormField label="서비스 상태">
              <select
                value={opsForm.serviceStatus}
                onChange={(e) =>
                  updateOpsField("serviceStatus", e.target.value)
                }
                className={fieldClass}
              >
                {["정상 운영", "점검 예정", "긴급 점검"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="회원가입 승인 방식">
              <select
                value={opsForm.signupApprovalMode}
                onChange={(e) =>
                  updateOpsField("signupApprovalMode", e.target.value)
                }
                className={fieldClass}
              >
                {[
                  "관리자 승인 후 활성화",
                  "즉시 활성화",
                  "서류 검토 후 활성화",
                ].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="최소 지원 앱 버전">
              <input
                type="text"
                value={opsForm.minimumAppVersion}
                onChange={(e) =>
                  updateOpsField("minimumAppVersion", e.target.value)
                }
                className={fieldClass}
              />
            </FormField>

            <SettingToggleCard
              title="강제 업데이트 적용"
              description="버전 미달 사용자는 업데이트를 요구합니다."
              checked={opsForm.forceUpdate}
              onChange={(checked) => updateOpsField("forceUpdate", checked)}
            />
          </div>
        </Panel>

        <Panel title="주문 및 배차 기준">
          <div className="space-y-5">
            <SettingToggleCard
              title="예약 주문 허용"
              description="예약 접수 여부를 설정합니다."
              checked={opsForm.allowReservationOrders}
              onChange={(checked) =>
                updateOpsField("allowReservationOrders", checked)
              }
            />

            <SettingToggleCard
              title="긴급 배차 허용"
              description="긴급 주문 카테고리 운영 여부입니다."
              checked={opsForm.allowUrgentDispatch}
              onChange={(checked) =>
                updateOpsField("allowUrgentDispatch", checked)
              }
            />

            <FormField label="미배정 주문 정리">
              <select
                value={opsForm.staleOrderWindow}
                onChange={(e) =>
                  updateOpsField("staleOrderWindow", e.target.value)
                }
                className={fieldClass}
              >
                {["6시간", "12시간", "24시간", "48시간"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="배차 우선 순위">
              <select
                value={opsForm.dispatchPriority}
                onChange={(e) =>
                  updateOpsField("dispatchPriority", e.target.value)
                }
                className={fieldClass}
              >
                {[
                  "직접 배차 우선",
                  "자동 배차 우선",
                  "상황별 혼합 운영",
                ].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </Panel>

        <Panel title="알림 및 고객지원">
          <div className="space-y-5">
            <SettingToggleCard
              title="브라우저 푸시 알림"
              description="실시간 운영 알림을 화면에 표시합니다."
              checked={opsForm.browserPushEnabled}
              onChange={(checked) =>
                updateOpsField("browserPushEnabled", checked)
              }
            />

            <SettingToggleCard
              title="야간 장애 알림 유지"
              description="심야 시간 긴급 알림을 허용합니다."
              checked={opsForm.keepNightAlert}
              onChange={(checked) => updateOpsField("keepNightAlert", checked)}
            />

            <FormField label="문의 응답 우선순위">
              <select
                value={opsForm.inquiryPriority}
                onChange={(e) =>
                  updateOpsField("inquiryPriority", e.target.value)
                }
                className={fieldClass}
              >
                {[
                  "결제/정산 문의 우선",
                  "배차 문의 우선",
                  "회원 문의 우선",
                ].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="고객지원 운영 메모">
              <textarea
                rows={4}
                value={opsForm.supportMemo}
                onChange={(e) => updateOpsField("supportMemo", e.target.value)}
                className={`${fieldClass} resize-none`}
              />
            </FormField>
          </div>
        </Panel>
      </div>
    </main>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-8 py-5">
        <h2 className="text-lg font-black tracking-tight text-slate-900">
          {title}
        </h2>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function PolicyMetricCard({
  label,
  value,
  suffix,
  step,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  step: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
      <p className={labelClass}>{label}</p>
      <div className="flex items-end justify-between gap-3">
        <input
          type="number"
          min={0}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent text-4xl font-black text-slate-900 outline-none"
        />
        <span className="pb-1 text-sm font-black text-slate-400">{suffix}</span>
      </div>
    </div>
  );
}

function FeeSideSection({
  title,
  side,
  promoLabel,
  promoValue,
  onRateChange,
  onPromoChange,
}: {
  title: string;
  side: PolicySideForm;
  promoLabel: string;
  promoValue: number;
  onRateChange: (key: PolicyRateKey, value: number) => void;
  onPromoChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-4 text-base font-black text-slate-900">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {rateFields.map((field) => (
          <PolicyMetricCard
            key={`${title}-${field.key}`}
            label={field.label}
            value={side[field.key]}
            suffix="%"
            step="0.1"
            onChange={(value) => onRateChange(field.key, value)}
          />
        ))}
        <PolicyMetricCard
          label={promoLabel}
          value={promoValue}
          suffix="%"
          step="0.1"
          onChange={onPromoChange}
        />
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      {children}
    </div>
  );
}

function SettingToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
      <div>
        <p className="text-lg font-black text-slate-900">{title}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 accent-[#5B4FE9]"
      />
    </div>
  );
}
