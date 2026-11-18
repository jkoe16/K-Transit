import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import ToolPage from "../components/ToolPage";
import { fetchHealth, fetchProviderCatalog } from "../services/api";
import type { ApiProvider, ServiceStatusMap } from "../types/service";
import { lastSuccessLabel, serviceStatusLabel } from "../utils/serviceStatus";

function diagnosticErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    return typeof detail === "string"
      ? detail
      : error.message || "진단 요청에 실패했습니다.";
  }
  return error instanceof Error
    ? error.message
    : "알 수 없는 진단 오류가 발생했습니다.";
}

export default function ApiStatus() {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [services, setServices] = useState<ServiceStatusMap>({});
  const [health, setHealth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextProviders, nextHealth] = await Promise.all([
        fetchProviderCatalog(),
        fetchHealth(),
      ]);
      setProviders(nextProviders);
      setServices(nextHealth.services);
      setHealth(nextHealth.status);
    } catch (requestError) {
      setError(diagnosticErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <ToolPage
      eyebrow="개발자 도구"
      title="서비스 진단"
      description="내부 진단 화면입니다. 정보는 읽기 전용이며 인증키 값은 표시하지 않습니다."
    >
      <div className="provider-dashboard-toolbar">
        <p>백엔드 상태: {health || "확인 중"}</p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void refresh()}
          disabled={loading}
        >
          진단 새로고침
        </button>
      </div>
      {loading && <p className="request-state" role="status">진단 정보를 불러오는 중입니다.</p>}
      {error && <p className="request-state error" role="alert">{error}</p>}
      {!loading && !error && providers.length === 0 && (
        <p className="request-state">등록된 제공기관이 없습니다.</p>
      )}
      <div className="provider-dashboard">
        {providers.map((provider) => {
          const serviceStatus = services[provider.id] ?? provider.status;
          return (
            <article className="provider-card" key={provider.id}>
              <header>
                <div>
                  <span className="eyebrow">{provider.category}</span>
                  <h2>{provider.name}</h2>
                  <p>{provider.provider}</p>
                </div>
                <span className={`provider-status status-${serviceStatus.status}`}>
                  {serviceStatus.status} · {serviceStatusLabel(serviceStatus.status)}
                </span>
              </header>
              <dl>
                <div><dt>제공 범위</dt><dd>{provider.scope}</dd></div>
                <div><dt>데이터 유형</dt><dd>{provider.realtime ? "실시간" : "기준정보·통계"}</dd></div>
                <div>
                  <dt>인증 환경변수</dt>
                  <dd>{provider.key_env ? `${provider.key_env} · ${provider.key_configured ? "설정됨" : "미설정"}` : "확인된 키 요구 없음"}</dd>
                </div>
                <div><dt>갱신·캐시</dt><dd>{provider.cadence}</dd></div>
                <div><dt>호출 제한</dt><dd>{provider.limits}</dd></div>
                <div><dt>마지막 성공</dt><dd>{lastSuccessLabel(serviceStatus)}</dd></div>
                {serviceStatus.http_status != null && (
                  <div><dt>마지막 HTTP 상태</dt><dd>{serviceStatus.http_status}</dd></div>
                )}
                {serviceStatus.api_result_code && (
                  <div><dt>제공기관 결과 코드</dt><dd>{serviceStatus.api_result_code}</dd></div>
                )}
                {serviceStatus.response_format && (
                  <div><dt>응답 형식</dt><dd>{serviceStatus.response_format.toUpperCase()}</dd></div>
                )}
                {serviceStatus.record_count != null && (
                  <div><dt>응답 데이터 수</dt><dd>{serviceStatus.record_count}</dd></div>
                )}
                {serviceStatus.last_error && (
                  <div><dt>오류·확인사항</dt><dd>{serviceStatus.last_error}</dd></div>
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
          );
        })}
      </div>
    </ToolPage>
  );
}
