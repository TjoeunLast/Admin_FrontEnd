"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  deleteUser,
  getUserDetail,
  restoreUser,
} from "@/app/features/shared/api/user_api";
import { fetchOrders } from "@/app/features/shared/api/order_api";

// 상세 정보의 라벨과 값을 표시하는 행 컴포넌트
function InfoRow({
  label,
  value,
  valueColor = "text-slate-900",
}: {
  label: string;
  value: string | number | null | undefined;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center py-4 border-b border-slate-50 last:border-0 group transition-colors hover:bg-slate-50/30 px-2">
      <span className="w-32 text-[13px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">
        {label}
      </span>
      <span className={`flex-1 text-sm font-black ${valueColor} break-all`}>
        {value || "-"}
      </span>
    </div>
  );
}

// 회원 상세 정보와 활동 현황을 관리하는 페이지 컴포넌트
function MemberDetailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = Number(searchParams.get("userId"));

  const [user, setUser] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 회원 정보와 주문 내역 데이터를 비동기로 호출
  const loadData = async () => {
    if (!currentUserId) return;
    try {
      setIsLoading(true);
      const [userData, orderData] = await Promise.all([
        getUserDetail(currentUserId),
        fetchOrders(),
      ]);
      setUser(userData);
      setAllOrders(orderData);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 및 아이디 변경 시 데이터 호출 실행
  useEffect(() => {
    void loadData();
  }, [currentUserId]);

  // 주문 상태별 건수와 총 합계를 계산하여 반환
  const activityStats = useMemo(() => {
    if (!user || allOrders.length === 0)
      return {
        requested: 0,
        confirmed: 0,
        shipping: 0,
        completed: 0,
        total: 0,
      };

    const myOrders = allOrders.filter(
      (o: any) =>
        o.driverNo === currentUserId || o.user?.userId === currentUserId,
    );

    const requested = myOrders.filter(
      (o) => o.status === "REQUESTED" || o.status === "WAITING",
    ).length;
    const confirmed = myOrders.filter(
      (o) => o.status === "ACCEPTED" || o.status === "CONFIRMED",
    ).length;
    const shipping = myOrders.filter(
      (o) => o.status === "IN_TRANSIT" || o.status === "SHIPPING",
    ).length;
    const completed = myOrders.filter((o) => o.status === "COMPLETED").length;

    const total = requested + confirmed + shipping + completed;

    return { requested, confirmed, shipping, completed, total };
  }, [user, allOrders, currentUserId]);

  // 사용자의 삭제 여부를 불리언 값으로 판별
  const isDeleted = useMemo(
    () => String(user?.delflag || user?.delFlag).toUpperCase() === "A",
    [user],
  );

  // 계정의 정지 상태를 토글하는 함수
  const handleStatusToggle = async () => {
    if (!user?.userId) return;
    const msg = isDeleted
      ? "계정 정지를 해제하시겠습니까?"
      : "계정을 정지하시겠습니까?";
    if (!window.confirm(msg)) return;
    try {
      if (isDeleted) await restoreUser(user.userId);
      else await deleteUser(user.userId);
      alert("변경되었습니다.");
      await loadData();
    } catch (error) {
      alert("오류 발생");
    }
  };

  // 데이터 로딩 중 표시될 화면
  if (isLoading)
    return (
      <div className="p-20 text-center text-slate-400 font-black italic text-sm">
        데이터 분석 중...
      </div>
    );

  // 데이터가 없을 경우 표시될 화면
  if (!user)
    return (
      <div className="p-20 text-center text-slate-400 font-black text-sm">
        정보 없음
      </div>
    );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-24 font-sans text-slate-900">
      {/* 상단 제목과 제어 버튼 구역 */}
      <header className="mb-8 pl-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            회원 상세 정보
            <span className="text-[#4E46E5] flex items-center gap-2">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-90"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {user.nickname}
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleStatusToggle}
            className={`px-5 py-3 rounded-xl font-black text-[12px] transition-all shadow-md active:scale-95 text-white ${
              isDeleted
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-slate-900 hover:bg-black"
            }`}
          >
            {isDeleted ? "계정 정지 해제" : "계정 정지"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* 사이드바 영역 활동 현황 카드 */}
        <div className="col-span-4 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 ring-1 ring-slate-100">
            <h2 className="font-black text-slate-800 mb-8 text-lg">
              활동 현황
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                {
                  label: "배차 대기",
                  val: activityStats.requested,
                  color: "text-amber-600",
                  bg: "bg-amber-100/50",
                },
                {
                  label: "배차 확정",
                  val: activityStats.confirmed,
                  color: "text-blue-700",
                  bg: "bg-blue-100/50",
                },
                {
                  label: "운송 진행",
                  val: activityStats.shipping,
                  color: "text-indigo-700",
                  bg: "bg-indigo-100/50",
                },
                {
                  label: "운송 완료",
                  val: activityStats.completed,
                  color: "text-emerald-700",
                  bg: "bg-emerald-100/50",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`${item.bg} rounded-[24px] p-5 text-center border border-white`}
                >
                  <p className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-tight">
                    {item.label}
                  </p>
                  <p className={`text-3xl font-black ${item.color}`}>
                    {item.val}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-around items-center border-t border-slate-100 pt-8 mb-8">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-300 mb-1 uppercase">
                  총 활동 건수
                </p>
                <p className="text-xl font-black text-slate-800">
                  {activityStats.total}
                  <span className="text-sm ml-0.5">건</span>
                </p>
              </div>
              <div className="w-px h-10 bg-slate-100" />
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-300 mb-1 uppercase">
                  평균 평점
                </p>
                <p className="text-xl font-black text-amber-500">
                  {user.rating || "5.0"}★
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl py-4 text-center border border-slate-100">
              <span
                className={`text-[13px] font-black ${user.isOwner === "DRIVER" ? "text-blue-600" : "text-indigo-600"}`}
              >
                {user.isOwner === "DRIVER"
                  ? "물류 파트너 (차주)"
                  : "비즈니스 파트너 (화주)"}
              </span>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 상세 정보 카드 */}
        <div className="col-span-8 space-y-8">
          {/* 계정의 기본적인 정보를 표시하는 카드 */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10 ring-1 ring-slate-100">
            <h2 className="text-lg font-black text-slate-800 mb-8 pb-4 border-b border-slate-100">
              기본 계정 정보
            </h2>
            <div className="grid grid-cols-2 gap-x-12">
              <div className="space-y-1">
                <InfoRow label="닉네임" value={user.nickname} />
                <InfoRow label="휴대폰" value={user.phone} />
                <InfoRow
                  label="성별 / 나이"
                  value={`${user.gender || "-"} / ${user.age || "-"}세`}
                />
              </div>
              <div className="space-y-1">
                <InfoRow label="이메일" value={user.email} />
                <InfoRow
                  label="가입일자"
                  value={user.enrolldate?.split("T")[0]}
                />
                <InfoRow
                  label="활동상태"
                  value={isDeleted ? "정지" : "활성"}
                  valueColor={isDeleted ? "text-rose-500" : "text-emerald-500"}
                />
              </div>
            </div>
          </div>

          {/* 역할에 따른 차량 정보 또는 사업자 정보를 표시하는 카드 */}
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-10 ring-1 ring-slate-100">
            <h2 className="text-lg font-black text-slate-800 mb-8 pb-4 border-b border-slate-100">
              {user.isOwner === "DRIVER"
                ? "차량 정보 및 정산 관리"
                : "화주 및 기업 정보 관리"}
            </h2>
            <div className="grid grid-cols-2 gap-x-12">
              {user.isOwner === "DRIVER" ? (
                <>
                  <div className="space-y-1">
                    <InfoRow label="차량번호" value={user.carNum} />
                    <InfoRow
                      label="차종 / 톤수"
                      value={`${user.carType || "-"} / ${user.tonnage ? user.tonnage + "톤" : "-"}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <InfoRow label="정산 은행" value={user.bankName} />
                    <InfoRow label="정산 계좌" value={user.accountNum} />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <InfoRow label="기업명" value={user.companyName} />
                    <InfoRow
                      label="사업자 구분"
                      value={user.bizType || "개인"}
                    />
                    <InfoRow label="정산 은행" value={user.bankName} />
                  </div>
                  <div className="space-y-1">
                    <InfoRow label="대표자명" value={user.representative} />
                    <InfoRow label="사업자 번호" value={user.bizRegNum} />
                    <InfoRow label="정산 계좌" value={user.accountNum} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MemberDetailPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-400 font-black italic text-sm">데이터 분석 중...</div>}>
      <MemberDetailPageContent />
    </Suspense>
  );
}
