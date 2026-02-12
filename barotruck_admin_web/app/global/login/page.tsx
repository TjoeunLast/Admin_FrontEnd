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
      // 💡 AuthService를 통해 로그인 시도
      const data = await AuthService.login(email, password);
      
      // 💡 로그인 성공 시 대시보드("/")로 즉시 이동
      if (data && data.accessToken) {
        alert("로그인 성공");
        router.push("/global"); 
      }
    } catch (error) {
      alert("로그인 실패: 정보를 다시 확인하세요.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <form onSubmit={handleLogin} className="p-10 bg-white shadow-xl rounded-2xl w-full max-w-md space-y-6">
        <h1 className="text-3xl font-black text-center text-blue-600">BAROTRUCK</h1>
        <div className="space-y-4">
          <input type="email" placeholder="이메일" className="w-full border p-3 rounded-lg" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="비밀번호" className="w-full border p-3 rounded-lg" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="w-full py-4 rounded-xl font-bold text-white bg-blue-600">시스템 접속</button>
        </div>
      </form>
    </div>
  );
}