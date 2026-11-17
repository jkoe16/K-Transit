import { useLocation } from "react-router-dom";

const pageNames: Record<string, string> = {
  "/": "홈",
  "/bus": "버스",
  "/subway": "지하철",
  "/routes": "경로 검색",
  "/map": "지도",
  "/statistics": "통계",
};

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>K-Transit</span>
        <span className="crumb-slash">/</span>
        <strong>{pageNames[pathname] ?? "K-Transit"}</strong>
      </div>
      <div className="topbar-right">
        <span className="scope-pill"><span /> 전국 · API별 제공 범위 상이</span>
        <span className="avatar">KT</span>
      </div>
    </header>
  );
}
