import { useState, type ChangeEvent, type FormEvent } from "react";
import RegionSelect, { type RegionCodes } from "../components/RegionSelect";
import ApiResult from "../components/ApiResult";
import { ApiStatusRow } from "../components/ServiceCards";
import ToolPage from "../components/ToolPage";
import { fetchQuarterOd } from "../services/api";
import type { RequestState } from "../types/api";
import type { ServiceStatusMap } from "../types/service";
import { runRequest } from "../utils/request";

const emptyRegion: RegionCodes = { sd_cd: "", sgg_cd: "", emd_cd: "" };

export default function Statistics({
  serviceStatus,
}: {
  serviceStatus: ServiceStatusMap;
}) {
  const [date, setDate] = useState("");
  const [origin, setOrigin] = useState(emptyRegion);
  const [destination, setDestination] = useState(emptyRegion);
  const [state, setState] = useState<RequestState>({
    loading: false,
    error: "",
    result: null,
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!date || !origin.emd_cd || !destination.emd_cd) {
      setState({
        loading: false,
        error: "날짜와 출발지·도착지를 선택해 주세요.",
        result: null,
      });
      return;
    }

    void runRequest(setState, () =>
      fetchQuarterOd({
        oprat_date: date,
        stg_emd_cd: origin.emd_cd,
        arr_emd_cd: destination.emd_cd,
      }),
    );
  }

  function updateDate(event: ChangeEvent<HTMLInputElement>) {
    setDate(event.target.value);
  }

  return (
    <ToolPage
      eyebrow="이동 정보"
      title="지역 간 이동 정보"
      description="날짜와 출발지, 도착지를 선택해 이동 정보를 확인하세요."
    >
      <div className="tool-card">
        <div className="tool-card-heading">
          <span className="tool-card-icon">▥</span>
          <div>
            <h2>검색 조건</h2>
            <p>날짜와 읍·면·동을 선택해 주세요.</p>
          </div>
        </div>
        <form className="form-grid stats-form" onSubmit={submit}>
          <label className="form-span">
            날짜
            <input
              value={date}
              onChange={updateDate}
              placeholder="날짜 입력"
              required
            />
          </label>
          <RegionSelect
            label="출발 지역"
            value={origin}
            onChange={setOrigin}
          />
          <RegionSelect
            label="도착 지역"
            value={destination}
            onChange={setDestination}
          />
          <button
            className="primary-button form-submit"
            disabled={state.loading}
          >
            이동 정보 찾기 <span>→</span>
          </button>
        </form>
      </div>
      <ApiStatusRow
        label="이동 통계"
        state={serviceStatus.stcis_statistics}
      />
      <ApiResult state={state} title="이동 정보" />
    </ToolPage>
  );
}
