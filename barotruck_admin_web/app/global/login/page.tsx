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
      // ✅ 수정된 부분: { email, password } 객체가 아니라, 각각의 인수로 전달
      const data = await AuthService.login(email, password);
      
      if (data && data.access_token) {
        alert("로그인 성공");
        // 로그인 성공 시 대시보드("/")로 이동
        router.push("/"); 
      }
    } catch (error) {
      console.error(error);
      alert("로그인 실패: 이메일 또는 비밀번호를 확인하세요.");
    }
  };

  return (
    // 원래의 디자인 레이아웃 유지
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <form onSubmit={handleLogin} className="p-10 bg-white shadow-xl rounded-2xl w-full max-w-md space-y-6">
        <h1 className="text-3xl font-black text-center text-blue-600">BAROTRUCK</h1>
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="이메일" 
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="비밀번호" 
            className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button 
            type="submit" 
            className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            시스템 접속
          </button>
        </div>
      </form>
    </div>
  );
}