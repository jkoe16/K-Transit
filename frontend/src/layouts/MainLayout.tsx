import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
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
          <span>전국 대중교통 정보를 한곳에서 확인하세요.</span>
        </footer>
      </main>
    </div>
  );
}
