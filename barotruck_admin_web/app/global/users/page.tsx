"use client";

import { useEffect, useState, useMemo } from "react";
import UserApprovalList from "../../features/user/users/user_approval_list";
import { getUsers } from "@/app/features/shared/api/user_api";

type SortConfig = {
  key: "userId" | "enrolldate";
  direction: "asc" | "desc" | null;
};

export default function UserPage() {
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체 회원");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "userId",
    direction: "desc",
  });

  useEffect(() => {
    getUsers()
      .then((data) => {
        setUserList(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("회원 목록 로드 실패:", err);
        setLoading(false);
      });
  }, []);

  /* 정렬 핸들러 */
  const requestSort = (key: SortConfig["key"]) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  /* 필터링 및 정렬 */
  const filteredUsers = useMemo(() => {
    const result = userList.filter((user) => {
      const keyword = searchTerm.toLowerCase();
      const matchesKeyword =
        !searchTerm ||
        user.nickname?.toLowerCase().includes(keyword) ||
        user.phone?.includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        String(user.userId).includes(keyword);

      const matchesRole =
        statusFilter === "전체 회원" ||
        (statusFilter === "차주" && user.role?.toUpperCase() === "DRIVER") ||
        (statusFilter === "화주" && user.role?.toUpperCase() === "SHIPPER") ||
        (statusFilter === "관리자" && user.role?.toUpperCase() === "ADMIN");

      return matchesKeyword && matchesRole;
    });

    if (sortConfig.direction !== null) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [userList, searchTerm, statusFilter, sortConfig]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage),
  );
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [currentPage, filteredUsers]);

  const stats = useMemo(
    () => ({
      active: userList.filter((u) => u.delflag?.toUpperCase() === "N").length,
      inactive: userList.filter((u) => u.delflag?.toUpperCase() === "A").length,
      driver: userList.filter((u) => u.role?.toUpperCase() === "DRIVER").length,
      shipper: userList.filter((u) => u.role?.toUpperCase() === "SHIPPER")
        .length,
    }),
    [userList],
  );

  if (loading)
    return (
      <div className="p-20 text-center text-slate-400 font-black text-lg">
        데이터 분석 중...
      </div>
    );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
      <header className="mb-8 pl-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          회원 자격 관리
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-400">
          서비스 가입 회원의 승인 상태 및 자격 요건을 관리합니다.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">활성 회원</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-emerald-600">
              {stats.active}
            </p>
            <span className="text-sm font-medium text-slate-400">명</span>
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">비활성 회원</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-rose-600">{stats.inactive}</p>
            <span className="text-sm font-medium text-slate-400">명</span>
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">전체 차주</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-blue-600">{stats.driver}</p>
            <span className="text-sm font-medium text-slate-400">명</span>
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">전체 화주</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-[#4E46E5]">{stats.shipper}</p>
            <span className="text-sm font-medium text-slate-400">명</span>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-6 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="w-48 flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            권한 필터
          </label>
          <div className="relative">
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:border-[#4E46E5] transition-all"
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              {["전체 회원", "차주", "화주", "관리자"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-[300px] flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            회원 통합 검색
          </label>
          <input
            type="text"
            placeholder="이름, 연락처, 이메일, 회원번호 검색"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#4E46E5] transition-all placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white overflow-hidden shadow-sm">
        <UserApprovalList
          users={paginatedUsers}
          isLoading={loading}
          sortConfig={sortConfig}
          onRequestSort={requestSort}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-8 py-8 border-t border-slate-100 bg-white font-black">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-sm text-slate-400 disabled:opacity-20 hover:text-slate-900 transition-all active:scale-90"
            >
              이전
            </button>
            <div className="flex gap-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`text-sm transition-all ${currentPage === num ? "text-slate-900 underline underline-offset-8 decoration-[3px]" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {num}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-sm text-slate-400 disabled:opacity-20 hover:text-slate-900 transition-all active:scale-90"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
