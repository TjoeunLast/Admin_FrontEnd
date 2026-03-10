"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getUserDetail,
  deleteUser,
  restoreUser,
} from "@/app/features/shared/api/user_api";
import { fetchOrders } from "@/app/features/shared/api/order_api";

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [orderStats, setOrderStats] = useState({
    waiting: 0,
    confirmed: 0,
    ing: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const MAIN_COLOR = "#4E46E5";
  const currentUserId = params?.userId;

  const loadData = useCallback(async () => {
    if (!currentUserId) return;
    try {
      setIsLoading(true);
      const userData = await getUserDetail(Number(currentUserId));
      setUser(userData);

      const allOrders = await fetchOrders();
      const userOrders = allOrders.filter(
        (o: any) =>
          o.driverNo === Number(currentUserId) ||
          o.user?.userId === Number(currentUserId),
      );

      setOrderStats({
        waiting: userOrders.filter((o: any) => o.status === "REQUESTED").length,
        confirmed: userOrders.filter((o: any) => o.status === "ACCEPTED")
          .length,
        ing: userOrders.filter((o: any) =>
          ["LOADING", "IN_TRANSIT", "UNLOADING"].includes(o.status),
        ).length,
        completed: userOrders.filter((o: any) => o.status === "COMPLETED")
          .length,
      });
    } catch (error) {
      console.error("❌ 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말 이 계정을 비활성화 처리하시겠습니까?")) return;
    try {
      await deleteUser(Number(currentUserId));
      alert("비활성화되었습니다.");
      loadData();
    } catch {
      alert("오류 발생");
    }
  };

  const handleRestoreAccount = async () => {
    if (!window.confirm("이 계정을 다시 활성화하시겠습니까?")) return;
    try {
      await restoreUser(Number(currentUserId));
      alert("활성화되었습니다.");
      loadData();
    } catch {
      alert("오류 발생");
    }
  };

  if (isLoading)
    return (
      <div className="p-20 text-center font-bold text-slate-300 text-xl">
        데이터 로딩 중...
      </div>
    );
  if (!user)
    return (
      <div className="p-20 text-center font-bold text-rose-500 text-xl">
        회원 정보 없음
      </div>
    );

  const isDeleted = user.delflag?.toUpperCase() === "A";
  const isDriver = user.isOwner === "DRIVER";

  return (
    <div className="w-full space-y-6">
      {/* 1. 헤더 (오더 상세 스타일 반영) */}
      <div className="flex items-center gap-3 py-2 border-b border-slate-100">
        <button
          onClick={() => router.back()}
          className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          회원 상세
          <span
            className="flex items-center gap-1.5 ml-1"
            style={{ color: MAIN_COLOR }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {user.nickname || user.name || "이름 없음"}
          </span>
        </h1>

        {/* 우측 상태 뱃지 및 액션 버튼 */}
        <div className="ml-auto flex items-center gap-3">
          {/* 활성화/비활성화 전환 버튼 */}
          {!isDeleted ? (
            <button
              onClick={handleDeleteAccount}
              className="px-5 py-3 bg-rose-600 text-white text-xs font-black rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
            >
              계정 정지
            </button>
          ) : (
            <button
              onClick={handleRestoreAccount}
              className="px-5 py-3 bg-emerald-600 text-white text-xs font-black rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              계정 정상
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* [좌측] 실시간 활동 현황 */}
        <div className="col-span-12 lg:col-span-4 space-y-4 font-sans">
          <section className="bg-white p-7 rounded-2xl border border-slate-100 shadow-sm relative text-black">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-black text-slate-800 pl-3">
                활동 현황
              </p>
              <button
                onClick={() => router.push(`/users/${currentUserId}/orders`)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
                title="전체 오더 보기"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatusBox
                label="승인대기"
                count={orderStats.waiting}
                color="text-amber-500"
              />
              <StatusBox
                label="배차확정"
                count={orderStats.confirmed}
                color="text-blue-500"
              />
              <StatusBox
                label="운송중"
                count={orderStats.ing}
                color="text-indigo-600"
              />
              <StatusBox
                label="운송완료"
                count={orderStats.completed}
                color="text-emerald-500"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-around text-center">
              <div>
                <p className="text-[11px] font-bold text-slate-300 uppercase mb-1">
                  {isDriver ? "총 운송 완료" : "총 오더 등록"}
                </p>
                <p className="text-xl font-black text-slate-800">
                  {orderStats.completed}
                  <span className="text-sm ml-0.5 text-slate-400">건</span>
                </p>
              </div>
              <div className="w-px h-10 bg-slate-100"></div>
              <div>
                <p className="text-[11px] font-bold text-slate-300 uppercase mb-1">
                  평균 평점
                </p>
                <p className="text-xl font-black text-amber-500">
                  {user.ratingAvg || "5.0"}★
                </p>
              </div>
            </div>

            <div className="mt-4 w-full py-3 bg-slate-100 rounded-xl text-center border border-slate-200">
              <p className="text-xs font-bold text-slate-500">
                회원 유형 <span className="mx-2 text-slate-300">|</span>
                <span className="text-sm font-black text-indigo-600">
                  {isDriver ? "차주 회원" : "화주 회원"}
                </span>
              </p>
            </div>
          </section>
        </div>

        {/* [우측] 상세 정보 테이블 */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
              <p className="text-sm font-black text-slate-800">
                회원 인적 사항 및 계정 정보
              </p>
            </div>
            <div className="divide-y divide-slate-50 text-black">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <TableItem label="닉네임" value={user.nickname} />
                <TableItem label="성함(실명)" value={user.name} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <TableItem label="연락처" value={user.phone} />
                <TableItem label="이메일" value={user.email} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <TableItem
                  label="나이/성별"
                  value={`${user.age || "-"}세 / ${user.gender === "M" ? "남성" : "여성"}`}
                />
                <TableItem label="가입 일자" value={user.enrolldate} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 border-b-0">
                <TableItem
                  label="계정 상태"
                  value={!isDeleted ? "정상" : "정지"}
                  isStatus
                  status={!isDeleted}
                />
                <TableItem label="고유 번호" value={user.userId} />
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm text-black">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
              <p className="text-sm font-black text-slate-800">
                {isDriver ? "차량 및 정산 정보" : "사업자 및 회사 정보"}
              </p>
            </div>
            <div className="divide-y divide-slate-50 text-black">
              {isDriver ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 text-black">
                    <TableItem label="차량 번호" value={user.carNum} />
                    <TableItem label="등록 차종" value={user.carType} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 text-black">
                    <TableItem
                      label="적재 톤수"
                      value={user.tonnage ? `${user.tonnage}톤` : "-"}
                    />
                    <TableItem label="은행명" value={user.bankName} />
                  </div>
                  <TableItem label="계좌 번호" value={user.accountNum} />
                  <TableItem label="활동 지역" value={user.address} />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 text-black">
                    <TableItem label="회사 명칭" value={user.companyName} />
                    <TableItem label="사업자 번호" value={user.bizRegNum} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 text-black">
                    <TableItem label="대표자" value={user.representative} />
                    <TableItem
                      label="사업자 구분"
                      value={
                        user.isCorporate === "Y" ? "법인 사업자" : "개인/일반"
                      }
                    />
                  </div>
                  <TableItem label="사업장 주소" value={user.bizAddress} />
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusBox({ label, count, color }: any) {
  return (
    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-center">
      <p className="text-[11px] font-bold text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{count}</p>
    </div>
  );
}

function TableItem({ label, value, isStatus = false, status = true }: any) {
  return (
    <div className="flex border-r last:border-r-0 border-slate-50 hover:bg-slate-50/30 transition-colors">
      <div className="w-32 min-w-[128px] bg-slate-50/20 px-5 py-4 text-[11px] font-black text-slate-400 uppercase border-r border-slate-50 flex items-center">
        {label}
      </div>
      <div
        className={`px-6 py-4 text-[15px] font-bold flex items-center flex-1 break-all ${
          isStatus ? (status ? "text-blue-500" : "text-rose-500") : "text-black"
        }`}
      >
        {value || "-"}
      </div>
    </div>
  );
}
