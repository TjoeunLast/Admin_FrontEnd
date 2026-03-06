// app/features/shared/api/user_api.ts
import client from './client';

export const getMyInfo = async () => {
  // 인터셉터가 토큰을 자동으로 추가함
  const response = await client.get('/api/user/me');
  return response.data; 
};

// ✅ 추가: 회원 목록 데이터 (데이터 연동)
export const getUsers = async () => {
  const response = await client.get('/api/v1/admin/user');
  return response.data;
  /*
  return [
    { userId: 1, nickname: "김무옥", phone: "010-1111-2222", email: "muok@gmail.com", userLevel: 1, enrollDate: "2026-02-01", regFlag: "A" },
    { userId: 2, nickname: "문영철", phone: "010-3333-4444", email: "yeongcheol@naver.com", userLevel: 2, enrollDate: "2026-02-05", regFlag: "N" },
    { userId: 3, nickname: "신영균", phone: "010-5555-6666", email: "yeongkyun@naver.com", userLevel: 1, enrollDate: "2026-02-10", regFlag: "A" },
    { userId: 4, nickname: "홍만길", phone: "010-7777-8888", email: "mangil@gmail.com", userLevel: 2, enrollDate: "2026-02-11", regFlag: "N" },
    { userId: 5, nickname: "이정재", phone: "010-9999-0000", email: "jeongjae@gmail.com", userLevel: 1, enrollDate: "2026-02-12", regFlag: "N" },
  ];
  */
};

// ✅ 관리자 상세 정보 조회를 위한 API 추가
export const getUserDetail = async (userId: number) => {
  const response = await client.get(`/api/v1/admin/user/${userId}`);
  return response.data;
};

// ✅ 회원 탈퇴(삭제) 처리 (관리자 권한)
export const deleteUser = async (userId: number) => {
  return await client.post(`/api/v1/admin/user/delete/${userId}`);
};

// ✅ 회원 계정 복구 (관리자 권한)
export const restoreUser = async (userId: number) => {
  return await client.post(`/api/v1/admin/user/restore/${userId}`);
};

// 강제 배차용 차주 목록 조회 API
export const fetchDriversForAllocation = async () => {
  // AdminUserController의 GET /api/v1/admin/user?role=DRIVER 호출
  const response = await client.get("/api/v1/admin/user", {
    params: { role: 'DRIVER' } 
  });
  return response.data;
};