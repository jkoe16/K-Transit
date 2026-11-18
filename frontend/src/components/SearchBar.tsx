import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

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
    <section className="search-card" aria-labelledby="home-search-title">
      <div className="search-card-title">
        <span className="search-symbol">⌕</span>
        <div>
          <h2 id="home-search-title">대중교통 통합 검색</h2>
          <p>정류장과 버스 노선을 검색하고, 지하철 정보 제공 상태를 확인하세요.</p>
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
                ? "정류장 번호 입력"
                : type === "stop-name"
                  ? "정류장 이름 입력"
                : type === "route"
                  ? "버스 노선 입력"
                  : "지하철역 정보는 준비 중"
            }
            disabled={type === "subway"}
          />
        </label>
        <label className="search-type">
          <span className="sr-only">검색 종류</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as SearchType)}
          >
            <option value="stop-ars">정류장 번호</option>
            <option value="stop-name">정류장 이름</option>
            <option value="route">버스 노선</option>
            <option value="subway" disabled>지하철역 (준비 중)</option>
          </select>
        </label>
        <button type="submit" className="primary-button home-search-submit">
          검색하기 <span>→</span>
        </button>
      </form>
    </section>
  );
}
