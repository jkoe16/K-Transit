import { Link, NavLink } from "react-router-dom";
import type { ServiceStatus } from "../types/service";
import { serviceStatusLabel } from "../utils/serviceStatus";

const navigation = [
  { to: "/", label: "홈", icon: "⌂" },
  { to: "/bus", label: "버스", icon: "▰" },
  { to: "/subway", label: "지하철", icon: "▤" },
  { to: "/routes", label: "경로 검색", icon: "↗" },
  { to: "/map", label: "지도", icon: "◎" },
  { to: "/statistics", label: "통계", icon: "▥" },
  { to: "/providers", label: "API 현황", icon: "API" },
];

export default function Sidebar({
  status,
  backendConfigured,
  open,
  onNavigate,
}: {
  status?: ServiceStatus;
  backendConfigured: boolean;
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
      <div className="side-label">서비스</div>
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
      <div className="sidebar-bottom">
        <div className="sidebar-status">
          <span className={`status-dot ${status?.status === "connected" ? "live" : ""}`} />
          <div>
            <strong>데이터 연결 상태</strong>
            <small>
              {!backendConfigured
                ? "백엔드 주소 설정 필요"
                : serviceStatusLabel(status?.status ?? "waiting")}
            </small>
          </div>
        </div>
        <p>공공데이터 기반 전국 교통정보</p>
      </div>
    </aside>
  );
}
