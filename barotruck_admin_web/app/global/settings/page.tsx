"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CreditCard,
  Megaphone,
  Settings2,
  Truck,
  Users,
} from "lucide-react";
import {
  paymentAdminApi,
  FeePolicyResponse,
} from "@/app/features/shared/api/payment_admin_api";

const toPercent = (value: number) => Number((value * 100).toFixed(2));
const toRate = (value: number) => Number((value / 100).toFixed(4));

const DEFAULT_POLICY: FeePolicyResponse = {
  level0Rate: 0.05,
  level1Rate: 0.04,
  level2Rate: 0.03,
  level3PlusRate: 0.03,
  firstPaymentPromoRate: 0.03,
  minFee: 2000,
  updatedAt: null,
};

type SettingsForm = {
  level0Rate: number;
  level1Rate: number;
  level2Rate: number;
  level3PlusRate: number;
  firstPaymentPromoRate: number;
  minFee: number;
  operationMode: string;
  signupApproval: string;
  minimumAppVersion: string;
  forceUpdate: boolean;
  showNoticeBanner: boolean;
  noticeMessage: string;
  allowReservationOrder: boolean;
  allowUrgentDispatch: boolean;
  autoCancelWindow: string;
  dispatchPriority: string;
  allowBrowserPush: boolean;
  allowNightAlert: boolean;
  inquiryPriority: string;
  supportNotice: string;
};

const INITIAL_SETTINGS: SettingsForm = {
  level0Rate: toPercent(DEFAULT_POLICY.level0Rate),
  level1Rate: toPercent(DEFAULT_POLICY.level1Rate),
  level2Rate: toPercent(DEFAULT_POLICY.level2Rate),
  level3PlusRate: toPercent(DEFAULT_POLICY.level3PlusRate),
  firstPaymentPromoRate: toPercent(DEFAULT_POLICY.firstPaymentPromoRate),
  minFee: DEFAULT_POLICY.minFee,
  operationMode: "정상 운영",
  signupApproval: "관리자 승인 후 활성화",
  minimumAppVersion: "1.0.0",
  forceUpdate: false,
  showNoticeBanner: true,
  noticeMessage: "현재 서비스는 정상 운영 중입니다.",
  allowReservationOrder: true,
  allowUrgentDispatch: true,
  autoCancelWindow: "24시간",
  dispatchPriority: "직접 배차 우선",
  allowBrowserPush: true,
  allowNightAlert: true,
  inquiryPriority: "결제/정산 문의 우선",
  supportNotice: "야간 장애 이슈는 우선 대응 대상으로 분류합니다.",
};

const labelClass =
  "mb-2 block text-[11px] font-bold text-slate-400 uppercase tracking-wider";
const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#4E46E5] transition-all";

export default function SystemSettingPage() {
  const [formData, setFormData] = useState<SettingsForm>(INITIAL_SETTINGS);
  const [isPolicyLoading, setIsPolicyLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const applyPolicyToForm = (policy: FeePolicyResponse) => {
    setFormData((prev) => ({
      ...prev,
      level0Rate: toPercent(
        Number(policy.level0Rate ?? DEFAULT_POLICY.level0Rate),
      ),
      level1Rate: toPercent(
        Number(policy.level1Rate ?? DEFAULT_POLICY.level1Rate),
      ),
      level2Rate: toPercent(
        Number(policy.level2Rate ?? DEFAULT_POLICY.level2Rate),
      ),
      level3PlusRate: toPercent(
        Number(policy.level3PlusRate ?? DEFAULT_POLICY.level3PlusRate),
      ),
      firstPaymentPromoRate: toPercent(
        Number(
          policy.firstPaymentPromoRate ?? DEFAULT_POLICY.firstPaymentPromoRate,
        ),
      ),
      minFee: Number(policy.minFee ?? DEFAULT_POLICY.minFee),
    }));
  };

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        setIsPolicyLoading(true);
        const policy = await paymentAdminApi.getCurrentFeePolicy();
        applyPolicyToForm(policy);
      } catch (error) {
        console.error("수수료 정책 로드 실패:", error);
      } finally {
        setIsPolicyLoading(false);
      }
    };
    void loadPolicy();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    const target = e.target as HTMLInputElement;
    const nextValue =
      target.type === "checkbox"
        ? target.checked
        : target.type === "number"
          ? Number(value)
          : value;

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSaveFeePolicy = async () => {
    try {
      setIsSaving(true);
      const saved = await paymentAdminApi.updateFeePolicy({
        level0Rate: toRate(formData.level0Rate),
        level1Rate: toRate(formData.level1Rate),
        level2Rate: toRate(formData.level2Rate),
        level3PlusRate: toRate(formData.level3PlusRate),
        firstPaymentPromoRate: toRate(formData.firstPaymentPromoRate),
        minFee: Number(formData.minFee),
      });
      applyPolicyToForm(saved);
      alert("수수료 정책이 저장되었습니다.");
    } catch (error) {
      alert("수수료 정책 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
      {" "}
      <header className="mb-8 pl-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            시스템 설정
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            서비스 공통 정책 및 수수료 기준을 관리합니다.
          </p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">
              수수료 정책 관리
            </h2>
            <button
              onClick={handleSaveFeePolicy}
              disabled={isPolicyLoading || isSaving}
              className="bg-[#4E46E5] text-white px-4 py-2 rounded-xl font-bold text-xs hover:opacity-90 active:scale-95 transition-all disabled:bg-slate-200"
            >
              {isSaving ? "저장 중..." : "정책 저장"}
            </button>
          </div>
          <div className="p-6">
            {isPolicyLoading ? (
              <div className="py-10 text-center text-sm text-slate-400 font-medium">
                데이터를 불러오는 중...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <SettingNumber
                  label="레벨 0 수수료"
                  name="level0Rate"
                  value={formData.level0Rate}
                  onChange={handleChange}
                  suffix="%"
                  step="0.1"
                />
                <SettingNumber
                  label="레벨 1 수수료"
                  name="level1Rate"
                  value={formData.level1Rate}
                  onChange={handleChange}
                  suffix="%"
                  step="0.1"
                />
                <SettingNumber
                  label="레벨 2 수수료"
                  name="level2Rate"
                  value={formData.level2Rate}
                  onChange={handleChange}
                  suffix="%"
                  step="0.1"
                />
                <SettingNumber
                  label="레벨 3+ 수수료"
                  name="level3PlusRate"
                  value={formData.level3PlusRate}
                  onChange={handleChange}
                  suffix="%"
                  step="0.1"
                />
                <SettingNumber
                  label="첫 결제 프로모션"
                  name="firstPaymentPromoRate"
                  value={formData.firstPaymentPromoRate}
                  onChange={handleChange}
                  suffix="%"
                  step="0.1"
                />
                <SettingNumber
                  label="최소 수수료"
                  name="minFee"
                  value={formData.minFee}
                  onChange={handleChange}
                  suffix="원"
                  step="100"
                />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-700">기본 운영 설정</h2>
          </div>
          <div className="p-6 space-y-5">
            <SettingSelect
              label="서비스 상태"
              name="operationMode"
              value={formData.operationMode}
              onChange={handleChange}
              options={["정상 운영", "점검 예정", "긴급 점검"]}
            />
            <SettingSelect
              label="회원가입 승인 방식"
              name="signupApproval"
              value={formData.signupApproval}
              onChange={handleChange}
              options={[
                "관리자 승인 후 활성화",
                "즉시 가입 허용",
                "서류 검수 후 활성화",
              ]}
            />
            <SettingText
              label="최소 지원 앱 버전"
              name="minimumAppVersion"
              value={formData.minimumAppVersion}
              onChange={handleChange}
            />
            <SettingToggle
              label="강제 업데이트 적용"
              description="버전 미달 사용자는 업데이트를 요구합니다."
              name="forceUpdate"
              checked={formData.forceUpdate}
              onChange={handleChange}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-700">
              주문 및 배차 기준
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <SettingToggle
              label="예약 주문 허용"
              description="예약 건 접수 여부를 설정합니다."
              name="allowReservationOrder"
              checked={formData.allowReservationOrder}
              onChange={handleChange}
            />
            <SettingToggle
              label="긴급 배차 허용"
              description="긴급 주문 카테고리 운영 여부입니다."
              name="allowUrgentDispatch"
              checked={formData.allowUrgentDispatch}
              onChange={handleChange}
            />
            <SettingSelect
              label="미배정 주문 정리"
              name="autoCancelWindow"
              value={formData.autoCancelWindow}
              onChange={handleChange}
              options={["24시간", "48시간", "관리자 수동 정리"]}
            />
            <SettingSelect
              label="배차 우선 순위"
              name="dispatchPriority"
              value={formData.dispatchPriority}
              onChange={handleChange}
              options={[
                "직접 배차 우선",
                "신청 많은 순 우선",
                "등록 시각 순 우선",
              ]}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-700">
              알림 및 고객지원
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <SettingToggle
              label="브라우저 푸시 알림"
              description="실시간 운영 알림을 화면에 표시합니다."
              name="allowBrowserPush"
              checked={formData.allowBrowserPush}
              onChange={handleChange}
            />
            <SettingToggle
              label="야간 장애 알림 유지"
              description="심야 시간 긴급 알림을 허용합니다."
              name="allowNightAlert"
              checked={formData.allowNightAlert}
              onChange={handleChange}
            />
            <SettingSelect
              label="문의 응답 우선순위"
              name="inquiryPriority"
              value={formData.inquiryPriority}
              onChange={handleChange}
              options={[
                "결제/정산 문의 우선",
                "장애/오류 문의 우선",
                "전체 동일",
              ]}
            />
            <SettingTextarea
              label="고객지원 운영 메모"
              name="supportNotice"
              value={formData.supportNotice}
              onChange={handleChange}
              rows={2}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-fit md:col-span-2">
          <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-700">상단 공지 설정</h2>
          </div>
          <div className="p-6 space-y-5">
            <SettingToggle
              label="운영 배너 노출"
              description="홈 화면 상단에 공지 배너를 노출합니다."
              name="showNoticeBanner"
              checked={formData.showNoticeBanner}
              onChange={handleChange}
            />
            <SettingTextarea
              label="배너 문구"
              name="noticeMessage"
              value={formData.noticeMessage}
              onChange={handleChange}
              rows={2}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingNumber({ label, name, value, onChange, suffix, step }: any) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
      <p className={labelClass}>{label}</p>
      <div className="flex items-baseline gap-1">
        <input
          type="number"
          name={name}
          value={value}
          step={step}
          onChange={onChange}
          className="bg-transparent text-xl font-bold text-slate-900 outline-none w-full"
        />
        <span className="text-xs font-bold text-slate-400">{suffix}</span>
      </div>
    </div>
  );
}

function SettingText({ label, name, value, onChange }: any) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className={fieldClass}
      />
    </div>
  );
}

function SettingSelect({ label, name, value, onChange, options }: any) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={fieldClass}
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function SettingTextarea({ label, name, value, onChange, rows }: any) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`${fieldClass} resize-none`}
      />
    </div>
  );
}

function SettingToggle({ label, description, name, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex-1 pr-4">
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <p className="text-[11px] font-medium text-slate-500 mt-0.5">
          {description}
        </p>
      </div>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 accent-[#4E46E5] cursor-pointer"
      />
    </div>
  );
}
