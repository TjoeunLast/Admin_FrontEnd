"use client";

import { useEffect, useState } from "react";
import { getUsers } from "@/app/features/shared/api/user_api";
import { useRouter } from "next/navigation";

// 1. 사용자 타입 정의
interface User {
  userId: number;
  nickname: string;
  phone: string;
  email: string;
  role: "ADMIN" | "DRIVER" | "SHIPPER"; // 문자열 기준
  enrollDate: string;
  regFlag: string;   // 'Y': 정상, 'N': 승인대기
}

interface UserApprovalListProps {
  searchKeyword: string;
  filterRole: string;
}

// 2. 역할 라벨 및 스타일 함수
const getRoleDetails = (role: string) => {
  // 대소문자 구분 없이 비교하기 위해 toUpperCase() 사용
  const upperRole = role?.toUpperCase();

  switch (upperRole) {
    case "ADMIN":
      return { label: "관리자", color: "bg-gray-100 text-gray-600 border-gray-200" };
    case "DRIVER":
      return { label: "차주", color: "bg-blue-50 text-blue-600 border-blue-100" };
    case "SHIPPER":
      return { label: "화주", color: "bg-purple-50 text-purple-600 border-purple-100" };
    default:
      return { label: "일반", color: "bg-slate-50 text-slate-500 border-slate-100" };
  }
};

export default function UserApprovalList({ searchKeyword, filterRole }: UserApprovalListProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]); 
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 데이터 로드
  useEffect(() => {
    getUsers().then(data => {
      // ✅ 데이터 확인용 로그 (출력 결과가 "일반"일 경우 브라우저 콘솔을 확인하세요)
      // console.log("받아온 유저 데이터:", data);
      setAllUsers(data || []);
      setFilteredUsers(data || []);
      setLoading(false);
    }).catch(err => {
      console.error("회원 목록 로드 실패:", err);
      setLoading(false);
    });
  }, []);

  // 필터링 로직
  useEffect(() => {
    let result = [...allUsers];

    if (filterRole === "차주") {
      result = result.filter(u => u.role === "DRIVER");
    } else if (filterRole === "화주") {
      result = result.filter(u => u.role === "SHIPPER");
    } else if (filterRole === "관리자") {
      result = result.filter(u => u.role === "ADMIN");
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(u => 
        u.nickname?.toLowerCase().includes(keyword) || 
        u.phone?.includes(keyword) ||
        u.email?.toLowerCase().includes(keyword)
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
            <th className="p-4 font-bold text-slate-600 text-center">이름</th>
            <th className="p-4 font-bold text-slate-600 text-center">연락처</th>
            <th className="p-4 font-bold text-slate-600 text-center">이메일</th>
            <th className="p-4 font-bold text-slate-600 text-center">가입일</th>
            <th className="p-4 font-bold text-slate-600 text-center">상태</th>
            <th className="p-4 font-bold text-slate-600 text-center">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => {
              const roleInfo = getRoleDetails(user.role); 
              
              return (
                <tr 
                  key={user.userId || `user-${index}`} 
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => {
                    console.log("클릭한 유저의 전체 데이터:", user); // ✅ 여기서 어떤 키에 ID가 있는지 확인
                    // 만약 백엔드에서 'id'로 보내준다면 user.id를 써야 합니다.
                    router.push(`/global/users/${user.userId}`); 
                  }}
                >
                  <td className="p-4 text-slate-500 text-center">{index + 1}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded border text-[10px] font-bold ${roleInfo.color}`}>
                      {roleInfo.label}
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
                    <button 
                      className="text-blue-600 hover:underline font-semibold"
                      onClick={(e) => {
                        e.stopPropagation(); 
                        alert(`${user.nickname}님을 승인하시겠습니까?`);
                      }}
                    >
                      승인
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr key="empty-row">
              <td colSpan={8} className="p-10 text-center text-slate-400">데이터가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}