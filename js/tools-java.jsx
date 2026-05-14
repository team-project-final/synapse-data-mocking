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
