// shared/api/user_api.ts
import client from './client'; // axios 설정이 담긴 파일

export const getAdminProfile = async () => {
  // 실제 백엔드 URL: /api/users/profile 또는 /api/users/1
  const response = await client.get('/api/user');
  return response.data; // { NICKNAME: "김준현", EMAIL: "satoru31572@gmail.com", ... }
};