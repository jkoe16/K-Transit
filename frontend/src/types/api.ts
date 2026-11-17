import type { ApiEnvelope } from "../services/api";

export type RequestState<T = unknown> = {
  loading: boolean;
  error: string;
  result: ApiEnvelope<T> | null;
};
