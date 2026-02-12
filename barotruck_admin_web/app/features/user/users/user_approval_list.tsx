"use client";

import { useEffect, useState } from "react";
import { getUsers } from "@/app/features/shared/api/user_api";

// 사용자 타입 정의
interface User {
  userId: number;
  nickname: string;
  phone: string;
  email: string;
  userLevel: number; // 1: 차주, 2: 화주
  enrollDate: string;
  regFlag: string;   // 'Y': 정상, 'N': 승인대기
}

// ✅ Props 정의: page.tsx에서 전달받는 검색어와 필터
interface UserApprovalListProps {
  searchKeyword: string;
  filterRole: string;
}

export default function UserApprovalList({ searchKeyword, filterRole }: UserApprovalListProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]); // 전체 데이터
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]); // 필터링된 데이터
  const [loading, setLoading] = useState(true);

  // 1. 초기 데이터 로드
  useEffect(() => {
    getUsers().then(data => {
      setAllUsers(data);
      setFilteredUsers(data);
      setLoading(false);
    });
  }, []);

  // 2. 검색어 및 필터 변경 시 데이터 필터링
  useEffect(() => {
    let result = allUsers;

    // 역할 필터링 ("전체 회원", "차주", "화주")
    if (filterRole === "차주") {
      result = result.filter(u => u.userLevel === 1);
    } else if (filterRole === "화주") {
      result = result.filter(u => u.userLevel === 2);
    }

    // 검색어 필터링 (이름, 연락처, 이메일)
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(u => 
        u.nickname.toLowerCase().includes(keyword) || 
        u.phone.includes(keyword) ||
        u.email.toLowerCase().includes(keyword)
      );
    }

    setFilteredUsers(result);
  }, [searchKeyword, filterRole, allUsers]);

  if (loading) return <div className="p-10 text-center text-slate-500">데이터를 불러오는 중...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="p-4 font-bold text-slate-600 text-center w-16">번호</th>
            <th className="p-4 font-bold text-slate-600 text-center">구분</th>
            <th className="p-4 font-bold text-slate-600 text-center">이름(닉네임)</th>
            <th className="p-4 font-bold text-slate-600 text-center">연락처</th>
            <th className="p-4 font-bold text-slate-600 text-center">이메일</th>
            <th className="p-4 font-bold text-slate-600 text-center">가입일</th>
            <th className="p-4 font-bold text-slate-600 text-center">상태</th>
            <th className="p-4 font-bold text-slate-600 text-center">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-500 text-center">{index + 1}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${user.userLevel === 1 ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {user.userLevel === 1 ? '차주' : '화주'}
                  </span>
                </td>
                <td className="p-4 text-slate-800 font-medium text-center">{user.nickname}</td>
                <td className="p-4 text-slate-500 text-center">{user.phone}</td>
                <td className="p-4 text-slate-500 text-center">{user.email}</td>
                <td className="p-4 text-slate-400 text-center">{user.enrollDate}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                    user.regFlag === 'Y' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>
                    {user.regFlag === 'Y' ? '정상' : '승인대기'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button className="text-blue-600 hover:underline font-semibold text-xs">상세보기</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="p-10 text-center text-slate-400">검색 결과가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}