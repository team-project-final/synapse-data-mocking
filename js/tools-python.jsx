// ===== Tab 09: Python Mocking Tools =====

function PageToolsPython() {
  return (
    <div className="page-root">
      <DocHero doc={DOCS[9]} />
      <ToolDocCTA doc={DOCS[9]} />

      <Section num="1" title="개요 — Python 테스트 의존성" sub="requirements-test.txt 한눈에 보기">
        <Panel title="requirements-test.txt">
          <Code>{`# Testing
pytest==9.0.0
pytest-asyncio==0.24.0
httpx==0.28.0

# External API mock
respx==0.21.1

# Redis mock
fakeredis==2.23.0

# Infrastructure containers
testcontainers==4.4.0

# Coverage
pytest-cov==5.0.0`}</Code>
          <CopyBtn text={`pytest==9.0.0\npytest-asyncio==0.24.0\nhttpx==0.28.0\nrespx==0.21.1\nfakeredis==2.23.0\ntestcontainers==4.4.0\npytest-cov==5.0.0`} />
        </Panel>
        <div style={{ marginTop: 16 }}>
          <table className="table">
            <thead><tr><th>도구</th><th>버전</th><th>용도</th><th>레이어</th></tr></thead>
            <tbody>
              {[
                ["pytest + httpx", "9.x + 0.28.x", "FastAPI 비동기 테스트", "Integration"],
                ["respx", "0.21.1", "외부 HTTP API mock (httpx 기반)", "Service Integration"],
                ["fakeredis", "2.23.0", "Redis 시맨틱 캐시 mock", "Infra Integration"],
                ["testcontainers", "4.4.0", "Docker 인프라 (PostgreSQL+pgvector)", "Infra Integration"],
                ["unittest.mock", "stdlib", "내부 의존성 mock", "Unit"]
              ].map(([name, ver, purpose, layer]) => (
                <tr key={name}>
                  <td><code style={{ color: "var(--cyan-bright)" }}>{name}</code></td>
                  <td className="mono tiny">{ver}</td>
                  <td className="tiny">{purpose}</td>
                  <td><Pill>{layer}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section num="2" title="pytest + httpx" sub="FastAPI 비동기 테스트 조합 · pytest 9.x + httpx 0.28.x">
        <Panel title="설치 및 설정">
          <div className="prose tiny">
            <p><strong>pytest + httpx</strong>는 FastAPI 앱의 비동기 엔드포인트를 테스트하는 조합이다. <code>httpx.AsyncClient</code>가 ASGI 앱에 직접 요청을 보내므로 실제 서버 없이 테스트 가능하다.</p>
          </div>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>conftest.py (Synapse 공통 fixture)</div>
          <Code lang="python">{`import pytest
import fakeredis
from pathlib import Path
from unittest.mock import MagicMock

FIXTURE_DIR = Path(__file__).parent / "fixtures"

@pytest.fixture
def redis_client():
    """fakeredis 인스턴스 — 시맨틱 캐시 테스트용"""
    return fakeredis.FakeRedis(decode_responses=True)

@pytest.fixture
def kafka_producer_mock():
    """Kafka producer mock — 발행 메시지 캡처"""
    producer = MagicMock()
    producer.sent = []
    def mock_produce(topic, key=None, value=None, **kwargs):
        producer.sent.append({"topic": topic, "key": key, "value": value})
    producer.produce = mock_produce
    return producer`}</Code>
          <div className="label" style={{ marginTop: 16, marginBottom: 6 }}>pytest.ini</div>
          <Code>{`[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*`}</Code>
        </Panel>
        <div style={{ marginTop: 16 }}>
          <Panel title="사용 패턴">
            <div className="label" style={{ marginBottom: 8 }}>패턴 1: AsyncClient 기본 테스트</div>
            <Code lang="python">{`import httpx
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 2: fixture scope 관리</div>
            <Code lang="python">{`@pytest.fixture(scope="function")  # 각 테스트마다 새로 생성 (기본)
def redis_client():
    return fakeredis.FakeRedis(decode_responses=True)

@pytest.fixture(scope="session")  # 전체 테스트 세션에서 1회만 생성
def pg_container():
    with PostgresContainer("pgvector/pgvector:pg16") as pg:
        yield pg`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 3: parametrize 활용</div>
            <Code lang="python">{`@pytest.mark.parametrize("rating,expected_ef", [
    (0, 1.70), (1, 1.96), (2, 2.36),
    (3, 2.36), (4, 2.50), (5, 2.60),
])
def test_sm2_ef_calculation(rating, expected_ef):
    result = sm2(rating, ef=2.5, interval=7, reps=3)
    assert result["ef"] == pytest.approx(expected_ef, abs=0.01)`}</Code>
          </Panel>
        </div>
        <div style={{ marginTop: 16 }}>
          <Panel title="트러블슈팅">
            <div className="col" style={{ gap: 8 }}>
              {[
                ["async event loop 충돌", "pytest.ini에 asyncio_mode = auto 설정. 또는 @pytest.mark.asyncio 명시"],
                ["fixture scope 불일치", "session scope fixture에서 function scope fixture 의존 불가. scope 계층 확인"]
              ].map(([problem, solution]) => (
                <div key={problem} className="card card-tight">
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--amber-bright)" }}>{problem}</div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{solution}</div>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <span className="tiny muted">다른 언어 대안:</span>
              <XRef label="Java: MockMvc + @SpringBootTest (08탭)" tab="tools-java" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section num="3" title="respx" sub="httpx 기반 외부 HTTP mock · v0.21.1">
        <Panel title="설치 및 설정">
          <div className="prose tiny">
            <p><strong>respx</strong>는 httpx의 transport layer를 가로채 외부 HTTP 호출을 mock한다. Synapse learning-ai에서 OpenAI Embeddings, Anthropic Claude API를 mock할 때 사용한다.</p>
          </div>
          <Code>{`pip install respx`}</Code>
        </Panel>
        <div style={{ marginTop: 16 }}>
          <Panel title="사용 패턴">
            <div className="label" style={{ marginBottom: 8 }}>패턴 1: 기본 mock</div>
            <Code lang="python">{`import respx, httpx

@respx.mock
async def test_generate_embedding():
    respx.post("https://api.openai.com/v1/embeddings").mock(
        return_value=httpx.Response(200, json={
            "data": [{"embedding": [0.0023, -0.0121, 0.0156]}],
            "model": "text-embedding-3-small",
            "usage": {"prompt_tokens": 15, "total_tokens": 15}
        })
    )

    service = EmbeddingService()
    result = await service.generate("머신러닝에서 과적합이란?")

    assert len(result) == 1536
    assert respx.calls.call_count == 1`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 2: 조건부 매칭 (URL + body)</div>
            <Code lang="python">{`@respx.mock
async def test_claude_card_generation():
    respx.post(
        "https://api.anthropic.com/v1/messages",
        json__contains={"model": "claude-sonnet-4-20250514"}
    ).mock(return_value=httpx.Response(200, json={
        "content": [{"type": "text", "text": "{\\"cards\\": [...]}"}],
        "usage": {"input_tokens": 500, "output_tokens": 300}
    }))`}</Code>

            <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>패턴 3: 순차 응답 (재시도 테스트)</div>
            <Code lang="python">{`@respx.mock
async def test_rate_limit_retry():
    route = respx.post("https://api.openai.com/v1/embeddings")
    route.side_effect = [
        httpx.Response(429, json={"error": {"type": "rate_limit_exceeded"}}),
        httpx.Response(200, json={"data": [{"embedding": [0.1, 0.2]}]})
    ]

    result = await service.generate_with_retry("test query")
    assert route.call_count == 2  # 1번 실패 + 1번 성공`}</Code>
          </Panel>
        </div>
        <div style={{ marginTop: 16 }}>
          <Panel title="트러블슈팅">
            <div className="col" style={{ gap: 8 }}>
              {[
                ["mock 누수 (unmocked 호출)", "@respx.mock(assert_all_mocked=True) 로 미등록 호출 시 에러 발생"],
                ["비동기 컨텍스트", "respx는 httpx 전용. requests 라이브러리에는 responses 패키지 사용"]
              ].map(([problem, solution]) => (
                <div key={problem} className="card card-tight">
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--amber-bright)" }}>{problem}</div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{solution}</div>
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <span className="tiny muted">다른 언어 대안:</span>
              <XRef label="Java: WireMock (08탭)" tab="tools-java" />
              <XRef label="Flutter: dio mock adapter (10탭)" tab="tools-flutter" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section num="4" title="fakeredis" sub="Redis 인메모리 mock · v2.23.0">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>fakeredis</strong>는 실제 Redis 없이 인메모리로 Redis 명령을 실행한다. Synapse learning-ai의 시맨틱 캐시를 테스트할 때 사용.</p>
          </div>
          <Code lang="python">{`import fakeredis

def test_semantic_cache_hit(redis_client):
    # given — 캐시에 임베딩+답변 저장
    redis_client.set("cache:hash_abc", '{"answer":"과적합이란...","embedding":[0.1,0.2]}')

    # when
    result = redis_client.get("cache:hash_abc")

    # then
    assert result is not None
    assert "과적합" in result`}</Code>
          <div className="row" style={{ marginTop: 12, gap: 6 }}>
            <span className="tiny muted">다른 언어 대안:</span>
            <XRef label="Java: Testcontainers Redis (08탭)" tab="tools-java" />
          </div>
        </Panel>
      </Section>

      <Section num="5" title="testcontainers-python" sub="Docker 인프라 테스트 · v4.4.0">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>testcontainers-python</strong>은 Java Testcontainers의 Python 포트. Synapse learning-ai에서 PostgreSQL+pgvector 시맨틱 검색 테스트에 사용.</p>
          </div>
          <Code lang="python">{`from testcontainers.postgres import PostgresContainer

@pytest.fixture(scope="session")
def pg_container():
    with PostgresContainer("pgvector/pgvector:pg16") as pg:
        # pgvector 확장 활성화
        import psycopg2
        conn = psycopg2.connect(pg.get_connection_url())
        conn.cursor().execute("CREATE EXTENSION IF NOT EXISTS vector")
        conn.commit()
        yield pg

def test_semantic_search(pg_container):
    url = pg_container.get_connection_url()
    # ... pgvector 검색 테스트`}</Code>
          <div className="row" style={{ marginTop: 12, gap: 6 }}>
            <span className="tiny muted">다른 언어 대안:</span>
            <XRef label="Java: Testcontainers (08탭)" tab="tools-java" />
          </div>
        </Panel>
      </Section>

      <Section num="6" title="unittest.mock" sub="Python 표준 라이브러리 mock">
        <Panel title="Quick Start">
          <div className="prose tiny">
            <p><strong>unittest.mock</strong>은 Python 내장 mock 라이브러리. Synapse에서 Kafka consumer 테스트 시 producer를 mock할 때 사용.</p>
          </div>
          <Code lang="python">{`from unittest.mock import patch, MagicMock

@patch("app.services.embedding.EmbeddingService.generate")
async def test_note_consumer(mock_generate):
    mock_generate.return_value = [0.1, 0.2, 0.3]

    await consume_note_created(event_fixture)

    mock_generate.assert_called_once_with("노트 본문...")

# conftest.py의 kafka_producer_mock 패턴도 이 방식
# MagicMock()으로 produce() 메서드를 가로채고
# producer.sent 리스트에서 발행된 메시지를 검증`}</Code>
          <div className="row" style={{ marginTop: 12, gap: 6 }}>
            <span className="tiny muted">다른 언어 대안:</span>
            <XRef label="Java: Mockito (08탭)" tab="tools-java" />
            <XRef label="Flutter: mockito (10탭)" tab="tools-flutter" />
          </div>
        </Panel>
      </Section>
    </div>
  );
}

Object.assign(window, { PageToolsPython });
