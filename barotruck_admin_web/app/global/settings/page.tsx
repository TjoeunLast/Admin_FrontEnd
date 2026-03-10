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

const sectionCardClass =
  "rounded-[22px] border border-[#E2E8F0] bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.05)]";

const fieldClass =
  "w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-semibold text-[#0F172A] outline-none transition focus:border-[#4E46E5] focus:ring-2 focus:ring-[#EDECFC]";

const labelClass = "mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#64748B]";

export default function SystemSettingPage() {
  const [formData, setFormData] = useState<SettingsForm>(INITIAL_SETTINGS);
  const [isPolicyLoading, setIsPolicyLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const applyPolicyToForm = (policy: FeePolicyResponse) => {
    setFormData((prev) => ({
      ...prev,
      level0Rate: toPercent(Number(policy.level0Rate ?? DEFAULT_POLICY.level0Rate)),
      level1Rate: toPercent(Number(policy.level1Rate ?? DEFAULT_POLICY.level1Rate)),
      level2Rate: toPercent(Number(policy.level2Rate ?? DEFAULT_POLICY.level2Rate)),
      level3PlusRate: toPercent(Number(policy.level3PlusRate ?? DEFAULT_POLICY.level3PlusRate)),
      firstPaymentPromoRate: toPercent(
        Number(policy.firstPaymentPromoRate ?? DEFAULT_POLICY.firstPaymentPromoRate)
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
      console.error("수수료 정책 저장 실패:", error);
      alert("수수료 정책 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <section className="rounded-[24px] border border-[#E2E8F0] bg-white px-7 py-7 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex w-fit rounded-full bg-[#EDECFC] px-3 py-1 text-xs font-bold tracking-[0.16em] text-[#4E46E5]">
              APP SETTINGS
            </span>
            <div>
              <h1 className="text-[28px] font-black tracking-tight text-[#0F172A]">시스템 설정</h1>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                앱 운영자가 자주 보는 공통 설정만 모았습니다. 수수료 정책은 실제 API와 연결되어 있고,
                나머지 항목은 운영 기준을 정리하기 쉽게 재구성했습니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#DCFCE7] px-3 py-2 text-xs font-bold text-[#15803D]">
              실저장: 레벨별 수수료 정책
            </span>
            <span className="rounded-full bg-[#F1F5F9] px-3 py-2 text-xs font-bold text-[#64748B]">
              운영 UI: 앱 관리 기준 정리
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={`${sectionCardClass} space-y-6`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EDE9FE]">
                <CreditCard size={22} color="#4E46E5" strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-[#0F172A]">수수료 정책</h2>
                  <span className="rounded-full bg-[#EDECFC] px-3 py-1 text-[11px] font-bold text-[#4E46E5]">
                    payment API 연동
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#64748B]">
                  레벨별 수수료와 첫 결제 프로모션, 최소 수수료를 관리합니다.
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveFeePolicy}
              disabled={isPolicyLoading || isSaving}
              className="rounded-2xl bg-[#4E46E5] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4840D3] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
            >
              {isSaving ? "저장 중..." : "수수료 정책 저장"}
            </button>
          </div>

          {isPolicyLoading ? (
            <div className="rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-10 text-sm font-semibold text-[#94A3B8]">
              수수료 정책을 불러오는 중입니다.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]">
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
            </div>
          )}

          <div className="rounded-[18px] bg-[#F8FAFC] px-4 py-3 text-sm leading-6 text-[#64748B]">
            화주 레벨 정책은 앱 화면보다 결제/정산 백엔드 로직에서 직접 반영됩니다.
          </div>
        </div>

        <div className={`${sectionCardClass} space-y-5`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E0E7FF]">
              <Settings2 size={22} color="#4E46E5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-[#0F172A]">앱 운영 정책</h2>
                <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-[11px] font-bold text-[#64748B]">
                  운영 기준
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                앱 상태, 가입 승인, 버전 운영처럼 전체 서비스 톤을 잡는 공통 기준입니다.
              </p>
            </div>
          </div>

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
            options={["관리자 승인 후 활성화", "즉시 가입 허용", "서류 검수 후 활성화"]}
          />
          <SettingText
            label="최소 지원 앱 버전"
            name="minimumAppVersion"
            value={formData.minimumAppVersion}
            onChange={handleChange}
          />
          <SettingToggle
            label="강제 업데이트 적용"
            description="최소 지원 버전 미만 사용자는 앱 업데이트를 먼저 요구합니다."
            name="forceUpdate"
            checked={formData.forceUpdate}
            onChange={handleChange}
          />
          <SettingToggle
            label="상단 운영 배너 노출"
            description="점검, 공지, 중요 정책 변경 시 홈 상단 공지 배너를 노출하는 기준입니다."
            name="showNoticeBanner"
            checked={formData.showNoticeBanner}
            onChange={handleChange}
          />
          <SettingTextarea
            label="운영 배너 문구"
            name="noticeMessage"
            value={formData.noticeMessage}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={`${sectionCardClass} space-y-5`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
              <Truck size={22} color="#2563EB" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-[#0F172A]">주문 / 배차 기준</h2>
                <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-[11px] font-bold text-[#64748B]">
                  운영 기준
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                화주 주문 접수와 배차 흐름에서 관리자가 가장 자주 기준을 바꾸는 항목들입니다.
              </p>
            </div>
          </div>

          <SettingToggle
            label="예약 주문 허용"
            description="즉시 주문만 받을지, 예약 주문까지 받을지 정하는 운영 기준입니다."
            name="allowReservationOrder"
            checked={formData.allowReservationOrder}
            onChange={handleChange}
          />
          <SettingToggle
            label="긴급 / 바로배차 허용"
            description="긴급 주문 카테고리를 열어둘지 여부를 관리합니다."
            name="allowUrgentDispatch"
            checked={formData.allowUrgentDispatch}
            onChange={handleChange}
          />
          <SettingSelect
            label="미배정 주문 정리 기준"
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
            options={["직접 배차 우선", "신청 많은 순 우선", "등록 시각 순 우선"]}
          />

          <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#0F172A]">결제 준비 만료 기준</p>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">
                  현재 백엔드 기준 토스 결제 준비 상태는 30분 후 만료 처리됩니다.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#4E46E5] ring-1 ring-[#E2E8F0]">
                30분 고정
              </span>
            </div>
          </div>
        </div>

        <div className={`${sectionCardClass} space-y-5`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4FCE7]">
              <Bell size={22} color="#65A30D" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-[#0F172A]">알림 / 고객지원</h2>
                <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-[11px] font-bold text-[#64748B]">
                  운영 기준
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                관리자 대응 우선순위와 사용자 알림 기본 방향을 한 화면에서 정리합니다.
              </p>
            </div>
          </div>

          <SettingToggle
            label="관리자 브라우저 푸시 사용"
            description="신규 문의, 결제 이슈, 운영 알림을 관리자 화면에서 바로 받습니다."
            name="allowBrowserPush"
            checked={formData.allowBrowserPush}
            onChange={handleChange}
          />
          <SettingToggle
            label="야간 장애 알림 유지"
            description="심야 시간에도 긴급 장애나 결제 실패 알림을 계속 받을지 여부입니다."
            name="allowNightAlert"
            checked={formData.allowNightAlert}
            onChange={handleChange}
          />
          <SettingSelect
            label="문의 응답 우선순위"
            name="inquiryPriority"
            value={formData.inquiryPriority}
            onChange={handleChange}
            options={["결제/정산 문의 우선", "장애/오류 문의 우선", "전체 동일"]}
          />
          <SettingTextarea
            label="고객지원 운영 메모"
            name="supportNotice"
            value={formData.supportNotice}
            onChange={handleChange}
            rows={4}
          />
        </div>
      </section>

      <section className={`${sectionCardClass} space-y-4`}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF3E2]">
            <Megaphone size={22} color="#D97706" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-[#0F172A]">관리 포인트</h2>
              <span className="rounded-full bg-[#FEF3E2] px-3 py-1 text-[11px] font-bold text-[#B45309]">
                운영자가 자주 보는 항목
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              앱을 실제로 운영할 때 시스템 설정 페이지에서 자주 확인해야 하는 기준들입니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard
            icon={<Users size={18} color="#4E46E5" strokeWidth={2.2} />}
            title="가입 정책"
            description="화주/차주 가입 승인 기준, 강제 업데이트, 공지 노출 여부처럼 앱 진입 조건을 관리합니다."
          />
          <InfoCard
            icon={<Truck size={18} color="#2563EB" strokeWidth={2.2} />}
            title="주문 기준"
            description="예약 주문 허용 여부, 긴급 배차 노출, 미배정 주문 정리 기준 같은 운영선을 맞춥니다."
          />
          <InfoCard
            icon={<Bell size={18} color="#15803D" strokeWidth={2.2} />}
            title="고객 대응"
            description="문의 우선순위, 브라우저 푸시, 야간 알림 등 운영팀 대응 속도에 직접 영향을 주는 항목입니다."
          />
        </div>
      </section>
    </div>
  );
}

function SettingNumber({
  label,
  name,
  value,
  onChange,
  suffix,
  step,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix: string;
  step: string;
}) {
  return (
    <label className="block rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <span className={labelClass}>{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="number"
          name={name}
          value={value}
          step={step}
          onChange={onChange}
          className="w-full bg-transparent text-base font-black text-[#0F172A] outline-none"
        />
        <span className="text-sm font-bold text-[#64748B]">{suffix}</span>
      </div>
    </label>
  );
}

function SettingText({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input className={fieldClass} name={name} value={value} onChange={onChange} />
    </label>
  );
}

function SettingSelect({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select className={fieldClass} name={name} value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function SettingTextarea({
  label,
  name,
  value,
  onChange,
  rows,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows: number;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea
        className={`${fieldClass} resize-none`}
        name={name}
        value={value}
        rows={rows}
        onChange={onChange}
      />
    </label>
  );
}

function SettingToggle({
  label,
  description,
  name,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div>
        <div className="text-sm font-black text-[#0F172A]">{label}</div>
        <p className="mt-1 text-sm leading-6 text-[#64748B]">{description}</p>
      </div>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-5 shrink-0 accent-[#4E46E5]"
      />
    </label>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-[#E2E8F0]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-black text-[#0F172A]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
    </article>
  );
}
