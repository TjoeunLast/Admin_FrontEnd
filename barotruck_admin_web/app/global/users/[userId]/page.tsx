"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserDetail, deleteUser, restoreUser } from "@/app/features/shared/api/user_api";
import UserProfileCard, { UserDetail } from "@/app/features/user/users/user_profile_card";

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ 브라우저 콘솔에서 확인된 키값 'userId'를 사용합니다.
  const currentUserId = params?.userId;

  const loadData = async () => {
    try {
      const data = await getUserDetail(Number(currentUserId));
      console.log("서버 응답 데이터:", data);
      setUser(data);
    } catch (error) {
      console.error("데이터 로드 실패", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      loadData();
    }
  }, [currentUserId]);

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말 이 계정을 삭제(탈퇴) 처리하시겠습니까?")) return;
    try {
      await deleteUser(Number(currentUserId));
      alert("계정이 삭제 처리되었습니다.");
      loadData(); 
    } catch (error) {
      alert("삭제 처리 중 오류가 발생했습니다.");
    }
  };

  const handleRestoreAccount = async () => {
    if (!window.confirm("이 계정을 다시 활성화하시겠습니까?")) return;
    try {
      await restoreUser(Number(currentUserId));
      alert("계정이 성공적으로 복구되었습니다.");
      loadData();
    } catch (error) {
      alert("복구 처리 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) return <div className="p-20 text-center text-slate-400 font-medium italic">회원 데이터를 불러오는 중...</div>;
  if (!user) return <div className="p-20 text-center text-slate-400">해당 회원을 찾을 수 없습니다.</div>;

  // ✅ DB 구조 반영: 'A'가 비활성(Deleted)입니다.
  // API 응답에 따라 delFlag 또는 delflag를 모두 체크하도록 방어 코드를 짭니다.
  const isDeleted = (user?.delflag || user?.delflag)?.toUpperCase() === 'A';

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-24 px-4">
      
      {/* 1. 상단 액션바 */}
      <header className="flex justify-between items-center py-2">
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> 목록으로 돌아가기
        </button>
        <div className="flex gap-2">
          {/* ✅ 삭제되지 않은 상태일 때만 '삭제' 버튼 노출 */}
          {!isDeleted ? (
            <button onClick={handleDeleteAccount} className="px-5 py-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl text-sm font-bold border border-red-100 transition-all">계정 삭제하기</button>
          ) : (
            <button onClick={handleRestoreAccount} className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 transition-all">계정 복구하기</button>
          )}
        </div>
      </header>

      {/* 2. 상단 하이라이트 섹션 */}
      <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex items-center justify-between relative overflow-hidden">
        {/* ✅ 색상 로직 수정: 삭제됨(isDeleted)이면 회색(slate), 활성이면 파란색(blue) */}
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${!isDeleted ? 'bg-blue-500' : 'bg-slate-300'}`} />
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
            {user.isOwner === 'DRIVER' ? '🚛' : '👤'}
          </div>
          <div>
            <span className={`text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${!isDeleted ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500'}`}>
                {!isDeleted ? 'Active Account' : 'Deleted Account'}
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              {user.nickname} <span className="text-slate-400 font-normal text-lg">님의 정보</span>
            </h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-bold mb-1">MEMBER RATING</p>
          <div className="flex gap-1 justify-end items-center">
             <span className="text-2xl font-black text-amber-400">5.0</span>
             <span className="text-amber-400 text-xl">★</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-6">
          {/* 3. 기본 인적 사항 */}
          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-500 rounded-full" /> 기본 인적 사항
              </h2>
            </div>
            <div className="p-8 grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[11px] text-slate-400 font-bold uppercase">나이 / 성별</p>
                <p className="text-base font-bold text-slate-700">{user.age || "-"}세 / {
                    user.gender === 'M' ? '남성' : 
                    user.gender === 'F' ? '여성' : 
                    (user.gender || "-")
                  }
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-slate-400 font-bold uppercase">가입 일자</p>
                <p className="text-base font-bold text-slate-700">{user.enrolldate}</p>
              </div>
            </div>
          </section>

          {/* 4. 유형별 맞춤 정보 (차주/화주) */}
          {user.isOwner === 'DRIVER' ? (
            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-amber-400 rounded-full" /> 차주 운행 정보
                </h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[11px] text-slate-400 font-bold mb-1">등록 차량</p>
                    <p className="text-sm font-bold text-slate-700">
                      {user.carType} {user.tonnage}톤 ({user.carNum || "번호 없음"})
                    </p>
                  </div>
                  <div className="p-6 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 text-white">
                    <p className="text-[11px] text-blue-100 font-bold mb-1 uppercase tracking-tight">
                      누적 운행 건수
                    </p>
                    {/* ✅ 데이터가 없을 경우를 대비해 옵셔널 체이닝(?.)과 기본값(0) 설정 */}
                    <p className="text-2xl font-black">
                      {user.totalOperationCount?.toLocaleString() || 0} 
                      <span className="text-sm font-normal opacity-80 ml-1">건 완료</span>
                    </p>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[11px] text-slate-400 font-bold mb-1">정산 계좌 정보</p>
                  <p className="text-sm font-bold text-slate-800">{user.bankName} {user.accountNum}</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-indigo-500 rounded-full" /> 화주 사업자 정보
                </h2>
              </div>
              <div className="p-8 space-y-4">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase">회사명</p>
                  <p className="text-base font-bold text-slate-700">{user.companyName || "미등록"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase">사업자 등록번호</p>
                    <p className="text-sm font-bold text-slate-700">{user.bizRegNum || "정보 없음"}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase">대표자명</p>
                    <p className="text-sm font-bold text-slate-700">{user.representative || "정보 없음"}</p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 5. 우측 사이드바 */}
        <div className="col-span-4 space-y-6">
          <UserProfileCard user={user} />
          <aside className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100">
            <h3 className="text-[11px] font-black text-blue-100 uppercase tracking-widest mb-4">Admin Policy</h3>
            <ul className="text-xs space-y-3 opacity-90 leading-relaxed">
              <li className="flex gap-2"><span>•</span> <span>비활성(A) 상태의 회원은 시스템 로그인이 차단됩니다.</span></li>
              <li className="flex gap-2"><span>•</span> <span>정상(N) 복구 시 즉시 모든 서비스 이용이 가능해집니다.</span></li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}