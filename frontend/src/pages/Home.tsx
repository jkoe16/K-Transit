import { Link } from "react-router-dom";
import MapView from "../components/MapView";
import SearchBar from "../components/SearchBar";
import { ApiStatusRow, FeatureCard } from "../components/ServiceCards";
import type { ServiceStatusMap } from "../types/service";

export default function Home({
  serviceStatus,
}: {
  serviceStatus: ServiceStatusMap;
}) {
  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-line" />
            전국 대중교통 통합 플랫폼
          </span>
          <h1>
            더 편리한 이동을 위한
            <br />
            <span>전국 대중교통 안내</span>
          </h1>
          <p className="lead">
            실제 연동된 공공데이터와 제공 범위를 투명하게 확인하세요.
          </p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-circle circle-one" />
          <div className="art-circle circle-two" />
          <div className="art-route">
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className="art-bus">BUS</span>
          <span className="art-pin">●</span>
        </div>
      </section>

      <SearchBar />

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EXPLORE</span>
            <h2>필요한 교통정보를 찾아보세요</h2>
          </div>
          <span className="section-note">
            연동된 기능만 실제 데이터로 안내합니다.
          </span>
        </div>
        <div className="feature-grid">
          <FeatureCard
            to="/bus"
            icon="B"
            title="버스 정류장"
            description="ARS 번호와 지역코드로 STCIS 정류장 정보를 조회합니다."
            tag="STCIS API"
            status={serviceStatus.stcis_bus_stops}
          />
          <FeatureCard
            to="/routes"
            icon="↗"
            title="버스 노선"
            description="노선명으로 STCIS 경유 정류장 정보를 조회합니다."
            tag="STCIS API"
            status={serviceStatus.stcis_bus_routes}
          />
          <FeatureCard
            to="/subway"
            icon="M"
            title="지하철역"
            description="역·노선 조회는 실제 API 연동 후 제공됩니다."
            tag="연동 대기"
            status={serviceStatus.subway}
          />
          <FeatureCard
            to="/routes"
            icon="⇄"
            title="경로 검색"
            description="출발지와 도착지 간 경로 API가 아직 연동되지 않았습니다."
            tag="연동 대기"
            status={serviceStatus.route_search}
          />
          <FeatureCard
            to="/map"
            icon="◎"
            title="전국 지도"
            description="한국어 지도에서 실제 좌표가 확인된 위치를 표시합니다."
            tag="지도 보기"
          />
          <FeatureCard
            to="/statistics"
            icon="▥"
            title="교통 통계"
            description="운행일자와 읍면동 코드로 15분 OD 데이터를 조회합니다."
            tag="STCIS API"
            status={serviceStatus.stcis_statistics}
          />
        </div>
      </section>

      <section className="home-bottom-grid">
        <div className="map-preview">
          <div className="map-preview-copy">
            <span className="eyebrow">NATIONWIDE MAP</span>
            <h2>전국 지도</h2>
            <p>
              한국어 지도를 사용합니다. 교통 위치는 검증된 좌표가 있을 때만
              표시합니다.
            </p>
            <Link to="/map">
              지도 크게 보기 <span>→</span>
            </Link>
          </div>
          <MapView compact />
        </div>
        <div className="status-card">
          <div className="status-card-head">
            <div>
              <span className="eyebrow">SERVICE STATUS</span>
              <h2>API 연동 현황</h2>
            </div>
            <span className="status-icon">●</span>
          </div>
          <ApiStatusRow
            label="STCIS 지역코드"
            state={serviceStatus.stcis_regions}
          />
          <ApiStatusRow
            label="STCIS 정류장"
            state={serviceStatus.stcis_bus_stops}
          />
          <ApiStatusRow
            label="STCIS 노선 경유지"
            state={serviceStatus.stcis_bus_routes}
          />
          <ApiStatusRow
            label="TAGO 버스 도착"
            state={serviceStatus.bus_arrivals}
          />
          <ApiStatusRow
            label="STCIS 15분 OD"
            state={serviceStatus.stcis_statistics}
          />
        </div>
      </section>

      <div className="source-note">
        <span>i</span>
        <p>
          <strong>데이터 안내</strong>
          API별 제공 지역과 갱신 주기가 다를 수 있습니다. 마지막 성공 조회
          시각은 백엔드 실행 중 확인된 실제 응답을 기준으로 표시합니다.
        </p>
      </div>
    </div>
  );
}
