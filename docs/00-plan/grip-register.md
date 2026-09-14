# 결정 기록부 (Grip Register)

> PRD 착수 전에 확정해야 할 결정을 한 곳에 모아 추적한다.
> 참조 범위: `docs/00-plan/references/vps-v2-0-rooted.md` · `docs/00-plan/references/signal-validation-summary.md`
> 관심 방향: 소비자를 개인 학습자에서 훈련기관으로 재설정하는 축 전환과, 그에 따른 표적 고객 · 핵심 가치 · 최소 기능 범위 · 과금 구조의 재정의
> 완료 조건: 아래 토픽 전부 RESOLVED 또는 DROPPED
> 반영 대상: 근거 문서 `docs/00-plan/` · 규범 문서 `AGENTS.md`

---

## 재료 점검 — 2026-09-14

| 역할 | 상태 | 근거 |
|---|---|---|
| R1 목적 · 성공 기준 | 충족 | `vps-v2-0-rooted.md` §1-1 한 줄 포지셔닝, §11 종합 판정 |
| R2 범위 · 산출물 정의 | 충족 | `vps-v2-0-rooted.md` §8 최소 기능 범위와 제외 범위 |
| R3 대상 · 이해관계자 | 부분 | §2-1에 세 주체가 정의되어 있으나 개인 학습자 기준이며, 기관 중심 전환 시 위상이 바뀜 → T1로 흡수 |
| R4 제약조건 | 부분 | §9-3 데이터 보호 원칙과 단가 격차만 있고 운영 규칙 미정 → T7로 흡수 |
| R5 현재 진척 · 기결정 | 충족 | `signal-validation-summary.md` 신호 밀도 게이트 통과, 분류기 v0.2 성능 |

추출 기준선(R1 · R2)이 충족되어 게이트를 발동하지 않고 토픽 추출로 진행한다.

---

## 토픽

RESOLVED: 4 / DROPPED: 0 / TOTAL: 8

- [x] T1 | CORE  | 제품을 직접 쓰는 주체와 값을 지불하는 주체의 위상 | depends:-        | status:RESOLVED | decision:기관이 구매하고 학습자가 사용한다 | applied:docs/00-plan/product-decisions.md, AGENTS.md §5-1
- [x] T2 | CORE  | 훈련기관이 이 제품을 구매하는 이유(핵심 가치) | depends:T1       | status:RESOLVED | decision:1순위 중도 탈락 감소, 2순위 취업률 방어 | applied:docs/00-plan/product-decisions.md, AGENTS.md §5-2
- [x] T3 | CORE  | 강의 음성 데이터의 획득 경로와 강사 동의 절차 | depends:T1       | status:RESOLVED | decision:학습자 당일 업로드·원본은 기기에만·강사 동의는 제품이 직접 수집 | applied:docs/00-plan/product-decisions.md, AGENTS.md §5-3
- [x] T4 | CORE  | 과금 단위와 계약 형태 | depends:T2       | status:RESOLVED | decision:재적 인원 기준 월별 청구, 1인 1개월 3,000원 | applied:docs/00-plan/product-decisions.md, docs/00-plan/pricing-simulation.md, AGENTS.md §5-4
- [ ] T5 | CORE  | 신호 판정의 품질 기준선(오탐과 미탐의 우선순위)   | depends:T2       | status:UNRESOLVED
- [ ] T6 | CORE  | 최소 기능 범위 재확정                            | depends:T2,T3,T5 | status:UNRESOLVED
- [ ] T7 | CORE  | 개인정보와 저작권 운영 규칙의 확정 수준           | depends:T3       | status:UNRESOLVED
- [ ] T8 | MINOR | 제품 문서에서 쓰는 용어 표기 기준                 | depends:T6       | status:UNRESOLVED
