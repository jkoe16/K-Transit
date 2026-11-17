import Loading from "./Loading";
import type { RequestState } from "../types/api";

function hasNoData(data: unknown): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  return typeof data === "object" && Object.keys(data).length === 0;
}

export default function ApiResult({
  state,
  title = "조회 결과",
}: {
  state: RequestState;
  title?: string;
}) {
  if (!state.loading && !state.error && !state.result) return null;
  return (
    <section className="result-panel" aria-live="polite">
      <div className="result-heading">
        <div><span className="eyebrow">API RESPONSE</span><h2>{title}</h2></div>
        {state.result && (
          <span className="result-source">
            {state.result.source} · {state.result.cached ? "캐시" : "실시간 조회"}
          </span>
        )}
      </div>
      {state.loading && <Loading label="공공데이터 API에 요청하고 있습니다." />}
      {state.error && <div className="error-state"><strong>조회에 실패했습니다</strong><p>{state.error}</p></div>}
      {state.result && (
        <>
          <p className="fetched-at">데이터 조회 시각: {new Date(state.result.fetched_at).toLocaleString("ko-KR")}</p>
          {hasNoData(state.result.data) ? (
            <div className="empty-state">API 응답에 표시할 데이터가 없습니다.</div>
          ) : (
            <pre className="json-result">{JSON.stringify(state.result.data, null, 2)}</pre>
          )}
        </>
      )}
    </section>
  );
}
