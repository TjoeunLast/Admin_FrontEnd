import client from "../../shared/api/client"; 
import { setCookie } from "cookies-next";

export const AuthService = {
  login: async (email: string, password: string) => {
    // 💡 401 에러는 '통신 규약'이 맞았다는 신호입니다. 
    // 이제 실제 DB의 데이터만 일치하면 성공입니다.
    const response = await client.post('/api/v1/auth/admin/create', { 
      email: email.trim(), 
      password: password // 비밀번호는 trim 하면 안 될 수 있으니 그대로 보냅니다.
    });
    
    if (response.data && response.data.access_token) {
      // 1. 모든 경로에서 접근 가능한 쿠키 저장
      setCookie('access_token', response.data.access_token, { maxAge: 60 * 60 * 24, path: '/' });
      // 2. 인터셉터용 로컬스토리지 저장
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  }
};

export default AuthService;