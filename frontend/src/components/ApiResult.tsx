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
        <div><h2>{title}</h2></div>
      </div>
      {state.loading && <Loading label="정보를 불러오고 있어요." />}
      {state.error && <div className="error-state"><strong>정보를 불러오지 못했어요</strong><p>{state.error}</p></div>}
      {state.result && (
        <>
          <p className="fetched-at">정보 갱신 시각: {new Date(state.result.fetched_at).toLocaleString("ko-KR")}</p>
          {hasNoData(state.result.data) ? (
            <div className="empty-state">표시할 정보가 없습니다.</div>
          ) : (
            <div className="empty-state">정보를 불러왔어요.</div>
          )}
        </>
      )}
    </section>
  );
}
