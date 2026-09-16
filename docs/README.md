# 문서 인덱스

각 문서는 하나의 질문에만 답한다. 충돌 판정은 [`../AGENTS.md`](../AGENTS.md) §1을 따른다.

## 문서 계층

| 경로 | 답하는 질문 | 상태 |
|---|---|---|
| `00-plan/` | 착수 전에 무엇을 정해야 하는가 | 결정 20건 전부 확정 (1회차 9건 · 2회차 11건) |
| [`01-prd/prd.md`](01-prd/prd.md) | 왜 만드는가 · 누구를 위한 것인가 | 작성 완료 (버전 1.2) |
| [`02-srs/srs.md`](02-srs/srs.md) | 무엇을 만족해야 하는가 | 작성 완료 (버전 1.0) |
| [`03-tds/tds.md`](03-tds/tds.md) | 어떻게 설계하는가 | 작성 완료 (버전 1.0) |
| [`../tasks/`](../tasks/) | 어떤 단위로 구현·검증하는가 | 미착수 |

## 착수 전 결정 (`00-plan/`)

| 파일 | 용도 |
|---|---|
| [`grip-register.md`](00-plan/grip-register.md) | 미해소 토픽과 해소 현황을 추적하는 결정 기록부 |
| [`product-decisions.md`](00-plan/product-decisions.md) | 확정된 결정 9건의 내용과 근거 |
| [`pricing-simulation.md`](00-plan/pricing-simulation.md) | 과금 단위 비교 계산과 사실 확인 결과 |
| [`cost-model.md`](00-plan/cost-model.md) | 원가가 붙는 경로와 계산 |
| [`copy.md`](00-plan/copy.md) | 바깥에 내보이는 확정 문구 |

## 입력 문서 (`00-plan/references/`)

| 파일 | 내용 | 출처 |
|---|---|---|
| [`vps-v2-0-rooted.md`](00-plan/references/vps-v2-0-rooted.md) | 가치 제안 기준 문서 | `business-research-kokjip` |
| [`signal-validation-summary.md`](00-plan/references/signal-validation-summary.md) | 신호 밀도 실측 및 분류기 개선 결과 | `business-research-kokjip` |

읽기 전용이다. 고칠 일이 생기면 원본 저장소에서 고치고 다시 가져온다.

## 변경 규칙

- 요구사항은 PRD → SRS → TDS 순서로 갱신한다.
- 구현 상세는 `tasks/` 아래에만 적는다.
- 같은 사실을 여러 문서에 복사하지 않는다.
