# Mocking Tool Guide Tabs Design

> **Date**: 2026-05-14
> **Status**: Approved
> **Approach**: 3 language-specific tabs (08, 09, 10) with cross-references

---

## 1. Context

### 1.1 Problem

The Strategy tab (00) Section 2 "도구 스택 매트릭스" lists 14 mocking tools with one-line descriptions only. New team members have no guidance on installation, configuration, or usage patterns. The tech stack definition (wiki/18_기술_스택_정의서) defines versions but not how to use the tools for testing.

### 1.2 Goal

Create 3 new tabs (08, 09, 10) providing comprehensive tool guides — installation, explanation, Synapse-specific configuration, and usage patterns — organized by language. Core tools get deep coverage (B-level), supporting tools get Quick Start (A-level).

### 1.3 Constraints

- Tech stack: Keep current (React 18 CDN + Babel standalone)
- No new markdown documents (these are site-native content, not mocking spec docs)
- Strategy tab §2 gets links to new tabs as cross-references
- "원본 문서 보기" CTA links to tech stack wiki instead of local HTML doc

---

## 2. Tab Structure

### 2.1 New DOCS entries

```js
{ idx: "08", id: "tools-java", title: "Java 목킹 도구", en: "Java Mocking Tools",
  summary: "WireMock, Testcontainers, EmbeddedKafka, Spring Cloud Contract, Mockito — 설치부터 Synapse 맞춤 구성까지.",
  tags: ["WireMock 3.5", "Testcontainers 2.x", "EmbeddedKafka", "Mockito"] },
{ idx: "09", id: "tools-python", title: "Python 목킹 도구", en: "Python Mocking Tools",
  summary: "pytest+httpx, respx, fakeredis, testcontainers-python — AI 서비스 테스트 환경 구축.",
  tags: ["pytest 9.x", "respx", "fakeredis", "httpx"] },
{ idx: "10", id: "tools-flutter", title: "Flutter 목킹 도구", en: "Flutter Mocking Tools",
  summary: "dio mock adapter, Mockito, flutter_test, mocktail — 프론트엔드 목 테스트 가이드.",
  tags: ["dio mock", "Mockito 5.4", "flutter_test", "mocktail"] }
```

### 2.2 New Files

| File | Purpose |
|------|---------|
| `js/tools-java.jsx` | Tab 08 page component + WireMock Stub Builder simulator |
| `js/tools-python.jsx` | Tab 09 page component |
| `js/tools-flutter.jsx` | Tab 10 page component |

### 2.3 Modified Files

| File | Change |
|------|--------|
| `js/data.jsx` | Add 3 DOCS entries |
| `js/app.jsx` | Add 3 Page components to tab router, add tool guide CTA variant |
| `index.html` | Add 3 `<script>` tags |

---

## 3. Tab 08 — Java Mocking Tools

### 3.1 Section Layout

**§1 개요 — Java 테스트 의존성 한눈에 보기**
- `build.gradle` (testImplementation 전체) as Code block with CopyBtn
- Version matrix table: tool name, version, purpose

**§2 WireMock (B-level: 실무 레퍼런스)**
- 설명: 외부 HTTP API를 로컬에서 스텁하는 도구
- 설치: `build.gradle` 의존성 (`wiremock-standalone:3.5.4`)
- Synapse 구성: `AbstractExternalApiTest` 베이스 클래스 + `@DynamicPropertySource` 9개 URL 오버라이드
- 사용 패턴 3가지:
  1. 기본 stub 등록 (`stubFor(get(...).willReturn(...))`)
  2. JSON 파일 기반 매핑 (`__files/`, `mappings/`)
  3. 에러 시나리오 (시나리오 스테이트 `inScenario`)
- 트러블슈팅: 포트 충돌 (port=0), 매핑 미스매치 디버깅 (`--verbose`)
- 크로스 레퍼런스 Pill: `→ Python: respx (09탭)` `→ Flutter: dio mock adapter (10탭)`
- **SIM: WireMock Stub 빌더** — method/URL/status/body 입력 → JSON mapping + Java code 생성, 3 presets (Stripe, FCM, OAuth)

**§3 Testcontainers (B-level)**
- 설명: Docker 컨테이너를 테스트 라이프사이클에 맞춰 자동 관리
- 설치: `build.gradle` + Docker Desktop 필수
- Synapse 구성: `AbstractIntegrationTest` (PostgreSQL+pgvector, Redis 7, Elasticsearch 8.x)
- 사용 패턴 3가지:
  1. 기본 컨테이너 (`@Container` + `@DynamicPropertySource`)
  2. pgvector init script (`CREATE EXTENSION vector`)
  3. `reuse` 모드 (`withReuse(true)` + `~/.testcontainers.properties`)
- 트러블슈팅: Docker 미설치, CI DinD 설정, 컨테이너 reuse 충돌
- 크로스 레퍼런스: `→ Python: testcontainers-python (09탭)`

**§4 EmbeddedKafka (B-level)**
- 설명: 테스트용 인메모리 Kafka 브로커
- 설치: `spring-kafka-test` 의존성
- Synapse 구성: `@EmbeddedKafka(topics={...})` 18개 토픽, `KafkaTestHelper` 유틸
- 사용 패턴 3가지:
  1. Producer 검증 (`publishAndWait` + `consumeMessages`)
  2. Consumer 검증 (publish fixture → assert side effect)
  3. Avro 직렬화 검증 (Schema Registry 연동)
- 트러블슈팅: 토픽 미등록, 타임아웃, Avro 스키마 불일치
- 크로스 레퍼런스: `→ Python: unittest.mock.patch (09탭)`

**§5 Spring Cloud Contract (A-level: Quick Start)**
- 설명 + 설치 (`spring-cloud-contract-verifier`, `spring-cloud-contract-stub-runner`)
- 기본 사용법: Provider 계약 정의 (Groovy DSL), Consumer stub runner
- 코드 스니펫: `copyDeck.groovy` 예시
- CopyBtn on all code blocks

**§6 Mockito (A-level: Quick Start)**
- 설명 + 설치 (`mockito-core:5.12.0`)
- 기본 사용법: `@Mock`, `@InjectMocks`, `when().thenReturn()`, `verify()`
- 코드 스니펫: Service 단위 테스트 예시
- 크로스 레퍼런스: `→ Flutter: mockito 5.4 (10탭)` `→ Python: unittest.mock (09탭)`

---

## 4. Tab 09 — Python Mocking Tools

### 4.1 Section Layout

**§1 개요 — Python 테스트 의존성**
- `requirements-test.txt` as Code block with CopyBtn
- Version matrix table

**§2 pytest + httpx (B-level)**
- 설명: FastAPI 비동기 테스트 조합
- 설치: `pip install pytest pytest-asyncio httpx`
- Synapse 구성: `conftest.py` 공통 fixture (`redis_client`, `kafka_producer_mock`), `pytest.ini`
- 사용 패턴 3가지:
  1. `AsyncClient` 기본 테스트 (`async with AsyncClient(app=app)`)
  2. fixture scope 관리 (function vs session)
  3. `@pytest.mark.parametrize` 활용
- 트러블슈팅: async event loop 충돌, fixture scope 불일치
- 크로스 레퍼런스: `→ Java: MockMvc + @SpringBootTest (08탭)`

**§3 respx (B-level)**
- 설명: httpx 기반 외부 HTTP mock
- 설치: `pip install respx`
- Synapse 구성: OpenAI Embeddings mock, Anthropic Claude mock
- 사용 패턴 3가지:
  1. 기본 mock (`@respx.mock` + `respx.post().mock()`)
  2. 조건부 매칭 (URL + body `contains`)
  3. 순차 응답 (429 rate_limit → 200 success 재시도 테스트)
- 트러블슈팅: mock 누수, 비동기 컨텍스트
- 크로스 레퍼런스: `→ Java: WireMock (08탭)` `→ Flutter: dio mock adapter (10탭)`

**§4 fakeredis (A-level)**
- 설명 + 설치 + 시맨틱 캐시 테스트 예시 (cache hit/miss)
- 크로스 레퍼런스: `→ Java: Testcontainers Redis (08탭)`

**§5 testcontainers-python (A-level)**
- 설명 + 설치 + PostgreSQL+pgvector 컨테이너 예시
- 크로스 레퍼런스: `→ Java: Testcontainers (08탭)`

**§6 unittest.mock (A-level)**
- 설명 + `patch`, `MagicMock` 기본 사용법
- Kafka consumer mock 예시
- 크로스 레퍼런스: `→ Java: Mockito (08탭)` `→ Flutter: mockito (10탭)`

---

## 5. Tab 10 — Flutter Mocking Tools

### 5.1 Section Layout

**§1 개요 — Flutter 테스트 의존성**
- `pubspec.yaml` dev_dependencies as Code block with CopyBtn
- Version matrix table

**§2 dio mock adapter (B-level)**
- 설명: dio HTTP 클라이언트 어댑터 교체 방식
- 설치: `pubspec.yaml` + `build_runner`
- Synapse 구성: `MockDioAdapter` 클래스, `createDioClient(useMock: bool)` 토글
- 사용 패턴 3가지:
  1. 기본 GET/POST mock (`onGet`, `onPost`)
  2. regex 패턴 매칭 (`_findPatternMatch`)
  3. 네트워크 지연 시뮬레이션 (`delay`)
- 트러블슈팅: unmapped route 에러, method 와일드카드(`*`) 처리
- 크로스 레퍼런스: `→ Java: WireMock (08탭)` `→ Python: respx (09탭)`

**§3 Mockito — Dart (A-level)**
- 설명 + 설치 + `@GenerateMocks` + `build_runner` 코드 생성
- Repository mock + when/thenReturn 예시
- 크로스 레퍼런스: `→ Java: Mockito (08탭)` `→ Python: unittest.mock (09탭)`

**§4 flutter_test (A-level)**
- 설명 + Widget 테스트 기본 (`testWidgets`, `pumpWidget`)
- `ProviderScope` override 예시 (ReviewScreen 테스트)

**§5 mocktail (A-level)**
- 설명: build_runner 없는 경량 대안
- 설치 + class 상속 방식 vs Mockito code-gen 비교
- 언제 쓰나: 빠른 프로토타입, build_runner 부담 시

---

## 6. WireMock Stub Builder Simulator

### 6.1 Location

Tab 08, §2 WireMock 하단

### 6.2 UI

```
┌─────────────────────────────────────────────────────┐
│ SIM 20  WireMock Stub 빌더                           │
├─────────────────────────────────────────────────────┤
│ [GET ▼] [/google/token          ] [200 ▼]          │
│                                                      │
│ 응답 Body (JSON):                                    │
│ ┌─────────────────────────────────────────────┐     │
│ │ { "access_token": "mock_token", ... }       │     │
│ └─────────────────────────────────────────────┘     │
│                                                      │
│ 프리셋: [Stripe Checkout] [FCM Send] [OAuth Token]  │
│                                                      │
│ ┌──── JSON 매핑 ────┐  ┌──── Java 코드 ────┐       │
│ │ {                  │  │ stubFor(          │       │
│ │   "request": {     │  │   get(urlEqualTo( │       │
│ │     "method":"GET",│  │     "/google/..."  │       │
│ │     "url":"..."    │  │   )).willReturn(   │       │
│ │   },               │  │     aResponse()... │       │
│ │   "response": {    │  │   )                │       │
│ │     "status": 200, │  │ );                 │       │
│ │     "body": "..."  │  │                    │       │
│ │   }                │  │                    │       │
│ │ }                  │  │                    │       │
│ │        [복사]      │  │        [복사]      │       │
│ └────────────────────┘  └────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

### 6.3 Presets

| Preset | Method | URL | Status | Body |
|--------|--------|-----|--------|------|
| Stripe Checkout | POST | /stripe/v1/checkout/sessions | 200 | `{ "id": "cs_test_mock", "url": "https://checkout.stripe.com/..." }` |
| FCM Send | POST | /fcm/v1/projects/synapse-test/messages:send | 200 | `{ "name": "projects/synapse-test/messages/mock_001" }` |
| OAuth Token | POST | /google/token | 200 | `{ "access_token": "google_mock_access_token_001", "token_type": "Bearer", "expires_in": 3600 }` |

### 6.4 Generation Logic

Input (method, url, status, body) → two outputs:

**JSON mapping:**
```json
{
  "request": { "method": "${method}", "urlPathEqualTo": "${url}" },
  "response": { "status": ${status}, "jsonBody": ${body}, "headers": { "Content-Type": "application/json" } }
}
```

**Java code:**
```java
stubFor(${method.lower()}(urlPathEqualTo("${url}"))
    .willReturn(aResponse()
        .withStatus(${status})
        .withHeader("Content-Type", "application/json")
        .withJsonBody(${body})));
```

---

## 7. Strategy Tab Linkage

### 7.1 Tool Matrix Enhancement

Current Strategy tab §2 shows:

```
WireMock    외부 REST + 서비스 간 mock
```

Enhanced to:

```
WireMock    외부 REST + 서비스 간 mock    [→ 가이드]
```

Where `[→ 가이드]` is a clickable Pill that navigates to `#tools-java` and scrolls to the WireMock section.

### 7.2 DocCTA Variant

For tabs 08-10, replace the "원본 문서 보기" button with a link to the tech stack wiki:

```
원본 문서 → https://github.com/team-project-final/documents/wiki/18_기술_스택_정의서
```

---

## 8. Execution Summary

| Deliverable | Files | Complexity |
|-------------|-------|------------|
| Tab 08 Java | `js/tools-java.jsx` (new, ~400 lines) | High — 5 tools + simulator |
| Tab 09 Python | `js/tools-python.jsx` (new, ~250 lines) | Medium — 5 tools, no simulator |
| Tab 10 Flutter | `js/tools-flutter.jsx` (new, ~200 lines) | Medium — 4 tools, no simulator |
| Data + routing | `js/data.jsx`, `js/app.jsx`, `index.html` | Low — additions only |
| Strategy linkage | `js/app.jsx` (PageStrategy) | Low — add Pill links |
