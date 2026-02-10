# SNS 공유 기능 가이드

## 📱 지원 SNS

현재 다음 SNS로 공유가 가능합니다:

1. **카카오톡** 🟡
   - 카카오스토리를 통한 공유
   - 새 창으로 열림

2. **페이스북** 🔵
   - Facebook Sharer를 통한 공유
   - 새 창으로 열림

3. **인스타그램** 🟣
   - 인스타그램 웹 페이지로 이동
   - 링크가 자동으로 복사되어 붙여넣기 가능

4. **링크 복사** 📋
   - 클립보드에 상품 링크 복사

## 🎯 사용 방법

### 1. 상품 카드에서 공유
- 메인 페이지, 상품 목록, 검색 결과 페이지
- 각 상품 카드의 **공유하기** 버튼 클릭
- 공유 모달에서 원하는 SNS 선택

### 2. 상품 상세 페이지에서 공유
- 상품 상세 페이지 하단의 SNS 버튼 클릭
- 각 SNS 아이콘을 직접 클릭하여 공유

## 🔧 설정

별도의 API 키나 설정이 필요 없습니다!

모든 공유 기능은 각 SNS의 공개 URL 스킴을 사용하므로:
- ✅ API 키 불필요
- ✅ 별도 앱 등록 불필요
- ✅ 즉시 사용 가능

## 📝 공유 방식

### 카카오톡
```
https://story.kakao.com/share?url=[상품URL]
```
- 카카오스토리 공유 페이지로 이동
- 로그인 후 카카오톡으로 공유 가능

### 페이스북
```
https://www.facebook.com/sharer/sharer.php?u=[상품URL]
```
- Facebook Sharer 페이지로 이동
- 로그인 후 담벼락에 게시 가능

### 인스타그램
```
https://www.instagram.com/
```
- 인스타그램 웹 페이지로 이동
- 링크가 자동으로 복사되어 있음
- 새 게시물 작성 시 링크 붙여넣기

### 링크 복사
- `navigator.clipboard.writeText()` API 사용
- 클립보드에 상품 URL 복사
- 복사 완료 알림 표시

## 🎨 UI/UX 특징

### 공유 모달
- 깔끔한 팝업 형식
- 4개의 공유 옵션 (2x2 그리드)
- SNS 브랜드 컬러 적용
- 호버 효과로 직관적인 사용성

### 상세 페이지 버튼
- 원형 버튼 디자인
- 각 SNS별 브랜드 아이콘
- 마우스 오버 시 배경색 변경

## 🔍 테스트 방법

### 로컬 서버 실행
```bash
cd C:\10-2\shopping
npx http-server -p 8000
```

### 브라우저에서 확인
1. `http://localhost:8000` 접속
2. 상품 카드의 **공유하기** 버튼 클릭
3. 각 SNS 버튼 테스트

## ⚠️ 주의사항

### 로컬호스트에서 테스트 시
- 카카오톡, 페이스북 등에서 로컬호스트 URL(http://localhost:8000)은 공유되지 않을 수 있습니다
- 실제 운영 도메인에서는 정상 작동합니다

### 이미지 공유
- Base64 이미지는 SNS에서 미리보기로 표시되지 않습니다
- 실제 운영 시 Firebase Storage 또는 CDN을 사용하여 이미지 URL을 제공해야 합니다

### 모바일 환경
- 모바일 브라우저에서는 각 SNS 앱이 설치되어 있으면 자동으로 앱으로 전환됩니다
- 앱이 없으면 웹 페이지로 이동합니다

## 🛠️ 파일 구조

```
shopping/
├── js/
│   ├── share-utils.js          # SNS 공유 유틸리티 함수
│   ├── script.js               # 메인 페이지 공유 이벤트
│   ├── product-detail.js       # 상세 페이지 공유 이벤트
│   ├── products-list.js        # 목록 페이지 공유 이벤트
│   └── search-results.js       # 검색 페이지 공유 이벤트
├── css/
│   └── product-detail.css      # SNS 버튼 스타일
└── KAKAO_SETUP.md              # 이 파일
```

## 📚 참고 자료

- 페이스북 공유: https://developers.facebook.com/docs/sharing/reference/share-dialog
- 카카오스토리: https://story.kakao.com
- 인스타그램: https://www.instagram.com

