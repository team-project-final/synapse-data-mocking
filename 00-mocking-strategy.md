# 목킹 전략서 (Mocking Strategy)

> **프로젝트**: Synapse — 통합 학습-지식 그래프 SaaS
> **버전**: v1.0
> **작성일**: 2026-05-14
> **대상**: 전 서비스 개발자 + 팀 리드

---

## 1. 목킹 원칙

### 1.1 테스트 피라미드 내 위치

```
        ╱╲
       ╱ E2E ╲          실제 인프라 (staging 환경)
      ╱────────╲
     ╱ Integration ╲    Testcontainers (실제 DB/Redis/ES 경량 인스턴스)
    ╱────────────────╲
   ╱   Unit / Service  ╲  WireMock + EmbeddedKafka + Mock 객체
  ╱──────────────────────╲
```

### 1.2 격리 기준

| 테스트 레벨 | 목킹 대상 | 도구 | 속도 |
|------------|-----------|------|------|
| Unit | 같은 모듈 내 의존성 | Mockito (Java/Dart), unittest.mock (Python) | < 100ms |
| Service Integration | 외부 서비스 API, Kafka, 외부 API | WireMock, EmbeddedKafka | < 5s |
| Infra Integration | DB, Redis, Elasticsearch | Testcontainers | < 30s |
| Contract | 서비스 간 API 계약 | Spring Cloud Contract | < 10s |
| E2E | 없음 (실제 환경) | — | < 60s |

### 1.3 핵심 원칙

1. **실제에 가깝게**: Mock보다 Testcontainers를 우선. DB/Redis/ES는 항상 실제 인스턴스.
2. **외부만 격리**: 외부 API(Stripe, OAuth, FCM, OpenAI)는 항상 WireMock으로 격리.
3. **서비스 간 = 계약**: 서비스 간 통신은 Spring Cloud Contract로 계약 검증.
4. **Kafka = 실제 토픽**: EmbeddedKafka로 실제 직렬화/역직렬화 검증 (Avro 포함).
5. **Fixture 일관성**: 모든 fixture는 동일한 시드 데이터 규약을 따름.

---

## 2. 도구 스택 매트릭스

### 2.1 Java/Spring Boot 서비스 (platform, engagement, knowledge, learning-card)

| 도구 | 의존성 | 용도 |
|------|--------|------|
| **WireMock** | `org.wiremock:wiremock-standalone:3.5.4` | 외부 REST API mock (Stripe, OAuth, FCM, SES, OpenAI) + 서비스 간 Internal API mock |
| **EmbeddedKafka** | `org.springframework.kafka:spring-kafka-test` | Kafka Producer/Consumer 테스트, Avro 직렬화 검증 |
| **Testcontainers** | `org.testcontainers:testcontainers:1.19.8` | PostgreSQL, Redis, Elasticsearch 실제 인스턴스 |
| **Spring Cloud Contract** | `org.springframework.cloud:spring-cloud-contract-verifier:4.1.3` | Producer-Consumer API 계약 검증 |
| **Mockito** | `org.mockito:mockito-core:5.12.0` | Unit 테스트 내부 의존성 mock |

**Gradle 의존성 (공통):**

```kotlin
// build.gradle.kts — testImplementation
dependencies {
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.kafka:spring-kafka-test")
    testImplementation("org.testcontainers:testcontainers:1.19.8")
    testImplementation("org.testcontainers:postgresql:1.19.8")
    testImplementation("org.testcontainers:kafka:1.19.8")
    testImplementation("org.wiremock:wiremock-standalone:3.5.4")
    testImplementation("org.springframework.cloud:spring-cloud-contract-stub-runner:4.1.3")
}
```

### 2.2 Python/FastAPI 서비스 (learning-ai)

| 도구 | 패키지 | 용도 |
|------|--------|------|
| **pytest** | `pytest==8.2.0` | 테스트 프레임워크 |
| **httpx + AsyncClient** | `httpx==0.27.0` | FastAPI 테스트 클라이언트 |
| **respx** | `respx==0.21.1` | httpx 기반 외부 API mock (OpenAI, Claude) |
| **fakeredis** | `fakeredis[lua]==2.23.0` | Redis mock (시맨틱 캐시) |
| **testcontainers-python** | `testcontainers==4.4.0` | PostgreSQL + pgvector, Elasticsearch |
| **unittest.mock** | (stdlib) | 내부 의존성 mock |
| **confluent-kafka mock** | `confluent-kafka==2.4.0` + `pytest-kafka` | Kafka Consumer/Producer 테스트 |

**pyproject.toml (dev dependencies):**

```toml
[tool.poetry.group.dev.dependencies]
pytest = "^8.2.0"
pytest-asyncio = "^0.23.7"
httpx = "^0.27.0"
respx = "^0.21.1"
fakeredis = {extras = ["lua"], version = "^2.23.0"}
testcontainers = "^4.4.0"
pytest-kafka = "^0.6.0"
```

### 2.3 Flutter 프론트엔드

| 도구 | 패키지 | 용도 |
|------|--------|------|
| **Mockito** | `mockito: ^5.4.4` | Repository/Provider mock |
| **dio mock adapter** | `dio_mock_interceptor: ^2.0.0` | HTTP 호출 mock |
| **build_runner** | `build_runner: ^2.4.9` | Mockito code generation |
| **mocktail** | `mocktail: ^1.0.3` | 대안 mock (code-gen 불필요) |

**pubspec.yaml (dev_dependencies):**

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  mockito: ^5.4.4
  build_runner: ^2.4.9
  dio_mock_interceptor: ^2.0.0
  mocktail: ^1.0.3
```

---

## 3. 공통 규약

### 3.1 시드 ID 체계

모든 fixture에서 사용하는 고정 UUID:

```
# Tenant
tenant-00000000-0000-0000-0000-000000000001  (기본 테넌트)
tenant-00000000-0000-0000-0000-000000000002  (Team 플랜 테넌트)

# Users
user-00000000-0000-0000-0000-000000000001   (일반 사용자 — Free)
user-00000000-0000-0000-0000-000000000002   (Pro 사용자)
user-00000000-0000-0000-0000-000000000003   (Team Owner)
user-00000000-0000-0000-0000-000000000004   (Team Member)
user-00000000-0000-0000-0000-000000000005   (Admin)

# Notes
note-00000000-0000-0000-0000-000000000001   (기본 노트)
note-00000000-0000-0000-0000-000000000002   (위키링크 대상 노트)
note-00000000-0000-0000-0000-000000000003   (긴 노트 — 청킹 대상)

# Decks
deck-00000000-0000-0000-0000-000000000001   (기본 덱)
deck-00000000-0000-0000-0000-000000000002   (공유 덱)

# Cards
card-00000000-0000-0000-0000-000000000001   (basic 카드)
card-00000000-0000-0000-0000-000000000002   (cloze 카드)
card-00000000-0000-0000-0000-000000000003   (AI 생성 카드)

# Groups
group-00000000-0000-0000-0000-000000000001  (기본 그룹)
group-00000000-0000-0000-0000-000000000002  (비공개 그룹)

# Sessions
session-00000000-0000-0000-0000-000000000001 (복습 세션)
```

### 3.2 시간 고정 전략

| 용도 | 고정 시각 | 설명 |
|------|----------|------|
| 기준 시각 | `2026-01-15T10:00:00Z` | 모든 fixture의 `createdAt` 기본값 |
| 오늘 due | `2026-01-15` | SRS 오늘 복습 대상 |
| 내일 due | `2026-01-16` | SRS 미래 복습 |
| 어제 due | `2026-01-14` | SRS 과거 (overdue) |
| 스트릭 시작 | `2026-01-08` | 7일 스트릭 시작일 |

**Java 시간 고정:**

```java
@BeforeEach
void fixClock() {
    Clock fixedClock = Clock.fixed(
        Instant.parse("2026-01-15T10:00:00Z"),
        ZoneId.of("UTC")
    );
    // 서비스에 Clock 주입
}
```

**Python 시간 고정:**

```python
import freezegun

@freezegun.freeze_time("2026-01-15T10:00:00Z")
def test_something():
    ...
```

**Dart 시간 고정:**

```dart
withClock(Clock.fixed(DateTime.utc(2026, 1, 15, 10, 0, 0)), () {
  // 테스트 코드
});
```

### 3.3 공통 응답 래퍼

모든 mock response는 Synapse API 공통 형식을 따름:

```json
{
  "success": true,
  "data": { "..." },
  "meta": {
    "timestamp": "2026-01-15T10:00:00Z",
    "requestId": "req-00000000-0000-0000-0000-000000000001"
  }
}
```

에러 응답:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": []
  },
  "meta": {
    "timestamp": "2026-01-15T10:00:00Z",
    "requestId": "req-00000000-0000-0000-0000-000000000001"
  }
}
```

### 3.4 Fixture 네이밍 컨벤션

| 유형 | 패턴 | 예시 |
|------|------|------|
| WireMock 매핑 | `{service}_{module}_{operation}_{scenario}_mapping.json` | `platform_auth_oauth_google_success_mapping.json` |
| WireMock 응답 | `{service}_{module}_{operation}_{scenario}_response.json` | `platform_auth_oauth_google_success_response.json` |
| Kafka fixture | `{topic_name}_{scenario}.avro.json` | `note_created_success.avro.json` |
| DB 시드 | `{service}_{module}_seed.sql` | `engagement_gamification_seed.sql` |
| Dart mock | `mock_{service}_{module}_responses.dart` | `mock_learning_cards_responses.dart` |

### 3.5 Fixture 파일 위치 (실제 프로젝트 내)

```
# Java 서비스
src/test/resources/
├── wiremock/
│   ├── mappings/       # WireMock 매핑 JSON
│   └── __files/        # WireMock 응답 body
├── fixtures/
│   ├── kafka/          # Kafka 이벤트 fixture
│   └── db/             # DB 시드 SQL
└── application-test.yml

# Python 서비스
tests/
├── fixtures/
│   ├── kafka/          # Kafka 이벤트 fixture
│   ├── api_responses/  # 외부 API mock 응답
│   └── db/             # DB 시드 데이터
└── conftest.py

# Flutter
test/
├── fixtures/
│   └── responses/      # Mock API 응답 JSON
├── mocks/              # Generated mock classes
└── helpers/            # Test utility functions
```

---

## 4. 환경별 적용 가이드

### 4.1 로컬 개발 환경

**docker-compose.mock.yml:**

```yaml
version: "3.9"
services:
  wiremock:
    image: wiremock/wiremock:3.5.4
    ports:
      - "8090:8080"
    volumes:
      - ./wiremock:/home/wiremock
    command: --verbose --global-response-templating

  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: synapse_test
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: test_password

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m

  kafka:
    image: confluentinc/cp-kafka:7.6.1
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.1
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  schema-registry:
    image: confluentinc/cp-schema-registry:7.6.1
    ports:
      - "8081:8081"
    environment:
      SCHEMA_REGISTRY_HOST_NAME: schema-registry
      SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS: kafka:9092
```

**실행:**

```bash
docker compose -f docker-compose.mock.yml up -d
```

### 4.2 CI 환경 (GitHub Actions)

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_DB: synapse_test
          POSTGRES_USER: synapse
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - name: Run tests with Testcontainers
        run: ./gradlew test
        env:
          TESTCONTAINERS_REUSE_ENABLE: true
          SPRING_PROFILES_ACTIVE: test
```

### 4.3 통합 테스트 환경 (Spring Cloud Contract)

**Stub Runner 설정 (Consumer 측):**

```yaml
# application-contract-test.yml
stubrunner:
  ids:
    - com.synapse:learning-card:+:stubs:8091
  stubs-mode: LOCAL
```

**Producer 측 Contract 정의:**

```groovy
// learning-card/src/test/resources/contracts/copyDeck.groovy
Contract.make {
    request {
        method POST()
        url "/internal/decks/copy"
        headers {
            contentType applicationJson()
        }
        body([
            sourceDeckId: anyUuid(),
            targetUserId: anyUuid(),
            targetTenantId: anyUuid()
        ])
    }
    response {
        status CREATED()
        headers {
            contentType applicationJson()
        }
        body([
            copiedDeckId: anyUuid(),
            cardCount: anyPositiveInt()
        ])
    }
}
```

---

## 5. WireMock 공통 설정

### 5.1 Spring Boot 통합

```java
@SpringBootTest
@AutoConfigureWireMock(port = 0)  // 랜덤 포트
public abstract class AbstractWireMockTest {

    @Autowired
    protected WireMockServer wireMockServer;

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        registry.add("external.oauth.google.base-url",
            () -> "http://localhost:" + wireMockServer.port());
        registry.add("external.stripe.base-url",
            () -> "http://localhost:" + wireMockServer.port());
        // ... 기타 외부 API base URL
    }

    @BeforeEach
    void resetWireMock() {
        wireMockServer.resetAll();
    }
}
```

### 5.2 Standalone 실행 (로컬 개발)

```bash
# WireMock standalone 실행
java -jar wiremock-standalone-3.5.4.jar \
  --port 8090 \
  --root-dir ./wiremock \
  --verbose \
  --global-response-templating
```

---

## 6. Testcontainers 공통 설정

### 6.1 Java 베이스 클래스

```java
@Testcontainers
@SpringBootTest
public abstract class AbstractIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
        DockerImageName.parse("pgvector/pgvector:pg16")
    )
        .withDatabaseName("synapse_test")
        .withUsername("synapse")
        .withPassword("test_password")
        .withInitScript("db/init.sql");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>(
        DockerImageName.parse("redis:7-alpine")
    )
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }
}
```

### 6.2 Python 베이스 (conftest.py)

```python
import pytest
from testcontainers.postgres import PostgresContainer
from testcontainers.elasticsearch import ElasticSearchContainer

@pytest.fixture(scope="session")
def postgres_container():
    with PostgresContainer("pgvector/pgvector:pg16") as pg:
        yield pg

@pytest.fixture(scope="session")
def es_container():
    with ElasticSearchContainer("elasticsearch:8.13.0") as es:
        yield es
```

---

## 7. 문서 참조 맵

| 문서 | 참조 대상 |
|------|-----------|
| `01-platform-svc-mocking.md` | → 06 (Kafka), → 07 (OAuth, Stripe, FCM, SES) |
| `02-engagement-svc-mocking.md` | → 06 (Kafka), → 04 (Internal API contract) |
| `03-knowledge-svc-mocking.md` | → 06 (Kafka), → 07 (S3) |
| `04-learning-svc-mocking.md` | → 06 (Kafka), → 07 (OpenAI, Claude) |
| `05-frontend-mocking.md` | → 01~04 (API 응답 형식 참조) |
| `06-kafka-event-mocking.md` | → synapse-shared 레포 Avro 스키마 |
| `07-external-api-mocking.md` | (독립) |
