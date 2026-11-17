import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:8000" : "");

const api = axios.create({
  baseURL: apiBaseUrl || undefined,
  timeout: 20000,
});

export const isBackendConfigured = Boolean(apiBaseUrl);

function requireBackendUrl() {
  if (!apiBaseUrl) {
    throw new Error(
      "백엔드 API 주소가 설정되지 않았습니다. FastAPI 서버를 배포하고 GitHub 저장소 변수 KTRANSIT_API_BASE_URL에 주소를 설정하세요.",
    );
  }
}

export type ApiEnvelope = {
  source: string;
  resource: string;
  fetched_at: string;
  cached: boolean;
  data: unknown;
};

export async function fetchHealth() {
  requireBackendUrl();
  const { data } = await api.get("/api/health");
  return data as {
    status: string;
    services: Record<string, string>;
  };
}

export async function fetchRegions(params: Record<string, string>) {
  requireBackendUrl();
  const { data } = await api.get<ApiEnvelope>("/api/regions", { params });
  return data;
}

export async function fetchStops(params: Record<string, string>) {
  requireBackendUrl();
  const { data } = await api.get<ApiEnvelope>("/api/bus/stops", { params });
  return data;
}

export async function fetchRouteStops(routeId: string) {
  requireBackendUrl();
  const { data } = await api.get<ApiEnvelope>(
    `/api/bus/routes/${encodeURIComponent(routeId)}/stops`,
  );
  return data;
}

export async function fetchQuarterOd(params: Record<string, string>) {
  requireBackendUrl();
  const { data } = await api.get<ApiEnvelope>("/api/statistics/quarter-od", {
    params,
  });
  return data;
}

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    return typeof detail === "string"
      ? detail
      : error.message || "API 요청에 실패했습니다.";
  }
  return error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
}
