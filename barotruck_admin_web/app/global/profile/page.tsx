"use client"
import { useAdmin } from '@/app/features/shared/hooks/use_admin';

export default function ProfilePage() {
    const { admin } = useAdmin();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
                <p className="text-gray-500 text-sm mt-1">관리자 개인 정보를 관리합니다.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-inner">
                            {admin?.name?.[0] || "A"}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{admin?.name || "관리자"}</h2>
                            {/* 💡 에러 해결 부분: role 속성이 없으므로 '관리자' 혹은 'nickname'으로 대체하거나 고정값 사용 */}
                            <p className="text-sm text-gray-500">{admin?.nickname || "시스템 운영자"}</p>
                        </div>
                    </div>

                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">이름</label>
                                <input 
                                    type="text" 
                                    defaultValue={admin?.name}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">이메일 (ID)</label>
                                <input 
                                    type="email" 
                                    value={admin?.email}
                                    disabled
                                    className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm text-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" className="px-6 py-3 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                                비밀번호 변경
                            </button>
                            <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                정보 수정하기
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}