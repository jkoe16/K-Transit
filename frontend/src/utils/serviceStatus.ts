import type { ServiceStatus } from "../types/service";

export function serviceStatusLabel(status: ServiceStatus["status"]): string {
  switch (status) {
    case "connected":
      return "연결 정상";
    case "error":
      return "연결 오류";
    case "key_required":
      return "인증키 설정 필요";
    case "auth_error":
      return "인증키 오류";
    case "approval_pending":
      return "승인 대기";
    case "application_required":
      return "신청 필요";
    case "endpoint_unknown":
      return "API 주소 미확인";
    case "invalid_response":
      return "응답 형식 오류";
    case "no_data":
      return "데이터 없음";
    case "region_limited":
      return "제공 지역 제한";
    case "review_required":
      return "명세 확인 필요";
    default:
      return "연동 대기";
  }
}

export function lastSuccessLabel(state: ServiceStatus): string {
  if (!state.last_success_at) return "성공 조회 기록 없음";
  const date = new Date(state.last_success_at);
  if (Number.isNaN(date.getTime())) return "성공 조회 시각 확인 불가";
  return `최근 성공 ${date.toLocaleString("ko-KR")}`;
}
