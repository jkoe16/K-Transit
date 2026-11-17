import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import ApiResult from "../components/ApiResult";
import {
  ApiStatusRow,
  UnavailableCard,
} from "../components/ServiceCards";
import ToolPage from "../components/ToolPage";
import { fetchArrivalCities, fetchArrivals, fetchRegions, fetchStops } from "../services/api";
import type { RequestState } from "../types/api";
import type { ServiceStatusMap } from "../types/service";
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

export default function Bus({
  serviceStatus,
}: {
  serviceStatus: ServiceStatusMap;
}) {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    sd_cd: "",
    sgg_cd: "",
    emd_cd: "",
    sttn_arsno: searchParams.get("sttn_arsno") ?? "",
    sttn_name: searchParams.get("sttn_name") ?? "",
  });
  const [state, setState] = useState<RequestState>(initialState);
  const [regionState, setRegionState] = useState<RequestState>(initialState);
  const [arrivalCitiesState, setArrivalCitiesState] =
    useState<RequestState>(initialState);
  const [arrivalState, setArrivalState] = useState<RequestState>(initialState);
  const [cityCode, setCityCode] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [selectedStop, setSelectedStop] =
    useState<Record<string, unknown> | null>(null);

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
        sd_cd: form.sd_cd,
        sgg_cd: form.sgg_cd,
        emd_cd: form.emd_cd,
        sttn_arsno: form.sttn_arsno,
      }).filter(([, value]) => value.trim()),
    );
    if (!Object.keys(params).length) {
      setState({
        loading: false,
        error: "지역 코드 또는 정류장 ARS 번호를 입력하세요.",
        result: null,
      });
      return;
    }
    if (form.sttn_name.trim() && !form.sd_cd.trim()) {
      setState({
        loading: false,
        error:
          "정류장명은 STCIS의 공식 검색 변수로 확인되지 않았습니다. 이름 검색은 시도 코드를 먼저 입력한 뒤 지역 정류장 응답에서 필터링합니다.",
        result: null,
      });
      return;
    }
    setSelectedStop(null);
    await runRequest(setState, () => fetchStops(params));
  }

  async function loadRegions() {
    const params = Object.fromEntries(
      Object.entries({ sd_cd: form.sd_cd, sgg_cd: form.sgg_cd }).filter(
        ([, value]) => value.trim(),
      ),
    );
    await runRequest(setRegionState, () => fetchRegions(params));
  }

  async function loadArrivalCities() {
    await runRequest(setArrivalCitiesState, fetchArrivalCities);
  }

  async function searchArrivals(event: FormEvent) {
    event.preventDefault();
    if (!cityCode.trim() || !nodeId.trim()) {
      setArrivalState({
        loading: false,
        error: "TAGO 도시코드와 정류소 ID를 입력하세요.",
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
      eyebrow="BUS INFORMATION"
      title="버스 정류장 검색"
      description="STCIS에서 제공하는 지역 정류장과 ARS 번호를 조회합니다. 제공 응답은 필드를 추측하지 않고 원본 그대로 표시합니다."
    >
      <div className="tool-card">
        <div className="tool-card-heading">
          <span className="tool-card-icon">B</span>
          <div>
            <h2>정류장 검색 조건</h2>
            <p>
              지역코드 API에서 확인된 코드 또는 STCIS 정류장 ARS 번호를
              입력하세요.
            </p>
          </div>
        </div>
        <form className="form-grid" onSubmit={submitStops}>
          <label>
            시도 코드
            <input
              value={form.sd_cd}
              onChange={(event) =>
                setForm({ ...form, sd_cd: event.target.value })
              }
              placeholder="STCIS 시도 코드"
            />
          </label>
          <label>
            시군구 코드
            <input
              value={form.sgg_cd}
              onChange={(event) =>
                setForm({ ...form, sgg_cd: event.target.value })
              }
              placeholder="선택 입력"
            />
          </label>
          <label>
            읍면동 코드
            <input
              value={form.emd_cd}
              onChange={(event) =>
                setForm({ ...form, emd_cd: event.target.value })
              }
              placeholder="선택 입력"
            />
          </label>
          <label>
            정류장 ARS 번호
            <input
              value={form.sttn_arsno}
              onChange={(event) =>
                setForm({ ...form, sttn_arsno: event.target.value })
              }
              placeholder="선택 입력"
            />
          </label>
          <label className="form-span">
            정류장명 필터
            <input
              value={form.sttn_name}
              onChange={(event) =>
                setForm({ ...form, sttn_name: event.target.value })
              }
              placeholder="시도 코드로 조회한 실제 응답에서 필터링"
            />
          </label>
          <div className="form-actions form-span">
            <button
              className="primary-button form-submit"
              disabled={state.loading}
            >
              정류장 조회 <span>→</span>
            </button>
            <button
              className="secondary-button form-submit"
              type="button"
              disabled={regionState.loading}
              onClick={loadRegions}
            >
              지역코드 확인
            </button>
          </div>
        </form>
        <p className="form-hint">
          STCIS 명세에 정류장명 요청변수는 확인되지 않아 이름 검색은 지역
          정류장 결과를 받은 뒤 응답 원문에서만 필터링합니다. 지역코드 응답
          필드와 단계별 선택은 인증된 실제 응답 검증 후 적용합니다.
        </p>
      </div>

      <ApiStatusRow
        label="STCIS 지역코드"
        state={serviceStatus.stcis_regions}
      />
      <ApiStatusRow
        label="STCIS 버스 정류장"
        state={serviceStatus.stcis_bus_stops}
      />
      <ApiResult state={state} title="정류장 조회 응답" />
      {state.result && !state.error && (
        <section className="tool-card stop-results">
          <div className="result-heading">
            <h2>응답 내 정류장 항목</h2>
            <span>{stopRows.length}건</span>
          </div>
          {stopRows.length === 0 ? (
            <p className="empty-state">
              조건에 맞는 정류장이 없습니다. 지역코드나 ARS 번호를 바꿔
              다시 검색하세요.
            </p>
          ) : (
            <div className="stop-result-list">
              {stopRows.map((row, index) => (
                <button
                  type="button"
                  className={`stop-result-item${selectedStop === row ? " selected" : ""}`}
                  key={`${index}-${JSON.stringify(row)}`}
                  onClick={() => setSelectedStop(row)}
                >
                  <strong>정류장 결과 {index + 1}</strong>
                  <code>{JSON.stringify(row)}</code>
                </button>
              ))}
            </div>
          )}
          {selectedStop && (
            <div className="selected-stop-detail">
              <h3>선택한 정류장 원본 정보</h3>
              <pre>{JSON.stringify(selectedStop, null, 2)}</pre>
              <p>
                TAGO 도착정보는 도시코드와 TAGO 정류소 ID가 필요합니다. STCIS
                응답과 TAGO ID 간 대응 관계는 아직 확인되지 않았습니다.
              </p>
            </div>
          )}
        </section>
      )}
      <ApiResult state={regionState} title="STCIS 지역코드 응답" />

      <section className="tool-card">
        <div className="tool-card-heading">
          <span className="tool-card-icon">↗</span>
          <div>
            <h2>TAGO 실시간 도착정보</h2>
            <p>
              정류소별 도착예정정보 목록 조회 · 공식 필수 변수: 도시코드,
              정류소 ID
            </p>
          </div>
        </div>
        <ApiStatusRow
          label="TAGO 버스 도착정보"
          state={serviceStatus.bus_arrivals}
        />
        <ApiStatusRow
          label="TAGO 도시코드 목록"
          state={serviceStatus.bus_arrival_cities}
        />
        <form className="form-grid arrival-form" onSubmit={searchArrivals}>
          {arrivalCityOptions.length ? (
            <label>
              도시 선택
              <select
                value={cityCode}
                onChange={(event) => setCityCode(event.target.value)}
              >
                <option value="">도시를 선택하세요</option>
                {arrivalCityOptions.map((option) => (
                  <option value={option.code} key={option.code}>
                    {option.name} ({option.code})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              도시코드
              <input
                value={cityCode}
                onChange={(event) => setCityCode(event.target.value)}
                placeholder="도시코드 목록을 먼저 조회하세요"
              />
            </label>
          )}
          <label>
            TAGO 정류소 ID
            <input
              value={nodeId}
              onChange={(event) => setNodeId(event.target.value)}
              placeholder="예: DJB8001793"
            />
          </label>
          <div className="form-actions form-span">
            <button
              className="primary-button form-submit"
              disabled={arrivalState.loading}
            >
              도착정보 조회 <span>→</span>
            </button>
            <button
              className="secondary-button form-submit"
              type="button"
              disabled={arrivalCitiesState.loading}
              onClick={loadArrivalCities}
            >
              TAGO 도시코드 목록
            </button>
          </div>
        </form>
        <p className="form-hint">
          도착시간은 TAGO API 응답이 있을 때만 표시합니다. STCIS 정류장 결과와
          TAGO 정류소 ID를 자동 연결하려면 검증된 정류장 대응 정보가 추가로
          필요합니다.
        </p>
      </section>
      <ApiResult state={arrivalState} title="TAGO 도착정보 응답" />
      {arrivalRows.some((row) =>
        ["routeno", "routetp", "arrtime"].some((field) =>
          Object.prototype.hasOwnProperty.call(row, field),
        ),
      ) && (
        <section className="tool-card arrival-results">
          <div className="result-heading">
            <h2>버스 도착 예정</h2>
            <span>TAGO 제공 필드</span>
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
      <ApiResult state={arrivalCitiesState} title="TAGO 도시코드 응답" />
      <UnavailableCard
        title="정류장명 자동완성·지역 단계 선택"
        text="STCIS 인증 응답 구조와 명칭 검색 지원 변수를 확인할 때까지 지역 코드를 임의 변환하거나 정류장명을 API 파라미터로 보내지 않습니다."
      />
    </ToolPage>
  );
}
