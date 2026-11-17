import { useState, type FormEvent } from "react";
import { fetchRouteStops } from "../services/api";
import type { RequestState } from "../types/api";
import ApiResult from "../components/ApiResult";
import ToolPage from "../components/ToolPage";
import { UnavailableCard } from "../components/ServiceCards";
import { runRequest } from "../utils/request";

export default function RouteSearch() {
  const [route, setRoute] = useState("");
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
    <ToolPage eyebrow="ROUTE STOPS" title="노선 경유지 조회" description="노선명을 입력해 STCIS 노선별 경유 지점 데이터를 조회합니다.">
      <div className="tool-card">
        <div className="tool-card-heading"><span className="tool-card-icon">↗</span><div><h2>노선명으로 검색</h2><p>검색은 STCIS에 등록된 노선명 기준입니다.</p></div></div>
        <form className="inline-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="route-name">노선명</label>
          <input id="route-name" value={route} onChange={(event) => setRoute(event.target.value)} placeholder="노선명 입력" />
          <button className="primary-button" disabled={state.loading}>경유지 조회 <span>→</span></button>
        </form>
      </div>
      <ApiResult state={state} />
      <UnavailableCard title="경로 탐색" text="출발지와 도착지 간 대중교통 경로를 제공하는 검증된 API가 확인되지 않아 아직 검색할 수 없습니다." />
    </ToolPage>
  );
}
