import { errorMessage, type ApiEnvelope } from "../services/api";
import type { RequestState } from "../types/api";

export async function runRequest(
  setState: (state: RequestState) => void,
  request: () => Promise<ApiEnvelope>,
) {
  setState({ loading: true, error: "", result: null });
  try {
    setState({ loading: false, error: "", result: await request() });
  } catch (error) {
    setState({ loading: false, error: errorMessage(error), result: null });
  }
}
