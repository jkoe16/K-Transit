import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchBusArrivals, fetchRegions, fetchStops } from "../services/api";
import type { RequestState } from "../types/api";
import ApiResult from "../components/ApiResult";
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
  const [arrival, setArrival] = useState({ city_code: "", node_id: "" });
  const [arrivalState, setArrivalState] = useState<RequestState>(initialState);
  const urlArsno = searchParams.get("sttn_arsno")?.trim() ?? "";

  // 홈 화면 검색에서 넘어온 ARS 번호는 입력 칸에 채우고 바로 조회한다.
  useEffect(() => {
    if (!urlArsno) return;
    setForm((current) => ({ ...current, sttn_arsno: urlArsno }));
    void runRequest(setState, () => fetchStops({ sttn_arsno: urlArsno }));
  }, [urlArsno]);

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

  async function loadArrivals(event: FormEvent) {
    event.preventDefault();
    if (!arrival.city_code.trim() || !arrival.node_id.trim()) return;
    await runRequest(setArrivalState, () =>
      fetchBusArrivals({
        city_code: arrival.city_code.trim(),
        node_id: arrival.node_id.trim(),
      }),
    );
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
      <div className="tool-card">
        <div className="tool-card-heading"><span className="tool-card-icon">◷</span><div><h2>버스 도착 예정정보</h2><p>TAGO 도시코드와 정류소 ID(nodeId)를 입력하세요. STCIS 정류장 번호와는 체계가 달라 자동 연결되지 않습니다.</p></div></div>
        <form className="form-grid" onSubmit={loadArrivals}>
          <label>도시코드<input value={arrival.city_code} onChange={(event) => setArrival({ ...arrival, city_code: event.target.value })} placeholder="TAGO 도시코드" required /></label>
          <label>정류소 ID<input value={arrival.node_id} onChange={(event) => setArrival({ ...arrival, node_id: event.target.value })} placeholder="nodeId" required /></label>
          <div className="form-actions">
            <button className="primary-button form-submit" disabled={arrivalState.loading}>도착정보 조회 <span>→</span></button>
          </div>
        </form>
        <p className="form-hint">응답 필드는 공식 명세와 대조 전(미검증)이므로 원본 응답을 그대로 표시합니다.</p>
      </div>
      <ApiResult state={arrivalState} title="도착 예정정보 결과" />
    </ToolPage>
  );
}
