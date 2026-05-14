// ===== Doc 02: Engagement Service =====

// SM-2 Algorithm (from 04 + 02 specs)
function sm2(rating, oldEF, oldInterval, oldReps) {
  // EF update
  const ef = Math.max(1.3, oldEF + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
  let interval, reps;
  if (rating < 3) {
    interval = 1;
    reps = 0;
  } else {
    if (oldReps === 0) interval = 1;
    else if (oldReps === 1) interval = 6;
    else interval = Math.round(oldInterval * ef);
    reps = oldReps + 1;
  }
  return { ef: Math.round(ef * 100) / 100, interval, reps };
}

function SM2Simulator() {
  const [initEF, setInitEF] = useState(2.5);
  const [initInterval, setInitInterval] = useState(7);
  const [initReps, setInitReps] = useState(3);
  const [ef, setEf] = useState(2.5);
  const [interval, setInterval_] = useState(7);
  const [reps, setReps] = useState(3);
  const [history, setHistory] = useState([]);

  const submit = (rating) => {
    const result = sm2(rating, ef, interval, reps);
    const dueDate = new Date(BASE_DATE);
    dueDate.setUTCDate(dueDate.getUTCDate() + result.interval);
    const due = dueDate.toISOString().slice(0, 10);
    const branch = rating < 3 ? "reset (rating < 3: interval=1, reps=0)" :
                   reps === 0 ? "first (reps=0: interval=1)" :
                   reps === 1 ? "second (reps=1: interval=6)" :
                   `multiply (${interval} × ${result.ef} ≈ ${result.interval})`;
    setHistory(h => [...h, {
      idx: h.length + 1,
      rating,
      oldEF: ef,
      oldInterval: interval,
      newEF: result.ef,
      newInterval: result.interval,
      due,
      branch
    }]);
    setEf(result.ef);
    setInterval_(result.interval);
    setReps(result.reps);
  };

  const reset = () => {
    setEf(initEF); setInterval_(initInterval); setReps(initReps); setHistory([]);
  };

  const ratingMeta = [
    { r: 0, label: "완전 오답", color: "red" },
    { r: 1, label: "거의 오답", color: "red" },
    { r: 2, label: "어렵게 맞음", color: "amber" },
    { r: 3, label: "보통", color: "amber" },
    { r: 4, label: "쉬움", color: "green" },
    { r: 5, label: "매우 쉬움", color: "green" }
  ];

  return (
    <div>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <StatCard label="Easiness Factor" value={ef.toFixed(2)} tone="cyan" hint={`min 1.3, max ≈ 2.6`} />
        <StatCard label="Interval (일)" value={interval} tone="amber" hint={`현재 복습 간격`} />
        <StatCard label="Repetitions" value={reps} hint={`연속 정답 횟수`} />
      </div>

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

      <div className="label" style={{ marginBottom: 8 }}>평가 제출 (rating 0–5)</div>
      <div className="row" style={{ marginBottom: 16 }}>
        {ratingMeta.map(m => (
          <button key={m.r} className="btn" onClick={() => submit(m.r)}
            style={{ flex: 1, justifyContent: "center", flexDirection: "column", padding: "10px 8px", gap: 2 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{m.r}</span>
            <span className="tiny" style={{ color: "var(--text-3)" }}>{m.label}</span>
          </button>
        ))}
        <button className="btn btn-ghost" onClick={reset}>↻</button>
      </div>

      {history.length > 0 ? (
        <div>
          <div className="label" style={{ marginBottom: 8 }}>복습 이력</div>
          <table className="table">
            <thead>
              <tr><th>#</th><th>rating</th><th>EF</th><th>interval</th><th>next due</th><th>분기</th><th>kafka</th></tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td className="mono muted">#{h.idx}</td>
                  <td><Pill tone={h.rating < 3 ? "red" : h.rating < 4 ? "amber" : "green"}>{h.rating}</Pill></td>
                  <td className="mono">{h.oldEF.toFixed(2)} → <span style={{ color: "var(--cyan-bright)" }}>{h.newEF.toFixed(2)}</span></td>
                  <td className="mono">{h.oldInterval}d → <span style={{ color: "var(--cyan-bright)" }}>{h.newInterval}d</span></td>
                  <td className="mono tiny">{h.due}</td>
                  <td className="tiny muted">{h.branch}</td>
                  <td className="tiny muted">card.reviewed · gamification.xp.earned (+10)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="tiny muted" style={{ textAlign: "center", padding: 24 }}>
          위 버튼을 눌러 카드 평가를 시뮬레이션해보세요.
        </div>
      )}
      <MockRouteBadge service="learning-card" module="srs"
        from="학습 카드 내부 로직" fromUrl="SM-2 알고리즘 (순수 함수)"
        to="Unit Test (mock 없음)" toUrl="@ParameterizedTest @CsvSource" />
    </div>
  );
}

// XP & Level & Badge Simulator
const LEVELS = [
  { lv: 1, xp: 0, title: "새싹" },
  { lv: 2, xp: 100, title: "탐험가" },
  { lv: 3, xp: 300, title: "학습자" },
  { lv: 4, xp: 500, title: "학자" },
  { lv: 5, xp: 1000, title: "전문가" },
  { lv: 6, xp: 2000, title: "마스터" }
];

const XP_ACTIONS = [
  { id: "review_complete", label: "복습 완료", xp: 10, topic: "card.reviewed" },
  { id: "note_create", label: "노트 작성", xp: 20, topic: "note.created" },
  { id: "card_create", label: "카드 생성", xp: 5, topic: "(internal)" },
  { id: "group_activity", label: "그룹 활동", xp: 15, topic: "community.group.*" },
  { id: "deck_share", label: "덱 공유", xp: 30, topic: "community.deck.shared" },
  { id: "first_review", label: "첫 복습", xp: 100, topic: "(bonus)" }
];

const BADGES = [
  { code: "FIRST_REVIEW", name: "첫 복습", check: s => s.reviews >= 1, xpReward: 100, icon: "🥇" },
  { code: "STREAK_7", name: "7일 전사", check: s => s.streak >= 7, xpReward: 100, icon: "🔥" },
  { code: "STREAK_30", name: "30일 전사", check: s => s.streak >= 30, xpReward: 500, icon: "⚡" },
  { code: "NOTE_100", name: "노트 100개", check: s => s.notes >= 100, xpReward: 200, icon: "📚" }
];

function XPSimulator() {
  const initial = { xp: 490, reviews: 6, notes: 5, streak: 7, badges: new Set(["FIRST_REVIEW", "STREAK_7"]), events: [] };
  const [state, setState] = useState(initial);

  const currentLevel = useMemo(() => {
    return LEVELS.slice().reverse().find(l => state.xp >= l.xp);
  }, [state.xp]);
  const nextLevel = useMemo(() => {
    return LEVELS.find(l => l.xp > state.xp);
  }, [state.xp]);

  const apply = (act) => {
    const t = new Date().toLocaleTimeString();
    setState(prev => {
      const newState = { ...prev };
      newState.xp += act.xp;
      if (act.id === "review_complete") newState.reviews += 1;
      if (act.id === "note_create") newState.notes += 1;
      const events = [{ t, tag: "Kafka", kind: "send", msg: `<code>${act.topic}</code>` },
                      { t, tag: "Kafka", kind: "ok", msg: `gamification.xp.earned · +${act.xp} XP` }];

      // Level up check
      const beforeLv = LEVELS.slice().reverse().find(l => prev.xp >= l.xp);
      const afterLv = LEVELS.slice().reverse().find(l => newState.xp >= l.xp);
      if (afterLv && beforeLv && afterLv.lv > beforeLv.lv) {
        events.push({ t, tag: "LEVEL", kind: "ok", msg: `🎉 gamification.level.up · ${beforeLv.title} → <b>${afterLv.title}</b> (Lv ${afterLv.lv})` });
      }

      // Badge check
      const newBadges = new Set(prev.badges);
      for (const b of BADGES) {
        if (!newBadges.has(b.code) && b.check(newState)) {
          newBadges.add(b.code);
          events.push({ t, tag: "BADGE", kind: "ok", msg: `${b.icon} gamification.badge.earned · <b>${b.name}</b> (+${b.xpReward} XP)` });
          newState.xp += b.xpReward;
        }
      }
      newState.badges = newBadges;
      newState.events = [...prev.events, ...events];
      setTimeout(() => SimBus.emit("xp.changed", { xp: newState.xp, level: afterLv?.lv || beforeLv?.lv }), 0);
      return newState;
    });
  };

  const reset = () => {
    setState(initial);
    SimBus.emit("xp.changed", { xp: initial.xp, level: 3 });
  };

  const progress = nextLevel ? ((state.xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100 : 100;

  return (
    <div className="grid-2">
      <div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row" style={{ alignItems: "baseline" }}>
            <div>
              <div className="tiny muted">현재 레벨</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--cyan-bright)" }}>
                Lv {currentLevel.lv} · {currentLevel.title}
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div className="tiny muted">총 XP</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>{state.xp}</div>
            </div>
          </div>
          <div style={{ marginTop: 14, position: "relative", height: 8, background: "var(--bg-3)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: progress + "%", background: "linear-gradient(90deg, var(--cyan), var(--violet))", transition: "width 0.4s" }} />
          </div>
          <div className="row" style={{ marginTop: 8, fontSize: 11 }}>
            <span className="muted">{currentLevel.title} {currentLevel.xp}</span>
            <span style={{ marginLeft: "auto" }} className="muted">
              {nextLevel ? `${nextLevel.xp - state.xp} XP → ${nextLevel.title}` : "MAX"}
            </span>
          </div>
        </div>

        <div className="label" style={{ marginBottom: 8 }}>액션 (Kafka 이벤트 발행)</div>
        <div className="col" style={{ gap: 6 }}>
          {XP_ACTIONS.map(a => (
            <button key={a.id} className="btn" style={{ justifyContent: "space-between", textAlign: "left" }} onClick={() => apply(a)}>
              <span>{a.label}</span>
              <span className="row">
                <Pill tone="amber">+{a.xp} XP</Pill>
                <span className="tiny muted" style={{ fontFamily: "var(--font-mono)" }}>{a.topic}</span>
              </span>
            </button>
          ))}
        </div>
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
        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={reset}>↻ 초기화</button>

        <div className="label" style={{ marginTop: 20, marginBottom: 8 }}>현재 통계</div>
        <div className="grid-3">
          <StatCard label="복습" value={state.reviews} />
          <StatCard label="노트" value={state.notes} />
          <StatCard label="스트릭" value={state.streak + "일"} tone="amber" />
        </div>
      </div>

      <div>
        <div className="label" style={{ marginBottom: 8 }}>배지 카탈로그</div>
        <div className="col" style={{ gap: 8, marginBottom: 16 }}>
          {BADGES.map(b => {
            const earned = state.badges.has(b.code);
            return (
              <div key={b.code} className="card card-tight" style={{ opacity: earned ? 1 : 0.5, borderColor: earned ? "var(--cyan-dim)" : "var(--line-1)" }}>
                <div className="row" style={{ alignItems: "center" }}>
                  <div style={{ fontSize: 28, filter: earned ? "none" : "grayscale(1)" }}>{b.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.name}</div>
                    <div className="tiny muted mono">{b.code} · +{b.xpReward} XP</div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    {earned ? <Pill tone="cyan">획득</Pill> : <Pill>미획득</Pill>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="label" style={{ marginBottom: 8 }}>이벤트 로그</div>
        <Log entries={state.events.slice(-15)} height={200} />
      </div>
      <MockRouteBadge service="engagement-svc" module="gamification"
        from="Kafka card.reviewed → gamification-svc" fromUrl="EmbeddedKafka → XP 적립 로직"
        to="EmbeddedKafka fixture" toUrl="@EmbeddedKafka topics={card.reviewed, gamification.xp.earned}"
        file="fixtures/kafka/card-reviewed.json" />
    </div>
  );
}

// Leaderboard preview (Redis Sorted Set)
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

  const list = useMemo(() => {
    const rows = baseData[period].map(r => {
      if (r.you && youXp !== null) {
        const newLv = LEVELS.slice().reverse().find(l => youXp >= l.xp);
        return { ...r, xp: youXp, lv: newLv?.lv || r.lv };
      }
      return { ...r };
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

Object.assign(window, { SM2Simulator, XPSimulator, LeaderboardPreview });
