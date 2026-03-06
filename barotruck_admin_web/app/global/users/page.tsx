"use client";

import { useEffect, useState } from "react";
import UserApprovalList from "../../features/user/users/user_approval_list";
import { getUsers } from "@/app/features/shared/api/user_api";

export default function UserPage() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterRole, setFilterRole] = useState("전체 회원");
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers().then(data => {
      setUserList(data);
      setLoading(false);
    }).catch(err => {
      console.error("회원 목록 로드 실패:", err);
      setLoading(false);
    });
  }, []);

  // ✅ 실시간 통계 계산 로직 수정
  const activeCount = userList.filter(user => 
    user.delflag?.toUpperCase() === "N"
  ).length;
  // 비활성 회원: DB 값 'A'를 대문자로 체크 (신불출 회원 ID 65 등 집계)
  const inactiveCount = userList.filter(user => 
    user.delflag?.toUpperCase() === "A"
  ).length;
  const driverCount = userList.filter(user => user.role?.toUpperCase() === "DRIVER").length;
  const shipperCount = userList.filter(user => user.role?.toUpperCase() === "SHIPPER").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">👥 회원 자격 관리</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">실시간 데이터 연동을 통해 시스템 이용 권한을 관리합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="활성 회원" count={activeCount} color="emerald" />
        <StatCard title="비활성 회원" count={inactiveCount} color="red" />
        <StatCard title="전체 차주" count={driverCount} color="blue" />
        <StatCard title="전체 화주" count={shipperCount} color="indigo" />
      </div>

      {/* 검색 및 필터 생략 (기존 유지) */}
      <UserApprovalList users={userList} searchKeyword={searchKeyword} filterRole={filterRole} isLoading={loading} />
    </div>
  );
}

function StatCard({ title, count, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-500",
    red: "bg-red-500",
    blue: "bg-blue-600",
    indigo: "bg-indigo-600"
  };
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorMap[color]}`} />
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black text-slate-900 mt-2">{count}<span className="text-sm font-bold text-slate-400 ml-1">명</span></p>
    </div>
  );
}