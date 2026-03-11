const normalizePath = (path: string): string => (path.startsWith("/") ? path : `/${path}`);

export const getBasePath = (): string => process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBasePath = (path: string): string => `${getBasePath()}${normalizePath(path)}`;
