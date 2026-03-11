const LOCAL_API_ORIGIN = "http://localhost:8080";
const LOCAL_WS_URL = "ws://localhost:8080/ws-stomp";
const PRODUCTION_API_ORIGIN = "https://barotruck.store";
const PRODUCTION_WS_URL = "wss://barotruck.store/ws-stomp";
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
    return PRODUCTION_API_ORIGIN;
  }

  const { hostname } = window.location;
  if (!hostname || LOCAL_HOSTS.has(hostname)) {
    return LOCAL_API_ORIGIN;
  }

  return PRODUCTION_API_ORIGIN;
};

export const getBackendWebSocketUrl = (): string => {
  const configuredUrl = normalizeOrigin(process.env.NEXT_PUBLIC_WS_URL);
  if (configuredUrl) {
    return configuredUrl.endsWith("/ws-stomp") ? configuredUrl : `${configuredUrl}/ws-stomp`;
  }

  if (typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname)) {
    return LOCAL_WS_URL;
  }

  return PRODUCTION_WS_URL;
};
