import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ApiStatus from "./pages/ApiStatus";
import Bus from "./pages/Bus";
import Home from "./pages/Home";
import Map from "./pages/Map";
import RouteSearch from "./pages/RouteSearch";
import Statistics from "./pages/Statistics";
import Subway from "./pages/Subway";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="bus" element={<Bus />} />
        <Route path="subway" element={<Subway />} />
        <Route path="routes" element={<RouteSearch />} />
        <Route path="map" element={<Map />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="providers" element={<ApiStatus />} />
        <Route path="diagnostics" element={<ApiStatus />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
