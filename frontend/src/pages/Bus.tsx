import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import ApiResult from "../components/ApiResult";
import RegionSelect, { type RegionCodes } from "../components/RegionSelect";
import ToolPage from "../components/ToolPage";
import { fetchArrivalCities, fetchArrivals, fetchStops } from "../services/api";
import type { RequestState } from "../types/api";
import { runRequest } from "../utils/request";

const initialState: RequestState = { loading: false, error: "", result: null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    const records = value.filter(isRecord);
    return records.length ? records : value.flatMap(collectRecords);
  }
  if (!isRecord(value)) return [];
  return Object.values(value).flatMap(collectRecords);
}

function collectCityOptions(
  value: unknown,
): Array<{ code: string; name: string }> {
  if (Array.isArray(value)) return value.flatMap(collectCityOptions);
  if (!isRecord(value)) return [];
  const options: Array<{ code: string; name: string }> = [];
  if (
    (typeof value.citycode === "string" || typeof value.citycode === "number") &&
    typeof value.cityname === "string"
  ) {
    options.push({ code: String(value.citycode), name: value.cityname });
  }
  return options.concat(
    ...Object.values(value).map(collectCityOptions),
  );
}

function documentedField(
  row: Record<string, unknown>,
  field: string,
): string {
  const value = row[field];
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return "";
}

function formatArrivalSeconds(value: string): string {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return value;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes ? `${minutes}분 ${remainingSeconds}초` : `${remainingSeconds}초`;
}

export default function Bus() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    sttn_arsno: searchParams.get("sttn_arsno") ?? "",
    sttn_name: searchParams.get("sttn_name") ?? "",
  });
  const [region, setRegion] = useState<RegionCodes>({
    sd_cd: "",
    sgg_cd: "",
    emd_cd: "",
  });
  const [state, setState] = useState<RequestState>(initialState);
  const [arrivalCitiesState, setArrivalCitiesState] =
    useState<RequestState>(initialState);
  const [arrivalState, setArrivalState] = useState<RequestState>(initialState);
  const [cityCode, setCityCode] = useState("");
  const [nodeId, setNodeId] = useState("");

  const stopRows = useMemo(() => {
    const rows = collectRecords(state.result?.data);
    const query = form.sttn_name.trim().toLocaleLowerCase();
    return query
      ? rows.filter((row) =>
          JSON.stringify(row).toLocaleLowerCase().includes(query),
        )
      : rows;
  }, [form.sttn_name, state.result]);
  const arrivalCityOptions = useMemo(
    () => collectCityOptions(arrivalCitiesState.result?.data),
    [arrivalCitiesState.result],
  );
  const arrivalRows = useMemo(
    () => collectRecords(arrivalState.result?.data),
    [arrivalState.result],
  );

  async function submitStops(event: FormEvent) {
    event.preventDefault();
    const params = Object.fromEntries(
      Object.entries({
        sd_cd: region.sd_cd,
        sgg_cd: region.sgg_cd,
        emd_cd: region.emd_cd,
        sttn_arsno: form.sttn_arsno,
      }).filter(([, value]) => value.trim()),
    );
    if (form.sttn_name.trim() && !region.sd_cd) {
      setState({
        loading: false,
        error: "정류장 이름으로 찾으려면 먼저 시·도를 선택해 주세요.",
        result: null,
      });
      return;
    }
    if (!Object.keys(params).length) {
      setState({
        loading: false,
        error: "지역이나 정류장 번호를 입력해 주세요.",
        result: null,
      });
      return;
    }
    await runRequest(setState, () => fetchStops(params));
  }

  async function loadArrivalCities() {
    await runRequest(setArrivalCitiesState, fetchArrivalCities);
  }

  async function searchArrivals(event: FormEvent) {
    event.preventDefault();
    if (!cityCode.trim() || !nodeId.trim()) {
      setArrivalState({
        loading: false,
        error: "지역과 정류장 번호를 선택해 주세요.",
        result: null,
      });
      return;
    }
    await runRequest(setArrivalState, () =>
      fetchArrivals({ city_code: cityCode.trim(), node_id: nodeId.trim() }),
    );
  }

  return (
    <ToolPage
      eyebrow="버스 정보"
      title="버스 정류장 찾기"
      description="정류장 이름이나 번호로 가까운 정류장을 찾아보세요."
    >
      <div className="tool-card">
        <div className="tool-card-heading">
          <span className="tool-card-icon">B</span>
          <div>
            <h2>정류장 검색</h2>
            <p>지역을 선택하거나 정류장 번호를 입력하세요.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={submitStops}>
          <RegionSelect value={region} onChange={setRegion} />
          <label>
            정류장 번호
            <input
              value={form.sttn_arsno}
              onChange={(event) =>
                setForm({ ...form, sttn_arsno: event.target.value })
              }
              placeholder="정류장 번호 입력"
            />
          </label>
          <label className="form-span">
            정류장 이름
            <input
              value={form.sttn_name}
              onChange={(event) =>
                setForm({ ...form, sttn_name: event.target.value })
              }
              placeholder="예: 강남역"
            />
          </label>
          <div className="form-actions form-span">
            <button
              className="primary-button form-submit"
              disabled={state.loading}
            >
              정류장 찾기 <span>→</span>
            </button>
          </div>
        </form>
      </div>

      <ApiResult state={state} title="정류장 검색" />
      {state.result && !state.error && (
        <section className="tool-card stop-results">
          <div className="result-heading">
            <h2>검색 결과</h2>
            <span>{stopRows.length}곳</span>
          </div>
          {stopRows.length === 0 ? (
            <p className="empty-state">
              정류장 정보를 찾지 못했어요. 지역이나 검색어를 바꿔 다시 찾아보세요.
            </p>
          ) : (
            <p className="empty-state">
              실제 정류장 정보를 {stopRows.length}건 찾았어요.
            </p>
          )}
        </section>
      )}

      <section className="tool-card">
        <div className="tool-card-heading">
          <span className="tool-card-icon">↗</span>
          <div>
            <h2>실시간 버스 도착</h2>
            <p>지역과 정류장 번호를 선택해 도착 예정 정보를 확인하세요.</p>
          </div>
        </div>
        <form className="form-grid arrival-form" onSubmit={searchArrivals}>
          {arrivalCityOptions.length ? (
            <label>
              지역
              <select
                value={cityCode}
                onChange={(event) => setCityCode(event.target.value)}
              >
                <option value="">지역을 선택하세요</option>
                {arrivalCityOptions.map((option) => (
                  <option value={option.code} key={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="arrival-city-empty">
              <p>
                {arrivalCitiesState.result
                  ? "선택할 수 있는 지역 정보가 없습니다."
                  : "도착 정보를 확인할 지역을 불러와 주세요."}
              </p>
              <button
                className="secondary-button"
                type="button"
                disabled={arrivalCitiesState.loading}
                onClick={() => void loadArrivalCities()}
              >
                지역 목록 불러오기
              </button>
            </div>
          )}
          <label>
            정류장 번호
            <input
              value={nodeId}
              onChange={(event) => setNodeId(event.target.value)}
              placeholder="정류장 번호 입력"
            />
          </label>
          <div className="form-actions form-span">
            <button
              className="primary-button form-submit"
              disabled={arrivalState.loading}
            >
              도착 정보 찾기 <span>→</span>
            </button>
            <button
              className="secondary-button form-submit"
              type="button"
              disabled={arrivalCitiesState.loading}
              onClick={loadArrivalCities}
            >
              지역 목록 새로고침
            </button>
          </div>
        </form>
        <p className="form-hint">
          도착 예정 시간은 실제로 확인된 정보만 표시합니다.
        </p>
      </section>
      <ApiResult state={arrivalState} title="버스 도착 정보" />
      {arrivalRows.some((row) =>
        ["routeno", "routetp", "arrtime"].some((field) =>
          Object.prototype.hasOwnProperty.call(row, field),
        ),
      ) && (
        <section className="tool-card arrival-results">
          <div className="result-heading">
            <h2>도착 예정 버스</h2>
          </div>
          <div className="arrival-result-list">
            {arrivalRows.map((row, index) => {
              const fields = [
                ["nodenm", "정류장"],
                ["routeno", "노선"],
                ["routetp", "노선 유형"],
                ["arrprevstationcnt", "남은 정류장"],
                ["vehicletp", "차량 유형"],
              ] as const;
              const values: Array<{ label: string; value: string }> = fields
                .map(([key, label]) => ({
                  label,
                  value: documentedField(row, key),
                }))
                .filter((field) => field.value);
              const arrivalSeconds = documentedField(row, "arrtime");
              if (arrivalSeconds) {
                values.push({
                  label: "도착 예상",
                  value: formatArrivalSeconds(arrivalSeconds),
                });
              }
              return (
                <article className="arrival-result-item" key={`${index}-${JSON.stringify(row)}`}>
                  {values.map((field) => (
                    <div key={field.label}>
                      <small>{field.label}</small>
                      <strong>{field.value}</strong>
                    </div>
                  ))}
                </article>
              );
            })}
          </div>
        </section>
      )}
      <ApiResult state={arrivalCitiesState} title="지역 목록" />
    </ToolPage>
  );
}
