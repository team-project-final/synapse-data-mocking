// ===== Doc 00: Mocking Strategy =====

const PYRAMID = [
  {
    name: "Unit",
    tools: ["Mockito (Java/Dart)", "unittest.mock (Python)"],
    target: "같은 모듈 내 의존성",
    speed: "< 100ms",
    color: "violet",
    width: 100
  },
  {
    name: "Service Integration",
    tools: ["WireMock", "EmbeddedKafka"],
    target: "외부 서비스 API, Kafka, 외부 API",
    speed: "< 5s",
    color: "cyan",
    width: 78
  },
  {
    name: "Infra Integration",
    tools: ["Testcontainers (PostgreSQL/Redis/ES/pgvector)"],
    target: "DB, Redis, Elasticsearch",
    speed: "< 30s",
    color: "amber",
    width: 60
  },
  {
    name: "Contract",
    tools: ["Spring Cloud Contract"],
    target: "서비스 간 API 계약",
    speed: "< 10s",
    color: "pink",
    width: 42
  },
  {
    name: "E2E",
    tools: ["(없음 — 실제 staging 환경)"],
    target: "전체 시스템",
    speed: "< 60s",
    color: "green",
    width: 28
  }
];

function TestPyramidSimulator() {
  const [active, setActive] = useState(1);
  const layer = PYRAMID[active];
  return (
    <div className="pyramid-wrap">
      <div>
        <div className="label" style={{ marginBottom: 12 }}>테스트 피라미드</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          {PYRAMID.map((l, i) => (
            <div key={l.name}
              className={"pyramid-layer" + (i === active ? " active" : "")}
              style={{ width: l.width + "%", marginLeft: ((100 - l.width) / 2) + "%" }}
              onClick={() => setActive(i)}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{l.name}</span>
              <Pill tone={l.color}>{l.speed}</Pill>
            </div>
          ))}
        </div>
        <div className="tiny muted" style={{ marginTop: 16, textAlign: "center" }}>
          위로 갈수록 빠르고 격리됨 · 아래로 갈수록 실제에 가까움
        </div>
      </div>
      <div>
        <div className="label" style={{ marginBottom: 12 }}>{layer.name} 레벨 상세</div>
        <div className="card">
          <dl className="kv" style={{ marginBottom: 16 }}>
            <dt>대상</dt><dd>{layer.target}</dd>
            <dt>속도</dt><dd><Pill tone={layer.color}>{layer.speed}</Pill></dd>
            <dt>도구</dt><dd style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {layer.tools.map(t => <Pill key={t}>{t}</Pill>)}
            </dd>
          </dl>
          <div style={{ background: "var(--bg-2)", padding: 12, borderRadius: 8, border: "1px solid var(--line-1)" }}>
            <div className="tiny muted">핵심 원칙</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {active === 0 && "내부 의존성만 mock한다. Repository/Service 내부 로직 테스트."}
              {active === 1 && "외부 API와 Kafka는 격리하되, Avro 직렬화는 실제로 검증한다."}
              {active === 2 && "Mock보다 Testcontainers를 우선 — DB/Redis/ES는 항상 실제 인스턴스."}
              {active === 3 && "Producer는 contract을 발행하고, Consumer는 stub으로 검증한다."}
              {active === 4 && "Mock 없음. 실제 staging 환경에서 critical path만 검증."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Seed ID Browser
function SeedIdBrowser() {
  const [filter, setFilter] = useState("");
  const filtered = SEED_IDS.filter(s =>
    !filter || s.type.toLowerCase().includes(filter.toLowerCase()) || s.note.toLowerCase().includes(filter.toLowerCase())
  );
  return (
    <div>
      <Field label="검색 (User, Note, 머신러닝, …)">
        <input className="input" value={filter} onChange={e => setFilter(e.target.value)} placeholder="entity 또는 설명으로 필터" />
      </Field>
      <div style={{ marginTop: 16, maxHeight: 400, overflowY: "auto", border: "1px solid var(--line-1)", borderRadius: 8 }}>
        <table className="table">
          <thead>
            <tr><th>Type</th><th>Seed UUID</th><th>설명</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const full = s.id.replace("...", "00000000-0000-0000-0000-").replace(/000000\d+/, m => "0".repeat(12 - m.length) + m.slice(1));
              // Simpler: just give full
              const fullId = s.id.replace("...", "00000000-0000-0000-0000-");
              return (
                <tr key={i}>
                  <td><Pill tone="cyan">{s.type}</Pill></td>
                  <td><code>{fullId}</code></td>
                  <td className="muted tiny">{s.note}</td>
                  <td><CopyBtn text={fullId} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Time fixture playground
const TIME_SAMPLES = {
  java: `Clock fixedClock = Clock.fixed(
    Instant.parse("2026-01-15T10:00:00Z"),
    ZoneId.of("UTC")
);
// 서비스에 Clock 주입`,
  python: `import freezegun

@freezegun.freeze_time("2026-01-15T10:00:00Z")
def test_something():
    ...`,
  dart: `withClock(
  Clock.fixed(DateTime.utc(2026, 1, 15, 10, 0, 0)),
  () {
    // 테스트 코드
  },
);`
};

function TimeFixturePlayground() {
  const [lang, setLang] = useState("java");
  const langs = [
    { id: "java", label: "Java" },
    { id: "python", label: "Python" },
    { id: "dart", label: "Dart" }
  ];
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        {langs.map(l => (
          <button key={l.id} className={"btn" + (lang === l.id ? " btn-primary" : "")} onClick={() => setLang(l.id)}>
            {l.label}
          </button>
        ))}
      </div>
      <Code lang={lang}>{TIME_SAMPLES[lang]}</Code>
      <div className="tiny muted" style={{ marginTop: 12 }}>
        기준 시각: <code>2026-01-15T10:00:00Z</code> · 오늘 due: <code>2026-01-15</code> · 어제 due (overdue): <code>2026-01-14</code> · 7일 스트릭 시작: <code>2026-01-08</code>
      </div>
    </div>
  );
}

// Common response wrapper diff
function ResponseWrapperPreview() {
  const [success, setSuccess] = useState(true);
  const successBody = {
    success: true,
    data: { userId: "user-...001", email: "user1@example.com" },
    meta: { timestamp: "2026-01-15T10:00:00Z", requestId: "req-...001" }
  };
  const errorBody = {
    success: false,
    error: { code: "VALIDATION_ERROR", message: "입력값이 유효하지 않습니다.", details: [{ field: "email", message: "올바른 이메일 형식이 아닙니다." }] },
    meta: { timestamp: "2026-01-15T10:00:00Z", requestId: "req-...001" }
  };
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className={"btn" + (success ? " btn-primary" : "")} onClick={() => setSuccess(true)}>Success 200/201</button>
        <button className={"btn" + (!success ? " btn-primary" : "")} onClick={() => setSuccess(false)}>Error 4xx/5xx</button>
      </div>
      <JsonView data={success ? successBody : errorBody} max={50} />
    </div>
  );
}

Object.assign(window, { TestPyramidSimulator, SeedIdBrowser, TimeFixturePlayground, ResponseWrapperPreview });
