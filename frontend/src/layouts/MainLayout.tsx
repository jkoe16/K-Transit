import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import type { ServiceStatusMap } from "../types/service";

export default function MainLayout({
  serviceStatus,
  backendConfigured,
}: {
  serviceStatus: ServiceStatusMap;
  backendConfigured: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        status={serviceStatus.stcis_bus_stops}
        backendConfigured={backendConfigured}
        open={mobileMenuOpen}
        onNavigate={() => setMobileMenuOpen(false)}
      />
      {mobileMenuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="메뉴 닫기"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <main className="main-area">
        <Header
          menuOpen={mobileMenuOpen}
          onMenuToggle={() => setMobileMenuOpen((open) => !open)}
        />
        <Outlet />
        <footer className="footer">
          <span>© 2026 K-Transit</span>
          <span>데이터 출처: STCIS · OpenStreetMap</span>
          <span>API별 제공 지역과 갱신 주기가 다를 수 있습니다.</span>
        </footer>
      </main>
    </div>
  );
}
