// ===== Doc 03: Knowledge Service =====

// Wikilink Parser
function parseWikilinks(text) {
  // Remove code blocks first
  const noCodeBlocks = text.replace(/```[\s\S]*?```/g, m => " ".repeat(m.length));
  const noInlineCode = noCodeBlocks.replace(/`[^`\n]*`/g, m => " ".repeat(m.length));
  // Find innermost [[...]]
  const links = [];
  const re = /\[\[([^\[\]]+)\]\]/g;
  let m;
  while ((m = re.exec(noInlineCode))) {
    const inner = m[1].trim();
    if (!inner) continue;
    const parts = inner.split("|");
    const target = parts[0].trim();
    const alias = parts.length > 1 ? parts[1].trim() : null;
    if (target) links.push({ raw: m[0], target, alias, idx: m.index });
  }
  return links;
}

function highlightWikilinks(text, links) {
  if (!links.length) return text.replace(/</g, "&lt;");
  // Build HTML
  let result = "";
  let cursor = 0;
  for (const l of links) {
    result += text.slice(cursor, l.idx).replace(/</g, "&lt;");
    result += `<span style="background:var(--cyan-fog);border:1px solid rgba(34,211,238,0.3);border-radius:3px;padding:0 3px;color:var(--cyan-bright);font-weight:500">${l.raw.replace(/</g, "&lt;")}</span>`;
    cursor = l.idx + l.raw.length;
  }
  result += text.slice(cursor).replace(/</g, "&lt;");
  return result;
}

function WikilinkParser() {
  const [text, setText] = useState(`# 머신러닝 기초 정리

[[딥러닝 기초|DL 입문]] 참조 (별칭 링크)

머신러닝은 인공지능의 한 분야로, 데이터에서 패턴을 학습하는 기술이다.

[[지도학습]]과 [[비지도학습]]의 차이는 레이블 유무에 있다.

\`\`\`
# 코드 블록 내 [[이건무시됨]] 위키링크
\`\`\`

[[]] ← 빈 링크는 무시됨`);

  const links = useMemo(() => parseWikilinks(text), [text]);
  const highlighted = useMemo(() => highlightWikilinks(text, links), [text, links]);

  return (
    <div className="grid-2">
      <div>
        <Field label="노트 본문 (마크다운)">
          <textarea className="textarea" value={text} onChange={e => setText(e.target.value)} rows={14} />
        </Field>
      </div>
      <div>
        <div className="label" style={{ marginBottom: 8 }}>파싱 결과 ({links.length} 링크 추출)</div>
        <div className="code" style={{ whiteSpace: "pre-wrap", maxHeight: 280, overflow: "auto" }} dangerouslySetInnerHTML={{ __html: highlighted }} />
        <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>추출된 위키링크</div>
        <div className="row" style={{ gap: 8 }}>
          {links.length === 0 ? <span className="tiny muted">(없음)</span> :
            links.map((l, i) => <Pill key={i} tone="cyan">{l.alias ? `${l.target} (→ ${l.alias})` : l.target}</Pill>)
          }
        </div>
        <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>note.created 이벤트에 포함될 필드</div>
        <JsonView data={{
          noteId: "note-...001",
          links: links.map(l => ({ targetTitle: l.target, ...(l.alias ? { alias: l.alias } : {}) }))
        }} max={20} />
      </div>
      <MockRouteBadge service="knowledge-svc" module="note"
        from="내부 파싱 로직" fromUrl="NoteService.parseWikilinks(content)"
        to="Unit Test (mock 없음)" toUrl="단위 테스트 — 외부 의존성 없음" />
    </div>
  );
}

// Knowledge Graph Visualizer
function KnowledgeGraph() {
  const [selected, setSelected] = useState(null);
  const [hops, setHops] = useState(2);

  // Sample graph data
  const nodes = [
    { id: "ml-base", title: "머신러닝 기초 정리", x: 400, y: 200, rank: 0.85, tags: ["머신러닝", "AI"] },
    { id: "dl-base", title: "딥러닝 기초", x: 200, y: 280, rank: 0.65, tags: ["딥러닝"] },
    { id: "supervised", title: "지도학습", x: 580, y: 100, rank: 0.45, tags: ["머신러닝"] },
    { id: "unsupervised", title: "비지도학습", x: 580, y: 300, rank: 0.40, tags: ["머신러닝"] },
    { id: "cnn", title: "CNN", x: 80, y: 180, rank: 0.30, tags: ["딥러닝", "이미지"] },
    { id: "rnn", title: "RNN", x: 100, y: 380, rank: 0.25, tags: ["딥러닝", "시퀀스"] },
    { id: "overfit", title: "과적합", x: 400, y: 380, rank: 0.55, tags: ["머신러닝"] },
    { id: "regularize", title: "정규화 기법", x: 600, y: 430, rank: 0.50, tags: ["머신러닝"] },
    { id: "orphan", title: "딥러닝 완전 정복 가이드", x: 740, y: 220, rank: 0.15, tags: [], orphan: true }
  ];

  const edges = [
    { s: "ml-base", t: "dl-base" }, { s: "dl-base", t: "ml-base" },
    { s: "ml-base", t: "supervised" }, { s: "ml-base", t: "unsupervised" },
    { s: "dl-base", t: "cnn" }, { s: "dl-base", t: "rnn" },
    { s: "ml-base", t: "overfit" }, { s: "overfit", t: "regularize" },
    { s: "supervised", t: "overfit" }
  ];

  // N-hop traversal from selected
  const reachable = useMemo(() => {
    if (!selected) return new Set();
    const set = new Set([selected]);
    let frontier = new Set([selected]);
    for (let h = 0; h < hops; h++) {
      const next = new Set();
      for (const id of frontier) {
        for (const e of edges) {
          if (e.s === id) next.add(e.t);
          if (e.t === id) next.add(e.s);
        }
      }
      next.forEach(n => set.add(n));
      frontier = next;
    }
    return set;
  }, [selected, hops]);

  const nodeMap = useMemo(() => Object.fromEntries(nodes.map(n => [n.id, n])), []);

  return (
    <div>
      <div className="row" style={{ marginBottom: 12, justifyContent: "space-between" }}>
        <div className="row">
          <span className="tiny muted">노드 클릭 → N-hop 이웃 강조</span>
          {selected ? <Pill tone="cyan">선택: {nodeMap[selected]?.title}</Pill> : null}
        </div>
        <div className="row">
          <span className="label" style={{ marginBottom: 0 }}>hops:</span>
          {[1, 2, 3].map(h => (
            <button key={h} className={"btn" + (hops === h ? " btn-primary" : "")} style={{ padding: "4px 12px" }} onClick={() => setHops(h)}>{h}</button>
          ))}
          {selected ? <button className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setSelected(null)}>지우기</button> : null}
        </div>
      </div>
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 12, overflow: "hidden", height: 480, position: "relative" }}>
        <svg className="graph-svg" viewBox="0 0 820 500">
          {/* Edges */}
          {edges.map((e, i) => {
            const s = nodeMap[e.s], t = nodeMap[e.t];
            const isHl = selected && reachable.has(e.s) && reachable.has(e.t);
            return (
              <line key={i}
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                className={"graph-edge" + (isHl ? " highlight" : "")}
                strokeOpacity={selected && !isHl ? 0.2 : 0.6}
                markerEnd="url(#arrow)" />
            );
          })}
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="14" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--line-3)" />
            </marker>
          </defs>
          {/* Nodes */}
          {nodes.map(n => {
            const isSel = selected === n.id;
            const isReachable = !selected || reachable.has(n.id);
            const radius = 18 + n.rank * 24;
            return (
              <g key={n.id} className={"graph-node" + (isSel ? " selected" : "")}
                transform={`translate(${n.x},${n.y})`}
                opacity={isReachable ? 1 : 0.25}
                onClick={() => setSelected(n.id)}>
                <circle r={radius}
                  fill={isSel ? "var(--cyan-fog)" : n.orphan ? "var(--bg-3)" : "var(--bg-2)"}
                  stroke={isSel ? "var(--cyan)" : n.orphan ? "var(--text-4)" : "var(--line-3)"}
                  strokeWidth={isSel ? 2.5 : 1.5}
                  strokeDasharray={n.orphan ? "4 3" : "0"} />
                <text dy="0.35em" fontSize={Math.max(10, radius * 0.4)}>{n.title.length > 8 ? n.title.slice(0, 7) + "…" : n.title}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid-3" style={{ marginTop: 16 }}>
        <StatCard label="Nodes" value={nodes.length} hint={`그래프 내 노트 수`} />
        <StatCard label="Edges" value={edges.length} tone="cyan" hint={`위키링크 관계 (방향성)`} />
        <StatCard label="Orphans" value={nodes.filter(n => n.orphan).length} tone="amber" hint={`백링크 0개 노트`} />
      </div>

      {selected ? (
        <div style={{ marginTop: 16 }}>
          <div className="label" style={{ marginBottom: 6 }}>
            /graph/neighbors/{selected}?hops={hops} 응답
          </div>
          <JsonView data={{
            success: true,
            data: {
              center: selected,
              nodes: nodes.filter(n => reachable.has(n.id)).map(n => ({ id: n.id, title: n.title, pageRank: n.rank })),
              edges: edges.filter(e => reachable.has(e.s) && reachable.has(e.t))
            }
          }} max={30} />
        </div>
      ) : null}
      <MockRouteBadge service="knowledge-svc" module="graph"
        from="Client → knowledge-svc" fromUrl="GET /graph/neighbors/:id?hops=N"
        to="MockDioAdapter fixture" toUrl="Flutter: MockDioAdapter.onGet('/graph/neighbors/:id', ...)"
        file="test/fixtures/graph/neighbors-2hop.json" />
    </div>
  );
}

// Chunking + Embedding visualizer
function ChunkingVisualizer() {
  const [text, setText] = useState(`머신러닝은 인공지능의 한 분야로, 데이터에서 패턴을 학습하는 기술이다. 과적합을 방지하기 위해 정규화, 드롭아웃, 교차 검증 등의 기법을 사용한다. 지도학습은 레이블이 있는 데이터로 학습하며, 비지도학습은 레이블 없이 군집화 등을 수행한다. 강화학습은 환경과 상호작용하며 보상을 최대화하는 정책을 학습한다.`);
  const [chunkSize, setChunkSize] = useState(80);
  const [overlap, setOverlap] = useState(20);

  const estimateTokens = (str) => {
    let tokens = 0;
    for (let j = 0; j < str.length; j++) {
      tokens += str.charCodeAt(j) > 127 ? 1 : 0.25;
    }
    return Math.ceil(tokens);
  };

  const chunks = useMemo(() => {
    const result = [];
    let pos = 0;
    let i = 0;
    while (pos < text.length) {
      const end = Math.min(pos + chunkSize, text.length);
      const chunk = text.slice(pos, end);
      result.push({ idx: i, text: chunk, tokens: estimateTokens(chunk), pos });
      pos = end - overlap;
      i++;
      if (i > 20) break;
    }
    return result;
  }, [text, chunkSize, overlap]);

  const colors = ["#22d3ee", "#a78bfa", "#f59e0b", "#34d399", "#f472b6", "#60a5fa"];

  return (
    <div className="grid-2">
      <div>
        <Field label="노트 본문">
          <textarea className="textarea" value={text} onChange={e => setText(e.target.value)} rows={6} />
        </Field>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <Field label={`chunk_size: ${chunkSize}자`}>
            <input type="range" min="40" max="200" step="20" value={chunkSize} className="slider" onChange={e => setChunkSize(+e.target.value)} />
          </Field>
          <Field label={`overlap: ${overlap}자`}>
            <input type="range" min="0" max="60" step="10" value={overlap} className="slider" onChange={e => setOverlap(+e.target.value)} />
          </Field>
        </div>
        <div className="tiny muted" style={{ marginTop: 12 }}>
          실제: tiktoken 기반 token 단위 청킹. 청크당 ≈ 500 토큰. 여기선 한글≈1, ASCII≈0.25로 추정. <code>POST /internal/embeddings</code> 호출 → pgvector(1536)에 저장.
        </div>
      </div>
      <div>
        <div className="label" style={{ marginBottom: 8 }}>청크 {chunks.length}개 · 총 토큰 ≈ {chunks.reduce((a, c) => a + c.tokens, 0)}</div>
        <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {chunks.map((c, i) => (
            <div key={i} className="card card-tight" style={{ borderLeft: `3px solid ${colors[i % colors.length]}` }}>
              <div className="tiny muted" style={{ marginBottom: 4 }}>
                chunk #{c.idx} · {c.text.length}자 · ~{c.tokens} tokens · pos {c.pos}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>{c.text}</div>
            </div>
          ))}
        </div>
        <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>note_chunks 테이블 (pgvector)</div>
        <Code>{`INSERT INTO note_chunks (
  note_id, chunk_index, chunk_text, embedding, token_count
) VALUES (
  'note-...003', ${chunks.length - 1}, '${chunks[chunks.length - 1]?.text.slice(0, 30)}…', 
  '[0.0023, -0.0121, ...]'::vector(1536), ${chunks[chunks.length - 1]?.tokens || 0}
);`}</Code>
      </div>
      <MockRouteBadge service="knowledge-svc" module="chunking"
        from="knowledge-svc → learning-ai" fromUrl="POST /internal/embeddings"
        to="WireMock (16-dim)" toUrl="http://localhost:${wiremock.port}/internal/embeddings"
        file="__files/embeddings/embedding-16dim.json" />
    </div>
  );
}

Object.assign(window, { WikilinkParser, KnowledgeGraph, ChunkingVisualizer });
