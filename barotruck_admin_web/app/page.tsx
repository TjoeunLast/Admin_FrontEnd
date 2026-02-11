"use client";

import { useState, useEffect } from "react";
import { AuthService } from './features/shared/api/authService';

export default function BaroTruckMain() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await AuthService.login(email, password);
      if (data && data.access_token) {
        setIsLoggedIn(true);
        alert("로그인에 성공했습니다!");
      }
    } catch (error: any) {
      const errorResponse = error.response?.data;
      console.error("🚨 서버 응답 에러:", errorResponse);
      
      // 서버에서 보내준 에러 메시지(아이디/비번 불일치 등)를 출력합니다.
      const message = errorResponse?.error || "아이디 또는 비밀번호를 다시 확인하세요.";
      alert(`로그인 실패: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  // 대시보드 UI는 로그인 성공 시 보여줍니다.
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 w-full fixed inset-0 z-[9999]">
        <div className="p-10 bg-white shadow-2xl rounded-3xl w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-black text-blue-600 tracking-tighter uppercase italic">BAROTRUCK</h1>
            <p className="text-slate-400 mt-2 font-medium">관리자 통합 제어 시스템</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="email"
              placeholder="admin@example.com"
              className="w-full border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="비밀번호"
              className="w-full border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? "인증 확인 중..." : "시스템 접속"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 로그인 성공 후 대시보드 레이아웃
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-800">📊 실시간 운송 관제 대시보드</h1>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-500 font-bold rounded-lg border border-red-100 hover:bg-red-100 transition">로그아웃</button>
      </div>
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center">
        <p className="text-slate-500 font-medium">관리자님, 환영합니다. 모든 시스템이 정상 작동 중입니다.</p>
      </div>
    </div>
  );
}