"use client";

import { useEffect, useState } from "react";
import { reviewApi, ReviewResponse } from "@/app/features/shared/api/review_api";
import { useRouter } from "next/navigation";

export default function ReviewList() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await reviewApi.getAll();
        setReviews(data);
      } catch (error) {
        console.error("리뷰 목록을 불러오는데 실패했습니다.", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadReviews();
  }, []);

  // 별점 렌더링 함수 (배지 스타일 추가)
  const renderStars = (rating: number) => {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-500 border border-amber-100">
        <span className="mr-1">★</span>
        {rating}.0
      </div>
    );
  };

  if (isLoading) return <div className="p-10 text-center text-slate-400 text-sm">리뷰 데이터를 로딩 중입니다...</div>;

  return (
    <div className="flex flex-col gap-4">
      {reviews.length > 0 ? (
        reviews.map((review) => (
          <div
            key={review.reviewId}
            className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            {/* 왼쪽 강조 라인 (세번째 사진 스타일) */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400" />
            
            <div className="p-6 pl-8 flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* 별점 배지 */}
                  {renderStars(review.rating)}
                  <span className="text-sm font-bold text-slate-900">
                    작성자: {review.writerNickname}
                  </span>
                </div>
                
                {/* 리뷰 내용 */}
                <p className="text-[15px] text-slate-600 mb-3 leading-relaxed">
                  {review.content}
                </p>
                
                {/* 하단 정보 */}
                <div className="flex items-center text-[13px] text-slate-400">
                  <span className="mr-2">등록일:</span>
                  <span>{new Date(review.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* 우측 버튼 (세번째 사진의 '회원 정보 확인' 스타일) */}
              <button
                onClick={() => router.push(`/global/support/review/${review.reviewId}`)}
                className="ml-6 px-5 py-2.5 bg-[#1e293b] text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shrink-0"
              >
                상세 보기
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="p-20 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 text-sm">
          등록된 리뷰가 없습니다.
        </div>
      )}
    </div>
  );
}