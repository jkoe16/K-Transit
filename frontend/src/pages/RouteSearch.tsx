import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchRouteStops } from "../services/api";
import type { RequestState } from "../types/api";
import ApiResult from "../components/ApiResult";
import ToolPage from "../components/ToolPage";
import { UnavailableCard } from "../components/ServiceCards";
import { runRequest } from "../utils/request";

export default function RouteSearch() {
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
    <ToolPage
      eyebrow="노선 정보"
      title="노선·길찾기"
      description="대중교통 길찾기 제공 여부를 확인하고 버스 노선을 검색하세요."
    >
      <UnavailableCard
        title="대중교통 길찾기"
        text="출발지와 도착지 사이의 경로 정보는 아직 제공하지 않아요."
      />
      <div className="tool-card">
        <div className="tool-card-heading">
          <span className="tool-card-icon">↗</span>
          <div>
            <h2>버스 노선 검색</h2>
            <p>노선 이름으로 운행 정류장을 확인하세요.</p>
          </div>
        </div>
        <form className="inline-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="route-name">버스 노선</label>
          <input id="route-name" value={route} onChange={(event) => setRoute(event.target.value)} placeholder="예: 100번" />
          <button className="primary-button" disabled={state.loading}>
            버스 노선 찾기 <span>→</span>
          </button>
        </form>
      </div>
      <ApiResult state={state} title="버스 노선 정보" />
    </ToolPage>
  );
}
