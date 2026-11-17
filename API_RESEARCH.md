# K-Transit 공공데이터 API 조사

조사 기준일: 2026-11-17

이 문서는 제공기관의 공식 페이지에서 확인한 범위, 데이터 성격, 구현 상태를 구분합니다. 서비스 기본 주소만 공개되고 상세 오퍼레이션 경로가 확인되지 않은 API는 호출 코드를 추측해 만들지 않았습니다.

## API 목록

| 기능 | API / 제공기관 | 범위·갱신 | 신청 및 인증 | 현재 상태 |
| --- | --- | --- | --- | --- |
| 지역코드 | STCIS 지역코드 | 실제 응답 지역 확인 필요; 갱신주기 문서 미확인 | `STCIS_API_KEY`; 신청 페이지 미확인 | 실제 엔드포인트 응답에서 `apikey` 필수 확인; 인증키 필요 |
| 정류장·노선·OD | STCIS 버스정류장, 노선경유지, 15분 OD | 실제 응답 범위 및 갱신주기 미확인 | `STCIS_API_KEY`; 신청 페이지 미확인 | 세 엔드포인트 모두 `apikey` 필수 응답 확인; 데이터 성공은 인증키 필요 |
| 버스 도착 | 국토교통부(TAGO) 버스도착정보, ID 15098530 | 실시간; 도시코드 목록의 제공 도시 기준 | [공식 신청 페이지](https://www.data.go.kr/data/15098530/openapi.do), `TAGO_API_KEY` | 실제 오퍼레이션 호출 HTTP 401 `SERVICE_KEY_IS_NULL`; 인증키 필요 |
| 정류장·좌표 | 국토교통부(TAGO) 버스정류소정보, ID 15098534 | 도시코드 목록에 등록된 도시; WGS84 좌표 | [공식 신청 페이지](https://www.data.go.kr/data/15098534/openapi.do), `TAGO_API_KEY` | 상세기능·필드는 확인; URL suffix 미확인으로 호출 대기 |
| 노선·경유정류소 | 국토교통부(TAGO) 버스노선정보, ID 15098529 | 공식 공간 범위 전국; 도시코드 연계 지역 단위 | [공식 신청 페이지](https://www.data.go.kr/data/15098529/openapi.do), `TAGO_API_KEY` | 상세기능·필드는 확인; URL suffix 미확인으로 호출 대기 |
| 버스 위치 | 국토교통부(TAGO) 버스위치정보, ID 15098533 | 실시간; 도시코드 목록의 제공 도시 기준 | [공식 신청 페이지](https://www.data.go.kr/data/15098533/openapi.do), `TAGO_API_KEY` | 기본 경로·입력 필드 확인; 오퍼레이션 호출 URL 확인 대기 |
| 초정밀 버스 위치 | 행정안전부 한국지역정보개발원, ID 15157601 | 전국 지자체; 실시간; 시간범위 2026년 3월부터(포털 명세) | [공식 신청 페이지](https://www.data.go.kr/data/15157601/openapi.do), `KLID_API_KEY` | 상세 페이지가 차량 위치·위도·경도·속도·방향각 등의 의미를 설명하지만 정확한 오퍼레이션 경로와 JSON 필드명은 미확인; 기본 URL 호출 HTTP 400 `NO_OPENAPI_SERVICE_ERROR` |
| 지하철역·시간표 | 국토교통부(TAGO) 지하철정보, ID 15098554 | 역 검색·출구·시간표; 열차 GPS 위치 아님; 포털 갱신주기 실시간 | [공식 신청 페이지](https://www.data.go.kr/data/15098554/openapi.do), `TAGO_API_KEY` | 키워드 역 검색·역별 시간표 변수 확인; 상세 오퍼레이션 경로와 데이터 필드 확인 전 연동 보류; 기본 URL 호출 HTTP 400 `NO_OPENAPI_SERVICE_ERROR` |
| 도로 속도 | 국가교통정보센터 ITS 교통소통정보 | 전국 고속도로·국도, 실시간 | [ITS 공식 안내](https://www.its.go.kr/opendata/opendataList?service=traffic), `TRAFFIC_API_KEY` | `/trafficInfo` 프록시 구현; 키가 없어 실제 성공 미검증 |
| 도로 돌발 | 국가교통정보센터 ITS 돌발상황정보 | 고속도로·국도·지자체 도로, 실시간 | [ITS 공식 안내](https://www.its.go.kr/opendata/opendataList?service=event), `TRAFFIC_API_KEY` | `/eventInfo`와 인증 요구 확인; HTTP 401 `resultCode=4005`, 키 필요 |
| 도로 혼잡 등급 | ITS 교통소통정보 | 전국 고속도로·국도 속도 자료 | 위와 같음 | API가 속도는 제공하지만 공식 혼잡 등급/임계값을 확인하지 못해 미연동(501) |
| 정류장 기준정보 | 국토교통부 전국 버스정류장 위치정보, ID 15067528 | BIS 구축 및 TAGO 연계 지자체; 연간 CSV 스냅샷, WGS84 위경도 | [파일데이터](https://www.data.go.kr/data/15067528/fileData.do) | 메타데이터·컬럼 확인; 데이터 파일 미수집 |
| CCTV 위치 | 국토교통부 교통CCTV, ID 3068943 | 대한민국 전체; 위치·설치 정보만 제공 | [공식 상세 페이지](https://www.data.go.kr/data/3068943/openapi.do); 인증 방식 확인 필요 | 상세 URL·변수 미확인, 미연동(501); 영상과 구분 |
| CCTV 영상 | 국토교통부 CCTV 화상자료, ID 15040466 | 전국 고속도로 및 주요 간선도로로 소개; 실시간 | [공식 상세 페이지](https://www.data.go.kr/data/15040466/openapi.do); 인증·이용 조건 확인 필요 | 영상 URL·응답 스키마 미확인, 미연동(501) |
| 버스 위치 | 서울특별시 버스위치정보, ID 15000332 | 서울 시내, 실시간 | [공식 상세 페이지](https://www.data.go.kr/data/15000332/openapi.do), `SEOUL_API_KEY` | 상세 API 경로·요청변수 확인; 미연동, 서울 지역 전용 |
| 지하철 도착 | 서울특별시 지하철 실시간 도착(일괄), ID 15125683 | 서울시 전체 역, 실시간 XML | [공식 상세 페이지](https://www.data.go.kr/data/15125683/openapi.do) | 상세 호출 정보 확인 필요; 서울 지역 전용 |
| 버스 정보 | 부산광역시 부산버스정보시스템, ID 15092750 | 부산광역시, 실시간 XML | [공식 신청 페이지](https://www.data.go.kr/data/15092750/openapi.do), `BUSAN_API_KEY` | 정류장·노선·위치·도착 변수 확인; 미연동, 부산 전용 |
| 버스 위치 | 인천광역시 버스위치정보, ID 15059206 | 인천광역시, 실시간 XML | [공식 신청 페이지](https://www.data.go.kr/data/15059206/openapi.do), `INCHEON_API_KEY` | 기본 경로·`routeId`·위치 필드 확인; 미연동, 인천 전용 |
| 버스 정보 | 대구광역시 대구버스정보시스템, ID 15139134 | 대구광역시; 위치·도착 실시간, 기초 종합정보 1일 1회 | [공식 신청 페이지](https://www.data.go.kr/data/15139134/openapi.do), `DAEGU_API_KEY` | 오퍼레이션 종류·입력변수 확인; 미연동, 대구 전용 |
| 버스 위치 | 대전광역시 버스 위치정보, ID 15157881 | 대전광역시, 실시간 XML | [공식 신청 페이지](https://www.data.go.kr/data/15157881/openapi.do), `DAEJEON_API_KEY` | 기본 경로·`busRouteId` 확인; 응답 구조 검증 대기, 대전 전용 |
| 충전소 | 한국환경공단 공공급속 충전기 충전정보, ID 15156662 | 전국, 위치·운영정보; 포털 갱신주기는 실시간 | [공식 신청 페이지](https://www.data.go.kr/data/15156662/openapi.do), `KECO_API_KEY` | 기본 경로와 변수 확인; 출력 스키마가 header/body 수준이라 파싱 검토 대기 |
| 주차 | 부산시설공단 공영주차장 현황, ID 15157490 | 부산 공영주차장; 실시간 현황 | [공식 신청 페이지](https://www.data.go.kr/data/15157490/openapi.do), `BUSAN_API_KEY` | 기본 경로와 두 기능·변수 확인; URL suffix 및 출력 필드 확인 대기 |
| 버스 통계 | 경기도 시군별 버스 이용객수, ID 15121882 | 경기도 시군·시간·평일/주말 구분; 월간 통계 | [공식 상세 페이지](https://www.data.go.kr/data/15121882/openapi.do) | 제공형태가 LINK이고 세부 호출 명세가 없어 직접 API 프록시 불가 |
| 도시철도 통계 | 대전교통공사 역별 승하차 인원, ID 15158792 | 대전 1호선; 조회 대상일 익일 갱신 | [공식 신청 페이지](https://www.data.go.kr/data/15158792/openapi.do), `DAEJEON_METRO_API_KEY` | 기본 경로·날짜 변수를 확인; 출력 스키마와 URL suffix 확인 대기 |
| 주차 기준정보 | 대전광역시 주차장 조회, ID 15110659 | 대전광역시; 기준일이 있는 시설정보 | [공식 상세 페이지](https://www.data.go.kr/data/15110659/openapi.do), `DAEJEON_API_KEY` | 위치·시설 필드 확인; 실시간 잔여면 정보로 간주하지 않고 호출 대기 |

## 확인된 요청 및 응답 명세

### ITS 교통소통정보

공식 ITS 페이지에서 요청변수 `apiKey`, `type`(`all`, `ex`, `its`), `routeNo`, `drcType`(`all`, `up`, `down`, `start`, `end`), 선택 범위 `minX`, `maxX`, `minY`, `maxY`, `getType`을 확인했습니다. `type`이 `all`이 아니면 `routeNo`가 필요하며, 위치 범위는 전체 도로 또는 전체 방향 조회에만 허용됩니다. 문서 출력 필드는 `resultCode`, `resultMsg`, `totalCount`, `roadName`, `roadDrcType`, `linkNo`, `linkId`, `startNodeId`, `endNodeId`, `speed`, `travelTime`, `createdDate`입니다. 문서상 결과 코드 `4001`은 사용량 제한이며, 수치 한도는 공개 페이지에 기재되지 않았습니다.

공식 공개 페이지의 상세 URL 표가 비어 있어 문서에 표시된 요청변수를 보존하면서 `https://openapi.its.go.kr:9443/trafficInfo`를 시험 호출했습니다. 인증키 없이 HTTP 401이 반환되어 인증이 필요한 점은 확인했지만, 실제 정상 응답 필드와 키 발급 절차는 검증하지 못했습니다. 프록시는 JSON `resultCode=0` 응답만 성공으로 기록합니다. 문서 출력 필드에는 도로 링크 ID와 속도는 있지만 선형 좌표가 없어 현재 지도에 속도선을 그리지 않습니다.

### TAGO 버스 도착정보

정확한 서비스 경로는 `https://apis.data.go.kr/1613000/ArvlInfoInqireService`이며, 정류소별 도착 오퍼레이션은 `getSttnAcctoArvlPrearngeInfoList`입니다. 필수 입력은 `cityCode`, `nodeId`; 선택 입력은 `pageNo`, `numOfRows`, `_type`입니다. 제공 도시 목록은 `getCtyCodeList`로 조회하도록 문서화되어 있습니다. 출력 필드에는 `nodeid`, `nodenm`, `routeid`, `routeno`, `routetp`, `arrprevstationcnt`, `vehicletp`, `arrtime`(초)가 있습니다. 이 데이터는 도착예정 정보이며 차량 GPS 위치가 아닙니다.

### 추가로 확인한 TAGO 버스 기준정보

- **버스정류소정보(ID 15098534):** 공식 기능은 좌표 기반 반경 500m 정류소 조회, 정류소명·번호 조회, 정류소별 경유노선 조회, 도시코드 목록 조회입니다. `gpsLati`/`gpsLong`은 WGS84이며, 이름·번호 검색의 `cityCode` 필수, `nodeNm`/`nodeNo` 선택입니다. 응답 필드는 `nodeid`, `nodenm`, `nodeno`, `gpslati`, `gpslong`, `citycode` 등이 확인됩니다.
- **버스노선정보(ID 15098529):** 공식 기능은 노선 기본정보, 노선번호 검색, 노선별 경유정류소, 도시코드 목록입니다. 입력에 `cityCode`, `routeId` 또는 `routeNo`가 있으며, 경유지 응답에는 `nodeid`, `nodenm`, `nodeno`, `nodeord`, `gpslati`, `gpslong`, `updowncd`가 문서화되어 있습니다. 좌표는 WGS84입니다.
- 두 서비스의 상세 페이지는 기본 서비스 주소와 기능별 요청변수 표를 제공하지만, 현재 확인된 문서 출력에는 실제 오퍼레이션 URL suffix가 노출되지 않았습니다. 익숙한 TAGO 오퍼레이션 이름을 추측하여 호출하지 않았습니다. `TAGO_API_KEY` 발급과 공식 상세 오퍼레이션 경로 확인 후 연결할 수 있습니다. 정류장·노선 기준정보는 차량 위치나 도착예정 정보와 별도입니다.

### ITS 돌발상황정보

공식 [ITS 돌발상황 페이지](https://www.its.go.kr/opendata/opendataList?service=event)의 예제 소스 `https://www.its.go.kr/js/opendata/eventService.js`에서 호출 URL `https://openapi.its.go.kr:9443/eventInfo`를 확인했습니다. 요청변수는 `apiKey`, `type`(`all`, `ex`, `its`, `loc`, `sgg`, `etc`), `eventType`(`all`, `cor`, `acc`, `wea`, `ete`, `dis`, `etc`), 선택 `minX`, `maxX`, `minY`, `maxY`, `getType`입니다. 공식 예제는 XML 응답의 `response/header/resultCode` 구조를 보여 줍니다. 출력 필드에는 `coordX`(경도), `coordY`(위도), `eventType`, `eventDetailType`, `startDate`, `endDate`, `linkId`, `roadName`, `lanesBlocked`, `message`가 있습니다. `4001`은 사용량 제한이며 공개 페이지에 수치 한도는 없습니다.

`GET /api/traffic/incidents`는 공식 URL 및 요청변수로 XML을 조회하고 문서화된 이벤트 필드만 반환합니다. 좌표가 정상 숫자 범위인 항목만 지도 마커로 표현합니다. 이는 도로 돌발정보이지 대중교통 차량 위치 또는 공식 혼잡 등급이 아닙니다. 실제 호출 성공은 `TRAFFIC_API_KEY`가 없어 검증하지 못했습니다.

### 추가 교통 데이터 후보

- **한국환경공단 공공급속 충전기(ID 15156662):** 전국 충전소 위치·운영정보 API입니다. 기본 주소 `https://apis.data.go.kr/B552584/pbnstFstChrgrChgcpcyInfo`, 필수 변수 `serviceKey`, `pageNo`, `numOfRows`(최대 100), `returnType`; 지역·충전소명 필터가 문서화되어 있습니다. 문서의 상세기능은 있으나 구체 오퍼레이션 suffix와 실제 item 스키마가 확인되지 않아 호출은 보류했습니다. 충전기 정보는 대중교통 범위의 보완 정보로 별도 취급합니다.
- **부산 공영주차장(ID 15157490):** 시설 목록과 실시간 주차현황 두 기능이 있고 `serviceKey`, `pageNo`, `numOfRows`, 선택 `pParkGCd`, `resultType`이 확인됩니다. 기본 주소는 `https://apis.data.go.kr/B552587/ParkingInfoService_v2`입니다. 부산 한정이며 오퍼레이션 경로 suffix와 응답 item 필드가 공개 페이지에 충분히 드러나지 않아 아직 호출하지 않습니다.
- **대전 주차장(ID 15110659):** 기본 주소와 좌표·시설 필드를 확인했습니다. 페이지에서 참고용 자료임을 안내하며 실시간 잔여 주차면 API로 표시하지 않습니다. 대전 지역 한정입니다.
- **경기도 버스 이용객수(ID 15121882):** 시군·시간·평일/주말 및 승하차·환승 통계를 설명하지만, 공공데이터포털 제공형태가 `LINK`이고 직접 호출 명세가 없어 프록시 API로 연결할 수 없습니다. 설명상 월간 통계이며 실시간 승하차 데이터가 아닙니다.
- **대전교통공사 역별 승하차(ID 15158792):** 대전 1호선 전 역, `startDate`, `endDate`를 받으며 조회 대상일 데이터는 익일 갱신됩니다. 기본 주소는 `https://apis.data.go.kr/B554695/StationPassengerSVC`입니다. XML 응답의 실제 항목 구조와 오퍼레이션 suffix가 확인되지 않아 호출을 보류했습니다. 실시간 열차 위치·도착정보와는 다른 통계입니다.

### 전국 버스 정류장 위치 CSV

CSV 컬럼은 정류장 번호·명, 위도·경도(WGS84), 수집일, 모바일 단축번호, 도시코드·도시명, 관리도시명입니다. 연 1회 수집한 기준정보이며, 이후 변동은 반영되지 않을 수 있고 TAGO 연계가 없는 지자체는 포함된다고 보장되지 않습니다. 실시간 위치 데이터와 병합하거나 정류장 ID를 자동 연결하지 않습니다.

### 지역별 보완 API

- 서울 버스 위치: `getBusPosByRtid`는 `busRouteId`, `serviceKey`를 사용하고, 경로는 `http://ws.bus.go.kr/api/rest/buspos/getBusPosByRtid`입니다. 문서에는 GPS 좌표, 차량번호, 제공시간, 혼잡도 등이 기재되어 있습니다. 이 API는 서울에 한정됩니다.
- 부산 버스: `BusanBIMS`는 정류장 검색에 `bstopnm`/`arsno`, 정류장 위치에 `gpsx`/`gpsy`, 노선 위치 및 도착정보에 별도 ID를 사용합니다. 정류장 위치/차량 위치 좌표는 서로 다른 기준정보로 다룹니다.
- 인천 버스 위치: `busLocationService`는 `routeId`로 조회하며, 문서의 좌표 필드 방향 및 좌표계는 연동 전에 검증해야 합니다.
- 대구 버스: `dbmsapi02`의 위치·도착 오퍼레이션은 운행시간 외 결과가 없을 수 있습니다. 기초 종합정보는 1일 1회 갱신을 전제로 소극적 이용을 권고합니다.
- 대전 버스 위치: `busposinfo`는 `busRouteId`를 요구합니다. 상세 응답 구조가 공개 페이지에서 확인되지 않아 파서를 만들지 않았습니다.
- 서울 지하철 실시간 도착정보는 발견했지만 서울시 범위입니다. TAGO 지하철 정보의 역·출구·시간표는 열차 GPS나 실시간 도착 API로 간주하지 않습니다.
- 대전 주차장, 부산 공영주차장, 환경부 충전소, 경기도 버스통계, 대전도시철도 승하차 통계는 별도 지역 또는 기능 보완 후보입니다. 전국 공통 대중교통 API의 대체재로 합산하지 않습니다.

## 중복 및 범위 판단

전국 통합 버스 위치 후보는 KLID(전국 지자체 통합으로 소개)와 TAGO(도시코드 목록에서 제공 지역 조회)입니다. 서울·부산·인천·대구·대전 API는 지역 보완 후보입니다. 제공자 간 차량 ID 체계와 동일 차량 여부가 확인되지 않아 중복 제거를 임의 적용하지 않았습니다.

STCIS 정류장 검색과 TAGO의 연간 정류장 CSV는 정적·검색 데이터이고, TAGO 도착정보 및 버스 위치는 별도 실시간 데이터입니다. ID 매핑이 확인되기 전까지 상호 자동 연결하지 않습니다. ITS 도로 속도는 도로 링크 값이지 버스 GPS가 아닙니다. 국가 CCTV 위치 API는 영상 API가 아니며, CCTV 영상 URL이 실제로 제공되는지는 별도 응답과 이용조건 확인 전까지 보장하지 않습니다.

공공데이터포털 검색에서 신청 불가·서비스 종료 예정으로 표시되는 일부 창원시 개별 API는 통합 후보에서 제외하고 TAGO 대체 안내만 기록했습니다. 사용자가 제공한 `15106249` URL은 조사 시 404였으므로 연동하지 않았습니다. `tago.go.kr/v5/use/openapi.jsp`도 이 조사 시 404여서 공공데이터포털의 개별 상세 페이지를 명세 근거로 사용했습니다.

## 신청 지원

공공데이터포털의 각 API 상세 페이지에서 활용신청 후 승인·인증키를 발급받아야 합니다. 이 저장소에는 실제 키가 없으며 키를 추측하거나 승인 절차를 우회하지 않습니다. 필요한 환경변수는 `backend/.env.example`에 등록되어 있습니다. 키 값은 백엔드에만 입력하고 GitHub에 커밋하지 마세요.

**활용 목적 작성 예시**

> K-Transit은 대한민국 대중교통 이용자를 위한 통합정보 서비스 개발을 목적으로 합니다. 귀 기관의 버스·지하철·도로 교통 공공데이터를 백엔드에서 조회하여 제공 지역과 데이터 종류를 명확히 표시하고, 정류장·노선·교통정보 검색과 지도 기반 안내에 활용합니다. 인증정보는 서버 환경변수로 관리하며 브라우저에 노출하지 않습니다. 제공기관의 호출 제한, 출처표시, 이용허락 조건 및 재배포 제한을 준수합니다.

무료 제공 또는 이용허락범위는 각 상세 페이지 기준입니다. 특히 서울 버스 API는 제3자 권리 포함·출처표시 조건이 있고, 국토교통부 교통CCTV 및 CCTV 화상자료 페이지에는 공공저작물 제1유형 출처표시 조건이 있습니다. 배포 전에 원문 이용조건을 다시 확인해야 합니다.

## 실제 연결 및 검증 결과

### 3단계 실행환경 및 통합 테스트 (2026-11-17)

- Python 3.12.10, Node.js 26.13.1, npm 11.20.0을 설치했고 백엔드 의존성은 `backend/.venv`, 프런트엔드 의존성은 `frontend/node_modules`에 설치했습니다. 의존성 변경이나 lockfile 생성은 없었습니다.
- 백엔드 테스트: `backend` 디렉터리에서 `python -m pytest tests -q` 결과 **24 passed**, deprecation 경고 1건. 저장소 루트에서 처음 실행했을 때는 `app` import 경로가 맞지 않아 수집에 실패했고, 백엔드 디렉터리에서 재실행해 통과했습니다.
- 프런트엔드: `npm run build` 성공. Vite는 500 kB를 넘는 번들 경고를 출력했고, npm 설치 시 취약점 5건(중간 3, 높음 1, 치명적 1)이 보고됐습니다. 자동 수정은 실행하지 않았습니다.
- 로컬 스모크 테스트: FastAPI `/api/health` 정상, `/api/providers` 응답, Vite 페이지 HTTP 200. 지도 화면이 렌더링되고 브라우저에서 ITS 돌발정보 조회 시 API 키 미설정 안내가 표시됐습니다. 이는 프런트엔드-백엔드 연결 확인이며 외부 데이터 성공은 아닙니다.
- `backend/.env`와 `STCIS_API_KEY`, `TAGO_API_KEY`, `KLID_API_KEY`, `TRAFFIC_API_KEY` 환경변수가 없어 인증된 외부 호출은 수행하지 않았습니다. 키 값 자체는 읽거나 로그에 출력하지 않았습니다.

| API | 실제 무인증 호출 결과 | 판정 |
| --- | --- | --- |
| STCIS 지역코드 `areacode.json` | 공식 JSON 오류 `PARAM_REQUIRED`: 필수 `apikey` 누락 | 인증키 필요 |
| STCIS 정류장 `bussttn.json` | 공식 JSON 오류 `PARAM_REQUIRED`: 필수 `apikey` 누락 | 인증키 필요 |
| STCIS 노선 경유지 `rlrdroutesttn.json` | 공식 JSON 오류 `PARAM_REQUIRED`: 필수 `apikey` 누락 | 인증키 필요 |
| STCIS 15분 OD `quarterod.json` | 공식 JSON 오류 `PARAM_REQUIRED`: 필수 `apikey` 누락 | 인증키 필요 |
| TAGO 버스 도착 `getSttnAcctoArvlPrearngeInfoList` | 문서화된 오퍼레이션과 샘플 `cityCode`, `nodeId`로 호출; HTTP 401 `SERVICE_KEY_IS_NULL` (reason code 20) | 인증키 필요 |
| ITS 돌발상황 `/eventInfo` | 문서화된 `type`, `eventType`, `getType=xml`로 호출; HTTP 401, XML `resultCode=4005` (apiKey 누락) | 인증키 필요; 엔드포인트·인증 방식 확인 |
| TAGO 지하철정보 | 서비스 기본 주소만 호출; HTTP 400 XML `NO_OPENAPI_SERVICE_ERROR` (reason code 12) | 상세 오퍼레이션 URL 확인 필요; 서비스 종료로 판정할 근거는 아님 |
| KLID 초정밀버스 | 기본 `/B551982/rte`만 호출; HTTP 400 JSON `NO_OPENAPI_SERVICE_ERROR` (reason code 12) | 상세 오퍼레이션 URL 확인 필요 |

STCIS에 대한 PowerShell 직접 요청은 실행 호스트 경로에서 HTTP 400 `Request Blocked` HTML을 반환했습니다. 별도 공식 문서 조회 경로로 각 STCIS 엔드포인트에 접근했을 때는 위의 제공기관 JSON `apikey` 오류를 확인했습니다. 따라서 해당 HTML 응답은 STCIS의 API 오류로 단정하지 않았습니다.

실제 데이터를 반환한 인증 호출은 없습니다. 따라서 실제 API 좌표로 지도 마커가 표시되는지, 응답 데이터의 지역 범위·갱신주기·필드를 검증하는 테스트는 미완료입니다. 브라우저에서 확인한 것은 지도 타일과 빈 상태/오류 안내뿐이며, 모의 테스트는 요청·파싱·오류 처리를 검증할 뿐 실호출 성공 증거가 아닙니다. 서비스 상태 `연결 정상`은 백엔드가 유효한 성공 응답을 받은 뒤에만 기록됩니다.

추가 구현 경로:

- `GET /api/providers`: 제공기관별 범위, 명세 URL, 인증키 환경변수 설정 여부, 상태, 마지막 성공/오류 확인
- `GET /api/traffic/speed`: ITS 도로 속도 응답 조회
- `GET /api/traffic/incidents`: ITS 사고·공사 등 돌발정보 조회 및 좌표 마커
- `GET /api/traffic/congestion`: 혼잡 기준 미확인으로 501
- `GET /api/cctv`, `GET /api/cctv/video`: 상세 호출 URL·응답 구조 미확인으로 501
- 프런트엔드 `/#/providers`: 읽기 전용 API 현황 화면

### 4단계 인증 및 공식 명세 재확인 (2026-11-17)

- `backend/.env.example` 및 설정 코드는 `STCIS_API_KEY`, `TAGO_API_KEY`, `KLID_API_KEY`, `TRAFFIC_API_KEY`를 지원합니다. `.gitignore`에서 `.env`와 `.env.*`를 제외하고 `.env.example`만 예외로 두는 것을 확인했습니다. 현재 `backend/.env`는 없고 네 환경변수도 설정되지 않아 키를 사용하는 호출은 수행하지 않았습니다.
- 키가 없으므로 이 단계에서 실제 인증 호출 성공, 응답 데이터 및 좌표 추출을 검증할 수 없습니다. API별 상태는 연결 성공이 아니며, 지도에는 실제 API 좌표 마커가 확인되지 않았습니다.
- 공공데이터포털의 [KLID 초정밀버스 상세 페이지](https://www.data.go.kr/data/15157601/openapi.do)에서 전국 범위, 실시간 갱신, 2026년 3월 이후 데이터 제공, `serviceKey`, `pageNo`, `numOfRows`, `type`, 선택 `stdgCd` 및 실시간 차량 위도·경도·방향각·속도 등의 의미를 재확인했습니다. 그러나 상세기능별 호출 경로와 실제 JSON 항목 필드명은 페이지에 공개되지 않고 출력 스키마도 `header`/`body`로만 나와 기본 주소만으로는 구현·좌표 파싱을 확정할 수 없습니다. 기본 주소 무인증 응답 HTTP 400 `NO_OPENAPI_SERVICE_ERROR`는 상세 경로 누락과 일치하며 인증 실패나 서비스 중단으로 단정하지 않습니다.
- [TAGO 지하철 공식 상세 페이지](https://www.data.go.kr/data/15098554/openapi.do)에서 역 키워드 검색(`subwayStationName`)과 시간표 필수 변수(`subwayStationId`, `dailyTypeCode`, `upDownTypeCode`) 및 실시간 갱신 표기를 확인했습니다. 상세 오퍼레이션 suffix와 실제 역 좌표 응답 필드는 확인되지 않았습니다. 기본 서비스 주소 무인증 호출 HTTP 400 `NO_OPENAPI_SERVICE_ERROR`; 임의 suffix로 호출하지 않았습니다.
- [TAGO 버스 도착 공식 명세](https://www.data.go.kr/data/15098530/openapi.do)는 실시간이며 정류소별 도착 오퍼레이션의 서비스 경로·필수 `cityCode`, `nodeId`와 응답 필드(`nodeid`, `nodenm`, `routeid`, `routeno`, `arrtime` 등)를 명시합니다. 실제 오퍼레이션 호출은 HTTP 401 `SERVICE_KEY_IS_NULL`로 인증키가 필요함을 확인했습니다. `arrtime`은 초 단위 도착 예상이며 차량 좌표가 아닙니다.
- [ITS 돌발상황 공식 명세](https://www.its.go.kr/opendata/opendataList?service=event)의 `/eventInfo`는 필수 인증키와 XML 출력 구조를 명시합니다. 무인증 호출은 HTTP 401 및 XML `resultCode=4005`로 인증키 오류를 반환했습니다. 기존 XML 파서와 좌표 유효성 검사 구현은 유지하며 실제 사고·공사·기상 데이터와 지도 좌표는 아직 검증하지 않았습니다.
- STCIS의 네 엔드포인트는 공식 JSON `PARAM_REQUIRED` / `apikey` 누락 응답을 반환했습니다. 실제 성공 데이터와 파싱 필드는 인증키 설정 뒤 확인해야 합니다.
- 키 발급은 각 API의 공공데이터포털 신청 링크에서 활용신청 후 승인 절차를 따릅니다. ITS는 위 공식 ITS 서비스 안내에서 인증키를 신청합니다. STCIS의 공식 신청 URL은 현재 확인되지 않았습니다. 키를 발급받은 뒤 `backend/.env.example`을 `backend/.env`로 복사해 백엔드에만 입력하고 서버를 재시작하세요. 실제 키를 저장소, 프런트엔드 설정, 로그 또는 채팅에 넣지 마세요.
- 현재 코드 검증: 백엔드 `python -m pytest tests -q` **24 passed**, deprecation 경고 1건; 프런트엔드 `vite build` 성공, 500 kB 초과 번들 경고. 이는 코드·UI 검증이며 외부 API 연결 성공을 의미하지 않습니다.

### 5단계 진단·응답 검증 보강 (2026-11-17)

- API 상태에 `auth_error`, `approval_pending`, `endpoint_unknown`, `invalid_response`, `no_data`, `region_limited` 분류를 추가했습니다. HTTP 401/403은 인증 오류, ITS 공식 코드 `4005`는 인증 오류, ITS/TAGO의 문서화된 JSON/XML 구조 불일치는 응답 오류, 성공한 TAGO/ITS 조회의 0건 응답은 데이터 없음으로 표시합니다. 승인 대기와 지역 제한은 제공자가 구별 가능한 근거를 반환하거나 카탈로그에 공식 범위가 있을 때만 표시합니다. 키/승인 관련 오류 코드를 추측해 분류하지 않습니다.
- `/api/health`와 `/api/providers`가 마지막 조회의 HTTP 상태, 제공기관 결과 코드, 응답 형식, 확인 가능한 데이터 건수를 제공하도록 보강했습니다. STCIS의 실제 응답 항목 구조가 확인되지 않았으므로 해당 건수는 추정하지 않습니다. API 관리 화면은 키 값이 아닌 설정 여부만 표시합니다.
- API 관리 화면 새로고침은 카탈로그/상태만 조회하며 외부 제공기관을 호출하지 않습니다. 실제 기능 API 요청은 서버 설정에 유효한 키가 있을 때만 전달되며, 키가 없으면 사전 검사에서 중단됩니다. 상세 오퍼레이션 URL이 미확인인 TAGO 지하철·버스 위치와 KLID 위치는 호출하지 않고 `API 주소 미확인`으로 표시합니다.
- 현재 `.env`와 네 개 인증키 환경변수는 설정되지 않았습니다. 이번에는 실 API를 호출하지 않았으며, 실제 성공 응답·좌표·제공 지역·갱신 시각을 새로 검증하지 않았습니다. 테스트의 mock 응답은 오직 코드 검증이며 실제 호출 성공으로 간주하지 않습니다.
- 테스트: 백엔드 **29 passed**, deprecation 경고 1건; 프런트엔드 빌드 성공, 번들 크기 경고 지속. 테스트에는 키 미설정 시 STCIS/TAGO/ITS 외부 요청이 실행되지 않는지, 상태 메타데이터와 데이터 없음·응답 오류 분류가 유지되는지 확인하는 사례를 추가했습니다.

## 신청 지원 및 다음 연결 조건

백엔드에서 사용하는 환경변수는 `backend/.env.example`에 선언되어 있습니다. 이번 조사로 추가한 `KECO_API_KEY`, `DAEJEON_METRO_API_KEY`는 문서·신청 확인용이며 현재 서비스 호출 코드가 연결된 것은 아닙니다. 신청 URL이 있는 데이터는 각 표의 원문 상세 페이지에서 활용신청과 인증키 발급을 진행하세요. ITS 키는 ITS 돌발/교통소통 서비스용이며, 공공데이터포털 키와 혼동하지 않습니다.

API 신청 목적 예시는 위 대중교통 통합서비스 설명을 사용하되, 충전소·주차·통계는 각각의 목적과 범위에 맞게 신청하고 제공기관의 이용 조건을 확인하세요. 아직 상세 호출 경로나 응답 item 스키마가 공개 자료에서 확인되지 않은 TAGO 정류장·노선, TAGO/KLID 실시간 위치, CCTV, 지하철 기준정보는 명세가 확인된 뒤에만 구현합니다.
