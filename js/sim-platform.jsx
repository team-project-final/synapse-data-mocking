// ===== Doc 01: Platform Service =====

// Stripe Webhook → Subscription State Machine
const STRIPE_EVENTS = [
  {
    id: "checkout.session.completed",
    label: "checkout.session.completed",
    desc: "Pro 결제 완료 → 구독 활성화",
    effect: (state) => ({ ...state, plan: "pro", status: "active", lastEvent: "checkout.session.completed" }),
    kafkaEvent: { type: "billing.subscription.changed", action: "subscribed", newPlan: "pro" }
  },
  {
    id: "invoice.payment_succeeded",
    label: "invoice.payment_succeeded",
    desc: "월간 결제 성공 → 다음 주기로 갱신",
    effect: (state) => ({ ...state, status: "active", currentPeriodEnd: "2026-03-15", lastEvent: "invoice.payment_succeeded" }),
    kafkaEvent: { type: "billing.subscription.changed", action: "renewed", plan: "pro" }
  },
  {
    id: "invoice.payment_failed",
    label: "invoice.payment_failed",
    desc: "결제 실패 → past_due 상태",
    effect: (state) => ({ ...state, status: "past_due", lastEvent: "invoice.payment_failed" }),
    kafkaEvent: { type: "billing.subscription.changed", action: "payment_failed", plan: state => state.plan }
  },
  {
    id: "customer.subscription.deleted",
    label: "customer.subscription.deleted",
    desc: "구독 해지 → free 다운그레이드",
    effect: (state) => ({ ...state, plan: "free", status: "canceled", lastEvent: "customer.subscription.deleted" }),
    kafkaEvent: { type: "billing.subscription.changed", action: "canceled", newPlan: "free" }
  }
];

function StripeWebhookSimulator() {
  const initialState = { plan: "free", status: "active", currentPeriodEnd: "2026-02-15", lastEvent: null };
  const [state, setState] = useState(initialState);
  const [log, setLog] = useState([]);
  const [signature, setSignature] = useState("whsec_test_mock_secret");

  const fire = (evt) => {
    const t = new Date().toLocaleTimeString();
    setLog(l => [...l, { t, tag: "POST", kind: "send", msg: `/billing/webhooks · <code>${evt.id}</code>` }]);
    setTimeout(() => {
      setLog(l => [...l, { t: new Date().toLocaleTimeString(), tag: "OK", kind: "ok", msg: `Stripe-Signature 검증 통과` }]);
      setState(prev => evt.effect(prev));
      setTimeout(() => {
        const ke = evt.kafkaEvent;
        setLog(l => [...l, { t: new Date().toLocaleTimeString(), tag: "KAFKA→", kind: "recv", msg: `<code>${ke.type}</code> · action=${ke.action}` }]);
      }, 300);
    }, 200);
  };

  const reset = () => { setState(initialState); setLog([]); };

  const statusColor = state.status === "active" ? "green" : state.status === "past_due" ? "amber" : "red";
  const planColor = state.plan === "pro" ? "cyan" : state.plan === "team" ? "violet" : "";

  return (
    <div>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <StatCard label="Plan" value={state.plan} tone={state.plan === "pro" ? "cyan" : ""} />
        <StatCard label="Status" value={state.status} tone={state.status === "active" ? "" : "amber"} />
        <StatCard label="Period End" value={state.currentPeriodEnd} hint={state.lastEvent || "no events yet"} />
      </div>

      <div className="grid-2">
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Webhook 이벤트 발사</div>
          <div className="col" style={{ gap: 8 }}>
            {STRIPE_EVENTS.map(e => (
              <button key={e.id} className="btn" style={{ justifyContent: "space-between", textAlign: "left" }} onClick={() => fire(e)}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{e.label}</span>
                <span className="tiny muted" style={{ fontWeight: 400 }}>{e.desc}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={reset}>↻ 초기화</button>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>이벤트 로그</div>
          <Log entries={log} height={280} />
          <div className="tiny muted" style={{ marginTop: 8 }}>
            <code>POST /billing/webhooks</code> · 서명: <code>{signature.slice(0, 20)}…</code>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quiet Hours Checker
function QuietHoursChecker() {
  const [hourKST, setHourKST] = useState(23);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const [enabled, setEnabled] = useState(true);

  const isQuiet = useMemo(() => {
    if (!enabled) return false;
    const [sh] = quietStart.split(":").map(Number);
    const [eh] = quietEnd.split(":").map(Number);
    if (sh > eh) return hourKST >= sh || hourKST < eh;
    return hourKST >= sh && hourKST < eh;
  }, [hourKST, quietStart, quietEnd, enabled]);

  return (
    <div className="grid-2">
      <div>
        <Field label={`현재 시각 (KST): ${String(hourKST).padStart(2, "0")}:00`}>
          <input type="range" min="0" max="23" value={hourKST} className="slider" onChange={e => setHourKST(+e.target.value)} />
        </Field>
        <div className="grid-2" style={{ marginTop: 12, gap: 12 }}>
          <Field label="Quiet 시작">
            <select className="select" value={quietStart} onChange={e => setQuietStart(e.target.value)}>
              {[20,21,22,23,0].map(h => <option key={h} value={String(h).padStart(2,"0")+":00"}>{String(h).padStart(2,"0")}:00</option>)}
            </select>
          </Field>
          <Field label="Quiet 종료">
            <select className="select" value={quietEnd} onChange={e => setQuietEnd(e.target.value)}>
              {[6,7,8,9,10].map(h => <option key={h} value={String(h).padStart(2,"0")+":00"}>{String(h).padStart(2,"0")}:00</option>)}
            </select>
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Switch checked={enabled} onChange={setEnabled} label="quiet_hours_enabled = true" />
        </div>
        <div className="tiny muted" style={{ marginTop: 12 }}>
          기본 설정: 22:00–08:00 Asia/Seoul · <code>notification_preferences.quiet_hours_enabled</code> 컬럼으로 사용자별 ON/OFF
        </div>
      </div>
      <div>
        <div className="label" style={{ marginBottom: 8 }}>현재 동작</div>
        <div className="card" style={{ minHeight: 240, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", borderColor: isQuiet ? "var(--amber)" : "var(--green)" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{isQuiet ? "🌙" : "🔔"}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: isQuiet ? "var(--amber-bright)" : "var(--green)" }}>
            {isQuiet ? "Queued" : "Sent immediately"}
          </div>
          <div className="tiny muted" style={{ marginTop: 8, maxWidth: 280 }}>
            {isQuiet
              ? "FCM 호출 없음. notifications.status = 'queued'로 저장. quiet 종료 시점에 발송."
              : "FCM/SES 호출 즉시 발송. notifications.status = 'sent'."}
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <Pill tone={isQuiet ? "amber" : "green"}>
              {isQuiet ? "verify(0, postRequestedFor(/fcm/...))" : "verify(1+, postRequestedFor(/fcm/...))"}
            </Pill>
          </div>
        </div>
      </div>
    </div>
  );
}

// JWT Test Token Builder
function JwtBuilder() {
  const users = [
    { id: "user-00000000-0000-0000-0000-000000000001", role: "user", email: "user1@example.com", label: "일반 사용자" },
    { id: "user-00000000-0000-0000-0000-000000000003", role: "owner", email: "team-owner@example.com", label: "Team Owner" },
    { id: "user-00000000-0000-0000-0000-000000000005", role: "admin", email: "admin@example.com", label: "Admin" }
  ];
  const [userIdx, setUserIdx] = useState(0);
  const [expiry, setExpiry] = useState("15");
  const [expired, setExpired] = useState(false);

  const u = users[userIdx];
  const issuedAt = expired ? "2026-01-14T10:00:00Z" : "2026-01-15T10:00:00Z";
  const expAt = expired ? "2026-01-14T10:15:00Z" : `2026-01-15T${(10 + Math.floor(+expiry / 60)).toString().padStart(2,"0")}:${(+expiry % 60).toString().padStart(2,"0")}:00Z`;

  const payload = {
    sub: u.id,
    tenantId: "tenant-00000000-0000-0000-0000-000000000001",
    role: u.role,
    email: u.email,
    iat: issuedAt,
    exp: expAt
  };

  // Fake-encode
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "");
  const fakeSig = "mock_signature_" + (userIdx + 1) + (expired ? "_EXPIRED" : "");
  const jwt = `${header}.${body}.${fakeSig}`;

  return (
    <div className="grid-2">
      <div>
        <Field label="사용자">
          <select className="select" value={userIdx} onChange={e => setUserIdx(+e.target.value)}>
            {users.map((u, i) => <option key={i} value={i}>{u.label} ({u.role})</option>)}
          </select>
        </Field>
        <div style={{ marginTop: 12 }}>
          <Field label="만료 (분)">
            <select className="select" value={expiry} onChange={e => setExpiry(e.target.value)}>
              <option value="15">15분 (기본 access token)</option>
              <option value="60">60분</option>
              <option value="10080">7일 (refresh token)</option>
            </select>
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Switch checked={expired} onChange={setExpired} label="만료된 토큰 생성 (createExpiredToken)" />
        </div>
        <div className="tiny muted" style={{ marginTop: 12 }}>
          시크릿: <code>test-jwt-secret-key-must-be-at-least-256-bits-long-for-hs256</code>
        </div>
      </div>
      <div>
        <div className="label" style={{ marginBottom: 8 }}>JWT 페이로드</div>
        <JsonView data={payload} max={28} />
        <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>Encoded (Authorization 헤더용)</div>
        <div className="code" style={{ wordBreak: "break-all", whiteSpace: "pre-wrap", fontSize: 11 }}>
          <span style={{ color: "var(--cyan-bright)" }}>{header}</span>
          .<span style={{ color: "var(--amber-bright)" }}>{body}</span>
          .<span style={{ color: "var(--violet-bright)" }}>{fakeSig}</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <CopyBtn text={"Bearer " + jwt} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StripeWebhookSimulator, QuietHoursChecker, JwtBuilder });
