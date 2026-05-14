# Mocking Tool Guide Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 new tabs (08 Java, 09 Python, 10 Flutter) with mocking tool installation/configuration/usage guides and a WireMock Stub Builder simulator.

**Architecture:** Each tab is a standalone JSX file exposing a Page component via `window`. The DOCS array in `data.jsx` drives tab navigation. `app.jsx` routes tab IDs to Page components. Tool guide tabs use `DocHero` for headers but replace the "원본 문서 보기" CTA with a link to the tech stack wiki. Strategy tab §2 gets guide-link Pills.

**Tech Stack:** React 18 (CDN), Babel standalone, existing UI primitives (Panel, Section, Code, CopyBtn, Pill, Field)

**Spec:** `docs/superpowers/specs/2026-05-14-tool-guide-tabs-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `js/data.jsx` | Modify | Add 3 DOCS entries (08, 09, 10) |
| `js/tools-java.jsx` | Create | Tab 08 page + WireMock Stub Builder simulator |
| `js/tools-python.jsx` | Create | Tab 09 page |
| `js/tools-flutter.jsx` | Create | Tab 10 page |
| `js/app.jsx` | Modify | Add tab routing + ToolDocCTA component + Strategy tab guide links |
| `index.html` | Modify | Add 3 script tags |

---

### Task 1: Add DOCS entries and script tags

**Files:**
- Modify: `js/data.jsx`
- Modify: `index.html`

- [ ] **Step 1: Add 3 entries to DOCS array in data.jsx**

In `js/data.jsx`, after the `external` entry (line 67, before the closing `];`), add:

```jsx
  ,
  {
    idx: "08",
    id: "tools-java",
    title: "Java 목킹 도구",
    en: "Java Mocking Tools",
    summary: "WireMock, Testcontainers, EmbeddedKafka, Spring Cloud Contract, Mockito — 설치부터 Synapse 맞춤 구성까지.",
    tags: ["WireMock 3.5", "Testcontainers 2.x", "EmbeddedKafka", "Mockito"]
  },
  {
    idx: "09",
    id: "tools-python",
    title: "Python 목킹 도구",
    en: "Python Mocking Tools",
    summary: "pytest+httpx, respx, fakeredis, testcontainers-python — AI 서비스 테스트 환경 구축.",
    tags: ["pytest 9.x", "respx", "fakeredis", "httpx"]
  },
  {
    idx: "10",
    id: "tools-flutter",
    title: "Flutter 목킹 도구",
    en: "Flutter Mocking Tools",
    summary: "dio mock adapter, Mockito, flutter_test, mocktail — 프론트엔드 목 테스트 가이드.",
    tags: ["dio mock", "Mockito 5.4", "flutter_test", "mocktail"]
  }
```

- [ ] **Step 2: Add 3 script tags to index.html**

In `index.html`, after the `sim-external.jsx` script tag (line 29) and before the `app.jsx` tag (line 30), add:

```html
  <script type="text/babel" src="js/tools-java.jsx"></script>
  <script type="text/babel" src="js/tools-python.jsx"></script>
  <script type="text/babel" src="js/tools-flutter.jsx"></script>
```

- [ ] **Step 3: Commit**

```bash
git add js/data.jsx index.html
git commit -m "feat: add DOCS entries and script tags for tool guide tabs 08-10"
```

---

### Task 2: Add ToolDocCTA and tab routing in app.jsx

**Files:**
- Modify: `js/app.jsx`

- [ ] **Step 1: Add ToolDocCTA component**

In `js/app.jsx`, after the `DocCTA` function (after line 149), add:

```jsx
// CTA for tool guide pages — links to wiki instead of local doc
function ToolDocCTA({ doc }) {
  return (
    <div className="doc-cta">
      <div className="doc-cta-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <div className="doc-cta-text">
        <div className="doc-cta-title">참조 문서 — {doc.idx}. {doc.title}</div>
        <div className="doc-cta-sub">기술 스택 정의서 기반 도구 가이드. 원본 정의서 →</div>
      </div>
      <a className="btn btn-primary doc-cta-btn" href="https://github.com/team-project-final/documents/wiki/18_%EA%B8%B0%EC%88%A0_%EC%8A%A4%ED%83%9D_%EC%A0%95%EC%9D%98%EC%84%9C" target="_blank" rel="noopener">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        기술 스택 정의서
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Add tab routing**

In `js/app.jsx`, in the App component's page render section (after line 811 `{tab === "external" && <PageExternal />}`), add:

```jsx
            {tab === "tools-java" && <PageToolsJava />}
            {tab === "tools-python" && <PageToolsPython />}
            {tab === "tools-flutter" && <PageToolsFlutter />}
```

- [ ] **Step 3: Export ToolDocCTA**

Add `ToolDocCTA` to the global scope by adding after the function definition:

```jsx
Object.assign(window, { ToolDocCTA });
```

- [ ] **Step 4: Commit**

```bash
git add js/app.jsx
git commit -m "feat: add ToolDocCTA component and tab routing for 08-10"
```

---

### Task 3: Create tools-java.jsx (Tab 08)

**Files:**
- Create: `js/tools-java.jsx`

- [ ] **Step 1: Create the file with all sections**

Create `js/tools-java.jsx` with the complete content:

```jsx
// ===== Tab 08: Java Mocking Tools =====

// WireMock Stub Builder Simulator
function WireMockStubBuilder() {
  const presets = [
    { label: "Stripe Checkout", method: "POST", url: "/stripe/v1/checkout/sessions", status: 200,
      body: JSON.stringify({ id: "cs_test_mock_001", url: "https://checkout.stripe.com/c/pay/cs_test_mock_001", payment_status: "unpaid" }, null, 2) },
    { label: "FCM Send", method: "POST", url: "/fcm/v1/projects/synapse-test/messages:send", status: 200,
      body: JSON.stringify({ name: "projects/synapse-test/messages/mock_msg_001" }, null, 2) },
    { label: "OAuth Token", method: "POST", url: "/google/token", status: 200,
      body: JSON.stringify({ access_token: "google_mock_access_token_001", token_type: "Bearer", expires_in: 3600, refresh_token: "google_mock_refresh_001", scope: "openid email profile" }, null, 2) }
  ];

  const [method, setMethod] = useState("POST");
  const [url, setUrl] = useState("/google/token");
  const [status, setStatus] = useState(200);
  const [body, setBody] = useState(presets[2].body);

  const applyPreset = (p) => { setMethod(p.method); setUrl(p.url); setStatus(p.status); setBody(p.body); };

  const jsonMapping = useMemo(() => {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify({
        request: { method: method, urlPathEqualTo: url },
        response: { status: status, jsonBody: parsed, headers: { "Content-Type": "application/json" } }
      }, null, 2);
    } catch { return "// Invalid JSON in body"; }
  }, [method, url, status, body]);

  const javaCode = useMemo(() => {
    const m = method.toLowerCase();
    const methodFn = m === "get" ? "get" : m === "post" ? "post" : m === "put" ? "put" : m === "delete" ? "delete" : m === "patch" ? "patch" : "request";
    return `stubFor(${methodFn}(urlPathEqualTo("${url}"))
    .willReturn(aResponse()
        .withStatus(${status})
        .withHeader("Content-Type", "application/json")
        .withBody("""
            ${body.split("\n").join("\n            ")}
            """)));`;
  }, [method, url, status, body]);

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div>
          <div className="grid-2" style={{ gap: 12 }}>
            <Field label="HTTP Method">
              <select className="select" value={method} onChange={e => setMethod(e.target.value)}>
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Status Code">
              <select className="select" value={status} onChange={e => setStatus(+e.target.value)}>
                {[200, 201, 400, 401, 403, 404, 429, 500, 503].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="URL Pattern">
              <input className="input" value={url} onChange={e => setUrl(e.target.value)} />
            </Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="응답 Body (JSON)">
              <textarea className="textarea" value={body} onChange={e => setBody(e.target.value)} rows={8} style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
            </Field>
          </div>
          <div className="row" style={{ marginTop: 12, gap: 6 }}>
            <span className="tiny muted">프리셋:</span>
            {presets.map(p => (
              <button key={p.label} className="btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => applyPreset(p)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ marginBottom: 16 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <div className="label">JSON 매핑 (mappings/*.json)</div>
              <CopyBtn text={jsonMapping} />
            </div>
            <Code>{jsonMapping}</Code>
          </div>
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <div className="label">Java 코드 (stubFor)</div>
              <CopyBtn text={javaCode} />
            </div>
            <Code lang="java">{javaCode}</Code>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cross-reference pill helper
function XRef({ label, tab }) {
  return (
    <span className="pill violet" style={{ cursor: "pointer", fontSize: 11 }}
      onClick={() => { window.location.hash = tab; window.scrollTo({ top: 0, behavior: "smooth" }); }}>
      → {label}
    </span>
  );
}

function PageToolsJava() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[8]} />
      <ToolDocCTA doc={DOCS[8]} />

      <Section num="1" title="개요 — Java 테스트 의존성" sub="build.gradle testImplementation 한눈에 보기">
        <Panel title="build.gradle (test dependencies)">
          <Code lang="gradle">{`dependencies {
    // WireMock — 외부 HTTP API stub
    testImplementation 'org.wiremock:wiremock-standalone:3.5.4'

    // Testcontainers — Docker 기반 인프라 테스트
    testImplementation 'org.testcontainers:testcontainers:2.0.0'
    testImplementation 'org.testcontainers:postgresql:2.0.0'
    testImplementation 'org.testcontainers:kafka:2.0.0'

    // EmbeddedKafka — 인메모리 Kafka
    testImplementation 'org.springframework.kafka:spring-kafka-test'

    // Spring Cloud Contract — API 계약 검증
    testImplementation 'org.springframework.cloud:spring-cloud-contract-stub-runner:4.1.3'

    // Mockito — Unit mock
    testImplementation 'org.mockito:mockito-core:5.12.0'
    testImplementation 'org.mockito:mockito-junit-jupiter:5.12.0'

    // Spring Boot Test
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}`}</Code>
          <CopyBtn text={`testImplementation 'org.wiremock:wiremock-standalone:3.5.4'
testImplementation 'org.testcontainers:testcontainers:2.0.0'
testImplementation 'org.testcontainers:postgresql:2.0.0'
testImplementation 'org.testcontainers:kafka:2.0.0'
testImplementation 'org.springframework.kafka:spring-kafka-test'
testImplementation 'org.springframework.cloud:spring-cloud-contract-stub-runner:4.1.3'
testImplementation 'org.mockito:mockito-core:5.12.0'`} />
        </Panel>
        <div style={{ marginTop: 16 }}>
          <table className="table">
            <thead><tr><th>도구</th><th>버전</th><th>용도</th><th>레이어</th></tr></thead>
            <tbody>
              {[
                ["WireMock", "3.5.4", "외부 REST API stub", "Service Integration"],
                ["Testcontainers", "2.x", "Docker 인프라 (DB/Redis/ES)", "Infra Integration"],
                ["EmbeddedKafka", "Spring Kafka", "인메모리 Kafka broker", "Service Integration"],
                ["Spring Cloud Contract", "4.1.3", "서비스 간 API 계약", "Contract"],
                ["Mockito", "5.12.0", "Unit mock (의존성 격리)", "Unit"]
              ].map(([name, ver, purpose, layer]) => (
                <tr key={name}>
                  <td><code style={{ color: "var(--cyan-bright)" }}>{name}</code></td>
                  <td className="mono tiny">{ver}</td>
                  <td className="tiny">{purpose}</td>
                  <td><Pill>{layer}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section num="2" title="WireMock" sub="외부 HTTP API를 로컬에서 스텁하는 도구 · v3.5.4">
        <Panel title="설치 및 설정">
          <div className="prose tiny">
            <p><strong>WireMock</strong>은 HTTP 기반 외부 API를 로컬에서 시뮬레이션하는 도구다. Synapse에서는 OAuth 4종, Stripe, FCM, SES, OpenAI, Anthropic 등 9개 외부 API를 WireMock으로 격리한다.</p>
          </div>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>Spring Boot 통합 설정</div>
          <Code lang="java">{`@SpringBootTest
@AutoConfigureWireMock(port = 0)  // 랜덤 포트 할당 → 병렬 실행 안전
public abstract class AbstractExternalApiTest {

    @DynamicPropertySource
    static void overrideExternalUrls(DynamicPropertyRegistry registry) {
        String baseUrl = "http://localhost:\${wiremock.server.port}";
        registry.add("oauth.google.token-url",    () -> baseUrl + "/google/token");
        registry.add("oauth.google.userinfo-url", () -> baseUrl + "/google/userinfo");
        registry.add("oauth.github.token-url",    () -> baseUrl + "/github/token");
        registry.add("oauth.apple.token-url",     () -> baseUrl + "/apple/token");
        registry.add("oauth.microsoft.token-url", () -> baseUrl + "/microsoft/token");
        registry.add("stripe.api-base-url",       () -> baseUrl + "/stripe");
        registry.add("fcm.api-url",               () -> baseUrl + "/fcm");
        registry.add("ses.endpoint-url",          () -> baseUrl + "/ses");
        registry.add("openai.api-base-url",       () -> baseUrl + "/openai");
        registry.add("anthropic.api-base-url",    () -> baseUrl + "/anthropic");
    }
}`}</Code>
        </Panel>

        <div style={{ marginTop: 16 }}>
          <Panel title="사용 패턴">
            <div className="label" style={{ marginBottom: 8 }}>패턴 1: 기본 stub 등록</div>
            <Code lang="java">{`stubFor(post(urlPathEqualTo("/google/token"))
    .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "application/json")
        .withBody("""
            {"access_token":"google_mock_token","token_type":"Bearer","expires_in":3600}
            """)));`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 2: JSON 파일 기반 매핑</div>
            <Code>{`src/test/resources/
├── __files/         ← 응답 body 파일
│   └── oauth/google-token-success.json
└── mappings/        ← 매핑 규칙 파일
    └── oauth/google-token.json`}</Code>
            <div className="tiny muted" style={{ marginTop: 8 }}>
              <code>mappings/</code> 폴더에 JSON 파일을 두면 WireMock이 자동 로딩. <code>--verbose</code> 플래그로 매핑 디버깅 가능.
            </div>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 3: 에러 시나리오 (Scenario State)</div>
            <Code lang="java">{`// 첫 번째 호출: 503 → 두 번째 호출: 200 (재시도 테스트)
stubFor(post(urlPathEqualTo("/stripe/v1/checkout/sessions"))
    .inScenario("retry-test")
    .whenScenarioStateIs(STARTED)
    .willReturn(aResponse().withStatus(503))
    .willSetStateTo("retry-1"));

stubFor(post(urlPathEqualTo("/stripe/v1/checkout/sessions"))
    .inScenario("retry-test")
    .whenScenarioStateIs("retry-1")
    .willReturn(aResponse().withStatus(200)
        .withBody("{\\"id\\":\\"cs_test_mock\\"}")));`}</Code>
          </Panel>
        </div>

        <div style={{ marginTop: 16 }}>
          <Panel title="트러블슈팅">
            <div className="col" style={{ gap: 8 }}>
              {[
                ["포트 충돌", "port = 0 사용 (랜덤 포트) + @DynamicPropertySource로 런타임 주입"],
                ["매핑 미스매치", "--verbose 플래그 또는 /__admin/requests 엔드포인트에서 실제 요청 확인"],
                ["JSON body 불일치", "equalToJson(ignoreArrayOrder=true, ignoreExtraElements=true) 사용"]
              ].map(([problem, solution]) => (
                <div key={problem} className="card card-tight">
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--amber-bright)" }}>{problem}</div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{solution}</div>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <span className="tiny muted">다른 언어 대안:</span>
              <XRef label="Python: respx (09탭)" tab="tools-python" />
              <XRef label="Flutter: dio mock adapter (10탭)" tab="tools-flutter" />
            </div>
          </Panel>
        </div>

        <div style={{ marginTop: 16 }}>
          <Panel title="WireMock Stub 빌더" badge="SIM 20" sub="method/URL/응답 입력 → JSON 매핑 + Java 코드 자동 생성">
            <WireMockStubBuilder />
          </Panel>
        </div>
      </Section>

      <Section num="3" title="Testcontainers" sub="Docker 컨테이너를 테스트 라이프사이클에 맞춰 자동 관리 · v2.x">
        <Panel title="설치 및 설정">
          <div className="prose tiny">
            <p><strong>Testcontainers</strong>는 테스트 시작 시 Docker 컨테이너를 띄우고, 종료 시 자동 정리한다. Synapse에서는 PostgreSQL(pgvector), Redis 7, Elasticsearch 8.x를 실제 인스턴스로 테스트한다.</p>
            <p><strong>필수 조건:</strong> Docker Desktop 또는 Docker Engine 설치 필요. CI에서는 DinD(Docker-in-Docker) 설정.</p>
          </div>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>Synapse 베이스 클래스</div>
          <Code lang="java">{`public abstract class AbstractIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
            DockerImageName.parse("pgvector/pgvector:pg16"))
        .withInitScript("init-pgvector.sql");  // CREATE EXTENSION vector;

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @Container
    static ElasticsearchContainer es = new ElasticsearchContainer(
            "docker.elastic.co/elasticsearch/elasticsearch:8.13.0")
        .withEnv("xpack.security.enabled", "false");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
        registry.add("spring.elasticsearch.uris", es::getHttpHostAddress);
    }
}`}</Code>
        </Panel>
        <div style={{ marginTop: 16 }}>
          <Panel title="사용 패턴">
            <div className="label" style={{ marginBottom: 8 }}>패턴 1: 기본 컨테이너 + @DynamicPropertySource</div>
            <div className="tiny muted" style={{ marginBottom: 12 }}>위의 베이스 클래스를 상속받으면 자동으로 3개 컨테이너가 시작됨. <code>@DynamicPropertySource</code>로 Spring에 URL 주입.</div>

            <div className="label" style={{ marginBottom: 8 }}>패턴 2: pgvector init script</div>
            <Code lang="sql">{`-- init-pgvector.sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE note_chunks (
    id UUID PRIMARY KEY,
    note_id UUID NOT NULL,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(1536),
    token_count INT
);
CREATE INDEX ON note_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 3: reuse 모드 (로컬 개발 속도 향상)</div>
            <Code>{`# ~/.testcontainers.properties
testcontainers.reuse.enable=true`}</Code>
            <Code lang="java">{`@Container
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("pgvector/pgvector:pg16")
    .withReuse(true);  // 컨테이너 재시작 없이 재사용`}</Code>
            <div className="tiny muted" style={{ marginTop: 8 }}>주의: reuse 시 테스트 간 데이터 격리를 teardown으로 보장해야 함.</div>
          </Panel>
        </div>
        <div style={{ marginTop: 16 }}>
          <Panel title="트러블슈팅">
            <div className="col" style={{ gap: 8 }}>
              {[
                ["Docker 미설치", "Docker Desktop 설치 필요. CI에서는 services: docker:dind 설정"],
                ["CI DinD 설정", "DOCKER_HOST=tcp://docker:2375 환경변수 + Testcontainers cloud 대안"],
                ["컨테이너 reuse 충돌", "tc.reuse.label 으로 격리. 문제 시 docker rm -f $(docker ps -aq)"]
              ].map(([problem, solution]) => (
                <div key={problem} className="card card-tight">
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--amber-bright)" }}>{problem}</div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{solution}</div>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <span className="tiny muted">다른 언어 대안:</span>
              <XRef label="Python: testcontainers-python (09탭)" tab="tools-python" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section num="4" title="EmbeddedKafka" sub="테스트용 인메모리 Kafka 브로커 · Spring Kafka Test">
        <Panel title="설치 및 설정">
          <div className="prose tiny">
            <p><strong>EmbeddedKafka</strong>는 Spring Kafka Test에 포함된 인메모리 Kafka 브로커로, 외부 Kafka 클러스터 없이 Producer/Consumer + Avro 직렬화를 검증한다.</p>
          </div>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>Synapse 구성</div>
          <Code lang="java">{`@EmbeddedKafka(
    topics = {
        "note.created", "note.updated", "note.deleted",
        "card.reviewed", "user.registered", "user.deleted",
        "billing.subscription.changed", "audit.event",
        "community.deck.shared", "community.note.shared",
        "community.group.created", "community.group.joined",
        "community.report.created",
        "gamification.xp.earned", "gamification.badge.earned", "gamification.level.up",
        "notification.send", "card.review.due"
    },
    partitions = 1,
    brokerProperties = { "listeners=PLAINTEXT://localhost:0" }
)
@SpringBootTest
class KafkaIntegrationTest { ... }`}</Code>
        </Panel>
        <div style={{ marginTop: 16 }}>
          <Panel title="사용 패턴">
            <div className="label" style={{ marginBottom: 8 }}>패턴 1: Producer 검증 (publish → consume → assert)</div>
            <Code lang="java">{`@Autowired KafkaTestHelper kafkaTestHelper;

@Test
void createNote_shouldPublishEvent() {
    // when — 비즈니스 로직 실행
    noteService.createNote(request);

    // then — Kafka에 이벤트 발행 확인
    var records = kafkaTestHelper.consumeMessages(
        "note.created", 1, Duration.ofSeconds(5));
    assertThat(records).hasSize(1);
    assertThat(records.get(0).value())
        .extracting("data.noteId").isEqualTo("note-...001");
}`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 2: Consumer 검증 (publish fixture → assert side effect)</div>
            <Code lang="java">{`@Test
void consumeCardReviewed_shouldAwardXP() {
    // given — fixture 발행
    String fixture = loadFixture("kafka/card-reviewed.json");
    kafkaTestHelper.publishAndWait("card.reviewed", "key-1", fixture,
        Duration.ofSeconds(5));

    // then — DB에 XP 적립 확인
    var xp = jdbcTemplate.queryForObject(
        "SELECT total_xp FROM user_xp_summary WHERE user_id = ?",
        Long.class, "user-...001");
    assertThat(xp).isEqualTo(10);
}`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 3: Avro 직렬화 검증</div>
            <Code lang="java">{`@Test
void avroSerialization_shouldRoundTrip() {
    // CloudEvents + Avro로 직렬화된 메시지가
    // Consumer에서 올바르게 역직렬화되는지 확인
    var event = NoteCreatedEvent.newBuilder()
        .setNoteId("note-...001")
        .setTitle("테스트 노트")
        .build();

    kafkaTemplate.send("note.created", "key", event).get();
    var consumed = kafkaTestHelper.consumeMessages("note.created", 1,
        Duration.ofSeconds(5));
    assertThat(consumed.get(0).value()).isInstanceOf(NoteCreatedEvent.class);
}`}</Code>
          </Panel>
        </div>
        <div style={{ marginTop: 16 }}>
          <Panel title="트러블슈팅">
            <div className="col" style={{ gap: 8 }}>
              {[
                ["토픽 미등록", "@EmbeddedKafka topics에 사용할 모든 토픽 나열 필요"],
                ["Consumer 타임아웃", "consumeMessages의 timeout 늘리기 (기본 5s → 10s)"],
                ["Avro 스키마 불일치", "synapse-shared의 .avsc 파일이 최신인지 확인. gradle generateAvroJava 재실행"]
              ].map(([problem, solution]) => (
                <div key={problem} className="card card-tight">
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--amber-bright)" }}>{problem}</div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{solution}</div>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <span className="tiny muted">다른 언어 대안:</span>
              <XRef label="Python: unittest.mock.patch (09탭)" tab="tools-python" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section num="5" title="Spring Cloud Contract" sub="서비스 간 API 계약 검증 · v4.1.3">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>Spring Cloud Contract</strong>는 Producer가 계약(Groovy DSL)을 정의하면, Consumer가 자동 생성된 stub으로 테스트하는 계약 검증 도구다.</p>
          </div>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>계약 정의 (Provider: learning-card)</div>
          <Code lang="groovy">{`// contracts/copyDeck.groovy
Contract.make {
    description "덱 복사 API"
    request {
        method POST()
        url "/internal/decks/copy"
        headers { contentType applicationJson() }
        body([
            sourceDeckId: $(anyUuid()),
            targetUserId: $(anyUuid()),
            tenantId: $(anyUuid()),
            newDeckName: $(optional(anyNonBlankString()))
        ])
    }
    response {
        status 201
        headers { contentType applicationJson() }
        body([
            copiedDeckId: $(anyUuid()),
            cardCount: $(anyPositiveInt())
        ])
    }
}`}</Code>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>Consumer 테스트 (engagement-svc)</div>
          <Code lang="java">{`@AutoConfigureStubRunner(
    ids = "com.synapse:learning-card:+:stubs:8091",
    stubsMode = StubRunnerProperties.StubsMode.LOCAL)
@SpringBootTest
class CommunityDeckCopyContractTest {
    @Test
    void copyDeck_shouldFollowContract() {
        var response = deckCopyClient.copyDeck(request);
        assertThat(response.copiedDeckId()).isNotNull();
    }
}`}</Code>
        </Panel>
      </Section>

      <Section num="6" title="Mockito" sub="Unit mock (의존성 격리) · v5.12.0">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>Mockito</strong>는 Java 단위 테스트에서 의존성을 격리하는 표준 mock 프레임워크다. Service → Repository 의존성을 mock하여 비즈니스 로직만 테스트한다.</p>
          </div>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>기본 사용법</div>
          <Code lang="java">{`@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock NoteRepository noteRepository;
    @Mock KafkaTemplate<String, Object> kafkaTemplate;
    @InjectMocks NoteService noteService;

    @Test
    void createNote_shouldSaveAndPublish() {
        // given
        when(noteRepository.save(any())).thenReturn(savedNote);

        // when
        noteService.createNote(request);

        // then
        verify(noteRepository).save(any());
        verify(kafkaTemplate).send(eq("note.created"), any(), any());
    }
}`}</Code>
          <div className="row" style={{ marginTop: 12, gap: 6 }}>
            <span className="tiny muted">다른 언어 대안:</span>
            <XRef label="Flutter: mockito 5.4 (10탭)" tab="tools-flutter" />
            <XRef label="Python: unittest.mock (09탭)" tab="tools-python" />
          </div>
        </Panel>
      </Section>
    </div>
  );
}

Object.assign(window, { PageToolsJava, WireMockStubBuilder, XRef });
```

- [ ] **Step 2: Verify file loads in browser**

Open `http://localhost:8765/index.html#tools-java`. Tab should render with all sections.

- [ ] **Step 3: Commit**

```bash
git add js/tools-java.jsx
git commit -m "feat: add Java mocking tools guide tab (08) with WireMock Stub Builder simulator"
```

---

### Task 4: Create tools-python.jsx (Tab 09)

**Files:**
- Create: `js/tools-python.jsx`

- [ ] **Step 1: Create the file**

Create `js/tools-python.jsx`:

```jsx
// ===== Tab 09: Python Mocking Tools =====

function PageToolsPython() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[9]} />
      <ToolDocCTA doc={DOCS[9]} />

      <Section num="1" title="개요 — Python 테스트 의존성" sub="requirements-test.txt 한눈에 보기">
        <Panel title="requirements-test.txt">
          <Code>{`# Testing
pytest==9.0.0
pytest-asyncio==0.24.0
httpx==0.28.0

# External API mock
respx==0.21.1

# Redis mock
fakeredis==2.23.0

# Infrastructure containers
testcontainers==4.4.0

# Coverage
pytest-cov==5.0.0`}</Code>
          <CopyBtn text={`pytest==9.0.0\npytest-asyncio==0.24.0\nhttpx==0.28.0\nrespx==0.21.1\nfakeredis==2.23.0\ntestcontainers==4.4.0\npytest-cov==5.0.0`} />
        </Panel>
        <div style={{ marginTop: 16 }}>
          <table className="table">
            <thead><tr><th>도구</th><th>버전</th><th>용도</th><th>레이어</th></tr></thead>
            <tbody>
              {[
                ["pytest + httpx", "9.x + 0.28.x", "FastAPI 비동기 테스트", "Integration"],
                ["respx", "0.21.1", "외부 HTTP API mock (httpx 기반)", "Service Integration"],
                ["fakeredis", "2.23.0", "Redis 시맨틱 캐시 mock", "Infra Integration"],
                ["testcontainers", "4.4.0", "Docker 인프라 (PostgreSQL+pgvector)", "Infra Integration"],
                ["unittest.mock", "stdlib", "내부 의존성 mock", "Unit"]
              ].map(([name, ver, purpose, layer]) => (
                <tr key={name}>
                  <td><code style={{ color: "var(--cyan-bright)" }}>{name}</code></td>
                  <td className="mono tiny">{ver}</td>
                  <td className="tiny">{purpose}</td>
                  <td><Pill>{layer}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section num="2" title="pytest + httpx" sub="FastAPI 비동기 테스트 조합 · pytest 9.x + httpx 0.28.x">
        <Panel title="설치 및 설정">
          <div className="prose tiny">
            <p><strong>pytest + httpx</strong>는 FastAPI 앱의 비동기 엔드포인트를 테스트하는 조합이다. <code>httpx.AsyncClient</code>가 ASGI 앱에 직접 요청을 보내므로 실제 서버 없이 테스트 가능하다.</p>
          </div>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>conftest.py (Synapse 공통 fixture)</div>
          <Code lang="python">{`import pytest
import fakeredis
from pathlib import Path
from unittest.mock import MagicMock

FIXTURE_DIR = Path(__file__).parent / "fixtures"

@pytest.fixture
def redis_client():
    """fakeredis 인스턴스 — 시맨틱 캐시 테스트용"""
    return fakeredis.FakeRedis(decode_responses=True)

@pytest.fixture
def kafka_producer_mock():
    """Kafka producer mock — 발행 메시지 캡처"""
    producer = MagicMock()
    producer.sent = []
    def mock_produce(topic, key=None, value=None, **kwargs):
        producer.sent.append({"topic": topic, "key": key, "value": value})
    producer.produce = mock_produce
    return producer`}</Code>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>pytest.ini</div>
          <Code>{`[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*`}</Code>
        </Panel>
        <div style={{ marginTop: 16 }}>
          <Panel title="사용 패턴">
            <div className="label" style={{ marginBottom: 8 }}>패턴 1: AsyncClient 기본 테스트</div>
            <Code lang="python">{`import httpx
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 2: fixture scope 관리</div>
            <Code lang="python">{`@pytest.fixture(scope="function")  # 각 테스트마다 새로 생성 (기본)
def redis_client():
    return fakeredis.FakeRedis(decode_responses=True)

@pytest.fixture(scope="session")  # 전체 테스트 세션에서 1회만 생성
def pg_container():
    with PostgresContainer("pgvector/pgvector:pg16") as pg:
        yield pg`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 3: parametrize 활용</div>
            <Code lang="python">{`@pytest.mark.parametrize("rating,expected_ef", [
    (0, 1.70), (1, 1.96), (2, 2.36),
    (3, 2.36), (4, 2.50), (5, 2.60),
])
def test_sm2_ef_calculation(rating, expected_ef):
    result = sm2(rating, ef=2.5, interval=7, reps=3)
    assert result["ef"] == pytest.approx(expected_ef, abs=0.01)`}</Code>
          </Panel>
        </div>
        <div style={{ marginTop: 16 }}>
          <Panel title="트러블슈팅">
            <div className="col" style={{ gap: 8 }}>
              {[
                ["async event loop 충돌", "pytest.ini에 asyncio_mode = auto 설정. 또는 @pytest.mark.asyncio 명시"],
                ["fixture scope 불일치", "session scope fixture에서 function scope fixture 의존 불가. scope 계층 확인"]
              ].map(([problem, solution]) => (
                <div key={problem} className="card card-tight">
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--amber-bright)" }}>{problem}</div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{solution}</div>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <span className="tiny muted">다른 언어 대안:</span>
              <XRef label="Java: MockMvc + @SpringBootTest (08탭)" tab="tools-java" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section num="3" title="respx" sub="httpx 기반 외부 HTTP mock · v0.21.1">
        <Panel title="설치 및 설정">
          <div className="prose tiny">
            <p><strong>respx</strong>는 httpx의 transport layer를 가로채 외부 HTTP 호출을 mock한다. Synapse learning-ai에서 OpenAI Embeddings, Anthropic Claude API를 mock할 때 사용한다.</p>
          </div>
          <Code>{`pip install respx`}</Code>
        </Panel>
        <div style={{ marginTop: 16 }}>
          <Panel title="사용 패턴">
            <div className="label" style={{ marginBottom: 8 }}>패턴 1: 기본 mock</div>
            <Code lang="python">{`import respx, httpx

@respx.mock
async def test_generate_embedding():
    respx.post("https://api.openai.com/v1/embeddings").mock(
        return_value=httpx.Response(200, json={
            "data": [{"embedding": [0.0023, -0.0121, 0.0156]}],
            "model": "text-embedding-3-small",
            "usage": {"prompt_tokens": 15, "total_tokens": 15}
        })
    )

    service = EmbeddingService()
    result = await service.generate("머신러닝에서 과적합이란?")

    assert len(result) == 1536
    assert respx.calls.call_count == 1`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 2: 조건부 매칭 (URL + body)</div>
            <Code lang="python">{`@respx.mock
async def test_claude_card_generation():
    respx.post(
        "https://api.anthropic.com/v1/messages",
        json__contains={"model": "claude-sonnet-4-20250514"}
    ).mock(return_value=httpx.Response(200, json={
        "content": [{"type": "text", "text": "{\\"cards\\": [...]}"}],
        "usage": {"input_tokens": 500, "output_tokens": 300}
    }))`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 3: 순차 응답 (재시도 테스트)</div>
            <Code lang="python">{`@respx.mock
async def test_rate_limit_retry():
    route = respx.post("https://api.openai.com/v1/embeddings")
    route.side_effect = [
        httpx.Response(429, json={"error": {"type": "rate_limit_exceeded"}}),
        httpx.Response(200, json={"data": [{"embedding": [0.1, 0.2]}]})
    ]

    result = await service.generate_with_retry("test query")
    assert route.call_count == 2  # 1번 실패 + 1번 성공`}</Code>
          </Panel>
        </div>
        <div style={{ marginTop: 16 }}>
          <Panel title="트러블슈팅">
            <div className="col" style={{ gap: 8 }}>
              {[
                ["mock 누수 (unmocked 호출)", "@respx.mock(assert_all_mocked=True) 로 미등록 호출 시 에러 발생"],
                ["비동기 컨텍스트", "respx는 httpx 전용. requests 라이브러리에는 responses 패키지 사용"]
              ].map(([problem, solution]) => (
                <div key={problem} className="card card-tight">
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--amber-bright)" }}>{problem}</div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{solution}</div>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <span className="tiny muted">다른 언어 대안:</span>
              <XRef label="Java: WireMock (08탭)" tab="tools-java" />
              <XRef label="Flutter: dio mock adapter (10탭)" tab="tools-flutter" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section num="4" title="fakeredis" sub="Redis 인메모리 mock · v2.23.0">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>fakeredis</strong>는 실제 Redis 없이 인메모리로 Redis 명령을 실행한다. Synapse learning-ai의 시맨틱 캐시를 테스트할 때 사용.</p>
          </div>
          <Code lang="python">{`import fakeredis

def test_semantic_cache_hit(redis_client):
    # given — 캐시에 임베딩+답변 저장
    redis_client.set("cache:hash_abc", '{"answer":"과적합이란...","embedding":[0.1,0.2]}')

    # when
    result = redis_client.get("cache:hash_abc")

    # then
    assert result is not None
    assert "과적합" in result`}</Code>
          <div className="row" style={{ marginTop: 12, gap: 6 }}>
            <span className="tiny muted">다른 언어 대안:</span>
            <XRef label="Java: Testcontainers Redis (08탭)" tab="tools-java" />
          </div>
        </Panel>
      </Section>

      <Section num="5" title="testcontainers-python" sub="Docker 인프라 테스트 · v4.4.0">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>testcontainers-python</strong>은 Java Testcontainers의 Python 포트. Synapse learning-ai에서 PostgreSQL+pgvector 시맨틱 검색 테스트에 사용.</p>
          </div>
          <Code lang="python">{`from testcontainers.postgres import PostgresContainer

@pytest.fixture(scope="session")
def pg_container():
    with PostgresContainer("pgvector/pgvector:pg16") as pg:
        # pgvector 확장 활성화
        import psycopg2
        conn = psycopg2.connect(pg.get_connection_url())
        conn.cursor().execute("CREATE EXTENSION IF NOT EXISTS vector")
        conn.commit()
        yield pg

def test_semantic_search(pg_container):
    url = pg_container.get_connection_url()
    # ... pgvector 검색 테스트`}</Code>
          <div className="row" style={{ marginTop: 12, gap: 6 }}>
            <span className="tiny muted">다른 언어 대안:</span>
            <XRef label="Java: Testcontainers (08탭)" tab="tools-java" />
          </div>
        </Panel>
      </Section>

      <Section num="6" title="unittest.mock" sub="Python 표준 라이브러리 mock">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>unittest.mock</strong>은 Python 내장 mock 라이브러리. Synapse에서 Kafka consumer 테스트 시 producer를 mock할 때 사용.</p>
          </div>
          <Code lang="python">{`from unittest.mock import patch, MagicMock

@patch("app.services.embedding.EmbeddingService.generate")
async def test_note_consumer(mock_generate):
    mock_generate.return_value = [0.1, 0.2, 0.3]

    await consume_note_created(event_fixture)

    mock_generate.assert_called_once_with("노트 본문...")

# conftest.py의 kafka_producer_mock 패턴도 이 방식
# MagicMock()으로 produce() 메서드를 가로채고
# producer.sent 리스트에서 발행된 메시지를 검증`}</Code>
          <div className="row" style={{ marginTop: 12, gap: 6 }}>
            <span className="tiny muted">다른 언어 대안:</span>
            <XRef label="Java: Mockito (08탭)" tab="tools-java" />
            <XRef label="Flutter: mockito (10탭)" tab="tools-flutter" />
          </div>
        </Panel>
      </Section>
    </div>
  );
}

Object.assign(window, { PageToolsPython });
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8765/index.html#tools-python`. Tab should render with all 6 sections.

- [ ] **Step 3: Commit**

```bash
git add js/tools-python.jsx
git commit -m "feat: add Python mocking tools guide tab (09)"
```

---

### Task 5: Create tools-flutter.jsx (Tab 10)

**Files:**
- Create: `js/tools-flutter.jsx`

- [ ] **Step 1: Create the file**

Create `js/tools-flutter.jsx`:

```jsx
// ===== Tab 10: Flutter Mocking Tools =====

function PageToolsFlutter() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[10]} />
      <ToolDocCTA doc={DOCS[10]} />

      <Section num="1" title="개요 — Flutter 테스트 의존성" sub="pubspec.yaml dev_dependencies 한눈에 보기">
        <Panel title="pubspec.yaml (dev_dependencies)">
          <Code lang="yaml">{`dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter

  # Mock frameworks
  mockito: ^5.4.4
  build_runner: ^2.4.9
  mocktail: ^1.0.3

  # HTTP mock
  dio_mock_interceptor: ^2.0.0

  # Code generation
  json_serializable: ^6.7.1
  freezed: ^3.2.3`}</Code>
          <CopyBtn text={`mockito: ^5.4.4\nbuild_runner: ^2.4.9\nmocktail: ^1.0.3\ndio_mock_interceptor: ^2.0.0`} />
        </Panel>
        <div style={{ marginTop: 16 }}>
          <table className="table">
            <thead><tr><th>도구</th><th>버전</th><th>용도</th><th>테스트 유형</th></tr></thead>
            <tbody>
              {[
                ["dio mock adapter", "2.0.0", "HTTP 호출 가로채기", "Widget / Integration"],
                ["Mockito", "5.4.4", "Repository/Provider mock", "Unit / Widget"],
                ["flutter_test", "SDK", "Widget 테스트 프레임워크", "Widget"],
                ["mocktail", "1.0.3", "코드젠 불필요 mock 대안", "Unit"]
              ].map(([name, ver, purpose, type]) => (
                <tr key={name}>
                  <td><code style={{ color: "var(--cyan-bright)" }}>{name}</code></td>
                  <td className="mono tiny">{ver}</td>
                  <td className="tiny">{purpose}</td>
                  <td><Pill>{type}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section num="2" title="dio mock adapter" sub="dio HTTP 클라이언트 어댑터 교체 방식 · v2.0.0">
        <Panel title="설치 및 설정">
          <div className="prose tiny">
            <p><strong>dio mock adapter</strong>는 dio의 <code>HttpClientAdapter</code>를 교체하여 네트워크 호출을 가로채는 방식이다. Synapse에서는 모든 백엔드 API 호출을 <code>MockDioAdapter</code>로 mock한다.</p>
          </div>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>MockDioAdapter 구현</div>
          <Code lang="dart">{`class MockDioAdapter implements HttpClientAdapter {
  final Map<String, MockResponse> _mappings = {};

  void onGet(String path, MockResponse response) =>
      _mappings['GET:\$path'] = response;
  void onPost(String path, MockResponse response) =>
      _mappings['POST:\$path'] = response;
  void onPatch(String path, MockResponse response) =>
      _mappings['PATCH:\$path'] = response;
  void onDelete(String path, MockResponse response) =>
      _mappings['DELETE:\$path'] = response;

  @override
  Future<ResponseBody> fetch(RequestOptions options, ...) async {
    final key = '\${options.method}:\${options.path}';
    final response = _mappings[key] ?? _findPatternMatch(options);

    if (response == null) {
      throw DioException(
        requestOptions: options,
        error: 'No mock mapping for \$key',
        type: DioExceptionType.unknown,
      );
    }

    if (response.delay != null) await Future.delayed(response.delay!);

    return ResponseBody.fromString(
      jsonEncode(response.data),
      response.statusCode,
      headers: {'content-type': ['application/json']},
    );
  }
}`}</Code>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>Mock/실제 전환 토글</div>
          <Code lang="dart">{`Dio createDioClient({bool useMock = false}) {
  final dio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));
  if (useMock) {
    dio.httpClientAdapter = MockDioAdapter()
      ..onPost('/auth/login', MockResponse(
          statusCode: 200,
          data: {"success": true, "data": {"accessToken": "mock_jwt"}}))
      ..onGet('/notes', MockResponse(
          statusCode: 200,
          data: {"success": true, "data": [...]}));
  }
  return dio;
}`}</Code>
        </Panel>
        <div style={{ marginTop: 16 }}>
          <Panel title="사용 패턴">
            <div className="label" style={{ marginBottom: 8 }}>패턴 1: 기본 GET/POST mock 등록</div>
            <Code lang="dart">{`final adapter = MockDioAdapter();

// GET mock
adapter.onGet('/notes', MockResponse(
  statusCode: 200,
  data: {"success": true, "data": [
    {"id": "note-001", "title": "머신러닝 기초 정리"}
  ]},
));

// POST mock
adapter.onPost('/notes', MockResponse(
  statusCode: 201,
  data: {"success": true, "data": {"id": "note-003"}},
));`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 2: regex 패턴 매칭</div>
            <Code lang="dart">{`// /notes/:id 같은 동적 경로 매칭
MockResponse? _findPatternMatch(RequestOptions options) {
  final key = '\${options.method}:\${options.path}';
  for (final entry in _patternMappings.entries) {
    if (RegExp(entry.key).hasMatch(key)) {
      return entry.value;
    }
  }
  return null;
}

// 등록: regex 패턴으로
adapter.onGetPattern(r'/notes/[\\w-]+', MockResponse(...));`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 3: 네트워크 지연 시뮬레이션</div>
            <Code lang="dart">{`adapter.onPost('/ai/generate-cards', MockResponse(
  statusCode: 200,
  data: {"success": true, "data": {"cards": [...]}},
  delay: Duration(milliseconds: 800),  // Claude API 응답 시간 시뮬레이션
));`}</Code>
          </Panel>
        </div>
        <div style={{ marginTop: 16 }}>
          <Panel title="트러블슈팅">
            <div className="col" style={{ gap: 8 }}>
              {[
                ["unmapped route 에러", "DioException 메시지에 'No mock mapping for GET:/path' 표시 → 해당 경로 등록 필요"],
                ["method 와일드카드", "에러 응답(400/401/500)은 method='*'로 등록하면 모든 메서드에 매칭"],
                ["body 검증 불가", "MockDioAdapter는 요청 body를 검증하지 않음 — body 검증은 Mockito Repository mock에서"]
              ].map(([problem, solution]) => (
                <div key={problem} className="card card-tight">
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--amber-bright)" }}>{problem}</div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{solution}</div>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <span className="tiny muted">다른 언어 대안:</span>
              <XRef label="Java: WireMock (08탭)" tab="tools-java" />
              <XRef label="Python: respx (09탭)" tab="tools-python" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section num="3" title="Mockito (Dart)" sub="Repository/Provider mock · v5.4.4">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>Mockito</strong> (Dart)는 <code>@GenerateMocks</code> 어노테이션과 <code>build_runner</code>로 mock 클래스를 자동 생성한다.</p>
          </div>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>1단계: 어노테이션 추가</div>
          <Code lang="dart">{`// test/repositories/note_repository_test.dart
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

@GenerateMocks([NoteRepository, CardRepository])
import 'note_repository_test.mocks.dart';`}</Code>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>2단계: 코드 생성</div>
          <Code>{`dart run build_runner build --delete-conflicting-outputs`}</Code>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>3단계: 테스트에서 사용</div>
          <Code lang="dart">{`void main() {
  late MockNoteRepository mockNoteRepo;

  setUp(() {
    mockNoteRepo = MockNoteRepository();
  });

  test('should return notes list', () async {
    when(mockNoteRepo.getNotes())
        .thenAnswer((_) async => [Note(id: 'note-001', title: '테스트')]);

    final notes = await mockNoteRepo.getNotes();

    expect(notes.length, 1);
    verify(mockNoteRepo.getNotes()).called(1);
  });
}`}</Code>
          <div className="row" style={{ marginTop: 12, gap: 6 }}>
            <span className="tiny muted">다른 언어 대안:</span>
            <XRef label="Java: Mockito (08탭)" tab="tools-java" />
            <XRef label="Python: unittest.mock (09탭)" tab="tools-python" />
          </div>
        </Panel>
      </Section>

      <Section num="4" title="flutter_test" sub="Widget 테스트 프레임워크 · SDK 내장">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>flutter_test</strong>는 Flutter SDK 내장 위젯 테스트 프레임워크. <code>testWidgets</code>로 위젯을 렌더링하고, <code>find</code>로 요소를 찾고, <code>expect</code>로 검증한다.</p>
          </div>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>Widget 테스트 + Riverpod override</div>
          <Code lang="dart">{`// test/widgets/review_screen_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  testWidgets('ReviewScreen shows card count', (tester) async {
    final mockCardRepo = MockCardRepository();
    when(mockCardRepo.getDueCards())
        .thenAnswer((_) async => [card1, card2, card3]);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cardRepositoryProvider.overrideWithValue(mockCardRepo),
        ],
        child: const MaterialApp(home: ReviewScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('3장'), findsOneWidget);
    expect(find.byType(CardWidget), findsNWidgets(1));  // 첫 번째 카드
  });
}`}</Code>
        </Panel>
      </Section>

      <Section num="5" title="mocktail" sub="build_runner 없는 경량 mock 대안 · v1.0.3">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>mocktail</strong>은 Mockito와 달리 <code>build_runner</code> 코드 생성 없이 mock을 만든다. class 상속 방식으로 mock 정의.</p>
          </div>
          <div className="label" style={{ marginTop: 12, marginBottom: 6 }}>Mockito vs mocktail 비교</div>
          <table className="table">
            <thead><tr><th>항목</th><th>Mockito</th><th>mocktail</th></tr></thead>
            <tbody>
              <tr><td>Mock 생성</td><td><code>@GenerateMocks</code> + build_runner</td><td>class 상속 (수동)</td></tr>
              <tr><td>설정 시간</td><td>코드젠 필요 (느림)</td><td>즉시 (빠름)</td></tr>
              <tr><td>타입 안전성</td><td>컴파일 타임 검증</td><td>런타임 검증</td></tr>
              <tr><td className="tiny">추천 상황</td><td>프로덕션 코드, CI</td><td>프로토타입, 빠른 테스트</td></tr>
            </tbody>
          </table>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>mocktail 사용법</div>
          <Code lang="dart">{`import 'package:mocktail/mocktail.dart';

// Mock 정의 — class 상속만으로 끝
class MockNoteRepository extends Mock implements NoteRepository {}

void main() {
  late MockNoteRepository mockRepo;

  setUp(() {
    mockRepo = MockNoteRepository();
  });

  test('should fetch notes', () async {
    when(() => mockRepo.getNotes())
        .thenAnswer((_) async => [Note(id: 'note-001')]);

    final notes = await mockRepo.getNotes();
    expect(notes.length, 1);
  });
}`}</Code>
        </Panel>
      </Section>
    </div>
  );
}

Object.assign(window, { PageToolsFlutter });
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8765/index.html#tools-flutter`. Tab should render with all 5 sections.

- [ ] **Step 3: Commit**

```bash
git add js/tools-flutter.jsx
git commit -m "feat: add Flutter mocking tools guide tab (10)"
```

---

### Task 6: Add guide links to Strategy tab tool matrix

**Files:**
- Modify: `js/app.jsx` (PageStrategy Section 2)

- [ ] **Step 1: Update Java tool matrix with guide links**

In `js/app.jsx`, replace the Java tool matrix section (lines 173-188) — the `Panel title="Java / Spring Boot"` block:

```jsx
          <Panel title="Java / Spring Boot" right={<span className="pill cyan" style={{ cursor: "pointer", fontSize: 10 }} onClick={() => { window.location.hash = "tools-java"; window.scrollTo({ top: 0, behavior: "smooth" }); }}>→ 상세 가이드</span>}>
            <div className="col" style={{ gap: 8 }}>
              {[
                ["WireMock", "외부 REST + 서비스 간 mock"],
                ["EmbeddedKafka", "Producer/Consumer + Avro"],
                ["Testcontainers", "PostgreSQL/Redis/ES"],
                ["Spring Cloud Contract", "API 계약 검증"],
                ["Mockito", "Unit mock"]
              ].map(([k, v]) => (
                <div key={k} className="row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--line-1)", paddingBottom: 6 }}>
                  <code style={{ color: "var(--cyan-bright)", fontSize: 12 }}>{k}</code>
                  <span className="tiny muted">{v}</span>
                </div>
              ))}
            </div>
          </Panel>
```

- [ ] **Step 2: Update Python tool matrix with guide links**

Replace the Python panel similarly:

```jsx
          <Panel title="Python / FastAPI" right={<span className="pill cyan" style={{ cursor: "pointer", fontSize: 10 }} onClick={() => { window.location.hash = "tools-python"; window.scrollTo({ top: 0, behavior: "smooth" }); }}>→ 상세 가이드</span>}>
```

- [ ] **Step 3: Update Flutter tool matrix with guide links**

Replace the Flutter panel similarly:

```jsx
          <Panel title="Flutter" right={<span className="pill cyan" style={{ cursor: "pointer", fontSize: 10 }} onClick={() => { window.location.hash = "tools-flutter"; window.scrollTo({ top: 0, behavior: "smooth" }); }}>→ 상세 가이드</span>}>
```

- [ ] **Step 4: Verify in browser**

Open Strategy tab. Each tool panel should show a `→ 상세 가이드` pill in the header. Clicking it navigates to the corresponding tool tab.

- [ ] **Step 5: Commit**

```bash
git add js/app.jsx
git commit -m "feat: add guide-link pills to Strategy tab tool matrix panels"
```

---

### Task 7: Final verification

- [ ] **Step 1: Navigate all 11 tabs**

Open browser, visit each tab (00-10). Check console for errors. All tabs should load without JS errors.

- [ ] **Step 2: Test WireMock Stub Builder**

On tab 08, scroll to SIM 20. Test:
- Default state generates valid JSON + Java code
- Each preset (Stripe, FCM, OAuth) populates correct values
- Copy buttons work
- Changing method/URL/status/body updates both outputs

- [ ] **Step 3: Test cross-references**

Click a `→ Python: respx` pill on the Java tab. Should navigate to `#tools-python`.
Click `→ Java: WireMock` on the Python tab. Should navigate to `#tools-java`.
Click `→ 상세 가이드` on Strategy tab. Should navigate to the correct tool tab.

- [ ] **Step 4: Test ToolDocCTA**

On tabs 08-10, the CTA should link to the tech stack wiki (external GitHub link), not the local doc modal.

- [ ] **Step 5: Commit if fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during tool guide tabs verification"
```
