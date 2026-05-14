// Documentation metadata + summaries

const DOCS = [
  {
    idx: "00",
    id: "strategy",
    title: "목킹 전략",
    en: "Mocking Strategy",
    summary: "전체 서비스의 테스트 피라미드, 도구 스택, 공통 시드 ID/시간 고정 규약을 정의한다.",
    tags: ["WireMock", "Testcontainers", "EmbeddedKafka", "Spring Cloud Contract"]
  },
  {
    idx: "01",
    id: "platform",
    title: "Platform Service",
    en: "platform-svc",
    summary: "auth(OAuth 4종 + JWT + MFA), audit(7개 토픽 Consumer), billing(Stripe), notification(FCM + SES + Quiet Hours).",
    tags: ["OAuth", "Stripe", "FCM", "SES", "JWT"]
  },
  {
    idx: "02",
    id: "engagement",
    title: "Engagement Service",
    en: "engagement-svc",
    summary: "community(그룹/공유/신고 + Spring Cloud Contract), gamification(XP·레벨·배지·스트릭 + Redis 리더보드).",
    tags: ["XP", "Badge", "Streak", "Leaderboard", "Contract"]
  },
  {
    idx: "03",
    id: "knowledge",
    title: "Knowledge Service",
    en: "knowledge-svc",
    summary: "note(ES + S3 + 위키링크), graph(D3 시각화 데이터, N-hop), chunking(pgvector + 임베딩 API).",
    tags: ["Elasticsearch", "pgvector", "S3", "Wikilinks"]
  },
  {
    idx: "04",
    id: "learning",
    title: "Learning Service",
    en: "learning-svc",
    summary: "learning-card(SM-2 SRS 알고리즘 + 세션 캐시) + learning-ai(OpenAI/Claude + 시맨틱 캐시 + 하이브리드 검색).",
    tags: ["SM-2", "OpenAI", "Claude", "Semantic Cache", "RRF"]
  },
  {
    idx: "05",
    id: "frontend",
    title: "Frontend (Flutter)",
    en: "synapse-frontend",
    summary: "dio MockInterceptor + Mockito Repository mock + 목 응답 fixture + Golden Test 데이터셋.",
    tags: ["Flutter", "dio", "Mockito", "Riverpod"]
  },
  {
    idx: "06",
    id: "kafka",
    title: "Kafka 이벤트",
    en: "Kafka Topics",
    summary: "18개 토픽 fixture (CloudEvents 1.0 호환), EmbeddedKafka 설정, Avro 직렬화 검증 패턴.",
    tags: ["CloudEvents", "Avro", "EmbeddedKafka", "18 topics"]
  },
  {
    idx: "07",
    id: "external",
    title: "외부 API",
    en: "External APIs",
    summary: "OAuth 4종(Google/GitHub/Apple/Microsoft), Stripe Webhooks, FCM, SES, OpenAI, Anthropic Claude WireMock 매핑.",
    tags: ["WireMock", "respx", "OAuth", "Stripe", "FCM"]
  }
];

// Kafka topics catalog (from 06)
const TOPICS = [
  { name: "note.created", from: "knowledge-svc/note", to: ["learning-ai", "knowledge/note"], purpose: "노트 생성 → AI 카드 자동 생성 + ES 인덱싱" },
  { name: "note.updated", from: "knowledge-svc/note", to: ["learning-ai", "knowledge/note"], purpose: "임베딩 재생성 + ES 재인덱싱" },
  { name: "note.deleted", from: "knowledge-svc/note", to: ["knowledge/note"], purpose: "ES 인덱스 삭제" },
  { name: "card.reviewed", from: "learning-card/srs", to: ["engagement/gamification"], purpose: "복습 완료 → XP 적립 + 통계" },
  { name: "user.registered", from: "platform-svc/auth", to: ["platform-svc/audit"], purpose: "회원가입 감사 로그" },
  { name: "user.deleted", from: "platform-svc/auth", to: ["knowledge/note"], purpose: "사용자 삭제 → 노트 soft delete" },
  { name: "billing.subscription.changed", from: "platform-svc/billing", to: ["platform-svc/audit"], purpose: "구독 변경 감사 로그" },
  { name: "audit.event", from: "(여러 서비스)", to: ["platform-svc/audit"], purpose: "범용 감사 이벤트" },
  { name: "community.deck.shared", from: "engagement/community", to: ["notification", "gamification", "audit"], purpose: "덱 공유 → 알림 + XP 적립" },
  { name: "community.note.shared", from: "engagement/community", to: ["notification", "gamification"], purpose: "노트 공유 → 알림 + XP" },
  { name: "community.group.created", from: "engagement/community", to: ["gamification", "audit"], purpose: "그룹 생성 → XP 적립" },
  { name: "community.group.joined", from: "engagement/community", to: ["notification", "gamification", "audit"], purpose: "그룹 가입 → 알림 + XP" },
  { name: "community.report.created", from: "engagement/community", to: ["audit"], purpose: "신고 접수 감사 로그" },
  { name: "gamification.xp.earned", from: "gamification", to: ["notification"], purpose: "XP 적립 알림" },
  { name: "gamification.badge.earned", from: "gamification", to: ["notification"], purpose: "배지 획득 알림" },
  { name: "gamification.level.up", from: "gamification", to: ["notification"], purpose: "레벨업 알림" },
  { name: "notification.send", from: "(여러 서비스)", to: ["notification"], purpose: "범용 알림 발송 요청" },
  { name: "card.review.due", from: "learning-card/srs", to: ["notification"], purpose: "복습 리마인더 알림 (cron 07:00 KST)" }
];

const SEED_IDS = [
  { type: "Tenant", id: "tenant-...000000001", note: "기본 테넌트 (Free)" },
  { type: "Tenant", id: "tenant-...000000002", note: "Team 플랜 테넌트" },
  { type: "User", id: "user-...000000001", note: "일반 사용자 (Free, 홍길동)" },
  { type: "User", id: "user-...000000002", note: "Pro 사용자 (김영희, OAuth Google)" },
  { type: "User", id: "user-...000000003", note: "Team Owner" },
  { type: "User", id: "user-...000000004", note: "Team Member" },
  { type: "User", id: "user-...000000005", note: "Admin (관리자)" },
  { type: "Note", id: "note-...000000001", note: "기본 노트 (위키링크 source)" },
  { type: "Note", id: "note-...000000002", note: "위키링크 대상 노트" },
  { type: "Note", id: "note-...000000003", note: "긴 노트 (50000자, 청킹 대상)" },
  { type: "Deck", id: "deck-...000000001", note: "프로그래밍 기초 덱 (3장)" },
  { type: "Deck", id: "deck-...000000002", note: "공유 덱" },
  { type: "Card", id: "card-...000000001", note: "basic — TCP vs UDP" },
  { type: "Card", id: "card-...000000002", note: "cloze — 정규화" },
  { type: "Card", id: "card-...000000003", note: "AI 생성 카드" },
  { type: "Group", id: "group-...000000001", note: "ML 스터디 (approval)" },
  { type: "Group", id: "group-...000000002", note: "비공개 스터디 (invite_only)" },
  { type: "Session", id: "session-...000000001", note: "복습 세션 (3장 in_progress)" }
];

// Mock API responses catalog (curated)
const MOCK_RESPONSES = [
  // Auth (Platform)
  { svc: "Platform", mod: "Auth", method: "POST", path: "/auth/signup", code: 201, name: "회원가입 성공",
    body: { success: true, data: { userId: "user-…001", tenantId: "tenant-…001", email: "user1@example.com", displayName: "홍길동" } } },
  { svc: "Platform", mod: "Auth", method: "POST", path: "/auth/login", code: 200, name: "로그인 성공",
    body: { success: true, data: { accessToken: "mock_jwt_access_token_for_testing", expiresIn: 900, user: { id: "user-…001", email: "user1@example.com", displayName: "홍길동" } } } },
  { svc: "Platform", mod: "Auth", method: "POST", path: "/auth/refresh", code: 200, name: "토큰 갱신",
    body: { success: true, data: { accessToken: "mock_jwt_refreshed_token", expiresIn: 900 } } },
  { svc: "Platform", mod: "Auth", method: "POST", path: "/auth/mfa/setup", code: 200, name: "MFA 시크릿 발급",
    body: { success: true, data: { secret: "JBSWY3DPEHPK3PXP", qrCodeUrl: "otpauth://totp/Synapse:user1@example.com?secret=JBSWY3DPEHPK3PXP" } } },
  // Billing
  { svc: "Platform", mod: "Billing", method: "GET", path: "/billing/plans", code: 200, name: "요금제 목록",
    body: { success: true, data: [{ code: "free", price: 0 }, { code: "pro", price: 9.99 }, { code: "team", price: 19.99 }] } },
  { svc: "Platform", mod: "Billing", method: "POST", path: "/billing/checkout", code: 200, name: "Stripe Checkout URL",
    body: { success: true, data: { checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_mock_001" } } },
  { svc: "Platform", mod: "Billing", method: "GET", path: "/billing/subscription", code: 200, name: "현재 구독 조회",
    body: { success: true, data: { plan: "pro", status: "active", currentPeriodEnd: "2026-02-15", cancelAtPeriodEnd: false } } },
  // Tenant
  { svc: "Platform", mod: "Tenant", method: "GET", path: "/tenant/context", code: 200, name: "테넌트 컨텍스트",
    body: { success: true, data: { tenantId: "tenant-…001", plan: "pro", role: "owner", quotas: { aiGenerations: { used: 120, max: 500 } } } } },
  // Community
  { svc: "Engagement", mod: "Community", method: "GET", path: "/community/groups", code: 200, name: "그룹 목록",
    body: { success: true, data: [{ id: "group-…001", name: "ML 스터디", memberCount: 12, myRole: "owner" }] } },
  { svc: "Engagement", mod: "Community", method: "POST", path: "/community/groups", code: 201, name: "그룹 생성",
    body: { success: true, data: { id: "group-…003", name: "새 스터디", memberCount: 1, myRole: "owner" } } },
  { svc: "Engagement", mod: "Community", method: "POST", path: "/community/groups/:id/join", code: 200, name: "그룹 가입 신청",
    body: { success: true, data: { status: "pending", message: "가입 신청이 접수되었습니다." } } },
  { svc: "Engagement", mod: "Community", method: "POST", path: "/community/groups/:id/share/deck", code: 201, name: "덱 공유",
    body: { success: true, data: { sharedDeckId: "sdeck-002", shareToken: "share_tok_003" } } },
  // Gamification
  { svc: "Engagement", mod: "Gamification", method: "GET", path: "/gamification/xp", code: 200, name: "XP 요약",
    body: { success: true, data: { totalXp: 490, currentLevel: 3, levelTitle: "학습자", nextLevelXp: 500, xpToNextLevel: 10 } } },
  { svc: "Engagement", mod: "Gamification", method: "GET", path: "/gamification/badges", code: 200, name: "배지 카탈로그",
    body: { success: true, data: [{ code: "STREAK_7", name: "7일 전사", earned: true }, { code: "STREAK_30", name: "30일 전사", earned: false }] } },
  { svc: "Engagement", mod: "Gamification", method: "GET", path: "/gamification/leaderboard", code: 200, name: "리더보드 (주간)",
    body: { success: true, data: [{ rank: 1, displayName: "홍길동", totalXp: 500 }, { rank: 2, displayName: "김영희", totalXp: 350 }] } },
  // Knowledge
  { svc: "Knowledge", mod: "Note", method: "GET", path: "/notes", code: 200, name: "노트 목록",
    body: { success: true, data: [{ id: "note-001", title: "머신러닝 기초 정리", wordCount: 25, tags: ["머신러닝", "AI"] }] } },
  { svc: "Knowledge", mod: "Note", method: "POST", path: "/notes", code: 201, name: "노트 생성",
    body: { success: true, data: { id: "note-003", title: "새 노트", wordCount: 3 } } },
  { svc: "Knowledge", mod: "Note", method: "GET", path: "/notes/search", code: 200, name: "노트 검색 (BM25)",
    body: { success: true, data: [{ id: "note-001", title: "머신러닝 기초 정리", snippet: "...머신러닝은 인공지능의 한 분야로...", score: 0.95 }] } },
  { svc: "Knowledge", mod: "Graph", method: "GET", path: "/graph/data", code: 200, name: "지식 그래프 데이터",
    body: { success: true, data: { nodes: [{ id: "note-001", title: "머신러닝 기초 정리", pageRank: 0.85 }], edges: [{ source: "note-001", target: "note-002", type: "wikilink" }] } } },
  // Learning
  { svc: "Learning", mod: "Card", method: "GET", path: "/decks", code: 200, name: "덱 목록",
    body: { success: true, data: [{ id: "deck-001", name: "프로그래밍 기초 덱", cardCount: 42, dueCount: 10 }] } },
  { svc: "Learning", mod: "SRS", method: "GET", path: "/reviews/queue", code: 200, name: "복습 큐",
    body: { success: true, data: { totalDue: 25, newCards: 5, reviewCards: 15, learningCards: 5 } } },
  { svc: "Learning", mod: "SRS", method: "POST", path: "/reviews/sessions/:id/submit", code: 200, name: "복습 평가 제출",
    body: { success: true, data: { nextInterval: 7, newEF: 2.6, nextDueDate: "2026-01-22", sessionProgress: { completed: 1, total: 25 } } } },
  { svc: "Learning", mod: "AI", method: "POST", path: "/ai/generate-cards", code: 200, name: "AI 카드 생성",
    body: { success: true, data: { cards: [{ frontContent: "머신러닝에서 과적합이란?", backContent: "훈련 데이터에 과도하게 맞춰져...", confidence: 0.95 }], usage: { inputTokens: 500, outputTokens: 300 } } } },
  { svc: "Learning", mod: "AI", method: "POST", path: "/ai/search/semantic", code: 200, name: "시맨틱 검색",
    body: { success: true, data: { results: [{ noteId: "note-001", title: "정규화 기법", score: 0.89 }] } } },
  // Errors
  { svc: "Common", mod: "Error", method: "*", path: "*", code: 400, name: "Validation Error",
    body: { success: false, error: { code: "VALIDATION_ERROR", message: "입력값이 유효하지 않습니다.", details: [{ field: "email", message: "올바른 이메일 형식이 아닙니다." }] } } },
  { svc: "Common", mod: "Error", method: "*", path: "*", code: 401, name: "Unauthorized",
    body: { success: false, error: { code: "UNAUTHORIZED", message: "인증이 필요합니다." } } },
  { svc: "Common", mod: "Error", method: "*", path: "*", code: 429, name: "Rate Limit",
    body: { success: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "요청 한도를 초과했습니다." } } }
];

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

Object.assign(window, { DOCS, TOPICS, SEED_IDS, MOCK_RESPONSES, BASE_DATE, CLOUD_EVENT_IDS });
