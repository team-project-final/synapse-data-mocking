# Kafka 이벤트 목킹 정의서

> **프로젝트**: Synapse — 통합 학습-지식 그래프 SaaS
> **버전**: v1.0
> **작성일**: 2026-05-14
> **범위**: 전체 18개 Kafka 토픽 fixture + EmbeddedKafka/Python 설정

---

## 1. CloudEvents 기본 래퍼 템플릿

모든 Kafka 이벤트는 CloudEvents 1.0 호환 포맷을 따른다. Avro 스키마는 `synapse-shared` 레포 (`src/main/avro/`) 에 정의된다.

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000001",
  "source": "synapse/{service-name}",
  "type": "{topic.name}",
  "subject": "{resource-type}/{resource-id}",
  "time": "2026-01-15T10:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": { }
}
```

---

## 2. 토픽별 Fixture

### 2.1 `note.created`

| 항목 | 값 |
|------|-----|
| **발행** | knowledge-svc / note 모듈 |
| **소비** | learning-ai (자동 카드 생성), knowledge/note (ES 인덱싱) |
| **Avro 참조** | `synapse-shared/src/main/avro/knowledge/NoteCreated.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000101",
  "source": "synapse/knowledge-svc",
  "type": "note.created",
  "subject": "notes/note-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "noteId": "note-00000000-0000-0000-0000-000000000001",
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "title": "머신러닝 기초 정리",
    "contentLength": 2500,
    "tags": ["머신러닝", "AI"],
    "hasAttachments": false
  }
}
```

**Edge Case — 긴 노트 (청킹 대상):**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000102",
  "source": "synapse/knowledge-svc",
  "type": "note.created",
  "subject": "notes/note-00000000-0000-0000-0000-000000000003",
  "time": "2026-01-15T10:01:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "noteId": "note-00000000-0000-0000-0000-000000000003",
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "title": "딥러닝 완전 정복 가이드",
    "contentLength": 50000,
    "tags": ["딥러닝", "신경망", "CNN", "RNN"],
    "hasAttachments": true
  }
}
```

---

### 2.2 `note.updated`

| 항목 | 값 |
|------|-----|
| **발행** | knowledge-svc / note 모듈 |
| **소비** | learning-ai (임베딩 재생성), knowledge/note (ES 재인덱싱) |
| **Avro 참조** | `synapse-shared/src/main/avro/knowledge/NoteUpdated.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000201",
  "source": "synapse/knowledge-svc",
  "type": "note.updated",
  "subject": "notes/note-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:05:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "noteId": "note-00000000-0000-0000-0000-000000000001",
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "title": "머신러닝 기초 정리 (수정)",
    "contentLength": 3200,
    "version": 2,
    "changedFields": ["title", "content"],
    "tags": ["머신러닝", "AI", "정리"]
  }
}
```

**Edge Case — 태그만 변경:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000202",
  "source": "synapse/knowledge-svc",
  "type": "note.updated",
  "subject": "notes/note-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:06:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "noteId": "note-00000000-0000-0000-0000-000000000001",
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "title": "머신러닝 기초 정리 (수정)",
    "contentLength": 3200,
    "version": 3,
    "changedFields": ["tags"],
    "tags": ["머신러닝", "딥러닝"]
  }
}
```

---

### 2.3 `note.deleted`

| 항목 | 값 |
|------|-----|
| **발행** | knowledge-svc / note 모듈 |
| **소비** | knowledge/note (ES 인덱스 삭제) |
| **Avro 참조** | `synapse-shared/src/main/avro/knowledge/NoteDeleted.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000301",
  "source": "synapse/knowledge-svc",
  "type": "note.deleted",
  "subject": "notes/note-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:10:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "noteId": "note-00000000-0000-0000-0000-000000000001",
    "userId": "user-00000000-0000-0000-0000-000000000001"
  }
}
```

---

### 2.4 `card.reviewed`

| 항목 | 값 |
|------|-----|
| **발행** | learning-svc / card 모듈 (learning-card) |
| **소비** | engagement-svc / gamification (XP 적립, 통계) |
| **Avro 참조** | `synapse-shared/src/main/avro/learning/CardReviewed.avsc` |

**Success Fixture — 정답 (rating 4):**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000401",
  "source": "synapse/learning-card",
  "type": "card.reviewed",
  "subject": "cards/card-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:15:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "cardId": "card-00000000-0000-0000-0000-000000000001",
    "deckId": "deck-00000000-0000-0000-0000-000000000001",
    "rating": 4,
    "timeSpentMs": 5000,
    "newInterval": 7,
    "newEF": 2.6,
    "nextDueDate": "2026-01-22"
  }
}
```

**Edge Case — 오답 (rating 1, interval reset):**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000402",
  "source": "synapse/learning-card",
  "type": "card.reviewed",
  "subject": "cards/card-00000000-0000-0000-0000-000000000002",
  "time": "2026-01-15T10:16:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "cardId": "card-00000000-0000-0000-0000-000000000002",
    "deckId": "deck-00000000-0000-0000-0000-000000000001",
    "rating": 1,
    "timeSpentMs": 12000,
    "newInterval": 1,
    "newEF": 1.7,
    "nextDueDate": "2026-01-16"
  }
}
```

---

### 2.5 `user.registered`

| 항목 | 값 |
|------|-----|
| **발행** | platform-svc / auth 모듈 |
| **소비** | platform-svc / audit (감사 로그) |
| **Avro 참조** | `synapse-shared/src/main/avro/platform/UserRegistered.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000501",
  "source": "synapse/platform-svc",
  "type": "user.registered",
  "subject": "users/user-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "email": "user1@example.com",
    "displayName": "홍길동",
    "tenantId": "tenant-00000000-0000-0000-0000-000000000001",
    "authProvider": "email",
    "locale": "ko"
  }
}
```

**Edge Case — OAuth 가입:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000502",
  "source": "synapse/platform-svc",
  "type": "user.registered",
  "subject": "users/user-00000000-0000-0000-0000-000000000002",
  "time": "2026-01-15T10:01:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000002",
    "email": "user2@gmail.com",
    "displayName": "김영희",
    "tenantId": "tenant-00000000-0000-0000-0000-000000000001",
    "authProvider": "google",
    "locale": "ko"
  }
}
```

---

### 2.6 `billing.subscription.changed`

| 항목 | 값 |
|------|-----|
| **발행** | platform-svc / billing 모듈 |
| **소비** | platform-svc / audit (감사 로그) |
| **Avro 참조** | `synapse-shared/src/main/avro/platform/BillingSubscriptionChanged.avsc` |

**Success Fixture — 업그레이드:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000601",
  "source": "synapse/platform-svc",
  "type": "billing.subscription.changed",
  "subject": "tenants/tenant-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:20:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "tenantId": "tenant-00000000-0000-0000-0000-000000000001",
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "oldPlan": "free",
    "newPlan": "pro",
    "effectiveDate": "2026-01-15",
    "stripeSubscriptionId": "sub_mock_001",
    "interval": "month"
  }
}
```

**Edge Case — 다운그레이드:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000602",
  "source": "synapse/platform-svc",
  "type": "billing.subscription.changed",
  "subject": "tenants/tenant-00000000-0000-0000-0000-000000000002",
  "time": "2026-01-15T10:25:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000002",
  "datacontenttype": "application/json",
  "data": {
    "tenantId": "tenant-00000000-0000-0000-0000-000000000002",
    "userId": "user-00000000-0000-0000-0000-000000000003",
    "oldPlan": "team",
    "newPlan": "pro",
    "effectiveDate": "2026-02-01",
    "stripeSubscriptionId": "sub_mock_002",
    "interval": "month"
  }
}
```

---

### 2.7 `audit.event`

| 항목 | 값 |
|------|-----|
| **발행** | 전 서비스 (cross-service) |
| **소비** | platform-svc / audit (감사 로그 적재) |
| **Avro 참조** | `synapse-shared/src/main/avro/shared/AuditEvent.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000701",
  "source": "synapse/knowledge-svc",
  "type": "audit.event",
  "subject": "notes/note-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "action": "note.create",
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "resourceType": "note",
    "resourceId": "note-00000000-0000-0000-0000-000000000001",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 Synapse/1.0",
    "metadata": {
      "title": "머신러닝 기초 정리"
    }
  }
}
```

**Edge Case — Idempotency 검증 (동일 ID 재소비):**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000701",
  "source": "synapse/knowledge-svc",
  "type": "audit.event",
  "subject": "notes/note-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "action": "note.create",
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "resourceType": "note",
    "resourceId": "note-00000000-0000-0000-0000-000000000001",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 Synapse/1.0",
    "metadata": {
      "title": "머신러닝 기초 정리"
    }
  }
}
```

> 위 fixture는 2.7의 success fixture와 동일한 `id`를 사용. `processed_events` 테이블에 이미 존재하므로 INSERT가 skip되어야 함을 검증한다.

---

### 2.8 `community.deck.shared`

| 항목 | 값 |
|------|-----|
| **발행** | engagement-svc / community 모듈 |
| **소비** | engagement/gamification (XP), platform/notification (알림) |
| **Avro 참조** | `synapse-shared/src/main/avro/engagement/CommunityDeckShared.avsc` |

**Success Fixture — 그룹 공유:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000801",
  "source": "synapse/engagement-svc",
  "type": "community.deck.shared",
  "subject": "shared-decks/sdeck-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T11:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "deckId": "deck-00000000-0000-0000-0000-000000000001",
    "sharedDeckId": "sdeck-00000000-0000-0000-0000-000000000001",
    "sharedByUserId": "user-00000000-0000-0000-0000-000000000001",
    "shareType": "group",
    "targetGroupId": "group-00000000-0000-0000-0000-000000000001",
    "deckTitle": "프로그래밍 기초 덱"
  }
}
```

**Edge Case — public 공유 (targetGroupId null):**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000802",
  "source": "synapse/engagement-svc",
  "type": "community.deck.shared",
  "subject": "shared-decks/sdeck-00000000-0000-0000-0000-000000000002",
  "time": "2026-01-15T11:05:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "deckId": "deck-00000000-0000-0000-0000-000000000002",
    "sharedDeckId": "sdeck-00000000-0000-0000-0000-000000000002",
    "sharedByUserId": "user-00000000-0000-0000-0000-000000000002",
    "shareType": "public",
    "targetGroupId": null,
    "deckTitle": "알고리즘 마스터 덱"
  }
}
```

---

### 2.9 `community.note.shared`

| 항목 | 값 |
|------|-----|
| **발행** | engagement-svc / community 모듈 |
| **소비** | engagement/gamification (XP), platform/notification (알림) |
| **Avro 참조** | `synapse-shared/src/main/avro/engagement/CommunityNoteShared.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000000901",
  "source": "synapse/engagement-svc",
  "type": "community.note.shared",
  "subject": "shared-notes/snote-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T11:10:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "noteId": "note-00000000-0000-0000-0000-000000000001",
    "sharedNoteId": "snote-00000000-0000-0000-0000-000000000001",
    "sharedByUserId": "user-00000000-0000-0000-0000-000000000001",
    "shareType": "group",
    "targetGroupId": "group-00000000-0000-0000-0000-000000000001",
    "noteTitle": "머신러닝 기초 정리"
  }
}
```

---

### 2.10 `community.group.created`

| 항목 | 값 |
|------|-----|
| **발행** | engagement-svc / community 모듈 |
| **소비** | engagement/gamification (XP), platform/notification (알림) |
| **Avro 참조** | `synapse-shared/src/main/avro/engagement/CommunityGroupCreated.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001001",
  "source": "synapse/engagement-svc",
  "type": "community.group.created",
  "subject": "groups/group-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T09:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "groupId": "group-00000000-0000-0000-0000-000000000001",
    "groupName": "ML 스터디",
    "ownerUserId": "user-00000000-0000-0000-0000-000000000001"
  }
}
```

---

### 2.11 `community.group.joined`

| 항목 | 값 |
|------|-----|
| **발행** | engagement-svc / community 모듈 |
| **소비** | engagement/gamification (XP), platform/notification (알림) |
| **Avro 참조** | `synapse-shared/src/main/avro/engagement/CommunityGroupJoined.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001101",
  "source": "synapse/engagement-svc",
  "type": "community.group.joined",
  "subject": "groups/group-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T09:30:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "groupId": "group-00000000-0000-0000-0000-000000000001",
    "userId": "user-00000000-0000-0000-0000-000000000002",
    "role": "member"
  }
}
```

**Edge Case — admin 역할로 가입:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001102",
  "source": "synapse/engagement-svc",
  "type": "community.group.joined",
  "subject": "groups/group-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T09:35:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "groupId": "group-00000000-0000-0000-0000-000000000001",
    "userId": "user-00000000-0000-0000-0000-000000000004",
    "role": "admin"
  }
}
```

---

### 2.12 `community.report.created`

| 항목 | 값 |
|------|-----|
| **발행** | engagement-svc / community 모듈 |
| **소비** | (admin 대시보드 / 향후 자동 모더레이션) |
| **Avro 참조** | `synapse-shared/src/main/avro/engagement/CommunityReportCreated.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001201",
  "source": "synapse/engagement-svc",
  "type": "community.report.created",
  "subject": "reports/report-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T14:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "reportId": "report-00000000-0000-0000-0000-000000000001",
    "reporterUserId": "user-00000000-0000-0000-0000-000000000002",
    "targetType": "shared_deck",
    "targetId": "sdeck-00000000-0000-0000-0000-000000000001",
    "reason": "inappropriate"
  }
}
```

---

### 2.13 `gamification.xp.earned`

| 항목 | 값 |
|------|-----|
| **발행** | engagement-svc / gamification 모듈 |
| **소비** | platform-svc / notification (알림) |
| **Avro 참조** | `synapse-shared/src/main/avro/engagement/GamificationXpEarned.avsc` |

**Success Fixture — 복습 완료 XP:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001301",
  "source": "synapse/engagement-svc",
  "type": "gamification.xp.earned",
  "subject": "users/user-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:20:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "eventType": "review_complete",
    "xpAmount": 10,
    "sourceId": "card-00000000-0000-0000-0000-000000000001",
    "sourceType": "card",
    "newTotalXp": 350,
    "newLevel": 3
  }
}
```

**Edge Case — 레벨업 동반 XP:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001302",
  "source": "synapse/engagement-svc",
  "type": "gamification.xp.earned",
  "subject": "users/user-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:25:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "eventType": "streak_bonus",
    "xpAmount": 50,
    "sourceId": "streak-7",
    "sourceType": "streak",
    "newTotalXp": 500,
    "newLevel": 4
  }
}
```

---

### 2.14 `gamification.badge.earned`

| 항목 | 값 |
|------|-----|
| **발행** | engagement-svc / gamification 모듈 |
| **소비** | platform-svc / notification (알림) |
| **Avro 참조** | `synapse-shared/src/main/avro/engagement/GamificationBadgeEarned.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001401",
  "source": "synapse/engagement-svc",
  "type": "gamification.badge.earned",
  "subject": "users/user-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:30:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "badgeCode": "STREAK_7",
    "badgeName": "7일 전사",
    "xpReward": 100
  }
}
```

---

### 2.15 `gamification.level.up`

| 항목 | 값 |
|------|-----|
| **발행** | engagement-svc / gamification 모듈 |
| **소비** | platform-svc / notification (알림) |
| **Avro 참조** | `synapse-shared/src/main/avro/engagement/GamificationLevelUp.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001501",
  "source": "synapse/engagement-svc",
  "type": "gamification.level.up",
  "subject": "users/user-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:25:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "oldLevel": 3,
    "newLevel": 4,
    "title": "학자"
  }
}
```

---

### 2.16 `notification.send`

| 항목 | 값 |
|------|-----|
| **발행** | engagement-svc / gamification, community 모듈 |
| **소비** | platform-svc / notification (알림 발송) |
| **Avro 참조** | `synapse-shared/src/main/avro/shared/NotificationSend.avsc` |

**Success Fixture — 레벨업 알림:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001601",
  "source": "synapse/engagement-svc",
  "type": "notification.send",
  "subject": "users/user-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:25:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "templateCode": "LEVEL_UP",
    "category": "gamification",
    "channel": "push",
    "dataJson": {
      "oldLevel": 3,
      "newLevel": 4,
      "title": "학자"
    }
  }
}
```

**Edge Case — 이메일 채널:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001602",
  "source": "synapse/engagement-svc",
  "type": "notification.send",
  "subject": "users/user-00000000-0000-0000-0000-000000000002",
  "time": "2026-01-15T11:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000002",
    "templateCode": "DECK_SHARED",
    "category": "community",
    "channel": "email",
    "dataJson": {
      "deckTitle": "프로그래밍 기초 덱",
      "sharedByName": "홍길동",
      "groupName": "ML 스터디"
    }
  }
}
```

---

### 2.17 `card.review.due`

| 항목 | 값 |
|------|-----|
| **발행** | learning-svc / card 모듈 (daily batch) |
| **소비** | platform-svc / notification (복습 리마인더) |
| **Avro 참조** | `synapse-shared/src/main/avro/learning/CardReviewDue.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001701",
  "source": "synapse/learning-card",
  "type": "card.review.due",
  "subject": "users/user-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T07:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "dueCount": 25,
    "topDeckName": "프로그래밍 기초 덱"
  }
}
```

**Edge Case — 복습 카드 없음:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001702",
  "source": "synapse/learning-card",
  "type": "card.review.due",
  "subject": "users/user-00000000-0000-0000-0000-000000000002",
  "time": "2026-01-15T07:00:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000002",
    "dueCount": 0,
    "topDeckName": null
  }
}
```

---

### 2.18 `graph.notes.linked`

| 항목 | 값 |
|------|-----|
| **발행** | knowledge-svc / graph 모듈 |
| **소비** | (미래 확장 — 추천 시스템) |
| **Avro 참조** | `synapse-shared/src/main/avro/knowledge/GraphNotesLinked.avsc` |

**Success Fixture:**

```json
{
  "specversion": "1.0",
  "id": "evt-00000000-0000-0000-0000-000000001801",
  "source": "synapse/knowledge-svc",
  "type": "graph.notes.linked",
  "subject": "notes/note-00000000-0000-0000-0000-000000000001",
  "time": "2026-01-15T10:02:00Z",
  "tenantid": "tenant-00000000-0000-0000-0000-000000000001",
  "datacontenttype": "application/json",
  "data": {
    "userId": "user-00000000-0000-0000-0000-000000000001",
    "noteId": "note-00000000-0000-0000-0000-000000000001",
    "linkedNoteId": "note-00000000-0000-0000-0000-000000000002",
    "totalLinks": 3
  }
}
```

---

## 3. EmbeddedKafka 설정 (Spring Boot)

### 3.1 테스트 설정

```java
@SpringBootTest
@EmbeddedKafka(
    partitions = 1,
    topics = {
        "note.created", "note.updated", "note.deleted",
        "card.reviewed", "card.review.due",
        "user.registered", "billing.subscription.changed",
        "audit.event",
        "community.deck.shared", "community.note.shared",
        "community.group.created", "community.group.joined",
        "community.report.created",
        "gamification.xp.earned", "gamification.badge.earned",
        "gamification.level.up",
        "notification.send",
        "graph.notes.linked"
    },
    brokerProperties = {
        "listeners=PLAINTEXT://localhost:9092",
        "port=9092"
    }
)
public abstract class AbstractKafkaTest {

    @Autowired
    protected EmbeddedKafkaBroker embeddedKafka;

    @Autowired
    protected KafkaTemplate<String, Object> kafkaTemplate;
}
```

### 3.2 application-test.yml (Kafka 섹션)

```yaml
spring:
  kafka:
    bootstrap-servers: ${spring.embedded.kafka.brokers}
    consumer:
      auto-offset-reset: earliest
      group-id: test-group
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: io.confluent.kafka.serializers.KafkaAvroDeserializer
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: io.confluent.kafka.serializers.KafkaAvroSerializer
    properties:
      schema.registry.url: mock://test-schema-registry
      specific.avro.reader: true
```

### 3.3 Kafka 테스트 헬퍼 (Java)

```java
@Component
public class KafkaTestHelper {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private EmbeddedKafkaBroker embeddedKafka;

    /**
     * 이벤트를 발행하고 Consumer가 처리할 때까지 대기
     */
    public void publishAndWait(String topic, String key, Object event, Duration timeout) {
        kafkaTemplate.send(topic, key, event).join();

        // Consumer가 처리할 시간 확보
        Awaitility.await()
            .atMost(timeout)
            .pollInterval(Duration.ofMillis(100));
    }

    /**
     * 특정 토픽에서 메시지를 소비하여 반환
     */
    public <T> List<T> consumeMessages(String topic, int expectedCount, Duration timeout) {
        Map<String, Object> consumerProps = KafkaTestUtils.consumerProps(
            "test-verify-group", "true", embeddedKafka);
        consumerProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        DefaultKafkaConsumerFactory<String, T> factory =
            new DefaultKafkaConsumerFactory<>(consumerProps);

        Consumer<String, T> consumer = factory.createConsumer();
        embeddedKafka.consumeFromAnEmbeddedTopic(consumer, topic);

        ConsumerRecords<String, T> records =
            KafkaTestUtils.getRecords(consumer, timeout);

        List<T> results = new ArrayList<>();
        records.forEach(record -> results.add(record.value()));
        consumer.close();
        return results;
    }

    /**
     * JSON fixture 파일에서 이벤트를 로드
     */
    public String loadFixture(String path) {
        try {
            return new String(
                Objects.requireNonNull(
                    getClass().getClassLoader().getResourceAsStream(path)
                ).readAllBytes(),
                StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new RuntimeException("Fixture load failed: " + path, e);
        }
    }
}
```

---

## 4. Python Kafka Mock 설정

### 4.1 conftest.py

```python
import json
import pytest
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "kafka"


@pytest.fixture
def kafka_producer_mock():
    """Mock Kafka producer that captures sent messages."""
    producer = MagicMock()
    producer.sent_messages = []

    def mock_produce(topic, key=None, value=None, **kwargs):
        producer.sent_messages.append({
            "topic": topic,
            "key": key,
            "value": json.loads(value) if isinstance(value, (str, bytes)) else value,
        })

    producer.produce = mock_produce
    producer.flush = MagicMock()
    return producer


@pytest.fixture
def kafka_consumer_mock():
    """Mock Kafka consumer that returns pre-loaded fixtures."""
    consumer = MagicMock()
    consumer._messages = []
    consumer._index = 0

    def mock_poll(timeout=1.0):
        if consumer._index < len(consumer._messages):
            msg = consumer._messages[consumer._index]
            consumer._index += 1
            return msg
        return None

    consumer.poll = mock_poll
    return consumer


def load_kafka_fixture(fixture_name: str) -> dict:
    """Load a Kafka event fixture from the fixtures directory."""
    fixture_path = FIXTURE_DIR / f"{fixture_name}.avro.json"
    with open(fixture_path) as f:
        return json.load(f)
```

### 4.2 Kafka Consumer 테스트 예시

```python
from tests.conftest import load_kafka_fixture


def test_note_created_triggers_card_generation(
    kafka_consumer_mock, ai_service_mock
):
    """note.created 이벤트 소비 시 AI 카드 자동 생성이 트리거되는지 검증"""
    event = load_kafka_fixture("note_created_success")
    kafka_consumer_mock._messages = [event]

    # Consumer 처리
    from app.ai.consumers import handle_note_created
    handle_note_created(event["data"])

    # AI 카드 생성 호출 확인
    ai_service_mock.generate_cards.assert_called_once_with(
        note_id="note-00000000-0000-0000-0000-000000000001",
        user_id="user-00000000-0000-0000-0000-000000000001",
        tenant_id="tenant-00000000-0000-0000-0000-000000000001"
    )
```

---

## 5. 토픽-서비스 의존성 매트릭스

| 토픽 | platform | engagement | knowledge | learning-card | learning-ai |
|------|:--------:|:----------:|:---------:|:-------------:|:-----------:|
| note.created | | | **P** | | **C** |
| note.updated | | | **P** | | **C** |
| note.deleted | | | **P** | | |
| card.reviewed | | **C** | | **P** | |
| user.registered | **P** | | | | |
| billing.subscription.changed | **P** | | | | |
| audit.event | **C** | | | | |
| community.deck.shared | **C** | **P** | | | |
| community.note.shared | **C** | **P** | | | |
| community.group.created | **C** | **P** | | | |
| community.group.joined | **C** | **P** | | | |
| community.report.created | | **P** | | | |
| gamification.xp.earned | **C** | **P** | | | |
| gamification.badge.earned | **C** | **P** | | | |
| gamification.level.up | **C** | **P** | | | |
| notification.send | **C** | **P** | | | |
| card.review.due | **C** | | | **P** | |
| graph.notes.linked | | | **P** | | |

> **P** = Producer, **C** = Consumer
