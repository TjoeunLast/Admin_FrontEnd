"use client";

import { useRouter } from "next/navigation";

const getRoleDetails = (role: string) => {
  const upperRole = role?.toUpperCase();
  switch (upperRole) {
    case "ADMIN":
    case "ADMIN":
      return {
        label: "관리자",
        color: "text-slate-500",
      };
    case "DRIVER":
      return {
        label: "차주",
        color: "text-blue-600",
      };
    case "SHIPPER":
      return {
        label: "화주",
        color: "text-indigo-600",
      };
    default:
      return {
        label: "일반",
        color: "text-slate-400",
      };
  }
};

export default function UserApprovalList({
  users = [],
  isLoading,
  sortConfig = { key: "userId", direction: "desc" },
  onRequestSort,
}: any) {
  const router = useRouter();

  if (isLoading)
    return (
      <div className="p-20 text-center text-slate-400 font-black text-lg">
        데이터 로드 중...
      </div>
    );

  return (
    <div className="bg-white overflow-hidden">
      <table className="w-full text-left border-collapse table-fixed">
        <thead className="bg-slate-50/50 border-b border-slate-200">
          <tr className="text-[12px] font-black text-slate-500 uppercase tracking-widest">
            {/* 회원번호 정렬 */}
            <th
              onClick={() => onRequestSort?.("userId")}
              className="p-6 text-center w-32 cursor-pointer hover:text-[#4E46E5] transition-colors"
            >
              회원번호{" "}
              <span
                className={
                  sortConfig?.key === "userId"
                    ? "text-[#4E46E5]"
                    : "text-slate-200"
                }
              >
                {sortConfig?.key === "userId" && sortConfig?.direction === "asc"
                  ? "▲"
                  : "▼"}
              </span>
            </th>
            <th className="p-6 text-center w-32">구분</th>
            <th className="p-6 text-center">이름</th>
            <th className="p-6 text-center w-[20%]">연락처</th>
            <th className="p-6 text-center w-[22%]">이메일</th>
            {/* 가입일 정렬 */}
            <th
              onClick={() => onRequestSort?.("enrolldate")}
              className="p-6 text-center w-[15%] cursor-pointer hover:text-[#4E46E5] transition-colors"
            >
              가입일{" "}
              <span
                className={
                  sortConfig?.key === "enrolldate"
                    ? "text-[#4E46E5]"
                    : "text-slate-200"
                }
              >
                {sortConfig?.key === "enrolldate" &&
                sortConfig?.direction === "asc"
                  ? "▲"
                  : "▼"}
              </span>
            </th>
            <th className="p-6 text-center w-32">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user: any) => {
            const roleInfo = getRoleDetails(user.role);
            const isInactive = user.delflag?.toUpperCase() === "A";

            return (
              <tr
                key={user.userId}
                className="odd:bg-white even:bg-slate-50/30 hover:bg-indigo-50/50 cursor-pointer transition-all group"
                onClick={() =>
                  user.userId && router.push(`/global/users/${user.userId}`)
                }
              >
                <td className="p-6 text-slate-900 text-center text-sm font-black border-r border-slate-50">
                  #{user.userId}
                </td>
                <td className="p-6 text-center">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase ${roleInfo.color} text-[15px]`}
                  >
                    {roleInfo.label}
                  </span>
                </td>
                <td className="p-6 text-slate-900 font-black text-center text-[15px]">
                  <div
                    className="truncate mx-auto w-full max-w-[100px] min-w-[60px]"
                    title={user.nickname}
                  >
                    {user.nickname}
                  </div>
                </td>
                <td className="p-6 text-slate-700 text-center text-sm font-bold tracking-tight">
                  {user.phone}
                </td>
                <td className="p-6 text-slate-500 text-center text-sm font-medium truncate">
                  {user.email}
                </td>
                <td className="p-6 text-slate-400 text-center text-sm font-medium">
                  {user.enrolldate?.split("T")[0] || user.enrolldate}
                </td>
                <td className="p-6 text-center">
                  <span
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black border ${
                      isInactive
                        ? "bg-rose-50 text-rose-600 border-rose-100"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    }`}
                  >
                    {isInactive ? "비활성" : "활성"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
