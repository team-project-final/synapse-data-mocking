# 외부 API 목킹 정의서

> **프로젝트**: Synapse — 통합 학습-지식 그래프 SaaS
> **버전**: v1.0
> **작성일**: 2026-05-14
> **범위**: OAuth (4종), Stripe, FCM, SES, OpenAI, Anthropic Claude — WireMock 매핑 + fixture 전체

---

## 1. WireMock 공통 설정

### 1.1 Spring Boot 연동

```java
@SpringBootTest
@AutoConfigureWireMock(port = 0)
public abstract class AbstractExternalApiTest {

    @DynamicPropertySource
    static void overrideExternalUrls(DynamicPropertyRegistry registry) {
        String baseUrl = "http://localhost:${wiremock.server.port}";
        // OAuth
        registry.add("oauth.google.token-url", () -> baseUrl + "/google/token");
        registry.add("oauth.google.userinfo-url", () -> baseUrl + "/google/userinfo");
        registry.add("oauth.github.token-url", () -> baseUrl + "/github/token");
        registry.add("oauth.github.userinfo-url", () -> baseUrl + "/github/userinfo");
        registry.add("oauth.apple.token-url", () -> baseUrl + "/apple/token");
        registry.add("oauth.microsoft.token-url", () -> baseUrl + "/microsoft/token");
        registry.add("oauth.microsoft.userinfo-url", () -> baseUrl + "/microsoft/userinfo");
        // Stripe
        registry.add("stripe.api-base-url", () -> baseUrl + "/stripe");
        // FCM
        registry.add("fcm.api-url", () -> baseUrl + "/fcm");
        // SES
        registry.add("ses.endpoint-url", () -> baseUrl + "/ses");
        // OpenAI
        registry.add("openai.api-base-url", () -> baseUrl + "/openai");
        // Claude
        registry.add("anthropic.api-base-url", () -> baseUrl + "/anthropic");
    }
}
```

### 1.2 Python (respx) 연동

```python
import respx
import httpx

@respx.mock
async def test_openai_embedding():
    respx.post("https://api.openai.com/v1/embeddings").mock(
        return_value=httpx.Response(200, json={...})
    )
    # 테스트 코드
```

---

## 2. OAuth Provider 목킹

### 2.1 Google OAuth

#### Token Exchange — Success

**WireMock 매핑:**

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/google/token",
    "bodyPatterns": [
      { "contains": "grant_type=authorization_code" },
      { "contains": "code=" }
    ]
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "jsonBody": {
      "access_token": "google_mock_access_token_001",
      "token_type": "Bearer",
      "expires_in": 3600,
      "refresh_token": "google_mock_refresh_token_001",
      "scope": "openid email profile",
      "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwic3ViIjoiMTIzNDU2Nzg5MCIsImVtYWlsIjoidXNlcjFAZ21haWwuY29tIiwibmFtZSI6Iu2Zjeq4uOuPmSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9kZWZhdWx0IiwiYXVkIjoiY2xpZW50X2lkIiwiZXhwIjoxNzY5NTIyNDAwfQ.mock_signature"
    }
  }
}
```

#### Userinfo — Success

```json
{
  "request": {
    "method": "GET",
    "urlPath": "/google/userinfo",
    "headers": {
      "Authorization": { "contains": "Bearer google_mock_access_token" }
    }
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "sub": "google_user_001",
      "email": "user1@gmail.com",
      "email_verified": true,
      "name": "홍길동",
      "picture": "https://lh3.googleusercontent.com/a/default",
      "locale": "ko"
    }
  }
}
```

#### Error — Invalid Code (401)

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/google/token",
    "bodyPatterns": [
      { "contains": "code=invalid_code" }
    ]
  },
  "response": {
    "status": 401,
    "jsonBody": {
      "error": "invalid_grant",
      "error_description": "Bad Request"
    }
  }
}
```

#### Error — Forbidden (403)

```json
{
  "request": {
    "method": "GET",
    "urlPath": "/google/userinfo",
    "headers": {
      "Authorization": { "contains": "Bearer expired_token" }
    }
  },
  "response": {
    "status": 403,
    "jsonBody": {
      "error": {
        "code": 403,
        "message": "Request had insufficient authentication scopes.",
        "status": "PERMISSION_DENIED"
      }
    }
  }
}
```

---

### 2.2 GitHub OAuth

#### Token Exchange — Success

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/github/token",
    "headers": {
      "Accept": { "equalTo": "application/json" }
    },
    "bodyPatterns": [
      { "contains": "code=" }
    ]
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "access_token": "github_mock_access_token_001",
      "token_type": "bearer",
      "scope": "read:user,user:email"
    }
  }
}
```

#### Userinfo — Success

```json
{
  "request": {
    "method": "GET",
    "urlPath": "/github/userinfo",
    "headers": {
      "Authorization": { "contains": "Bearer github_mock_access_token" }
    }
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "id": 12345678,
      "login": "honggildong",
      "name": "홍길동",
      "email": "user1@github.com",
      "avatar_url": "https://avatars.githubusercontent.com/u/12345678",
      "bio": "학습 열정가"
    }
  }
}
```

#### Error — Invalid Token (401)

```json
{
  "request": {
    "method": "GET",
    "urlPath": "/github/userinfo",
    "headers": {
      "Authorization": { "contains": "Bearer invalid_token" }
    }
  },
  "response": {
    "status": 401,
    "jsonBody": {
      "message": "Bad credentials",
      "documentation_url": "https://docs.github.com/rest"
    }
  }
}
```

#### Error — Rate Limit (403)

```json
{
  "request": {
    "method": "GET",
    "urlPath": "/github/userinfo",
    "headers": {
      "Authorization": { "contains": "Bearer rate_limited_token" }
    }
  },
  "response": {
    "status": 403,
    "headers": {
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "1769522400"
    },
    "jsonBody": {
      "message": "API rate limit exceeded",
      "documentation_url": "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"
    }
  }
}
```

---

### 2.3 Apple OAuth

#### Token Exchange — Success

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/apple/token",
    "bodyPatterns": [
      { "contains": "grant_type=authorization_code" },
      { "contains": "code=" }
    ]
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "access_token": "apple_mock_access_token_001",
      "token_type": "Bearer",
      "expires_in": 3600,
      "refresh_token": "apple_mock_refresh_token_001",
      "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwic3ViIjoiYXBwbGVfdXNlcl8wMDEiLCJlbWFpbCI6InVzZXIxQGljbG91ZC5jb20iLCJhdWQiOiJjb20uc3luYXBzZS5hcHAiLCJleHAiOjE3Njk1MjI0MDB9.mock_signature"
    }
  }
}
```

#### ID Token Validation (Apple은 userinfo 대신 id_token에서 추출)

```json
{
  "decoded_id_token": {
    "iss": "https://appleid.apple.com",
    "sub": "apple_user_001",
    "email": "user1@icloud.com",
    "email_verified": true,
    "is_private_email": false,
    "auth_time": 1769518800
  }
}
```

#### Error — Invalid Code (401)

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/apple/token",
    "bodyPatterns": [
      { "contains": "code=invalid_code" }
    ]
  },
  "response": {
    "status": 400,
    "jsonBody": {
      "error": "invalid_grant"
    }
  }
}
```

#### Error — Invalid Client (403)

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/apple/token",
    "bodyPatterns": [
      { "contains": "client_id=wrong_client" }
    ]
  },
  "response": {
    "status": 400,
    "jsonBody": {
      "error": "invalid_client"
    }
  }
}
```

---

### 2.4 Microsoft OAuth

#### Token Exchange — Success

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/microsoft/token",
    "bodyPatterns": [
      { "contains": "grant_type=authorization_code" }
    ]
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "access_token": "microsoft_mock_access_token_001",
      "token_type": "Bearer",
      "expires_in": 3600,
      "refresh_token": "microsoft_mock_refresh_token_001",
      "scope": "openid profile email User.Read",
      "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20iLCJzdWIiOiJtc191c2VyXzAwMSIsImVtYWlsIjoidXNlcjFAb3V0bG9vay5jb20iLCJuYW1lIjoi7ZmN6ri464-ZIiwiYXVkIjoiY2xpZW50X2lkIiwiZXhwIjoxNzY5NTIyNDAwfQ.mock_signature"
    }
  }
}
```

#### Userinfo — Success

```json
{
  "request": {
    "method": "GET",
    "urlPath": "/microsoft/userinfo",
    "headers": {
      "Authorization": { "contains": "Bearer microsoft_mock_access_token" }
    }
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "id": "ms_user_001",
      "displayName": "홍길동",
      "mail": "user1@outlook.com",
      "userPrincipalName": "user1@outlook.com",
      "preferredLanguage": "ko-KR"
    }
  }
}
```

#### Error — Invalid Token (401)

```json
{
  "request": {
    "method": "GET",
    "urlPath": "/microsoft/userinfo",
    "headers": {
      "Authorization": { "contains": "Bearer invalid_ms_token" }
    }
  },
  "response": {
    "status": 401,
    "jsonBody": {
      "error": {
        "code": "InvalidAuthenticationToken",
        "message": "Access token is empty."
      }
    }
  }
}
```

#### Error — Insufficient Permissions (403)

```json
{
  "request": {
    "method": "GET",
    "urlPath": "/microsoft/userinfo",
    "headers": {
      "Authorization": { "contains": "Bearer no_scope_token" }
    }
  },
  "response": {
    "status": 403,
    "jsonBody": {
      "error": {
        "code": "Authorization_RequestDenied",
        "message": "Insufficient privileges to complete the operation."
      }
    }
  }
}
```

---

## 3. Stripe API 목킹

### 3.1 Create Checkout Session — Success

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/stripe/v1/checkout/sessions",
    "bodyPatterns": [
      { "contains": "mode=subscription" }
    ]
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "id": "cs_test_mock_001",
      "object": "checkout.session",
      "url": "https://checkout.stripe.com/c/pay/cs_test_mock_001",
      "mode": "subscription",
      "status": "open",
      "customer": "cus_mock_001",
      "subscription": null,
      "success_url": "https://synapse.app/billing/success",
      "cancel_url": "https://synapse.app/billing/cancel",
      "created": 1769518800
    }
  }
}
```

### 3.2 Customer Portal Session — Success

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/stripe/v1/billing_portal/sessions",
    "bodyPatterns": [
      { "contains": "customer=cus_mock" }
    ]
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "id": "bps_mock_001",
      "object": "billing_portal.session",
      "url": "https://billing.stripe.com/p/session/mock_001",
      "customer": "cus_mock_001",
      "created": 1769518800
    }
  }
}
```

### 3.3 List Invoices — Success

```json
{
  "request": {
    "method": "GET",
    "urlPath": "/stripe/v1/invoices",
    "queryParameters": {
      "customer": { "equalTo": "cus_mock_001" }
    }
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "object": "list",
      "data": [
        {
          "id": "in_mock_001",
          "object": "invoice",
          "amount_due": 999,
          "amount_paid": 999,
          "currency": "usd",
          "status": "paid",
          "customer": "cus_mock_001",
          "subscription": "sub_mock_001",
          "period_start": 1766926800,
          "period_end": 1769518800,
          "created": 1769518800
        }
      ],
      "has_more": false
    }
  }
}
```

### 3.4 Webhook — checkout.session.completed

```json
{
  "webhook_event": {
    "id": "evt_mock_checkout_001",
    "object": "event",
    "type": "checkout.session.completed",
    "created": 1769518800,
    "data": {
      "object": {
        "id": "cs_test_mock_001",
        "object": "checkout.session",
        "mode": "subscription",
        "status": "complete",
        "customer": "cus_mock_001",
        "subscription": "sub_mock_001",
        "metadata": {
          "tenantId": "tenant-00000000-0000-0000-0000-000000000001",
          "planCode": "pro"
        }
      }
    }
  }
}
```

**Webhook Signature 검증 설정:**

```java
// Stripe webhook signing secret for test
private static final String STRIPE_WEBHOOK_SECRET = "whsec_test_mock_secret";

public static String generateStripeSignature(String payload, long timestamp) {
    String signedPayload = timestamp + "." + payload;
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(STRIPE_WEBHOOK_SECRET.getBytes(), "HmacSHA256"));
    String signature = Hex.encodeHexString(mac.doFinal(signedPayload.getBytes()));
    return "t=" + timestamp + ",v1=" + signature;
}
```

### 3.5 Webhook — invoice.payment_failed

```json
{
  "webhook_event": {
    "id": "evt_mock_payment_fail_001",
    "object": "event",
    "type": "invoice.payment_failed",
    "created": 1769518800,
    "data": {
      "object": {
        "id": "in_mock_002",
        "object": "invoice",
        "amount_due": 999,
        "amount_paid": 0,
        "currency": "usd",
        "status": "open",
        "customer": "cus_mock_001",
        "subscription": "sub_mock_001",
        "attempt_count": 1,
        "next_payment_attempt": 1769605200
      }
    }
  }
}
```

### 3.6 Webhook — customer.subscription.updated

```json
{
  "webhook_event": {
    "id": "evt_mock_sub_update_001",
    "object": "event",
    "type": "customer.subscription.updated",
    "created": 1769518800,
    "data": {
      "object": {
        "id": "sub_mock_001",
        "object": "subscription",
        "status": "active",
        "customer": "cus_mock_001",
        "current_period_start": 1769518800,
        "current_period_end": 1772197200,
        "items": {
          "data": [
            {
              "price": {
                "id": "price_pro_monthly",
                "product": "prod_pro",
                "unit_amount": 999,
                "currency": "usd",
                "recurring": { "interval": "month" }
              }
            }
          ]
        },
        "metadata": {
          "tenantId": "tenant-00000000-0000-0000-0000-000000000001",
          "planCode": "pro"
        }
      },
      "previous_attributes": {
        "items": {
          "data": [
            {
              "price": {
                "id": "price_free",
                "product": "prod_free"
              }
            }
          ]
        }
      }
    }
  }
}
```

---

## 4. FCM API 목킹

### 4.1 Send Notification — Success

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/fcm/v1/projects/synapse-mock/messages:send",
    "headers": {
      "Authorization": { "contains": "Bearer " }
    }
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "name": "projects/synapse-mock/messages/msg_mock_001"
    }
  }
}
```

**요청 fixture:**

```json
{
  "message": {
    "token": "device_token_mock_001",
    "notification": {
      "title": "레벨 업!",
      "body": "축하합니다! 레벨 4 '학자'에 도달했습니다."
    },
    "data": {
      "type": "LEVEL_UP",
      "newLevel": "4",
      "title": "학자"
    },
    "android": {
      "priority": "high"
    },
    "webpush": {
      "headers": {
        "Urgency": "high"
      }
    }
  }
}
```

### 4.2 Batch Send — Partial Success

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/fcm/v1/projects/synapse-mock/messages:send",
    "bodyPatterns": [
      { "contains": "batch_token" }
    ]
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "name": "projects/synapse-mock/messages/msg_mock_batch_001"
    }
  }
}
```

### 4.3 Error — Invalid Token (401)

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/fcm/v1/projects/synapse-mock/messages:send",
    "bodyPatterns": [
      { "contains": "expired_device_token" }
    ]
  },
  "response": {
    "status": 404,
    "jsonBody": {
      "error": {
        "code": 404,
        "message": "Requested entity was not found.",
        "status": "NOT_FOUND",
        "details": [
          {
            "@type": "type.googleapis.com/google.firebase.fcm.v1.FcmError",
            "errorCode": "UNREGISTERED"
          }
        ]
      }
    }
  }
}
```

---

## 5. AWS SES 목킹

### 5.1 Send Email — Success

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/ses",
    "bodyPatterns": [
      { "contains": "Action=SendEmail" }
    ]
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "text/xml"
    },
    "body": "<?xml version=\"1.0\" ?><SendEmailResponse xmlns=\"http://ses.amazonaws.com/doc/2010-12-01/\"><SendEmailResult><MessageId>mock-ses-message-001</MessageId></SendEmailResult><ResponseMetadata><RequestId>mock-ses-request-001</RequestId></ResponseMetadata></SendEmailResponse>"
  }
}
```

**요청 fixture:**

```
Action=SendEmail
&Source=noreply@synapse.app
&Destination.ToAddresses.member.1=user1@gmail.com
&Message.Subject.Data=오늘 복습할 카드가 25장 있습니다
&Message.Body.Html.Data=<h1>복습 리마인더</h1><p>프로그래밍 기초 덱에서 25장의 카드가 대기 중입니다.</p>
```

### 5.2 Send Email — Bounce

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/ses",
    "bodyPatterns": [
      { "contains": "Action=SendEmail" },
      { "contains": "bounce@example.com" }
    ]
  },
  "response": {
    "status": 400,
    "headers": {
      "Content-Type": "text/xml"
    },
    "body": "<?xml version=\"1.0\" ?><ErrorResponse xmlns=\"http://ses.amazonaws.com/doc/2010-12-01/\"><Error><Type>Sender</Type><Code>MessageRejected</Code><Message>Email address is on the suppression list</Message></Error><RequestId>mock-ses-error-001</RequestId></ErrorResponse>"
  }
}
```

### 5.3 SNS Bounce Notification

```json
{
  "sns_notification": {
    "Type": "Notification",
    "MessageId": "sns-mock-001",
    "TopicArn": "arn:aws:sns:ap-northeast-2:123456789:ses-bounces",
    "Subject": "Amazon SES Email Event Notification",
    "Message": "{\"notificationType\":\"Bounce\",\"bounce\":{\"bounceType\":\"Permanent\",\"bouncedRecipients\":[{\"emailAddress\":\"bounce@example.com\",\"action\":\"failed\",\"status\":\"5.1.1\",\"diagnosticCode\":\"smtp; 550 5.1.1 user unknown\"}],\"timestamp\":\"2026-01-15T10:00:00Z\",\"feedbackId\":\"mock-feedback-001\"},\"mail\":{\"timestamp\":\"2026-01-15T09:59:00Z\",\"source\":\"noreply@synapse.app\",\"messageId\":\"mock-ses-message-bounce\"}}",
    "Timestamp": "2026-01-15T10:00:00Z"
  }
}
```

---

## 6. OpenAI API 목킹

### 6.1 Embeddings — Success

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/openai/v1/embeddings",
    "headers": {
      "Authorization": { "contains": "Bearer " }
    }
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "object": "list",
      "data": [
        {
          "object": "embedding",
          "index": 0,
          "embedding": [0.0023, -0.0121, 0.0156, 0.0087, -0.0203, 0.0312, -0.0045, 0.0189, 0.0267, -0.0134, 0.0098, 0.0211, -0.0176, 0.0043, 0.0289, -0.0067]
        }
      ],
      "model": "text-embedding-3-small",
      "usage": {
        "prompt_tokens": 15,
        "total_tokens": 15
      }
    }
  }
}
```

> **참고**: 실제 임베딩은 1536차원이지만 fixture에서는 16차원으로 축소. 테스트에서 차원 수 검증이 필요한 경우 1536차원 fixture를 별도 생성할 것.

### 6.2 Chat Completion — Success (카드 생성용)

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/openai/v1/chat/completions",
    "headers": {
      "Authorization": { "contains": "Bearer " }
    }
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "id": "chatcmpl-mock-001",
      "object": "chat.completion",
      "created": 1769518800,
      "model": "gpt-4o",
      "choices": [
        {
          "index": 0,
          "message": {
            "role": "assistant",
            "content": "[{\"cardType\":\"basic\",\"frontContent\":\"머신러닝에서 과적합(overfitting)이란 무엇인가?\",\"backContent\":\"훈련 데이터에 너무 잘 맞춰져 새로운 데이터에 대한 일반화 성능이 떨어지는 현상\",\"confidence\":0.95},{\"cardType\":\"basic\",\"frontContent\":\"과적합을 방지하기 위한 대표적인 기법 3가지는?\",\"backContent\":\"1. 정규화(Regularization) 2. 드롭아웃(Dropout) 3. 교차 검증(Cross-validation)\",\"confidence\":0.92}]"
          },
          "finish_reason": "stop"
        }
      ],
      "usage": {
        "prompt_tokens": 500,
        "completion_tokens": 200,
        "total_tokens": 700
      }
    }
  }
}
```

### 6.3 Rate Limit Error (429)

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/openai/v1/embeddings",
    "bodyPatterns": [
      { "contains": "rate_limit_trigger" }
    ]
  },
  "response": {
    "status": 429,
    "headers": {
      "Retry-After": "30",
      "X-RateLimit-Remaining-Requests": "0",
      "X-RateLimit-Reset-Requests": "30s"
    },
    "jsonBody": {
      "error": {
        "message": "Rate limit reached for text-embedding-3-small in organization org-mock on requests per min (RPM): Limit 3000, Used 3000, Requested 1.",
        "type": "rate_limit_error",
        "param": null,
        "code": "rate_limit_exceeded"
      }
    }
  }
}
```

### 6.4 Server Error (500)

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/openai/v1/chat/completions",
    "bodyPatterns": [
      { "contains": "server_error_trigger" }
    ]
  },
  "response": {
    "status": 500,
    "jsonBody": {
      "error": {
        "message": "The server had an error while processing your request. Sorry about that!",
        "type": "server_error",
        "param": null,
        "code": null
      }
    }
  }
}
```

---

## 7. Anthropic Claude API 목킹

### 7.1 Messages — Success

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/anthropic/v1/messages",
    "headers": {
      "x-api-key": { "contains": "sk-ant-" },
      "anthropic-version": { "equalTo": "2023-06-01" }
    }
  },
  "response": {
    "status": 200,
    "jsonBody": {
      "id": "msg_mock_001",
      "type": "message",
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "노트의 내용을 바탕으로 분석한 결과, 정규화 기법은 모델의 복잡도를 제한하여 과적합을 방지하는 기술입니다. L1 정규화(Lasso)는 가중치를 0으로 만들어 특성 선택 효과가 있으며, L2 정규화(Ridge)는 가중치를 균등하게 줄입니다."
        }
      ],
      "model": "claude-sonnet-4-20250514",
      "stop_reason": "end_turn",
      "usage": {
        "input_tokens": 800,
        "output_tokens": 150
      }
    }
  }
}
```

### 7.2 Rate Limit Error (429)

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/anthropic/v1/messages",
    "bodyPatterns": [
      { "contains": "rate_limit_trigger" }
    ]
  },
  "response": {
    "status": 429,
    "headers": {
      "retry-after": "60"
    },
    "jsonBody": {
      "type": "error",
      "error": {
        "type": "rate_limit_error",
        "message": "Number of request tokens has exceeded your per-minute rate limit."
      }
    }
  }
}
```

### 7.3 Overloaded Error (529)

```json
{
  "request": {
    "method": "POST",
    "urlPath": "/anthropic/v1/messages",
    "bodyPatterns": [
      { "contains": "overloaded_trigger" }
    ]
  },
  "response": {
    "status": 529,
    "jsonBody": {
      "type": "error",
      "error": {
        "type": "overloaded_error",
        "message": "Anthropic's API is temporarily overloaded. Please try again later."
      }
    }
  }
}
```

---

## 8. Python (respx) 통합 패턴

### 8.1 OpenAI Embeddings Mock

```python
import respx
import httpx
import json
from pathlib import Path

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "api_responses"


def load_api_fixture(name: str) -> dict:
    with open(FIXTURE_DIR / f"{name}.json") as f:
        return json.load(f)


@respx.mock
async def test_embedding_generation():
    fixture = load_api_fixture("openai_embeddings_success")

    respx.post("https://api.openai.com/v1/embeddings").mock(
        return_value=httpx.Response(200, json=fixture)
    )

    from app.ai.embedding_service import generate_embedding
    result = await generate_embedding("머신러닝에서 과적합이란?")

    assert len(result) == 16  # fixture 차원 수
    assert respx.calls.call_count == 1
```

### 8.2 Claude API Mock

```python
@respx.mock
async def test_card_generation_with_claude():
    fixture = load_api_fixture("anthropic_messages_success")

    respx.post("https://api.anthropic.com/v1/messages").mock(
        return_value=httpx.Response(200, json=fixture)
    )

    from app.ai.card_generator import generate_cards
    cards = await generate_cards(
        note_id="note-00000000-0000-0000-0000-000000000001",
        card_type="basic",
        count=5
    )

    assert len(cards) > 0
    assert cards[0]["cardType"] == "basic"
```

### 8.3 Rate Limit + Retry Mock

```python
@respx.mock
async def test_openai_rate_limit_retry():
    rate_limit_fixture = load_api_fixture("openai_rate_limit_429")
    success_fixture = load_api_fixture("openai_embeddings_success")

    route = respx.post("https://api.openai.com/v1/embeddings")
    route.side_effect = [
        httpx.Response(429, json=rate_limit_fixture,
                       headers={"Retry-After": "1"}),
        httpx.Response(200, json=success_fixture),
    ]

    from app.ai.embedding_service import generate_embedding_with_retry
    result = await generate_embedding_with_retry("테스트 텍스트")

    assert result is not None
    assert respx.calls.call_count == 2  # 1번 실패 + 1번 성공
```

---

## 9. 외부 API 의존성 매트릭스

| 외부 API | 사용 서비스 | 목적 | WireMock 매핑 수 |
|----------|-----------|------|:---------------:|
| Google OAuth | platform-svc / auth | 로그인/가입 | 4 |
| GitHub OAuth | platform-svc / auth | 로그인/가입 | 4 |
| Apple OAuth | platform-svc / auth | 로그인/가입 | 4 |
| Microsoft OAuth | platform-svc / auth | 로그인/가입 | 4 |
| Stripe API | platform-svc / billing | 결제/구독 | 6 |
| FCM | platform-svc / notification | 푸시 알림 | 3 |
| AWS SES | platform-svc / notification | 이메일 | 3 |
| OpenAI API | learning-svc / learning-ai | 임베딩/생성 | 4 |
| Anthropic Claude | learning-svc / learning-ai | RAG/생성 | 3 |
| **합계** | | | **35** |
