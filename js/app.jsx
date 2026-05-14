// ===== Main App =====

function Brand() {
  return (
    <a className="brand" href="#strategy" onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent("synapse:tab", { detail: "strategy" })); }}>
      <div className="brand-mark"><span>S</span></div>
      <div className="brand-title">
        <span className="brand-title-row">Synapse · Mocking Playground</span>
        <span className="brand-title-sub">v1.0 · 2026-05-14</span>
      </div>
    </a>
  );
}

function Topbar({ tab, setTab, onOpenDoc }) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <Brand />
        <div className="topbar-spacer" />
        <div className="topbar-links">
          <button className="topbar-link primary" onClick={onOpenDoc}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            현재 탭 원본 문서
          </button>
          <a className="topbar-link" href="https://github.com/team-project-final/synapse-data-mocking" target="_blank" rel="noopener">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Repo
          </a>
        </div>
      </div>
      <div className="topbar-inner" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <nav className="tabnav" style={{ width: "100%" }}>
          {DOCS.map(d => (
            <button key={d.id} className={"tab" + (tab === d.id ? " active" : "")} onClick={() => setTab(d.id)}>
              <span className="tab-idx">{d.idx}</span>
              <span>{d.title}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ===== Doc Open context =====
const DocOpenContext = React.createContext(() => {});

// CTA on every page
function PageDocCTA({ docIdx }) {
  const onOpenDoc = React.useContext(DocOpenContext);
  return <DocCTA doc={DOCS[docIdx]} onOpenDoc={onOpenDoc} />;
}

// ===== Hero per doc =====
function DocHero({ doc, onOpenDoc }) {
  return (
    <div className="hero">
      <span className="hero-eyebrow">DOC {doc.idx} · {doc.en}</span>
      <h1 className="hero-title">{doc.title}</h1>
      <p className="hero-subtitle">{doc.summary}</p>
      <div className="row" style={{ marginTop: 12 }}>
        {doc.tags.map(t => <Pill key={t}>{t}</Pill>)}
      </div>
    </div>
  );
}

// ===== Doc Modal =====
function DocModal({ doc, onClose }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!doc) return null;
  const src = `docs/${doc.idx}-${doc.id}.html`;
  const githubUrl = `https://github.com/team-project-final/documents/blob/main/docs/mocking/${doc.idx}-${doc.id === "strategy" ? "mocking-strategy" : doc.id === "platform" ? "platform-svc-mocking" : doc.id === "engagement" ? "engagement-svc-mocking" : doc.id === "knowledge" ? "knowledge-svc-mocking" : doc.id === "learning" ? "learning-svc-mocking" : doc.id === "frontend" ? "frontend-mocking" : doc.id === "kafka" ? "kafka-event-mocking" : "external-api-mocking"}.md`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-bar">
          <div className="modal-title">
            <div className="modal-title-row">
              <span className="sim-badge" style={{
                fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.1em", color: "var(--cyan)",
                padding: "3px 8px", background: "var(--cyan-fog)",
                border: "1px solid rgba(34,211,238,0.2)", borderRadius: 4
              }}>DOC {doc.idx}</span>
              <span>{doc.title}</span>
            </div>
            <span className="modal-title-sub">{doc.en} · 원본 문서 HTML 변환본</span>
          </div>
          <div className="modal-actions">
            <a className="btn" href={githubUrl} target="_blank" rel="noopener">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              GitHub
            </a>
            <a className="btn" href={src} target="_blank" rel="noopener" title="새 창에서 열기">↗</a>
            <button className="modal-close" onClick={onClose} aria-label="닫기">✕</button>
          </div>
        </div>
        <div className="modal-iframe-wrap">
          <div className={"modal-loading" + (loaded ? " hidden" : "")}>문서 로딩 중…</div>
          <iframe className="modal-iframe" src={src} onLoad={() => setLoaded(true)} title={doc.title} />
        </div>
      </div>
    </div>
  );
}

// CTA on every page
function DocCTA({ doc, onOpenDoc }) {
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
        <div className="doc-cta-title">원본 문서 — {doc.idx}. {doc.title}</div>
        <div className="doc-cta-sub">아래는 핵심 요약 + 시뮬레이터. 정의서 원문 전체를 보려면 →</div>
      </div>
      <button className="btn btn-primary doc-cta-btn" onClick={() => onOpenDoc(doc)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        원본 문서 보기
      </button>
    </div>
  );
}

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

Object.assign(window, { ToolDocCTA });

// ====================================================
// PAGE: STRATEGY
// ====================================================
function PageStrategy() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[0]} />
      <PageDocCTA docIdx={0} />

      <Section num="1" title="원칙: 실제에 가깝게, 외부만 격리한다" sub="테스트 피라미드 내 위치와 격리 기준">
        <div className="prose prose-narrow">
          <p>모든 테스트는 4-레이어 피라미드 안에 배치된다. <strong>실제 인프라(DB/Redis/ES)는 Testcontainers</strong>를 우선 사용하고, <strong>외부 API(Stripe/OAuth/FCM/OpenAI)는 WireMock으로 항상 격리</strong>한다. 서비스 간 통신은 <strong>Spring Cloud Contract</strong>로 계약을 검증하고, Kafka는 <strong>EmbeddedKafka</strong>로 실제 직렬화(Avro)를 검증한다.</p>
        </div>
        <div style={{ marginTop: 24 }}>
          <Panel title="테스트 피라미드 탐색" badge="SIM 01" sub="레이어 클릭 → 도구와 원칙 보기">
            <TestPyramidSimulator />
          </Panel>
        </div>
      </Section>

      <Section num="2" title="도구 스택 매트릭스" sub="언어별 / 레이어별 도구">
        <div className="grid-3">
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
          <Panel title="Python / FastAPI" right={<span className="pill cyan" style={{ cursor: "pointer", fontSize: 10 }} onClick={() => { window.location.hash = "tools-python"; window.scrollTo({ top: 0, behavior: "smooth" }); }}>→ 상세 가이드</span>}>
            <div className="col" style={{ gap: 8 }}>
              {[
                ["pytest + httpx", "테스트 + AsyncClient"],
                ["respx", "외부 API mock"],
                ["fakeredis", "Redis 시맨틱 캐시"],
                ["testcontainers", "PostgreSQL+pgvector"],
                ["unittest.mock", "내부 mock"]
              ].map(([k, v]) => (
                <div key={k} className="row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--line-1)", paddingBottom: 6 }}>
                  <code style={{ color: "var(--cyan-bright)", fontSize: 12 }}>{k}</code>
                  <span className="tiny muted">{v}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Flutter" right={<span className="pill cyan" style={{ cursor: "pointer", fontSize: 10 }} onClick={() => { window.location.hash = "tools-flutter"; window.scrollTo({ top: 0, behavior: "smooth" }); }}>→ 상세 가이드</span>}>
            <div className="col" style={{ gap: 8 }}>
              {[
                ["Mockito", "Repository/Provider mock"],
                ["dio mock adapter", "HTTP 호출 가로채기"],
                ["build_runner", "code-gen"],
                ["mocktail", "code-gen 불필요 대안"]
              ].map(([k, v]) => (
                <div key={k} className="row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--line-1)", paddingBottom: 6 }}>
                  <code style={{ color: "var(--cyan-bright)", fontSize: 12 }}>{k}</code>
                  <span className="tiny muted">{v}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Section>

      <Section num="3" title="공통 규약" sub="시드 ID + 시간 고정 + 응답 래퍼">
        <div className="grid-2">
          <Panel title="시드 ID 카탈로그" badge="SIM 02" sub="검색 가능한 18개 고정 UUID">
            <SeedIdBrowser />
          </Panel>
          <Panel title="시간 고정 패턴" badge="SIM 03" sub="언어별 코드">
            <TimeFixturePlayground />
            <div style={{ marginTop: 20 }}>
              <h3 className="subsec">공통 응답 래퍼</h3>
              <ResponseWrapperPreview />
            </div>
          </Panel>
        </div>
      </Section>

      <Section num="4" title="환경별 적용" sub="로컬 / CI / Contract">
        <Panel title="docker-compose.mock.yml — 로컬 개발">
          <Code>{`services:
  wiremock:
    image: wiremock/wiremock:3.5.4
    ports: ["8090:8080"]
    volumes: ["./wiremock:/home/wiremock"]
    command: --verbose --global-response-templating

  postgres:
    image: pgvector/pgvector:pg16
    environment: { POSTGRES_DB: synapse_test, POSTGRES_USER: synapse, POSTGRES_PASSWORD: test_password }

  redis: { image: redis:7-alpine }
  elasticsearch: { image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0 }
  kafka: { image: confluentinc/cp-kafka:7.6.1 }
  schema-registry: { image: confluentinc/cp-schema-registry:7.6.1 }`}</Code>
          <div className="row" style={{ marginTop: 12 }}>
            <code>docker compose -f docker-compose.mock.yml up -d</code>
          </div>
        </Panel>
      </Section>
    </div>
  );
}

// ====================================================
// PAGE: PLATFORM
// ====================================================
function PagePlatform() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[1]} />
      <PageDocCTA docIdx={1} />

      <Section num="1" title="서비스 의존성 맵" sub="auth / audit / billing / notification">
        <div className="grid-2">
          <Panel title="모듈 4종">
            <div className="col" style={{ gap: 8 }}>
              {[
                ["auth", "OAuth 4종 (Google/GitHub/Apple/MS) + JWT + MFA TOTP. Producer: user.registered."],
                ["audit", "7개 토픽 Consumer. 멱등성 검증 (processed_events)."],
                ["billing", "Stripe Checkout + Webhooks + Usage Counter. Producer: billing.subscription.changed."],
                ["notification", "8개 토픽 Consumer + FCM + SES. Quiet Hours 룰 적용."]
              ].map(([k, v]) => (
                <div key={k} className="card card-tight">
                  <code style={{ color: "var(--cyan-bright)", fontSize: 12, fontWeight: 600 }}>{k}</code>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="외부 의존성 (Mock 대상)">
            <div className="kv" style={{ fontSize: 12 }}>
              <dt>OAuth ×4</dt><dd>Google · GitHub · Apple · Microsoft</dd>
              <dt>Stripe</dt><dd>Checkout, Customer Portal, Invoices, Webhooks ×3</dd>
              <dt>FCM</dt><dd>v1 Messages API</dd>
              <dt>AWS SES</dt><dd>SendEmail</dd>
              <dt>Kafka</dt><dd>user.registered (Producer), 7개 토픽 (Audit Consumer), 8개 토픽 (Notification Consumer)</dd>
              <dt>Infra</dt><dd>PostgreSQL · Redis (refresh token + 미읽음 카운트)</dd>
            </div>
          </Panel>
        </div>
      </Section>

      <Section num="2" title="auth — JWT 테스트 토큰" sub="JwtTestFactory">
        <Panel title="JWT 빌더" badge="SIM 04" sub="고정 사용자 / 만료 시나리오">
          <JwtBuilder />
        </Panel>
      </Section>

      <Section num="3" title="billing — Stripe Webhook 시뮬레이터" sub="Webhook 이벤트 → 구독 상태 머신">
        <Panel title="Webhook → State Machine" badge="SIM 05" sub="webhook 발사 → DB 상태 변화 → Kafka 발행">
          <StripeWebhookSimulator />
        </Panel>
        <div className="prose tiny" style={{ marginTop: 12 }}>
          <p>실제 구현은 <code>Stripe-Signature</code> 헤더를 HMAC-SHA256으로 검증한다. <code>StripeWebhookTestHelper.generateSignature(payload, timestamp)</code> 로 fixture 서명 생성.</p>
        </div>
      </Section>

      <Section num="4" title="notification — Quiet Hours" sub="시간 + 사용자 설정에 따른 발송/큐잉 분기">
        <Panel title="Quiet Hours 체커" badge="SIM 06" sub="시간 슬라이더 + 시작/종료 + 사용자 설정">
          <QuietHoursChecker />
        </Panel>
      </Section>

      <Section num="5" title="audit — 멱등성" sub="processed_events 테이블로 중복 방지">
        <Panel title="Idempotency 검증 패턴">
          <Code>{`@Test
void consumeAuditEvent_duplicateId_shouldSkipSecondInsert() {
  // given — 동일 이벤트 2회 발행
  kafkaTestHelper.publishAndWait("audit.event", "key-1", fixture, ...);
  kafkaTestHelper.publishAndWait("audit.event", "key-1", fixture, ...);

  // then — audit_logs에 1건만, processed_events에도 1건
  Long count = jdbcTemplate.queryForObject(
    "SELECT COUNT(*) FROM audit_logs WHERE event_id = ?",
    Long.class, "evt-...000000701");
  assertThat(count).isEqualTo(1);
}`}</Code>
        </Panel>
      </Section>
    </div>
  );
}

// ====================================================
// PAGE: ENGAGEMENT
// ====================================================
function PageEngagement() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[2]} />
      <PageDocCTA docIdx={2} />

      <Section num="1" title="community — 그룹/공유 + Spring Cloud Contract" sub="learning-svc의 /internal/decks/copy Consumer">
        <Panel title="contract 정의 (Consumer Side)">
          <Code>{`@AutoConfigureStubRunner(
  ids = "com.synapse:learning-card:+:stubs:8091",
  stubsMode = StubRunnerProperties.StubsMode.LOCAL
)
@SpringBootTest
class CommunityDeckCopyContractTest {
  @Autowired DeckCopyClient deckCopyClient;

  @Test
  void copyDeck_shouldFollowContract() {
    DeckCopyRequest request = new DeckCopyRequest(
      UUID.fromString("deck-...000000002"),
      UUID.fromString("user-...000000002"),
      UUID.fromString("tenant-...000000001"),
      null
    );

    DeckCopyResponse response = deckCopyClient.copyDeck(request);

    assertThat(response.copiedDeckId()).isNotNull();
    assertThat(response.cardCount()).isPositive();
  }
}`}</Code>
          <div className="tiny muted" style={{ marginTop: 12 }}>
            community는 Consumer, learning-card는 Provider. 같은 contract 정의를 공유하므로 양쪽이 합의된 계약만 어기지 않으면 통합 테스트 없이도 안전하게 변경 가능.
          </div>
        </Panel>
      </Section>

      <Section num="2" title="gamification — SM-2 알고리즘" sub="rating 0-5 → EF + interval + due_date">
        <Panel title="SM-2 SRS 시뮬레이터" badge="SIM 07" sub="평가 누적 → 카드 스케줄 변화 추적">
          <SM2Simulator />
        </Panel>
        <div className="prose tiny" style={{ marginTop: 12 }}>
          <p>알고리즘은 <code>SM-2 (SuperMemo 2)</code>의 표준 변형. rating 3 이상이면 정답으로 간주, interval 증가. rating &lt; 3은 interval을 1로 리셋. EF는 최소 1.3 보장.</p>
        </div>
      </Section>

      <Section num="3" title="XP · 레벨 · 배지 시스템" sub="Kafka 이벤트 → gamification XP 적립 → 레벨업/배지 수여 체인">
        <Panel title="XP 퀘스트" badge="SIM 08" sub="액션 → XP 누적 → 레벨업 + 배지 수여 자동 체크">
          <XPSimulator />
        </Panel>
      </Section>

      <Section num="4" title="리더보드 — Redis Sorted Set" sub="ZADD/ZREVRANGE · 주간 cron 매주 월요일 00:00">
        <Panel title="리더보드 프리뷰" badge="SIM 09">
          <LeaderboardPreview />
        </Panel>
      </Section>
    </div>
  );
}

// ====================================================
// PAGE: KNOWLEDGE
// ====================================================
function PageKnowledge() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[3]} />
      <PageDocCTA docIdx={3} />

      <Section num="1" title="note — 위키링크 파싱" sub="[[대상 노트]] 문법 → note_links 테이블 + note.created 이벤트">
        <Panel title="위키링크 파서" badge="SIM 10" sub="라이브 파싱 + 추출 결과 + 이벤트 payload">
          <WikilinkParser />
        </Panel>
        <div className="prose tiny" style={{ marginTop: 12 }}>
          <p>코드 블록(```...```) 및 인라인 코드(`...`) 내부의 위키링크는 무시한다. 중첩 시 가장 안쪽만 인식 (<code>[[외부[[내부]]]]</code> → <code>내부</code>). 빈 링크(<code>[[]]</code>)도 무시.</p>
        </div>
      </Section>

      <Section num="2" title="graph — 지식 그래프 시각화" sub="D3 노드/엣지 데이터 + N-hop 이웃">
        <Panel title="지식 그래프 탐색기" badge="SIM 11" sub="노드 클릭 → N-hop 이웃 강조 + /graph/neighbors 응답 미리보기">
          <KnowledgeGraph />
        </Panel>
      </Section>

      <Section num="3" title="chunking — 청킹 + 임베딩" sub="긴 노트 → 청크 분할 → /internal/embeddings → pgvector(1536)">
        <Panel title="청킹 시각화" badge="SIM 12" sub="chunk_size + overlap 조절 → 청크 시각화">
          <ChunkingVisualizer />
        </Panel>
      </Section>

      <Section num="4" title="Elasticsearch — Korean Nori Analyzer" sub="검색 인덱스 매핑 + nori 분석기">
        <Panel title="ES 인덱스 매핑">
          <Code>{`{
  "settings": {
    "analysis": {
      "analyzer": {
        "korean": {
          "type": "custom",
          "tokenizer": "nori_tokenizer",
          "filter": ["nori_readingform", "lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "noteId":    { "type": "keyword" },
      "tenantId":  { "type": "keyword" },
      "title":     { "type": "text", "analyzer": "korean",
                     "fields": { "keyword": { "type": "keyword" } } },
      "content":   { "type": "text", "analyzer": "korean" },
      "tags":      { "type": "keyword" },
      "createdAt": { "type": "date" }
    }
  }
}`}</Code>
        </Panel>
      </Section>
    </div>
  );
}

// ====================================================
// PAGE: LEARNING
// ====================================================
function PageLearning() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[4]} />
      <PageDocCTA docIdx={4} />

      <Section num="1" title="learning-card — SM-2 SRS 알고리즘 fixture" sub="(SM-2 시뮬레이터는 §02 Engagement 탭에서 → XP/Level 흐름과 함께 확인)">
        <Panel title="SM-2 검증 fixture">
          <div className="tiny muted" style={{ marginBottom: 12 }}>
            <code>@ParameterizedTest @CsvSource(...)</code> 패턴 — rating × oldEF × oldInterval → expectedEF + expectedInterval
          </div>
          <table className="table">
            <thead><tr><th>rating</th><th>이전 EF</th><th>이전 interval</th><th>기대 새 EF</th><th>기대 새 interval</th><th>기대 due_date</th></tr></thead>
            <tbody>
              {[
                [0, 2.5, 7, 1.7, 1, "2026-01-16"],
                [1, 2.5, 7, 1.96, 1, "2026-01-16"],
                [2, 2.5, 7, 2.36, 1, "2026-01-16"],
                [3, 2.5, 7, 2.36, 7, "2026-01-22"],
                [4, 2.5, 7, 2.5, 18, "2026-02-02"],
                [5, 2.5, 7, 2.6, 18, "2026-02-02"]
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => <td key={j} className={j === 0 ? "" : "mono"}>{j === 0 ? <Pill tone={row[0] < 3 ? "red" : row[0] < 4 ? "amber" : "green"}>{c}</Pill> : c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </Section>

      <Section num="2" title="learning-ai — 시맨틱 캐시 (Redis + fakeredis)" sub="코사인 유사도 ≥ threshold → 캐시 적중, 그렇지 않으면 Claude 호출">
        <Panel title="시맨틱 캐시 시뮬레이터" badge="SIM 13" sub="쿼리 → 코사인 유사도 → hit/miss 결정 → 캐시 학습">
          <SemanticCacheSimulator />
        </Panel>
      </Section>

      <Section num="3" title="learning-ai — 하이브리드 검색 (RRF)" sub="pgvector 시맨틱 + Elasticsearch BM25 → Reciprocal Rank Fusion">
        <Panel title="RRF 결합 시뮬레이터" badge="SIM 14" sub="k 값 변경 → 가중치 변화 관찰">
          <HybridSearchRRF />
        </Panel>
      </Section>

      <Section num="4" title="learning-ai — AI 카드 생성" sub="Claude API (anthropic) → 노트 → 카드 N장">
        <Panel title="AI 카드 생성 mock" badge="SIM 15" sub="respx로 Claude API 응답을 fixture로 mocking">
          <AICardGeneratorMock />
        </Panel>
      </Section>

      <Section num="5" title="conftest.py — Python 베이스 설정">
        <Panel title="pytest 픽스처">
          <Code>{`import pytest, fakeredis
from pathlib import Path
from unittest.mock import MagicMock

FIXTURE_DIR = Path(__file__).parent / "fixtures"

@pytest.fixture
def redis_client():
    return fakeredis.FakeRedis(decode_responses=True)

@pytest.fixture
def kafka_producer_mock():
    producer = MagicMock()
    producer.sent = []
    def mock_produce(topic, key=None, value=None, **kwargs):
        producer.sent.append({"topic": topic, "key": key, "value": value})
    producer.produce = mock_produce
    return producer`}</Code>
        </Panel>
      </Section>
    </div>
  );
}

// ====================================================
// PAGE: FRONTEND
// ====================================================
function PageFrontend() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[5]} />
      <PageDocCTA docIdx={5} />

      <Section num="1" title="아키텍처: Mock 적용 레벨" sub="UI · Riverpod · Repository · Data Source">
        <Panel title="레이어 + Mock 매핑">
          <MockArchitecture />
        </Panel>
      </Section>

      <Section num="2" title="Mock 응답 카탈로그" sub={`${MOCK_RESPONSES.length}개 응답 fixture · MockDioAdapter 등록 코드 자동 생성`}>
        <Panel title="Mock Response Browser" badge="SIM 16" sub="필터/검색 + 응답 body + Dart 코드 미리보기">
          <MockResponseBrowser />
        </Panel>
      </Section>

      <Section num="3" title="MockDioAdapter 구현" sub="dio HttpClientAdapter 가로채기">
        <Panel title="MockDioAdapter">
          <Code>{`class MockDioAdapter implements HttpClientAdapter {
  final Map<String, MockResponse> _mappings = {};

  void onGet(String path, MockResponse response) =>
      _mappings['GET:\$path'] = response;
  void onPost(String path, MockResponse response) =>
      _mappings['POST:\$path'] = response;
  // ... onPatch, onDelete, onPut

  @override
  Future<ResponseBody> fetch(RequestOptions options, ...) async {
    final key = '\${options.method}:\${options.path}';
    final response = _mappings[key] ?? _findPatternMatch(options);

    if (response == null) {
      throw DioException(requestOptions: options,
        error: 'No mock mapping for \$key',
        type: DioExceptionType.unknown);
    }

    if (response.delay != null) await Future.delayed(response.delay!);

    return ResponseBody.fromString(
      jsonEncode(response.data),
      response.statusCode,
      headers: {'content-type': ['application/json']},
    );
  }
}`}</Code>
        </Panel>
      </Section>

      <Section num="4" title="Riverpod Provider Override" sub="테스트에서 Repository를 mock으로 주입">
        <Panel title="provider_overrides.dart">
          <Code>{`List<Override> createMockOverrides({
  MockAuthRepository? authRepo,
  MockNoteRepository? noteRepo,
  MockCardRepository? cardRepo,
}) {
  return [
    if (authRepo != null) authRepositoryProvider.overrideWithValue(authRepo),
    if (noteRepo != null) noteRepositoryProvider.overrideWithValue(noteRepo),
    if (cardRepo != null) cardRepositoryProvider.overrideWithValue(cardRepo),
  ];
}

// in test:
await tester.pumpWidget(
  ProviderScope(
    overrides: createMockOverrides(cardRepo: mockCardRepo),
    child: const MaterialApp(home: ReviewScreen()),
  ),
);`}</Code>
        </Panel>
      </Section>
    </div>
  );
}

// ====================================================
// PAGE: KAFKA
// ====================================================
function PageKafka() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[6]} />
      <PageDocCTA docIdx={6} />

      <Section num="1" title="CloudEvents 1.0 래퍼" sub="모든 18개 토픽 공통 포맷 · Avro 직렬화 · 키 = tenantId">
        <Panel title="기본 템플릿">
          <Code>{`{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000001",
  "source": "synapse/{service-name}",
  "type": "{topic.name}",
  "subject": "{resource-type}/{resource-id}",
  "time": "2026-01-15T10:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": { /* 토픽별 페이로드 */ }
}`}</Code>
        </Panel>
      </Section>

      <Section num="2" title="토픽 카탈로그" sub="18개 토픽 · Producer / Consumer 관계">
        <Panel title="전체 토픽 맵">
          <TopicMap />
        </Panel>
      </Section>

      <Section num="3" title="CloudEvents Builder" sub="토픽 선택 → 실제 fixture 즉시 생성">
        <Panel title="이벤트 빌더" badge="SIM 17" sub="6개 대표 토픽 · 복사 가능">
          <CloudEventsBuilder />
        </Panel>
      </Section>

      <Section num="4" title="이벤트 흐름 시뮬레이터" sub="실제 시나리오에서 토픽 발행 순서 + 소비자 반응">
        <Panel title="Event-Driven Flow" badge="SIM 18" sub="시작 → 단계별 토픽 발행 → Consumer 트리거">
          <EventFlowSimulator />
        </Panel>
      </Section>

      <Section num="5" title="EmbeddedKafka 검증 패턴" sub="실제 broker 없이 직렬화 + Avro 검증">
        <Panel title="Producer 검증">
          <Code>{`@Test
void createNote_shouldPublishNoteCreatedEvent() {
  String requestBody = """
    {"title": "새 노트", "content": "# 내용\\n\\n[[다른노트]] 참조",
     "tags": ["테스트"]}
    """;

  mockMvc.perform(post("/notes")
      .header("Authorization", "Bearer " + JwtTestFactory.USER1_TOKEN)
      .contentType(MediaType.APPLICATION_JSON)
      .content(requestBody))
    .andExpect(status().isCreated());

  List<ConsumerRecord<String, Object>> records =
    kafkaTestHelper.consumeMessages("note.created", 1, Duration.ofSeconds(5));
  assertThat(records).hasSize(1);
}`}</Code>
        </Panel>
      </Section>
    </div>
  );
}

// ====================================================
// PAGE: EXTERNAL APIS
// ====================================================
function PageExternal() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[7]} />
      <PageDocCTA docIdx={7} />

      <Section num="1" title="외부 API 매트릭스" sub="10개 외부 API · 30+ 시나리오 · 도구는 WireMock(Java) / respx(Python)">
        <Panel title="외부 API 카탈로그">
          <ExternalApiMatrix />
        </Panel>
      </Section>

      <Section num="2" title="OAuth 2.0 흐름 시뮬레이터" sub="4종 Provider · success / error 시나리오">
        <Panel title="OAuth 인증 플로우" badge="SIM 19" sub="step by step + WireMock 응답 미리보기">
          <OAuthFlowSimulator />
        </Panel>
      </Section>

      <Section num="3" title="WireMock Spring Boot 통합" sub="@AutoConfigureWireMock + @DynamicPropertySource">
        <Panel title="공통 베이스 클래스">
          <Code>{`@SpringBootTest
@AutoConfigureWireMock(port = 0)
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
      </Section>

      <Section num="4" title="respx Python 통합" sub="httpx 기반 외부 API mock">
        <Panel title="OpenAI / Claude mock">
          <Code>{`import respx, httpx

@respx.mock
async def test_generate_embedding():
    respx.post("https://api.openai.com/v1/embeddings").mock(
        return_value=httpx.Response(200, json={
            "data": [{"embedding": [0.0023, -0.0121, 0.0156, ...]}],
            "model": "text-embedding-3-small",
            "usage": {"prompt_tokens": 15, "total_tokens": 15}
        })
    )

    service = EmbeddingService()
    result = await service.generate("머신러닝에서 과적합이란?")

    assert len(result) == 1536
    assert respx.calls.call_count == 1`}</Code>
        </Panel>
      </Section>
    </div>
  );
}

// ====================================================
// APP
// ====================================================
function App() {
  const [tab, setTabState] = useState(() => {
    const hash = window.location.hash.slice(1);
    return DOCS.find(d => d.id === hash) ? hash : "strategy";
  });
  const [openDoc, setOpenDoc] = useState(null);

  const setTab = (newTab) => {
    setTabState(newTab);
    window.location.hash = newTab;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handler = (e) => setTab(e.detail);
    window.addEventListener("synapse:tab", handler);
    const hashChange = () => {
      const hash = window.location.hash.slice(1);
      if (DOCS.find(d => d.id === hash)) setTabState(hash);
    };
    window.addEventListener("hashchange", hashChange);
    return () => {
      window.removeEventListener("synapse:tab", handler);
      window.removeEventListener("hashchange", hashChange);
    };
  }, []);

  return (
    <DocOpenContext.Provider value={setOpenDoc}>
      <div className="page-root">
        <Topbar tab={tab} setTab={setTab} onOpenDoc={() => setOpenDoc(DOCS.find(d => d.id === tab))} />
        <div className="app">
          <div className="page">
            {tab === "strategy" && <PageStrategy />}
            {tab === "platform" && <PagePlatform />}
            {tab === "engagement" && <PageEngagement />}
            {tab === "knowledge" && <PageKnowledge />}
            {tab === "learning" && <PageLearning />}
            {tab === "frontend" && <PageFrontend />}
            {tab === "kafka" && <PageKafka />}
            {tab === "external" && <PageExternal />}
            {tab === "tools-java" && <PageToolsJava />}
            {tab === "tools-python" && <PageToolsPython />}
            {tab === "tools-flutter" && <PageToolsFlutter />}
          </div>
          <footer className="footer">
            <div>
              <strong style={{ color: "var(--text-1)" }}>Synapse</strong> · 통합 학습-지식 그래프 SaaS · v1.0 · 2026-05-14
            </div>
            <div className="row">
              <a href="https://github.com/team-project-final/documents/tree/main/docs/mocking" target="_blank" rel="noopener">📄 문서 원본</a>
              <a href="https://github.com/team-project-final/synapse-data-mocking" target="_blank" rel="noopener">⚙️ synapse-data-mocking</a>
            </div>
          </footer>
        </div>
        {openDoc ? <DocModal doc={openDoc} onClose={() => setOpenDoc(null)} /> : null}
      </div>
    </DocOpenContext.Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
