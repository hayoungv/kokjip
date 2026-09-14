# 콕집 (KOKJIP) — PRD to SRS

강의 녹음에서 **강사가 실무 중요도를 직접 말한 발화**를 찾아내고, 그 발화를 근거로 복습 우선순위를 제시하는 서비스의 제품 문서 저장소다.

선행 리서치는 별도 저장소(`business-research-kokjip`)에서 끝났고, 이 저장소는 그 결과를 입력으로 받아 **PRD → SRS → TDS → 태스크**로 이어지는 산출물을 만든다.

---

## 1. 이 저장소가 다루는 것

| 다룬다 | 다루지 않는다 |
|---|---|
| 제품 요구사항(PRD) · 시스템 요구사항(SRS) · 기술 설계(TDS) | 시장 조사 · 경쟁 실사 · 고객 인터뷰 |
| 착수 전 결정 정리와 그 근거 기록 | 가치 가설의 신규 실측 실험 |
| 구현 태스크 분해와 검증 기준 | 사업 계획 · 재무 모델 |

---

## 2. 문서 구조

```text
docs/
├─ 00-plan/                 착수 전 결정과 실행 계획
│  └─ references/           선행 리서치에서 가져온 입력 문서
├─ 01-prd/                  왜 만드는가 · 누구를 위한 것인가
├─ 02-srs/                  무엇을 만족해야 하는가
└─ 03-tds/                  어떻게 설계하는가
tasks/                      어떤 단위로 구현하고 검증하는가
```

자세한 인덱스는 [`docs/README.md`](docs/README.md)에 있다.

---

## 3. 입력 문서

| 파일 | 내용 |
|---|---|
| [`docs/00-plan/references/vps-v2-0-rooted.md`](docs/00-plan/references/vps-v2-0-rooted.md) | 가치 제안 기준 문서. 표적 고객 · 핵심 문제 · 차별화 메커니즘 · MVP 범위 |
| [`docs/00-plan/references/signal-validation-summary.md`](docs/00-plan/references/signal-validation-summary.md) | 강사 발화 신호 밀도 실측과 분류기 v0.1 → v0.2 개선 결과 |

두 문서는 **읽기 전용 입력**이다. 내용을 고쳐야 할 일이 생기면 원본 저장소에서 고치고 다시 가져온다.

---

## 4. 작업 규칙

공통 규칙은 [`AGENTS.md`](AGENTS.md)가 기준이다. Claude Code 전용 설정은 [`CLAUDE.md`](CLAUDE.md)에 있다.
