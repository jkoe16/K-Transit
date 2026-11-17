import { useState, type ChangeEvent, type FormEvent } from "react";
import { fetchQuarterOd } from "../services/api";
import type { RequestState } from "../types/api";
import ApiResult from "../components/ApiResult";
import ToolPage from "../components/ToolPage";
import { runRequest } from "../utils/request";

export default function Statistics() {
  const [form, setForm] = useState({ oprat_date: "", stg_emd_cd: "", arr_emd_cd: "" });
  const [state, setState] = useState<RequestState>({ loading: false, error: "", result: null });
  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: event.target.value });

  async function submit(event: FormEvent) {
    event.preventDefault();
    await runRequest(setState, () => fetchQuarterOd(form));
  }

  return (
    <ToolPage eyebrow="TRANSPORT STATISTICS" title="15분 단위 이동 통계" description="STCIS quarterod API를 호출해 출발·도착 읍면동 간 OD 데이터를 조회합니다.">
      <div className="tool-card">
        <div className="tool-card-heading"><span className="tool-card-icon">▥</span><div><h2>통계 조회 조건</h2><p>필수 입력값은 STCIS API 요청변수에 전달됩니다.</p></div></div>
        <form className="form-grid stats-form" onSubmit={submit}>
          <label>운행일자<input type="date" value={form.oprat_date} onChange={update("oprat_date")} required /></label>
          <label>출발 읍면동 코드<input value={form.stg_emd_cd} onChange={update("stg_emd_cd")} required /></label>
          <label>도착 읍면동 코드<input value={form.arr_emd_cd} onChange={update("arr_emd_cd")} required /></label>
          <button className="primary-button form-submit" disabled={state.loading}>통계 조회 <span>→</span></button>
        </form>
        <p className="form-hint">차트와 표는 검증된 응답 필드 확인 후 추가됩니다. 현재는 실제 API 원본 응답을 표시합니다.</p>
      </div>
      <ApiResult state={state} />
    </ToolPage>
  );
}
