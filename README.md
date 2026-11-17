# K-Transit

대한민국 전국 버스·지하철 정보를 통합하기 위한 React + FastAPI 프로젝트입니다. 실제 API 응답과 명세가 확인된 기능만 연동하며, 아직 연결하지 않은 정보는 화면과 API에서 미연동 상태로 분명히 구분합니다.

## 주요 기능

- STCIS 지역코드 조회, 버스정류장 조회, 노선 경유지 조회, 15분 OD 통계 프록시
- TAGO 버스 도착정보와 ITS 도로속도·돌발상황 프록시
- 전국 지도 배경과 반응형 홈/버스/지하철/노선/지도/통계 화면
- API 출처, 캐시 여부, 조회 시각과 오류 표시
- ITS 돌발상황의 검증된 좌표를 지도 마커로 표시
- 미연동 API는 `501 Not Implemented`로 반환하며 예시 데이터를 실제 값처럼 보여주지 않음
- API 키는 백엔드 환경변수로 관리하고, 기본 60초 응답 캐시 적용
- 실제 성공 응답을 확인한 API만 정상으로 표시하고, 마지막 성공 시각을 API별로 제공
- OpenFreeMap Liberty 벡터 지도의 한국어 `name:ko` 라벨 및 출처 표시

## 기술 스택

- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, Axios, Recharts, MapLibre GL
- Backend: Python, FastAPI, Pydantic, HTTPX, python-dotenv
- Infrastructure: PostgreSQL/PostGIS, Redis (Compose 개발 서비스)

## 프로젝트 구조

```text
k-transit/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/   # Header, Sidebar, SearchBar, MapView, Loading 등
│       ├── layouts/      # 공통 앱 레이아웃
│       ├── pages/        # Home, Bus, Subway, RouteSearch, Map, Statistics
│       ├── services/     # 백엔드 API 클라이언트
│       ├── hooks/
│       ├── types/
│       └── utils/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── services/     # STCIS, KLID, TAGO 연동 모듈
│   │   ├── schemas/
│   │   ├── models/
│   │   ├── database/
│   │   └── utils/
│   └── tests/
├── docker-compose.yml
└── README.md
```

## 설치 및 실행

### 사전 준비

- Python 3.11 이상
- Node.js 20 이상 및 npm
- (선택) Docker Desktop / Docker Compose

### API 키 설정

`backend\.env.example`을 `backend\.env`로 복사한 뒤 발급받은 키를 입력합니다.

```dotenv
STCIS_API_KEY=발급받은_STCIS_키
KLID_API_KEY=
TAGO_API_KEY=
TRAFFIC_API_KEY=
KECO_API_KEY=
DAEJEON_METRO_API_KEY=
REDIS_URL=
CORS_ORIGINS=http://localhost:5173,https://jkoe16.github.io
API_CACHE_TTL_SECONDS=60
```

실제 키는 저장소에 커밋하지 마세요. `.env`와 `.env.*`는 Git에서 제외하며, 브라우저에는 인증키를 전달하지 않습니다. ITS 교통소통 및 돌발상황은 `TRAFFIC_API_KEY`를 사용합니다. `KECO_API_KEY`와 `DAEJEON_METRO_API_KEY`는 문서 조사용으로 등록된 것이며 아직 API 프록시가 구현되지 않았습니다.

### 백엔드

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API 문서: `http://localhost:8000/docs`

### 프런트엔드

별도 터미널에서 실행합니다.

```powershell
cd frontend
npm install
npm run dev
```

웹 앱: `http://localhost:5173`

### Docker Compose

먼저 `backend\.env.example`을 `backend\.env`로 복사합니다.

```powershell
docker compose up --build
```

Compose는 프런트엔드, 백엔드, Redis, PostGIS를 실행합니다. 현재 앱은 PostGIS에 데이터를 저장하지 않고, Redis는 `REDIS_URL` 설정 시에만 API 캐시에 사용합니다. 로컬 키 없이도 UI와 서버는 실행되지만 STCIS 조회는 설정 오류를 반환합니다.

## GitHub Pages 배포

`.github/workflows/deploy-pages.yml`이 프런트엔드를 GitHub Pages용 정적 파일로 빌드·배포합니다. `main` 또는 초기 작업 브랜치에 push하거나 Actions에서 수동 실행하면 배포합니다. 저장소의 **Settings → Pages → Build and deployment → Source**가 **GitHub Actions**로 설정되어 있어야 합니다.

배포 주소: <https://jkoe16.github.io/K-Transit/>

GitHub Pages는 React 프런트엔드만 호스팅하며 FastAPI 서버를 실행하지 않습니다. 따라서 웹 화면은 백엔드 없이도 열리지만, STCIS 조회 기능을 사용하려면 FastAPI를 별도 서버에 배포해야 합니다. 배포 서버 주소를 GitHub 저장소의 **Settings → Secrets and variables → Actions → Variables**에서 `KTRANSIT_API_BASE_URL` 변수로 설정하면 Pages 빌드에 반영됩니다. 백엔드 CORS 설정에도 `https://jkoe16.github.io`를 허용해야 합니다. 주소를 설정하지 않으면 페이지에서 백엔드 주소 설정이 필요하다고 안내합니다. API 키는 Pages 변수에 넣지 말고, 백엔드 호스트의 환경변수로만 관리하세요.

내부 화면 이동은 GitHub Pages 새로고침 404를 피하도록 URL 해시를 사용합니다(예: `/#/bus`).

## Render 백엔드 배포 준비

저장소 루트의 `render.yaml`은 Render Blueprint용 FastAPI 설정입니다. 서비스 루트 디렉터리는 `backend`, 빌드 명령은 `pip install -r requirements.txt`, 시작 명령은 `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, 헬스 체크 경로는 `/health`입니다. Free 인스턴스를 지정했으며 유휴 시 일시 중지될 수 있습니다. 이 파일을 추가해도 서비스가 자동 생성되거나 배포되지는 않습니다.

배포할 때는 Render 대시보드에서 **New → Blueprint**를 선택해 저장소와 브랜치를 연결하고 `render.yaml`을 확인합니다. 환경변수 입력 단계에서 `STCIS_API_KEY`, `TAGO_API_KEY`, `KLID_API_KEY`, `TRAFFIC_API_KEY` 값을 Render에 직접 입력하세요. 이 항목들은 `sync: false`이며 키 값은 저장소, GitHub Pages 빌드 변수, 프런트엔드 또는 채팅에 넣지 않습니다. `CORS_ORIGINS`는 GitHub Pages 원본 `https://jkoe16.github.io`로 설정되어 있습니다. 생성 후 Render 로그에서 빌드/시작 성공을 확인하고 `https://<서비스 주소>/health` 및 `/docs`에 접속합니다.

백엔드 배포가 준비되면 GitHub 저장소의 **Settings → Secrets and variables → Actions → Variables**에서 `KTRANSIT_API_BASE_URL`을 Render 서비스의 HTTPS 원본 주소(예: `https://k-transit-api.onrender.com`, 끝 슬래시 없이)로 설정합니다. 이는 브라우저에 공개되는 API 주소이며 인증키를 설정하는 곳이 아닙니다. 이후 **Actions → Deploy K-Transit to GitHub Pages → Run workflow**로 Pages를 다시 빌드·배포해야 `VITE_API_BASE_URL`에 주소가 포함됩니다. 완료 후 Pages 사이트에서 브라우저 개발자 도구의 Network 탭으로 API 요청, CORS, 응답을 확인합니다.

## API 목록과 연동 현황

| 제공기관 | 공식 API / 기능 | 상태 |
| --- | --- | --- |
| STCIS | `/openapi/areacode.json` 지역코드 | 백엔드 프록시 연결; 실제 응답 확인에는 키 필요 |
| STCIS | `/openapi/bussttn.json` 버스정류장 | 백엔드 프록시 연결; 실제 응답 확인에는 키 필요 |
| STCIS | `/openapi/rlrdroutesttn.json` 노선 경유지 | 백엔드 프록시 연결; 실제 응답 확인에는 키 필요 |
| STCIS | `/openapi/quarterod.json` 15분 OD | 백엔드 프록시 연결; 실제 응답 확인에는 키 필요 |
| 한국지역정보개발원 | `https://apis.data.go.kr/B551982/rte` 초정밀버스 위치 | 상세기능/요청변수/응답/좌표계 확인 전 미연동 |
| TAGO 지하철정보 | `https://apis.data.go.kr/1613000/SubwayInfo` | 역 검색·시간표 명세 확인, 애플리케이션 연동 대기 |
| TAGO 버스 도착정보 | `https://apis.data.go.kr/1613000/ArvlInfoInqireService` | 프록시 구현; 키 설정 및 실제 응답 검증 대기 |

TAGO 버스 도착정보 공식 서비스 경로는 `https://apis.data.go.kr/1613000/ArvlInfoInqireService`입니다. 상세 명세의 정류소별 도착정보 오퍼레이션 `getSttnAcctoArvlPrearngeInfoList`는 `serviceKey`, `cityCode`, `nodeId`가 필수이며 `pageNo`, `numOfRows`, `_type=json`을 지원합니다. 도시코드 목록 오퍼레이션 `getCtyCodeList`도 프록시합니다. 응답은 키를 마스킹한 뒤 원본 JSON 그대로 반환합니다. TAGO 정류소 ID와 STCIS 정류장 간 연결 데이터는 확인되지 않아 자동 연결하지 않으며, 실제 성공 응답은 인증키 설정 후 검증해야 합니다. 공식 자료: [국토교통부(TAGO) 버스도착정보](https://www.data.go.kr/data/15098530/openapi.do), [국토교통부(TAGO) 지하철정보](https://www.data.go.kr/data/15098554/openapi.do).

백엔드 내부 API:

- `GET /health` 또는 `GET /api/health`
- `GET /api/regions`, `GET /api/regions/districts`
- `GET /api/bus/stops`, `GET /api/bus/stops/{stop_id}`
- `GET /api/bus/routes?route_nm=...`, `GET /api/bus/routes/{route_id}/stops`
- `GET /api/bus/arrival-cities`, `GET /api/bus/arrivals?city_code=...&node_id=...`
- `GET /api/statistics/quarter-od`
- 버스 위치, 지하철, 출발·도착 경로 검색 API는 미연동 상태

현재 실행 환경에는 `backend/.env`와 `STCIS_API_KEY`, `TAGO_API_KEY`, `KLID_API_KEY`, `TRAFFIC_API_KEY`가 없습니다. 키 없이 실제 STCIS 4개 엔드포인트를 확인했으며 모두 `PARAM_REQUIRED`와 `apikey` 필수 오류를 반환했습니다. TAGO 버스 도착과 ITS 돌발정보는 실제 인증키가 없어 인증 오류 응답만 확인했습니다. 유효한 키를 `backend/.env`에 설정하면 지원되는 백엔드 프록시가 제공기관 응답을 조회합니다.

STCIS 요청변수는 제공된 명세 이름에 맞춰 전달합니다. 인증된 STCIS 응답 필드는 현재 미검증이므로 지역 단계 선택과 정류장 이름/ARS의 구조화 표시는 보류하고 원본 응답 필드를 그대로 보여줍니다. 정류장명 검색은 지역 정류장 응답을 받은 뒤 실제 문자열이 포함된 레코드만 클라이언트에서 필터링하며, STCIS에 확인되지 않은 이름 검색 파라미터를 보내지 않습니다. `opratDate` 형식도 확인되지 않아 변환하지 않습니다.

지도는 [OpenFreeMap Liberty](https://tiles.openfreemap.org/styles/liberty) 벡터 스타일을 MapLibre GL로 표시합니다. 지도 라벨은 `name:ko` 속성을 사용하고, 지도 제공자를 사용할 수 없을 때 다른 언어의 타일로 대체하지 않고 오류를 안내합니다. OpenFreeMap, OpenMapTiles, OpenStreetMap 출처를 지도에 표시합니다. 교통 마커는 위치 데이터 좌표가 검증되기 전까지 표시하지 않습니다.

API 상태와 최근 성공 시각은 API별 백엔드 메모리에 기록됩니다. 백엔드 재시작 시 상태 기록은 초기화되며, 키가 설정되었거나 API URL이 등록되었다는 사실만으로 정상 상태로 표시하지 않습니다. `/api/health`와 `/api/providers`에는 마지막 HTTP 상태, 제공기관 결과 코드, 응답 형식, 확인 가능한 데이터 건수가 포함됩니다. 관리 화면 새로고침은 외부 API를 호출하지 않습니다. 상태에는 인증키 미설정/오류, 승인 대기(공식 오류로 판별 가능할 때만), API 주소 미확인, 응답 형식 오류, 데이터 없음, 지역 제한이 구분됩니다. 상세 호출 주소가 확인되지 않은 API는 호출하지 않습니다.

## 보안 및 데이터 안내

- API 키는 `backend/.env`에서만 읽고 프런트엔드에 노출하지 않습니다.
- 오류 로그에는 요청 URL이나 인증키를 포함하지 않도록 예외 메시지를 기록하지 않습니다.
- HTTP 타임아웃 15초와 API 응답 캐시를 적용합니다.
- Redis를 설정했으나 연결되지 않으면 캐시 장애를 명시적으로 반환합니다.
- 공공데이터 제공 지역·갱신 주기는 서비스별로 다를 수 있습니다.
- PostGIS는 향후 공간 데이터 저장을 위한 개발 인프라로 포함되어 있으며 현재 데이터베이스 연동은 구현되지 않았습니다.

## 현재 진행 상황과 다음 단계

1. 프로젝트 구조, 반응형 화면, FastAPI 서버, Docker 개발 인프라 구성
2. STCIS 지역·정류장·노선 경유지·OD API의 백엔드 프록시 구성
3. 실제 인증키로 응답 필드·제공 지역 및 `opratDate` 형식 확인
4. TAGO 버스 도착 프록시의 인증 응답 검증 및 STCIS↔TAGO 정류장 ID 연결 확인
5. TAGO 지하철 역/시간표 API 연결
6. KLID 위치 API 상세기능·좌표계 확인 후 지도 마커 연결
7. 실시간 지하철 도착 및 대중교통 경로 검색 API 확보 후 연결
8. 통계 응답 구조 검증 후 차트/표 구현, 테스트·배포 준비

## 테스트

```powershell
cd backend
pytest
```

프록시 테스트는 외부 호출을 모의해 요청변수 매핑·키 비노출·오류 응답을 확인합니다. 실제 STCIS, TAGO, ITS 데이터 응답 검증은 각 유효한 API 키가 설정된 환경에서 별도로 수행해야 합니다. API 출처 조사와 미연동 사유는 [`API_RESEARCH.md`](API_RESEARCH.md)를 참고하세요.
