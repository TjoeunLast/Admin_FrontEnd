"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { reviewApi, ReviewResponse } from "@/app/features/shared/api/review_api";

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(0);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const data = await reviewApi.getDetail(Number(params.id));
        setReview(data);
        setEditContent(data.content);
        setEditRating(data.rating);
      } catch (error) {
        console.error("데이터 로드 실패", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDetail();
  }, [params.id]);

  const handleUpdate = async () => {
    if (!window.confirm("리뷰 내용을 수정하시겠습니까?")) return;
    try {
      const success = await reviewApi.updateReview(Number(params.id), {
        rating: editRating,
        content: editContent
      });
      if (success) {
        alert("리뷰가 성공적으로 수정되었습니다.");
        router.refresh();
      }
    } catch (error) {
      alert("수정 권한이 없거나 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("이 리뷰를 영구 삭제하시겠습니까?")) return;
    try {
      const success = await reviewApi.deleteReview(Number(params.id));
      if (success) {
        alert("리뷰가 삭제되었습니다.");
        router.push('/global/support?tab=review');
      }
    } catch (error) {
      alert("삭제 권한이 없거나 오류가 발생했습니다.");
    }
  };

  if (isLoading) return <div className="p-20 text-center text-slate-400 font-medium italic">데이터를 동기화 중입니다...</div>;
  if (!review) return <div className="p-20 text-center text-slate-400">해당 리뷰를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-24 px-4">
      
      {/* 1. 상단 액션바 (목록 가기 + 삭제) */}
      <header className="flex justify-between items-center py-2">
        <button 
          onClick={() => router.push('/global/support?tab=review')}
          className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> 목록으로 돌아가기
        </button>
        <button 
          onClick={handleDelete}
          className="px-5 py-2 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all"
        >
          리뷰 삭제하기
        </button>
      </header>

      {/* 2. 리뷰 대상(Target) 하이라이트 섹션 */}
      <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex items-center justify-between overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500" />
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">🚛</span>
          </div>
          <div className="mr-20 px-4 py-1 bg-slate-50 rounded-full text-sm font-medium text-slate-500">
            <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Review Writer</span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              작성자: <span className="text-blue-600">{review.writerNickname || "정보 없음"}</span>
            </h1>
          </div>

          <div className="ml-10 px-4 py-1 bg-slate-50 rounded-full text-sm font-medium text-slate-500">
            <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Review Target</span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              대상자: <span className="text-blue-600">{review.targetNickname || "정보 없음"}</span>
            </h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-bold mb-1">CURRENT RATING</p>
          <div className="flex gap-0.5 justify-end">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`text-xl ${s <= review.rating ? "text-amber-400" : "text-slate-100"}`}>★</span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-8">
        {/* 3. 메인 편집 영역 */}
        <div className="col-span-8 space-y-6">
          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">내용 수정 및 별점 조정</h2>
              <div className="flex gap-1 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setEditRating(s)}
                    className={`text-2xl px-1 transition-all hover:scale-125 ${s <= editRating ? "text-amber-400" : "text-slate-200"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8">
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-64 p-8 bg-slate-50 border border-slate-200 rounded-[2rem] text-[17px] text-slate-700 leading-relaxed focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none"
                placeholder="관리자로서 리뷰 내용을 수정할 수 있습니다..."
              />
            </div>

            <div className="px-8 pb-8">
              <button 
                onClick={handleUpdate}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold text-base hover:bg-blue-600 shadow-lg shadow-slate-200 transition-all active:scale-[0.98]"
              >
                수정 사항 저장 및 즉시 반영
              </button>
            </div>
          </section>
        </div>

        {/* 4. 정보 사이드바 */}
        <div className="col-span-4 space-y-6">
          <aside className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Reviewer Profile</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-black text-lg">
                {review.writerNickname[0]}
              </div>
              <div>
                <p className="font-bold text-slate-900">{review.writerNickname}</p>
                <p className="text-[11px] text-slate-400">Writer Nickname</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Review ID</p>
                <p className="text-sm font-bold text-slate-700">#{review.reviewId}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Registration</p>
                <p className="text-sm font-bold text-slate-700">{new Date(review.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </aside>

          <aside className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl">
            <h3 className="text-[11px] font-black text-blue-100 uppercase tracking-widest mb-4">Management Policy</h3>
            <ul className="text-xs space-y-3 opacity-90 leading-relaxed">
              <li className="flex gap-2"><span>•</span> <span>수정된 내용은 사용자 앱에 실시간으로 업데이트됩니다.</span></li>
              <li className="flex gap-2"><span>•</span> <span>허위 사실 유포나 개인정보가 포함된 리뷰는 삭제를 권장합니다.</span></li>
              <li className="flex gap-2"><span>•</span> <span>기사님에 대한 정당한 비판은 가급적 보존해 주세요.</span></li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}