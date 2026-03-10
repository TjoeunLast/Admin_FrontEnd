"use client";

import { useEffect, useState } from "react";
import UserApprovalList from "../../features/user/users/user_approval_list";
import { getUsers } from "@/app/features/shared/api/user_api";

export default function UserPage() {
  const [searchKeyword] = useState("");
  const [filterRole] = useState("전체 회원");
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then((data) => {
        setUserList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("회원 목록 로드 실패:", err);
        setLoading(false);
      });
  }, []);

  // 통계 계산
  const activeCount = userList.filter(
    (user) => user.delflag?.toUpperCase() === "N",
  ).length;
  const inactiveCount = userList.filter(
    (user) => user.delflag?.toUpperCase() === "A",
  ).length;
  const driverCount = userList.filter(
    (user) => user.role?.toUpperCase() === "DRIVER",
  ).length;
  const shipperCount = userList.filter(
    (user) => user.role?.toUpperCase() === "SHIPPER",
  ).length;

  if (loading)
    return (
      <div className="p-10 text-center text-slate-500 font-medium">
        회원 데이터를 불러오는 중입니다...
      </div>
    );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* 상단 헤더 */}
      <header className="mb-8 pl-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          회원 자격 관리
        </h1>
      </header>

      {/* 상단 통계 위젯 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">활성 회원</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-emerald-600">{activeCount}</p>
            <span className="text-sm font-medium text-slate-400">명</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">비활성 회원</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-rose-600">{inactiveCount}</p>
            <span className="text-sm font-medium text-slate-400">명</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">전체 차주</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-blue-600">{driverCount}</p>
            <span className="text-sm font-medium text-slate-400">명</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">전체 화주</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-[#4E46E5]">{shipperCount}</p>
            <span className="text-sm font-medium text-slate-400">명</span>
          </div>
        </div>
      </div>

      {/* 3. 리스트 영역 */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <UserApprovalList
          users={userList}
          searchKeyword={searchKeyword}
          filterRole={filterRole}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
