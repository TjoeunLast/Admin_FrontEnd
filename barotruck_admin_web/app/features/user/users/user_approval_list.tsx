// user_approval_list.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  userId?: number;
  nickname: string;
  phone: string;
  email: string;
  role: "ADMIN" | "DRIVER" | "SHIPPER";
  enrolldate: string;
  delflag: string;
}

interface UserApprovalListProps {
  searchKeyword: string;
  filterRole: string;
  users: User[];
  isLoading: boolean;
}

const getRoleDetails = (role: string) => {
  const upperRole = role?.toUpperCase();
  switch (upperRole) {
    case "ADMIN": return { label: "관리자", color: "bg-slate-100 text-slate-600" };
    case "DRIVER": return { label: "차주", color: "bg-blue-50 text-blue-600" };
    case "SHIPPER": return { label: "화주", color: "bg-purple-50 text-purple-600" };
    default: return { label: "일반", color: "bg-slate-50 text-slate-500" };
  }
};

export default function UserApprovalList({ searchKeyword, filterRole, users = [], isLoading }: UserApprovalListProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredData = useMemo(() => users.filter(user => {
    const keyword = searchKeyword.toLowerCase();
    const matchesKeyword = !searchKeyword || user.nickname?.toLowerCase().includes(keyword) || user.phone?.includes(keyword) || user.email?.toLowerCase().includes(keyword);
    const matchesRole = filterRole === "전체 회원" || (filterRole === "차주" && user.role === "DRIVER") || (filterRole === "화주" && user.role === "SHIPPER") || (filterRole === "관리자" && user.role === "ADMIN");
    return matchesKeyword && matchesRole;
  }), [filterRole, searchKeyword, users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, searchKeyword, users.length]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredData]);

  if (isLoading) return <div className="p-10 text-center text-slate-400 font-medium">데이터 로드 중...</div>;

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="p-4 font-bold text-slate-400 text-center w-16 text-[11px] uppercase">번호</th>
            <th className="p-4 font-bold text-slate-400 text-center text-[11px] uppercase">구분</th>
            <th className="p-4 font-bold text-slate-400 text-center text-[11px] uppercase">이름</th>
            <th className="p-4 font-bold text-slate-400 text-center text-[11px] uppercase">연락처</th>
            <th className="p-4 font-bold text-slate-400 text-center text-[11px] uppercase">이메일</th>
            <th className="p-4 font-bold text-slate-400 text-center text-[11px] uppercase">가입일</th>
            <th className="p-4 font-bold text-slate-400 text-center text-[11px] uppercase">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paginatedData.length > 0 ? (
            paginatedData.map((user, index) => {
              const roleInfo = getRoleDetails(user.role);

              // ✅ 핵심 수정: 'A'일 때 비활성 배지 표시
              const isInactive = user.delflag?.toUpperCase() === 'A';
              
              return (
                <tr key={user.userId || index} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => user.userId && router.push(`/global/users/${user.userId}`)}>
                  <td className="p-4 text-slate-400 text-center font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${roleInfo.color}`}>{roleInfo.label}</span>
                  </td>
                  <td className="p-4 text-slate-900 font-bold text-center">{user.nickname}</td>
                  <td className="p-4 text-slate-500 text-center">{user.phone}</td>
                  <td className="p-4 text-slate-500 text-center">{user.email}</td>
                  <td className="p-4 text-slate-400 text-center">{user.enrolldate}</td>
                  <td className="p-4 text-center">
                    {/* ✅ 비활성 상태('A')일 때 빨간색, 아닐 때 초록색 배지 */}
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${
                      isInactive 
                      ? 'bg-red-50 text-red-500 border-red-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}> 
                      {isInactive ? '비활성' : '활성'}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr><td colSpan={7} className="p-20 text-center text-slate-400">검색 결과가 없습니다.</td></tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50/40 px-6 py-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`h-9 min-w-9 rounded-lg px-3 text-sm font-bold ${
                currentPage === page
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-500"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            다음
          </button>
        </div>
      ) : null}
    </div>
  );
}
