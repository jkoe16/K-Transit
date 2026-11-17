import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import type { ServiceStatus, ServiceStatusMap } from "./types/service";
import MainLayout from "./layouts/MainLayout";
import ApiStatus from "./pages/ApiStatus";
import Bus from "./pages/Bus";
import Home from "./pages/Home";
import Map from "./pages/Map";
import RouteSearch from "./pages/RouteSearch";
import Statistics from "./pages/Statistics";
import Subway from "./pages/Subway";
import { fetchHealth, isBackendConfigured } from "./services/api";

export default function App() {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatusMap>({});

  useEffect(() => {
    let active = true;
    async function refreshServiceStatus() {
      try {
        const health = await fetchHealth();
        if (active) setServiceStatus(health.services);
      } catch {
        if (!active) return;
        const fallback: ServiceStatus = {
          status: isBackendConfigured ? "error" : "waiting",
          last_success_at: null,
        };
        setServiceStatus(
          Object.fromEntries(
            [
              "stcis_regions",
              "stcis_bus_stops",
              "stcis_bus_routes",
              "stcis_statistics",
              "bus_arrivals",
              "bus_arrival_cities",
              "bus_positions",
              "tago_bus_positions",
              "klid_bus_positions",
              "its_traffic_speed",
              "its_traffic_congestion",
              "cctv_location",
              "cctv_video",
              "subway",
              "route_search",
            ].map((key) => [key, fallback]),
          ) as ServiceStatusMap,
        );
      }
    }

    void refreshServiceStatus();
    window.addEventListener(
      "ktransit:service-status-change",
      refreshServiceStatus,
    );
    return () => {
      active = false;
      window.removeEventListener(
        "ktransit:service-status-change",
        refreshServiceStatus,
      );
    };
  }, []);

  return (
    <Routes>
      <Route
        element={
          <MainLayout
            serviceStatus={serviceStatus}
            backendConfigured={isBackendConfigured}
          />
        }
      >
        <Route index element={<Home serviceStatus={serviceStatus} />} />
        <Route path="bus" element={<Bus serviceStatus={serviceStatus} />} />
        <Route
          path="subway"
          element={<Subway serviceStatus={serviceStatus} />}
        />
        <Route
          path="routes"
          element={<RouteSearch serviceStatus={serviceStatus} />}
        />
        <Route path="map" element={<Map serviceStatus={serviceStatus} />} />
        <Route
          path="statistics"
          element={<Statistics serviceStatus={serviceStatus} />}
        />
        <Route path="providers" element={<ApiStatus />} />
        <Route path="*" element={<Home serviceStatus={serviceStatus} />} />
      </Route>
    </Routes>
  );
}
