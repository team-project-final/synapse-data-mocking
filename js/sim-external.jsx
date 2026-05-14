// ===== Doc 07: External APIs =====

// OAuth Flow Simulator
const OAUTH_PROVIDERS = {
  google: {
    name: "Google",
    color: "#ea4335",
    tokenUrl: "https://oauth2.googleapis.com/token (→ /google/token)",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo (→ /google/userinfo)",
    scope: "openid email profile",
    sampleToken: "google_mock_access_token_001",
    userInfo: { sub: "google_user_001", email: "user1@gmail.com", email_verified: true, name: "홍길동", picture: "https://lh3.googleusercontent.com/a/default", locale: "ko" }
  },
  github: {
    name: "GitHub",
    color: "#181717",
    tokenUrl: "https://github.com/login/oauth/access_token (→ /github/token)",
    userInfoUrl: "https://api.github.com/user (→ /github/userinfo)",
    scope: "read:user user:email",
    sampleToken: "github_mock_access_token_001",
    userInfo: { id: 12345678, login: "honggildong", name: "홍길동", email: "user1@github.com", avatar_url: "https://avatars.githubusercontent.com/u/12345678", bio: "학습 열정가" }
  },
  apple: {
    name: "Apple",
    color: "#000",
    tokenUrl: "https://appleid.apple.com/auth/token (→ /apple/token)",
    userInfoUrl: "(id_token에서 추출 — userinfo 엔드포인트 없음)",
    scope: "name email",
    sampleToken: "apple_mock_access_token_001",
    userInfo: { sub: "apple_user_001", email: "user1@icloud.com", email_verified: "true" }
  },
  microsoft: {
    name: "Microsoft",
    color: "#0078d4",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token (→ /microsoft/token)",
    userInfoUrl: "https://graph.microsoft.com/v1.0/me (→ /microsoft/userinfo)",
    scope: "openid email profile User.Read",
    sampleToken: "microsoft_mock_access_token_001",
    userInfo: { id: "ms_user_001", mail: "user1@outlook.com", displayName: "홍길동", userPrincipalName: "user1@outlook.com" }
  }
};

function OAuthFlowSimulator() {
  const [provider, setProvider] = useState("google");
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);
  const [errorScenario, setErrorScenario] = useState("none");

  const p = OAUTH_PROVIDERS[provider];

  const steps = [
    { name: "1. 인가 코드 요청", actor: "Frontend", op: "Redirect to provider authorize URL" },
    { name: "2. 사용자 동의", actor: "Provider", op: "User clicks Allow" },
    { name: "3. 콜백 + code", actor: "Frontend → Backend", op: "GET /auth/oauth/google/callback?code=mock_code" },
    { name: "4. Token Exchange", actor: "Backend → WireMock", op: "POST /google/token (mock)" },
    { name: "5. Userinfo 조회", actor: "Backend → WireMock", op: "GET /google/userinfo (Authorization: Bearer …)" },
    { name: "6. Upsert User", actor: "Backend → PostgreSQL", op: "INSERT/UPDATE users, oauth_accounts" },
    { name: "7. Publish Kafka", actor: "Backend → Kafka", op: "user.registered (if new)" },
    { name: "8. JWT 발급", actor: "Backend → Frontend", op: "Set-Cookie refresh_token + access_token" }
  ];

  const next = () => {
    const nextStep = step + 1;
    // Trigger error at step 4 if scenario set
    if (errorScenario === "invalid_grant" && nextStep === 4) {
      setError({ status: 401, body: { error: "invalid_grant", error_description: "Bad Request" } });
      setStep(4);
      return;
    }
    if (errorScenario === "rate_limit" && nextStep === 5) {
      setError({ status: 403, body: { message: "API rate limit exceeded" } });
      setStep(5);
      return;
    }
    if (nextStep < steps.length) setStep(nextStep);
  };

  const reset = () => { setStep(0); setError(null); };

  return (
    <div>
      <div className="row" style={{ marginBottom: 16, justifyContent: "space-between" }}>
        <div className="row">
          {Object.entries(OAUTH_PROVIDERS).map(([id, prov]) => (
            <button key={id} className={"btn" + (provider === id ? " btn-primary" : "")} onClick={() => { setProvider(id); reset(); }}>
              {prov.name}
            </button>
          ))}
        </div>
        <div className="row">
          <Field label="에러 시나리오">
            <select className="select" value={errorScenario} onChange={e => { setErrorScenario(e.target.value); reset(); }} style={{ width: 200 }}>
              <option value="none">없음 (success)</option>
              <option value="invalid_grant">401 invalid_grant (step 4)</option>
              <option value="rate_limit">403 rate limit (step 5)</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="label" style={{ marginBottom: 8 }}>OAuth 2.0 흐름</div>
          <div className="col" style={{ gap: 6 }}>
            {steps.map((s, i) => {
              const isDone = i < step;
              const isCurrent = i === step;
              const hasError = error && i === step;
              return (
                <div key={i} className={"flow-node" + (isCurrent ? " active" : "")} style={{
                  borderColor: hasError ? "var(--red)" : isCurrent ? "var(--cyan)" : isDone ? "var(--cyan-dim)" : "var(--line-1)",
                  opacity: i <= step ? 1 : 0.4
                }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div>
                      <div className="flow-node-label">{s.actor}</div>
                      <div className="flow-node-name">{s.name}</div>
                    </div>
                    {isDone ? <Pill tone="green">✓</Pill> : isCurrent ? (hasError ? <Pill tone="red">✗</Pill> : <Pill tone="cyan">●</Pill>) : null}
                  </div>
                  <div className="tiny mono muted" style={{ marginTop: 4 }}>{s.op}</div>
                </div>
              );
            })}
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={next} disabled={step >= steps.length - 1 || !!error}>
              {step === 0 ? "시작 →" : "다음 단계 →"}
            </button>
            <button className="btn btn-ghost" onClick={reset}>↻ 초기화</button>
          </div>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>WireMock 매핑 / 응답 ({p.name})</div>
          {error ? (
            <div>
              <div className="row" style={{ marginBottom: 8 }}>
                <Pill tone="red">{error.status} Error</Pill>
                <span className="tiny muted">{p.name} OAuth 에러 응답</span>
              </div>
              <JsonView data={error.body} max={20} />
              <div className="tiny muted" style={{ marginTop: 12 }}>
                <code>backOff(exponential)</code> 재시도 후 사용자에게 에러 화면 표시. UI: <code>OAUTH_FAILED</code> toast.
              </div>
            </div>
          ) : step < 4 ? (
            <div>
              <div className="row" style={{ marginBottom: 8 }}>
                <Pill tone="blue">GET</Pill>
                <span className="mono tiny muted">authorize URL</span>
              </div>
              <Code>{`https://accounts.${provider}.com/o/oauth2/v2/auth?
  client_id=${provider}_test_client_id
  &redirect_uri=http://localhost:8080/auth/oauth/${provider}/callback
  &response_type=code
  &scope=${p.scope}
  &state=mock_state_xyz`}</Code>
              <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>다음 호출 (step 4)</div>
              <div className="row">
                <Pill tone="green">POST</Pill>
                <code style={{ fontSize: 11 }}>{p.tokenUrl.split("(")[1]?.replace(/[→)\s]/g, "") || p.tokenUrl}</code>
              </div>
            </div>
          ) : step === 4 ? (
            <div>
              <div className="row" style={{ marginBottom: 8 }}>
                <Pill tone="green">POST</Pill>
                <span className="mono tiny muted">{p.tokenUrl}</span>
              </div>
              <JsonView data={{
                access_token: p.sampleToken,
                token_type: "Bearer",
                expires_in: 3600,
                refresh_token: `${provider}_mock_refresh_token_001`,
                scope: p.scope
              }} max={20} />
            </div>
          ) : step === 5 ? (
            <div>
              <div className="row" style={{ marginBottom: 8 }}>
                <Pill tone="blue">GET</Pill>
                <span className="mono tiny muted">{p.userInfoUrl}</span>
              </div>
              <JsonView data={p.userInfo} max={20} />
            </div>
          ) : step === 6 ? (
            <div>
              <div className="label" style={{ marginBottom: 6 }}>SQL (Testcontainers)</div>
              <Code>{`INSERT INTO users (id, tenant_id, email, display_name, created_at)
VALUES ('user-...002', 'tenant-...001', '${p.userInfo.email || "user@example.com"}', '${p.userInfo.name || p.userInfo.displayName || "사용자"}', NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email)
VALUES ('user-...002', '${provider}', '${p.userInfo.sub || p.userInfo.id || "mock"}', '${p.userInfo.email || "user@example.com"}');`}</Code>
            </div>
          ) : step === 7 ? (
            <div>
              <div className="label" style={{ marginBottom: 6 }}>EmbeddedKafka 검증</div>
              <JsonView data={{
                specversion: "1.0",
                type: "user.registered",
                source: "synapse/platform-svc",
                data: {
                  userId: "user-...002",
                  email: p.userInfo.email || "user@example.com",
                  displayName: p.userInfo.name || p.userInfo.displayName || "사용자",
                  authProvider: provider,
                  locale: "ko"
                }
              }} max={26} />
            </div>
          ) : (
            <div>
              <div className="row" style={{ marginBottom: 8 }}>
                <Pill tone="green">✓ 200 OK</Pill>
                <span className="tiny muted">로그인 완료</span>
              </div>
              <JsonView data={{
                success: true,
                data: {
                  accessToken: "eyJhbGc...mock_jwt",
                  expiresIn: 900,
                  user: { id: "user-...002", email: p.userInfo.email, displayName: p.userInfo.name || p.userInfo.displayName }
                }
              }} max={20} />
              <div className="tiny muted" style={{ marginTop: 12 }}>
                <code>Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax</code>
              </div>
            </div>
          )}
        </div>
      </div>
      <MockRouteBadge service="platform-svc" module="auth"
        from="platform-svc → OAuth Providers" fromUrl="POST /{provider}/token, GET /{provider}/userinfo (4종)"
        to="WireMock per-provider" toUrl="http://localhost:${wiremock.port}/{provider}/token"
        file="__files/oauth/{provider}-token-success.json" />
    </div>
  );
}

// External APIs Matrix
function ExternalApiMatrix() {
  const apis = [
    { name: "Google OAuth", group: "OAuth", endpoints: 2, scenarios: ["success", "invalid_grant 401", "PERMISSION_DENIED 403"], tool: "WireMock" },
    { name: "GitHub OAuth", group: "OAuth", endpoints: 2, scenarios: ["success", "Bad credentials 401", "Rate limit 403"], tool: "WireMock" },
    { name: "Apple OAuth", group: "OAuth", endpoints: 1, scenarios: ["success (id_token)", "invalid_client 400"], tool: "WireMock" },
    { name: "Microsoft OAuth", group: "OAuth", endpoints: 2, scenarios: ["success", "AADSTS50058"], tool: "WireMock" },
    { name: "Stripe Checkout", group: "Payment", endpoints: 4, scenarios: ["session.created", "session.completed", "payment_failed", "subscription.deleted"], tool: "WireMock" },
    { name: "Stripe Webhooks", group: "Payment", endpoints: 1, scenarios: ["checkout.completed", "invoice.payment_succeeded", "invoice.payment_failed", "subscription.deleted"], tool: "WireMock + 수동 호출" },
    { name: "FCM Push", group: "Notification", endpoints: 1, scenarios: ["success", "INVALID_REGISTRATION 404", "QUOTA_EXCEEDED 429"], tool: "WireMock" },
    { name: "AWS SES", group: "Notification", endpoints: 1, scenarios: ["success", "MessageRejected", "SendingPausedException"], tool: "WireMock" },
    { name: "OpenAI Embeddings", group: "AI", endpoints: 1, scenarios: ["success (1536d)", "rate_limit_exceeded 429"], tool: "respx (Python)" },
    { name: "Anthropic Claude", group: "AI", endpoints: 1, scenarios: ["card generation success", "overloaded_error 529"], tool: "respx (Python)" }
  ];
  const groups = [...new Set(apis.map(a => a.group))];
  return (
    <div>
      <div className="row" style={{ marginBottom: 16, gap: 8 }}>
        {groups.map(g => <Pill key={g} tone="cyan">{g}</Pill>)}
        <span className="tiny muted" style={{ marginLeft: "auto" }}>{apis.length}개 외부 API · 30+ 시나리오</span>
      </div>
      <div className="grid-2" style={{ gap: 12 }}>
        {apis.map((api, i) => (
          <div key={i} className="card card-tight">
            <div className="row" style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{api.name}</div>
              <Pill tone="violet">{api.group}</Pill>
              <span style={{ marginLeft: "auto" }} className="tiny muted">{api.endpoints} endpoint</span>
            </div>
            <div className="row" style={{ flexWrap: "wrap", gap: 4 }}>
              {api.scenarios.map((s, j) => (
                <Pill key={j} tone={s.includes("success") ? "green" : (/4\d\d|5\d\d|fail|error|exceed|rejected|paused/.test(s) ? "red" : "")}>
                  {s}
                </Pill>
              ))}
            </div>
            <div className="tiny muted" style={{ marginTop: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)" }}>{api.tool}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { OAuthFlowSimulator, ExternalApiMatrix });
