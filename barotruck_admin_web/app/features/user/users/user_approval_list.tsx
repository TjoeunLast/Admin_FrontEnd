"use client"

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

// 백엔드 UserResponseDto 구조 반영
interface User {
  userId: number;
  nickname: string;
  phone: string;
  email: string;
  userLevel: number; // 1: 차주, 2: 화주
  enrollDate: string;
  regFlag: string;   // 'Y' 또는 'N' (승인 여부로 활용 가능)
}

export default function UserApprovalList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("토큰 없다");
        const response = await axios.get("api/user", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-500">데이터를 불러오는 중...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="p-4 text-xs font-bold text-slate-500 text-center uppercase tracking-wider">구분</th>
            <th className="p-4 text-xs font-bold text-slate-500 text-center uppercase tracking-wider">이름(닉네임)</th>
            <th className="p-4 text-xs font-bold text-slate-500 text-center uppercase tracking-wider">연락처</th>
            <th className="p-4 text-xs font-bold text-slate-500 text-center uppercase tracking-wider">이메일</th>
            <th className="p-4 text-xs font-bold text-slate-500 text-center uppercase tracking-wider">가입일</th>
            <th className="p-4 text-xs font-bold text-slate-500 text-center uppercase tracking-wider">상태</th>
            <th className="p-4 text-xs font-bold text-slate-500 text-center uppercase tracking-wider">관리</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {users.map((user) => (
            <tr key={user.userId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="p-4 text-center">
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${user.userLevel === 1 ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {user.userLevel === 1 ? '차주' : '화주'}
                </span>
              </td>
              <td className="p-4 text-slate-800 font-medium text-center">{user.nickname}</td>
              <td className="p-4 text-slate-500 text-center">{user.phone}</td>
              <td className="p-4 text-slate-500 text-center">{user.email}</td>
              <td className="p-4 text-slate-400 text-center">{new Date(user.enrollDate).toLocaleDateString()}</td>
              <td className="p-4 text-center">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                  user.regFlag === 'Y' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                }`}>
                  {user.regFlag === 'Y' ? '정상' : '승인대기'}
                </span>
              </td>
              <td className="p-4 text-center">
                <Link href={`/global/users/${user.userId}`} className="font-bold text-[#0143f8] hover:text-blue-600 hover:underline">
                  상세보기
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}