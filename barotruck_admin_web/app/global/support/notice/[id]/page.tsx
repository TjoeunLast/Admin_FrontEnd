"use client"

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { noticeApi, NoticeResponse } from "@/app/features/shared/api/notice_api";

export default function NoticeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [notice, setNotice] = useState<NoticeResponse | null>(null);

    // ✅ useParams()의 id를 안전하게 문자열로 변환
    const rawId = Array.isArray(params.id) ? params.id[0] : params.id;

    useEffect(() => {
        if (!rawId) return;

        // ✅ 숫자로 확실히 변환 후 호출
        const numericId = parseInt(rawId, 10);
        
        if (isNaN(numericId)) {
            alert("유효하지 않은 게시글 번호입니다.");
            router.push("/global/support");
            return;
        }

        noticeApi.getDetail(numericId)
            .then(res => {
                if (res.data) setNotice(res.data);
            })
            .catch((err) => {
                console.error("상세 조회 에러:", err);
                alert("글을 불러올 수 없습니다. 삭제된 게시글이거나 서버 오류일 수 있습니다.");
                router.push("/global/support");
            });
    }, [rawId, router]);

    if (!notice) return <div className="p-10 text-center">데이터를 불러오는 중...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="border-b pb-6">
                <h1 className="text-3xl font-bold">{notice.title}</h1>
                <div className="flex gap-4 mt-4 text-sm text-slate-400">
                    <span>작성자: {notice.adminName}</span>
                    <span>작성일: {new Date(notice.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div className="bg-white p-8 rounded-2xl border min-h-[400px] whitespace-pre-wrap">
                {notice.content}
            </div>
            <div className="flex justify-end">
                <button 
                    onClick={() => router.push("/global/support")}
                    className="px-6 py-2 bg-slate-100 rounded-xl font-bold"
                >
                    목록으로
                </button>
            </div>
        </div>
    );
}