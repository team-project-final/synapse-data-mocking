# synapse-data-mocking

> **Synapse** 통합 학습-지식 그래프 SaaS — 목킹 전략 + 인터랙티브 시뮬레이터

[`/docs/mocking`](https://github.com/team-project-final/documents/tree/main/docs/mocking) 의 8개 목킹 문서 내용을 한 페이지에 모았고, 각 문서마다 핵심 개념을 직접 체험할 수 있는 인터랙티브 시뮬레이터를 추가했다.

## 🚀 GitHub Pages 배포

이 레포는 그대로 GitHub Pages로 배포 가능:

1. **Settings → Pages → Source → `Deploy from a branch`**
2. Branch: `main` / Folder: `/ (root)`
3. 잠시 후 `https://team-project-final.github.io/synapse-data-mocking/` 에서 접근

`.nojekyll` 파일이 있어 Jekyll 처리는 스킵된다 (JSX/JS 파일을 그대로 서빙).

## 🎮 포함된 시뮬레이터 19종

| # | 문서 | 시뮬레이터 |
|---|------|----------|
| 01 | 00 전략 | 테스트 피라미드 탐색 |
| 02 | 00 전략 | 시드 ID 카탈로그 |
| 03 | 00 전략 | 시간 고정 패턴 (Java/Python/Dart) |
| 04 | 01 Platform | JWT 빌더 (역할별 토큰) |
| 05 | 01 Platform | Stripe Webhook → 구독 상태머신 |
| 06 | 01 Platform | Quiet Hours 체커 |
| 07 | 02 Engagement | SM-2 SRS 알고리즘 시뮬레이터 |
| 08 | 02 Engagement | XP 퀘스트 (XP→Level→Badge 체인) |
| 09 | 02 Engagement | 리더보드 프리뷰 (Redis ZSET) |
| 10 | 03 Knowledge | 위키링크 파서 |
| 11 | 03 Knowledge | 지식 그래프 탐색기 (N-hop) |
| 12 | 03 Knowledge | 청킹 시각화 |
| 13 | 04 Learning | 시맨틱 캐시 시뮬레이터 |
| 14 | 04 Learning | 하이브리드 검색 (RRF) |
| 15 | 04 Learning | AI 카드 생성 mock |
| 16 | 05 Frontend | Mock Response Browser (49+) |
| 17 | 06 Kafka | CloudEvents Builder |
| 18 | 06 Kafka | 이벤트 흐름 시뮬레이터 |
| 19 | 07 External | OAuth 2.0 흐름 시뮬레이터 (4종) |

## 📁 파일 구조

```
.
├── index.html              # 메인 entry
├── styles.css              # 디자인 토큰 + 컴포넌트 스타일
├── .nojekyll               # GitHub Pages Jekyll 스킵
└── js/
    ├── ui.jsx              # 공통 UI 프리미티브 (Panel, Pill, Log, ...)
    ├── data.jsx            # 문서 메타데이터 + 토픽 카탈로그 + 시드 ID
    ├── sim-strategy.jsx    # 00 전략 시뮬레이터
    ├── sim-platform.jsx    # 01 Platform 시뮬레이터
    ├── sim-engagement.jsx  # 02 Engagement 시뮬레이터
    ├── sim-knowledge.jsx   # 03 Knowledge 시뮬레이터
    ├── sim-learning.jsx    # 04 Learning 시뮬레이터
    ├── sim-frontend.jsx    # 05 Frontend 시뮬레이터
    ├── sim-kafka.jsx       # 06 Kafka 시뮬레이터
    ├── sim-external.jsx    # 07 External 시뮬레이터
    └── app.jsx             # 메인 App + 페이지 라우팅
```

## 🛠 기술 스택

- **React 18** + **JSX** (브라우저 인-라인 Babel transform)
- 빌드 도구 **없음** — 정적 호스팅용 단일 페이지
- 폰트: Inter + Space Grotesk + JetBrains Mono (Google Fonts)
- 의존성: zero npm packages — CDN 스크립트 3개만

## 🧪 로컬 실행

```bash
# 임의의 정적 서버라면 OK
python3 -m http.server 8080
# 또는
npx serve .
```

`http://localhost:8080` 접속.

## 📚 원본 문서

[team-project-final/documents/docs/mocking](https://github.com/team-project-final/documents/tree/main/docs/mocking)

- `00-mocking-strategy.md` — 전체 전략 + 도구 매트릭스
- `01-platform-svc-mocking.md` — auth/audit/billing/notification
- `02-engagement-svc-mocking.md` — community/gamification
- `03-knowledge-svc-mocking.md` — note/graph/chunking
- `04-learning-svc-mocking.md` — learning-card + learning-ai
- `05-frontend-mocking.md` — Flutter dio + Riverpod
- `06-kafka-event-mocking.md` — 18개 토픽 CloudEvents fixture
- `07-external-api-mocking.md` — WireMock 매핑 전체
