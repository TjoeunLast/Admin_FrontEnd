"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  reviewApi,
  ReviewResponse,
} from "@/app/features/shared/api/review_api";

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
        content: editContent,
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
        router.push("/global/support?tab=review");
      }
    } catch (error) {
      alert("삭제 권한이 없거나 오류가 발생했습니다.");
    }
  };

  if (isLoading)
    return (
      <div className="p-20 text-center text-slate-400 font-black italic text-sm">
        데이터 동기화 중...
      </div>
    );
  if (!review)
    return (
      <div className="p-20 text-center text-slate-400 font-black text-sm">
        리뷰를 찾을 수 없습니다.
      </div>
    );

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-24 font-sans text-slate-900">
      <header className="flex items-center justify-between px-1 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 shrink-0"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              리뷰 상세 관리
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleUpdate}
            className="px-5 py-2 bg-[#4E46E5] text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95"
          >
            수정 내용 저장
          </button>
          <button
            onClick={handleDelete}
            className="px-5 py-2 bg-white text-rose-600 border border-rose-100 text-[11px] font-bold rounded-lg hover:bg-rose-50 transition-all shadow-sm active:scale-95"
          >
            리뷰 영구 삭제
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <tbody className="divide-y divide-slate-100 font-sans">
            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100 w-40">
                리뷰 번호
              </td>
              <td className="p-6 pl-10 text-slate-900 font-black text-[15px]">
                #{review.reviewId}
              </td>
            </tr>

            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100">
                작성자 정보
              </td>
              <td className="p-6 pl-10">
                <div className="flex items-center gap-6 text-sm font-bold text-slate-600">
                  <span className="text-slate-900 font-black">
                    {review.writerNickname || "정보 없음"}
                  </span>
                  <div className="w-px h-3 bg-slate-200" />
                  <span className="text-slate-400 font-medium">
                    등록일: {new Date(review.createdAt).toLocaleString()}
                  </span>
                </div>
              </td>
            </tr>

            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100">
                별점 조정
              </td>
              <td className="p-6 pl-10">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setEditRating(s)}
                      className={`text-2xl transition-all active:scale-90 ${s <= editRating ? "text-amber-400" : "text-slate-200"}`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-4 text-sm font-black text-slate-400">
                    {editRating}.0 / 5.0
                  </span>
                </div>
              </td>
            </tr>

            <tr>
              <td className="p-6 bg-slate-50/50 text-center font-black text-slate-400 text-[13px] border-r border-slate-100 align-top">
                리뷰 상세 내용
              </td>
              <td className="p-6 pl-10 align-top">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-64 p-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-[#4E46E5] focus:bg-white font-medium text-slate-700 text-[15px] resize-none transition-all placeholder:text-slate-300"
                  placeholder="관리자로서 리뷰 내용을 수정할 수 있습니다."
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={() => router.push("/global/support?tab=review")}
          className="px-8 py-3bg-transparent text-slate-500 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-slate-100 hover:text-slate-900"
        >
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}
