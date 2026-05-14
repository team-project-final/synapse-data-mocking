// ===== Doc 04: Learning AI =====

// Cosine similarity
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Pre-defined embedding vectors (16-dim, semantic-ish demo)
const EMBEDDING_BANK = {
  "과적합이란?": [0.82, 0.15, -0.21, 0.43, 0.65, 0.31, -0.12, 0.55, 0.28, 0.41, -0.09, 0.62, 0.18, 0.37, -0.05, 0.49],
  "오버피팅이 뭔가요?": [0.79, 0.18, -0.19, 0.40, 0.68, 0.33, -0.10, 0.52, 0.30, 0.39, -0.07, 0.60, 0.20, 0.35, -0.04, 0.47],
  "과적합 방지 방법": [0.74, 0.22, -0.15, 0.38, 0.61, 0.40, -0.05, 0.48, 0.34, 0.36, -0.02, 0.55, 0.24, 0.32, 0.01, 0.43],
  "정규화 기법이란?": [0.65, 0.30, -0.10, 0.33, 0.55, 0.48, 0.02, 0.42, 0.40, 0.30, 0.05, 0.50, 0.30, 0.28, 0.05, 0.38],
  "TCP와 UDP 차이": [-0.12, 0.65, 0.42, -0.08, 0.15, 0.71, 0.35, -0.05, 0.62, -0.20, 0.48, 0.18, -0.03, 0.55, 0.25, -0.10],
  "오늘 점심 메뉴": [0.05, -0.42, 0.31, -0.55, 0.18, -0.08, 0.62, 0.15, -0.31, 0.49, -0.22, 0.05, 0.40, -0.18, 0.55, 0.27]
};

function SemanticCacheSimulator() {
  const queries = Object.keys(EMBEDDING_BANK);
  const [cached, setCached] = useState([
    { query: "과적합이란?", answer: "훈련 데이터에 과도하게 맞춰져 새 데이터에 일반화 못하는 현상", embedding: EMBEDDING_BANK["과적합이란?"] }
  ]);
  const [threshold, setThreshold] = useState(0.95);
  const [activeQuery, setActiveQuery] = useState("오버피팅이 뭔가요?");
  const [log, setLog] = useState([]);
  const [errorScenario, setErrorScenario] = useState("none");
  const cacheErrorScenarios = [
    { id: "none", label: "없음 (정상)" },
    { id: "cache_error", label: "Redis 연결 실패 (캐시 우회)" }
  ];

  const queryEmbedding = EMBEDDING_BANK[activeQuery];

  const results = cached.map(c => ({
    ...c,
    similarity: cosine(queryEmbedding, c.embedding)
  })).sort((a, b) => b.similarity - a.similarity);

  const best = results[0];
  const isHit = best && best.similarity >= threshold;

  const submitQuery = () => {
    const t = new Date().toLocaleTimeString();
    const entries = [];
    entries.push({ t, tag: "→", kind: "send", msg: `Query: <code>${activeQuery}</code>` });
    entries.push({ t, tag: "EMBED", kind: "info", msg: `text-embedding-3-small (1536d) · 시뮬레이션에선 16d` });
    if (errorScenario === "cache_error") {
      entries.push({ t, tag: "ERR", kind: "err", msg: `Redis ConnectionError — 캐시 조회 불가` });
      entries.push({ t, tag: "BYPASS", kind: "info", msg: `캐시 우회 → Claude API 직접 호출 (graceful degradation)` });
      entries.push({ t, tag: "CLAUDE", kind: "send", msg: `Claude API 호출 (캐시 없이)` });
      setLog(l => [...l, ...entries]);
      return;
    }
    if (isHit) {
      entries.push({ t, tag: "HIT", kind: "ok", msg: `시맨틱 캐시 적중 · sim=${best.similarity.toFixed(4)} ≥ ${threshold} · OpenAI 호출 스킵` });
      entries.push({ t, tag: "↩", kind: "ok", msg: `캐시된 답변 반환` });
    } else {
      entries.push({ t, tag: "MISS", kind: "err", msg: `캐시 미스 · best sim=${best?.similarity.toFixed(4) || 0} < ${threshold}` });
      entries.push({ t, tag: "CLAUDE", kind: "send", msg: `Claude API 호출 (input ~500t, output ~300t)` });
      entries.push({ t, tag: "CACHE←", kind: "info", msg: `응답을 캐시에 저장` });
      // Add to cache
      setCached(c => [...c, { query: activeQuery, answer: `(Claude 응답: ${activeQuery})`, embedding: queryEmbedding }]);
    }
    setLog(l => [...l, ...entries]);
  };

  const reset = () => {
    setCached([{ query: "과적합이란?", answer: "훈련 데이터에 과도하게 맞춰져 새 데이터에 일반화 못하는 현상", embedding: EMBEDDING_BANK["과적합이란?"] }]);
    setLog([]);
  };

  return (
    <div className="grid-2">
      <div>
        <Field label="쿼리 선택">
          <select className="select" value={activeQuery} onChange={e => setActiveQuery(e.target.value)}>
            {queries.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </Field>
        <div style={{ marginTop: 12 }}>
          <Field label={`코사인 유사도 임계값: ${threshold}`}>
            <input type="range" min="0.5" max="0.99" step="0.01" value={threshold} className="slider" onChange={e => setThreshold(+e.target.value)} />
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <ErrorScenarioToggle scenarios={cacheErrorScenarios} value={errorScenario} onChange={setErrorScenario} />
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={submitQuery}>쿼리 실행</button>
          <button className="btn btn-ghost" onClick={reset}>↻ 캐시 비우기</button>
        </div>
        <div className="label" style={{ marginTop: 20, marginBottom: 8 }}>캐시 내용 ({cached.length})</div>
        <div className="col" style={{ gap: 6, maxHeight: 200, overflowY: "auto" }}>
          {results.map((c, i) => {
            const isBest = i === 0;
            const passesThreshold = c.similarity >= threshold;
            return (
              <div key={i} className="card card-tight" style={{ borderColor: passesThreshold ? "var(--cyan)" : "var(--line-1)" }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13 }}>{c.query}</span>
                  <Pill tone={passesThreshold ? "green" : c.similarity > 0.7 ? "amber" : ""}>
                    sim = {c.similarity.toFixed(4)}
                  </Pill>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div className="label" style={{ marginBottom: 8 }}>결과</div>
        <div className="card" style={{ borderColor: isHit ? "var(--green)" : "var(--amber)", marginBottom: 16 }}>
          <div className="row" style={{ alignItems: "baseline" }}>
            <span style={{ fontSize: 28 }}>{isHit ? "✓" : "✗"}</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: isHit ? "var(--green)" : "var(--amber-bright)" }}>
              {isHit ? "Cache Hit" : "Cache Miss"}
            </span>
            <span className="muted tiny" style={{ marginLeft: "auto" }}>
              best sim: <code>{best?.similarity.toFixed(4)}</code> {isHit ? "≥" : "<"} {threshold}
            </span>
          </div>
          <div className="tiny muted" style={{ marginTop: 6 }}>
            {isHit ? "OpenAI/Claude 호출 안 함. Redis 캐시에서 즉시 반환 (fakeredis 검증)" : "Claude API 호출 후 응답을 캐시에 저장. 다음 동일 쿼리는 hit."}
          </div>
        </div>
        <div className="label" style={{ marginBottom: 6 }}>이벤트 로그</div>
        <Log entries={log} height={220} />
      </div>
      <MockRouteBadge service="learning-ai" module="cache"
        from="learning-ai → Redis" fromUrl="GET/SET semantic_cache:{hash}"
        to="fakeredis" toUrl="fakeredis.FakeRedis(decode_responses=True)" />
    </div>
  );
}

// Hybrid Search (RRF)
function HybridSearchRRF() {
  const [k, setK] = useState(60);
  const semantic = [
    { id: "note-001", title: "정규화 기법", semScore: 0.95 },
    { id: "note-002", title: "과적합 방지 가이드", semScore: 0.89 },
    { id: "note-003", title: "드롭아웃 이해하기", semScore: 0.81 }
  ];
  const bm25 = [
    { id: "note-002", title: "과적합 방지 가이드", bm25Score: 12.5 },
    { id: "note-001", title: "정규화 기법", bm25Score: 10.2 },
    { id: "note-004", title: "교차 검증 실습", bm25Score: 8.1 }
  ];

  // RRF
  const fused = useMemo(() => {
    const semMap = Object.fromEntries(semantic.map((r, i) => [r.id, i + 1]));
    const bmMap = Object.fromEntries(bm25.map((r, i) => [r.id, i + 1]));
    const allIds = new Set([...semantic.map(r => r.id), ...bm25.map(r => r.id)]);
    const items = [];
    for (const id of allIds) {
      const sRank = semMap[id], bRank = bmMap[id];
      const sScore = sRank ? 1 / (k + sRank) : 0;
      const bScore = bRank ? 1 / (k + bRank) : 0;
      const meta = semantic.find(r => r.id === id) || bm25.find(r => r.id === id);
      items.push({ id, title: meta.title, sRank, bRank, sScore, bScore, total: sScore + bScore });
    }
    return items.sort((a, b) => b.total - a.total);
  }, [k]);

  return (
    <div>
      <div className="row" style={{ marginBottom: 16, justifyContent: "space-between" }}>
        <span className="tiny muted">쿼리: <code>과적합 방지 정규화</code></span>
        <div className="row">
          <span className="label" style={{ marginBottom: 0 }}>k:</span>
          {[10, 30, 60, 100].map(v => (
            <button key={v} className={"btn" + (k === v ? " btn-primary" : "")} style={{ padding: "4px 10px" }} onClick={() => setK(v)}>{v}</button>
          ))}
        </div>
      </div>

      <div className="grid-3">
        <div>
          <div className="label" style={{ marginBottom: 8 }}>① 시맨틱 (pgvector)</div>
          <div className="col" style={{ gap: 6 }}>
            {semantic.map((r, i) => (
              <div key={r.id} className="card card-tight">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span><Pill>#{i + 1}</Pill> <span style={{ fontSize: 13 }}>{r.title}</span></span>
                  <span className="tiny mono muted">{r.semScore.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>② BM25 (Elasticsearch)</div>
          <div className="col" style={{ gap: 6 }}>
            {bm25.map((r, i) => (
              <div key={r.id} className="card card-tight">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span><Pill>#{i + 1}</Pill> <span style={{ fontSize: 13 }}>{r.title}</span></span>
                  <span className="tiny mono muted">{r.bm25Score.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>③ RRF 결합</div>
          <div className="col" style={{ gap: 6 }}>
            {fused.map((r, i) => (
              <div key={r.id} className="card card-tight" style={{ borderColor: i === 0 ? "var(--cyan)" : "var(--line-1)" }}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                  <span><Pill tone={i === 0 ? "cyan" : ""}>#{i + 1}</Pill> <span style={{ fontSize: 13 }}>{r.title}</span></span>
                  <span className="tiny mono" style={{ color: "var(--cyan-bright)" }}>{r.total.toFixed(4)}</span>
                </div>
                <div className="tiny muted mono">
                  sem #{r.sRank || "—"} ({(r.sScore * 1000).toFixed(2)}/k) + bm #{r.bRank || "—"} ({(r.bScore * 1000).toFixed(2)}/k)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="tiny muted" style={{ marginTop: 16 }}>
        RRF 공식: <code>score(d) = Σ 1 / (k + rank<sub>i</sub>(d))</code>. 양쪽 결과에 모두 등장하는 문서가 상위. k가 작을수록 상위 랭크의 가중치가 큼.
      </div>
      <MockRouteBadge service="learning-ai" module="search"
        from="learning-ai → pgvector + Elasticsearch" fromUrl="SELECT ... ORDER BY embedding <=> $1 | GET /notes/_search"
        to="Testcontainers" toUrl="PostgreSQL(pgvector) + Elasticsearch Testcontainers" />
    </div>
  );
}

// AI Card Generation Mock
function AICardGeneratorMock() {
  const [noteText, setNoteText] = useState("머신러닝은 인공지능의 한 분야로, 데이터에서 패턴을 학습하는 기술이다. 과적합을 방지하기 위해 정규화, 드롭아웃, 교차 검증 등의 기법을 사용한다.");
  const [cardType, setCardType] = useState("basic");
  const [count, setCount] = useState(3);
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiErrorScenario, setAiErrorScenario] = useState("none");
  const aiErrorScenarios = [
    { id: "none", label: "없음 (정상)" },
    { id: "overloaded", label: "529 Overloaded" },
    { id: "token_exceeded", label: "400 Token limit exceeded" }
  ];

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      if (aiErrorScenario === "overloaded") {
        setGenerated({ error: true, status: 529, body: { type: "error", error: { type: "overloaded_error", message: "Overloaded" } } });
        setLoading(false);
        return;
      }
      if (aiErrorScenario === "token_exceeded") {
        setGenerated({ error: true, status: 400, body: { type: "error", error: { type: "invalid_request_error", message: "max_tokens exceeds model limit" } } });
        setLoading(false);
        return;
      }
      // Mock response (mirrors fixture from 04)
      const mockCards = [
        { cardType: "basic", front: "머신러닝에서 과적합이란?", back: "훈련 데이터에 과도하게 맞춰져 새 데이터에 일반화 못하는 현상", confidence: 0.95 },
        { cardType: "basic", front: "과적합 방지 기법 3가지는?", back: "정규화, 드롭아웃, 교차 검증", confidence: 0.92 },
        { cardType: "cloze", front: "{{c1::정규화}}는 모델 가중치에 페널티를 부과해 과적합을 방지한다.", back: "", confidence: 0.88 },
        { cardType: "basic", front: "머신러닝은 무엇인가?", back: "데이터에서 패턴을 학습하는 인공지능의 한 분야", confidence: 0.91 },
        { cardType: "cloze", front: "{{c1::드롭아웃}}은 학습 중 무작위로 뉴런을 비활성화하는 기법이다.", back: "", confidence: 0.85 }
      ].filter(c => cardType === "mixed" || c.cardType === cardType).slice(0, count);
      setGenerated({
        cards: mockCards,
        usage: { inputTokens: Math.ceil(noteText.length / 2), outputTokens: mockCards.length * 50 },
        model: "claude-sonnet-4"
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="grid-2">
      <div>
        <Field label="원본 노트 본문">
          <textarea className="textarea" value={noteText} onChange={e => setNoteText(e.target.value)} rows={6} />
        </Field>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <Field label="카드 유형">
            <select className="select" value={cardType} onChange={e => setCardType(e.target.value)}>
              <option value="basic">basic (Q/A)</option>
              <option value="cloze">cloze (빈칸)</option>
              <option value="mixed">mixed</option>
            </select>
          </Field>
          <Field label={`생성 개수: ${count}`}>
            <input type="range" min="1" max="5" value={count} className="slider" onChange={e => setCount(+e.target.value)} />
          </Field>
        </div>
        <div style={{ marginTop: 12 }}>
          <ErrorScenarioToggle scenarios={aiErrorScenarios} value={aiErrorScenario} onChange={setAiErrorScenario} />
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            {loading ? "Claude 호출 중…" : "AI 카드 생성"}
          </button>
        </div>
        <div className="tiny muted" style={{ marginTop: 12 }}>
          실제: respx로 <code>POST https://api.anthropic.com/v1/messages</code> 응답을 fixture로 mocking. <br />
          기본 fixture는 fixed confidence 0.95 / 0.92 — Free 플랜은 일일 10회 제한.
        </div>
      </div>
      <div>
        <div className="label" style={{ marginBottom: 8 }}>응답 fixture</div>
        {!generated ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
            <div className="muted tiny">버튼을 눌러 mock 응답을 생성하세요</div>
          </div>
        ) : generated.error ? (
          <div>
            <div className="row" style={{ marginBottom: 8 }}>
              <Pill tone="red">{generated.status} Error</Pill>
              <span className="tiny muted">{generated.body.error.type}</span>
            </div>
            <JsonView data={generated.body} max={20} />
            <div className="tiny muted" style={{ marginTop: 12 }}>
              {generated.status === 529 ? "재시도: exponential backoff (1s, 2s, 4s). 3회 실패 시 사용자에게 에러 표시." :
               "입력 텍스트를 줄이거나 max_tokens 설정을 확인하세요."}
            </div>
          </div>
        ) : (
          <div>
            <div className="row" style={{ marginBottom: 8, gap: 6 }}>
              <Pill tone="violet">{generated.model}</Pill>
              <Pill>in: {generated.usage.inputTokens}t</Pill>
              <Pill>out: {generated.usage.outputTokens}t</Pill>
            </div>
            <div className="col" style={{ gap: 8, maxHeight: 360, overflowY: "auto" }}>
              {generated.cards.map((c, i) => (
                <div key={i} className="card card-tight">
                  <div className="row" style={{ marginBottom: 6 }}>
                    <Pill tone={c.cardType === "cloze" ? "amber" : "cyan"}>{c.cardType}</Pill>
                    <Pill tone={c.confidence > 0.9 ? "green" : "amber"}>conf {c.confidence.toFixed(2)}</Pill>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{c.front}</div>
                  {c.back ? <div className="tiny muted">{c.back}</div> : <div className="tiny muted">(빈칸 카드)</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <MockRouteBadge service="learning-ai" module="generation"
        from="learning-ai → Anthropic" fromUrl="POST https://api.anthropic.com/v1/messages"
        to="respx mock" toUrl="respx.post('https://api.anthropic.com/v1/messages').mock(...)"
        file="fixtures/anthropic/card-generation-success.json" />
    </div>
  );
}

Object.assign(window, { SemanticCacheSimulator, HybridSearchRRF, AICardGeneratorMock });
