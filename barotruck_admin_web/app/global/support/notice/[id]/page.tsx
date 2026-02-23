"use client"

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { noticeApi, NoticeResponse } from "@/app/features/shared/api/notice_api";

export default function NoticeDetailPage() {
    const {id} = useParams();
    const router = useRouter();
    const [notice, setNotice] = useState<NoticeResponse | null>(null);

    useEffect(() => {
        if(id) {
            noticeApi.getDetail(Number(id))
            .then(res => setNotice(res.data))
            .catch(() => alert("해당하는 글이 존재하지 않습니다."));
        }
    }, [id]);

    if(!notice) return <div className="p-10 text-center">로딩 중...</div>;

    return (
        <div className="max-w-4xl space-y-6 pb-20">
            <div className="flex justify-between items-end border-b pb-6">
                <div>
                    <span className="text-blue-600 font-bold text-sm mb-2 block"> 공지사항 상세</span>
                    <h1 className="text-3xl font-bold text-[#1e293b]">{notice.title}</h1>
                    <div className="flex gap-4 mt-4 text-sm text-slate-400">
                        <span>작성자: {notice.adminName}</span>
                        <span>작성일: {new Date(notice.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <button onClick={() => router.back()} className="text-slate-500 font-bold hover:underline">목록으로</button>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 min-h-[400px] whitespace-pre-wrap leading-relaxed text-[#475569]">
                {notice.content}
            </div>

            <div className="flex justify-end gap-3">
                <button 
                    onClick={() => router.push(`/global/support/notice/new?id=${notice.noticeId}`)}
                    className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                >
                    수정하기
                    </button>
            </div>
        </div>
    )
}