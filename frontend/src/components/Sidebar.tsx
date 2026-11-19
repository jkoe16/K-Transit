import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const navigation = [
  { to: "/", label: "홈", icon: "⌂" },
  { to: "/bus", label: "버스", icon: "▰" },
  { to: "/subway", label: "지하철", icon: "▤" },
  { to: "/routes", label: "경로 검색", icon: "↗" },
  { to: "/map", label: "지도", icon: "◎" },
  { to: "/statistics", label: "통계", icon: "▥" },
];

export default function Sidebar({ stcisStatus }: { stcisStatus: string }) {
  const { pathname } = useLocation();

  // 모바일에서 가로 스크롤되는 메뉴가 현재 항목을 가리지 않도록 맞춰 준다.
  useEffect(() => {
    document
      .querySelector(".nav-item.active")
      ?.scrollIntoView?.({ inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <aside className="sidebar">
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
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-status">
          <span className={`status-dot ${stcisStatus === "configured" ? "live" : ""}`} />
          <div>
            <strong>데이터 연결 상태</strong>
            <small>
              {stcisStatus === "configured"
                ? "STCIS 키 연결됨"
                : stcisStatus === "backend_not_configured"
                  ? "백엔드 주소 설정 필요"
                  : stcisStatus === "unavailable"
                  ? "API 서버 연결 실패"
                  : "STCIS 키 설정 필요"}
            </small>
          </div>
        </div>
        <p>공공데이터 기반 전국 교통정보</p>
      </div>
    </aside>
  );
}
