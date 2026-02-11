"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { setCookie } from "cookies-next"; // 쿠키 저장을 위해 필요

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 백엔드 AuthenticationController의 authenticate 엔드포인트 호출
      const response = await axios.post("http://localhost:8080/api/v1/auth/authenticate", {
        email,
        password
      });

      if (response.data.access_token) {
        // 1. 미들웨어 인식을 위해 쿠키에 저장
        setCookie('access_token', response.data.access_token, { maxAge: 60 * 60 * 24 });
        // 2. API 요청 공통 사용을 위해 로컬스토리지 저장
        localStorage.setItem("token", response.data.access_token);
        
        alert("로그인 성공");
        router.push("/global/users"); // 로그인 후 이동할 페이지
      }
    } catch (error) {
      alert("로그인 실패: 이메일 또는 비밀번호를 확인하세요.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <form onSubmit={handleLogin} className="p-10 bg-white shadow-xl rounded-2xl w-full max-w-md space-y-6">
        <h1 className="text-3xl font-black text-center text-blue-600">BAROTRUCK</h1>
        <p className="text-center text-slate-500">관리자 시스템 로그인</p>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="이메일"
            className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full border border-slate-300 p-3 rounded-lg outline-none focus:border-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
          로그인
        </button>
      </form>
    </div>
  );
}