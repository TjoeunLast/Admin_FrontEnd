// app/features/shared/api/statistics_api.ts
import client from "./client";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const statisticsApi = {
  getProvinceStats: async (period = "month") => {
    const response = await client.get(`/api/v1/admin/orders/provinces`, { params: { period } });
    return response.data; 
  },
  getSummary: async (period = "month") => {
    const response = await client.get(`/api/v1/admin/orders/summary`, { params: { period } });
    return response.data;
  },
  getRouteStats: async () => {
    const response = await client.get("/api/v1/admin/orders/statistics/routes");
    return response.data; 
  }
};