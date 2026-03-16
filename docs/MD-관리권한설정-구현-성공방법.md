# MD 추가 기능 구현 성공 방법 (관리권한설정)

> 관리자 추가와 동일한 방식으로 MD 추가를 구현한 내용을 정리합니다.  
> 다음에 실패하거나 수정할 때 참고용으로 사용하세요.

---

## 1. Firebase (admin/js/firebase-admin.js)

### 1.1 컬렉션 추가
- `collections.mdManagers()` 추가 → Firestore **mdManagers** 컬렉션 사용

```javascript
mdManagers: () => {
    if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
    return db.collection('mdManagers');
},
```

### 1.2 mdService 추가
- **getMdList()** : mdManagers 컬렉션에서 전체 조회, createdAt 기준 정렬
- **addMd(data)** : MD 문서 추가  
  - 저장 필드: `userId`, `name`, `mdCode`, `email`, `phone`, `status`, `createdAt`, `updatedAt`
- **updateMd(mdId, data)** : 해당 문서 update
- **deleteMd(mdId)** : 해당 문서 delete

### 1.3 전역 노출
- `window.firebaseAdmin` 객체에 `mdService` 포함

---

## 2. HTML (admin/index.html)

### 2.1 MD 목록 패널 (관리자 목록 아래)
- 패널 제목: "MD 목록"
- 버튼: **MD 추가** (`id="mdSettingsAddBtn"`)
- 테이블: 번호, 아이디, 이름, MD코드, 이메일, 전화번호, 등록일, 상태, 관리(수정/삭제)
- tbody `id="mdSettingsTableBody"`, 안내 문구 `id="mdSettingsInfoText"`

### 2.2 MD 추가/수정 모달
- 모달 `id="mdEditModal"`
- **추가 폼** (`id="mdAddFormSection"`): 이름, 아이디, MD코드 입력
- **수정 폼** (`id="mdEditForm"`): 아이디(readonly), 이름, MD코드, 이메일, 전화번호
- hidden `id="mdEditId"`, 버튼: 취소, 저장 (`id="mdEditModalClose"`, `mdEditModalCancel`, `mdEditModalSave`)

---

## 3. JavaScript (admin/js/admin.js)

### 3.1 로드
- **loadMdSettings()**
  - `window.firebaseAdmin`과 `db` 직접 확인 (ensureFirebaseReady 결과만 믿지 않음)
  - db 없으면 `initFirebase()` 한 번 더 시도
  - mdService.getMdList() 사용, 없으면 `collections.mdManagers().get()` 로 직접 조회
  - memberService.getMembers()로 회원 목록 조회 후 memberMap 생성 (userId, name, email 키)
  - renderMdSettingsTable(mdList, memberMap) 호출

### 3.2 표시
- **renderMdSettingsTable(mdList, memberMap)**
  - 각 MD에 대해 `member = memberMap[md.userId] || memberMap[md.name]`
  - 이메일: `member.email` 없으면 `md.email`
  - 전화번호: `member.phone || member.mobile` 없으면 `md.phone`

### 3.3 모달
- **openMdModal(editId)**  
  - 수정 시: mdService.getMdList() 후 해당 id로 찾고, memberService.getMembers(검색어)로 이메일/전화 조회 후 폼 채움  
  - 추가 시: 입력 필드 비움
- **closeMdModal()** : 모달 숨김
- **saveMdModal()**  
  - 수정: mdService.updateMd(id, { name, mdCode, email, phone })  
  - 추가: 이름/아이디/MD코드 입력값으로 memberService.getMembers(아이디 또는 이름)로 이메일/전화 조회 후 mdService.addMd() 호출
- **deleteMdById(mdId)** : mdService.deleteMd(mdId) 후 loadMdSettings() 재호출

### 3.4 호출 시점
- 관리권한설정 페이지 진입 시: `loadAdminSettings()` 마지막에 `await loadMdSettings()` 호출
- 이벤트: MD 추가 버튼 → openMdModal(null), 테이블 수정/삭제 → openMdModal(id) / deleteMdById(id)

---

## 4. 주의사항 (실패 시 참고)

- **"Firebase가 준비되지 않았습니다"**  
  - MD 목록은 `ensureFirebaseReady()` 결과에만 의존하지 말고, `window.firebaseAdmin`과 `getDb()` / `db`를 직접 확인할 것.  
  - db가 null이면 `initFirebase()` 한 번 더 호출 후 재확인.
- **이메일/전화번호가 안 나올 때**  
  - members 컬렉션에서 조회한 결과로 표시. memberMap에 `userId`, `name`, `email` 키로 넣어 두었는지 확인.  
  - 전화번호는 `member.phone || member.mobile` 둘 다 처리.
- **MD 데이터 저장 위치**  
  - MD는 **mdManagers** 컬렉션에만 저장. admins 컬렉션과 혼동하지 말 것.
- **로드 순서**  
  - MD 목록은 관리자 목록과 별도로, 같은 페이지에서 `loadMdSettings()`로 **mdManagers**만 조회.  
  - 관리자 목록(admins)에서 MD를 조회하지 않음.

---

## 5. 수정한 파일 목록

| 파일 | 내용 |
|------|------|
| admin/js/firebase-admin.js | collections.mdManagers, mdService, window.firebaseAdmin.mdService |
| admin/index.html | MD 목록 패널, MD 추가/수정 모달 |
| admin/js/admin.js | loadMdSettings, renderMdSettingsTable, openMdModal, closeMdModal, saveMdModal, deleteMdById, 이벤트 바인딩 |

---

*작성 목적: MD 추가 기능이 정상 동작한 구현을 기록하여, 다음에 실패하거나 수정할 때 참고하기 위함.*
