# FAQ 모바일 오버플로우 해결법

## 문제 상황
- FAQ 탭 버튼들이 모바일에서 4개 중 3개만 보이고 1개가 잘림
- FAQ 질문 텍스트가 오른쪽으로 화면 밖으로 넘어감
- 다른 탭들은 정상 작동하는데 FAQ만 문제 발생

## 근본 원인
1. **FAQ 탭 버튼**: `flex-wrap: wrap` 제거로 인해 4개 버튼이 한 줄에 들어가지 못함
2. **FAQ 질문 텍스트**: JavaScript에서 `white-space: nowrap` 적용으로 긴 텍스트가 강제로 한 줄 처리됨
3. **컨테이너 제한 부족**: 다른 탭들과 달리 오른쪽 경계가 제대로 막히지 않음

## 해결 방법

### 1. FAQ 탭 버튼 수정 (CSS)
```css
.faq-tabs {
    display: flex;
    flex-wrap: wrap;        /* 2줄 배치 허용 */
    gap: 6px;
    margin-bottom: 20px;
    width: 100%;
    max-width: 100%;
    overflow: hidden;       /* 완전 차단 */
    box-sizing: border-box;
}

.faq-tab {
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: #fff;
    color: #666;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
    max-width: calc(25% - 5px);  /* 각 버튼 최대 25% 너비 */
    overflow: hidden;
    text-overflow: ellipsis;     /* 긴 텍스트는 ... 처리 */
}
```

### 2. FAQ 질문 텍스트 수정 (JavaScript)
```javascript
// faq.js 파일에서
'<span class="faq-q-text" style="display: block; width: 0; flex: 1 1 0%; min-width: 0; max-width: calc(100% - 80px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; box-sizing: border-box; word-break: break-all;">' + title + '</span>'
```

**핵심 포인트**:
- `max-width: calc(100% - 80px)` - Q 아이콘과 화살표 공간 제외
- `word-break: break-all` - 강제 줄바꿈
- `overflow: hidden` + `text-overflow: ellipsis` - 넘치는 텍스트는 ... 처리

## 중요한 교훈

### 왜 이렇게 오래 걸렸나?
1. **실제 브라우저 확인 부족** - 코드만 보고 추측했음
2. **다른 성공 사례 분석 부족** - 처음부터 다른 탭들과 정확히 비교했어야 함
3. **근본 원인 파악 실패** - 표면적 증상만 보고 CSS 패치만 반복
4. **JavaScript 동적 생성 간과** - CSS만 수정하고 JS에서 inline style 적용하는 부분 놓침

### 빠른 해결을 위한 체크리스트
1. **다른 성공 페이지와 HTML 구조 비교**
2. **브라우저 개발자 도구로 실제 적용된 CSS 확인**
3. **JavaScript 동적 생성 코드 확인**
4. **모바일 환경에서 실제 테스트**

## 결론
**핵심은 컨테이너 경계를 완전히 막는 것!**
- `overflow: hidden`
- `max-width` 제한
- `text-overflow: ellipsis`
- `word-break: break-all`

다른 탭들이 성공하는 이유는 이 모든 제한이 제대로 적용되어 있기 때문이었음.