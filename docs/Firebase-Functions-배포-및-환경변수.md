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

Function에서 사용하는 변수는 **Google Cloud Console**에서 **함수마다 따로** 설정합니다.  
(한 함수에만 넣으면 다른 함수에서는 읽을 수 없습니다.)

**솔라피 문자를 쓰는 함수**마다 아래 세 변수를 넣어야 합니다:
- **sendSMS** — 관리자/알림 문자 발송
- **requestVerificationCode** — 회원가입 인증번호 문자 발송

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 **shopping-31dce** 선택
3. **Cloud Functions** → 배포된 함수 목록에서 **sendSMS** 클릭
4. **수정** (또는 **편집**) → **컨테이너** 탭 → **변수 및 보안 비밀** → **환경 변수**에서 아래 3개 추가
5. 같은 방식으로 **requestVerificationCode** 함수를 열어 **동일한 3개 변수**를 한 번 더 추가

| 이름 | 값 (예시 아님, 실제 입력) |
|------|---------------------------|
| `SOLAPI_API_KEY` | 솔라피 API Key |
| `SOLAPI_API_SECRET` | 솔라피 API Secret |
| `SOLAPI_SENDER` | 발신번호 (솔라피에 등록된 번호, 예: 01012345678) |

6. **배포** 완료 후 각 함수가 새 환경변수로 동작합니다.

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

발신번호를 바꿀 때(예: 010 번호 → 1670-4519 승인 번호로 변경):

1. **sendSMS**, **requestVerificationCode** 두 함수 모두에서 환경변수 **`SOLAPI_SENDER`** 값을 새 번호로 수정합니다.
2. 값은 **숫자만** 입력 (예: `16704519`). 하이픈 없이 입력해도 됩니다.
3. **배포** (또는 저장) 후 적용됩니다. 코드 수정은 필요 없습니다.

## 6. 인증번호 요청 시 "INTERNAL" / "문자 발송 설정이 되어 있지 않습니다"

- **원인**: Functions 쪽에서 예외가 나면(환경변수 미설정, 솔라피 API 오류 등) 클라이언트에는 "INTERNAL"만 보일 수 있고, 코드 수정 후에는 "문자 발송 설정이 되어 있지 않습니다."가 뜹니다.
- **해결**: 인증번호 요청은 **requestVerificationCode** 함수가 실행합니다. **sendSMS**에만 환경변수를 넣으면 안 되고, 위 **3. 환경변수**처럼 **requestVerificationCode**에도 `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER` 세 개를 넣은 뒤 해당 함수를 **배포**해야 합니다.
- **확인**: 두 함수(sendSMS, requestVerificationCode) 모두에서 위 세 변수가 설정돼 있는지 확인한 뒤, 인증번호 요청을 다시 시도해 보세요.
