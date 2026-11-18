import { useSearchParams } from "react-router-dom";
import { UnavailableCard } from "../components/ServiceCards";
import ToolPage from "../components/ToolPage";

export default function Subway() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query")?.trim();

  return (
    <ToolPage eyebrow="지하철 정보" title="지하철역 찾기" description="지하철역과 노선 정보를 준비하고 있습니다.">
      <UnavailableCard
        title={query ? `"${query}" 역 정보 준비 중` : "지하철 정보 준비 중"}
        text="지하철역 검색과 도착정보는 제공을 준비하고 있어요."
      />
    </ToolPage>
  );
}
