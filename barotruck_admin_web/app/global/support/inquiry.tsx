"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { inquiryApi, ChatRoomResponse } from "@/app/features/shared/api/inquiry_api";

export default function InquiryList() {
  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 데이터 로딩 로직
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await inquiryApi.getAll();
        setRooms(response.data);
      } catch (error) {
        console.error("채팅 목록 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (isLoading) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead className="bg-[#f8f9fa] border-b-2 border-[#eee]">
          <tr>
            <th className="p-4 text-center text-sm font-bold text-[#475569] w-[100px]">상태</th>
            <th className="p-4 text-left text-sm font-bold text-[#475569]">상담 내용</th>
            <th className="p-4 text-center text-sm font-bold text-[#475569] w-[150px]">관리</th>
          </tr>
        </thead>
        <tbody>
          {rooms.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-10 text-center text-gray-500">참여 중인 상담 내역이 없습니다.</td>
            </tr>
          ) : (
            rooms.map((room) => (
              <tr key={room.roomId} className="border-b border-[#eee] hover:bg-slate-50 transition-colors">
                <td className="p-5 text-center font-bold text-sm">
                  {/* TYPE이 PERSONAL이면 '상담중'으로 표시하거나 별도 status 필드 활용 */}
                  <span className={room.status === '종료' ? "text-[#94a3b8]" : "text-[#3b82f6]"}>
                    {room.status || '상담중'}
                  </span>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-[#1e293b] text-base">{room.roomName}</div>
                    {room.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[#7f8c8d] text-sm mt-1 truncate max-w-[500px]">
                    {room.lastMessage || "메시지가 없습니다."}
                  </div>
                  <div className="text-[#94a3b8] text-xs mt-1 font-medium">
                    {room.lastMessageTime}
                  </div>
                </td>
                <td className="p-5 text-center">
                  <Link href={`/global/support/inquiry/${room.roomId}`}>
                    <button className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm ${
                      room.status !== '종료' 
                        ? 'bg-[#3b82f6] hover:bg-blue-600' 
                        : 'bg-white !text-[#64748b] border border-[#e2e8f0] hover:bg-gray-50'
                    }`}>
                      {room.status !== '종료' ? '채팅방 입장' : '상담 기록보기'}
                    </button>
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}