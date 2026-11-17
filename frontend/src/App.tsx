import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Bus from "./pages/Bus";
import Home from "./pages/Home";
import Map from "./pages/Map";
import RouteSearch from "./pages/RouteSearch";
import Statistics from "./pages/Statistics";
import Subway from "./pages/Subway";
import { fetchHealth, isBackendConfigured } from "./services/api";

export default function App() {
  const [serviceStatus, setServiceStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchHealth()
      .then((health) => setServiceStatus(health.services))
      .catch(() =>
        setServiceStatus({
          stcis: isBackendConfigured ? "unavailable" : "backend_not_configured",
        }),
      );
  }, []);

  return (
    <Routes>
      <Route element={<MainLayout stcisStatus={serviceStatus.stcis ?? ""} />}>
        <Route index element={<Home serviceStatus={serviceStatus} />} />
        <Route path="bus" element={<Bus />} />
        <Route path="subway" element={<Subway />} />
        <Route path="routes" element={<RouteSearch />} />
        <Route path="map" element={<Map />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="*" element={<Home serviceStatus={serviceStatus} />} />
      </Route>
    </Routes>
  );
}
