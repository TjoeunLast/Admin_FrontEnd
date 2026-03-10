"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  deleteUser,
  getUserDetail,
  restoreUser,
} from "@/app/features/shared/api/user_api";
import UserProfileCard, {
  UserDetail,
} from "@/app/features/user/users/user_profile_card";

const toPositiveId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? Math.trunc(id) : null;
};

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawUserId = Array.isArray(params?.userId)
    ? params.userId[0]
    : params?.userId;
  const targetUserId = toPositiveId(rawUserId);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!targetUserId) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getUserDetail(targetUserId);
      setUser(data as UserDetail);
    } catch (error) {
      console.error("회원 상세 로드 실패:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  const isDeleted = useMemo(() => {
    const deletedFlag =
      (user as (UserDetail & { delFlag?: string }) | null)?.delFlag ??
      user?.delflag ??
      "";
    return String(deletedFlag).toUpperCase() === "A";
  }, [user]);

  const handleStartChat = () => {
    if (!targetUserId) {
      alert("유효하지 않은 사용자 ID입니다.");
      return;
    }
    router.push(`/global/chat/personal/${targetUserId}`);
  };

  const handleDeleteAccount = async () => {
    if (!targetUserId) return;
    if (!window.confirm("해당 계정을 삭제(탈퇴) 처리하시겠습니까?")) return;

    try {
      await deleteUser(targetUserId);
      alert("계정 삭제 처리가 완료되었습니다.");
      await loadData();
    } catch (error) {
      console.error("계정 삭제 실패:", error);
      alert("삭제 처리 중 오류가 발생했습니다.");
    }
  };

  const handleRestoreAccount = async () => {
    if (!targetUserId) return;
    if (!window.confirm("삭제된 계정을 복구하시겠습니까?")) return;

    try {
      await restoreUser(targetUserId);
      alert("계정 복구가 완료되었습니다.");
      await loadData();
    } catch (error) {
      console.error("계정 복구 실패:", error);
      alert("복구 처리 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center text-slate-400 font-medium italic">
        회원 정보를 불러오는 중입니다...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-20 text-center text-slate-400">
        해당 회원 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-24 px-4">
      <header className="flex justify-between items-center py-2">
        <button
          onClick={() => router.back()}
          className="group inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">
            ←
          </span>
          목록으로 돌아가기
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleStartChat}
            className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-bold transition-all"
          >
            채팅 시작
          </button>
          {!isDeleted ? (
            <button
              onClick={handleDeleteAccount}
              className="px-5 py-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl text-sm font-bold border border-red-100 transition-all"
            >
              계정 삭제하기
            </button>
          ) : (
            <button
              onClick={handleRestoreAccount}
              className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 transition-all"
            >
              계정 복구하기
            </button>
          )}
        </div>
      </header>

      <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex items-center justify-between relative overflow-hidden">
        <div
          className={`absolute left-0 top-0 bottom-0 w-2 ${
            !isDeleted ? "bg-blue-500" : "bg-slate-300"
          }`}
        />
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
            {user.isOwner === "DRIVER" ? "D" : "S"}
          </div>
          <div>
            <span
              className={`text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                !isDeleted
                  ? "bg-blue-50 text-blue-500"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {!isDeleted ? "Active Account" : "Deleted Account"}
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              {user.nickname}{" "}
              <span className="text-slate-400 font-normal text-lg">
                회원 정보
              </span>
            </h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-bold mb-1">MEMBER ID</p>
          <p className="text-xl font-black text-slate-800">#{user.userId}</p>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-6">
          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-500 rounded-full" /> 기본 인적
                사항
              </h2>
            </div>
            <div className="p-8 grid grid-cols-2 gap-6">
              <InfoBlock
                label="나이 / 성별"
                value={`${user.age ?? "-"} / ${user.gender ?? "-"}`}
              />
              <InfoBlock label="가입일" value={user.enrolldate || "-"} />
              <InfoBlock label="이메일" value={user.email || "-"} />
              <InfoBlock label="연락처" value={user.phone || "-"} />
            </div>
          </section>

          {user.isOwner === "DRIVER" ? (
            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-amber-400 rounded-full" /> 차주
                  운행 정보
                </h2>
              </div>
              <div className="p-8 grid grid-cols-2 gap-6">
                <InfoBlock
                  label="차량 정보"
                  value={`${user.carType ?? "-"} ${user.tonnage ?? "-"}톤`}
                />
                <InfoBlock label="차량 번호" value={user.carNum || "-"} />
                <InfoBlock label="은행" value={user.bankName || "-"} />
                <InfoBlock label="계좌" value={user.accountNum || "-"} />
              </div>
            </section>
          ) : (
            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-indigo-500 rounded-full" /> 화주
                  사업자 정보
                </h2>
              </div>
              <div className="p-8 grid grid-cols-2 gap-6">
                <InfoBlock label="회사명" value={user.companyName || "-"} />
                <InfoBlock
                  label="사업자등록번호"
                  value={user.bizRegNum || "-"}
                />
                <InfoBlock label="대표자명" value={user.representative || "-"} />
                <InfoBlock
                  label="총 운행 건수"
                  value={`${user.totalOperationCount ?? 0} 건`}
                />
              </div>
            </section>
          )}
        </div>

        <div className="col-span-4 space-y-6">
          <UserProfileCard user={user} />
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
      <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-700 break-words">
        {value || "-"}
      </p>
    </div>
  );
}
