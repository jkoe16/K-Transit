import MapView from "../components/MapView";
import ToolPage from "../components/ToolPage";

export default function Map() {
  return (
    <ToolPage eyebrow="NATIONWIDE MAP" title="전국 교통 지도" description="지도 배경은 OpenStreetMap을 사용합니다. 교통 마커는 검증된 위치 응답이 연결된 뒤 표시됩니다.">
      <MapView />
      <div className="map-legend">
        <span><i className="legend-bus" />버스 위치 · 연동 대기</span>
        <span><i className="legend-stop" />정류장 · 좌표 미확인</span>
        <span><i className="legend-station" />지하철역 · 연동 대기</span>
      </div>
    </ToolPage>
  );
}
