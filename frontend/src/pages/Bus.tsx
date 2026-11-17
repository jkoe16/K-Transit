import { useState, type ChangeEvent, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchRegions, fetchStops } from "../services/api";
import type { RequestState } from "../types/api";
import ApiResult from "../components/ApiResult";
import { UnavailableCard } from "../components/ServiceCards";
import ToolPage from "../components/ToolPage";
import { runRequest } from "../utils/request";

const initialState: RequestState = { loading: false, error: "", result: null };

export default function Bus() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    sd_cd: "",
    sgg_cd: "",
    emd_cd: "",
    sttn_arsno: searchParams.get("sttn_arsno") ?? "",
  });
  const [state, setState] = useState<RequestState>(initialState);
  const [regionState, setRegionState] = useState<RequestState>(initialState);
  const update = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: event.target.value });

  async function submit(event: FormEvent) {
    event.preventDefault();
    const params = Object.fromEntries(
      Object.entries(form).filter(([, value]) => value.trim()),
    );
    await runRequest(setState, () => fetchStops(params));
  }

  async function loadRegions() {
    const params = Object.fromEntries(
      Object.entries({ sd_cd: form.sd_cd, sgg_cd: form.sgg_cd }).filter(([, value]) => value.trim()),
    );
    await runRequest(setRegionState, () => fetchRegions(params));
  }

  return (
    <ToolPage eyebrow="BUS INFORMATION" title="버스 정류장 검색" description="STCIS에서 제공하는 지역별 정류장 정보를 조회합니다. 제공 필드는 원본 응답을 확인하세요.">
      <div className="tool-card">
        <div className="tool-card-heading"><span className="tool-card-icon">▰</span><div><h2>정류장 검색 조건</h2><p>시도·시군구·읍면동 코드는 STCIS 지역코드를 입력하세요.</p></div></div>
        <form className="form-grid" onSubmit={submit}>
          <label>시도 코드<input value={form.sd_cd} onChange={update("sd_cd")} placeholder="예: 지역코드" /></label>
          <label>시군구 코드<input value={form.sgg_cd} onChange={update("sgg_cd")} placeholder="선택 입력" /></label>
          <label>읍면동 코드<input value={form.emd_cd} onChange={update("emd_cd")} placeholder="선택 입력" /></label>
          <label>정류장 ARS 번호<input value={form.sttn_arsno} onChange={update("sttn_arsno")} placeholder="선택 입력" /></label>
          <div className="form-actions">
            <button className="primary-button form-submit" disabled={state.loading}>정류장 조회 <span>→</span></button>
            <button className="secondary-button form-submit" type="button" disabled={regionState.loading} onClick={loadRegions}>지역코드 조회</button>
          </div>
        </form>
        <p className="form-hint">검색 결과가 비어 있으면 조건을 추가하거나 인증키·API 제공 범위를 확인하세요.</p>
      </div>
      <ApiResult state={state} />
      <ApiResult state={regionState} title="지역코드 조회 결과" />
      <UnavailableCard title="도착 예정정보" text="TAGO 버스 도착정보 API의 공식 경로와 주요 요청변수는 확인했으며, 정류장 ID 연결과 실제 호출 검증 후 연동합니다." />
    </ToolPage>
  );
}
