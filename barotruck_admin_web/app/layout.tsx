"use client";

import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChartColumn,
  Headset,
  House,
  LogOut,
  LucideIcon,
  Package,
  Settings2,
  Users,
  WalletCards,
} from "lucide-react";
import AuthService from "./features/shared/api/authService";
import { getMyInfo } from "./features/shared/api/user_api";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);

  // 💡 로그인 페이지인지 확인 (/global/login 경로일 때 true)
  const isLoginPage = pathname === "/global/login";

  useEffect(() => {
    if (isLoginPage) return;

    const fetchAdminInfo = async () => {
      try {
        const data = await getMyInfo();
        setAdmin(data);
      } catch (error) {
        console.error("관리자 정보를 불러오는데 실패했습니다.", error);
      }
    };
    fetchAdminInfo();
  }, [isLoginPage]);

  const menuItems: { name: string; href: string; icon: LucideIcon }[] = [
    { name: "대시보드", href: "/", icon: House },
    { name: "주문 관리", href: "/global/orders", icon: Package },
    {
      name: "정산 관리",
      href: "/global/billing/settlement/driver",
      icon: WalletCards,
    },
    { name: "통계 분석", href: "/global/statistics", icon: ChartColumn },
    { name: "회원 관리", href: "/global/users", icon: Users },
    { name: "시스템 설정", href: "/global/settings", icon: Settings2 },
    { name: "고객센터", href: "/global/support", icon: Headset },
  ];

  if (isLoginPage) {
    return (
      <html lang="ko" suppressHydrationWarning>
        <body className="bg-gray-100">{children}</body>
      </html>
    );
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-[#f8fafc] flex h-screen overflow-hidden">
        <aside className="z-20 flex w-72 flex-col border-r border-[#E2E8F0] bg-white px-5 py-6">
          <div className="mb-8 px-2">
            <div className="mt-4">
              <Image
                src="/logo-text.png"
                alt="BaroTruck"
                width={208}
                height={44}
                priority
                style={{ width: "208px", height: "auto" }}
              />
            </div>
          </div>

          <Link href="/global/profile" className="group">
            <div className="mb-8 flex items-center gap-3 rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition-all group-hover:border-[#C7D2FE] group-hover:bg-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4E46E5] text-lg font-black text-white transition-transform group-hover:scale-105">
                {admin?.name?.[0] || admin?.nickname?.[0] || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-[15px] font-black text-[#0F172A]">
                  {admin?.name || admin?.nickname || "관리자"}
                </p>
                <p className="truncate text-xs font-semibold text-[#64748B]">
                  {admin?.email || "admin@example.com"}
                </p>
              </div>
            </div>
          </Link>

          <nav className="flex-1 overflow-y-auto no-scrollbar">
            <div className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
              Navigation
            </div>
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-[18px] px-3 py-3 transition-all ${
                        isActive
                          ? "bg-[#EDECFC] text-[#4E46E5]"
                          : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                          isActive
                            ? "bg-[#4E46E5] text-white"
                            : "bg-[#F1F5F9] text-[#64748B] group-hover:bg-white group-hover:text-[#4E46E5] group-hover:ring-1 group-hover:ring-[#E2E8F0]"
                        }`}
                      >
                        <Icon size={18} strokeWidth={2.2} />
                      </span>
                      <span className="flex-1 text-[15px] font-bold">
                        {item.name}
                      </span>
                      {isActive ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-[#4E46E5]" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-[#E2E8F0] pt-6">
            <button
              onClick={() => AuthService.logout()}
              className="flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-[15px] font-bold text-[#64748B] transition-all hover:bg-[#FEF2F2] hover:text-[#DC2626]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8FAFC] text-[#64748B]">
                <LogOut size={18} strokeWidth={2.2} />
              </span>
              <span>로그아웃</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
