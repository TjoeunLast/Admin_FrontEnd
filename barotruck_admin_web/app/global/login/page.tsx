"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthService } from "@/app/features/shared/api/authService";
import { withBasePath } from "@/app/features/shared/lib/base_path";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await AuthService.login(email, password);
      if (data.access_token) {
        router.push("/");
      }
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "로그인 실패: 이메일 또는 비밀번호를 확인하세요.";
      alert(message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] font-sans text-slate-900">
      <div className="w-full max-w-md p-4">
        {/* 로고 영역 */}
        <div className="mb-10 text-center flex flex-col items-center gap-2">
          <Image
            src={withBasePath("/logo-text.png")}
            alt="BaroTruck"
            width={208}
            height={44}
            priority
            style={{ width: "208px", height: "auto" }}
          />
        </div>

        {/* 로그인 카드 */}
        <form
          onSubmit={handleLogin}
          className="p-8 pb-10 bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] space-y-8 ring-1 ring-slate-100"
        >
          <div className="space-y-2">
            <h2 className="text-[19px] font-black text-slate-900 text-center tracking-tight">
              관리자 로그인
            </h2>
            <p className="text-sm font-bold text-slate-400 text-center leading-relaxed">
              바로트럭 통합 관리 시스템 접속을 위해
              <br /> 인증 정보를 입력하세요.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 ml-1.5 uppercase tracking-wide">
                이메일
              </label>
              <input
                type="email"
                placeholder="admin@barotruck.com"
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#4E46E5]/10 focus:border-[#4E46E5] transition-all placeholder:text-slate-300 font-medium text-slate-800 text-[15px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 ml-1.5 uppercase tracking-wide">
                비밀번호
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#4E46E5]/10 focus:border-[#4E46E5] transition-all placeholder:text-slate-300 font-medium text-slate-800 text-[15px]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 mt-4 rounded-xl font-black text-white bg-[#4E46E5] hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 text-[15px]"
            >
              시스템 접속
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
