# Firebase Functions 배포 및 환경변수 (솔라피 1단계)

## 1. 사전 준비

- Node.js 18 이상
- Firebase CLI: `npm install -g firebase-tools`
- 로그인: `firebase login`
- 프로젝트: `shopping` 루트에서 진행 (`.firebaserc`에 `shopping-31dce` 설정됨)

## 2. 의존성 설치 및 배포

```bash
cd shopping
cd functions
npm install
cd ..
firebase deploy --only functions
```

첫 배포 후 콘솔에서 "첫 번째 배포 대기 중" 메시지가 사라지고 `sendSMS` 함수가 보이면 성공입니다.

## 3. 환경변수 설정 (솔라피)

Function에서 사용하는 변수는 **Google Cloud Console**에서 설정합니다.

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 **shopping-31dce** 선택
3. **Cloud Functions** → 배포된 함수 목록에서 **sendSMS** 클릭
4. **수정** (또는 상단 **편집**) → **런타임, 빌드, 연결 및 보안 설정** 펼치기
5. **런타임 환경 변수** / **환경 변수** 섹션에서 다음 추가:

| 이름 | 값 (예시 아님, 실제 입력) |
|------|---------------------------|
| `SOLAPI_API_KEY` | 솔라피 API Key |
| `SOLAPI_API_SECRET` | 솔라피 API Secret |
| `SOLAPI_SENDER` | 발신번호 (솔라피에 등록된 번호, 예: 01012345678) |

6. **저장** 후 함수가 자동으로 다시 배포됩니다.  
   (또는 환경변수만 저장되고, 재배포가 필요하면 터미널에서 `firebase deploy --only functions` 한 번 더 실행)

## 4. 호출 방법 (클라이언트)

Firebase SDK로 Callable 호출:

```javascript
// Firebase 앱 초기화 후
const functions = firebase.app().functions('asia-northeast3');
const sendSMS = functions.httpsCallable('sendSMS');

const result = await sendSMS({ to: '01012345678', text: '테스트 메시지' });
// result.data => { success: true, messageId: '...' }
```

2단계부터는 회원가입 인증번호 요청 시 위처럼 `sendSMS`를 호출하면 됩니다.

## 5. 발신번호 변경

나중에 발신번호를 바꿀 때는 위 **3. 환경변수**에서 `SOLAPI_SENDER`만 새 번호로 수정한 뒤 저장(및 필요 시 재배포)하면 됩니다. 코드 수정은 필요 없습니다.

## 6. 인증번호 요청 시 "INTERNAL" 오류

- **원인**: Functions 쪽에서 예외가 나면(환경변수 미설정, 솔라피 API 오류 등) 클라이언트에는 "INTERNAL"만 보입니다.
- **대응**: `requestVerificationCode` / `verifyVerificationCode`에서 예외를 잡아 `HttpsError` 메시지로 던지도록 수정해 두었습니다. **Functions 재배포** 후에는 알림에 실제 사유(예: "문자 발송 설정이 되어 있지 않습니다.")가 표시됩니다.
- **확인**: 위 **3. 환경변수**에 `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER`가 모두 설정되어 있는지 확인하고, 배포 후 다시 인증번호 요청을 시도해 보세요.
