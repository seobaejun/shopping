# 서버 문제 해결 가이드

## 🔍 "localhost 데이터를 보내지 않았습니다" 오류 해결

이 오류는 브라우저가 로컬 서버에 연결할 수 없을 때 발생합니다.

### 1단계: 서버가 실행 중인지 확인

#### Windows PowerShell에서 확인:
```powershell
# 포트 3000이 사용 중인지 확인
netstat -ano | findstr :3000
```

**결과 분석:**
- 결과가 있으면: 서버가 이미 실행 중입니다 → 2단계로 이동
- 결과가 없으면: 서버가 실행되지 않았습니다 → 서버를 시작하세요

#### 서버 시작하기:
```powershell
# 방법 1: Python 사용 (권장)
cd C:\10-2\shopping
python -m http.server 3000

# 방법 2: Node.js 사용
cd C:\10-2\shopping
npx http-server -p 3000
```

### 2단계: 올바른 URL로 접속하는지 확인

❌ **잘못된 방법:**
```
file:///C:/10-2/shopping/admin/index.html
```

✅ **올바른 방법:**
```
http://localhost:3000/admin/index.html
http://localhost:3000/index.html
```

### 3단계: 브라우저 캐시 삭제

1. **Chrome/Edge**: `Ctrl + Shift + Delete` → 캐시 이미지 및 파일 삭제
2. **Firefox**: `Ctrl + Shift + Delete` → 캐시 선택 후 삭제
3. 브라우저 완전히 닫았다가 다시 열기
4. 시크릿/InPrivate 모드에서 테스트

### 4단계: Firebase 연결 확인

브라우저 개발자 도구(F12)를 열고 Console 탭에서 오류 확인:

#### ✅ 정상 메시지:
```
✅ Firebase SDK 로드 확인됨
✅ Firebase 앱 초기화 완료
✅ Firestore 초기화 완료
```

#### ❌ 오류 메시지와 해결 방법:

**1. "Firebase SDK가 로드되지 않았습니다"**
- **원인**: 인터넷 연결 문제 또는 CDN 차단
- **해결**: 
  - 인터넷 연결 확인
  - VPN 비활성화
  - 방화벽/보안 프로그램 확인

**2. "CORS policy" 오류**
- **원인**: `file://` 프로토콜로 직접 파일을 열었습니다
- **해결**: 반드시 HTTP 서버를 통해 접속하세요

**3. "import.meta is not defined"**
- **원인**: Vite 환경 변수가 브라우저에서 작동하지 않음
- **해결**: 이미 수정되었습니다 (firebase-config.js)

### 5단계: 포트 충돌 해결

포트 3000이 이미 사용 중인 경우:

```powershell
# 다른 포트 사용 (예: 8080)
python -m http.server 8080

# 브라우저에서 접속
http://localhost:3000/admin/index.html
```

또는 기존 프로세스 종료:

```powershell
# 포트 3000을 사용하는 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
taskkill /PID <프로세스ID> /F
```

## 🐛 추가 문제 해결

### 문제: "추첨 결과의 저결금이 모두 1,500원으로 표시됨"
✅ **해결됨** (2026-02-05)
- 샘플 데이터의 `support` → `productSupport`로 변경
- 추첨 로직에서 `w.productSupport` 사용하도록 수정

### 문제: "페이지가 비어 있거나 제대로 로드되지 않음"
**원인**: JavaScript 로딩 오류
**해결**:
1. F12 → Console 탭에서 오류 확인
2. 네트워크 탭에서 실패한 리소스 확인
3. 경로가 올바른지 확인

### 문제: "관리자 페이지 메뉴가 작동하지 않음"
**원인**: admin.js 로딩 실패
**해결**:
1. Console에서 `initAdminPage` 함수 존재 여부 확인
2. 스크립트 로딩 순서 확인
3. 페이지 새로고침 (Ctrl + F5)

## 📋 체크리스트

문제가 발생하면 다음을 순서대로 확인하세요:

- [ ] 서버가 실행 중인가? (`netstat -ano | findstr :3000`)
- [ ] `http://localhost:3000`으로 접속했는가? (`file://`이 아닌)
- [ ] 인터넷 연결이 정상인가? (Firebase CDN 접근 필요)
- [ ] 브라우저 캐시를 삭제했는가?
- [ ] 개발자 도구(F12)에서 오류 메시지를 확인했는가?
- [ ] 방화벽/백신 프로그램이 차단하고 있지 않은가?

## 🆘 여전히 문제가 해결되지 않는다면

1. **테스트 페이지 접속**: http://localhost:3000/test-server.html
2. **브라우저 콘솔 로그 확인**: F12 → Console 탭
3. **네트워크 탭 확인**: F12 → Network 탭 → 실패한 요청 확인
4. **서버 로그 확인**: 서버를 실행한 터미널에서 오류 메시지 확인

## 📞 연락처

추가 지원이 필요하면 프로젝트 관리자에게 문의하세요.

