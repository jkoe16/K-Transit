import { useEffect, useMemo, useState } from "react";
import { fetchRegions } from "../services/api";
import {
  parseRegionRows,
  regionOptions,
  type RegionRow,
} from "../utils/regions";

export type RegionCodes = {
  sd_cd: string;
  sgg_cd: string;
  emd_cd: string;
};

type RegionLoadStatus = "idle" | "loading" | "ready" | "error";

function RegionLoadMessage({
  status,
  level,
  onRetry,
}: {
  status: RegionLoadStatus;
  level: string;
  onRetry: () => void;
}) {
  if (status === "loading") {
    return (
      <p className="region-select-message" role="status">
        {level} 정보를 불러오고 있어요.
      </p>
    );
  }
  if (status !== "error") return null;

  return (
    <div className="region-select-message region-select-error" role="alert">
      <span>{level} 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</span>
      <button
        type="button"
        className="secondary-button"
        onClick={onRetry}
      >
        다시 시도
      </button>
    </div>
  );
}

export default function RegionSelect({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: RegionCodes;
  onChange: (value: RegionCodes) => void;
}) {
  const [provinceRows, setProvinceRows] = useState<RegionRow[]>([]);
  const [districtRows, setDistrictRows] = useState<RegionRow[]>([]);
  const [neighborhoodRows, setNeighborhoodRows] = useState<RegionRow[]>([]);
  const [provinceStatus, setProvinceStatus] =
    useState<RegionLoadStatus>("loading");
  const [districtStatus, setDistrictStatus] =
    useState<RegionLoadStatus>("idle");
  const [neighborhoodStatus, setNeighborhoodStatus] =
    useState<RegionLoadStatus>("idle");
  const [provinceRetry, setProvinceRetry] = useState(0);
  const [districtRetry, setDistrictRetry] = useState(0);
  const [neighborhoodRetry, setNeighborhoodRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setProvinceStatus("loading");
    fetchRegions({})
      .then((response) => {
        if (!active) return;
        setProvinceRows(parseRegionRows(response.data));
        setProvinceStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setProvinceRows([]);
        setProvinceStatus("error");
      });

    return () => {
      active = false;
    };
  }, [provinceRetry]);

  useEffect(() => {
    let active = true;
    setDistrictRows([]);
    setNeighborhoodRows([]);
    if (!value.sd_cd) {
      setDistrictStatus("idle");
      setNeighborhoodStatus("idle");
      return () => {
        active = false;
      };
    }

    setDistrictStatus("loading");
    setNeighborhoodStatus("idle");
    fetchRegions({ sd_cd: value.sd_cd })
      .then((response) => {
        if (!active) return;
        setDistrictRows(parseRegionRows(response.data));
        setDistrictStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setDistrictRows([]);
        setDistrictStatus("error");
      });

    return () => {
      active = false;
    };
  }, [value.sd_cd, districtRetry]);

  useEffect(() => {
    let active = true;
    setNeighborhoodRows([]);
    if (!value.sd_cd || !value.sgg_cd) {
      setNeighborhoodStatus("idle");
      return () => {
        active = false;
      };
    }

    setNeighborhoodStatus("loading");
    fetchRegions({ sd_cd: value.sd_cd, sgg_cd: value.sgg_cd })
      .then((response) => {
        if (!active) return;
        setNeighborhoodRows(parseRegionRows(response.data));
        setNeighborhoodStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setNeighborhoodRows([]);
        setNeighborhoodStatus("error");
      });

    return () => {
      active = false;
    };
  }, [value.sd_cd, value.sgg_cd, neighborhoodRetry]);

  const provinces = useMemo(
    () => regionOptions(provinceRows, "sdCd", "sdNm"),
    [provinceRows],
  );
  const districts = useMemo(
    () => regionOptions(districtRows, "sggCd", "sggNm"),
    [districtRows],
  );
  const neighborhoods = useMemo(
    () => regionOptions(neighborhoodRows, "emdCd", "emdNm"),
    [neighborhoodRows],
  );

  return (
    <div className="region-select-group">
      {label && <h3>{label}</h3>}
      <div className="region-select-grid">
        <label>
          시·도
          <select
            value={value.sd_cd}
            disabled={provinceStatus !== "ready"}
            onChange={(event) => {
              setDistrictRows([]);
              setNeighborhoodRows([]);
              onChange({
                sd_cd: event.target.value,
                sgg_cd: "",
                emd_cd: "",
              });
            }}
          >
            <option value="">시·도 선택</option>
            {provinces.map((option) => (
              <option
                key={`${option.code}-${option.name}`}
                value={option.code}
              >
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          시·군·구
          <select
            value={value.sgg_cd}
            disabled={!value.sd_cd || districtStatus !== "ready"}
            onChange={(event) => {
              setNeighborhoodRows([]);
              onChange({
                ...value,
                sgg_cd: event.target.value,
                emd_cd: "",
              });
            }}
          >
            <option value="">시·군·구 선택</option>
            {districts.map((option) => (
              <option
                key={`${option.code}-${option.name}`}
                value={option.code}
              >
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          읍·면·동
          <select
            value={value.emd_cd}
            disabled={!value.sgg_cd || neighborhoodStatus !== "ready"}
            onChange={(event) =>
              onChange({ ...value, emd_cd: event.target.value })
            }
          >
            <option value="">읍·면·동 선택</option>
            {neighborhoods.map((option) => (
              <option
                key={`${option.code}-${option.name}`}
                value={option.code}
              >
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <RegionLoadMessage
        status={provinceStatus}
        level="시·도"
        onRetry={() => setProvinceRetry((retry) => retry + 1)}
      />
      <RegionLoadMessage
        status={districtStatus}
        level="시·군·구"
        onRetry={() => setDistrictRetry((retry) => retry + 1)}
      />
      <RegionLoadMessage
        status={neighborhoodStatus}
        level="읍·면·동"
        onRetry={() => setNeighborhoodRetry((retry) => retry + 1)}
      />
    </div>
  );
}
