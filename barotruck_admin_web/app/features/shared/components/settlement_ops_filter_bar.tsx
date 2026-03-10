"use client";

interface SettlementOpsFilterBarProps {
  searchPlaceholder: string;
  searchValue: string;
  statusValue: string;
  statusOptions: string[];
  paymentValue: string;
  paymentOptions: string[];
  payoutValue?: string;
  payoutOptions?: string[];
  showExtraColumns: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPaymentChange: (value: string) => void;
  onPayoutChange?: (value: string) => void;
  onToggleExtraColumns: (checked: boolean) => void;
}

export function SettlementOpsFilterBar({
  searchPlaceholder,
  searchValue,
  statusValue,
  statusOptions,
  paymentValue,
  paymentOptions,
  payoutValue,
  payoutOptions,
  showExtraColumns,
  onSearchChange,
  onStatusChange,
  onPaymentChange,
  onPayoutChange,
  onToggleExtraColumns,
}: SettlementOpsFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <input
        type="text"
        placeholder={searchPlaceholder}
        className="h-11 w-64 rounded-xl border border-[#e2e8f0] px-4 text-sm outline-none focus:border-blue-500"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <select
        className="h-11 rounded-xl border border-[#e2e8f0] px-4 text-sm outline-none"
        value={statusValue}
        onChange={(event) => onStatusChange(event.target.value)}
      >
        {statusOptions.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <select
        className="h-11 rounded-xl border border-[#e2e8f0] px-4 text-sm outline-none"
        value={paymentValue}
        onChange={(event) => onPaymentChange(event.target.value)}
      >
        {paymentOptions.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      {payoutOptions && onPayoutChange ? (
        <select
          className="h-11 rounded-xl border border-[#e2e8f0] px-4 text-sm outline-none"
          value={payoutValue}
          onChange={(event) => onPayoutChange(event.target.value)}
        >
          {payoutOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : null}
      <label className="flex h-11 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-slate-50 px-3 text-sm font-medium text-slate-600">
        <input
          type="checkbox"
          checked={showExtraColumns}
          onChange={(event) => onToggleExtraColumns(event.target.checked)}
        />
        세부 컬럼 보기
      </label>
    </div>
  );
}
