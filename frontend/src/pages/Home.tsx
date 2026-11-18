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
            전국 대중교통 안내
          </span>
          <h1>
            오늘의 이동을
            <br />
            <span>쉽고 빠르게</span>
          </h1>
          <p className="lead">
            버스 정류장과 교통 지도를 손쉽게 찾아보세요.
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
            <span className="eyebrow">교통 서비스</span>
            <h2>무엇을 찾고 계신가요?</h2>
          </div>
          <span className="section-note">
            실제로 확인된 정보만 보여드려요.
          </span>
        </div>
        <div className="feature-grid">
          <FeatureCard
            to="/bus"
            icon="B"
            title="버스 정류장"
            description="정류장 이름이나 번호로 주변 정류장을 찾아보세요."
            tag="정류장 찾기"
            status={serviceStatus.stcis_bus_stops}
          />
          <FeatureCard
            to="/routes"
            icon="↗"
            title="버스 노선"
            description="노선에 포함된 정류장 정보를 확인하세요."
            tag="노선 정보"
            status={serviceStatus.stcis_bus_routes}
          />
          <FeatureCard
            to="/subway"
            icon="M"
            title="지하철 정보"
            description="지하철역과 노선 정보를 준비하고 있습니다."
            tag="준비 중"
            status={serviceStatus.subway}
          />
          <FeatureCard
            to="/routes"
            icon="⇄"
            title="대중교통 길찾기"
            description="출발지와 도착지 사이의 길찾기를 준비하고 있습니다."
            tag="준비 중"
            status={serviceStatus.route_search}
          />
          <FeatureCard
            to="/map"
            icon="◎"
            title="교통 지도"
            description="전국 지도를 살펴보고 교통 상황을 확인하세요."
            tag="지도 보기"
          />
          <FeatureCard
            to="/statistics"
            icon="▥"
            title="이동 통계"
            description="지역별 대중교통 이용 정보를 확인하세요."
            tag="통계 정보"
            status={serviceStatus.stcis_statistics}
          />
        </div>
      </section>

      <section className="home-bottom-grid">
        <div className="map-preview">
          <div className="map-preview-copy">
            <span className="eyebrow">교통 지도</span>
            <h2>전국 지도</h2>
            <p>
              지도에서 주변 도로 상황과 교통정보를 살펴보세요.
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
              <span className="eyebrow">이용 안내</span>
              <h2>교통정보 이용 현황</h2>
            </div>
            <span className="status-icon">●</span>
          </div>
          <ApiStatusRow
            label="지역 정보"
            state={serviceStatus.stcis_regions}
          />
          <ApiStatusRow
            label="버스 정류장"
            state={serviceStatus.stcis_bus_stops}
          />
          <ApiStatusRow
            label="버스 노선"
            state={serviceStatus.stcis_bus_routes}
          />
          <ApiStatusRow
            label="버스 도착 정보"
            state={serviceStatus.bus_arrivals}
          />
          <ApiStatusRow
            label="이동 통계"
            state={serviceStatus.stcis_statistics}
          />
        </div>
      </section>

      <div className="source-note">
        <span>i</span>
        <p>
          <strong>정보 안내</strong>
          서비스별로 제공 지역과 정보 갱신 시각이 다를 수 있어요.
        </p>
      </div>
    </div>
  );
}
