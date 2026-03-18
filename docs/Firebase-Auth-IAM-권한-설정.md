# Firebase Auth 권한 설정 (IAM)

회원조회에서 회원 삭제 시 **Firestore**와 **Firebase Auth**에서 모두 삭제되려면,  
**Cloud Functions를 실행하는 서비스 계정**에 Firebase 인증 관리 권한이 있어야 합니다.

---

## 1. 이미지(주 구성원별로 보기)에서 권한 주는 방법

### A. 기존 서비스 계정에 역할 추가하기

1. **IAM** 페이지에서 **"주 구성원별로 보기"** 탭을 선택한 상태로 둡니다.
2. 목록에서 **Cloud Functions가 사용하는 계정**을 찾습니다.
   - 보통 다음 중 하나입니다.
     - **Default compute service account**  
       `344605730776-compute@developer.gserviceaccount.com`  
       (이미지의 두 번째 행, 역할이 "편집자"만 있는 계정)
     - 또는 **firebase-adminsdk**  
       `firebase-adminsdk-xxxxx@프로젝트ID.iam.gserviceaccount.com`
3. 해당 **행 오른쪽의 연필(✎) 아이콘**을 클릭합니다.
4. **"역할"**에서 **"+ 다른 역할 추가"**를 누릅니다.
5. 검색창에 **`Firebase 인증 관리자`** 또는 **`Firebase Authentication Admin`**을 입력해 선택합니다.
6. **저장**을 눌러 적용합니다.

이렇게 하면 해당 서비스 계정에 Firebase Auth(사용자 삭제 등) 권한이 부여됩니다.

---

### B. 새로 권한을 부여할 때 (다른 계정에 추가)

1. **"+ 액세스 권한 부여"** 버튼(파란색)을 클릭합니다.
2. **"주 구성원"**에 서비스 계정 이메일을 입력합니다.  
   (예: `344605730776-compute@developer.gserviceaccount.com`)
3. **"역할"**에서 **"Firebase 인증 관리자"**를 선택합니다.
4. **저장**을 눌러 완료합니다.

---

## 2. 어떤 계정에 권한을 줘야 하나요?

- **Cloud Functions**가 회원 삭제 시 `deleteAuthUser`를 호출하고,  
  그 안에서 `admin.auth().deleteUser(uid)`를 실행합니다.
- 이 코드는 **Functions가 돌아가는 서비스 계정** 권한으로 동작합니다.
- 따라서 **"Default compute service account"**  
  (`숫자-compute@developer.gserviceaccount.com`)  
  또는 Functions용으로 쓰는 **커스텀 서비스 계정**에  
  **Firebase 인증 관리자** 역할을 추가해야 합니다.

이미지에서 **firebase-adminsdk**에는 이미 "Firebase 인증 관리자"가 있지만,  
**실제로 Functions가 돌아가는 계정**은 보통 **Default compute service account**이므로,  
그 계정에 **Firebase 인증 관리자**를 추가하는 것이 일반적입니다.

---

## 3. 코드 동작 요약

- **회원조회**에서 삭제 시  
  `admin/js/firebase-admin.js` → `memberService.deleteMember(memberId)` 호출
- `deleteMember`는  
  1) 회원 문서에서 **Auth UID**를 읽고  
  2) **Cloud Function `deleteAuthUser`**를 호출해 **Firebase Auth 사용자 삭제**  
  3) 그 다음 **Firestore 회원 문서 삭제**  
  순서로 동작합니다.

IAM에서 위 서비스 계정에 **Firebase 인증 관리자**만 추가해 주면,  
회원 삭제 시 Firestore와 Firebase Auth가 함께 삭제됩니다.
