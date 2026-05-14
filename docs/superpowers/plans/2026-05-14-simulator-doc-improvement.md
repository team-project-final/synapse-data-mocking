# Simulator & Document Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve 19 simulators and 8 mocking documents across 6 phases — fix bugs, add cross-simulator infrastructure, reinforce document structure, upgrade core simulator logic accuracy, enhance remaining simulators, and sync HTML.

**Architecture:** Browser-side React 18 app (CDN + Babel standalone, no build step). All JSX files load as global scripts and share state via `window`. New EventBus and shared components go in `js/ui.jsx`. Shared constants go in `js/data.jsx`. Documents are Markdown (source of truth), with HTML pages in `docs/` synced from them.

**Tech Stack:** React 18 (CDN), Babel standalone, vanilla CSS, GitHub Pages static deployment

**Spec:** `docs/superpowers/specs/2026-05-14-simulator-doc-improvement-design.md`

---

## Phase 0: P0 Bug / Inconsistency Fixes

### Task 1: Fix Mock Response count mismatch

**Files:**
- Modify: `js/app.jsx:563` (PageFrontend — Section num="2" title text)

- [ ] **Step 1: Fix the hardcoded "49+" in PageFrontend**

In `js/app.jsx`, find the Section component at line 563:

```jsx
<Section num="2" title="Mock 응답 카탈로그" sub="49+ 응답 fixture · MockDioAdapter 등록 코드 자동 생성">
```

Replace with:

```jsx
<Section num="2" title="Mock 응답 카탈로그" sub={`${MOCK_RESPONSES.length}개 응답 fixture · MockDioAdapter 등록 코드 자동 생성`}>
```

- [ ] **Step 2: Fix the same issue in MockArchitecture**

In `js/sim-frontend.jsx`, find line 117:

```jsx
{ name: "Fixture Factory", sub: "JSON 응답 49+", at: 4, hot: "Golden Tests" }
```

Replace with:

```jsx
{ name: "Fixture Factory", sub: `JSON 응답 ${MOCK_RESPONSES.length}개`, at: 4, hot: "Golden Tests" }
```

- [ ] **Step 3: Also fix in data.jsx DOCS metadata**

In `js/data.jsx`, find line 49:

```jsx
summary: "dio MockInterceptor + Mockito Repository mock + 49+ 목 응답 + Golden Test 데이터셋.",
```

Replace with:

```jsx
summary: "dio MockInterceptor + Mockito Repository mock + 목 응답 fixture + Golden Test 데이터셋.",
```

- [ ] **Step 4: Verify in browser**

Open `index.html` in browser, navigate to Frontend tab (05). Confirm:
- Section 2 title shows actual count (e.g., "26개 응답 fixture")
- MockArchitecture Fixture Factory card shows "JSON 응답 26개"

- [ ] **Step 5: Commit**

```bash
git add js/app.jsx js/sim-frontend.jsx js/data.jsx
git commit -m "fix: replace hardcoded '49+' with dynamic MOCK_RESPONSES.length"
```

---

### Task 2: Fix Stripe kafkaEvent runtime bug

**Files:**
- Modify: `js/sim-platform.jsx:24`

- [ ] **Step 1: Fix the function literal in STRIPE_EVENTS**

In `js/sim-platform.jsx`, line 24 has:

```jsx
kafkaEvent: { type: "billing.subscription.changed", action: "payment_failed", plan: state => state.plan }
```

Replace with a string value — the plan is resolved at fire time in the `fire()` function. Change the data definition to use a sentinel:

```jsx
kafkaEvent: { type: "billing.subscription.changed", action: "payment_failed", plan: "__CURRENT_PLAN__" }
```

- [ ] **Step 2: Resolve sentinel in the fire function**

In `js/sim-platform.jsx`, in the `fire` function (line 41-52), change the Kafka log entry at line 49:

```jsx
      setTimeout(() => {
        const ke = evt.kafkaEvent;
        setLog(l => [...l, { t: new Date().toLocaleTimeString(), tag: "KAFKA→", kind: "recv", msg: `<code>${ke.type}</code> · action=${ke.action}` }]);
      }, 300);
```

Replace with:

```jsx
      setTimeout(() => {
        const ke = evt.kafkaEvent;
        const planValue = ke.plan === "__CURRENT_PLAN__" ? prev.plan : (ke.plan || ke.newPlan || "");
        setLog(l => [...l, { t: new Date().toLocaleTimeString(), tag: "KAFKA→", kind: "recv", msg: `<code>${ke.type}</code> · action=${ke.action} · plan=${planValue}` }]);
      }, 300);
```

Note: `prev` is not available here because this runs in setTimeout. We need to use a ref or capture the state. Let me fix this properly — use setState's callback to capture the value:

Actually, the `fire` function already calls `setState(prev => evt.effect(prev))` on line 46. The setTimeout on line 47 runs after, so `state` may not be updated yet. The cleanest fix: resolve plan inline in the Kafka event data structure rather than at log time. Change the approach:

```jsx
kafkaEvent: { type: "billing.subscription.changed", action: "payment_failed", plan: null }
```

And update the fire function to resolve null plan from current state:

In `fire`, replace lines 41-52 entirely with:

```jsx
  const fire = (evt) => {
    const t = new Date().toLocaleTimeString();
    setLog(l => [...l, { t, tag: "POST", kind: "send", msg: `/billing/webhooks · <code>${evt.id}</code>` }]);
    setTimeout(() => {
      setLog(l => [...l, { t: new Date().toLocaleTimeString(), tag: "OK", kind: "ok", msg: `Stripe-Signature 검증 통과` }]);
      setState(prev => {
        const newState = evt.effect(prev);
        const ke = evt.kafkaEvent;
        const planValue = ke.plan ?? ke.newPlan ?? newState.plan;
        setTimeout(() => {
          setLog(l => [...l, { t: new Date().toLocaleTimeString(), tag: "KAFKA→", kind: "recv", msg: `<code>${ke.type}</code> · action=${ke.action} · plan=${planValue}` }]);
        }, 100);
        return newState;
      });
    }, 200);
  };
```

- [ ] **Step 3: Verify in browser**

Open Platform tab (01). Click `invoice.payment_failed` after first activating a subscription via `checkout.session.completed`. The Kafka log should show `plan=pro` (not `undefined`).

- [ ] **Step 4: Commit**

```bash
git add js/sim-platform.jsx
git commit -m "fix: resolve Stripe kafkaEvent.plan from current state instead of function literal"
```

---

### Task 3: Fix CloudEvents ID reproducibility

**Files:**
- Modify: `js/data.jsx` (add CLOUD_EVENT_IDS)
- Modify: `js/sim-kafka.jsx:91-101`

- [ ] **Step 1: Add fixed event IDs to data.jsx**

In `js/data.jsx`, before the final `Object.assign` line (line 179), add:

```jsx
const BASE_DATE = "2026-01-15T10:00:00Z";

const CLOUD_EVENT_IDS = {
  "note.created": "evt-00000000-0000-0000-0000-000000000101",
  "note.updated": "evt-00000000-0000-0000-0000-000000000102",
  "note.deleted": "evt-00000000-0000-0000-0000-000000000103",
  "card.reviewed": "evt-00000000-0000-0000-0000-000000000201",
  "user.registered": "evt-00000000-0000-0000-0000-000000000301",
  "user.deleted": "evt-00000000-0000-0000-0000-000000000302",
  "billing.subscription.changed": "evt-00000000-0000-0000-0000-000000000401",
  "audit.event": "evt-00000000-0000-0000-0000-000000000501",
  "community.deck.shared": "evt-00000000-0000-0000-0000-000000000601",
  "community.note.shared": "evt-00000000-0000-0000-0000-000000000602",
  "community.group.created": "evt-00000000-0000-0000-0000-000000000603",
  "community.group.joined": "evt-00000000-0000-0000-0000-000000000604",
  "community.report.created": "evt-00000000-0000-0000-0000-000000000605",
  "gamification.xp.earned": "evt-00000000-0000-0000-0000-000000000701",
  "gamification.badge.earned": "evt-00000000-0000-0000-0000-000000000702",
  "gamification.level.up": "evt-00000000-0000-0000-0000-000000000703",
  "notification.send": "evt-00000000-0000-0000-0000-000000000801",
  "card.review.due": "evt-00000000-0000-0000-0000-000000000901"
};
```

Update the `Object.assign` line:

```jsx
Object.assign(window, { DOCS, TOPICS, SEED_IDS, MOCK_RESPONSES, BASE_DATE, CLOUD_EVENT_IDS });
```

- [ ] **Step 2: Use fixed IDs in CloudEventsBuilder**

In `js/sim-kafka.jsx`, line 95:

```jsx
    id: "evt-" + Math.random().toString(16).slice(2, 10) + "-...",
```

Replace with:

```jsx
    id: CLOUD_EVENT_IDS[topic] || "evt-unknown",
```

- [ ] **Step 3: Use BASE_DATE for time field**

In `js/sim-kafka.jsx`, line 97:

```jsx
    time: "2026-01-15T10:00:00Z",
```

Replace with:

```jsx
    time: BASE_DATE,
```

- [ ] **Step 4: Verify in browser**

Open Kafka tab (06). Switch between topics in CloudEvents Builder. The `id` field should show a fixed UUID (e.g., `evt-00000000-0000-0000-0000-000000000101` for `note.created`), and stay the same when you switch away and back.

- [ ] **Step 5: Commit**

```bash
git add js/data.jsx js/sim-kafka.jsx
git commit -m "fix: use fixed event IDs for CloudEvents reproducibility, add BASE_DATE constant"
```

---

### Task 4: Fix Korean token estimation

**Files:**
- Modify: `js/sim-knowledge.jsx:218`

- [ ] **Step 1: Replace naive token estimation**

In `js/sim-knowledge.jsx`, find the chunk creation inside `useMemo` (line 218):

```jsx
      result.push({ idx: i, text: chunk, tokens: Math.ceil(chunk.length / 2), pos });
```

Replace with a smarter heuristic:

```jsx
      const estimateTokens = (str) => {
        let tokens = 0;
        for (let j = 0; j < str.length; j++) {
          tokens += str.charCodeAt(j) > 127 ? 1 : 0.25;
        }
        return Math.ceil(tokens);
      };
      result.push({ idx: i, text: chunk, tokens: estimateTokens(chunk), pos });
```

Move the `estimateTokens` function outside the loop for efficiency. Replace the entire `useMemo` block (lines 211-224):

```jsx
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
```

- [ ] **Step 2: Add estimation note to UI**

In the same file, find the hint text (line 243):

```jsx
          실제: tiktoken 기반 token 단위 청킹. 청크당 ≈ 500 토큰. <code>POST /internal/embeddings</code> 호출 → pgvector(1536)에 저장.
```

Replace with:

```jsx
          실제: tiktoken 기반 token 단위 청킹. 청크당 ≈ 500 토큰. 여기선 한글≈1, ASCII≈0.25로 추정. <code>POST /internal/embeddings</code> 호출 → pgvector(1536)에 저장.
```

- [ ] **Step 3: Verify in browser**

Open Knowledge tab (03). Enter Korean text in the chunking visualizer. Token counts should be close to character count for Korean text (not half).

- [ ] **Step 4: Commit**

```bash
git add js/sim-knowledge.jsx
git commit -m "fix: improve Korean token estimation heuristic in chunking visualizer"
```

---

### Task 5: Add CopyBtn to TimeFixturePlayground

**Files:**
- Modify: `js/sim-strategy.jsx:159-172`

- [ ] **Step 1: Add CopyBtn next to language selector**

In `js/sim-strategy.jsx`, replace lines 159-168:

```jsx
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
```

Replace with:

```jsx
  return (
    <div>
      <div className="row" style={{ marginBottom: 12, justifyContent: "space-between" }}>
        <div className="row">
          {langs.map(l => (
            <button key={l.id} className={"btn" + (lang === l.id ? " btn-primary" : "")} onClick={() => setLang(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <CopyBtn text={TIME_SAMPLES[lang]} />
      </div>
      <Code lang={lang}>{TIME_SAMPLES[lang]}</Code>
```

- [ ] **Step 2: Verify in browser**

Open Strategy tab (00). Section 3, Time fixture playground. A "복사" button should appear next to the language buttons. Click it and verify clipboard content matches the code snippet.

- [ ] **Step 3: Commit**

```bash
git add js/sim-strategy.jsx
git commit -m "feat: add copy button to TimeFixturePlayground code snippets"
```

---

## Phase 1: Cross-Cutting Infrastructure

### Task 6: Add EventBus to ui.jsx

**Files:**
- Modify: `js/ui.jsx` (add SimBus before the final Object.assign)

- [ ] **Step 1: Implement EventBus**

In `js/ui.jsx`, before the final `Object.assign` line (line 122), add:

```jsx
// EventBus for cross-simulator state sync
const SimBus = (() => {
  const listeners = {};
  return {
    on(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    off(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(f => f !== fn);
    },
    emit(event, data) {
      if (!listeners[event]) return;
      listeners[event].forEach(fn => fn(data));
    }
  };
})();
window.__SimBus = SimBus;
```

- [ ] **Step 2: Update the Object.assign export**

Change line 123 (now shifted down):

```jsx
Object.assign(window, { useState, useEffect, useRef, useMemo, useCallback, Fragment, Pill, Section, Panel, Field, Switch, Log, Code, CopyBtn, StatCard, JsonView, SimBus });
```

- [ ] **Step 3: Commit**

```bash
git add js/ui.jsx
git commit -m "feat: add SimBus EventBus for cross-simulator state sync"
```

---

### Task 7: Add ErrorScenarioToggle component

**Files:**
- Modify: `js/ui.jsx` (add component before Object.assign)

- [ ] **Step 1: Add ErrorScenarioToggle component**

In `js/ui.jsx`, after the SimBus block and before `Object.assign`, add:

```jsx
function ErrorScenarioToggle({ scenarios, value, onChange }) {
  return (
    <Field label="에러 시나리오">
      <select className="select" value={value} onChange={e => onChange(e.target.value)}>
        {scenarios.map(s => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </Field>
  );
}
```

- [ ] **Step 2: Add ResetBtn component**

```jsx
function ResetBtn({ onClick }) {
  return (
    <button className="btn btn-ghost" onClick={onClick}>↻ 초기화</button>
  );
}
```

- [ ] **Step 3: Add MockRouteBadge component**

```jsx
function MockRouteBadge({ service, module, from, fromUrl, to, toUrl, file }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card card-tight" style={{ borderColor: "var(--line-2)", fontSize: 12, cursor: "pointer" }} onClick={() => setOpen(!open)}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span style={{ color: "var(--cyan-bright)", fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: 11 }}>MOCK ROUTE</span>
        <Pill tone="violet">{service}/{module}</Pill>
      </div>
      {open && (
        <div style={{ marginTop: 8 }} className="col" style={{ gap: 4, marginTop: 8 }}>
          <div><span className="tiny muted">FROM:</span> <span className="tiny">{from}</span></div>
          {fromUrl && <div className="tiny mono muted" style={{ paddingLeft: 12 }}>{fromUrl}</div>}
          <div><span className="tiny muted">TO:</span> <span className="tiny">{to}</span></div>
          {toUrl && <div className="tiny mono muted" style={{ paddingLeft: 12 }}>{toUrl}</div>}
          {file && <div><span className="tiny muted">FILE:</span> <code className="tiny">{file}</code></div>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update Object.assign export**

```jsx
Object.assign(window, { useState, useEffect, useRef, useMemo, useCallback, Fragment, Pill, Section, Panel, Field, Switch, Log, Code, CopyBtn, StatCard, JsonView, SimBus, ErrorScenarioToggle, ResetBtn, MockRouteBadge });
```

- [ ] **Step 5: Verify in browser**

Open browser console, type `ErrorScenarioToggle` — should be a function. Same for `ResetBtn`, `MockRouteBadge`, `SimBus`.

- [ ] **Step 6: Commit**

```bash
git add js/ui.jsx
git commit -m "feat: add ErrorScenarioToggle, ResetBtn, MockRouteBadge shared components"
```

---

### Task 8: Wire EventBus into XPSimulator → LeaderboardPreview

**Files:**
- Modify: `js/sim-engagement.jsx`

- [ ] **Step 1: Emit XP changes from XPSimulator**

In `js/sim-engagement.jsx`, in the `apply` function (line 145-175), after `newState.events = [...]` (line 172) and before `return newState;`, add:

```jsx
      // Emit for LeaderboardPreview sync
      setTimeout(() => SimBus.emit("xp.changed", { xp: newState.xp, level: afterLv?.lv || currentLevel?.lv }), 0);
```

Also emit on reset. In the `reset` function (line 177):

```jsx
  const reset = () => {
    setState(initial);
    SimBus.emit("xp.changed", { xp: initial.xp, level: 3 });
  };
```

- [ ] **Step 2: Subscribe LeaderboardPreview to EventBus**

Replace the LeaderboardPreview function (lines 259-304) with:

```jsx
function LeaderboardPreview() {
  const [period, setPeriod] = useState("weekly");
  const [youXp, setYouXp] = useState(null);

  useEffect(() => {
    const handler = (data) => setYouXp(data.xp);
    SimBus.on("xp.changed", handler);
    return () => SimBus.off("xp.changed", handler);
  }, []);

  const baseData = {
    weekly: [
      { rank: 1, name: "홍길동", xp: 500, lv: 4, you: true },
      { rank: 2, name: "김영희", xp: 350, lv: 3 },
      { rank: 3, name: "이수진", xp: 200, lv: 2 },
      { rank: 4, name: "박민호", xp: 150, lv: 2 }
    ],
    monthly: [
      { rank: 1, name: "김영희", xp: 1820, lv: 5 },
      { rank: 2, name: "홍길동", xp: 1540, lv: 5, you: true },
      { rank: 3, name: "박민호", xp: 980, lv: 4 },
      { rank: 4, name: "이수진", xp: 720, lv: 4 }
    ]
  };

  // If EventBus sent XP, update "YOU" row and re-sort
  const list = useMemo(() => {
    const rows = baseData[period].map(r => {
      if (r.you && youXp !== null) {
        const newLv = LEVELS.slice().reverse().find(l => youXp >= l.xp);
        return { ...r, xp: youXp, lv: newLv?.lv || r.lv };
      }
      return r;
    });
    rows.sort((a, b) => b.xp - a.xp);
    rows.forEach((r, i) => r.rank = i + 1);
    return rows;
  }, [period, youXp]);

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className={"btn" + (period === "weekly" ? " btn-primary" : "")} onClick={() => setPeriod("weekly")}>주간 (W03)</button>
        <button className={"btn" + (period === "monthly" ? " btn-primary" : "")} onClick={() => setPeriod("monthly")}>월간 (2026-01)</button>
        <span className="tiny muted" style={{ marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
          ZSET <code>leaderboard:{period}:2026-{period === "weekly" ? "W03" : "01"}</code>
        </span>
      </div>
      {youXp !== null && <div className="tiny" style={{ marginBottom: 8, color: "var(--cyan-bright)" }}>XP 시뮬레이터와 연동 중 · 현재 XP: {youXp}</div>}
      <table className="table">
        <thead><tr><th>Rank</th><th>User</th><th>XP</th><th>Level</th></tr></thead>
        <tbody>
          {list.map(r => (
            <tr key={r.name} style={r.you ? { background: "var(--cyan-fog)" } : null}>
              <td style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>
                {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : "#" + r.rank}
              </td>
              <td>{r.name} {r.you ? <Pill tone="cyan">YOU</Pill> : null}</td>
              <td className="mono">{r.xp}</td>
              <td className="mono muted">Lv {r.lv}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="tiny muted" style={{ marginTop: 12 }}>
        Redis ZADD/ZREVRANGE 사용 · 주간 cron: <code>0 0 1 * * MON</code> · 월간 cron: <code>0 0 1 1 * *</code>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Open Engagement tab (02). Click XP actions in SIM 08. Scroll down to SIM 09 (Leaderboard). The "YOU" row should update XP in real time and re-rank.

- [ ] **Step 4: Commit**

```bash
git add js/sim-engagement.jsx
git commit -m "feat: wire EventBus from XPSimulator to LeaderboardPreview for live XP sync"
```

---

### Task 9: Fix Semantic Cache tag mismatch

**Files:**
- Modify: `js/sim-learning.jsx:53`

- [ ] **Step 1: Fix OPENAI tag to CLAUDE**

In `js/sim-learning.jsx`, line 53:

```jsx
      entries.push({ t, tag: "OPENAI", kind: "send", msg: `Claude API 호출 (input ~500t, output ~300t)` });
```

Replace with:

```jsx
      entries.push({ t, tag: "CLAUDE", kind: "send", msg: `Claude API 호출 (input ~500t, output ~300t)` });
```

- [ ] **Step 2: Commit**

```bash
git add js/sim-learning.jsx
git commit -m "fix: correct OPENAI tag to CLAUDE in semantic cache simulator"
```

---

### Task 10: Add MockRouteBadge to all simulators

**Files:**
- Modify: `js/sim-platform.jsx`, `js/sim-engagement.jsx`, `js/sim-knowledge.jsx`, `js/sim-learning.jsx`, `js/sim-frontend.jsx`, `js/sim-kafka.jsx`, `js/sim-external.jsx`

This task adds a collapsible `MockRouteBadge` to each simulator panel. The badge is placed at the bottom of each simulator's main container.

- [ ] **Step 1: Add MockRouteBadge to StripeWebhookSimulator**

In `js/sim-platform.jsx`, inside `StripeWebhookSimulator`, just before the closing `</div>` of the return (line 88):

```jsx
      <MockRouteBadge
        service="platform-svc" module="billing"
        from="Stripe → platform-svc" fromUrl="POST https://api.stripe.com → /billing/webhooks"
        to="WireMock + EmbeddedKafka" toUrl="POST http://localhost:${wiremock.port}/billing/webhooks"
        file="__files/stripe/checkout-completed.json"
      />
```

- [ ] **Step 2: Add MockRouteBadge to QuietHoursChecker**

In `QuietHoursChecker`, before the closing `</div>` (line 151):

```jsx
      <MockRouteBadge
        service="platform-svc" module="notification"
        from="platform-svc → FCM" fromUrl="POST https://fcm.googleapis.com/v1/.../messages:send"
        to="WireMock" toUrl="POST http://localhost:${wiremock.port}/fcm/v1/.../messages:send"
        file="__files/fcm/send-success.json"
      />
```

- [ ] **Step 3: Add MockRouteBadge to JwtBuilder**

In `JwtBuilder`, before the closing `</div>` (line 223):

```jsx
      <MockRouteBadge
        service="platform-svc" module="auth"
        from="Client → platform-svc" fromUrl="POST /auth/login → JWT 발급"
        to="MockDioAdapter fixture" toUrl="Flutter: MockDioAdapter.onPost('/auth/login', ...)"
        file="test/fixtures/auth/login-success.json"
      />
```

- [ ] **Step 4: Add MockRouteBadge to SM2Simulator**

In `js/sim-engagement.jsx`, `SM2Simulator`, before the closing `</div>` (line 105):

```jsx
      <MockRouteBadge
        service="learning-card" module="srs"
        from="학습 카드 내부 로직" fromUrl="SM-2 알고리즘 (순수 함수)"
        to="Unit Test (mock 없음)" toUrl="@ParameterizedTest @CsvSource"
      />
```

- [ ] **Step 5: Add MockRouteBadge to XPSimulator**

In `XPSimulator`, before the closing `</div>` at the end of the grid (line 254):

```jsx
      <MockRouteBadge
        service="engagement-svc" module="gamification"
        from="Kafka card.reviewed → gamification-svc" fromUrl="EmbeddedKafka → XP 적립 로직"
        to="EmbeddedKafka fixture" toUrl="@EmbeddedKafka topics={card.reviewed, gamification.xp.earned}"
        file="fixtures/kafka/card-reviewed.json"
      />
```

- [ ] **Step 6: Add MockRouteBadge to WikilinkParser**

In `js/sim-knowledge.jsx`, `WikilinkParser`, before closing `</div>` (line 74):

```jsx
      <MockRouteBadge
        service="knowledge-svc" module="note"
        from="내부 파싱 로직" fromUrl="NoteService.parseWikilinks(content)"
        to="Unit Test (mock 없음)" toUrl="단위 테스트 — 외부 의존성 없음"
      />
```

- [ ] **Step 7: Add MockRouteBadge to KnowledgeGraph**

In `KnowledgeGraph`, before closing `</div>`:

```jsx
      <MockRouteBadge
        service="knowledge-svc" module="graph"
        from="Client → knowledge-svc" fromUrl="GET /graph/neighbors/:id?hops=N"
        to="MockDioAdapter fixture" toUrl="Flutter: MockDioAdapter.onGet('/graph/neighbors/:id', ...)"
        file="test/fixtures/graph/neighbors-2hop.json"
      />
```

- [ ] **Step 8: Add MockRouteBadge to ChunkingVisualizer**

In `ChunkingVisualizer`, before closing `</div>`:

```jsx
      <MockRouteBadge
        service="knowledge-svc" module="chunking"
        from="knowledge-svc → learning-ai" fromUrl="POST /internal/embeddings"
        to="WireMock (16-dim)" toUrl="http://localhost:${wiremock.port}/internal/embeddings"
        file="__files/embeddings/embedding-16dim.json"
      />
```

- [ ] **Step 9: Add MockRouteBadge to SemanticCacheSimulator**

In `js/sim-learning.jsx`, `SemanticCacheSimulator`, before closing `</div>`:

```jsx
      <MockRouteBadge
        service="learning-ai" module="cache"
        from="learning-ai → Redis" fromUrl="GET/SET semantic_cache:{hash}"
        to="fakeredis" toUrl="fakeredis.FakeRedis(decode_responses=True)"
      />
```

- [ ] **Step 10: Add MockRouteBadge to HybridSearchRRF**

In `HybridSearchRRF`, before closing `</div>`:

```jsx
      <MockRouteBadge
        service="learning-ai" module="search"
        from="learning-ai → pgvector + Elasticsearch" fromUrl="SELECT ... ORDER BY embedding <=> $1 | GET /notes/_search"
        to="Testcontainers" toUrl="PostgreSQL(pgvector) + Elasticsearch Testcontainers"
      />
```

- [ ] **Step 11: Add MockRouteBadge to AICardGeneratorMock**

In `AICardGeneratorMock`, before closing `</div>`:

```jsx
      <MockRouteBadge
        service="learning-ai" module="generation"
        from="learning-ai → Anthropic" fromUrl="POST https://api.anthropic.com/v1/messages"
        to="respx mock" toUrl="respx.post('https://api.anthropic.com/v1/messages').mock(...)"
        file="fixtures/anthropic/card-generation-success.json"
      />
```

- [ ] **Step 12: Add MockRouteBadge to MockResponseBrowser**

In `js/sim-frontend.jsx`, `MockResponseBrowser`, before closing `</div>`:

```jsx
      <MockRouteBadge
        service="flutter-app" module="all modules"
        from="Flutter → All service APIs" fromUrl="dio HTTP client → 각 서비스 REST API"
        to="MockDioAdapter" toUrl="MockDioAdapter.onGet/onPost(path, MockResponse(...))"
        file="test/fixtures/*.json"
      />
```

- [ ] **Step 13: Add MockRouteBadge to CloudEventsBuilder**

In `js/sim-kafka.jsx`, `CloudEventsBuilder`, before closing `</div>`:

```jsx
      <MockRouteBadge
        service="all producers" module="Kafka"
        from="producer-svc → Kafka broker → consumer-svc" fromUrl="KafkaTemplate.send(topic, key, event)"
        to="EmbeddedKafka" toUrl="@EmbeddedKafka(topics={...}) + KafkaTestHelper"
        file="fixtures/kafka/{topic}.json"
      />
```

- [ ] **Step 14: Add MockRouteBadge to OAuthFlowSimulator**

In `js/sim-external.jsx`, `OAuthFlowSimulator`, after the grid-2 div, before the closing `</div>`:

```jsx
      <MockRouteBadge
        service="platform-svc" module="auth"
        from="platform-svc → OAuth Providers" fromUrl="POST /google/token, GET /google/userinfo (등 4종)"
        to="WireMock per-provider" toUrl="http://localhost:${wiremock.port}/{provider}/token"
        file="__files/oauth/{provider}-token-success.json"
      />
```

- [ ] **Step 15: Verify in browser**

Navigate through all 8 tabs. Each simulator should show a collapsible "MOCK ROUTE" badge at the bottom. Click it to expand and verify service/module, FROM, TO, FILE info.

- [ ] **Step 16: Commit**

```bash
git add js/sim-platform.jsx js/sim-engagement.jsx js/sim-knowledge.jsx js/sim-learning.jsx js/sim-frontend.jsx js/sim-kafka.jsx js/sim-external.jsx
git commit -m "feat: add MockRouteBadge to all simulators showing service/module and mock routing"
```

---

## Phase 2a: Document Structure/Guide Reinforcement

### Task 11: Add common guides to 00-mocking-strategy.md

**Files:**
- Modify: `00-mocking-strategy.md`

- [ ] **Step 1: Add Teardown Strategy section**

Append to `00-mocking-strategy.md` the following new section:

```markdown
## 9. 테스트 데이터 Teardown 전략

### 9.1 서비스별 권장 방식

| 서비스 | 방식 | 이유 |
|--------|------|------|
| platform-svc (Java) | `@Transactional` 롤백 | 대부분 단일 DB 트랜잭션. 속도 우선 |
| engagement-svc (Java) | `@Sql(executionPhase=AFTER, scripts="truncate.sql")` | Redis + DB 혼합 — 롤백만으로 Redis 정리 불가 |
| knowledge-svc (Java) | Testcontainers 재생성 | ES + pgvector + S3 — 컨테이너 재시작이 가장 깔끔 |
| learning-card (Java) | `@Transactional` 롤백 | 단일 DB |
| learning-ai (Python) | `pytest` fixture scope=function | fakeredis + Testcontainers 자동 정리 |

### 9.2 Teardown 순서 주의사항

```sql
-- truncate.sql (FK 의존성 순서 준수)
TRUNCATE TABLE xp_events, user_badges, user_xp_summary CASCADE;
TRUNCATE TABLE shared_decks, group_members, study_groups CASCADE;
-- Redis는 @AfterEach에서 flushAll()
```

### 9.3 안티패턴

- `DELETE FROM` 대신 `TRUNCATE ... CASCADE` 사용 (FK 제약 자동 처리)
- `@DirtiesContext`는 느리므로 최후 수단으로만 사용
```

- [ ] **Step 2: Add Parallel Test Execution section**

```markdown
## 10. 병렬 테스트 실행 안전성

### 10.1 JUnit 5 병렬 설정

```properties
# junit-platform.properties
junit.jupiter.execution.parallel.enabled = true
junit.jupiter.execution.parallel.mode.default = same_thread
junit.jupiter.execution.parallel.mode.classes.default = concurrent
```

### 10.2 포트 충돌 방지

- `@AutoConfigureWireMock(port = 0)` — 랜덤 포트 할당
- `@DynamicPropertySource`로 런타임에 URL 주입
- Testcontainers는 자동으로 랜덤 포트 매핑

### 10.3 Testcontainers `reuse` 모드

```properties
# ~/.testcontainers.properties
testcontainers.reuse.enable=true
```

```java
@Container
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("pgvector/pgvector:pg16")
    .withReuse(true);
```

- 장점: 컨테이너 시작 시간 절약 (첫 실행 후 재사용)
- 주의: 테스트 간 데이터 격리를 teardown으로 보장해야 함
```

- [ ] **Step 3: Add Contract Versioning section**

```markdown
## 11. Contract 버전 관리 전략

### 11.1 Stub 버전 네이밍

```
com.synapse:learning-card:1.2.0:stubs
```

- MAJOR: 하위 호환성 깨지는 변경 (필드 삭제, 타입 변경)
- MINOR: 하위 호환 변경 (필드 추가, optional 필드)
- `+` (latest): 개발 환경에서만 사용

### 11.2 계약 변경 프로세스

1. **Provider가 contract 수정** → PR에 contract diff 포함
2. **Consumer CI에서 새 stub으로 테스트** → 실패 시 사전 감지
3. **양측 합의 후** → Provider가 stub publish, Consumer가 업데이트

### 11.3 하위 호환성 검증

```java
@Test
void contractBackwardCompatibility() {
    // 이전 버전 stub으로도 현재 Consumer가 동작하는지 검증
    // stubsMode = CLASSPATH 로 이전 버전 jar 지정
}
```
```

- [ ] **Step 4: Add Environment Mock Toggle section**

```markdown
## 12. 환경별 Mock 토글 전략

### 12.1 Spring Boot Profile 전환

| 환경 | Profile | Mock 범위 |
|------|---------|-----------|
| 로컬 개발 | `local` | Docker Compose (실제 인프라) + WireMock (외부 API) |
| CI 단위 테스트 | `test` | Testcontainers + WireMock + EmbeddedKafka |
| CI 통합 테스트 | `integration` | Testcontainers + WireMock |
| Staging | `staging` | 실제 인프라 + 실제 외부 API (sandbox) |

### 12.2 Flutter Mock 토글

```dart
// lib/core/config/app_config.dart
class AppConfig {
  static bool get useMock =>
    const bool.fromEnvironment('USE_MOCK', defaultValue: false);
}

// 빌드 명령
// 테스트: flutter test
// Mock 개발: flutter run --dart-define=USE_MOCK=true
// 프로덕션: flutter run (USE_MOCK=false by default)
```
```

- [ ] **Step 5: Add Multi-Tenant Isolation section**

```markdown
## 13. 멀티테넌트 격리 테스트 패턴

### 13.1 시드 데이터

- `tenant-...001` (Free) / `tenant-...002` (Team)
- `user-...001` (tenant-001 소속) / `user-...003` (tenant-002 소속)

### 13.2 공통 격리 테스트 패턴

```java
@Test
void tenantIsolation_shouldReject403WhenAccessingOtherTenantData() {
    // given — tenant-002의 Owner 토큰
    String token = JwtTestFactory.createToken("user-...003", "tenant-...002", "owner");

    // when — tenant-001의 노트에 접근 시도
    mockMvc.perform(get("/notes/note-...001")
        .header("Authorization", "Bearer " + token))
      .andExpect(status().isForbidden())
      .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
}
```

### 13.3 서비스별 적용

- **knowledge-svc**: 노트/그래프 조회 시 tenantId 필터
- **engagement-svc**: 그룹/리더보드 tenantId 격리
- **learning-card**: 덱/카드 조회 시 tenantId WHERE 조건
```

- [ ] **Step 6: Commit**

```bash
git add 00-mocking-strategy.md
git commit -m "docs: add teardown, parallel execution, contract versioning, toggle, and tenant isolation guides"
```

---

### Task 12: Add Mock Route Map section to service documents

**Files:**
- Modify: `01-platform-svc-mocking.md` through `07-external-api-mocking.md`

- [ ] **Step 1: Add Mock Route Map to 01-platform-svc-mocking.md**

Append to the document:

```markdown
## 7. Mock Route Map

| # | 서비스/모듈 | 실제 경로 (Production) | Mock 대체 (Test) | Mock 도구 | Fixture 파일 |
|---|-----------|----------------------|-----------------|-----------|-------------|
| 1 | platform-svc / auth | `POST https://oauth2.googleapis.com/token` | `POST http://localhost:${wiremock.port}/google/token` | WireMock | `__files/oauth/google-token-success.json` |
| 2 | platform-svc / auth | `GET https://openidconnect.googleapis.com/v1/userinfo` | `GET http://localhost:${wiremock.port}/google/userinfo` | WireMock | `__files/oauth/google-userinfo.json` |
| 3 | platform-svc / auth | Redis `refresh_token:{userId}` | Testcontainers Redis | Testcontainers | (런타임 생성) |
| 4 | platform-svc / billing | `POST https://api.stripe.com/v1/checkout/sessions` | `POST http://localhost:${wiremock.port}/stripe/v1/checkout/sessions` | WireMock | `__files/stripe/checkout-session.json` |
| 5 | platform-svc / billing | Stripe Webhook → `/billing/webhooks` | WireMock + 수동 POST | WireMock | `__files/stripe/webhook-checkout-completed.json` |
| 6 | platform-svc / notification | `POST https://fcm.googleapis.com/v1/.../messages:send` | `POST http://localhost:${wiremock.port}/fcm/v1/.../messages:send` | WireMock | `__files/fcm/send-success.json` |
| 7 | platform-svc / notification | `POST https://email.us-east-1.amazonaws.com` (SES) | `POST http://localhost:${wiremock.port}/ses` | WireMock | `__files/ses/send-success.xml` |
| 8 | platform-svc / auth | Kafka `user.registered` (Producer) | EmbeddedKafka | EmbeddedKafka | `fixtures/kafka/user-registered.json` |
| 9 | platform-svc / audit | Kafka 7개 토픽 (Consumer) | EmbeddedKafka | EmbeddedKafka | `fixtures/kafka/{topic}.json` |
```

- [ ] **Step 2: Add Mock Route Map to remaining documents (02-07)**

Repeat the same pattern for each document with service-specific routes. Each document gets a `## Mock Route Map` section with the appropriate table. Reference the spec Section 7.3 for the complete mapping per tab.

- [ ] **Step 3: Commit**

```bash
git add 01-platform-svc-mocking.md 02-engagement-svc-mocking.md 03-knowledge-svc-mocking.md 04-learning-svc-mocking.md 05-frontend-mocking.md 06-kafka-event-mocking.md 07-external-api-mocking.md
git commit -m "docs: add Mock Route Map section to all service documents"
```

---

### Task 13: Add error handling and Kafka DLQ sections

**Files:**
- Modify: `01-platform-svc-mocking.md`, `02-engagement-svc-mocking.md`, `03-knowledge-svc-mocking.md`, `04-learning-svc-mocking.md`
- Modify: `06-kafka-event-mocking.md`

- [ ] **Step 1: Add Kafka Consumer Failure Handling section to doc 06**

Append to `06-kafka-event-mocking.md`:

```markdown
## 6. Kafka Consumer 실패 처리 (DLQ)

### 6.1 DLQ 네이밍 규칙

```
{original-topic}.DLQ
```

예: `note.created.DLQ`, `card.reviewed.DLQ`

### 6.2 재시도 정책

| 항목 | 값 |
|------|-----|
| 최대 재시도 | 3회 |
| 백오프 | exponential (1s, 2s, 4s) |
| DLQ 전송 조건 | 3회 모두 실패 시 |

### 6.3 Spring Kafka 설정

```java
@Bean
public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
    var factory = new ConcurrentKafkaListenerContainerFactory<String, Object>();
    factory.setConsumerFactory(consumerFactory());
    factory.setCommonErrorHandler(new DefaultErrorHandler(
        new DeadLetterPublishingRecoverer(kafkaTemplate,
            (record, ex) -> new TopicPartition(record.topic() + ".DLQ", record.partition())),
        new ExponentialBackOff(1000L, 2.0) {{ setMaxElapsedTime(10000L); }}
    ));
    return factory;
}
```

### 6.4 DLQ 테스트 패턴

```java
@Test
void consumeNote_whenProcessingFails_shouldSendToDLQ() {
    // given — 처리 실패하는 잘못된 이벤트
    String poisonPill = """
        {"specversion":"1.0","type":"note.created","data":{"noteId":null}}
        """;

    kafkaTestHelper.publishAndWait("note.created", "key-1", poisonPill, Duration.ofSeconds(5));

    // then — DLQ에 도착
    List<ConsumerRecord<String, Object>> dlqRecords =
        kafkaTestHelper.consumeMessages("note.created.DLQ", 1, Duration.ofSeconds(10));
    assertThat(dlqRecords).hasSize(1);
}
```
```

- [ ] **Step 2: Add `user.deleted` event to doc 06 catalog**

Add to the topic fixtures section in `06-kafka-event-mocking.md`:

```markdown
### 3.6 user.deleted

| 항목 | 값 |
|------|-----|
| Producer | platform-svc/auth |
| Consumers | knowledge-svc/note (soft delete) |

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000302",
  "source": "synapse/platform-svc",
  "type": "user.deleted",
  "subject": "users/user-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "reason": "user_requested",
    "deletedAt": "2026-01-15T10:00:00Z"
  }
}
```
```

- [ ] **Step 3: Add error handling test matrix to service docs (01-04)**

Each service doc gets a section like:

```markdown
## Error Handling Test Matrix

| API / Event | 에러 코드 | 재시도 정책 | 테스트 존재 |
|-------------|----------|------------|-----------|
| POST /auth/login | 401 UNAUTHORIZED | N/A (즉시 반환) | ✅ |
| Stripe Webhook | 400 INVALID_SIGNATURE | N/A (거부) | ✅ |
| FCM Send | 404 UNREGISTERED | 디바이스 토큰 삭제 | ❌ (추가 필요) |
| Kafka consumer | 처리 실패 | 3회 재시도 → DLQ | ❌ (추가 필요) |
```

- [ ] **Step 4: Commit**

```bash
git add 01-platform-svc-mocking.md 02-engagement-svc-mocking.md 03-knowledge-svc-mocking.md 04-learning-svc-mocking.md 06-kafka-event-mocking.md
git commit -m "docs: add Kafka DLQ strategy, user.deleted fixture, and error handling matrices"
```

---

### Task 14: Add streaming and circuit breaker guides to doc 07

**Files:**
- Modify: `07-external-api-mocking.md`

- [ ] **Step 1: Add Streaming Response Mocking section**

Append to `07-external-api-mocking.md`:

```markdown
## 8. 스트리밍 응답 (SSE) 목킹

### 8.1 WireMock chunkedDribbleDelay

```java
stubFor(post("/anthropic/v1/messages")
    .withRequestBody(containing("stream"))
    .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "text/event-stream")
        .withBody("""
            event: content_block_delta
            data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"머신"}}

            event: content_block_delta
            data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"러닝은"}}

            event: message_stop
            data: {"type":"message_stop"}

            """)
        .withChunkedDribbleDelay(3, 500)
    ));
```

### 8.2 Python respx 스트리밍

```python
import respx, httpx

@respx.mock
async def test_streaming_qa():
    sse_body = (
        'event: content_block_delta\n'
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"답변"}}\n\n'
        'event: message_stop\n'
        'data: {"type":"message_stop"}\n\n'
    )
    respx.post("https://api.anthropic.com/v1/messages").mock(
        return_value=httpx.Response(200, content=sse_body,
            headers={"content-type": "text/event-stream"})
    )
```
```

- [ ] **Step 2: Add Circuit Breaker Test Pattern section**

```markdown
## 9. Circuit Breaker 테스트 패턴

### 9.1 Resilience4j 설정 (application-test.yml)

```yaml
resilience4j:
  circuitbreaker:
    instances:
      stripe:
        sliding-window-size: 5
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
```

### 9.2 WireMock 시나리오 기반 테스트

```java
@Test
void stripe_circuitBreaker_shouldOpenAfterFailures() {
    // given — 첫 3번은 503
    stubFor(post(urlPathEqualTo("/stripe/v1/checkout/sessions"))
        .inScenario("cb-test").whenScenarioStateIs(STARTED)
        .willReturn(aResponse().withStatus(503))
        .willSetStateTo("fail-1"));
    // ... fail-2, fail-3

    // when — 4번째 호출
    // then — CircuitBreakerOpenException 발생 (WireMock 호출 없이)
    assertThrows(CallNotPermittedException.class, () ->
        stripeClient.createCheckoutSession(request));
}
```
```

- [ ] **Step 3: Commit**

```bash
git add 07-external-api-mocking.md
git commit -m "docs: add streaming SSE mocking and circuit breaker test patterns"
```

---

## Phase 2b: Core Simulator Logic Accuracy

### Task 15: Upgrade SM2Simulator with custom initial values

**Files:**
- Modify: `js/sim-engagement.jsx:20-106`

- [ ] **Step 1: Add initial value controls**

Replace the `SM2Simulator` function (lines 20-106) with a version that has sliders for initial EF, interval, and reps:

Add state for custom initial values at the top of the function:

```jsx
function SM2Simulator() {
  const [initEF, setInitEF] = useState(2.5);
  const [initInterval, setInitInterval] = useState(7);
  const [initReps, setInitReps] = useState(3);
  const [ef, setEf] = useState(initEF);
  const [interval, setInterval_] = useState(initInterval);
  const [reps, setReps] = useState(initReps);
  const [history, setHistory] = useState([]);
```

Note: rename `setInterval` to `setInterval_` to avoid shadowing the global.

- [ ] **Step 2: Add initial value sliders before the rating buttons**

After the StatCard grid, before the rating buttons, add:

```jsx
      <div className="card" style={{ marginBottom: 16, padding: 12 }}>
        <div className="tiny muted" style={{ marginBottom: 8 }}>초기값 설정 (리셋 시 적용)</div>
        <div className="grid-3" style={{ gap: 12 }}>
          <Field label={`초기 EF: ${initEF.toFixed(1)}`}>
            <input type="range" min="1.3" max="3.0" step="0.1" value={initEF} className="slider" onChange={e => setInitEF(+e.target.value)} />
          </Field>
          <Field label={`초기 Interval: ${initInterval}일`}>
            <input type="range" min="1" max="30" step="1" value={initInterval} className="slider" onChange={e => setInitInterval(+e.target.value)} />
          </Field>
          <Field label={`초기 Reps: ${initReps}`}>
            <input type="range" min="0" max="10" step="1" value={initReps} className="slider" onChange={e => setInitReps(+e.target.value)} />
          </Field>
        </div>
      </div>
```

- [ ] **Step 3: Update reset to use custom initial values**

```jsx
  const reset = () => {
    setEf(initEF); setInterval_(initInterval); setReps(initReps); setHistory([]);
  };
```

- [ ] **Step 4: Use BASE_DATE instead of hardcoded date**

In the `submit` function, replace:

```jsx
    const dueDate = new Date(Date.UTC(2026, 0, 15));
```

With:

```jsx
    const dueDate = new Date(BASE_DATE);
```

- [ ] **Step 5: Add SM-2 formula branch highlight**

After each rating submission, show which formula branch was taken. Add to the history entry:

```jsx
    setHistory(h => [...h, {
      idx: h.length + 1,
      rating,
      oldEF: ef,
      oldInterval: interval,
      newEF: result.ef,
      newInterval: result.interval,
      due,
      branch: rating < 3 ? "reset (rating < 3: interval=1, reps=0)" :
              reps === 0 ? "first (reps=0: interval=1)" :
              reps === 1 ? "second (reps=1: interval=6)" :
              `multiply (interval × EF = ${interval} × ${result.ef} ≈ ${result.interval})`
    }]);
```

In the history table, add a `branch` column:

```jsx
<thead>
  <tr><th>#</th><th>rating</th><th>EF</th><th>interval</th><th>next due</th><th>분기</th><th>kafka</th></tr>
</thead>
```

And the cell:

```jsx
<td className="tiny muted">{h.branch}</td>
```

- [ ] **Step 6: Verify in browser**

Open Engagement tab. SM2 Simulator should show initial value sliders. Submitting ratings should show which formula branch was taken in the history table.

- [ ] **Step 7: Commit**

```bash
git add js/sim-engagement.jsx
git commit -m "feat: add custom initial values and formula branch display to SM2 simulator"
```

---

### Task 16: Add ErrorScenarioToggle to Stripe Webhook

**Files:**
- Modify: `js/sim-platform.jsx`

- [ ] **Step 1: Add error scenario state and toggle**

In `StripeWebhookSimulator`, add state:

```jsx
  const [errorScenario, setErrorScenario] = useState("none");
  const errorScenarios = [
    { id: "none", label: "없음 (success)" },
    { id: "sig_fail", label: "400 Signature verification failed" }
  ];
```

- [ ] **Step 2: Modify fire function to handle error**

In the `fire` function, after the POST log entry:

```jsx
    setTimeout(() => {
      if (errorScenario === "sig_fail") {
        setLog(l => [...l, { t: new Date().toLocaleTimeString(), tag: "ERR", kind: "err", msg: `400 Bad Request — Stripe-Signature 검증 실패 · <code>No signatures found matching the expected signature for payload</code>` }]);
        setLog(l => [...l, { t: new Date().toLocaleTimeString(), tag: "HINT", kind: "info", msg: `복구: webhook secret 확인 → <code>whsec_...</code> 값이 Stripe Dashboard와 일치하는지 확인` }]);
        return;
      }
      // ... existing success flow
```

- [ ] **Step 3: Add ErrorScenarioToggle to UI**

In the JSX, after the webhook event buttons and before the reset button:

```jsx
          <div style={{ marginTop: 12 }}>
            <ErrorScenarioToggle scenarios={errorScenarios} value={errorScenario} onChange={setErrorScenario} />
          </div>
```

- [ ] **Step 4: Verify in browser**

Set error scenario to "400 Signature verification failed". Fire any webhook event. The log should show error + recovery hint instead of success flow.

- [ ] **Step 5: Commit**

```bash
git add js/sim-platform.jsx
git commit -m "feat: add signature verification error scenario to Stripe Webhook simulator"
```

---

### Task 17: Add ErrorScenarioToggle to SemanticCache and AICardGenerator

**Files:**
- Modify: `js/sim-learning.jsx`

- [ ] **Step 1: Add error scenario to SemanticCacheSimulator**

In `SemanticCacheSimulator`, add state:

```jsx
  const [errorScenario, setErrorScenario] = useState("none");
  const errorScenarios = [
    { id: "none", label: "없음 (정상)" },
    { id: "cache_error", label: "Redis 연결 실패 (캐시 우회)" }
  ];
```

In `submitQuery`, after the embedding log entry, add error branch:

```jsx
    if (errorScenario === "cache_error") {
      entries.push({ t, tag: "ERR", kind: "err", msg: `Redis ConnectionError — 캐시 조회 불가` });
      entries.push({ t, tag: "BYPASS", kind: "info", msg: `캐시 우회 → Claude API 직접 호출 (graceful degradation)` });
      entries.push({ t, tag: "CLAUDE", kind: "send", msg: `Claude API 호출 (캐시 없이)` });
      setLog(l => [...l, ...entries]);
      return;
    }
```

Add toggle UI before the submit button.

- [ ] **Step 2: Add error scenario to AICardGeneratorMock**

In `AICardGeneratorMock`, add state:

```jsx
  const [errorScenario, setErrorScenario] = useState("none");
  const errorScenarios = [
    { id: "none", label: "없음 (정상)" },
    { id: "overloaded", label: "529 Overloaded" },
    { id: "token_exceeded", label: "400 Token limit exceeded" }
  ];
```

In `generate`, handle errors:

```jsx
  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      if (errorScenario === "overloaded") {
        setGenerated({ error: true, status: 529, body: { type: "error", error: { type: "overloaded_error", message: "Overloaded" } } });
        setLoading(false);
        return;
      }
      if (errorScenario === "token_exceeded") {
        setGenerated({ error: true, status: 400, body: { type: "error", error: { type: "invalid_request_error", message: "max_tokens exceeds model limit" } } });
        setLoading(false);
        return;
      }
      // ... existing success logic
```

In the result display, handle error state:

```jsx
          {generated?.error ? (
            <div>
              <div className="row" style={{ marginBottom: 8 }}>
                <Pill tone="red">{generated.status} Error</Pill>
              </div>
              <JsonView data={generated.body} max={20} />
              <div className="tiny muted" style={{ marginTop: 12 }}>
                {generated.status === 529 ? "재시도: exponential backoff (1s, 2s, 4s). 3회 실패 시 사용자에게 에러 표시." :
                 "입력 텍스트를 줄이거나 max_tokens 설정을 확인하세요."}
              </div>
            </div>
          ) : generated ? (
            // ... existing success display
```

- [ ] **Step 3: Verify in browser**

Open Learning tab. Test semantic cache with Redis error — should show bypass flow. Test AI card generator with 529 — should show error response JSON.

- [ ] **Step 4: Commit**

```bash
git add js/sim-learning.jsx
git commit -m "feat: add error scenarios to SemanticCache and AICardGenerator simulators"
```

---

## Phase 3: Remaining Simulator Enhancements

### Task 18: Add streak button and XP input to XPSimulator

**Files:**
- Modify: `js/sim-engagement.jsx`

- [ ] **Step 1: Add streak increment action and XP input**

In the `XPSimulator` function, after the `XP_ACTIONS` buttons list (line 219), add:

```jsx
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <button className="btn" style={{ flex: 1 }} onClick={() => {
              setState(prev => {
                const newState = { ...prev, streak: prev.streak + 1 };
                const newBadges = new Set(prev.badges);
                const events = [{ t: new Date().toLocaleTimeString(), tag: "STREAK", kind: "ok", msg: `스트릭 +1 → ${newState.streak}일` }];
                for (const b of BADGES) {
                  if (!newBadges.has(b.code) && b.check(newState)) {
                    newBadges.add(b.code);
                    events.push({ t: new Date().toLocaleTimeString(), tag: "BADGE", kind: "ok", msg: `${b.icon} gamification.badge.earned · <b>${b.name}</b> (+${b.xpReward} XP)` });
                    newState.xp += b.xpReward;
                  }
                }
                newState.badges = newBadges;
                newState.events = [...prev.events, ...events];
                setTimeout(() => SimBus.emit("xp.changed", { xp: newState.xp }), 0);
                return newState;
              });
            }}>
              스트릭 +1일
            </button>
            <input className="input" type="number" style={{ width: 80 }} placeholder="XP"
              onKeyDown={e => {
                if (e.key === "Enter" && e.target.value) {
                  const xpVal = parseInt(e.target.value);
                  if (isNaN(xpVal)) return;
                  setState(prev => {
                    const newState = { ...prev, xp: prev.xp + xpVal };
                    const events = [{ t: new Date().toLocaleTimeString(), tag: "XP", kind: "ok", msg: `수동 XP +${xpVal}` }];
                    newState.events = [...prev.events, ...events];
                    setTimeout(() => SimBus.emit("xp.changed", { xp: newState.xp }), 0);
                    return newState;
                  });
                  e.target.value = "";
                }
              }} />
            <span className="tiny muted">Enter로 XP 추가</span>
          </div>
```

- [ ] **Step 2: Verify in browser**

Click "스트릭 +1일" repeatedly until 30 → STREAK_30 badge should trigger. Type a number in the XP input and press Enter → XP should increase.

- [ ] **Step 3: Commit**

```bash
git add js/sim-engagement.jsx
git commit -m "feat: add streak increment button and manual XP input to XPSimulator"
```

---

### Task 19: Add wikilink alias syntax support

**Files:**
- Modify: `js/sim-knowledge.jsx:4-17`

- [ ] **Step 1: Update parseWikilinks to support aliases**

Replace the `parseWikilinks` function (lines 4-17):

```jsx
function parseWikilinks(text) {
  const noCodeBlocks = text.replace(/```[\s\S]*?```/g, m => " ".repeat(m.length));
  const noInlineCode = noCodeBlocks.replace(/`[^`\n]*`/g, m => " ".repeat(m.length));
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
```

- [ ] **Step 2: Update UI to show alias**

In `WikilinkParser`, in the extracted links display (line 63):

```jsx
            links.map((l, i) => <Pill key={i} tone="cyan">{l.alias ? `${l.target} (→ ${l.alias})` : l.target}</Pill>)
```

- [ ] **Step 3: Update the Kafka event to include alias**

```jsx
        <JsonView data={{
          noteId: "note-...001",
          links: links.map(l => ({ targetTitle: l.target, ...(l.alias ? { alias: l.alias } : {}) }))
        }} max={20} />
```

- [ ] **Step 4: Add alias example to default text**

Add to the default textarea value:

```
[[딥러닝 기초|DL 입문]] 참조 (별칭 링크)
```

- [ ] **Step 5: Verify in browser**

Open Knowledge tab. The default text should show alias links parsed correctly with `(→ alias)` display.

- [ ] **Step 6: Commit**

```bash
git add js/sim-knowledge.jsx
git commit -m "feat: add wikilink alias syntax support [[target|alias]]"
```

---

### Task 20: Add back button to OAuth Flow Simulator

**Files:**
- Modify: `js/sim-external.jsx:43-78`

- [ ] **Step 1: Add back function**

In `OAuthFlowSimulator`, after the `next` function, add:

```jsx
  const back = () => {
    if (error) { setError(null); return; }
    if (step > 0) setStep(step - 1);
  };
```

- [ ] **Step 2: Update navigation buttons**

Replace the navigation buttons (line 127-130):

```jsx
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn" onClick={back} disabled={step === 0 && !error}>
              ← 이전
            </button>
            <button className="btn btn-primary" onClick={next} disabled={step >= steps.length - 1 || !!error}>
              {step === 0 ? "시작 →" : "다음 단계 →"}
            </button>
            {error && <button className="btn btn-primary" onClick={() => { setError(null); }}>재시도</button>}
            <button className="btn btn-ghost" onClick={reset}>↻ 초기화</button>
          </div>
```

- [ ] **Step 3: Make step indicators clickable**

In the steps list rendering, make each flow-node clickable for completed steps:

Change the `<div key={i} className={"flow-node"...}` to include onClick:

```jsx
                <div key={i} className={"flow-node" + (isCurrent ? " active" : "")} 
                  style={{
                    borderColor: hasError ? "var(--red)" : isCurrent ? "var(--cyan)" : isDone ? "var(--cyan-dim)" : "var(--line-1)",
                    opacity: i <= step ? 1 : 0.4,
                    cursor: isDone ? "pointer" : "default"
                  }}
                  onClick={() => { if (isDone) { setStep(i); setError(null); } }}>
```

- [ ] **Step 4: Verify in browser**

Open External tab. Navigate through OAuth steps. Click "← 이전" to go back. Click completed step indicators to jump. Trigger error then click "재시도".

- [ ] **Step 5: Commit**

```bash
git add js/sim-external.jsx
git commit -m "feat: add back navigation, retry, and clickable step indicators to OAuth simulator"
```

---

### Task 21: Add manual step mode to EventFlowSimulator

**Files:**
- Modify: `js/sim-kafka.jsx:186-265`

- [ ] **Step 1: Add manual mode toggle**

In `EventFlowSimulator`, add state:

```jsx
  const [manualMode, setManualMode] = useState(false);
```

- [ ] **Step 2: Add manual step advance**

Add a `nextStep` function:

```jsx
  const nextStep = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };
```

- [ ] **Step 3: Update run function to respect manual mode**

```jsx
  const run = () => {
    if (manualMode) {
      setStep(0);
      setRunning(true);
      return;
    }
    // existing auto-advance logic
    setStep(-1);
    setRunning(true);
    steps.forEach((s, i) => {
      setTimeout(() => setStep(i), s.delay);
    });
    setTimeout(() => setRunning(false), steps[steps.length - 1].delay + 200);
  };
```

- [ ] **Step 4: Add toggle and manual next button to UI**

In the control row, add the toggle and conditional button:

```jsx
        <Switch checked={manualMode} onChange={setManualMode} label="수동 모드" />
        {manualMode && running && (
          <button className="btn" onClick={nextStep} disabled={step >= steps.length - 1}>
            다음 스텝 →
          </button>
        )}
```

- [ ] **Step 5: Verify in browser**

Open Kafka tab. Toggle "수동 모드" on. Click "시작". Click "다음 스텝 →" to advance one step at a time.

- [ ] **Step 6: Commit**

```bash
git add js/sim-kafka.jsx
git commit -m "feat: add manual step mode to EventFlowSimulator"
```

---

## Phase 4: HTML Sync + Executability + Verification

### Task 22: Sync HTML docs with reinforced markdown

**Files:**
- Modify: `docs/00-strategy.html` through `docs/07-external.html`

- [ ] **Step 1: Convert new markdown sections to HTML**

For each reinforced markdown file (00-07), convert the new sections into HTML following the existing `.doc-shell` / `.doc-body` structure pattern:

- New sections get `<h2>` with Korean slug `id` attributes
- Tables use `.md-table` class
- Code blocks use `.code-block` with `data-lang` attribute
- Add anchor IDs for simulator deep-linking

- [ ] **Step 2: Add Mock Route Map tables to each HTML doc**

Each HTML doc gets the Mock Route Map as a `.md-table`:

```html
<h2 id="mock-route-map">Mock Route Map</h2>
<table class="md-table">
  <thead>
    <tr><th>#</th><th>서비스/모듈</th><th>실제 경로</th><th>Mock 대체</th><th>Mock 도구</th><th>Fixture 파일</th></tr>
  </thead>
  <tbody>
    <!-- service-specific rows -->
  </tbody>
</table>
```

- [ ] **Step 3: Verify each HTML page**

Open each `docs/XX-name.html` directly in browser. Confirm new sections render correctly with proper styling.

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs: sync HTML pages with reinforced markdown content"
```

---

### Task 23: Fix document executability issues

**Files:**
- Modify: `06-kafka-event-mocking.md`
- Modify: `04-learning-svc-mocking.md`

- [ ] **Step 1: Fix KafkaTestHelper.publishAndWait**

In `06-kafka-event-mocking.md`, find the `publishAndWait` method and add the correct Awaitility polling condition:

```java
public <T> void publishAndWait(String topic, String key, T value, Duration timeout) {
    kafkaTemplate.send(topic, key, value).get(timeout.toMillis(), TimeUnit.MILLISECONDS);
    Awaitility.await()
        .atMost(timeout)
        .pollInterval(Duration.ofMillis(100))
        .until(() -> {
            // Poll consumer to verify message was consumed
            return consumerRecords.containsKey(topic) && !consumerRecords.get(topic).isEmpty();
        });
}
```

- [ ] **Step 2: Complete HybridSearchService placeholder in doc 04**

In `04-learning-svc-mocking.md`, find the `HybridSearchService(...)` placeholder and complete it:

```python
class HybridSearchService:
    def __init__(self, pg_pool, es_client, embedding_service):
        self.pg_pool = pg_pool
        self.es_client = es_client
        self.embedding_service = embedding_service

    async def search(self, query: str, k: int = 60) -> list[dict]:
        embedding = await self.embedding_service.generate(query)
        semantic_results = await self._pgvector_search(embedding)
        bm25_results = await self._es_search(query)
        return self._rrf_merge(semantic_results, bm25_results, k)
```

- [ ] **Step 3: Commit**

```bash
git add 04-learning-svc-mocking.md 06-kafka-event-mocking.md
git commit -m "docs: fix KafkaTestHelper polling condition and complete HybridSearchService"
```

---

### Task 24: Final verification

**Files:** (none — verification only)

- [ ] **Step 1: Browser console check**

Open `index.html` in browser. Navigate through all 8 tabs. Check browser console for any JavaScript errors. Fix any errors found.

- [ ] **Step 2: EventBus verification**

On Engagement tab:
1. Click XP actions in SIM 08
2. Scroll to SIM 09 (Leaderboard) — "YOU" row should reflect updated XP
3. Click reset on SIM 08 — leaderboard should reset to defaults

- [ ] **Step 3: Error scenario verification**

Test each ErrorScenarioToggle:
- Platform tab: Stripe Webhook → "signature_verification_failed"
- Learning tab: Semantic Cache → "Redis 연결 실패"
- Learning tab: AI Card Generator → "529 Overloaded" and "400 Token limit exceeded"

- [ ] **Step 4: MockRouteBadge verification**

Click the "MOCK ROUTE" badge on each simulator. Verify service/module, FROM, TO, FILE info displays correctly.

- [ ] **Step 5: Data consistency check**

Verify:
- Frontend tab shows actual response count (not "49+")
- CloudEvents Builder shows fixed UUIDs (not random)
- Korean text in Chunking Visualizer shows reasonable token counts
- Time fixture playground has working copy button

- [ ] **Step 6: HTML-MD sync check**

For each doc (00-07), open both the `.md` file and the `docs/XX.html` file. Confirm new sections are present in both.

- [ ] **Step 7: Final commit (if fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during final verification"
```
