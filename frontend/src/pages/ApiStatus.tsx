import { useCallback, useEffect, useMemo, useState } from "react";
import ToolPage from "../components/ToolPage";
import { errorMessage, fetchProviderCatalog } from "../services/api";
import type { ApiProvider, ServiceStatus } from "../types/service";
import { lastSuccessLabel, serviceStatusLabel } from "../utils/serviceStatus";

const serviceGroups = [
  { title: "지역 정보", providerIds: ["stcis_regions"] },
  {
    title: "버스 정류장",
    providerIds: ["stcis_bus_stops", "national_bus_stops", "tago_bus_stops"],
  },
  {
    title: "버스 노선",
    providerIds: ["stcis_bus_routes", "tago_bus_routes"],
  },
  {
    title: "버스 도착 정보",
    providerIds: ["tago_bus_arrivals", "busan_bus", "daegu_bus"],
  },
  {
    title: "버스 위치",
    providerIds: [
      "tago_bus_positions",
      "klid_bus_positions",
      "seoul_bus_positions",
      "incheon_bus_positions",
      "daejeon_bus_positions",
    ],
  },
  {
    title: "지하철 정보",
    providerIds: [
      "tago_subway",
      "seoul_subway_arrivals",
      "daejeon_subway_ridership",
    ],
  },
  {
    title: "도로 교통정보",
    providerIds: [
      "its_traffic_speed",
      "its_traffic_congestion",
      "its_traffic_incidents",
    ],
  },
  {
    title: "교통 카메라",
    providerIds: ["national_cctv", "national_cctv_video"],
  },
  {
    title: "이동 통계",
    providerIds: ["stcis_statistics", "gyeonggi_bus_ridership"],
  },
  { title: "전기차 충전소", providerIds: ["keco_ev_chargers"] },
  {
    title: "주차 정보",
    providerIds: ["busan_parking", "daejeon_parking"],
  },
] as const;

function groupStatus(providers: ApiProvider[], providerIds: readonly string[]) {
  const statuses = providers
    .filter((provider) => providerIds.includes(provider.id))
    .map((provider) => provider.status);
  const latestSuccess = statuses
    .map((status) => status.last_success_at)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];

  const status: ServiceStatus["status"] = statuses.some(
    (item) => item.status === "connected",
  )
    ? "connected"
    : statuses.some((item) => item.status === "no_data")
      ? "no_data"
      : statuses.some((item) =>
            ["error", "auth_error", "invalid_response"].includes(item.status),
          )
        ? "error"
        : "waiting";

  return { status, last_success_at: latestSuccess ?? null };
}

export default function ApiStatus() {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProviders(await fetchProviderCatalog());
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const services = useMemo(
    () =>
      serviceGroups.map((group) => ({
        title: group.title,
        status: groupStatus(providers, group.providerIds),
      })),
    [providers],
  );

  return (
    <ToolPage
      eyebrow="이용 안내"
      title="교통정보 안내"
      description="버스와 교통 서비스별 이용 가능 여부를 확인할 수 있습니다."
    >
      <div className="provider-dashboard-toolbar">
        <p>제공 지역과 정보 갱신 시각은 서비스에 따라 다를 수 있어요.</p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void refresh()}
          disabled={loading}
        >
          새로고침
        </button>
      </div>
      {loading && (
        <p className="request-state" role="status">
          교통정보를 확인하고 있어요.
        </p>
      )}
      {error && (
        <p className="request-state error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && providers.length === 0 && (
        <p className="request-state">현재 안내할 교통정보가 없어요.</p>
      )}
      <div className="provider-dashboard">
        {services.map((service) => (
          <article className="provider-card" key={service.title}>
            <header>
              <h2>{service.title}</h2>
              <span
                className={`provider-status status-${service.status.status}`}
              >
                {serviceStatusLabel(service.status.status)}
              </span>
            </header>
            <p className="provider-notes">
              {lastSuccessLabel(service.status)}
            </p>
          </article>
        ))}
      </div>
    </ToolPage>
  );
}
