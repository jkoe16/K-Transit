import { Link, NavLink } from "react-router-dom";

const navigation = [
  { to: "/", label: "홈", icon: "⌂" },
  { to: "/bus", label: "버스", icon: "▰" },
  { to: "/subway", label: "지하철", icon: "▤" },
  { to: "/routes", label: "길찾기", icon: "↗" },
  { to: "/map", label: "교통 지도", icon: "◎" },
];

export default function Sidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: () => void;
}) {
  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <Link className="brand" to="/" aria-label="K-Transit 홈">
        <span className="brand-mark">K</span>
        <span>
          <strong>K-Transit</strong>
          <small>전국 대중교통 통합정보</small>
        </span>
      </Link>
      <div className="side-label">주요 서비스</div>
      <nav className="nav-list" aria-label="주요 메뉴">
        {navigation.map((item) => (
          <NavLink
            end={item.to === "/"}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            to={item.to}
            key={item.to}
            onClick={onNavigate}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="side-label side-label-secondary">더 보기</div>
      <nav className="nav-list secondary-nav" aria-label="추가 메뉴">
        <NavLink
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          to="/statistics"
          onClick={onNavigate}
        >
          <span className="nav-icon">▥</span>
          지역 이동 통계
        </NavLink>
      </nav>
    </aside>
  );
}
