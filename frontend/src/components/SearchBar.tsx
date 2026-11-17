import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [arsNumber, setArsNumber] = useState("");
  const navigate = useNavigate();

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = arsNumber.trim();
    if (value) navigate(`/bus?sttn_arsno=${encodeURIComponent(value)}`);
  }

  return (
    <section className="search-card">
      <div className="search-card-title">
        <span className="search-symbol">⌕</span>
        <div>
          <h2>어디로 이동하시나요?</h2>
          <p>버스 정류장 또는 노선 경유지를 검색하세요.</p>
        </div>
      </div>
      <form className="home-search" onSubmit={submit}>
        <label className="search-input-look">
          <span>⌕</span>
          <input
            aria-label="버스 정류장 ARS 번호"
            value={arsNumber}
            onChange={(event) => setArsNumber(event.target.value)}
            placeholder="버스 정류장 ARS 번호 입력"
          />
        </label>
        <button type="submit" className="primary-button">검색하기 <span>→</span></button>
      </form>
      <div className="search-tags">
        <span>빠른 메뉴</span>
        <Link to="/bus">버스 정류장</Link>
        <Link to="/routes">노선 경유지</Link>
        <Link to="/statistics">이동 통계</Link>
      </div>
    </section>
  );
}
