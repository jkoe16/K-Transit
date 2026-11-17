import { StatusRow, UnavailableCard } from "../components/ServiceCards";
import ToolPage from "../components/ToolPage";

export default function Subway() {
  return (
    <ToolPage eyebrow="SUBWAY INFORMATION" title="지하철 정보" description="전국 지하철 정보를 제공하기 위한 연동 준비 상태입니다.">
      <UnavailableCard title="상세 명세 확인 · 연동 대기" text="TAGO 지하철정보의 역 검색·시간표 기능은 공식 상세 명세를 확인했으며, 실제 API 연결과 응답 검증은 아직 진행되지 않았습니다. 실시간 지하철 도착정보는 별도 제공 API 확인이 필요합니다." />
      <div className="tool-card source-list">
        <h2>연동 대기 항목</h2>
        <StatusRow label="역 검색·시간표" value="명세 확인 · 연동 대기" />
        <StatusRow label="지하철 노선 조회" value="상세기능 확인 필요" />
        <StatusRow label="실시간 도착정보" value="별도 API 확인 필요" />
      </div>
    </ToolPage>
  );
}
