// ===== Doc 06: Kafka Events =====

// CloudEvents Builder
const TOPIC_TEMPLATES = {
  "note.created": {
    source: "synapse/knowledge-svc",
    data: {
      noteId: "note-00000000-0000-0000-0000-000000000001",
      userId: "user-00000000-0000-0000-0000-000000000001",
      title: "머신러닝 기초 정리",
      contentLength: 2500,
      tags: ["머신러닝", "AI"],
      hasAttachments: false
    },
    subjectPattern: "notes/{noteId}",
    consumers: ["learning-ai (자동 카드 생성)", "knowledge/note (ES 인덱싱)"]
  },
  "card.reviewed": {
    source: "synapse/learning-card",
    data: {
      userId: "user-00000000-0000-0000-0000-000000000001",
      cardId: "card-00000000-0000-0000-0000-000000000001",
      deckId: "deck-00000000-0000-0000-0000-000000000001",
      rating: 4,
      timeSpentMs: 5000,
      newInterval: 7,
      newEF: 2.6,
      nextDueDate: "2026-01-22"
    },
    subjectPattern: "cards/{cardId}",
    consumers: ["engagement/gamification (XP 적립)"]
  },
  "user.registered": {
    source: "synapse/platform-svc",
    data: {
      userId: "user-00000000-0000-0000-0000-000000000001",
      email: "user1@example.com",
      displayName: "홍길동",
      tenantId: "tenant-00000000-0000-0000-0000-000000000001",
      authProvider: "email",
      locale: "ko"
    },
    subjectPattern: "users/{userId}",
    consumers: ["platform-svc/audit (감사 로그)"]
  },
  "billing.subscription.changed": {
    source: "synapse/platform-svc",
    data: {
      userId: "user-00000000-0000-0000-0000-000000000001",
      tenantId: "tenant-00000000-0000-0000-0000-000000000001",
      oldPlan: "free",
      newPlan: "pro",
      action: "subscribed",
      stripeSubscriptionId: "sub_mock_001"
    },
    subjectPattern: "subscriptions/{tenantId}",
    consumers: ["platform-svc/audit"]
  },
  "community.deck.shared": {
    source: "synapse/engagement-svc",
    data: {
      userId: "user-00000000-0000-0000-0000-000000000001",
      deckId: "deck-00000000-0000-0000-0000-000000000001",
      sharedDeckId: "sdeck-00000000-0000-0000-0000-000000000001",
      shareType: "group",
      targetGroupId: "group-00000000-0000-0000-0000-000000000001"
    },
    subjectPattern: "decks/{deckId}",
    consumers: ["notification (그룹 알림)", "gamification (+30 XP)", "audit"]
  },
  "gamification.level.up": {
    source: "synapse/engagement-svc",
    data: {
      userId: "user-00000000-0000-0000-0000-000000000001",
      oldLevel: 3,
      newLevel: 4,
      oldTitle: "학습자",
      newTitle: "학자",
      totalXp: 510
    },
    subjectPattern: "users/{userId}",
    consumers: ["notification (레벨업 알림)"]
  }
};

function CloudEventsBuilder() {
  const topics = Object.keys(TOPIC_TEMPLATES);
  const [topic, setTopic] = useState("note.created");
  const tpl = TOPIC_TEMPLATES[topic];

  const evt = {
    specversion: "1.0",
    id: CLOUD_EVENT_IDS[topic] || "evt-unknown",
    source: tpl.source,
    type: topic,
    subject: tpl.subjectPattern.replace(/\{(\w+)\}/g, (_, k) => tpl.data[k] || `{${k}}`),
    time: BASE_DATE,
    tenantid: "tenant-00000000-0000-0000-0000-000000000001",
    datacontenttype: "application/json",
    data: tpl.data
  };

  return (
    <div className="grid-2" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
      <div>
        <Field label="토픽 선택">
          <select className="select" value={topic} onChange={e => setTopic(e.target.value)}>
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <div className="label" style={{ marginTop: 20, marginBottom: 6 }}>발행 서비스</div>
        <Pill tone="cyan">{tpl.source}</Pill>

        <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>소비자 (Consumers)</div>
        <div className="col" style={{ gap: 6 }}>
          {tpl.consumers.map((c, i) => (
            <div key={i} className="card card-tight" style={{ padding: "8px 12px" }}>
              <span style={{ fontSize: 12 }}>← {c}</span>
            </div>
          ))}
        </div>

        <div className="label" style={{ marginTop: 20, marginBottom: 6 }}>EmbeddedKafka 검증 코드</div>
        <Code>{`@Test
void verify_${topic.replace(/\./g, "_")}_published() {
  // when — 비즈니스 로직 실행
  
  // then
  List<ConsumerRecord<String, Object>> records =
    kafkaTestHelper.consumeMessages(
      "${topic}", 1, Duration.ofSeconds(5));
  assertThat(records).hasSize(1);
}`}</Code>
      </div>
      <div>
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="label" style={{ marginBottom: 0 }}>CloudEvents 1.0 fixture</span>
          <span style={{ marginLeft: "auto" }}><CopyBtn text={JSON.stringify(evt, null, 2)} /></span>
        </div>
        <JsonView data={evt} max={60} />
        <div className="tiny muted" style={{ marginTop: 8 }}>
          Avro 스키마: <code>synapse-shared/src/main/avro/.../{topic.replace(/^(\w+)\..*/, "$1")}/...</code> · 키: <code>tenantId</code> (보통)
        </div>
      </div>
    </div>
  );
}

// Topic Map (all 18)
function TopicMap() {
  const [hovered, setHovered] = useState(null);
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <Pill tone="cyan">18개 토픽</Pill>
        <span className="tiny muted">CloudEvents 1.0 호환 · Avro 직렬화 · 키 = tenantId</span>
      </div>
      <div style={{ maxHeight: 480, overflowY: "auto", border: "1px solid var(--line-1)", borderRadius: 8 }}>
        <table className="table">
          <thead>
            <tr><th>Topic</th><th>Producer</th><th>Consumers</th><th>설명</th></tr>
          </thead>
          <tbody>
            {TOPICS.map((t, i) => (
              <tr key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ background: hovered === i ? "var(--cyan-fog)" : null }}>
                <td><code style={{ color: "var(--cyan-bright)" }}>{t.name}</code></td>
                <td className="tiny mono muted">{t.from}</td>
                <td className="tiny" style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {t.to.map((c, j) => <Pill key={j}>{c}</Pill>)}
                </td>
                <td className="tiny">{t.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Event-Driven Flow Simulator
function EventFlowSimulator() {
  const flows = {
    "note.created": [
      { svc: "knowledge-svc", op: "POST /notes", delay: 0 },
      { svc: "Kafka", op: "publish note.created", delay: 300 },
      { svc: "learning-ai", op: "consume → AI 카드 생성", delay: 700 },
      { svc: "knowledge/note", op: "consume → ES 인덱싱", delay: 700 },
      { svc: "Kafka", op: "publish notification.send (선택)", delay: 1100 },
      { svc: "DONE", op: "노트 생성 완료", delay: 1400 }
    ],
    "card.reviewed": [
      { svc: "learning-card", op: "POST /reviews/sessions/:id/submit", delay: 0 },
      { svc: "PostgreSQL", op: "UPDATE card_schedules (SM-2)", delay: 200 },
      { svc: "Kafka", op: "publish card.reviewed", delay: 400 },
      { svc: "gamification", op: "consume → XP +10", delay: 700 },
      { svc: "Kafka", op: "publish gamification.xp.earned", delay: 1000 },
      { svc: "gamification", op: "check level up?", delay: 1200 },
      { svc: "Kafka", op: "publish gamification.level.up", delay: 1400 },
      { svc: "notification", op: "consume → push 발송", delay: 1700 }
    ],
    "checkout.completed": [
      { svc: "Stripe", op: "POST webhook /billing/webhooks", delay: 0 },
      { svc: "billing", op: "verify Stripe-Signature", delay: 200 },
      { svc: "PostgreSQL", op: "INSERT/UPDATE subscriptions", delay: 400 },
      { svc: "Kafka", op: "publish billing.subscription.changed", delay: 700 },
      { svc: "audit", op: "consume → INSERT audit_logs", delay: 1000 },
      { svc: "DONE", op: "Pro 구독 활성화", delay: 1300 }
    ]
  };

  const [scenario, setScenario] = useState("card.reviewed");
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);

  const steps = flows[scenario];

  const run = () => {
    setStep(-1);
    setRunning(true);
    steps.forEach((s, i) => {
      setTimeout(() => setStep(i), s.delay);
    });
    setTimeout(() => setRunning(false), steps[steps.length - 1].delay + 200);
  };

  const reset = () => { setStep(-1); setRunning(false); };

  return (
    <div>
      <div className="row" style={{ marginBottom: 16, gap: 8 }}>
        {Object.keys(flows).map(s => (
          <button key={s} className={"btn" + (scenario === s ? " btn-primary" : "")} onClick={() => { setScenario(s); reset(); }}>
            {s}
          </button>
        ))}
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={run} disabled={running}>
          {running ? "▶ 실행 중…" : "▶ 시작"}
        </button>
        <button className="btn btn-ghost" onClick={reset}>↻</button>
      </div>

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 18, top: 16, bottom: 16, width: 2, background: "var(--line-1)" }} />
        <div className="col" style={{ gap: 12 }}>
          {steps.map((s, i) => {
            const active = step >= i;
            const current = step === i;
            return (
              <div key={i} className={"flow-node" + (active ? " active" : "")} style={{ marginLeft: 36, position: "relative", opacity: active ? 1 : 0.4 }}>
                <div style={{ position: "absolute", left: -32, top: 14, width: 12, height: 12, borderRadius: 6, background: current ? "var(--cyan)" : active ? "var(--cyan-dim)" : "var(--bg-3)", border: "2px solid var(--bg-1)", boxShadow: current ? "0 0 0 4px var(--cyan-fog)" : "none" }} className={current ? "pulse" : ""} />
                <div className="flow-node-label">{s.svc}</div>
                <div className="flow-node-name">{s.op}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CloudEventsBuilder, TopicMap, EventFlowSimulator });
