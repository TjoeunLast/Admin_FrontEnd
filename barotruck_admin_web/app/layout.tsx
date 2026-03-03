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

  // 💡 [핵심] 로그인 페이지일 경우 사이드바 없이 children만 렌더링
  if (isLoginPage) {
    return (
      <html lang="ko">
        <body className="bg-gray-100">{children}</body>
      </html>
    );
  }

  return (
    <html lang="ko">
      <body className="bg-[#f8fafc] flex h-screen overflow-hidden">
        {/* 사이드바 */}
        <aside className="w-64 bg-[#2c3e50] text-white flex flex-col p-6 shadow-xl z-20">
          <div className="mb-10 px-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="text-blue-500">BAROTRUCK</span>
            </h1>
          </div>

          {/* ✅ 프로필 영역: 클릭 시 마이페이지로 이동하도록 수정 */}
          <Link href="/global/profile" className="group">
            <div className="mb-8 p-4 bg-[#34495e] rounded-2xl flex items-center gap-3 border border-transparent group-hover:border-blue-500/50 transition-all cursor-pointer group-hover:bg-[#3d566e]">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold shadow-lg group-hover:scale-105 transition-transform">
                {admin?.name?.[0] || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate group-hover:text-blue-400 transition-colors">
                  {admin?.name || "관리자"}
                </p>
                <p className="text-[11px] text-[#bdc3c7] truncate">
                  {admin?.email || "admin@example.com"}
                </p>
              </div>
            </div>
          </Link>

          <nav className="flex-1 overflow-y-auto no-scrollbar">
            <ul className="space-y-1">
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

          {/* 사이드바 맨 아래 로그아웃 버튼 */}
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
          <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}