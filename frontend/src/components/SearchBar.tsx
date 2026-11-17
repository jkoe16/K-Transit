import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

type SearchType = "stop-ars" | "stop-name" | "route" | "subway";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("stop-ars");
  const navigate = useNavigate();

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    if (type === "stop-ars") {
      navigate(`/bus?sttn_arsno=${encodeURIComponent(value)}`);
    } else if (type === "stop-name") {
      navigate(`/bus?sttn_name=${encodeURIComponent(value)}`);
    } else if (type === "route") {
      navigate(`/routes?route_nm=${encodeURIComponent(value)}`);
    } else {
      navigate(`/subway?query=${encodeURIComponent(value)}`);
    }
  }

  return (
    <section className="search-card">
      <div className="search-card-title">
        <span className="search-symbol">⌕</span>
        <div>
          <h2>교통정보 통합 검색</h2>
          <p>정류장 ARS 번호 또는 버스 노선명을 검색하세요.</p>
        </div>
      </div>
      <form className="home-search" onSubmit={submit}>
        <label className="search-input-look">
          <span>⌕</span>
          <input
            aria-label="교통정보 검색어"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              type === "stop-ars"
                ? "정류장 ARS 번호"
                : type === "stop-name"
                  ? "정류장명 · 지역 선택 필요"
                : type === "route"
                  ? "버스 노선명"
                  : "지하철역명 · 연동 대기"
            }
          />
        </label>
        <label className="search-type">
          <span className="sr-only">검색 종류</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as SearchType)}
          >
            <option value="stop-ars">정류장 ARS</option>
            <option value="stop-name">정류장명</option>
            <option value="route">버스 노선</option>
            <option value="subway">지하철역</option>
          </select>
        </label>
        <button type="submit" className="primary-button">
          검색하기 <span>→</span>
        </button>
      </form>
      <div className="search-tags">
        <span>바로가기</span>
        <Link to="/bus">버스 정류장</Link>
        <Link to="/subway">지하철 정보</Link>
        <Link to="/routes">노선·경로</Link>
        <Link to="/statistics">이동 통계</Link>
      </div>
    </section>
  );
}
