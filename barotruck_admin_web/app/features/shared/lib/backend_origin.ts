const LOCAL_API_ORIGIN = "http://3.231.203.46:8080";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

const normalizeOrigin = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : null;
};

export const getBackendOrigin = (): string => {
  const configuredOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_API_URL);
  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (typeof window === "undefined") {
    return LOCAL_API_ORIGIN;
  }

  const { protocol, hostname } = window.location;
  if (!hostname || LOCAL_HOSTS.has(hostname)) {
    return LOCAL_API_ORIGIN;
  }

  return "https://barotruck.store";
};

export const getBackendWebSocketUrl = (): string => {
  const configuredUrl = normalizeOrigin(process.env.NEXT_PUBLIC_WS_URL);
  if (configuredUrl) {
    return configuredUrl.endsWith("/ws-stomp") ? configuredUrl : `${configuredUrl}/ws-stomp`;
  }

  // 🚨 웹소켓 방어: HTTPS 환경에서는 ws:// 대신 wss:// 를 써야 에러가 안 납니다.
  // Next.js 프록시를 타도록 현재 도메인을 동적으로 가져옵니다.
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return "wss://barotruck.store/ws-stomp";
};  