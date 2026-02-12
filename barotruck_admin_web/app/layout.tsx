"use client";

import "./globals.css";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from './features/shared/hooks/use_admin'; // 커스텀 훅

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
          <div className="flex items-center gap-3 pb-8 border-b border-[#34495e]">
            <div className="w-10 h-10 bg-[#3b82f6] rounded-full flex items-center justify-center font-bold overflow-hidden">
              {admin.profileImageUrl ? <img src={admin.profileImageUrl} alt="profile" /> : (admin.nickname ? admin.nickname[0] : '?')}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">{admin.nickname || "로딩 중..."}</span>
              <span className="text-[11px] text-[#bdc3c7]">{admin.email}</span>
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
        </aside>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">{children}</main>
        </div>
      </body>
    </html>
  );
}