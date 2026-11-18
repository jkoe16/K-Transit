import axios from "axios";
import type { ApiProvider, ServiceStatusMap } from "../types/service";

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

export type ApiEnvelope<T = unknown> = {
  source: string;
  resource: string;
  fetched_at: string;
  cached: boolean;
  data: T;
};

export type TrafficIncident = {
  type: string | null;
  eventType: string | null;
  eventDetailType: string | null;
  startDate: string | null;
  coordX: number | null;
  coordY: number | null;
  linkId: string | null;
  roadName: string | null;
  roadNo: string | null;
  roadDrcType: string | null;
  lanesBlockType: string | null;
  lanesBlocked: string | null;
  message: string | null;
  endDate: string | null;
};

export type TrafficIncidentsData = {
  resultCode: string;
  resultMsg: string | null;
  totalCount: string | null;
  items: TrafficIncident[];
};

export async function fetchHealth() {
  requireBackendUrl();
  const { data } = await api.get("/api/health");
  return data as {
    status: string;
    services: ServiceStatusMap;
  };
}

export async function fetchProviderCatalog() {
  requireBackendUrl();
  const { data } = await api.get<{ providers: ApiProvider[] }>("/api/providers");
  return data.providers;
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

export async function fetchArrivalCities() {
  requireBackendUrl();
  const { data } = await api.get<ApiEnvelope>("/api/bus/arrival-cities");
  return data;
}

export async function fetchArrivals(params: {
  city_code: string;
  node_id: string;
}) {
  requireBackendUrl();
  const { data } = await api.get<ApiEnvelope>("/api/bus/arrivals", { params });
  return data;
}

export async function fetchTrafficSpeed(params: Record<string, string>) {
  requireBackendUrl();
  const { data } = await api.get<ApiEnvelope>("/api/traffic/speed", { params });
  return data;
}

export async function fetchTrafficIncidents(
  params: Record<string, string>,
): Promise<ApiEnvelope<TrafficIncidentsData>> {
  requireBackendUrl();
  const { data } = await api.get<ApiEnvelope<TrafficIncidentsData>>(
    "/api/traffic/incidents",
    { params },
  );
  return data;
}

export function errorMessage(_error: unknown): string {
  return "정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
}
