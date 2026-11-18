import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchRouteStops } from "../services/api";
import type { RequestState } from "../types/api";
import ApiResult from "../components/ApiResult";
import ToolPage from "../components/ToolPage";
import { ApiStatusRow, UnavailableCard } from "../components/ServiceCards";
import { runRequest } from "../utils/request";
import type { ServiceStatusMap } from "../types/service";

export default function RouteSearch({
  serviceStatus,
}: {
  serviceStatus: ServiceStatusMap;
}) {
  const [searchParams] = useSearchParams();
  const [route, setRoute] = useState(searchParams.get("route_nm") ?? "");
  const [state, setState] = useState<RequestState>({ loading: false, error: "", result: null });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!route.trim()) {
      setState({ loading: false, error: "노선명을 입력하세요.", result: null });
      return;
    }
    await runRequest(setState, () => fetchRouteStops(route.trim()));
  }

  return (
    <ToolPage eyebrow="버스 노선" title="버스 노선 찾기" description="노선 번호나 이름으로 운행 경로를 확인해 보세요.">
      <div className="tool-card">
        <div className="tool-card-heading"><span className="tool-card-icon">↗</span><div><h2>노선 검색</h2><p>확인하려는 버스 노선을 입력하세요.</p></div></div>
        <form className="inline-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="route-name">버스 노선</label>
          <input id="route-name" value={route} onChange={(event) => setRoute(event.target.value)} placeholder="예: 100번" />
          <button className="primary-button" disabled={state.loading}>노선 찾기 <span>→</span></button>
        </form>
      </div>
      <ApiStatusRow
        label="버스 노선 정보"
        state={serviceStatus.stcis_bus_routes}
      />
      <ApiStatusRow
        label="대중교통 길찾기"
        state={serviceStatus.route_search}
      />
      <ApiResult state={state} title="버스 노선 정보" />
      <UnavailableCard title="대중교통 길찾기" text="출발지와 도착지 사이의 길찾기를 준비하고 있어요." />
    </ToolPage>
  );
}
