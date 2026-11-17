# K-Transit

대한민국 전국 버스·지하철 정보를 통합하기 위한 React + FastAPI 프로젝트입니다. 실제 API 응답과 명세가 확인된 기능만 연동하며, 아직 연결하지 않은 정보는 화면과 API에서 미연동 상태로 분명히 구분합니다.

## 주요 기능

- STCIS 지역코드 조회, 버스정류장 조회, 노선 경유지 조회, 15분 OD 통계 프록시
- 전국 지도 배경과 반응형 홈/버스/지하철/노선/지도/통계 화면
- API 출처, 캐시 여부, 조회 시각과 오류 표시
- 미연동 API는 `501 Not Implemented`로 반환하며 예시 데이터를 실제 값처럼 보여주지 않음
- API 키는 백엔드 환경변수로 관리하고, 기본 60초 응답 캐시 적용

## 기술 스택

- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, Axios, Recharts, Leaflet
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
REDIS_URL=
CORS_ORIGINS=http://localhost:5173
API_CACHE_TTL_SECONDS=60
```

실제 키는 저장소에 커밋하지 마세요. `.env`와 `.env.*`는 Git에서 제외하며, 브라우저에는 인증키를 전달하지 않습니다.

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

## API 목록과 연동 현황

| 제공기관 | 공식 API / 기능 | 상태 |
| --- | --- | --- |
| STCIS | `/openapi/areacode.json` 지역코드 | 연동 |
| STCIS | `/openapi/bussttn.json` 버스정류장 | 연동 |
| STCIS | `/openapi/rlrdroutesttn.json` 노선 경유지 | 연동 |
| STCIS | `/openapi/quarterod.json` 15분 OD | 연동 |
| 한국지역정보개발원 | `https://apis.data.go.kr/B551982/rte` 초정밀버스 위치 | 상세기능/요청변수/응답/좌표계 확인 전 미연동 |
| TAGO 지하철정보 | `https://apis.data.go.kr/1613000/SubwayInfo` | 역 검색·시간표 명세 확인, 애플리케이션 연동 대기 |
| TAGO 버스 도착정보 | `https://apis.data.go.kr/1613000/ArvlInfoInqireService` | 공식 명세 확인, 애플리케이션 연동 대기 |

TAGO 버스 도착정보의 공식 서비스 경로는 `ArvlInfoInqireService`입니다. 전달받은 `ArvlInfoInqireServiced`의 마지막 `d`는 공식 포털에 게시된 호출 주소와 일치하지 않습니다. 상세 명세에는 정류소별 도착정보 기능, 필수 `serviceKey`, `cityCode`, `nodeId` 등이 기재되어 있습니다. 공식 자료: [국토교통부(TAGO) 버스도착정보](https://www.data.go.kr/data/15098530/openapi.do), [국토교통부(TAGO) 지하철정보](https://www.data.go.kr/data/15098554/openapi.do).

백엔드 내부 API:

- `GET /health` 또는 `GET /api/health`
- `GET /api/regions`, `GET /api/regions/districts`
- `GET /api/bus/stops`, `GET /api/bus/stops/{stop_id}`
- `GET /api/bus/routes?route_nm=...`, `GET /api/bus/routes/{route_id}/stops`
- `GET /api/statistics/quarter-od`
- 버스 위치/도착정보, 지하철, 경로 검색 API 경로는 명세 확인 전 `501` 반환

STCIS의 응답 필드는 실제 키로 응답 샘플을 검증하기 전까지 임의의 내부 스키마로 변환하지 않고 원본 JSON을 전달합니다. 지도에는 OpenStreetMap 배경만 표시하며 교통 데이터 좌표가 확인되지 않아 임의의 마커를 만들지 않습니다.

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
3. 실제 인증키로 응답 필드·제공 지역 확인 및 프런트엔드 결과 구조 정리
4. 공식 TAGO 상세 명세에 따른 버스 도착 및 지하철 역/시간표 API 연결
5. KLID 위치 API 상세기능·좌표계 확인 후 지도 마커 연결
6. 실시간 지하철 도착 및 대중교통 경로 검색 API 확보 후 연결
7. 통계 응답 구조 검증 후 차트/표 구현, 테스트·배포 준비

## 테스트

```powershell
cd backend
pytest
```
