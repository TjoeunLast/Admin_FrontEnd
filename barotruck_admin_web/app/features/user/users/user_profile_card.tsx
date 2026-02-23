// app/global/users/[id]/user_profile_card.tsx

// ✅ export를 추가하여 외부에서 사용할 수 있게 합니다.
export interface UserDetail {
  userId: number;
  age: number;
  email: string;
  enrolldate: string; 
  gender: string;     
  nickname: string;
  phone: string;
  imageUrl: string | null;
  ratingAvg: number;
  regflag: string;    
  isOwner: "ADMIN" | "DRIVER" | "SHIPPER"; 
  userLevel: number;
}

interface Props {
  user: UserDetail;
}

export default function UserProfileCard({ user }: Props) {
  const roleLabel = user.isOwner === 'DRIVER' ? '차주' : user.isOwner === 'SHIPPER' ? '화주' : '관리자';

  return (
    <div className="w-full lg:w-80 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8 h-fit">
      {/* ... 기존 내용 동일 ... */}
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-100 overflow-hidden shadow-inner">
          {user.imageUrl ? (
            <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl text-slate-300">👤</span>
          )}
        </div>
        <h2 className="text-xl font-bold text-slate-800">{user.nickname}</h2>
        <span className="text-blue-600 text-xs font-bold mt-1">{roleLabel}</span>
      </div>

      <div className="space-y-5">
        <InfoItem label="연락처" value={user.phone || "미등록"} />
        <InfoItem label="이메일" value={user.email} />
        <InfoItem label="가입신청일" value={user.enrolldate} />
        <InfoItem label="차량정보" value="5톤 카고 / 12가 3456" />
        
        <div className="pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">현재 상태</p>
          <span className={`px-5 py-1.5 rounded-full font-bold text-xs border ${
            user.regflag === 'Y' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-500 border-orange-100'
          }`}>
            {user.regflag === 'Y' ? '승인 완료' : '승인 대기'}
          </span>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 text-left">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}