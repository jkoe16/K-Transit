import { MapContainer, TileLayer } from "react-leaflet";

type MapViewProps = {
  compact?: boolean;
};

export default function MapView({ compact = false }: MapViewProps) {
  return (
    <div className={compact ? "mini-map" : "full-map"}>
      <MapContainer
        center={[36.4, 127.8]}
        zoom={compact ? 5 : 7}
        zoomControl={!compact}
        scrollWheelZoom={!compact}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
      {compact ? (
        <div className="map-empty-label"><span>◎</span> 위치 데이터 미연동</div>
      ) : (
        <div className="map-overlay">
          <span>◎</span>
          <strong>교통 위치 데이터 미연동</strong>
          <small>버스·정류장·지하철 좌표 API 명세 확인 후 지도에 표시합니다.</small>
        </div>
      )}
    </div>
  );
}
