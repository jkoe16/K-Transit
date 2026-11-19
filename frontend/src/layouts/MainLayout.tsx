import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ stcisStatus }: { stcisStatus: string }) {
  return (
    <div className="app-shell">
      <Sidebar stcisStatus={stcisStatus} />
      <main className="main-area">
        <Header />
        <Outlet />
        <footer className="footer">
          <span>© 2026 K-Transit</span>
          <span>데이터 출처: STCIS · TAGO · OpenStreetMap</span>
          <span>API별 제공 지역과 갱신 주기가 다를 수 있습니다.</span>
        </footer>
      </main>
    </div>
  );
}
