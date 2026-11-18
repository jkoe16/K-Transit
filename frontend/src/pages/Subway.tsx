import { useSearchParams } from "react-router-dom";
import {
  ApiStatusRow,
  StatusRow,
  UnavailableCard,
} from "../components/ServiceCards";
import ToolPage from "../components/ToolPage";
import type { ServiceStatusMap } from "../types/service";

export default function Subway({
  serviceStatus,
}: {
  serviceStatus: ServiceStatusMap;
}) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query")?.trim();

  return (
    <ToolPage eyebrow="지하철 정보" title="지하철역 찾기" description="지하철역과 노선 정보를 준비하고 있습니다.">
      <UnavailableCard
        title={query ? `"${query}" 역 정보 준비 중` : "지하철 정보 준비 중"}
        text="지하철역과 도착 정보를 확인할 수 있도록 준비하고 있습니다."
      />
      <ApiStatusRow label="지하철 정보" state={serviceStatus.subway} />
      <div className="tool-card source-list">
        <h2>이용 안내</h2>
        <StatusRow label="지하철역 검색" value="준비 중" />
        <StatusRow label="노선 정보" value="준비 중" />
        <StatusRow label="도착 정보" value="준비 중" />
      </div>
    </ToolPage>
  );
}
