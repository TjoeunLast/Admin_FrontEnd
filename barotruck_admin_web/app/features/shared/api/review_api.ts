// app/features/shared/api/review_api.ts
import client from "./client";

export interface ReviewResponse {
    reviewId: number;
    writerNickname: string;
    rating: number;
    content: string;
    createdAt: string;
}

// 수정 시 필요한 데이터 타입
export interface ReviewRequest {
    rating: number;
    content: string;
}

export const reviewApi = {
    getAll: async (): Promise<ReviewResponse[]> => {
        const response = await client.get("/api/reviews/admin/all");
        return response.data;
    },

    getDetail: async (reviewId: number): Promise<ReviewResponse> => {
        const response = await client.get(`/api/reviews/${reviewId}`);
        return response.data;
    },

    // ✅ 관리자 리뷰 수정 연결 (@PutMapping("/admin/{reviewId}"))
    updateReview: async (reviewId: number, data: ReviewRequest): Promise<boolean> => {
        const response = await client.put(`/api/reviews/admin/${reviewId}`, data);
        return response.data; // ResponseEntity<Boolean> 반환값
    },

    // ✅ 관리자 리뷰 삭제 연결 (@DeleteMapping("/admin/{reviewId}"))
    deleteReview: async (reviewId: number): Promise<boolean> => {
        const response = await client.delete(`/api/reviews/admin/${reviewId}`);
        return response.data;
    }
};