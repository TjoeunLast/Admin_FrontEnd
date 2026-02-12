// app/features/shared/api/client.ts
import axios from "axios";

export const API_BASE_URL = "http://localhost:8080";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // 💡 AuthService에서 저장한 이름인 "accessToken"을 가져옵니다.
    const token = localStorage.getItem("accessToken"); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default client;