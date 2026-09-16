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

RESOLVED: 9 / DROPPED: 0 / TOTAL: 9

- [x] T1 | CORE  | 제품을 직접 쓰는 주체와 값을 지불하는 주체의 위상 | depends:-        | status:RESOLVED | decision:기관이 구매하고 학습자가 사용한다 | applied:docs/00-plan/product-decisions.md, AGENTS.md §5-1
- [x] T2 | CORE  | 훈련기관이 이 제품을 구매하는 이유(핵심 가치) | depends:T1       | status:RESOLVED | decision:1순위 중도 탈락 감소, 2순위 취업률 방어 | applied:docs/00-plan/product-decisions.md, AGENTS.md §5-2
- [x] T3 | CORE  | 강의 음성 데이터의 획득 경로와 강사 동의 절차 | depends:T1       | status:RESOLVED | decision:학습자 당일 업로드·원본은 기기에만·강사 동의는 제품이 직접 수집 | applied:docs/00-plan/product-decisions.md, AGENTS.md §5-3
- [x] T4 | CORE  | 과금 단위와 계약 형태 | depends:T2       | status:RESOLVED | decision:재적 인원 기준 월별 청구, 1인 1개월 3,000원 | applied:docs/00-plan/product-decisions.md, docs/00-plan/pricing-simulation.md, AGENTS.md §5-4
- [x] T5 | CORE  | 신호 판정의 품질 기준선(오탐과 미탐의 우선순위) | depends:T2       | status:RESOLVED | decision:정밀도 우선, 재현율 하한 88.7% | applied:docs/00-plan/product-decisions.md, AGENTS.md §5-5
- [x] T6 | CORE  | 최소 기능 범위 재확정 | depends:T2,T3,T5 | status:RESOLVED | decision:학습자 화면 전부+강사 동의+기관 화면 1종, 관리 업무는 수동 | applied:docs/00-plan/product-decisions.md, AGENTS.md §5-6
- [x] T7 | CORE  | 개인정보와 저작권 운영 규칙의 확정 수준 | depends:T3       | status:RESOLVED | decision:질의응답 포함 전사·강사 외 화자는 무기명 단일 표시·전사본 과정 종료 후 6개월 보관 | applied:docs/00-plan/product-decisions.md, AGENTS.md §5-8
- [x] T9 | CORE  | 뒤처짐을 무엇으로 판정하는가 | depends:T6       | status:RESOLVED | decision:복습 목록 미열람 3일 연속(강의가 올라온 날 기준) | applied:docs/00-plan/product-decisions.md, AGENTS.md §5-7
- [x] T8 | MINOR | 제품 문서에서 쓰는 용어 표기 기준 | depends:T6       | status:RESOLVED | decision:본문은 한국어 표기만, 코드 식별자는 SRS에서 정의 | applied:docs/00-plan/product-decisions.md, AGENTS.md §5-9

---

## 종료 — 2026-09-14

토픽 9건이 모두 해소됐다. PRD 착수 조건이 충족됐다.

---

# 2회차 — SRS 착수 전 (2026-09-14)

> 참조 범위: `docs/01-prd/prd.md` · `docs/00-plan/product-decisions.md` · `AGENTS.md` · 선행 프로젝트(핀프렌즈)의 확정 기술 스택
> 관심 방향: SRS를 쓰기 전에 확정해야 할 기술 결정과 문서 규약
> 반영 대상: 근거 문서 `docs/00-plan/` · 규범 문서 `AGENTS.md`

## 재료 점검

| 역할 | 상태 | 근거 |
|---|---|---|
| R1 목적 · 성공 기준 | 충족 | PRD 1장, 13장 |
| R2 범위 · 산출물 정의 | 충족 | PRD 6~8장 |
| R3 대상 · 이해관계자 | 충족 | PRD 3장 |
| R4 제약조건 | 부분 | PRD 9~11장에 품질·데이터·과금 제약은 있으나 인프라 비용과 기기 저장 제약이 없다. S4와 S1로 흡수 |
| R5 현재 진척 · 기결정 | 충족 | `product-decisions.md` 결정 9건 |

## 토픽

RESOLVED: 11 / DROPPED: 0 / TOTAL: 11 (2회차)

- [x] S1 | CORE  | 학습자가 쓰는 실행 형태 | depends:-              | status:RESOLVED | decision:학습자는 휴대폰 설치형 앱, 기관·강사는 웹 화면 | applied:docs/00-plan/product-decisions.md, AGENTS.md §6-1
- [x] S2 | CORE  | 녹음을 앱이 직접 하는가, 외부 파일을 받는가 | depends:S1             | status:RESOLVED | decision:앱이 직접 녹음, 외부 파일 가져오기 없음 | applied:docs/00-plan/product-decisions.md, AGENTS.md §6-2
- [x] S3 | CORE  | 음성이 서버를 거치는가 — 미보관 규칙의 해석 | depends:S2             | status:RESOLVED | decision:거치되 두지 않음, 전사 후 즉시 삭제·실패 시 24시간 상한 | applied:docs/01-prd/prd.md, docs/00-plan/product-decisions.md, AGENTS.md §6-3
- [x] S10 | CORE  | 회차당 정본 선정과 발화 지점 환산 | depends:S2             | status:RESOLVED | decision:첫 업로드를 즉시 기준으로, 미포함 구간만 추가 전사, 발화 지점은 실제 시각 저장 | applied:docs/00-plan/product-decisions.md, AGENTS.md §6-4
- [x] S4 | CORE  | 전사와 판정에 쓰는 외부 서비스, 그리고 원가 상한 | depends:S3,S10 | status:RESOLVED | decision:녹음과 동시에 기기 내 전사, 미지원·실패 시에만 서버 경유, 원가 상한 1인 월 1,000원 | applied:docs/00-plan/product-decisions.md, docs/00-plan/cost-model.md, AGENTS.md §6-5
- [x] S5 | CORE  | 처리 완료 시점 요구 | depends:S4             | status:RESOLVED | decision:업로드 뒤 1시간 상한, 묶음 처리, 부분 처리와 알림 | applied:docs/00-plan/product-decisions.md, AGENTS.md §6-6
- [x] S6 | CORE  | 계정과 인증 방식 | depends:S1             | status:RESOLVED | decision:학습자는 초대 링크+번호 확인, 강사는 전용 주소, 기관은 이메일·비밀번호 | applied:docs/00-plan/product-decisions.md, AGENTS.md §6-7
- [x] S7 | CORE  | 확정 기술 스택과 금지 스택 | depends:S1,S2,S3,S4,S6 | status:RESOLVED | decision:Next.js 단일 풀스택 + Kotlin·Compose 안드로이드 전용 앱, Claude 묶음 호출 | applied:docs/00-plan/product-decisions.md, AGENTS.md §6-10 | note:aztks apply로 결정
- [x] S8 | MINOR | SRS 문서 규약 | depends:-              | status:RESOLVED | decision:요구사항 번호+근거+수용 기준, 한국어 본문, 코드 식별자는 부록 표 | applied:docs/00-plan/product-decisions.md, AGENTS.md §6-9
- [x] S11 | CORE  | 만드는 순서와 데모 단계의 범위 | depends:S7             | status:RESOLVED | decision:웹 먼저 데모, 그다음 안드로이드 앱, 서버 공용 | applied:docs/00-plan/product-decisions.md, AGENTS.md §6-11
- [x] S9 | MINOR | SRS에 넣을 다이어그램 | depends:S7             | status:RESOLVED | decision:7개 선정, 6종 제외, 라벨 한국어, 단계는 그림에 섞지 않음 | applied:docs/00-plan/product-decisions.md, AGENTS.md §6-12 | note:aztks apply로 결정

## 재개방 — 2026-09-16

`cost-model.md`의 원가 계산 결과로 다음 두 가지가 생겼다.

- **S10 신설** — 회차당 한 벌만 전사하는 것이 제품 성립 조건으로 드러났다. 정본 선정과 발화 지점 환산을 정해야 한다.
- **T4 재개방** — 1회차에서 확정한 1인 월 3,000원이 원가를 덮지 못한다. S4에서 원가가 확정된 뒤 단가를 다시 정한다. 1회차 분모는 그대로 두고 이 항목만 다시 연다.

## T4 재개방 종결 — 2026-09-16

S4에서 기기 전사를 기본 경로로 확정해 1인당 원가가 430원 수준으로 내려갔다. 1인 월 3,000원이 성립하므로 **T4를 고치지 않고 그대로 유지한다.** 재개방을 종결한다.

## 2회차 종료 — 2026-09-16

토픽 11건이 모두 해소됐다. SRS 착수 조건이 충족됐다.

## 실기기 확인 결과 반영 — 2026-09-16

실기기 확인으로 다음이 드러나 S4와 T7을 고쳤다. 토픽을 새로 세우지 않고 기존 결정의 내용을 갱신했다.

| 확인한 것 | 결과 | 반영 |
|---|---|---|
| 비행기 모드 전사 | 동작한다. 기기 안에서 처리하는 것이 확증됐다 | S4 확인 항목에서 제거 |
| 15분 녹음 | 문제없다 | S4 확인 항목 축소. 3시간과 6시간은 남았다 |
| 화자 구분 | 제조사 앱 화면에서만 보이고 내보내면 사라진다. 정확도도 높지 않다 | T7을 **화자 구분 없음**으로 변경 |
| 인식기 접근 | 제조사 앱의 전사 기능은 다른 앱에 열려 있지 않다 | S4에 **우리 앱이 쓸 인식기의 품질은 미확인**으로 범위를 좁히고 세 갈래를 열어 둠 |

이에 따라 제품 요구사항 정의서를 판 1.2로, 시스템 요구사항 정의서의 관련 항목을 함께 고쳤다.
