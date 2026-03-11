"use client";

import { useEffect, useState } from "react";
import {
  reviewApi,
  ReviewResponse,
} from "@/app/features/shared/api/review_api";
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
        console.error("리뷰 목록 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadReviews();
  }, []);

  const renderStars = (rating: number) => {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-500 border border-amber-100">
        <span className="mr-1 text-[10px]">★</span>
        {rating}.0
      </div>
    );
  };

  if (isLoading)
    return (
      <div className="p-20 text-center text-slate-400 font-black italic text-sm">
        데이터 로드 중...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-start gap-2 pr-1">
        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[16px] font-black text-slate-400">
          전체 리뷰{" "}
          <span className="text-slate-900 ml-1">{reviews.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr className="text-[12px] font-black text-slate-500 uppercase tracking-widest">
              <th className="p-6 text-center w-32 border-r border-slate-50">
                별점
              </th>
              <th className="p-6 text-center w-40">작성자</th>
              <th className="p-6 text-center">리뷰 내용</th>
              <th className="p-6 text-center w-52">등록 일시</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {reviews.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-20 text-center text-slate-400 font-black italic text-sm"
                >
                  등록된 리뷰가 없습니다.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr
                  key={review.reviewId}
                  onClick={() =>
                    router.push(`/global/support/review/${review.reviewId}`)
                  }
                  className="odd:bg-white even:bg-slate-50/30 hover:bg-indigo-50/50 cursor-pointer transition-all group active:bg-indigo-100/30"
                >
                  <td className="p-6 text-center border-r border-slate-50">
                    {renderStars(review.rating)}
                  </td>
                  <td className="p-6 text-slate-900 text-center text-sm font-black">
                    {review.writerNickname}
                  </td>
                  <td className="p-6 px-10">
                    <p className="text-slate-600 font-medium text-[14px] line-clamp-1 leading-relaxed tracking-tight text-center group-hover:text-[#4E46E5] transition-colors">
                      {review.content}
                    </p>
                  </td>
                  <td className="p-6 text-slate-400 text-center text-[13px] font-medium uppercase">
                    {new Date(review.createdAt)
                      .toLocaleString()
                      .split(" ")
                      .slice(0, 3)
                      .join(" ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
