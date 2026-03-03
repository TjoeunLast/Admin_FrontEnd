"use client";

// ✅ 1. 인터페이스 설계도 수정
export interface UserDetail {
  userId: number;
  email: string;
  nickname: string;
  phone: string;
  enrolldate: string;
  delflag: string; // ✅ delflag -> delFlag로 통일 (대소문자 주의)
  isOwner: string; 
  age?: number;
  gender?: string;
  imageUrl?: string | null;
  carNum?: string;
  carType?: string;
  tonnage?: number;
  bankName?: string;
  accountNum?: string;
  companyName?: string;
  bizRegNum?: string;
  representative?: string;
  totalOperationCount?: number; //
}

interface Props {
  user: UserDetail;
}

export default function UserProfileCard({ user }: Props) {
  const roleLabel = user.isOwner === 'DRIVER' ? '차주' : user.isOwner === 'SHIPPER' ? '화주' : '관리자';

  // ✅ 2. DB 값 기준: 'A'면 비활성(Deleted)
  const isDeleted = user.delflag?.toUpperCase() === "A";

  return (
    <div className="w-full lg:w-80 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm h-full flex flex-col">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 overflow-hidden border">
          {user.imageUrl ? <img src={user.imageUrl} className="w-full h-full object-cover" /> : <span className="text-3xl text-slate-300">👤</span>}
        </div>
        <h2 className="text-xl font-bold text-slate-800">{user.nickname}</h2>
        <span className="text-blue-600 text-xs font-bold mt-1">{roleLabel}</span>
      </div>

      <div className="space-y-6 flex-1">
        <InfoItem label="연락처" value={user.phone} />
        <InfoItem label="이메일" value={user.email} />
        <InfoItem label="가입일" value={user.enrolldate} />
      </div>

      <div className="pt-6 border-t border-slate-100 mt-auto">
         <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400">계정 상태</span>
            {/* ✅ DB 데이터 연동: 'A'일 때 빨간색 비활성 배지 표시 */}
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              isDeleted ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
            }`}>
              {isDeleted ? "비활성 (Deleted)" : "정상 (Active)"}
            </span>
         </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value || "-"}</p>
    </div>
  );
}