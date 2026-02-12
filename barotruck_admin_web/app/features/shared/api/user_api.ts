// app/features/shared/api/user_api.ts
import client from './client';

export const getMyInfo = async () => {
  // client.ts의 인터셉터가 헤더에 토큰을 자동으로 추가하므로 추가 설정이 필요 없습니다.
  const response = await client.get('/api/user/me');

  return response.data; // UserResponseDto { nickname, email, ... }
};

// ✅ 추가: 회원 목록 데이터 (가짜 데이터)
export const getUsers = async () => {
  return [
    { userId: 1, nickname: "김무옥", phone: "010-1111-2222", email: "muok@gmail.com", userLevel: 1, enrollDate: "2026-02-01", regFlag: "Y" },
    { userId: 2, nickname: "문영철", phone: "010-3333-4444", email: "yeongcheol@naver.com", userLevel: 2, enrollDate: "2026-02-05", regFlag: "N" },
    { userId: 3, nickname: "신영균", phone: "010-5555-6666", email: "yeongkyun@naver.com", userLevel: 1, enrollDate: "2026-02-10", regFlag: "Y" },
    { userId: 4, nickname: "홍만길", phone: "010-7777-8888", email: "mangil@gmail.com", userLevel: 2, enrollDate: "2026-02-11", regFlag: "N" },
    { userId: 5, nickname: "이정재", phone: "010-9999-0000", email: "jeongjae@gmail.com", userLevel: 1, enrollDate: "2026-02-12", regFlag: "N" },
  ];
};

// ✅ 이 함수가 있어야 숫자를 가져올 수 있습니다.
export const getUserStats = async () => {
  // 현재는 테스트용 가짜 데이터를 반환합니다.
  return {
    pendingCount: 12,
    driverCount: 154,
    shipperCount: 89
  };
};