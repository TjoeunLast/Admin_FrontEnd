"use client"; // 현재 경로를 감지하기 위해 클라이언트 모드로 설정합니다.

import "./globals.css";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from './features/shared/hooks/use_admin'; // 커스텀 훅 도입

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // 현재 브라우저의 주소창 경로를 가져옵니다.
  const { admin } = useAdmin(); // DB 연동 데이터 가져오기

  // 메뉴 리스트 정의 (반복을 줄여 코드를 깔끔하게 합칩니다)
  const menuItems = [
    { name: "대시보드", href: "/", icon: "🏠" },
    { name: "주문 관리", href: "/global/orders", icon: "📦" },
    { name: "정산 관리", href: "/global/billing/settlement/driver", icon: "💰" },
    { name: "통계 분석", href: "/global/statistics", icon: "📊" },
    { name: "회원 관리", href: "/global/users", icon: "👤" },
    { name: "시스템 설정", href: "/global/settings", icon: "⚙️" },
    { name: "고객센터", href: "/global/support", icon: "🎧" },
  ];

  return (
    <html lang="ko">
      <body className="flex h-screen bg-[#f8fafc]">
        {/* 사이드바 영역 */}
        <aside className="w-64 bg-[#2c3e50] text-white flex flex-col p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-8">BaroTruck</h2>
          
          {/* DB 연동 프로필 영역 */}
          <div className="flex items-center gap-3 pb-8 border-b border-[#34495e]">
            <div className="w-10 h-10 bg-[#3b82f6] rounded-full flex items-center justify-center font-bold text-lg">
              {admin.nickname[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{admin.nickname}</span>
              <span className="text-[11px] text-[#bdc3c7]">{admin.email}</span>
            </div>
          </div>

          {/* 메뉴 리스트 - 경로에 따라 포인터(Active 상태)가 바뀝니다. */}
          <nav className="mt-10">
            <ul className="space-y-3">
              {menuItems.map((item) => {
                // 현재 주소와 메뉴 주소가 일치하는지 확인
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href} 
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${
                        isActive 
                        ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-900/20' // 현재 페이지 (포인터 활성)
                        : 'text-[#bdc3c7] hover:text-white hover:bg-[#34495e]' // 일반 상태
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
          <main className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}