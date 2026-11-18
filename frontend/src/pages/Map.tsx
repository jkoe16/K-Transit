import { useCallback, useMemo, useState, type FormEvent } from "react";
import ApiResult from "../components/ApiResult";
import MapView, {
  type MapBounds,
  type MapPlace,
} from "../components/MapView";
import ToolPage from "../components/ToolPage";
import {
  fetchTrafficIncidents,
  fetchTrafficSpeed,
  type TrafficIncidentsData,
} from "../services/api";
import type { RequestState } from "../types/api";
import { runRequest } from "../utils/request";

const incidentLabels: Record<string, string> = {
  acc: "교통사고",
  cor: "공사",
  wea: "기상 상황",
  dis: "재난",
  ete: "기타 상황",
  etc: "기타 상황",
};

function incidentLabel(value: string | null): string {
  return value ? incidentLabels[value] ?? "도로 상황" : "도로 상황";
}

function trafficCount(data: unknown): number | null {
  if (!data || typeof data !== "object" || !("totalCount" in data)) {
    return null;
  }
  const count = Number((data as { totalCount: unknown }).totalCount);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

export default function Map() {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [trafficState, setTrafficState] = useState<RequestState>({
    loading: false,
    error: "",
    result: null,
  });
  const [incidentType, setIncidentType] = useState("all");
  const [incidentState, setIncidentState] = useState<
    RequestState<TrafficIncidentsData>
  >({
    loading: false,
    error: "",
    result: null,
  });
  const onViewportChange = useCallback((nextBounds: MapBounds) => {
    setBounds(nextBounds);
  }, []);

  const incidentMarkers = useMemo(() => {
    const markers: MapPlace[] = [];
    const incidents = incidentState.result?.data.items ?? [];
    incidents.forEach((incident, index) => {
      const longitude = incident.coordX;
      const latitude = incident.coordY;
      if (
        longitude === null ||
        latitude === null ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        Math.abs(longitude) > 180 ||
        Math.abs(latitude) > 90
      ) {
        return;
      }
      const detail = [incidentLabel(incident.eventType), incident.message]
        .filter((value): value is string => Boolean(value))
        .join(" · ");
      markers.push({
        id: incident.linkId || `${incident.startDate || "incident"}-${index}`,
        coordinates: [longitude, latitude],
        title: incident.roadName || incidentLabel(incident.eventType),
        detail,
        kind: "incident",
      });
    });
    return markers;
  }, [incidentState.result]);

  const mapEmptyLabel = incidentState.loading
    ? "도로 상황을 불러오고 있어요."
    : incidentState.error
      ? "도로 상황을 불러오지 못했어요."
      : incidentState.result
        ? "표시할 도로 상황이 없어요."
        : "도로 상황을 조회하면 지도에 표시돼요.";

  function searchTraffic(event: FormEvent) {
    event.preventDefault();
    if (!bounds) {
      setTrafficState({
        loading: false,
        error: "지도를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.",
        result: null,
      });
      return;
    }

    void runRequest(setTrafficState, () =>
      fetchTrafficSpeed({
        type: "all",
        drcType: "all",
        minX: String(bounds.minX),
        maxX: String(bounds.maxX),
        minY: String(bounds.minY),
        maxY: String(bounds.maxY),
      }),
    );
  }

  function searchIncidents(event: FormEvent) {
    event.preventDefault();
    void runRequest(setIncidentState, () =>
      fetchTrafficIncidents({ type: "all", eventType: incidentType }),
    );
  }

  return (
    <ToolPage
      eyebrow="교통 지도"
      title="전국 교통 지도"
      description="지도를 움직여 주변 도로 상황과 교통정보를 확인하세요."
    >
      <MapView
        markers={incidentMarkers}
        emptyLabel={mapEmptyLabel}
        onViewportChange={onViewportChange}
      />
      <section className="tool-card">
        <div className="tool-card-heading">
          <span className="tool-card-icon">↗</span>
          <div>
            <h2>현재 지도 주변 교통정보</h2>
            <p>지도를 옮기거나 확대해 조회할 지역을 선택할 수 있어요.</p>
          </div>
        </div>
        <form className="inline-form" onSubmit={searchTraffic}>
          <button
            className="primary-button"
            disabled={trafficState.loading || !bounds}
          >
            주변 교통정보 찾기 <span>→</span>
          </button>
        </form>
        {trafficState.result && (
          <p className="map-result-summary" aria-live="polite">
            {trafficCount(trafficState.result.data) === null
              ? "현재 지도 주변의 교통정보를 확인했어요."
              : `현재 지도 주변 교통정보 ${trafficCount(trafficState.result.data)}건을 찾았어요.`}
          </p>
        )}
        <ApiResult state={trafficState} title="주변 교통정보" />
      </section>
      <section className="tool-card">
        <div className="tool-card-heading">
          <span className="tool-card-icon">!</span>
          <div>
            <h2>도로 상황 확인</h2>
            <p>사고, 공사, 기상 등 실제로 확인된 상황을 살펴보세요.</p>
          </div>
        </div>
        <form className="inline-form" onSubmit={searchIncidents}>
          <label className="form-field">
            상황 종류
            <select
              value={incidentType}
              onChange={(event) => setIncidentType(event.target.value)}
            >
              <option value="all">전체</option>
              <option value="acc">교통사고</option>
              <option value="cor">공사</option>
              <option value="wea">기상 상황</option>
              <option value="dis">재난</option>
              <option value="ete">기타 상황</option>
            </select>
          </label>
          <button
            className="primary-button"
            disabled={incidentState.loading}
          >
            도로 상황 찾기 <span>→</span>
          </button>
        </form>
      </section>
      <ApiResult state={incidentState} title="도로 상황 정보" />
      <div className="map-legend">
        <span><i className="legend-bus" />버스 위치</span>
        <span><i className="legend-stop" />정류장</span>
        <span><i className="legend-station" />지하철역</span>
        <span><i className="legend-incident" />도로 상황</span>
      </div>
    </ToolPage>
  );
}
