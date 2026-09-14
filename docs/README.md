# 문서 인덱스

각 문서는 하나의 질문에만 답한다. 충돌 판정은 [`../AGENTS.md`](../AGENTS.md) §1을 따른다.

## 문서 계층

| 경로 | 답하는 질문 | 상태 |
|---|---|---|
| `00-plan/` | 착수 전에 무엇을 정해야 하는가 | 진행 중 |
| `01-prd/` | 왜 만드는가 · 누구를 위한 것인가 | 미착수 |
| `02-srs/` | 무엇을 만족해야 하는가 | 미착수 |
| `03-tds/` | 어떻게 설계하는가 | 미착수 |
| [`../tasks/`](../tasks/) | 어떤 단위로 구현·검증하는가 | 미착수 |

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
