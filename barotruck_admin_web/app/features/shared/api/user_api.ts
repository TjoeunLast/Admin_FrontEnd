// app/features/shared/api/user_api.ts
import client from './client';

export interface PagedResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

const DEFAULT_PAGE_FETCH_SIZE = 100;

const isPagedResponse = <T,>(value: unknown): value is PagedResponse<T> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<PagedResponse<T>>;
  return (
    Array.isArray(candidate.content) &&
    typeof candidate.number === "number" &&
    typeof candidate.size === "number" &&
    typeof candidate.totalElements === "number" &&
    typeof candidate.totalPages === "number"
  );
};

const normalizePagedResponse = <T,>(payload: PagedResponse<T> | T[]): PagedResponse<T> => {
  if (Array.isArray(payload)) {
    return {
      content: payload,
      number: 0,
      size: payload.length,
      totalElements: payload.length,
      totalPages: payload.length > 0 ? 1 : 0,
      numberOfElements: payload.length,
      first: true,
      last: true,
      empty: payload.length === 0,
    };
  }

  if (isPagedResponse<T>(payload)) {
    return payload;
  }

  return {
    content: [],
    number: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
    numberOfElements: 0,
    first: true,
    last: true,
    empty: true,
  };
};

const fetchPagedUsers = async (params?: Record<string, unknown>) => {
  const response = await client.get<PagedResponse<any> | any[]>('/api/v1/admin/user', {
    params,
  });
  return normalizePagedResponse(response.data);
};

const fetchAllUsers = async (params?: Record<string, unknown>) => {
  const firstPage = await fetchPagedUsers({
    ...params,
    page: 0,
    size: DEFAULT_PAGE_FETCH_SIZE,
  });

  if (firstPage.totalPages <= 1) {
    return firstPage.content;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchPagedUsers({
        ...params,
        page: index + 1,
        size: DEFAULT_PAGE_FETCH_SIZE,
      })
    )
  );

  return [
    ...firstPage.content,
    ...remainingPages.flatMap((page) => page.content),
  ];
};

export const getMyInfo = async () => {
  // 인터셉터가 토큰을 자동으로 추가함
  const response = await client.get('/api/user/me');
  return response.data; 
};

// ✅ 추가: 회원 목록 데이터 (데이터 연동)
export const getUsers = async () => {
  return fetchAllUsers();
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

export const getUsersPage = async (page: number = 0, size: number = 20, role?: string) => {
  return fetchPagedUsers({
    page,
    size,
    role,
  });
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
  return fetchAllUsers({ role: 'DRIVER' });
};
