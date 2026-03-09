// app/features/shared/api/client.ts
import axios from "axios";
import { getBackendOrigin } from "@/app/features/shared/lib/backend_origin";

const client = axios.create({
  baseURL: getBackendOrigin(),
});

client.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    // 💡 문자열 "null"이나 "undefined"가 들어오는 것을 확실히 막습니다.
    if (token && token !== "null" && token !== "undefined") {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 💡 응답 인터셉터에서 무분별한 리다이렉트를 막습니다.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // 특정 경로(/api/user/me)에서 에러가 날 때는 즉시 로그아웃시키지 않고 
    // useAdmin 훅에서 처리하도록 에러를 그대로 던집니다.
    return Promise.reject(error);
  }
);

export default client;
