import { Link } from "react-router-dom";
import MapView from "../components/MapView";
import SearchBar from "../components/SearchBar";

export default function Home() {
  return (
    <div className="page-content home-page">
      <section className="home-hero">
        <div className="home-intro">
          <span className="eyebrow">전국 대중교통</span>
          <h1>
            어디로
            <br />
            <span>이동하시나요?</span>
          </h1>
          <p>
            버스 정류장과 노선을 찾고, 교통지도에서 주변 정보를 확인하세요.
          </p>
        </div>
        <SearchBar />
      </section>

      <section className="home-primary">
        <div className="section-heading">
          <div>
            <span className="eyebrow">빠른 시작</span>
            <h2>자주 찾는 서비스</h2>
          </div>
        </div>
        <div className="home-service-grid">
          <Link className="home-service-card" to="/bus">
            <span className="home-service-icon">B</span>
            <span className="home-service-label">버스</span>
            <strong>정류장 검색</strong>
            <p>이름이나 번호로 가까운 정류장을 찾아보세요.</p>
            <span className="home-card-action">정류장 찾기 <span>→</span></span>
          </Link>
          <Link className="home-service-card" to="/subway">
            <span className="home-service-icon">M</span>
            <span className="home-service-label">지하철</span>
            <strong>지하철 정보</strong>
            <p>역 검색과 도착정보 제공을 준비하고 있어요.</p>
            <span className="home-card-action home-coming-soon">준비 중</span>
          </Link>
          <Link className="home-service-card" to="/routes">
            <span className="home-service-icon">↗</span>
            <span className="home-service-label">대중교통</span>
            <strong>길찾기</strong>
            <p>출발지와 도착지 사이의 길찾기를 준비하고 있어요.</p>
            <span className="home-card-action home-coming-soon">준비 중</span>
          </Link>
          <article className="home-service-card home-map-card">
            <div className="home-map-copy">
              <span className="home-service-icon">◎</span>
              <span className="home-service-label">전국 지도</span>
              <strong>교통지도</strong>
              <Link className="home-card-action" to="/map">
                지도 열기 <span>→</span>
              </Link>
            </div>
            <div className="home-map-preview">
              <MapView compact />
            </div>
          </article>
        </div>
      </section>

      <section className="home-more">
        <div>
          <span className="eyebrow">추가 정보</span>
          <h2>지역 간 대중교통 이용 정보</h2>
        </div>
        <Link to="/statistics">지역 이동 통계 보기 <span>→</span></Link>
      </section>
    </div>
  );
}
