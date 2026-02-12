// app/features/shared/api/user_api.ts
import client from './client';

export const getMyInfo = async () => {
  // client.ts의 인터셉터가 헤더에 토큰을 자동으로 추가하므로 추가 설정이 필요 없습니다.
  const response = await client.get('api/user'); 
  return response.data; // UserResponseDto { nickname, email, ... }
};