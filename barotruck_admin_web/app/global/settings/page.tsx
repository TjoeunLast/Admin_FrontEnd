"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  FeeBreakdownPreviewResponse,
  FeePolicyResponse,
  paymentAdminApi,
} from "@/app/features/shared/api/payment_admin_api";

const toPercent = (value?: number | null) => Number((((value ?? 0) as number) * 100).toFixed(2));
const toRate = (value: number) => Number((value / 100).toFixed(4));
const formatAmount = (value?: number | null) =>
  new Intl.NumberFormat("ko-KR").format(Number(value ?? 0));
const formatSignedAmount = (value?: number | null) => {
  const amount = Number(value ?? 0);
  const prefix = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${prefix}${formatAmount(Math.abs(amount))}`;
};
const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

type PolicyRateKey = "level0Rate" | "level1Rate" | "level2Rate" | "level3PlusRate";
type PolicySideForm = Record<PolicyRateKey, number>;

type PolicyForm = {
  shipperSide: PolicySideForm;
  driverSide: PolicySideForm;
  shipperFirstPaymentPromoRate: number;
  driverFirstTransportPromoRate: number;
  tossRate: number;
  minFee: number;
};

type PreviewForm = {
  baseAmount: number;
  shipperLevel: number;
  driverLevel: number;
  shipperPromoApplied: boolean;
  driverPromoApplied: boolean;
  includeTossFee: boolean;
};

type OpsForm = {
  operationMode: string;
  minimumAppVersion: string;
  forceUpdate: boolean;
  showNoticeBanner: boolean;
  noticeMessage: string;
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
  operationMode: "정상 운영",
  minimumAppVersion: "1.0.0",
  forceUpdate: false,
  showNoticeBanner: true,
  noticeMessage: "현재 서비스는 정상 운영 중입니다.",
};

const INITIAL_PREVIEW_FORM: PreviewForm = {
  baseAmount: 100000,
  shipperLevel: 0,
  driverLevel: 0,
  shipperPromoApplied: false,
  driverPromoApplied: false,
  includeTossFee: true,
};

const levelFields: Array<{ key: PolicyRateKey; label: string }> = [
  { key: "level0Rate", label: "레벨 0" },
  { key: "level1Rate", label: "레벨 1" },
  { key: "level2Rate", label: "레벨 2" },
  { key: "level3PlusRate", label: "레벨 3+" },
];

const labelClass =
  "mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400";
const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition-all focus:border-[#4E46E5]";

const resolveSide = (
  policy: FeePolicyResponse,
  side: "shipperSide" | "driverSide",
): PolicySideForm => {
  const sidePolicy = policy[side];
  const fallback = {
    level0Rate: policy.level0Rate ?? DEFAULT_POLICY.level0Rate ?? 0,
    level1Rate: policy.level1Rate ?? DEFAULT_POLICY.level1Rate ?? 0,
    level2Rate: policy.level2Rate ?? DEFAULT_POLICY.level2Rate ?? 0,
    level3PlusRate: policy.level3PlusRate ?? DEFAULT_POLICY.level3PlusRate ?? 0,
  };
  return {
    level0Rate: toPercent(sidePolicy?.level0Rate ?? fallback.level0Rate),
    level1Rate: toPercent(sidePolicy?.level1Rate ?? fallback.level1Rate),
    level2Rate: toPercent(sidePolicy?.level2Rate ?? fallback.level2Rate),
    level3PlusRate: toPercent(sidePolicy?.level3PlusRate ?? fallback.level3PlusRate),
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
  const [policyForm, setPolicyForm] = useState(createPolicyForm(DEFAULT_POLICY));
  const [previewForm, setPreviewForm] = useState(INITIAL_PREVIEW_FORM);
  const [previewResult, setPreviewResult] = useState<FeeBreakdownPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [opsForm, setOpsForm] = useState(INITIAL_OPS);
  const [policyUpdatedAt, setPolicyUpdatedAt] = useState<string | null>(null);
  const [isPolicyLoading, setIsPolicyLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        setIsPolicyLoading(true);
        const policy = await paymentAdminApi.getCurrentFeePolicy();
        setPolicyForm(createPolicyForm(policy));
        setPolicyUpdatedAt(policy.updatedAt);
      } catch (error) {
        console.error("수수료 정책 로드 실패:", error);
      } finally {
        setIsPolicyLoading(false);
      }
    };
    void loadPolicy();
  }, []);

  const cards = useMemo(
    () => [
      {
        title: "화주 수수료 범위",
        value: `${policyForm.shipperSide.level3PlusRate.toFixed(1)}% ~ ${policyForm.shipperSide.level0Rate.toFixed(1)}%`,
        meta: `첫 결제 프로모션 적용률 ${policyForm.shipperFirstPaymentPromoRate.toFixed(1)}%`,
      },
      {
        title: "차주 수수료 범위",
        value: `${policyForm.driverSide.level3PlusRate.toFixed(1)}% ~ ${policyForm.driverSide.level0Rate.toFixed(1)}%`,
        meta: `첫 운송 프로모션 적용률 ${policyForm.driverFirstTransportPromoRate.toFixed(1)}%`,
      },
      {
        title: "토스 차감률",
        value: `${policyForm.tossRate.toFixed(1)}%`,
        meta: "전체 거래금액에서 가장 먼저 차감",
      },
      {
        title: "최소 수수료",
        value: `${formatAmount(policyForm.minFee)}원`,
        meta: formatDateTime(policyUpdatedAt),
      },
    ],
    [policyForm, policyUpdatedAt],
  );

  const updateSideRate = (side: "shipperSide" | "driverSide", key: PolicyRateKey, value: number) => {
    setPolicyForm((prev) => ({
      ...prev,
      [side]: { ...prev[side], [key]: value },
    }));
  };

  const updatePolicyField = (
    key: "shipperFirstPaymentPromoRate" | "driverFirstTransportPromoRate" | "tossRate" | "minFee",
    value: number,
  ) => {
    setPolicyForm((prev) => ({ ...prev, [key]: value }));
  };

  const updatePreviewField = <K extends keyof PreviewForm>(key: K, value: PreviewForm[K]) => {
    setPreviewForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
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
        shipperFirstPaymentPromoRate: toRate(policyForm.shipperFirstPaymentPromoRate),
        driverFirstTransportPromoRate: toRate(policyForm.driverFirstTransportPromoRate),
        tossRate: toRate(policyForm.tossRate),
        minFee: policyForm.minFee,
        level0Rate: toRate(policyForm.shipperSide.level0Rate),
        level1Rate: toRate(policyForm.shipperSide.level1Rate),
        level2Rate: toRate(policyForm.shipperSide.level2Rate),
        level3PlusRate: toRate(policyForm.shipperSide.level3PlusRate),
        firstPaymentPromoRate: toRate(policyForm.shipperFirstPaymentPromoRate),
      });
      setPolicyForm(createPolicyForm(saved));
      setPolicyUpdatedAt(saved.updatedAt);
      alert("양면 수수료 정책이 저장되었습니다.");
    } catch (error) {
      console.error("수수료 정책 저장 실패:", error);
      alert("수수료 정책 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      setIsPreviewLoading(true);
      setPreviewError(null);
      const result = await paymentAdminApi.previewFeePolicy({
        baseAmount: previewForm.baseAmount,
        shipperLevel: previewForm.shipperLevel,
        driverLevel: previewForm.driverLevel,
        shipperPromoApplied: previewForm.shipperPromoApplied,
        driverPromoApplied: previewForm.driverPromoApplied,
        includeTossFee: previewForm.includeTossFee,
      });
      setPreviewResult(result);
    } catch (error: unknown) {
      console.error("수수료 시뮬레이션 실패:", error);
      const message =
        error instanceof Error ? error.message : "시뮬레이션 중 오류가 발생했습니다.";
      setPreviewError(message);
      setPreviewResult(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1680px] space-y-6 font-sans text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4 pl-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">시스템 설정</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            토스 차감 이후 금액을 기준으로 화주와 차주 수수료 정책을 관리하는 화면입니다.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">정책 반영 시각</div>
          <div className="mt-1 text-sm font-bold text-slate-700">{formatDateTime(policyUpdatedAt)}</div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">{card.title}</div>
            <div className="mt-3 text-2xl font-black text-slate-900">{card.value}</div>
            <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{card.meta}</div>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-6 py-5">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">양면 수수료 정책</h2>
            <p className="mt-1 text-sm text-slate-500">화주 수수료, 차주 수수료, 프로모션 기준을 각각 따로 설정합니다.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isPolicyLoading || isSaving}
            className="rounded-xl bg-[#4E46E5] px-4 py-2 text-xs font-black text-white transition-all hover:opacity-90 disabled:bg-slate-200"
          >
            {isSaving ? "저장 중..." : "변경 사항 저장"}
          </button>
        </div>

        <div className="space-y-6 p-6">
          {isPolicyLoading ? (
            <div className="py-12 text-center text-sm font-medium text-slate-400">정책 정보를 불러오고 있습니다.</div>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-2">
                <SidePolicyCard
                  title="화주 수수료"
                  side={policyForm.shipperSide}
                  promoLabel="첫 결제 프로모션"
                  promoValue={policyForm.shipperFirstPaymentPromoRate}
                  onChange={(key, value) => updateSideRate("shipperSide", key, value)}
                  onPromoChange={(value) => updatePolicyField("shipperFirstPaymentPromoRate", value)}
                />
                <SidePolicyCard
                  title="차주 수수료"
                  side={policyForm.driverSide}
                  promoLabel="첫 운송 프로모션"
                  promoValue={policyForm.driverFirstTransportPromoRate}
                  onChange={(key, value) => updateSideRate("driverSide", key, value)}
                  onPromoChange={(value) => updatePolicyField("driverFirstTransportPromoRate", value)}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <MetricEditor
                  label="토스 차감률"
                  suffix="%"
                  value={policyForm.tossRate}
                  step="0.1"
                  description="전체 거래금액에서 먼저 차감되며, 이후 남은 금액을 기준으로 수수료를 계산합니다."
                  onChange={(value) => updatePolicyField("tossRate", value)}
                />
                <MetricEditor
                  label="최소 수수료"
                  suffix="원"
                  value={policyForm.minFee}
                  step="100"
                  description="계산된 수수료가 0원보다 크면, 이 금액을 하한선으로 적용합니다."
                  onChange={(value) => updatePolicyField("minFee", value)}
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">수수료 시뮬레이터</h2>
          <p className="mt-1 text-sm text-slate-500">
            금액, 레벨, 프로모션 조건을 넣으면 현재 정책 기준 손익을 바로 확인할 수 있습니다.
          </p>
        </div>
        <div className="space-y-6 p-6">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-5 md:grid-cols-2">
              <PreviewNumberCard
                label="기준 거래금액"
                suffix="원"
                value={previewForm.baseAmount}
                step="1000"
                description="토스 차감 전 전체 거래금액입니다."
                onChange={(value) => updatePreviewField("baseAmount", value)}
              />
              <PreviewNumberCard
                label="화주 레벨"
                suffix="Lv"
                value={previewForm.shipperLevel}
                step="1"
                min={0}
                max={3}
                description="레벨 3 이상은 모두 레벨 3+로 계산합니다."
                onChange={(value) => updatePreviewField("shipperLevel", value)}
              />
              <PreviewNumberCard
                label="차주 레벨"
                suffix="Lv"
                value={previewForm.driverLevel}
                step="1"
                min={0}
                max={3}
                description="차주 side 수수료율과 프로모션 적용 여부를 확인합니다."
                onChange={(value) => updatePreviewField("driverLevel", value)}
              />
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">시뮬레이션 옵션</h3>
                <div className="mt-4 space-y-3">
                  <TogglePanel
                    label="화주 첫 결제 프로모션 적용"
                    description="화주 side 프로모션 수수료율을 적용합니다."
                    checked={previewForm.shipperPromoApplied}
                    onChange={(checked) => updatePreviewField("shipperPromoApplied", checked)}
                  />
                  <TogglePanel
                    label="차주 첫 운송 프로모션 적용"
                    description="차주 side 프로모션 수수료율을 적용합니다."
                    checked={previewForm.driverPromoApplied}
                    onChange={(checked) => updatePreviewField("driverPromoApplied", checked)}
                  />
                  <TogglePanel
                    label="토스 차감 포함"
                    description="전체 거래금액에서 토스 차감률을 먼저 반영합니다."
                    checked={previewForm.includeTossFee}
                    onChange={(checked) => updatePreviewField("includeTossFee", checked)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-[#07112b] p-6 text-white shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-300">플랫폼 순수익</div>
                  <div className="mt-4 text-3xl font-black">
                    {previewResult ? `${formatSignedAmount(previewResult.platformNetRevenue)}원` : "-"}
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    토스 차감 후 남은 금액에서 화주와 차주 수수료를 반영한 최종 플랫폼 수익입니다.
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black ${
                    previewResult
                      ? previewResult.negativeMargin
                        ? "bg-rose-500/20 text-rose-100"
                        : "bg-emerald-500/20 text-emerald-100"
                      : "bg-slate-500/20 text-slate-100"
                  }`}
                >
                  {previewResult
                    ? previewResult.negativeMargin
                      ? "적자 예상"
                      : "수익 확보"
                    : "미실행"}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <PreviewResultCard
                  label="화주 청구 금액"
                  value={previewResult ? `${formatAmount(previewResult.shipperChargeAmount)}원` : "-"}
                  description="화주에게 청구되는 최종 금액"
                />
                <PreviewResultCard
                  label="차주 지급 예정액"
                  value={previewResult?.driverPayoutAmount != null ? `${formatAmount(previewResult.driverPayoutAmount)}원` : "-"}
                  description="차주에게 지급될 예정 금액"
                />
                <PreviewResultCard
                  label="플랫폼 총수익"
                  value={previewResult ? `${formatAmount(previewResult.platformGrossRevenue)}원` : "-"}
                  description="화주/차주 수수료 합계"
                />
                <PreviewResultCard
                  label="토스 차감액"
                  value={previewResult ? `${formatAmount(previewResult.tossFeeAmount)}원` : "-"}
                  description="전체 거래금액에서 먼저 빠지는 금액"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handlePreview}
            disabled={isPreviewLoading}
            className="w-full rounded-2xl bg-[#07112b] px-6 py-4 text-sm font-black text-white transition-all hover:opacity-95 disabled:opacity-60"
          >
            {isPreviewLoading ? "시뮬레이션 계산 중..." : "시뮬레이션 실행"}
          </button>

          {previewError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-600">
              {previewError}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-3">
            <PreviewDetailCard
              title="기준 금액"
              rows={[
                { label: "거래금액", value: `${formatAmount(previewResult?.baseAmount)}원` },
                {
                  label: "토스 차감 후 기준금액",
                  value:
                    previewResult?.postTossBaseAmount != null
                      ? `${formatAmount(previewResult.postTossBaseAmount)}원`
                      : "-",
                },
                { label: "정책 반영 시각", value: formatDateTime(previewResult?.policyUpdatedAt) },
              ]}
            />
            <PreviewDetailCard
              title="화주 Side"
              rows={[
                {
                  label: "적용 레벨",
                  value: previewResult ? `레벨 ${previewResult.shipperAppliedLevel}` : "-",
                },
                {
                  label: "적용 수수료율",
                  value: previewResult ? `${(previewResult.shipperFeeRate * 100).toFixed(2)}%` : "-",
                },
                {
                  label: "수수료 금액",
                  value: previewResult ? `${formatAmount(previewResult.shipperFeeAmount)}원` : "-",
                },
                {
                  label: "프로모션 적용",
                  value: previewResult ? (previewResult.shipperPromoApplied ? "적용" : "미적용") : "-",
                },
              ]}
            />
            <PreviewDetailCard
              title="차주 Side"
              rows={[
                {
                  label: "적용 레벨",
                  value:
                    previewResult?.driverAppliedLevel != null
                      ? `레벨 ${previewResult.driverAppliedLevel}`
                      : "-",
                },
                {
                  label: "적용 수수료율",
                  value:
                    previewResult?.driverFeeRate != null
                      ? `${(previewResult.driverFeeRate * 100).toFixed(2)}%`
                      : "-",
                },
                {
                  label: "수수료 금액",
                  value:
                    previewResult?.driverFeeAmount != null
                      ? `${formatAmount(previewResult.driverFeeAmount)}원`
                      : "-",
                },
                {
                  label: "프로모션 적용",
                  value:
                    previewResult?.driverPromoApplied != null
                      ? previewResult.driverPromoApplied
                        ? "적용"
                        : "미적용"
                      : "-",
                },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">기본 운영 설정</h2>
          <p className="mt-1 text-sm text-slate-500">수수료 정책 외에 서비스 운영 상태와 노출 문구도 함께 관리합니다.</p>
        </div>
        <div className="grid gap-5 p-6 md:grid-cols-2">
          <FormField label="서비스 상태">
            <select name="operationMode" value={opsForm.operationMode} onChange={(e) => setOpsForm((prev) => ({ ...prev, operationMode: e.target.value }))} className={fieldClass}>
              {["정상 운영", "점검 예정", "긴급 점검"].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormField>
          <FormField label="최소 지원 앱 버전">
            <input type="text" value={opsForm.minimumAppVersion} onChange={(e) => setOpsForm((prev) => ({ ...prev, minimumAppVersion: e.target.value }))} className={fieldClass} />
          </FormField>
          <FormField label="운영 배너 문구">
            <textarea rows={3} value={opsForm.noticeMessage} onChange={(e) => setOpsForm((prev) => ({ ...prev, noticeMessage: e.target.value }))} className={`${fieldClass} resize-none`} />
          </FormField>
          <div className="space-y-3">
            <TogglePanel label="강제 업데이트 적용" description="최소 지원 버전보다 낮은 사용자는 업데이트를 진행해야 합니다." checked={opsForm.forceUpdate} onChange={(checked) => setOpsForm((prev) => ({ ...prev, forceUpdate: checked }))} />
            <TogglePanel label="운영 배너 노출" description="홈 화면 상단에 운영 공지 배너를 표시합니다." checked={opsForm.showNoticeBanner} onChange={(checked) => setOpsForm((prev) => ({ ...prev, showNoticeBanner: checked }))} />
          </div>
        </div>
      </section>
    </main>
  );
}

function PreviewNumberCard({
  label,
  suffix,
  value,
  step,
  description,
  onChange,
  min,
  max,
}: {
  label: string;
  suffix: string;
  value: number;
  step: string;
  description: string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
      <p className={labelClass}>{label}</p>
      <div className="flex items-baseline gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent text-3xl font-black text-slate-900 outline-none"
        />
        <span className="text-xs font-bold text-slate-400">{suffix}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function PreviewResultCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-[11px] font-black uppercase tracking-wider text-slate-300">{label}</div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
      <div className="mt-2 text-xs text-slate-300">{description}</div>
    </div>
  );
}

function PreviewDetailCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
      <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="text-sm font-semibold text-slate-500">{row.label}</span>
            <span className="text-sm font-black text-slate-900">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SidePolicyCard({
  title,
  side,
  promoLabel,
  promoValue,
  onChange,
  onPromoChange,
}: {
  title: string;
  side: PolicySideForm;
  promoLabel: string;
  promoValue: number;
  onChange: (key: PolicyRateKey, value: number) => void;
  onPromoChange: (value: number) => void;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
      <h3 className="text-base font-black text-slate-900">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {levelFields.map((field) => (
          <div key={field.key} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className={labelClass}>{field.label}</p>
            <div className="flex items-baseline gap-2">
              <input type="number" min={0} step="0.1" value={side[field.key]} onChange={(e) => onChange(field.key, Number(e.target.value))} className="w-full bg-transparent text-xl font-black text-slate-900 outline-none" />
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className={labelClass}>{promoLabel}</p>
        <div className="flex items-baseline gap-2">
          <input type="number" min={0} step="0.1" value={promoValue} onChange={(e) => onPromoChange(Number(e.target.value))} className="w-full bg-transparent text-xl font-black text-slate-900 outline-none" />
          <span className="text-xs font-bold text-slate-400">%</span>
        </div>
      </div>
    </div>
  );
}

function MetricEditor({
  label,
  suffix,
  value,
  step,
  description,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  step: string;
  description: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
      <p className={labelClass}>{label}</p>
      <div className="flex items-baseline gap-2">
        <input type="number" min={0} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-transparent text-2xl font-black text-slate-900 outline-none" />
        <span className="text-xs font-bold text-slate-400">{suffix}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      {children}
    </div>
  );
}

function TogglePanel({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="pr-4">
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{description}</p>
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[#4E46E5]" />
    </div>
  );
}
