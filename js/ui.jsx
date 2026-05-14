// Shared UI primitives
const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;

function Pill({ tone, children }) {
  return <span className={"pill" + (tone ? " " + tone : "")}>{children}</span>;
}

function Section({ num, title, sub, children }) {
  return (
    <div className="section">
      <div className="section-head">
        <span className="section-num">§ {num}</span>
        <div>
          <h2 className="section-title">{title}</h2>
          {sub ? <div className="section-sub">{sub}</div> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function Panel({ title, badge, sub, children, right }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">
          {badge ? <span className="sim-badge">{badge}</span> : null}
          <span>{title}</span>
        </div>
        <div className="panel-head-sub">
          {right || sub}
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="col" style={{ gap: 6 }}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="tiny muted">{hint}</span> : null}
    </label>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <label className={"switch" + (checked ? " on" : "")} onClick={() => onChange(!checked)}>
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
      {label ? <span className="tiny">{label}</span> : null}
    </label>
  );
}

function Log({ entries, height }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries]);
  return (
    <div className="log" ref={ref} style={height ? { maxHeight: height } : null}>
      {entries.length === 0 ? <div className="log-entry muted"><span className="log-msg">(아직 이벤트 없음)</span></div> : null}
      {entries.map((e, i) => (
        <div className="log-entry shimmer-in" key={i}>
          <span className="log-time">{e.t}</span>
          <span className={"log-tag " + (e.kind || "info")}>{e.tag}</span>
          <span className="log-msg" dangerouslySetInnerHTML={{ __html: e.msg }} />
        </div>
      ))}
    </div>
  );
}

// Mini codeblock with simple syntax tokens
function Code({ children, lang }) {
  return <pre className="code" data-lang={lang}>{children}</pre>;
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}>
      {done ? "✓ 복사됨" : "복사"}
    </button>
  );
}

function StatCard({ label, value, hint, tone }) {
  return (
    <div className="card card-tight">
      <div className="label" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-display)", color: tone === "cyan" ? "var(--cyan-bright)" : tone === "amber" ? "var(--amber-bright)" : tone === "violet" ? "var(--violet-bright)" : "var(--text-0)", letterSpacing: "-0.02em" }}>{value}</div>
      {hint ? <div className="tiny muted" style={{ marginTop: 2 }}>{hint}</div> : null}
    </div>
  );
}

// Format JSON nicely with mild coloring
function JsonView({ data, max }) {
  const s = JSON.stringify(data, null, 2);
  const max_ = max || 40;
  const html = s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"([^"]+)":/g, '<span style="color:var(--cyan-bright)">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color:var(--green)">"$1"</span>')
    .replace(/: (true|false|null)/g, ': <span style="color:var(--violet-bright)">$1</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span style="color:var(--amber-bright)">$1</span>');
  return <pre className="code" style={{ maxHeight: max_ + "vh" }} dangerouslySetInnerHTML={{ __html: html }} />;
}

// Expose
Object.assign(window, { useState, useEffect, useRef, useMemo, useCallback, Fragment, Pill, Section, Panel, Field, Switch, Log, Code, CopyBtn, StatCard, JsonView });
