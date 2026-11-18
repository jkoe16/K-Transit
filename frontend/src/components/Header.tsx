import { useLocation } from "react-router-dom";

const pageNames: Record<string, string> = {
  "/": "홈",
  "/bus": "버스 정류장",
  "/subway": "지하철",
  "/routes": "버스 노선·길찾기",
  "/map": "지도",
  "/statistics": "이동 통계",
  "/providers": "이용 안내",
};

export default function Header({
  menuOpen,
  onMenuToggle,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  const { pathname } = useLocation();

  return (
    <header className="topbar">
      <button
        className="mobile-menu-button"
        type="button"
        aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={menuOpen}
        onClick={onMenuToggle}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="breadcrumbs">
        <span>K-Transit</span>
        <span className="crumb-slash">/</span>
        <strong>{pageNames[pathname] ?? "K-Transit"}</strong>
      </div>
      <div className="topbar-right">
        <span className="scope-pill"><span /> 전국 대중교통 안내</span>
        <span className="avatar">KT</span>
      </div>
    </header>
  );
}
