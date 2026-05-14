# Learning Service 목킹 정의서

> **프로젝트**: Synapse — 통합 학습-지식 그래프 SaaS
> **서비스**: synapse-learning-svc
> **Owner**: `@learning-card-owner` (조유지 — Java), `@learning-ai-owner` (김나경 — Python)
> **컨테이너**: learning-card (Spring Boot), learning-ai (FastAPI)
> **작성일**: 2026-05-14

---

## Part A — learning-card (Java / Spring Boot)

### 1. 서비스 의존성 맵

```mermaid
graph LR
    subgraph learning-card
        CARD[card 모듈]
        SRS[srs 모듈]
    end

    subgraph Infrastructure
        PG[(PostgreSQL)]
        REDIS[(Redis)]
        KAFKA[Kafka]
    end

    CARD --> PG
    SRS --> PG
    SRS --> REDIS
    SRS -->|Producer: card.reviewed, card.review.due| KAFKA
    CARD -->|Provider: /internal/decks/copy| CARD
```

### 2. card 모듈

#### 2.1 목킹 인터페이스 목록

| # | 목킹 대상 | 통신 방식 | 방향 | 도구 |
|---|-----------|----------|------|------|
| 1 | PostgreSQL (decks, cards) | SQL | Outbound | Testcontainers |

#### 2.2 PostgreSQL 시드 데이터

```sql
-- learning_card_seed.sql

-- Decks
INSERT INTO decks (id, tenant_id, user_id, name, description, card_count, created_at) VALUES
('deck-00000000-0000-0000-0000-000000000001', 'tenant-00000000-0000-0000-0000-000000000001', 'user-00000000-0000-0000-0000-000000000001', '프로그래밍 기초 덱', 'Java, Python 등 기초 개념', 3, '2026-01-15T10:00:00Z'),
('deck-00000000-0000-0000-0000-000000000002', 'tenant-00000000-0000-0000-0000-000000000001', 'user-00000000-0000-0000-0000-000000000001', '알고리즘 마스터 덱', '정렬, 탐색, DP', 0, '2026-01-15T10:00:00Z');

-- Cards
INSERT INTO cards (id, tenant_id, deck_id, user_id, card_type, front_content, back_content, source_note_id, created_at) VALUES
('card-00000000-0000-0000-0000-000000000001', 'tenant-00000000-0000-0000-0000-000000000001', 'deck-00000000-0000-0000-0000-000000000001', 'user-00000000-0000-0000-0000-000000000001', 'basic', 'TCP와 UDP의 차이점은?', 'TCP는 연결 지향적, 신뢰성 보장. UDP는 비연결, 빠른 전송.', 'note-00000000-0000-0000-0000-000000000001', '2026-01-15T10:00:00Z'),
('card-00000000-0000-0000-0000-000000000002', 'tenant-00000000-0000-0000-0000-000000000001', 'deck-00000000-0000-0000-0000-000000000001', 'user-00000000-0000-0000-0000-000000000001', 'cloze', '{{c1::정규화}}는 과적합을 방지하는 기법이다.', '', 'note-00000000-0000-0000-0000-000000000001', '2026-01-15T10:01:00Z'),
('card-00000000-0000-0000-0000-000000000003', 'tenant-00000000-0000-0000-0000-000000000001', 'deck-00000000-0000-0000-0000-000000000001', 'user-00000000-0000-0000-0000-000000000001', 'basic', 'AI가 생성한 질문?', 'AI가 생성한 답변', NULL, '2026-01-15T10:02:00Z');

-- Card Schedules (SRS)
INSERT INTO card_schedules (card_id, user_id, easiness_factor, interval_days, repetitions, due_date, last_reviewed_at) VALUES
('card-00000000-0000-0000-0000-000000000001', 'user-00000000-0000-0000-0000-000000000001', 2.5, 7, 3, '2026-01-15', '2026-01-08T10:00:00Z'),
('card-00000000-0000-0000-0000-000000000002', 'user-00000000-0000-0000-0000-000000000001', 2.1, 1, 1, '2026-01-15', '2026-01-14T10:00:00Z'),
('card-00000000-0000-0000-0000-000000000003', 'user-00000000-0000-0000-0000-000000000001', 2.5, 0, 0, '2026-01-15', NULL);
```

### 3. srs 모듈

#### 3.1 목킹 인터페이스 목록

| # | 목킹 대상 | 통신 방식 | 방향 | 도구 |
|---|-----------|----------|------|------|
| 1 | Redis (세션 캐시) | Redis Protocol | Outbound | Testcontainers |
| 2 | Kafka Producer (`card.reviewed`) | Kafka | Outbound | EmbeddedKafka |
| 3 | Kafka Producer (`card.review.due`) | Kafka | Outbound | EmbeddedKafka |
| 4 | PostgreSQL (card_schedules, review_sessions) | SQL | Outbound | Testcontainers |

#### 3.2 SM-2 알고리즘 검증 fixture

| rating | 이전 EF | 이전 interval | 기대 새 EF | 기대 새 interval | 기대 due_date |
|--------|---------|-------------|-----------|-----------------|--------------|
| 0 (완전 오답) | 2.5 | 7 | 1.7 | 1 | 2026-01-16 |
| 1 (거의 오답) | 2.5 | 7 | 1.96 | 1 | 2026-01-16 |
| 2 (어렵게 맞음) | 2.5 | 7 | 2.36 | 1 | 2026-01-16 |
| 3 (보통) | 2.5 | 7 | 2.36 | 7 | 2026-01-22 |
| 4 (쉬움) | 2.5 | 7 | 2.5 | 18 | 2026-02-02 |
| 5 (매우 쉬움) | 2.5 | 7 | 2.6 | 18 | 2026-02-02 |

```java
@ParameterizedTest
@CsvSource({
    "0, 2.5, 7, 1.7, 1",
    "1, 2.5, 7, 1.96, 1",
    "2, 2.5, 7, 2.36, 1",
    "3, 2.5, 7, 2.36, 7",
    "4, 2.5, 7, 2.5, 18",
    "5, 2.5, 7, 2.6, 18"
})
void sm2_shouldCalculateCorrectly(int rating, double oldEF, int oldInterval,
                                   double expectedEF, int expectedInterval) {
    SM2Result result = SM2Algorithm.calculate(rating, oldEF, oldInterval, 3);

    assertThat(result.easinessFactor()).isCloseTo(expectedEF, within(0.01));
    assertThat(result.intervalDays()).isEqualTo(expectedInterval);
}
```

#### 3.3 Review Session fixture

```java
@Test
void startSession_shouldCreateSessionAndCacheInRedis() {
    String requestBody = """
        {"deckId": "deck-00000000-0000-0000-0000-000000000001"}
        """;

    MvcResult result = mockMvc.perform(post("/reviews/sessions")
            .header("Authorization", "Bearer " + JwtTestFactory.USER1_TOKEN)
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.sessionId").exists())
        .andExpect(jsonPath("$.data.totalCards").value(3))
        .andReturn();

    // Redis에 세션 캐시 확인
    String sessionId = JsonPath.read(result.getResponse().getContentAsString(), "$.data.sessionId");
    String cached = redisTemplate.opsForValue().get("session:" + sessionId);
    assertThat(cached).isNotNull();
}

@Test
void submitRating_shouldUpdateScheduleAndPublishEvent() {
    String requestBody = """
        {"cardId": "card-00000000-0000-0000-0000-000000000001", "rating": 4, "timeSpentMs": 5000}
        """;

    mockMvc.perform(post("/reviews/sessions/session-00000000-0000-0000-0000-000000000001/submit")
            .header("Authorization", "Bearer " + JwtTestFactory.USER1_TOKEN)
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.nextInterval").value(18))
        .andExpect(jsonPath("$.data.newEF").value(2.5));

    // Kafka event 확인
    List<ConsumerRecord<String, Object>> records =
        kafkaTestHelper.consumeMessages("card.reviewed", 1, Duration.ofSeconds(5));
    assertThat(records).hasSize(1);
}
```

#### 3.4 due_date 조회 테스트

```java
@Test
void getReviewQueue_shouldReturnOnlyDueCards() {
    // given — due_date가 2026-01-15인 카드 3장 존재 (시드 데이터)

    // when
    mockMvc.perform(get("/reviews/queue")
            .header("Authorization", "Bearer " + JwtTestFactory.USER1_TOKEN))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalDue").value(3))
        .andExpect(jsonPath("$.data.cards").isArray())
        .andExpect(jsonPath("$.data.cards.length()").value(3));
}
```

### 4. Spring Cloud Contract — Provider Stub

learning-card는 `/internal/decks/copy`의 **Provider** 이므로 contract을 정의한다.

```groovy
// src/test/resources/contracts/internal/copyDeck.groovy
Contract.make {
    description "Internal API: copy deck for community sharing"
    request {
        method POST()
        url "/internal/decks/copy"
        headers {
            contentType applicationJson()
            header("X-Internal-Auth", matching(".*"))
        }
        body([
            sourceDeckId: $(anyUuid()),
            targetUserId: $(anyUuid()),
            targetTenantId: $(anyUuid()),
            newDeckName: $(optional(anyNonBlankString()))
        ])
    }
    response {
        status CREATED()
        headers {
            contentType applicationJson()
        }
        body([
            copiedDeckId: $(anyUuid()),
            cardCount: $(anyPositiveInt())
        ])
    }
}
```

### 5. Review Session PostgreSQL 시드

```sql
-- learning_srs_seed.sql

-- Review Sessions
INSERT INTO review_sessions (id, tenant_id, user_id, deck_id, total_cards, completed_cards, status, started_at) VALUES
('session-00000000-0000-0000-0000-000000000001', 'tenant-00000000-0000-0000-0000-000000000001', 'user-00000000-0000-0000-0000-000000000001', 'deck-00000000-0000-0000-0000-000000000001', 3, 0, 'in_progress', '2026-01-15T10:00:00Z');
```

---

## Part B — learning-ai (Python / FastAPI)

### 6. 서비스 의존성 맵

```mermaid
graph LR
    subgraph learning-ai
        AI[ai 모듈]
    end

    subgraph External APIs
        OPENAI[OpenAI API]
        CLAUDE[Anthropic Claude API]
    end

    subgraph Infrastructure
        PG[(PostgreSQL<br/>+ pgvector)]
        ES[(Elasticsearch)]
        REDIS[(Redis)]
        KAFKA[Kafka]
    end

    AI --> OPENAI
    AI --> CLAUDE
    AI --> PG
    AI --> ES
    AI --> REDIS
    AI -->|Consumer: note.created, note.updated| KAFKA
```

### 7. ai 모듈 — 목킹 인터페이스 목록

| # | 목킹 대상 | 통신 방식 | 방향 | 도구 |
|---|-----------|----------|------|------|
| 1 | OpenAI Embeddings API | REST | Outbound | respx |
| 2 | Anthropic Claude API | REST | Outbound | respx |
| 3 | PostgreSQL + pgvector | SQL | Outbound | testcontainers-python |
| 4 | Elasticsearch (BM25) | REST | Outbound | testcontainers-python |
| 5 | Redis (시맨틱 캐시) | Redis Protocol | Outbound | fakeredis |
| 6 | Kafka Consumer | Kafka | Inbound | confluent-kafka mock |

### 8. OpenAI Embeddings Mock (respx)

```python
import respx
import httpx
import json
from pathlib import Path

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "api_responses"

OPENAI_EMBEDDING_SUCCESS = {
    "object": "list",
    "data": [
        {
            "object": "embedding",
            "index": 0,
            "embedding": [0.0023, -0.0121, 0.0156, 0.0087, -0.0203, 0.0312,
                         -0.0045, 0.0189, 0.0267, -0.0134, 0.0098, 0.0211,
                         -0.0176, 0.0043, 0.0289, -0.0067]
        }
    ],
    "model": "text-embedding-3-small",
    "usage": {"prompt_tokens": 15, "total_tokens": 15}
}


@respx.mock
async def test_generate_embedding():
    respx.post("https://api.openai.com/v1/embeddings").mock(
        return_value=httpx.Response(200, json=OPENAI_EMBEDDING_SUCCESS)
    )

    from app.ai.embedding_service import EmbeddingService
    service = EmbeddingService()
    result = await service.generate("머신러닝에서 과적합이란?")

    assert len(result) == 16
    assert respx.calls.call_count == 1
```

### 9. Anthropic Claude Mock (respx)

```python
CLAUDE_CARD_GENERATION_SUCCESS = {
    "id": "msg_mock_001",
    "type": "message",
    "role": "assistant",
    "content": [
        {
            "type": "text",
            "text": json.dumps([
                {
                    "cardType": "basic",
                    "frontContent": "머신러닝에서 과적합이란?",
                    "backContent": "훈련 데이터에 과도하게 맞춰져 새 데이터에 일반화 못하는 현상",
                    "confidence": 0.95
                },
                {
                    "cardType": "basic",
                    "frontContent": "과적합 방지 기법 3가지는?",
                    "backContent": "정규화, 드롭아웃, 교차 검증",
                    "confidence": 0.92
                }
            ])
        }
    ],
    "model": "claude-sonnet-4-20250514",
    "stop_reason": "end_turn",
    "usage": {"input_tokens": 800, "output_tokens": 150}
}


@respx.mock
async def test_generate_cards_from_note():
    respx.post("https://api.anthropic.com/v1/messages").mock(
        return_value=httpx.Response(200, json=CLAUDE_CARD_GENERATION_SUCCESS)
    )

    from app.ai.card_generator import CardGenerator
    generator = CardGenerator()
    cards = await generator.generate(
        note_text="머신러닝은 인공지능의 한 분야로...",
        card_type="basic",
        count=5
    )

    assert len(cards) == 2
    assert cards[0]["cardType"] == "basic"
    assert cards[0]["confidence"] > 0.9
```

### 10. Redis 시맨틱 캐시 Mock (fakeredis)

```python
import fakeredis
import pytest


@pytest.fixture
def redis_client():
    return fakeredis.FakeRedis(decode_responses=True)


async def test_semantic_cache_hit(redis_client):
    """코사인 유사도 > 0.95일 때 캐시 히트"""
    from app.ai.semantic_cache import SemanticCache

    cache = SemanticCache(redis_client=redis_client, threshold=0.95)

    # 캐시에 저장
    query_embedding = [0.1] * 16
    cached_response = {"answer": "캐시된 답변", "sources": ["note-001"]}
    await cache.put(query_embedding, cached_response)

    # 동일 임베딩으로 조회 → 히트
    result = await cache.get(query_embedding)
    assert result is not None
    assert result["answer"] == "캐시된 답변"


async def test_semantic_cache_miss(redis_client):
    """코사인 유사도 < 0.95일 때 캐시 미스"""
    from app.ai.semantic_cache import SemanticCache

    cache = SemanticCache(redis_client=redis_client, threshold=0.95)

    # 캐시에 저장
    query_embedding = [0.1] * 16
    cached_response = {"answer": "캐시된 답변"}
    await cache.put(query_embedding, cached_response)

    # 다른 임베딩으로 조회 → 미스
    different_embedding = [0.9] * 16
    result = await cache.get(different_embedding)
    assert result is None
```

### 11. Kafka Consumer Mock

```python
from unittest.mock import MagicMock, patch


def test_note_created_consumer_triggers_card_generation():
    """note.created 소비 시 카드 자동 생성 트리거"""
    event_data = {
        "noteId": "note-00000000-0000-0000-0000-000000000001",
        "userId": "user-00000000-0000-0000-0000-000000000001",
        "title": "머신러닝 기초 정리",
        "contentLength": 2500,
        "tags": ["머신러닝", "AI"]
    }

    with patch("app.ai.card_generator.CardGenerator.generate") as mock_generate:
        mock_generate.return_value = [
            {"cardType": "basic", "frontContent": "Q", "backContent": "A"}
        ]

        from app.ai.consumers import handle_note_created
        handle_note_created(event_data)

        mock_generate.assert_called_once()


def test_note_updated_consumer_regenerates_embeddings():
    """note.updated 소비 시 임베딩 재생성"""
    event_data = {
        "noteId": "note-00000000-0000-0000-0000-000000000001",
        "userId": "user-00000000-0000-0000-0000-000000000001",
        "title": "머신러닝 기초 정리 (수정)",
        "contentLength": 3200,
        "version": 2,
        "changedFields": ["content"]
    }

    with patch("app.ai.embedding_service.EmbeddingService.regenerate_for_note") as mock_regen:
        from app.ai.consumers import handle_note_updated
        handle_note_updated(event_data)

        mock_regen.assert_called_once_with(
            note_id="note-00000000-0000-0000-0000-000000000001"
        )
```

### 12. 시맨틱 검색 테스트 (pgvector)

```python
import pytest
from testcontainers.postgres import PostgresContainer


@pytest.fixture(scope="session")
def pg_container():
    with PostgresContainer(
        image="pgvector/pgvector:pg16",
        dbname="synapse_learning_test"
    ) as pg:
        yield pg


async def test_semantic_search(pg_container):
    """시맨틱 검색: 쿼리 임베딩 → cosine similarity 기반 결과"""
    from app.ai.search_service import SemanticSearchService

    service = SemanticSearchService(db_url=pg_container.get_connection_url())

    # 시드 데이터 삽입 (note_chunks with embeddings)
    await service.insert_chunk(
        note_id="note-00000000-0000-0000-0000-000000000001",
        chunk_text="과적합을 방지하기 위해 정규화 기법을 사용한다.",
        embedding=[0.1] * 16
    )

    # 검색
    results = await service.search(
        query_embedding=[0.1] * 16,
        limit=10,
        threshold=0.7
    )

    assert len(results) >= 1
    assert results[0]["noteId"] == "note-00000000-0000-0000-0000-000000000001"
    assert results[0]["score"] >= 0.7
```

### 13. 하이브리드 검색 (RRF) 테스트

```python
async def test_hybrid_search_rrf():
    """시맨틱 + BM25 → RRF(Reciprocal Rank Fusion) 결합"""
    from app.ai.search_service import HybridSearchService

    service = HybridSearchService(...)

    # Mock semantic results
    semantic_results = [
        {"noteId": "note-001", "score": 0.95, "rank": 1},
        {"noteId": "note-002", "score": 0.85, "rank": 2},
        {"noteId": "note-003", "score": 0.75, "rank": 3},
    ]

    # Mock BM25 results
    bm25_results = [
        {"noteId": "note-002", "score": 12.5, "rank": 1},
        {"noteId": "note-001", "score": 10.2, "rank": 2},
        {"noteId": "note-004", "score": 8.1, "rank": 3},
    ]

    # RRF fusion (k=60)
    fused = service.rrf_merge(semantic_results, bm25_results, k=60)

    # note-002는 양쪽 모두 상위 → RRF 점수 최고
    assert fused[0]["noteId"] == "note-002"
    # note-001은 양쪽 존재하지만 semantic 1위, bm25 2위
    assert fused[1]["noteId"] == "note-001"
```

### 14. conftest.py (전체)

```python
import pytest
import fakeredis
from pathlib import Path
from unittest.mock import MagicMock

FIXTURE_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def redis_client():
    """fakeredis 인스턴스"""
    return fakeredis.FakeRedis(decode_responses=True)


@pytest.fixture
def kafka_consumer_mock():
    """Kafka Consumer mock"""
    consumer = MagicMock()
    consumer.messages = []
    return consumer


@pytest.fixture
def kafka_producer_mock():
    """Kafka Producer mock"""
    producer = MagicMock()
    producer.sent = []

    def mock_produce(topic, key=None, value=None, **kwargs):
        producer.sent.append({"topic": topic, "key": key, "value": value})

    producer.produce = mock_produce
    return producer


def load_fixture(name: str) -> dict:
    """JSON fixture 로드"""
    import json
    with open(FIXTURE_DIR / f"{name}.json") as f:
        return json.load(f)
```

---

## 15. application-test.yml (learning-card)

```yaml
spring:
  profiles:
    active: test
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
  data:
    redis:
      host: ${SPRING_DATA_REDIS_HOST}
      port: ${SPRING_DATA_REDIS_PORT}
  kafka:
    bootstrap-servers: ${spring.embedded.kafka.brokers}
    consumer:
      auto-offset-reset: earliest
      group-id: learning-card-test-group
    properties:
      schema.registry.url: mock://test-schema-registry

jwt:
  secret: test-jwt-secret-key-must-be-at-least-256-bits-long-for-hs256

srs:
  review-due:
    batch-cron: "0 0 7 * * *"
    timezone: Asia/Seoul
```

## 16. pytest.ini (learning-ai)

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
env =
    DATABASE_URL=postgresql://synapse:test@localhost:5432/synapse_learning_test
    REDIS_URL=redis://localhost:6379/0
    OPENAI_API_KEY=sk-test-mock-key
    ANTHROPIC_API_KEY=sk-ant-test-mock-key
    KAFKA_BOOTSTRAP_SERVERS=localhost:9092
    ELASTICSEARCH_URL=http://localhost:9200
```
