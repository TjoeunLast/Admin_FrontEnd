"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/app/features/shared/api/authService";

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
    <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="w-full max-w-md p-4">
        {/* 로고 영역 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-blue-600">BAROTRUCK</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium uppercase tracking-widest">
            Admin Management System
          </p>
        </div>

        {/* 로그인 카드 */}
        <form
          onSubmit={handleLogin}
          className="p-8 bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800 text-center">
              관리자 로그인
            </h2>
            <p className="text-sm text-slate-400 text-center">
              시스템 접속을 위해 인증 정보를 입력하세요.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                이메일
              </label>
              <input
                type="email"
                placeholder="admin@barotruck.com"
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                비밀번호
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 mt-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/25"
            >
              시스템 접속
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
