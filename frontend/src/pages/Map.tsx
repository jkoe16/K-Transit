import { useMemo, useState, type FormEvent } from "react";
import ApiResult from "../components/ApiResult";
import MapView, { type MapPlace } from "../components/MapView";
import { ApiStatusRow } from "../components/ServiceCards";
import ToolPage from "../components/ToolPage";
import {
  fetchTrafficIncidents,
  fetchTrafficSpeed,
  type TrafficIncidentsData,
} from "../services/api";
import type { RequestState } from "../types/api";
import type { ServiceStatusMap } from "../types/service";
import { runRequest } from "../utils/request";

export default function Map({
  serviceStatus,
}: {
  serviceStatus: ServiceStatusMap;
}) {
  const [bounds, setBounds] = useState({
    minX: "",
    maxX: "",
    minY: "",
    maxY: "",
  });
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
      const detail = [
        incident.eventType,
        incident.eventDetailType,
        incident.message,
        incident.startDate,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" · ");
      markers.push({
        id: incident.linkId || `${incident.startDate || "incident"}-${index}`,
        coordinates: [longitude, latitude],
        title: incident.roadName || incident.eventType || "ITS 돌발상황",
        detail,
        kind: "incident",
      });
    });
    return markers;
  }, [incidentState.result]);
  const mapEmptyLabel = incidentState.loading
    ? "돌발상황 정보를 불러오는 중입니다."
    : incidentState.error
      ? "돌발상황 조회에 실패했습니다."
      : incidentState.result
        ? "표시할 돌발상황 좌표가 없습니다."
        : "돌발상황을 조회하면 제공된 좌표를 지도에 표시합니다.";

  async function searchTraffic(event: FormEvent) {
    event.preventDefault();
    const params = {
      type: "all",
      drcType: "all",
      ...bounds,
    };
    await runRequest(setTrafficState, () => fetchTrafficSpeed(params));
  }

  async function searchIncidents(event: FormEvent) {
    event.preventDefault();
    await runRequest(setIncidentState, () =>
      fetchTrafficIncidents({ type: "all", eventType: incidentType }),
    );
  }

  return (
    <ToolPage eyebrow="NATIONWIDE MAP" title="전국 교통 지도" description="OpenFreeMap의 한국어 지도 스타일을 사용합니다. 출처를 표시하며, 검증된 좌표가 있는 교통정보만 마커로 표시합니다.">
      <MapView markers={incidentMarkers} emptyLabel={mapEmptyLabel} />
      <ApiStatusRow
        label="실시간 버스 위치"
        state={serviceStatus.bus_positions}
      />
      <ApiStatusRow
        label="ITS 도로 교통속도"
        state={serviceStatus.its_traffic_speed}
      />
      <ApiStatusRow
        label="ITS 돌발상황"
        state={serviceStatus.its_traffic_events}
      />
      <section className="tool-card">
        <div className="tool-card-heading">
          <span className="tool-card-icon">↗</span>
          <div>
            <h2>도로 교통속도 조회</h2>
            <p>ITS 공식 API의 범위 변수입니다. 좌표계는 제공처 문서 확인 전 임의 변환하지 않습니다.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={searchTraffic}>
          <label>최소 X<input inputMode="decimal" value={bounds.minX} onChange={(event) => setBounds({ ...bounds, minX: event.target.value })} required /></label>
          <label>최대 X<input inputMode="decimal" value={bounds.maxX} onChange={(event) => setBounds({ ...bounds, maxX: event.target.value })} required /></label>
          <label>최소 Y<input inputMode="decimal" value={bounds.minY} onChange={(event) => setBounds({ ...bounds, minY: event.target.value })} required /></label>
          <label>최대 Y<input inputMode="decimal" value={bounds.maxY} onChange={(event) => setBounds({ ...bounds, maxY: event.target.value })} required /></label>
          <button className="primary-button form-submit" disabled={trafficState.loading}>
            도로 속도 조회 <span>→</span>
          </button>
        </form>
        <p className="form-hint">응답은 도로명·링크 ID·속도 등 공식 출력 필드이며, 선형 좌표가 없어 지도에 도로 혼잡선을 그리지 않습니다.</p>
      </section>
      <ApiResult state={trafficState} title="ITS 교통소통 응답" />
      <section className="tool-card">
        <div className="tool-card-heading">
          <span className="tool-card-icon">!</span>
          <div>
            <h2>도로 돌발상황 조회</h2>
            <p>ITS가 제공하는 사고·공사·기상 등 이벤트를 조회합니다. 제공된 경도·위도 좌표가 검증된 항목만 지도에 표시합니다.</p>
          </div>
        </div>
        <form className="inline-form" onSubmit={searchIncidents}>
          <label className="form-field">
            이벤트 유형
            <select
              value={incidentType}
              onChange={(event) => setIncidentType(event.target.value)}
            >
              <option value="all">전체</option>
              <option value="acc">교통사고</option>
              <option value="cor">공사</option>
              <option value="wea">기상</option>
              <option value="dis">재난</option>
              <option value="ete">기타 돌발</option>
            </select>
          </label>
          <button
            className="primary-button"
            disabled={incidentState.loading}
          >
            돌발상황 조회 <span>→</span>
          </button>
        </form>
      </section>
      <ApiResult state={incidentState} title="ITS 돌발상황 응답" />
      <div className="map-legend">
        <span><i className="legend-bus" />버스 위치 · 연동 대기</span>
        <span><i className="legend-stop" />정류장 · 좌표 미확인</span>
        <span><i className="legend-station" />지하철역 · 연동 대기</span>
        <span><i className="legend-incident" />도로 돌발상황</span>
      </div>
    </ToolPage>
  );
}
