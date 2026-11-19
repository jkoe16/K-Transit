import type { ReactNode } from "react";
import { isBackendConfigured } from "../services/api";

export default function ToolPage({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="page-content tool-page">
      <div className="page-title">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {!isBackendConfigured && (
        <div className="setup-banner" role="status">
          <span aria-hidden="true">ⓘ</span>
          <div>
            <strong>백엔드 주소가 설정되지 않았습니다</strong>
            이 화면의 조회는 FastAPI 서버가 있어야 동작합니다. 배포한 서버 주소를 저장소 변수 KTRANSIT_API_BASE_URL에 설정한 뒤 다시 배포하세요.
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
