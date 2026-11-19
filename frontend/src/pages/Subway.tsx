import { useState, type ChangeEvent, type FormEvent } from "react";
import { fetchSubwayStations, fetchSubwayTimetable } from "../services/api";
import type { RequestState } from "../types/api";
import ApiResult from "../components/ApiResult";
import { StatusRow, UnavailableCard } from "../components/ServiceCards";
import ToolPage from "../components/ToolPage";
import { runRequest } from "../utils/request";

const initialState: RequestState = { loading: false, error: "", result: null };

export default function Subway() {
  const [stationName, setStationName] = useState("");
  const [timetable, setTimetable] = useState({
    station_id: "",
    daily_type_code: "01",
    up_down_type_code: "U",
  });
  const [stationState, setStationState] = useState<RequestState>(initialState);
  const [timetableState, setTimetableState] = useState<RequestState>(initialState);

  const updateTimetable =
    (key: keyof typeof timetable) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setTimetable({ ...timetable, [key]: event.target.value });

  async function searchStations(event: FormEvent) {
    event.preventDefault();
    if (!stationName.trim()) return;
    await runRequest(setStationState, () =>
      fetchSubwayStations({ station_name: stationName.trim() }),
    );
  }

  async function loadTimetable(event: FormEvent) {
    event.preventDefault();
    if (!timetable.station_id.trim()) return;
    await runRequest(setTimetableState, () =>
      fetchSubwayTimetable({ ...timetable, station_id: timetable.station_id.trim() }),
    );
  }

  return (
    <ToolPage eyebrow="SUBWAY INFORMATION" title="지하철 정보" description="TAGO 지하철정보에서 역을 검색하고 시간표를 조회합니다. 제공 필드는 원본 응답을 확인하세요.">
      <div className="tool-card">
        <div className="tool-card-heading"><span className="tool-card-icon">▤</span><div><h2>지하철역 검색</h2><p>역 이름 키워드로 검색한 뒤 결과의 지하철역 ID를 시간표 조회에 사용하세요.</p></div></div>
        <form className="form-grid" onSubmit={searchStations}>
          <label>역 이름<input value={stationName} onChange={(event) => setStationName(event.target.value)} placeholder="예: 서울" required /></label>
          <div className="form-actions">
            <button className="primary-button form-submit" disabled={stationState.loading}>역 검색 <span>→</span></button>
          </div>
        </form>
      </div>
      <ApiResult state={stationState} title="역 검색 결과" />

      <div className="tool-card">
        <div className="tool-card-heading"><span className="tool-card-icon">◷</span><div><h2>역별 시간표</h2><p>요일·상하행 코드는 공식 명세와 대조 전(미검증) 값입니다. 응답이 비어 있으면 알려주세요.</p></div></div>
        <form className="form-grid" onSubmit={loadTimetable}>
          <label>지하철역 ID<input value={timetable.station_id} onChange={updateTimetable("station_id")} placeholder="역 검색 결과의 ID" required /></label>
          <label>요일 구분
            <select value={timetable.daily_type_code} onChange={updateTimetable("daily_type_code")}>
              <option value="01">평일</option>
              <option value="02">토요일</option>
              <option value="03">일요일·공휴일</option>
            </select>
          </label>
          <label>상하행
            <select value={timetable.up_down_type_code} onChange={updateTimetable("up_down_type_code")}>
              <option value="U">상행</option>
              <option value="D">하행</option>
            </select>
          </label>
          <div className="form-actions">
            <button className="primary-button form-submit" disabled={timetableState.loading}>시간표 조회 <span>→</span></button>
          </div>
        </form>
      </div>
      <ApiResult state={timetableState} title="시간표 조회 결과" />

      <UnavailableCard title="실시간 도착정보 · 연동 대기" text="실시간 지하철 도착정보는 별도 제공 API 확인이 필요하며, 현재는 연동되지 않았습니다." />
      <div className="tool-card source-list">
        <h2>연동 현황</h2>
        <StatusRow label="역 검색" value="TAGO 연동 · 응답 미검증" />
        <StatusRow label="역별 시간표" value="TAGO 연동 · 응답 미검증" />
        <StatusRow label="지하철 노선 조회" value="상세기능 확인 필요" />
        <StatusRow label="실시간 도착정보" value="별도 API 확인 필요" />
      </div>
    </ToolPage>
  );
}
