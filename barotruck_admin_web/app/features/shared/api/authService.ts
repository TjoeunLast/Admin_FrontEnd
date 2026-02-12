import client from "./client"; 
import { setCookie } from "cookies-next";

export const AuthService = {
  login: async (email: string, password: string) => {
    // 💡 client 인스턴스를 사용하여 백엔드 호출
    const response = await client.post('/api/v1/auth/authenticate', { 
      email: email.trim(), 
      password 
    });
    
    // 💡 토큰 저장 이름을 "accessToken"으로 고정 (client.ts의 이름과 일치)
    if (response.data && response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
      setCookie('access_token', response.data.accessToken, { maxAge: 60 * 60 * 24, path: '/' });
    }
    return response.data;
  }
};

export default AuthService;