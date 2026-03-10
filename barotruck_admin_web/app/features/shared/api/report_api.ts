// app/features/shared/api/report_api.ts
import client from "./client";

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

const fetchPagedReports = async (params?: Record<string, unknown>) => {
  const response = await client.get<PagedResponse<ReportResponse> | ReportResponse[]>(
    "/api/reports/admin/all",
    { params }
  );
  return normalizePagedResponse(response.data);
};

const fetchAllReports = async () => {
  const firstPage = await fetchPagedReports({
    page: 0,
    size: DEFAULT_PAGE_FETCH_SIZE,
  });

  if (firstPage.totalPages <= 1) {
    return firstPage.content;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchPagedReports({
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

export interface ReportResponse {
  reportId: number;
  orderId: number;
  reporterNickname: string;
  targetNickname: string;
  reportType: string;
  description: string;
  status: string;
  createdAt: string;

  type: "REPORT" | "DISCUSS"; // DISCUSS가 1:1 문의
  email?: string; // 답변 받을 이메일
  title?: string; // 문의 제목
  reporterUser?: {
    userId: number;
    nickname?: string;
  } | null;
  targetUser?: {
    userId: number;
    nickname?: string;
  } | null;
}

export const reportApi = {
  // 1. 관리자용 전체 신고/문의 목록 조회
  getAll: async (): Promise<ReportResponse[]> => {
    return fetchAllReports();
  },

  // 관리자 신고 삭제
  deleteReport: async (reportId: number): Promise<boolean> => {
    const response = await client.delete(`/api/reports/admin/${reportId}`);
    return response.data;
  },

  // 2. 상태 갱신 (접수됨, 처리 중, 처리 완료 등)
  updateReportStatus: async (
    reportId: number,
    status: string,
  ): Promise<boolean> => {
    const response = await client.patch(
      `/api/reports/admin/${reportId}/status`,
      null,
      {
        params: { status },
      },
    );
    return response.data;
  },

  // 3. 상세 조회
  getDetail: async (reportId: number): Promise<ReportResponse> => {
    const response = await client.get(`/api/reports/admin/${reportId}`);
    return response.data;
  },
};
