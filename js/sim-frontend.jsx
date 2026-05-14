// ===== Doc 05: Frontend (Flutter) =====

// MockInterceptor playground / Mock Response Browser
function MockResponseBrowser() {
  const [filter, setFilter] = useState("");
  const [svcFilter, setSvcFilter] = useState("all");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const filtered = MOCK_RESPONSES.filter(r => {
    if (svcFilter !== "all" && r.svc !== svcFilter) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return r.path.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.mod.toLowerCase().includes(q);
  });

  const selected = filtered[selectedIdx] || filtered[0];

  // Reset index when filter changes
  useEffect(() => { setSelectedIdx(0); }, [filter, svcFilter]);

  const services = ["all", "Platform", "Engagement", "Knowledge", "Learning", "Common"];

  const dartCode = selected ? `// test/widgets/${selected.mod.toLowerCase()}_test.dart
final adapter = MockDioAdapter();
adapter.on${selected.method[0].toUpperCase() + selected.method.slice(1).toLowerCase()}('${selected.path}', MockResponse(
  statusCode: ${selected.code},
  data: ${JSON.stringify(selected.body, null, 2).replace(/\n/g, "\n  ")},
));` : "";

  const methodColor = {
    GET: "blue", POST: "green", PATCH: "amber", DELETE: "red", PUT: "violet", "*": ""
  };

  const statusColor = c => c < 300 ? "green" : c < 400 ? "blue" : c < 500 ? "amber" : "red";

  return (
    <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)", gap: 24 }}>
      <div>
        <Field label="검색">
          <input className="input" placeholder="path, name, module…" value={filter} onChange={e => setFilter(e.target.value)} />
        </Field>
        <div className="row" style={{ marginTop: 12, gap: 4, flexWrap: "wrap" }}>
          {services.map(s => (
            <button key={s} className={"btn" + (svcFilter === s ? " btn-primary" : "")} style={{ padding: "4px 10px", fontSize: 12 }}
              onClick={() => setSvcFilter(s)}>
              {s === "all" ? "전체" : s}
            </button>
          ))}
        </div>
        <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>{filtered.length}개 mock 응답</div>
        <div style={{ maxHeight: 520, overflowY: "auto", border: "1px solid var(--line-1)", borderRadius: 8 }}>
          {filtered.map((r, i) => (
            <button key={i}
              onClick={() => setSelectedIdx(i)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                appearance: "none",
                background: i === selectedIdx ? "var(--bg-3)" : "transparent",
                border: 0,
                borderBottom: "1px solid var(--line-1)",
                padding: "10px 12px",
                cursor: "pointer",
                color: "var(--text-1)",
                fontFamily: "inherit"
              }}>
              <div className="row" style={{ marginBottom: 4 }}>
                <Pill tone={methodColor[r.method]}>{r.method}</Pill>
                <Pill tone={statusColor(r.code)}>{r.code}</Pill>
                <span className="tiny muted" style={{ marginLeft: "auto" }}>{r.svc}/{r.mod}</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: i === selectedIdx ? "var(--cyan-bright)" : "var(--text-1)" }}>{r.path}</div>
              <div className="tiny muted">{r.name}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        {selected ? (
          <div>
            <div className="row" style={{ marginBottom: 12 }}>
              <Pill tone={methodColor[selected.method]}>{selected.method}</Pill>
              <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{selected.path}</span>
              <Pill tone={statusColor(selected.code)}>{selected.code}</Pill>
              <CopyBtn text={JSON.stringify(selected.body, null, 2)} />
            </div>
            <div className="tiny muted" style={{ marginBottom: 12 }}>{selected.name} · {selected.svc}/{selected.mod}</div>

            <div className="label" style={{ marginBottom: 6 }}>응답 body</div>
            <JsonView data={selected.body} max={36} />

            <div className="label" style={{ marginTop: 20, marginBottom: 6 }}>Dart 등록 코드 (MockDioAdapter)</div>
            <Code>{dartCode}</Code>
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: 60 }}>
            <div className="muted">매칭되는 mock 없음</div>
          </div>
        )}
      </div>
      <MockRouteBadge service="flutter-app" module="all modules"
        from="Flutter → All service APIs" fromUrl="dio HTTP client → 각 서비스 REST API"
        to="MockDioAdapter" toUrl="MockDioAdapter.onGet/onPost(path, MockResponse(...))"
        file="test/fixtures/*.json" />
    </div>
  );
}

// Architecture Layered Diagram
function MockArchitecture() {
  const layers = [
    { name: "UI Layer", sub: "Widgets + Pages", color: "var(--cyan)" },
    { name: "Riverpod Layer", sub: "State Management", color: "var(--violet)" },
    { name: "Repository Layer", sub: "API Abstraction", color: "var(--amber)" },
    { name: "Data Source", sub: "HTTP Client (dio)", color: "var(--green)" }
  ];
  const mocks = [
    { name: "MockInterceptor", sub: "dio adapter — 가로채기", at: 3, hot: "Widget Tests" },
    { name: "Mock Repository", sub: "Mockito generated", at: 2, hot: "Provider Unit Tests" },
    { name: "Fixture Factory", sub: `JSON 응답 ${MOCK_RESPONSES.length}개`, at: 4, hot: "Golden Tests" }
  ];
  return (
    <div className="grid-2">
      <div>
        <div className="label" style={{ marginBottom: 12 }}>앱 레이어</div>
        <div className="col" style={{ gap: 8 }}>
          {layers.map((l, i) => (
            <div key={i} className="card card-tight" style={{ borderLeft: `3px solid ${l.color}`, position: "relative" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{l.name}</div>
                  <div className="tiny muted">{l.sub}</div>
                </div>
                <div className="tiny mono muted">{i + 1}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="label" style={{ marginBottom: 12 }}>Mock 레벨</div>
        <div className="col" style={{ gap: 8 }}>
          {mocks.map((m, i) => (
            <div key={i} className="card card-tight" style={{ background: "var(--bg-2)" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--cyan-bright)" }}>{m.name}</div>
                  <div className="tiny muted">{m.sub}</div>
                </div>
                <Pill tone="cyan">{m.hot}</Pill>
              </div>
            </div>
          ))}
        </div>

        <div className="label" style={{ marginTop: 24, marginBottom: 8 }}>의존성 (pubspec.yaml)</div>
        <Code>{`dev_dependencies:
  flutter_test:
    sdk: flutter
  mockito: ^5.4.4
  build_runner: ^2.4.9
  dio_mock_interceptor: ^2.0.0
  mocktail: ^1.0.3`}</Code>
      </div>
    </div>
  );
}

Object.assign(window, { MockResponseBrowser, MockArchitecture });
