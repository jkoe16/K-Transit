import { useMemo, useState } from "react";
import Loading from "./Loading";
import type { RequestState } from "../types/api";

type Row = Record<string, unknown>;

const MAX_ROWS = 100;
const MAX_COLUMNS = 12;

function isRow(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPrimitive(value: unknown) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

// 응답 구조를 가정하지 않고, 처음 만나는 "객체 배열"을 표로 보여준다.
// 공공데이터 JSON은 결과가 1건일 때 배열 대신 단일 객체(`item`)로 오는 경우가 있어 함께 처리한다.
function findRows(value: unknown, depth = 0): Row[] | null {
  if (depth > 8 || typeof value !== "object" || value === null) return null;
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every(isRow)) return value as Row[];
    for (const item of value) {
      const found = findRows(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  const record = value as Row;
  if (isRow(record.item)) return [record.item];
  for (const child of Object.values(record)) {
    const found = findRows(child, depth + 1);
    if (found) return found;
  }
  return null;
}

export default function ApiResult({
  state,
  title = "조회 결과",
}: {
  state: RequestState;
  title?: string;
}) {
  const [view, setView] = useState<"table" | "json">("table");
  const [copied, setCopied] = useState(false);
  const data = state.result?.data;

  const json = useMemo(() => (data === undefined ? "" : JSON.stringify(data, null, 2)), [data]);
  const table = useMemo(() => {
    const rows = findRows(data);
    if (!rows) return null;
    const columns = [
      ...new Set(
        rows.flatMap((row) =>
          Object.entries(row)
            .filter(([, cell]) => isPrimitive(cell))
            .map(([key]) => key),
        ),
      ),
    ];
    if (columns.length === 0) return null;
    return { rows, columns: columns.slice(0, MAX_COLUMNS), hiddenColumns: Math.max(0, columns.length - MAX_COLUMNS) };
  }, [data]);

  if (!state.loading && !state.error && !state.result) return null;

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const showTable = table !== null && view === "table";

  return (
    <section className="result-panel" aria-live="polite">
      <div className="result-heading">
        <div><span className="eyebrow">API RESPONSE</span><h2>{title}</h2></div>
        {state.result && (
          <span className="result-source">
            {state.result.source} · {state.result.cached ? "캐시" : "실시간 조회"}
          </span>
        )}
      </div>
      {state.loading && <Loading label="공공데이터 API에 요청하고 있습니다." />}
      {state.error && <div className="error-state"><strong>조회에 실패했습니다</strong><p>{state.error}</p></div>}
      {state.result && (
        <>
          <div className="result-tools">
            <p className="fetched-at">데이터 조회 시각: {new Date(state.result.fetched_at).toLocaleString("ko-KR")}</p>
            {table && (
              <div className="view-toggle" role="group" aria-label="결과 보기 방식">
                <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>표</button>
                <button type="button" aria-pressed={view === "json"} onClick={() => setView("json")}>원본 JSON</button>
              </div>
            )}
            <button type="button" className="copy-button" onClick={copyJson}>
              {copied ? "복사됨" : "JSON 복사"}
            </button>
          </div>
          {showTable ? (
            <>
              <div className="table-wrap">
                <table className="result-table">
                  <thead>
                    <tr>{table.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr>
                  </thead>
                  <tbody>
                    {table.rows.slice(0, MAX_ROWS).map((row, index) => (
                      <tr key={index}>
                        {table.columns.map((column) => (
                          <td key={column}>{isPrimitive(row[column]) ? String(row[column] ?? "") : ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="table-note">
                응답에서 자동으로 찾은 목록 {table.rows.length}건
                {table.rows.length > MAX_ROWS ? ` 중 ${MAX_ROWS}건` : ""}을 표시합니다.
                {table.hiddenColumns > 0 ? ` 항목 ${table.hiddenColumns}개는 원본 JSON에서 확인하세요.` : ""}
                {" "}필드 이름은 가공하지 않은 원본 그대로입니다.
              </p>
            </>
          ) : (
            <pre className="json-result">{json}</pre>
          )}
        </>
      )}
    </section>
  );
}
