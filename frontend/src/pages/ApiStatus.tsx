import { useCallback, useEffect, useState } from "react";
import ToolPage from "../components/ToolPage";
import { errorMessage, fetchProviderCatalog } from "../services/api";
import type { ApiProvider } from "../types/service";
import { lastSuccessLabel, serviceStatusLabel } from "../utils/serviceStatus";

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

  return (
    <ToolPage
      eyebrow="API PROVIDERS"
      title="API 연동 현황"
      description="공식 명세로 확인한 공공데이터 제공 범위와 실제 백엔드 연결 상태입니다. 인증키 값은 표시하거나 브라우저로 전달하지 않습니다."
    >
      <div className="provider-dashboard-toolbar">
        <p>새로고침은 연결 상태를 읽기만 합니다. 실제 API 요청은 해당 기능을 조회할 때 수행하며, 키가 없거나 오퍼레이션 주소가 확인되지 않은 API는 호출하지 않습니다.</p>
        <button type="button" className="secondary-button" onClick={() => void refresh()}>
          새로고침
        </button>
      </div>
      {loading && <p className="request-state">API 목록을 불러오는 중입니다.</p>}
      {error && <p className="request-state error" role="alert">{error}</p>}
      {!loading && !error && providers.length === 0 && (
        <p className="request-state">등록된 제공기관이 없습니다.</p>
      )}
      <div className="provider-dashboard">
        {providers.map((provider) => (
          <article className="provider-card" key={provider.id}>
            <header>
              <div>
                <span className="eyebrow">{provider.category}</span>
                <h2>{provider.name}</h2>
                <p>{provider.provider}</p>
              </div>
              <span className={`provider-status status-${provider.status.status}`}>
                {serviceStatusLabel(provider.status.status)}
              </span>
            </header>
            <dl>
              <div><dt>제공 범위</dt><dd>{provider.scope}</dd></div>
              <div><dt>데이터 유형</dt><dd>{provider.realtime ? "실시간" : "기준정보·통계"}</dd></div>
              <div><dt>인증키</dt><dd>{provider.key_env ? `${provider.key_env} · ${provider.key_configured ? "설정됨" : "미설정"}` : "확인된 키 요구 없음"}</dd></div>
              <div><dt>갱신·캐시</dt><dd>{provider.cadence}</dd></div>
              <div><dt>호출 제한</dt><dd>{provider.limits}</dd></div>
              <div><dt>마지막 성공</dt><dd>{lastSuccessLabel(provider.status)}</dd></div>
              {provider.status.http_status != null && (
                <div><dt>마지막 HTTP 상태</dt><dd>{provider.status.http_status}</dd></div>
              )}
              {provider.status.api_result_code && (
                <div><dt>제공기관 결과 코드</dt><dd>{provider.status.api_result_code}</dd></div>
              )}
              {provider.status.response_format && (
                <div><dt>응답 형식</dt><dd>{provider.status.response_format.toUpperCase()}</dd></div>
              )}
              {provider.status.record_count != null && (
                <div><dt>응답 데이터 수</dt><dd>{provider.status.record_count}</dd></div>
              )}
              {provider.status.last_error && (
                <div><dt>오류·확인사항</dt><dd>{provider.status.last_error}</dd></div>
              )}
            </dl>
            <p className="provider-notes">{provider.notes}</p>
            <code className="provider-endpoint">{provider.endpoint}</code>
            <footer>
              {provider.docs_url && (
                <a href={provider.docs_url} target="_blank" rel="noreferrer">공식 명세</a>
              )}
              {provider.application_url && (
                <a href={provider.application_url} target="_blank" rel="noreferrer">신청·안내</a>
              )}
            </footer>
          </article>
        ))}
      </div>
    </ToolPage>
  );
}
