import type { ApiEnvelope } from "../services/api";

export type RequestState = {
  loading: boolean;
  error: string;
  result: ApiEnvelope | null;
};
