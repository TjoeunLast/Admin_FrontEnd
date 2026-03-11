const normalizePath = (path: string): string => (path.startsWith("/") ? path : `/${path}`);

const trimTrailingSlash = (path: string): string => path.replace(/\/+$/, "");

const APP_ROOT_SEGMENTS = new Set(["global", "_next"]);

const getRuntimeBasePath = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  const [firstSegment] = window.location.pathname.split("/").filter(Boolean);
  if (!firstSegment || APP_ROOT_SEGMENTS.has(firstSegment)) {
    return "";
  }

  return `/${firstSegment}`;
};

export const getBasePath = (): string => {
  const configuredBasePath = trimTrailingSlash(process.env.NEXT_PUBLIC_BASE_PATH ?? "");
  return configuredBasePath || getRuntimeBasePath();
};

export const withBasePath = (path: string): string => `${getBasePath()}${normalizePath(path)}`;
