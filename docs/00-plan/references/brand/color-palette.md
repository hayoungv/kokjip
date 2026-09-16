# 콕집 브랜드 컬러 팔레트

## 1. Brand Core

| 이름 | HEX | RGB | 역할 |
|---|---|---|---|
| KOKJIP Navy | `#142A52` | `20, 42, 82` | 로고, 제목, 핵심 텍스트 |
| Deep Navy | `#12233F` | `18, 35, 63` | 앱 아이콘 배경, 강한 대비 |
| KOKJIP Blue | `#5B63E9` | `91, 99, 233` | 핵심 CTA, 링크, 인터랙션 |
| Soft Blue | `#EEF0FF` | `238, 240, 255` | 선택 상태, 배경, 태그 |
| Mint Green | `#18A77A` | `24, 167, 122` | 학습 완료, 성장, 긍정 상태 |
| Mint Light | `#E9FAF3` | `233, 250, 243` | 완료 상태 배경 |
| Warm Yellow | `#F5B83D` | `245, 184, 61` | 강조, 주목, 보조 포인트 |
| Light Gray | `#F3F5F9` | `243, 245, 249` | 앱/웹 기본 배경 |
| Line Gray | `#E4E8EF` | `228, 232, 239` | 카드/입력창/구분선 |
| Text Gray | `#778296` | `119, 130, 150` | 보조 설명, 메타 정보 |

## 2. 권장 사용 비율

```text
Navy / Deep Navy   25%
Blue               15%
White              30%
Light Gray         20%
Mint               7%
Yellow             3%
```

정확한 디자인 토큰으로 사용할 때는 비율보다 **계층 우선순위**를 기준으로 적용합니다.

```css
:root {
  --kokjip-navy: #142A52;
  --kokjip-deep-navy: #12233F;

  --kokjip-blue: #5B63E9;
  --kokjip-blue-soft: #EEF0FF;

  --kokjip-mint: #18A77A;
  --kokjip-mint-soft: #E9FAF3;

  --kokjip-yellow: #F5B83D;

  --kokjip-bg: #F3F5F9;
  --kokjip-line: #E4E8EF;
  --kokjip-text-muted: #778296;
  --kokjip-white: #FFFFFF;
}
```

## 3. 컬러 의미

### Navy
신뢰감과 전문성을 담당합니다.  
교육 서비스이면서 B2B/B2G 협업 가능성을 고려해 브랜드의 기본 축으로 사용합니다.

### Blue
'집중해서 하나를 콕 집는다'는 서비스의 핵심 행동을 표현합니다.  
CTA, 선택 상태, 활성 네비게이션처럼 사용자의 행동을 유도하는 영역에 우선 사용합니다.

### Mint
학습의 진행·완료·성장을 표현합니다.  
복습 완료, 처리 완료, 정상 상태 등의 긍정 피드백에 사용합니다.

### Yellow
강사의 강조나 주목해야 할 부분처럼 **시선의 포인트**가 필요한 영역에 제한적으로 사용합니다.

## 4. UI 상태 컬러

```css
/* Success */
--state-success: #18A77A;
--state-success-bg: #E9FAF3;

/* Warning */
--state-warning: #C78716;
--state-warning-bg: #FFF4DD;

/* Error / Blocked */
--state-error: #D65C68;
--state-error-bg: #FFF0F2;

/* Info / Selected */
--state-info: #5B63E9;
--state-info-bg: #EEF0FF;
```

## 5. 접근성 / 사용 원칙

- 본문 텍스트는 Navy 계열을 기본으로 사용한다.
- Blue, Mint, Yellow는 흰색 배경에서 작은 글씨의 본문 색상으로 남용하지 않는다.
- 색상만으로 상태를 전달하지 않고 텍스트·아이콘·상태값을 함께 제공한다.
- Yellow는 브랜드 포인트로 사용하되 전체 배경색으로 넓게 사용하지 않는다.
- 앱 아이콘에서는 Navy 배경 + White K + Blue/Mint 포인트 조합을 기본안으로 사용한다.

## 6. Logo 기본 조합

### Modern Typography

```text
Primary:   #142A52
Accent:    #5B63E9
Focus:     #18A77A
```

### App Icon

```text
Background: #12233F
K Mark:     #FFFFFF
Focus Blue: #5B63E9
Focus Mint: #18A77A
Highlight:  #49DDB9
```

## 7. 파일

- `kokjip_modern_typography_logo.svg`
- `kokjip_app_icon.svg`
