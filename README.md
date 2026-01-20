# D-Day 타이머

해커톤 행사장 앞 스크린에 표시할 실시간 카운트다운 타이머입니다.
운영국에서 설정하면 디스플레이에 즉시 반영됩니다.

## 주요 기능

- **실시간 동기화**: Google Sheets 기반으로 운영국과 디스플레이가 연동
- **미니멀 다크 디자인**: 대형 스크린에서 잘 보이는 깔끔한 UI
- **프리셋 기능**: 자주 사용하는 타이머를 빠르게 설정
- **전체화면 모드**: 행사장 스크린에 최적화
- **반응형**: 모든 화면 크기 지원

## 아키텍처

```
┌─────────────────────────────────────────┐
│           Google Sheets                 │
│    (데이터 저장 + Apps Script API)       │
└──────────────┬──────────────────────────┘
               │ HTTP (2초 폴링)
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│  admin.html │  │ display.html│
│  (운영국)    │  │ (스크린)    │
│ - 설정 입력  │  │ - 실시간 수신│
│ - 프리셋    │  │ - 카운트다운 │
└─────────────┘  └─────────────┘
```

## 시작하기

### 1단계: Google Sheets 생성

1. [Google Sheets](https://sheets.google.com) 접속
2. **빈 스프레드시트** 새로 만들기
3. 이름을 `D-Day Timer`로 변경 (선택사항)

### 2단계: Apps Script 설정

1. 메뉴에서 **확장 프로그램** > **Apps Script** 클릭
2. 기존 코드(`function myFunction()...`)를 **모두 삭제**
3. `google-apps-script.js` 파일의 내용을 **전체 복사**하여 붙여넣기
4. **저장** (Ctrl+S 또는 Cmd+S)
5. 상단의 함수 선택 드롭다운에서 `initializeSheets` 선택
6. **실행** 버튼 클릭 (▶)
7. 권한 요청이 나오면:
   - "권한 검토" 클릭
   - 본인 계정 선택
   - "고급" 클릭 → "D-Day Timer(으)로 이동(안전하지 않음)" 클릭
   - "허용" 클릭
8. "초기화 완료!" 알림이 나오면 성공

### 3단계: 웹 앱 배포

1. Apps Script 에디터에서 **배포** > **새 배포** 클릭
2. 톱니바퀴(⚙️) 옆 **유형 선택** 클릭 > **웹 앱** 선택
3. 설정:
   - **설명**: `D-Day Timer API` (아무거나)
   - **실행 대상**: `나`
   - **액세스 권한**: `모든 사용자`
4. **배포** 클릭
5. **웹 앱 URL**을 복사 (중요!)
   - `https://script.google.com/macros/s/XXXXX/exec` 형태

### 4단계: 프로젝트 설정

`js/google-sheets-config.js` 파일을 열고 URL 입력:

```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/XXXXX/exec';
```

### 5단계: 사용

1. **디스플레이**: `display.html`을 행사장 스크린에서 열기
2. **운영국**: `admin.html`을 운영국 컴퓨터에서 열기
3. 운영국에서 타이머 설정 → 디스플레이에 반영 (2초 내)

## 프로젝트 구조

```
d-day-timer/
├── index.html              # 랜딩 페이지
├── admin.html              # 관리자 설정 페이지
├── display.html            # 카운트다운 디스플레이
├── css/
│   ├── common.css          # 공통 스타일
│   ├── display.css         # 디스플레이 스타일
│   └── admin.css           # 관리자 스타일
├── js/
│   ├── google-sheets-config.js  # Google Sheets 설정
│   ├── timer-core.js            # 타이머 유틸리티
│   ├── display.js               # 디스플레이 로직
│   └── admin.js                 # 관리자 로직
├── google-apps-script.js   # Apps Script 코드 (복사용)
├── dday-setup.html         # (구버전 호환) 리다이렉트
├── dday-display.html       # (구버전 호환) 리다이렉트
└── README.md
```

## 페이지 설명

### 디스플레이 페이지 (display.html)
- 대형 타이머 숫자 (시:분:초)
- 프로그레스 바
- 전체화면 모드 (F키 또는 버튼)
- 2초마다 설정 동기화

### 관리자 페이지 (admin.html)
- 이벤트명 입력
- 종료 시각 또는 타이머(분) 설정
- 빠른 프리셋 버튼
- 프리셋 추가/삭제
- 실시간 미리보기
- 타이머 시작/중지

## 운영 시나리오

### 해커톤 진행 예시

1. **개회식 전**: "해커톤 시작까지" 카운트다운
2. **아이디어 구상**: "아이디어 발표까지" 타이머 (프리셋 사용)
3. **개발 단계**: "중간 점검까지" 또는 "개발 마감까지"
4. **발표 준비**: "최종 발표까지" 카운트다운
5. **심사 진행**: "결과 발표까지" 타이머

각 단계별로 관리자 페이지에서 빠르게 전환 가능합니다.

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Google Sheets + Apps Script
- **배포**: GitHub Pages
- **CI/CD**: GitHub Actions

## 디자인

### 색상 팔레트

- 배경: `#121212` ~ `#1a1a1a`
- 강조: `#00d4ff` (시안)
- 성공: `#4ade80` (그린)
- 경고: `#fbbf24` (옐로우)
- 텍스트: `#ffffff`, `#a0a0a0`

### 시각 요소

- 미니멀 다크 테마
- 모노스페이스 타이머 폰트
- 콜론 `:` 깜빡임 애니메이션
- 완료 시 색상 변경 + 펄스 효과

## 문제 해결

| 증상 | 해결 방법 |
|------|----------|
| "연결 끊김" 표시 | Apps Script URL이 정확한지 확인 |
| 디스플레이 반영 안됨 | 2-3초 기다린 후 확인 (폴링 간격) |
| 권한 오류 | Apps Script 배포 시 "모든 사용자" 선택 확인 |
| 시트 없음 오류 | `initializeSheets` 함수 실행했는지 확인 |

## 배포 정보

- **Live Demo**: [https://haedalprogramming.github.io/d-day-timer/](https://haedalprogramming.github.io/d-day-timer/)
- **Repository**: [https://github.com/haedalprogramming/d-day-timer](https://github.com/haedalprogramming/d-day-timer)

## 라이선스

MIT License
