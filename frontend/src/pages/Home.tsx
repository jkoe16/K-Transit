import { Link } from "react-router-dom";
import MapView from "../components/MapView";
import SearchBar from "../components/SearchBar";
import { FeatureCard, StatusRow } from "../components/ServiceCards";

export default function Home({ serviceStatus }: { serviceStatus: Record<string, string> }) {
  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <span className="eyebrow"><span className="eyebrow-line" /> 전국 교통정보 플랫폼</span>
          <h1>더 편리한 이동을 위한<br /><span>전국 대중교통 안내</span></h1>
          <p className="lead">버스 정류장과 노선 정보를 조회하고, 연결된 서비스 범위를 확인하세요.</p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-circle circle-one" /><div className="art-circle circle-two" />
          <div className="art-route"><i /><i /><i /><i /></div>
          <span className="art-bus">▰</span><span className="art-pin">●</span>
        </div>
      </section>
      <SearchBar />
      <section className="section-block">
        <div className="section-heading">
          <div><span className="eyebrow">EXPLORE</span><h2>필요한 교통정보를 찾아보세요</h2></div>
          <span className="section-note">데이터가 연결된 기능만 제공됩니다.</span>
        </div>
        <div className="feature-grid">
          <FeatureCard to="/bus" icon="▰" title="버스 정류장" description="지역코드와 ARS 번호로 STCIS 정류장 정보를 조회합니다." tag="STCIS 연결" />
          <FeatureCard to="/subway" icon="▤" title="지하철 정보" description="TAGO에서 지하철역을 검색하고 역별 시간표를 조회합니다." tag={serviceStatus.tago === "configured" ? "TAGO 연결" : "키 설정 필요"} muted={serviceStatus.tago !== "configured"} />
          <FeatureCard to="/routes" icon="↗" title="노선 경유지" description="노선명으로 STCIS 경유 지점 정보를 확인합니다." tag="STCIS 연결" />
          <FeatureCard to="/statistics" icon="▥" title="15분 OD 통계" description="출발·도착 읍면동 코드로 이동 통계를 조회합니다." tag="STCIS 연결" />
        </div>
      </section>
      <section className="home-bottom-grid">
        <div className="map-preview">
          <div className="map-preview-copy">
            <span className="eyebrow">NATIONWIDE MAP</span>
            <h2>전국을 한눈에</h2>
            <p>검증된 위치 데이터가 연결되면 지도에 표시됩니다.</p>
            <Link to="/map">지도 크게 보기 <span>→</span></Link>
          </div>
          <MapView compact />
        </div>
        <div className="status-card">
          <div className="status-card-head">
            <div><span className="eyebrow">SERVICE STATUS</span><h2>데이터 연동 현황</h2></div>
            <span className="status-icon">⌁</span>
          </div>
          <StatusRow label="STCIS 지역·버스·통계" value={serviceStatus.stcis === "configured" ? "API 키 연결됨" : serviceStatus.stcis === "backend_not_configured" ? "백엔드 주소 설정 필요" : "키 설정 필요"} active={serviceStatus.stcis === "configured"} />
          <StatusRow label="실시간 버스 위치" value="연동 대기" />
          <StatusRow label="TAGO 지하철·버스 도착" value={serviceStatus.tago === "configured" ? "API 키 연결됨 · 응답 미검증" : serviceStatus.tago === "backend_not_configured" || serviceStatus.stcis === "backend_not_configured" ? "백엔드 주소 설정 필요" : "키 설정 필요"} active={serviceStatus.tago === "configured"} />
          <StatusRow label="실시간 지하철 도착" value="연동 대기" />
          <StatusRow label="대중교통 경로 검색" value="연동 대기" />
          <p className="status-footnote">미연동 기능은 실제 정보처럼 표시하지 않습니다.</p>
        </div>
      </section>
      <div className="source-note">
        <span>ⓘ</span>
        <p><strong>데이터 안내</strong> 공공데이터 API별 제공 범위와 갱신 주기는 다를 수 있습니다. 실제 API 응답 및 데이터 갱신 시각을 결과 화면에서 확인할 수 있습니다.</p>
      </div>
    </div>
  );
}
