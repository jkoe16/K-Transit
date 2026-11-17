import { errorMessage, type ApiEnvelope } from "../services/api";
import type { RequestState } from "../types/api";

export async function runRequest<T = unknown>(
  setState: (state: RequestState<T>) => void,
  request: () => Promise<ApiEnvelope<T>>,
) {
  setState({ loading: true, error: "", result: null });
  try {
    setState({ loading: false, error: "", result: await request() });
  } catch (error) {
    setState({ loading: false, error: errorMessage(error), result: null });
  } finally {
    window.dispatchEvent(new Event("ktransit:service-status-change"));
  }
}
