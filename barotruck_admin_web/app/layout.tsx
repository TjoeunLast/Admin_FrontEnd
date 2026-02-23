"use client";

import "./globals.css";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from './features/shared/hooks/use_admin'; // 커스텀 훅
import AuthService from "./features/shared/api/authService"; // 💡 추가

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { admin } = useAdmin(); // DB 연동 데이터

  // 💡 로그인 페이지인지 확인 (/global/login 경로일 때 true)
  const isLoginPage = pathname === "/global/login";

  const menuItems = [
    { name: "대시보드", href: "/", icon: "🏠" },
    { name: "주문 관리", href: "/global/orders", icon: "📦" },
    { name: "정산 관리", href: "/global/billing/settlement/driver", icon: "💰" },
    { name: "통계 분석", href: "/global/statistics", icon: "📊" },
    { name: "회원 관리", href: "/global/users", icon: "👤" },
    { name: "시스템 설정", href: "/global/settings", icon: "⚙️" },
    { name: "고객센터", href: "/global/support", icon: "🎧" },
  ];

  // 💡 [핵심] 로그인 페이지일 경우 사이드바 없이 children만 출력
  if (isLoginPage) {
    return (
      <html lang="ko">
        <body className="bg-[#f8fafc]">
          {children}
        </body>
      </html>
    );
  }

  // 💡 일반 페이지일 경우 사이드바가 포함된 전체 레이아웃 출력
  return (
    <html lang="ko">
      <body className="flex h-screen bg-[#f8fafc]">
        {/* 사이드바 영역 */}
        <aside className="w-64 bg-[#2c3e50] text-white flex flex-col p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-8">BaroTruck</h2>
          
          {/* DB 연동 프로필 영역 */}
          <div className="flex items-center gap-3 px-2 py-3 bg-[#1e293b]/50 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-blue-600 overflow-hidden border-2 border-blue-400/30">
              {admin?.profileImageUrl ? (
                <img src={admin.profileImageUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-white">Admin</div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              {/* 💡 [핵심] admin.name 또는 admin.nickname을 출력하도록 바꿉니다. */}
              <span className="text-sm font-bold text-white truncate">
                {/* '관리자'라고 적힌 글자를 지우고 아래처럼 변수를 넣으세요. */}
                {admin.name || admin.nickname || "관리자"} 
              </span>

              <span className="text-[11px] text-slate-400 truncate">
                {admin.email || "데이터 연동 실패"}
              </span>
            </div>
          </div>

          <nav className="mt-10">
            <ul className="space-y-3">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href} 
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${
                        isActive 
                        ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-900/20' 
                        : 'text-[#bdc3c7] hover:text-white hover:bg-[#34495e]'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-[15px]">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* 사이드바 맨 아래 로그아웃 버튼 추가 */}
          <div className="pt-6 border-t border-[#34495e]">
            <button
              onClick={() => AuthService.logout()}
              className="flex items-center gap-3 w-full p-3 rounded-xl transition-all font-medium text-[#bdc3c7] hover:text-white hover:bg-[#e74c3c]"
            >
              <span className="text-[15px]">로그아웃</span>
            </button>
          </div>
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">{children}</main>
        </div>
      </body>
    </html>
  );
}