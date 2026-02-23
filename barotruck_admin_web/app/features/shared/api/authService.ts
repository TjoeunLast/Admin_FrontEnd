// app/features/shared/api/authService.ts
import client from "./client"; 

export const AuthService = {
  login: async (email: string, password: string) => {
    const response = await client.post('/api/v1/auth/authenticate', { 
      email: email.trim(), 
      password 
    });
    
    // 💡 중요: 백엔드 명칭인 access_token으로 읽고 저장합니다.
    if (response.data && response.data.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
      
      // 3번 유저 확인을 위해 ID도 저장해둡니다.
      if (response.data.user_id) {
        localStorage.setItem("user_Id", String(response.data.user_id));
      }
    }
    return response.data;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_Id");
      window.location.href = "/global/login";
    }
  }
};
export default AuthService;