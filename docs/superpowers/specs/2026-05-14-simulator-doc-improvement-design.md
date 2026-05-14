# Synapse Mocking Guide - Simulator & Document Improvement Design

> **Date**: 2026-05-14
> **Status**: Approved
> **Approach**: Hybrid (Foundation-First + Impact-Tiered)

---

## 1. Context

### 1.1 Project Overview

`moking-data-guide` is a GitHub Pages site containing 8 mocking strategy documents and 19 interactive simulators for the Synapse SaaS platform. Built with React 18 CDN + Babel standalone (no build step).

### 1.2 Purpose & Priorities

| Purpose | Weight |
|---------|--------|
| Learning / Onboarding | 40% |
| Reference (code snippet lookup) | 30% |
| QA / Verification | 30% |

### 1.3 Constraints

- Tech stack: Keep current (React 18 CDN + Babel standalone, no build tooling)
- Document format: Markdown is source of truth, HTML synced from it
- Scope: All 8 tabs covered, prioritized by phase

---

## 2. Approach

**Hybrid**: Minimal infrastructure (P0 fixes + shared state system) first, then impact-ordered improvements in parallel.

```
Phase 0  P0 bug/inconsistency fixes (all tabs)
Phase 1  Cross-cutting infrastructure (EventBus, shared constants, error framework)
Phase 2a Document structure/guide reinforcement (parallel with 2b)
Phase 2b Core simulator logic accuracy (5 simulators)
Phase 3  Remaining simulator enhancements + document missing scenarios + Mock Route Map
Phase 4  HTML sync + executability fixes + final verification
```

---

## 3. Phase 0 — P0 Bug/Inconsistency Fixes

### 0-1. Mock Response Count Mismatch
- **File**: `js/sim-frontend.jsx`
- **Problem**: UI shows "49+ response fixtures" but `data.jsx` `MOCK_RESPONSES` has 26 entries
- **Fix**: Dynamic count display (`${MOCK_RESPONSES.length}`)

### 0-2. Stripe kafkaEvent Runtime Bug
- **File**: `js/sim-platform.jsx`
- **Problem**: `invoice.payment_failed` `kafkaEvent.plan` is a function literal `state => state.plan`, renders as `undefined`
- **Fix**: Evaluate function at event processing time using current state

### 0-3. CloudEvents ID Reproducibility
- **File**: `js/sim-kafka.jsx`
- **Problem**: `Math.random()` generates new ID every render, breaking fixture reproducibility
- **Fix**: Fixed seed UUIDs per topic (e.g., `evt-note-created-001`)

### 0-4. Korean Token Estimation
- **File**: `js/sim-knowledge.jsx`
- **Problem**: `ceil(chars / 2)` — Korean is ~1 char per token, not 0.5
- **Fix**: Lightweight heuristic separating ASCII (`/4`) and non-ASCII (`/1.5`)

### 0-5. TimeFixturePlayground Copy Button
- **File**: `js/sim-strategy.jsx`
- **Problem**: No copy functionality on time-fix code snippets
- **Fix**: Reuse existing `CopyBtn` component

---

## 4. Phase 1 — Cross-Cutting Infrastructure

### 1-1. Simulator State EventBus
- **File**: `js/ui.jsx`
- **Implementation**: Pub/sub `window.__SimBus` with `emit()` / `on()` / `off()`
- **Connections**:
  - XPSimulator -> LeaderboardPreview (XP/level changes update "YOU" row)
  - SM2Simulator -> Learning tab SRS fixture table (review records)
  - StripeWebhookSimulator -> JwtBuilder (subscription status in claims)
- **Principle**: Each simulator works standalone (fallback to defaults without EventBus)

### 1-2. Shared Constants
- **File**: `js/data.jsx`
- **Contents**:
  - `BASE_DATE = "2026-01-15T10:00:00Z"` — replace all hardcoded dates
  - `SEED_IDS` — already exists, link to simulators
  - `CLOUD_EVENT_IDS` — fixed event ID map per topic

### 1-3. Error Scenario Framework
- **File**: `js/ui.jsx`
- **Component**: `ErrorScenarioToggle` — dropdown with scenario list + callback
- **Target simulators**:
  - Stripe Webhook: `signature_verification_failed`
  - Semantic Cache: `cache_connection_error`
  - AI Card Generator: `529 overloaded`, `token_limit_exceeded`
  - FCM Quiet Hours: `fcm_send_failed`
- **Behavior**: Error selection shows error response in log + recovery strategy hint

### 1-4. Reset Button Consistency
- **Current**: Inconsistent reset behavior across simulators
- **Fix**: Unified `ResetBtn` component (state reset + log clear + EventBus initial emit)

---

## 5. Phase 2a — Document Structure/Guide Reinforcement

### 5.1 Common Guides in `00-mocking-strategy.md`

| Section | Content |
|---------|---------|
| Test Data Teardown Strategy | `@Transactional` rollback vs `@Sql(TRUNCATE)` vs Testcontainers recreation. Per-service recommendations, ordering caveats |
| Parallel Test Execution Safety | JUnit `parallel` config, port conflict avoidance (`@DynamicPropertySource`), Testcontainers `reuse` mode, isolation trade-offs |
| Contract Versioning Strategy | Stub version naming, backward compatibility verification flow, producer/consumer collaboration process on contract changes |
| Environment Mock Toggle Strategy | `application-{profile}.yml` switching, CI Testcontainers vs local Docker Compose, Flutter `useMock` flag build environment integration |
| Multi-Tenant Isolation Test Pattern | Seed data has tenant-001/002 but no isolation test exists. Provide common pattern (tenant A data accessed by tenant B returns 403) |

### 5.2 Per-Service Document Structure Additions

| Section | Target Docs | Content |
|---------|-------------|---------|
| Error Handling Test Matrix | 01-05 | Expected error codes, retry policy, test status per API/event |
| Kafka Consumer Failure Handling | 01, 02, 03, 04 | DLQ routing rules, retry count/backoff, poison-pill handling |
| Service Dependency Diagram | 01-05 | Internal/external dependencies as Mermaid diagrams |
| Mock Route Map | 01-07 | See Section 7 below |

### 5.3 `06-kafka-event-mocking.md` Additions

- `user.deleted` event catalog entry (fixture + producer/consumer mapping)
- DLQ strategy section (topic-specific naming, retry policy, monitoring)
- `KafkaTestHelper.publishAndWait` fix guidance (correct Awaitility polling condition)

### 5.4 `07-external-api-mocking.md` Additions

- Streaming response mocking guide (OpenAI/Claude SSE via WireMock `chunkedDribbleDelay`)
- Circuit breaker test pattern (Resilience4j with 503/timeout)
- Apple OAuth special handling (id_token JWT verification test code)

---

## 6. Phase 2b — Core Simulator Logic Accuracy

### 6.1 SM-2 SRS Simulator (`sim-engagement.jsx`)

| Aspect | Current | Improved |
|--------|---------|----------|
| Initial values | EF=2.5, interval=7, reps=3 fixed | Sliders for EF(1.3-3.0), interval(1-30), reps(0-10) |
| Base date | Hardcoded `2026-01-15` | `data.jsx` `BASE_DATE` reference |
| Cross-sim | None | EventBus -> Learning tab SRS table |
| Learning aid | History table only | SM-2 formula branch highlight on each rating |

### 6.2 Chunking Visualizer (`sim-knowledge.jsx`)

| Aspect | Current | Improved |
|--------|---------|----------|
| Token estimation | `ceil(chars/2)` | ASCII/non-ASCII heuristic (from Phase 0-4) |
| Chunking mode | Character-count only | Sentence-boundary mode toggle (split on `.?!`) |
| Overlap visualization | Position only | Color-coded overlap regions |
| pgvector SQL | Placeholder embedding | Dimension count display + "1536-dim in production" note |

### 6.3 Semantic Cache Simulator (`sim-learning.jsx`)

| Aspect | Current | Improved |
|--------|---------|----------|
| Tag mismatch | "Claude API" with `OPENAI` tag | Fix to `CLAUDE` tag |
| Cache entries | 1 preset | 3 presets (diverse similarity ranges) |
| Error scenario | None | ErrorScenarioToggle: `cache_connection_error` bypass |
| TTL simulation | None | Per-entry TTL countdown + auto-eviction |
| Cosine similarity | Number only | Color bar visualization (red 0.5 -> green 1.0) |

### 6.4 OAuth Flow Simulator (`sim-external.jsx`)

| Aspect | Current | Improved |
|--------|---------|----------|
| Navigation | Forward only | Back button + clickable step indicators |
| Error recovery | Stuck on error | "Retry" button for retry flow experience |
| Apple handling | Same as other providers | Step 5 shows "extract from id_token" branch, skip userinfo |
| WireMock code | None | Toggle to show WireMock stub code per step |

### 6.5 Stripe Webhook Simulator (`sim-platform.jsx`)

| Aspect | Current | Improved |
|--------|---------|----------|
| Event count | 4 | 5 (add `customer.subscription.updated` for up/downgrade) |
| State diagram | None | State machine visualization using `flow-node`, current state highlighted |
| Error scenario | None | ErrorScenarioToggle: `signature_verification_failed` -> 400 |
| Webhook signature | Display only | Step-by-step signature generation visualization (timestamp + payload -> HMAC-SHA256) |

---

## 7. Mock Route Map (Cross-Cutting, Phase 3)

### 7.1 Concept

Every mock explicitly shows: **which service/module owns it**, **where it calls in production**, **what replaces it in test**, and **which fixture file provides the data**.

### 7.2 Simulator Route Badge

Each simulator's log/result panel includes a `MOCK ROUTE` badge:

```
SERVICE: platform-svc / billing module
FROM:    platform-svc -> Stripe API
         POST https://api.stripe.com/v1/checkout/sessions
TO:      WireMock stub
         POST http://localhost:8089/v1/checkout/sessions
FILE:    __files/stripe/checkout-session-success.json
```

### 7.3 Per-Tab Route Mapping

| Tab | Simulator | Service/Module | From (Production) | To (Mock) |
|-----|-----------|---------------|-------------------|-----------|
| 01 | JwtBuilder | platform-svc / auth | Client -> `/auth/login` | MockDioAdapter fixture |
| 01 | Stripe Webhook | platform-svc / billing | Stripe -> `/webhooks/stripe` | EmbeddedKafka + WireMock |
| 01 | QuietHours | platform-svc / notification | platform-svc -> `fcm.googleapis.com` | WireMock |
| 02 | XPSimulator | engagement-svc / gamification | Kafka `card.reviewed` -> gamification | EmbeddedKafka fixture |
| 02 | Leaderboard | engagement-svc / gamification | gamification -> Redis ZSET | fakeredis |
| 03 | WikilinkParser | knowledge-svc / note | Internal parsing logic | Unit test (no mock) |
| 03 | KnowledgeGraph | knowledge-svc / graph | Client -> `/graph/neighbors/:id` | MockDioAdapter fixture |
| 03 | Chunking | knowledge-svc / chunking | knowledge-svc -> learning-ai `/internal/embeddings` | WireMock (16-dim) |
| 04 | SemanticCache | learning-ai / cache | learning-ai -> Redis | fakeredis |
| 04 | HybridSearch | learning-ai / search | learning-ai -> pgvector + Elasticsearch | Testcontainers |
| 04 | AICardGenerator | learning-ai / generation | learning-ai -> Anthropic `api.anthropic.com/v1/messages` | respx mock |
| 05 | MockResponseBrowser | flutter-app / all modules | Flutter -> All service APIs | MockDioAdapter |
| 06 | CloudEvents | all producers / Kafka | producer -> Kafka broker -> consumer | EmbeddedKafka / mock |
| 07 | OAuth | platform-svc / auth | platform-svc -> Google/GitHub/Apple/MS | WireMock per-provider |

### 7.4 Document Route Map Table

Each service document (01-07) gets a **Mock Route Map** section:

```markdown
## Mock Route Map

| # | Service/Module | Production Path | Test Mock Path | Mock Tool | Fixture File |
|---|---------------|-----------------|---------------|-----------|-------------|
```

`00-mocking-strategy.md` gets an integrated Mermaid diagram showing all cross-service mock routes.

---

## 8. Phase 3 — Remaining Simulator Enhancements + Document Scenarios

### 8.1 Simulator Concept Enhancements (Level A)

**Strategy Tab (00)**
- TestPyramid: Show 1 real test code snippet per layer on click
- SeedIdBrowser: Fix UUID padding bug + entity type filter dropdown
- ResponseWrapper: Custom error code input (400-599)

**Platform Tab (01)**
- JwtBuilder: Custom claims input, tenant dropdown (001/002), "differs from real JWT" note
- QuietHoursChecker: Unrestrict start/end ranges (0-23), add minute slider, timezone selector (KST/UTC/EST)

**Engagement Tab (02)**
- XPSimulator: "Increment streak" button, direct XP input field, EventBus leaderboard sync
- LeaderboardPreview: EventBus "YOU" row update, expand to 8 users, weekly/monthly reset button

**Knowledge Tab (03)**
- WikilinkParser: `[[target|alias]]` syntax support, dynamic noteId from seed IDs
- KnowledgeGraph: Add/remove node buttons, orphan detection display, responsive SVG

**Learning Tab (04)**
- HybridSearchRRF: Query change dropdown (3 presets), draggable rank reordering for RRF score exploration
- AICardGenerator: Template-based dynamic generation from input text, error scenarios (529), fix model name consistency

**Frontend Tab (05)**
- MockResponseBrowser: Fix `method: "*"` Dart codegen bug, per-service response counter, body search
- MockArchitecture: Clickable layers showing code patterns

**Kafka Tab (06)**
- TopicMap: Producer/consumer service filter, topic click scrolls to CloudEvents fixture
- EventFlowSimulator: Manual step mode toggle, error path scenario (Kafka publish fail -> retry)

**External Tab (07)**
- ExternalApiMatrix: Clickable scenario pills expand to show WireMock stub body

### 8.2 Document Missing Scenarios (Priority A)

| Document | Added Scenarios |
|----------|----------------|
| 01 Platform | Audit log query test (paging/filter). FCM mock credentials file content. Multi-tenant isolation test example |
| 02 Engagement | `community.report.created` Kafka test. Badge award + `gamification.badge.earned` event assertion. Group join rejection (capacity exceeded) error test |
| 03 Knowledge | S3 GET/DELETE presigned URL mock. Note version restore test. Concurrent edit optimistic lock test |
| 04 Learning | `card.review.due` batch cron test. AI generation error cases (empty response, token exceeded). Streaming Q&A mock |
| 05 Frontend | Golden test code (`matchesGoldenFile`). Offline/network failure fixtures. Auth flow widget test |
| 06 Kafka | `user.deleted` fixture registration. Avro schema inline (3 key topics) |
| 07 External | SES SNS bounce notification ingestion test. Stripe 503 retry test |

---

## 9. Phase 4 — HTML Sync + Executability + Verification

### 9.1 HTML Synchronization

- **Target**: `docs/00-strategy.html` ~ `docs/07-external.html`
- **Method**: Manual conversion of reinforced `.md` content into existing `.doc-shell` HTML structure
- **New elements**: Mock Route Map tables (`.md-table`), DLQ/error matrices, Mermaid diagrams (`.mermaid-block`), section anchor IDs for simulator deep-links

### 9.2 Document Executability Fixes (Priority B)

| Item | Document | Fix |
|------|----------|-----|
| `KafkaTestHelper.publishAndWait` | 06 | Add Awaitility polling condition (`until(() -> consumed.size() >= expected)`) |
| `HybridSearchService` placeholder | 04 | Complete constructor/DI code |
| Avro schema inline | 06 | Include schema body for 3 key topics |
| FCM mock credentials | 01 | Provide `firebase/mock-credentials.json` content |
| Apple id_token verification | 07 | Add JWT decoding + public key verification test code |

### 9.3 Final Verification Checklist

| Check | Method |
|-------|--------|
| No simulator runtime errors | Browser console check across all 8 tabs |
| EventBus connections work | Test XP->Leaderboard, SM2->Learning, Stripe->JWT |
| ErrorScenarioToggle works | Test all options in each simulator |
| Mock Route badges display | Verify service/module, From, To, File in all simulators |
| Document-simulator data consistency | Cross-check seed IDs, BASE_DATE, topic count, response count |
| HTML-MD content sync | Diff each HTML against its reinforced MD source |
| GitHub Pages deployment | Verify deploy.yml workflow succeeds |

---

## 10. Execution Summary

| Phase | Scope | Depth | Dependency |
|-------|-------|-------|-----------|
| 0 | 5 bug fixes across all tabs | Quick fixes | None |
| 1 | 4 infrastructure items | Medium (EventBus, components) | Phase 0 |
| 2a | 4 doc sections + per-service additions | Content writing | Phase 0 |
| 2b | 5 core simulators | Deep logic accuracy | Phase 1 |
| 3 | ~14 simulator enhancements + 7 doc scenario sets + Mock Route Map | Breadth (A-level) | Phase 1, 2a |
| 4 | 8 HTML files + 5 executability fixes + verification | Sync + QA | Phase 2a, 2b, 3 |
