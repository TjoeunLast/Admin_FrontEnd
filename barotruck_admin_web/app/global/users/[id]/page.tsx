"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getUserDetail } from "@/app/features/shared/api/user_api";
// ✅ 위젯과 인터페이스를 임포트합니다.
import UserProfileCard, { UserDetail } from "@/app/features/user/users/user_profile_card";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  // ✅ 파일명이 [id]이므로 params.id를 사용해야 합니다.
  const id = params?.id; 

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== "undefined") {
      getUserDetail(Number(id))
        .then((data) => {
          setUser(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("상세 정보 로드 실패:", err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div className="p-20 text-center text-slate-500 font-bold tracking-widest">LOADING...</div>;
  if (!user) return (
    <div className="p-20 text-center">
      <p className="text-slate-500 mb-4">사용자 정보를 찾을 수 없습니다.</p>
      <button onClick={() => router.back()} className="text-blue-600 underline font-bold">목록으로 돌아가기</button>
    </div>
  );

  return (
    <div className="p-8 space-y-6 bg-[#f8fafc] min-h-screen">
      {/* 상단 헤더: 제목 및 관리 버튼 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold flex items-center gap-3 text-slate-800">
          <button 
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all"
          >
            <span className="text-xs">◀</span>
          </button>
          회원 상세 정보 <span className="text-slate-400 font-normal ml-1">#{id}</span>
        </h1>
        <div className="flex gap-2">
          <button className="px-6 py-2.5 bg-white border border-slate-200 text-red-500 rounded-xl font-bold text-sm shadow-sm hover:bg-red-50 transition-colors">
            승인 거절
          </button>
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all">
            최종 가입 승인
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ✅ 좌측: 연동된 프로필 카드 위젯 */}
        <UserProfileCard user={user} />

        {/* ✅ 우측: 서류 검토 섹션 */}
        <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-8 tracking-tight">가입 증빙 서류 검토</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <DocumentCard title="사업자등록증" status="검토중" />
            <DocumentCard title="화물운송자격증" status="확인완료" isConfirmed />
            <DocumentCard title="자동차등록증" status="검토중" />
          </div>
        </div>
      </div>

      <p className="text-center text-slate-300 text-[11px] italic mt-10">
        * 가입 증빙 서류 상세 데이터 연동은 준비 중입니다.
      </p>
    </div>
  );
}

// 서류 카드 컴포넌트
function DocumentCard({ title, status, isConfirmed = false }: { title: string; status: string, isConfirmed?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:border-blue-200 transition-all">
      <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center text-slate-300 text-xs font-bold border-b border-slate-50 relative">
        [서류 미리보기]
      </div>
      <div className="p-5 flex justify-between items-center">
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800 text-sm">{title}</p>
          <p className={`text-[10px] font-bold ${isConfirmed ? 'text-blue-500' : 'text-slate-400'}`}>{status}</p>
        </div>
        <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
          <span className="text-lg">🔍</span>
        </button>
      </div>
    </div>
  );
}