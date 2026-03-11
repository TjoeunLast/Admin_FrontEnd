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

  return `http://barotruck.store:8080`;
};

export const getBackendWebSocketUrl = (): string => {
  const configuredUrl = normalizeOrigin(process.env.NEXT_PUBLIC_WS_URL);
  if (configuredUrl) {
    return configuredUrl.endsWith("/ws-stomp") ? configuredUrl : `${configuredUrl}/ws-stomp`;
  }

  return `ws://barotruck.store/ws-stomp`;
};
