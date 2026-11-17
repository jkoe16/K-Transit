export type ServiceStatusCode =
  | "connected"
  | "error"
  | "waiting"
  | "key_required"
  | "auth_error"
  | "approval_pending"
  | "application_required"
  | "endpoint_unknown"
  | "invalid_response"
  | "no_data"
  | "region_limited"
  | "review_required";

export type ServiceStatus = {
  status: ServiceStatusCode;
  last_success_at: string | null;
  last_error?: string | null;
  http_status?: number | null;
  api_result_code?: string | null;
  response_format?: string | null;
  record_count?: number | null;
};

export type ServiceStatusMap = Record<string, ServiceStatus>;

export type ApiProvider = {
  id: string;
  name: string;
  provider: string;
  category: string;
  scope: string;
  realtime: boolean;
  endpoint: string;
  docs_url: string | null;
  application_url: string | null;
  key_env: string | null;
  key_configured: boolean | null;
  cadence: string;
  limits: string;
  notes: string;
  status: ServiceStatus;
};
