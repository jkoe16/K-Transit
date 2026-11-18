import type { ServiceStatus } from "../types/service";

export function serviceStatusLabel(status: ServiceStatus["status"]): string {
  switch (status) {
    case "connected":
      return "이용 가능";
    case "error":
    case "auth_error":
    case "invalid_response":
      return "잠시 이용할 수 없어요";
    case "key_required":
    case "approval_pending":
    case "application_required":
    case "endpoint_unknown":
    case "review_required":
      return "준비 중";
    case "no_data":
      return "표시할 정보가 없어요";
    case "region_limited":
      return "일부 지역에서 이용할 수 있어요";
    default:
      return "정보 확인 중";
  }
}

export function lastSuccessLabel(state: ServiceStatus): string {
  if (!state.last_success_at) return "아직 갱신된 정보가 없어요";
  const date = new Date(state.last_success_at);
  if (Number.isNaN(date.getTime())) return "정보 갱신 시각을 확인할 수 없어요";
  return `정보 갱신 ${date.toLocaleString("ko-KR")}`;
}
