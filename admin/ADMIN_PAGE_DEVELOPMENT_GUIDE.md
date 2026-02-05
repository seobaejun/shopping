# 관리자 페이지 개발 가이드

## 개요
이 문서는 관리자 페이지 개발 시 발생할 수 있는 문제들과 해결 방법을 정리한 가이드입니다.  
특히 Firebase 연동, 이벤트 리스너 등록, 스크립트 로드 순서 등에 대한 베스트 프랙티스를 포함합니다.

---

## 📋 목차
1. [성공 사례: 기본환경설정 페이지](#성공-사례-기본환경설정-페이지)
2. [성공 사례: 네비게이션 이벤트 처리](#성공-사례-네비게이션-이벤트-처리)
3. [주요 실패 원인 분석](#주요-실패-원인-분석)
4. [해결 방법](#해결-방법)
5. [베스트 프랙티스](#베스트-프랙티스)
6. [코드 템플릿](#코드-템플릿)

---

## 성공 사례: 기본환경설정 페이지

### 구현 기능
- 기본환경설정 페이지에서 설정값을 Firestore에 저장
- 페이지 로드 시 저장된 설정값 자동 불러오기
- 설정 저장/초기화 버튼 기능

### 발생했던 문제들
1. **버튼 클릭 시 아무 반응 없음**
2. **`window.firebaseAdmin이 없습니다` 오류**
3. **`settingsService가 없습니다` 오류**

---

## 성공 사례: 네비게이션 이벤트 처리

### 구현 기능
- 사이드바 네비게이션 링크 클릭 시 페이지 전환
- 헤더 버튼(홈, 로그아웃 등) 클릭 기능
- 동적 스크립트 로딩 환경에서도 안정적으로 작동

### 발생했던 문제들
1. **네비게이션 링크 클릭 시 아무 반응 없음**
2. **홈 버튼 클릭 시 아무 반응 없음**
3. **콘솔 에러는 없지만 기능이 작동하지 않음**
4. **페이지 새로고침 후에도 계속 작동하지 않음**

### 문제 원인 분석

#### 1. 스크립트 로딩 타이밍 문제 ⚠️ (핵심 원인)

**문제 상황:**
```javascript
// ❌ admin.js가 동적으로 로드됨
script4.onload = () => {
    const script5 = document.createElement('script');
    script5.src = 'js/admin.js';
    document.body.appendChild(script5);
    // DOMContentLoaded는 이미 지나감!
};

// ❌ admin.js 내부
document.addEventListener('DOMContentLoaded', () => {
    // 이 코드는 실행되지 않음!
    // DOMContentLoaded는 이미 발생했기 때문
});
```

**원인:**
- Firebase SDK → firebase-admin.js → dashboard.js → settings.js → **admin.js** 순서로 동적 로드
- `admin.js`가 로드될 때 이미 `DOMContentLoaded` 이벤트가 발생한 후
- 결과: `DOMContentLoaded` 이벤트 리스너가 실행되지 않음

**증상:**
- 콘솔 에러 없음 (스크립트는 정상 로드됨)
- 하지만 이벤트 리스너가 등록되지 않음
- 네비게이션 링크와 버튼이 작동하지 않음

#### 2. 이벤트 리스너 충돌 문제

**문제 상황:**
```javascript
// ❌ 여러 곳에서 이벤트 등록 시도
adminSidebar.addEventListener('click', ...);  // 방법 1
document.addEventListener('click', ...);       // 방법 2
link.addEventListener('click', ...);         // 방법 3
```

**원인:**
- 여러 이벤트 위임 방식이 동시에 등록되어 충돌
- 복잡한 이벤트 위임 로직이 불안정하게 작동

#### 3. 복잡한 이벤트 위임 로직

**문제 상황:**
```javascript
// ❌ 부모 요소를 거슬러 올라가며 링크 찾기
while (clickedElement && clickedElement !== adminSidebar) {
    if (clickedElement.tagName === 'A' && ...) {
        // 복잡한 로직
    }
    clickedElement = clickedElement.parentElement;
}
```

**원인:**
- 부모 요소 탐색 중 예외 상황 처리 미흡
- 클릭 이벤트가 제대로 감지되지 않음

---

### 해결 방법

#### 1. 초기화 함수 분리 및 명시적 호출 ✅

**해결 방법:**
```javascript
// ✅ 초기화 함수를 별도로 분리
function initAdminPage() {
    console.log('🔵🔵🔵 initAdminPage 함수 실행 시작');
    
    // DOM 요소 초기화
    menuToggle = document.getElementById('menuToggle');
    adminSidebar = document.getElementById('adminSidebar');
    navLinks = document.querySelectorAll('.nav-list a');
    contentPages = document.querySelectorAll('.content-page');
    
    // 네비게이션 이벤트 등록
    // ...
}

// ✅ 여러 시점에서 실행 보장
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPage);
} else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    // 이미 로드됨
    setTimeout(initAdminPage, 100);
}

// window.onload도 처리
window.addEventListener('load', () => {
    console.log('🔵 window.onload 실행 - 네비게이션 재초기화');
    setTimeout(initAdminPage, 200);
});
```

**HTML에서 명시적 호출:**
```javascript
// ✅ admin.js 로드 후 명시적으로 호출
script5.onload = () => {
    console.log('✅ admin.js 로드 완료 - 네비게이션 초기화 실행');
    if (typeof initAdminPage === 'function') {
        setTimeout(initAdminPage, 100);
    } else {
        console.error('❌ initAdminPage 함수를 찾을 수 없습니다!');
    }
};
```

**장점:**
- 스크립트 로드 시점과 무관하게 작동
- 여러 시점에서 실행 보장
- 명시적 호출로 확실한 실행

#### 2. 직접 이벤트 할당 (가장 확실한 방법) ✅

**해결 방법:**
```javascript
// ✅ 각 요소에 직접 onclick 할당
const allNavLinks = document.querySelectorAll('.nav-list a[data-page]');
console.log('찾은 네비게이션 링크 개수:', allNavLinks.length);

allNavLinks.forEach((link, index) => {
    const targetPage = link.getAttribute('data-page');
    console.log(`링크 ${index} 등록:`, targetPage);
    
    link.onclick = async function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔵🔵🔵 링크 클릭됨:', targetPage);
        
        try {
            await switchToPage(targetPage, link);
        } catch (error) {
            console.error('❌ 페이지 전환 오류:', error);
            alert('페이지 전환 중 오류: ' + error.message);
        }
        return false;
    };
});

// ✅ 헤더 버튼도 직접 할당
const homeBtn = document.querySelector('.btn-home');
if (homeBtn) {
    homeBtn.onclick = function(e) {
        e.preventDefault();
        console.log('🔵 홈 버튼 클릭됨');
        window.location.href = '../index.html';
        return false;
    };
    console.log('✅ 홈 버튼 등록 완료');
}
```

**장점:**
- 가장 단순하고 확실한 방법
- 이벤트 위임보다 안정적
- 디버깅이 쉬움

#### 3. 여러 시점에서 초기화 보장 ✅

**해결 방법:**
```javascript
// ✅ 1. 즉시 실행 (스크립트 로드 시)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPage);
} else {
    setTimeout(initAdminPage, 100);
}

// ✅ 2. window.onload
window.addEventListener('load', () => {
    setTimeout(initAdminPage, 200);
});

// ✅ 3. 스크립트 로드 후 명시적 호출 (HTML에서)
script5.onload = () => {
    if (typeof initAdminPage === 'function') {
        setTimeout(initAdminPage, 100);
    }
};
```

**장점:**
- 어떤 시점에 스크립트가 로드되어도 작동
- 중복 실행되어도 안전 (onclick은 덮어쓰기)

---

### 작동 원리

#### 전체 흐름

1. **HTML 로드**
   ```
   HTML 파싱 → Firebase SDK 로드 → 스크립트들 순차 로드
   ```

2. **스크립트 로드 순서**
   ```
   firebase-admin.js → dashboard.js → settings.js → admin.js
   ```

3. **admin.js 실행 시점**
   - `DOMContentLoaded`는 이미 발생한 상태
   - `initAdminPage` 함수는 정의되지만 아직 실행되지 않음

4. **초기화 실행**
   - `script5.onload`에서 명시적으로 `initAdminPage()` 호출
   - 또는 `document.readyState` 체크 후 실행
   - 또는 `window.onload`에서 실행

5. **이벤트 등록**
   - 모든 네비게이션 링크에 `onclick` 직접 할당
   - 모든 헤더 버튼에 `onclick` 직접 할당
   - 이벤트 위임 없이 직접 할당 (더 안정적)

#### 핵심 포인트

1. **동적 스크립트 로딩 시 `DOMContentLoaded`에 의존하지 않기**
   - `DOMContentLoaded`는 한 번만 발생
   - 동적 로드된 스크립트는 이미 지나간 후일 수 있음

2. **초기화 함수를 분리하여 명시적으로 호출**
   - 함수로 분리하면 필요할 때 호출 가능
   - 여러 시점에서 호출 가능

3. **직접 이벤트 할당이 더 안정적**
   - 이벤트 위임은 복잡하고 불안정할 수 있음
   - `onclick` 직접 할당이 가장 확실함

4. **여러 시점에서 초기화 보장**
   - `DOMContentLoaded`, `window.onload`, 스크립트 로드 후 모두 처리
   - 어떤 시점에 로드되어도 작동

---

### 코드 템플릿: 네비게이션 이벤트 처리

```javascript
// ✅ 네비게이션 이벤트 처리 템플릿

// 1. 초기화 함수 정의
function initAdminPage() {
    console.log('🔵 initAdminPage 함수 실행 시작');
    
    // DOM 요소 초기화
    const menuToggle = document.getElementById('menuToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    const allNavLinks = document.querySelectorAll('.nav-list a[data-page]');
    
    // 사이드바 토글
    if (menuToggle && adminSidebar) {
        menuToggle.addEventListener('click', () => {
            adminSidebar.classList.toggle('open');
        });
    }
    
    // 네비게이션 링크에 직접 이벤트 할당
    allNavLinks.forEach((link) => {
        const targetPage = link.getAttribute('data-page');
        
        link.onclick = async function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔵 링크 클릭:', targetPage);
            
            try {
                await switchToPage(targetPage, link);
            } catch (error) {
                console.error('❌ 페이지 전환 오류:', error);
                alert('페이지 전환 중 오류: ' + error.message);
            }
            return false;
        };
    });
    
    // 헤더 버튼에 직접 이벤트 할당
    const homeBtn = document.querySelector('.btn-home');
    if (homeBtn) {
        homeBtn.onclick = function(e) {
            e.preventDefault();
            window.location.href = '../index.html';
            return false;
        };
    }
    
    console.log('✅ 네비게이션 이벤트 등록 완료');
}

// 2. 여러 시점에서 실행 보장
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPage);
} else {
    setTimeout(initAdminPage, 100);
}

window.addEventListener('load', () => {
    setTimeout(initAdminPage, 200);
});

// 3. HTML에서 스크립트 로드 후 명시적 호출
// script5.onload = () => {
//     if (typeof initAdminPage === 'function') {
//         setTimeout(initAdminPage, 100);
//     }
// };
```

---

### 체크리스트: 네비게이션 이벤트 처리

네비게이션 이벤트가 작동하지 않을 때 확인할 사항:

- [ ] `initAdminPage` 함수가 정의되어 있는가?
- [ ] 여러 시점에서 `initAdminPage` 호출이 보장되는가?
  - [ ] `DOMContentLoaded` 이벤트 리스너
  - [ ] `document.readyState` 체크
  - [ ] `window.onload` 이벤트 리스너
  - [ ] 스크립트 로드 후 명시적 호출
- [ ] 네비게이션 링크에 `onclick`이 직접 할당되는가?
- [ ] 헤더 버튼에 `onclick`이 직접 할당되는가?
- [ ] 콘솔에 "✅ 네비게이션 이벤트 등록 완료" 메시지가 나타나는가?
- [ ] 링크 클릭 시 콘솔에 "🔵 링크 클릭" 메시지가 나타나는가?

---

## 주요 실패 원인 분석

## 주요 실패 원인 분석

### 1. 이벤트 리스너 등록 문제 ❌

#### 문제 상황
```javascript
// ❌ 잘못된 방법: 페이지 전환 시 이벤트 리스너가 사라짐
document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveSettingsBtn');
    saveBtn.addEventListener('click', saveSettings);
});
```

#### 원인
- 페이지 전환 시 동적으로 표시되는 버튼에 이벤트 리스너가 제대로 등록되지 않음
- `DOMContentLoaded`는 한 번만 실행되므로, 나중에 생성된 요소에는 이벤트가 연결되지 않음

---

### 2. `settingsService` 누락 (핵심 원인) ❌

#### 문제 상황
```javascript
// ❌ firebase-admin.js에서
window.firebaseAdmin = {
    initFirebase,
    db,
    memberService,
    productService,
    orderService,
    lotteryService,
    settingsService  // ❌ undefined - 정의되지 않음!
};
```

#### 원인
- `window.firebaseAdmin` 객체에 `settingsService`를 포함하려고 했지만
- 실제로 `settingsService` 객체 자체가 정의되지 않았음
- 결과: `window.firebaseAdmin.settingsService`가 `undefined`가 되어 오류 발생

#### 오류 메시지
```
window.firebaseAdmin이 없습니다
settingsService가 없습니다
```

---

### 3. 스크립트 로드 순서 및 타이밍 문제 ❌

#### 문제 상황
```javascript
// ❌ settings.js가 firebase-admin.js보다 먼저 실행되거나
//    window.firebaseAdmin이 아직 초기화되지 않은 상태에서 접근
async function saveSettings() {
    if (!window.firebaseAdmin) {
        throw new Error('Firebase Admin이 로드되지 않았습니다.');
    }
}
```

#### 원인
- 비동기 스크립트 로딩으로 인해 실행 순서가 보장되지 않음
- `window.firebaseAdmin`이 아직 초기화되지 않은 상태에서 접근 시도

---

## 해결 방법

### 1. 이벤트 위임 사용 ✅

#### 해결 방법
```javascript
// ✅ 올바른 방법: 이벤트 위임 사용
let settingsEventInitialized = false;

function initSettingsEvents() {
    if (settingsEventInitialized) return;
    
    // document 레벨에서 클릭 이벤트 감지
    document.addEventListener('click', async (e) => {
        const saveBtn = e.target.closest('#saveSettingsBtn');
        if (saveBtn) {
            e.preventDefault();
            e.stopPropagation();
            await window.saveSettings();
        }
    });
    
    settingsEventInitialized = true;
}

// 여러 시점에서 초기화 시도
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettingsEvents);
} else {
    initSettingsEvents();
}

window.addEventListener('load', initSettingsEvents);
```

#### 장점
- 동적으로 생성된 요소에도 이벤트가 작동
- 페이지 전환 후에도 계속 작동
- 중복 등록 방지 가능

---

### 2. `settingsService` 객체 정의 ✅

#### 해결 방법
```javascript
// ✅ firebase-admin.js에 settingsService 정의
const settingsService = {
    // 설정 가져오기
    async getSettings() {
        try {
            if (!db) {
                throw new Error('Firestore가 초기화되지 않았습니다.');
            }
            
            const settingsDoc = await collections.settings().doc('main').get();
            if (settingsDoc.exists) {
                return settingsDoc.data();
            }
            return null;
        } catch (error) {
            console.error('설정 가져오기 오류:', error);
            return null;
        }
    },
    
    // 설정 저장
    async saveSettings(settingsData) {
        try {
            if (!db) {
                throw new Error('Firestore가 초기화되지 않았습니다.');
            }
            
            await collections.settings().doc('main').set({
                ...settingsData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('설정 저장 완료');
            return true;
        } catch (error) {
            console.error('설정 저장 오류:', error);
            throw error;
        }
    }
};

// 전역으로 export
window.firebaseAdmin = {
    initFirebase,
    db,
    memberService,
    productService,
    orderService,
    lotteryService,
    settingsService  // ✅ 정상 작동
};
```

#### 중요 포인트
- **객체를 export하기 전에 반드시 정의되어야 함**
- `collections.settings()` 함수도 함께 정의 필요

---

### 3. Firebase 초기화 대기 함수 ✅

#### 해결 방법
```javascript
// ✅ Firebase 초기화 대기 함수
async function waitForFirebaseAdmin(maxWait = 10000) {
    const startTime = Date.now();
    let waitCount = 0;
    
    console.log('Firebase Admin 대기 시작...');
    
    // window.firebaseAdmin이 로드될 때까지 대기
    while (!window.firebaseAdmin) {
        waitCount++;
        if (Date.now() - startTime > maxWait) {
            throw new Error('Firebase Admin이 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        }
        if (waitCount % 10 === 0) {
            console.log(`Firebase Admin 대기 중... (${waitCount * 100}ms 경과)`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Firebase Admin 발견됨:', window.firebaseAdmin);
    
    // Firebase 초기화 확인 및 실행
    if (!window.firebaseAdmin.db) {
        console.log('Firebase DB 초기화 중...');
        if (window.firebaseAdmin.initFirebase) {
            await window.firebaseAdmin.initFirebase();
        } else {
            throw new Error('initFirebase 함수를 찾을 수 없습니다.');
        }
    }
    
    // settingsService 확인
    if (!window.firebaseAdmin.settingsService) {
        throw new Error('Settings Service가 로드되지 않았습니다.');
    }
    
    console.log('Firebase Admin 초기화 완료');
    return window.firebaseAdmin;
}

// 사용 예시
async function saveSettings() {
    try {
        // Firebase Admin 초기화 대기
        const firebaseAdmin = await waitForFirebaseAdmin();
        
        // 이제 안전하게 사용 가능
        await firebaseAdmin.settingsService.saveSettings(settingsData);
    } catch (error) {
        console.error('오류:', error);
        alert('오류가 발생했습니다: ' + error.message);
    }
}
```

#### 장점
- 스크립트 로드 순서와 무관하게 작동
- 명확한 오류 메시지 제공
- 타임아웃 처리로 무한 대기 방지

---

## 베스트 프랙티스

### 1. 이벤트 리스너 등록

#### ✅ DO
- 이벤트 위임 사용 (`document` 레벨)
- `closest()` 메서드로 버튼 내부 요소 클릭도 감지
- 중복 등록 방지 플래그 사용

#### ❌ DON'T
- 직접 요소에 이벤트 리스너 등록 (동적 콘텐츠에서 작동 안 함)
- `onclick` 속성 사용 (유지보수 어려움)

---

### 2. Firebase 서비스 정의

#### ✅ DO
```javascript
// 1. 서비스 객체 정의
const myService = {
    async getData() { /* ... */ },
    async saveData() { /* ... */ }
};

// 2. 전역 export
window.firebaseAdmin = {
    // ...
    myService  // ✅ 정의 후 export
};
```

#### ❌ DON'T
```javascript
// ❌ 정의 없이 export
window.firebaseAdmin = {
    myService  // undefined!
};
```

---

### 3. 비동기 초기화 처리

#### ✅ DO
```javascript
// 초기화 대기 함수 사용
async function myFunction() {
    const firebaseAdmin = await waitForFirebaseAdmin();
    // 안전하게 사용
}
```

#### ❌ DON'T
```javascript
// ❌ 바로 접근
function myFunction() {
    window.firebaseAdmin.something();  // 오류 가능
}
```

---

### 4. 스크립트 로드 순서

#### ✅ DO
```html
<!-- HTML에서 스크립트 로드 순서 -->
<script src="js/firebase-admin.js"></script>
<script src="js/my-page.js"></script>
```

또는 동적 로드:
```javascript
script1.onload = () => {
    const script2 = document.createElement('script');
    script2.src = 'js/my-page.js';
    document.body.appendChild(script2);
};
```

---

## 코드 템플릿

### 새 관리자 페이지 추가 시 템플릿

#### 1. HTML 구조
```html
<div class="content-page" id="my-page">
    <div class="page-header">
        <h2>내 페이지</h2>
    </div>
    
    <div class="page-content">
        <div class="form-group">
            <label>설정값</label>
            <input type="text" class="form-control" id="mySetting" value="">
        </div>
        
        <div class="settings-actions">
            <button class="btn btn-primary" id="saveMyPageBtn">
                <i class="fas fa-save"></i> 저장
            </button>
        </div>
    </div>
</div>
```

#### 2. JavaScript 파일 (my-page.js)
```javascript
// 내 페이지 관리

// Firebase 초기화 대기 함수 (공통)
async function waitForFirebaseAdmin(maxWait = 10000) {
    const startTime = Date.now();
    
    while (!window.firebaseAdmin) {
        if (Date.now() - startTime > maxWait) {
            throw new Error('Firebase Admin이 로드되지 않았습니다.');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!window.firebaseAdmin.db) {
        await window.firebaseAdmin.initFirebase();
    }
    
    return window.firebaseAdmin;
}

// 저장 함수
async function saveMyPage() {
    const saveBtn = document.getElementById('saveMyPageBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
    }
    
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        
        const data = {
            mySetting: document.getElementById('mySetting')?.value || ''
        };
        
        // Firestore에 저장
        await firebaseAdmin.myService.saveData(data);
        
        alert('✅ 저장되었습니다!');
    } catch (error) {
        console.error('저장 오류:', error);
        alert('❌ 저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> 저장';
        }
    }
}

// 로드 함수
async function loadMyPage() {
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        const data = await firebaseAdmin.myService.getData();
        
        if (data) {
            document.getElementById('mySetting').value = data.mySetting || '';
        }
    } catch (error) {
        console.error('로드 오류:', error);
    }
}

// 전역 export
window.saveMyPage = saveMyPage;
window.loadMyPage = loadMyPage;

// 이벤트 위임으로 버튼 클릭 처리
let myPageEventInitialized = false;

function initMyPageEvents() {
    if (myPageEventInitialized) return;
    
    document.addEventListener('click', async (e) => {
        const saveBtn = e.target.closest('#saveMyPageBtn');
        if (saveBtn) {
            e.preventDefault();
            e.stopPropagation();
            await window.saveMyPage();
        }
    });
    
    myPageEventInitialized = true;
}

// 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMyPageEvents);
} else {
    initMyPageEvents();
}

window.addEventListener('load', initMyPageEvents);
```

#### 3. firebase-admin.js에 서비스 추가
```javascript
// myService 정의
const myService = {
    async getData() {
        try {
            if (!db) {
                throw new Error('Firestore가 초기화되지 않았습니다.');
            }
            
            const doc = await collections.myData().doc('main').get();
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error('데이터 가져오기 오류:', error);
            return null;
        }
    },
    
    async saveData(data) {
        try {
            if (!db) {
                throw new Error('Firestore가 초기화되지 않았습니다.');
            }
            
            await collections.myData().doc('main').set({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('데이터 저장 완료');
            return true;
        } catch (error) {
            console.error('데이터 저장 오류:', error);
            throw error;
        }
    }
};

// collections에 추가
const collections = {
    // ...
    myData: () => {
        if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
        return db.collection('myData');
    }
};

// window.firebaseAdmin에 추가
window.firebaseAdmin = {
    // ...
    myService
};
```

#### 4. admin.js에 페이지 로드 처리 추가
```javascript
async function loadPageData(pageId) {
    // ...
    switch(pageId) {
        case 'my-page':
            if (window.loadMyPage) {
                await window.loadMyPage();
            }
            break;
        // ...
    }
}
```

#### 5. HTML에 스크립트 추가
```html
<script>
    waitForFirebase().then(() => {
        const script1 = document.createElement('script');
        script1.src = 'js/firebase-admin.js';
        document.body.appendChild(script1);
        
        script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'js/my-page.js';
            document.body.appendChild(script2);
            
            script2.onload = () => {
                const script3 = document.createElement('script');
                script3.src = 'js/admin.js';
                document.body.appendChild(script3);
            };
        };
    });
</script>
```

---

## 체크리스트

새 관리자 페이지를 만들 때 다음 항목을 확인하세요:

### 필수 항목
- [ ] HTML에 페이지 구조 추가 (`content-page` div)
- [ ] JavaScript 파일 생성
- [ ] `waitForFirebaseAdmin()` 함수 사용
- [ ] 이벤트 위임으로 버튼 클릭 처리
- [ ] `firebase-admin.js`에 서비스 객체 정의
- [ ] `collections`에 컬렉션 추가
- [ ] `window.firebaseAdmin`에 서비스 export
- [ ] `admin.js`의 `loadPageData`에 케이스 추가
- [ ] HTML에 스크립트 로드 순서 확인

### 권장 사항
- [ ] 오류 처리 (try-catch)
- [ ] 로딩 상태 표시 (버튼 비활성화, 스피너)
- [ ] 성공/실패 알림 (alert 또는 toast)
- [ ] 콘솔 로그 (디버깅용)
- [ ] 중복 등록 방지 플래그

---

## 주의사항

1. **객체 정의 순서**: 서비스 객체를 정의한 후에 `window.firebaseAdmin`에 추가해야 함
2. **스크립트 로드 순서**: `firebase-admin.js` → 페이지별 JS → `admin.js` 순서 유지
3. **이벤트 위임**: 동적 콘텐츠에는 반드시 이벤트 위임 사용
4. **비동기 처리**: Firebase 관련 함수는 모두 `async/await` 사용
5. **오류 처리**: 모든 Firebase 작업에 try-catch 추가

---

## 참고 파일

- `admin/js/firebase-admin.js`: Firebase 서비스 정의
- `admin/js/settings.js`: 설정 페이지 예제
- `admin/js/admin.js`: 페이지 전환 로직
- `admin/index.html`: HTML 구조 및 스크립트 로드

---

## 성공 사례: 회원조회 페이지 데이터 표시

### 구현 기능
- Firestore의 `members` 컬렉션에서 회원 데이터 가져오기
- 회원정보 테이블에 데이터 표시
- 검색, 필터링, 페이지네이션 기능

### 발생했던 문제들
1. **데이터가 Firestore에 저장되지만 테이블에 표시되지 않음**
2. **`loadAllMembers` 함수가 호출되지 않음**
3. **`renderMemberInfoTable`이 빈 배열을 렌더링함**

---

### 문제 원인 분석

#### 1. `loadPageData` 함수 중복 정의 ⚠️ (핵심 원인 #1)

**문제 상황:**
```javascript
// ✅ 89번째 줄: 올바른 함수
async function loadPageData(pageId) {
    switch(pageId) {
        case 'member-search':
            await window.loadAllMembers();
            break;
    }
}

// ❌ 256번째 줄: 잘못된 함수 (덮어쓰기!)
function loadPageData(pageNumber) {
    console.log(`Loading page ${pageNumber}`);
    // 아무것도 하지 않음
}
```

**원인:**
- `loadPageData` 함수가 두 번 정의됨
- 두 번째 정의(256번째 줄)가 첫 번째를 덮어씀
- 결과: `member-search` 케이스가 실행되지 않음

**증상:**
- 콘솔에 "🔵🔵🔵 회원조회 페이지 로드 시작" 로그가 나타나지 않음
- `loadAllMembers` 함수가 호출되지 않음
- 데이터가 표시되지 않음

**해결:**
```javascript
// ✅ 중복 정의 제거
// 256번째 줄의 잘못된 함수 삭제
```

---

#### 2. 변수 스코프 문제 ⚠️ (핵심 원인 #2)

**문제 상황:**
```javascript
// ❌ admin.js의 loadAllMembers
async function loadAllMembers() {
    // 로컬 변수에만 저장
    allMembersData = members;
    filteredMembersData = members;
    
    // window.filteredMembersData는 설정하지 않음!
}

// ❌ renderMemberInfoTable
function renderMemberInfoTable(data = null) {
    // window.filteredMembersData를 참조하려고 하지만 값이 없음
    const membersToRender = window.filteredMembersData || filteredMembersData || [];
    // 결과: 빈 배열 []
}
```

**원인:**
- `admin.js`의 `loadAllMembers`가 로컬 변수(`allMembersData`, `filteredMembersData`)에만 저장
- `window.filteredMembersData`를 설정하지 않음
- `renderMemberInfoTable`이 `window.filteredMembersData`를 참조하려고 하지만 값이 없음
- 결과: `membersToRender`가 빈 배열이 됨

**증상:**
- 콘솔에 "allMembersData: (2) [{...}, {...}]" 로그는 나타남
- 하지만 "membersToRender: []" 빈 배열로 나타남
- "⚠️⚠️⚠️ 렌더링할 회원 데이터가 없습니다!" 경고 메시지

**해결:**
```javascript
// ✅ 전역 변수에도 저장
async function loadAllMembers() {
    const members = await firebaseAdmin.memberService.getMembers();
    
    // 전역 변수에 저장 (무조건 설정)
    window.allMembersData = members;
    window.filteredMembersData = members;
    
    // 로컬 변수도 업데이트
    allMembersData = window.allMembersData;
    filteredMembersData = window.filteredMembersData;
}

// ✅ renderMemberInfoTable에서 전역 변수 우선 참조
function renderMemberInfoTable(data = null) {
    let membersToRender;
    if (data !== null && Array.isArray(data) && data.length > 0) {
        membersToRender = data;
    } else if (window.filteredMembersData && Array.isArray(window.filteredMembersData) && window.filteredMembersData.length > 0) {
        membersToRender = window.filteredMembersData;  // ✅ 전역 변수 우선
    } else if (filteredMembersData && Array.isArray(filteredMembersData) && filteredMembersData.length > 0) {
        membersToRender = filteredMembersData;  // 로컬 변수 대체
    } else {
        membersToRender = [];
    }
}
```

---

#### 3. `member-search.js`와 `admin.js`의 함수 충돌 ⚠️ (반복 실수 주의!)

**문제 상황:**
```javascript
// member-search.js
async function loadAllMembers() {
    // 직접 테이블 렌더링
    tbody.innerHTML = tableHTML;
}

// admin.js
async function loadAllMembers() {
    // renderMemberInfoTable 호출
    renderMemberInfoTable();
}
```

**원인:**
- `member-search.js`와 `admin.js` 모두 `loadAllMembers` 함수 정의
- `admin.js`의 함수가 나중에 로드되어 덮어쓰기
- `member-search.js`의 직접 렌더링 로직이 실행되지 않음

**해결:**
- `member-search.js`의 `loadAllMembers`를 `window.loadAllMembers`로 export
- `admin.js`의 `loadAllMembers`는 `window.loadAllMembers`를 호출하도록 수정
- 또는 `admin.js`의 `loadAllMembers`를 제거하고 `member-search.js`만 사용

---

#### 4. 검색 함수 중복 정의 ⚠️⚠️ (동일한 실수 반복!)

**문제 상황:**
```javascript
// member-search.js
async function searchMemberInfo() {
    // renderSearchResultsTable 호출 (검색 결과 테이블)
    renderSearchResultsTable(window.filteredMembersData);
}

// admin.js
async function searchMemberInfo() {
    // renderMemberInfoTable 호출 (전체회원 테이블)
    renderMemberInfoTable();  // ❌ 잘못된 테이블에 표시!
}
```

**원인:**
- `member-search.js`와 `admin.js` 모두 `searchMemberInfo` 함수 정의
- `admin.js`의 함수가 나중에 로드되어 `window.searchMemberInfo`를 덮어쓰기
- 검색 결과는 `searchResultsBody`에 표시되어야 하는데, `admin.js`의 함수가 `memberTableBody`에 표시
- 결과: 검색 결과가 전혀 표시되지 않음

**증상:**
- 검색 버튼 클릭 시 `admin.js`의 `searchMemberInfo`가 호출됨
- `renderMemberInfoTable`이 호출되어 전체회원 테이블에 표시됨
- 검색 결과 영역(`searchResultsContainer`)은 비어있음
- 콘솔에 `renderSearchResultsTable` 호출 로그가 나타나지 않음

**해결:**
```javascript
// ✅ admin.js에서 중복 함수 완전히 제거
// 회원 검색 함수는 member-search.js로 이동됨
// admin.js에서는 제거하고 member-search.js의 함수를 사용

// ❌ admin.js에 있던 중복 함수
// async function searchMemberInfo() { ... }  // 삭제!

// ✅ member-search.js의 함수만 사용
window.searchMemberInfo = searchMemberInfo;  // member-search.js에서 export
```

**체크리스트 (반드시 확인!):**
- [ ] `grep`으로 `searchMemberInfo` 함수 중복 확인
- [ ] `admin.js`에 `searchMemberInfo`가 있으면 제거
- [ ] `member-search.js`의 `searchMemberInfo`만 `window.searchMemberInfo`로 export
- [ ] 검색 버튼 클릭 시 `renderSearchResultsTable`이 호출되는지 확인
- [ ] 검색 결과가 `searchResultsBody`에 표시되는지 확인

---

### 해결 방법

#### 1. 함수 중복 정의 확인 및 제거 ✅

**해결 방법:**
```javascript
// ✅ grep으로 중복 확인
grep -n "function loadPageData" admin.js

// ✅ 중복 정의 제거
// 잘못된 함수 정의 삭제
```

**체크리스트:**
- [ ] `grep`으로 함수 중복 정의 확인
- [ ] 불필요한 함수 정의 제거
- [ ] 올바른 함수만 남기기

---

#### 2. 전역 변수와 로컬 변수 동기화 ✅

**해결 방법:**
```javascript
// ✅ 데이터 저장 시 전역 변수도 함께 설정
async function loadAllMembers() {
    const members = await firebaseAdmin.memberService.getMembers();
    
    // 전역 변수에 저장 (무조건 설정)
    window.allMembersData = members;
    window.filteredMembersData = members;
    window.currentMemberPage = 1;
    
    // 로컬 변수도 업데이트 (있는 경우)
    if (typeof allMembersData !== 'undefined') {
        allMembersData = members;
    }
    if (typeof filteredMembersData !== 'undefined') {
        filteredMembersData = members;
    }
}
```

**체크리스트:**
- [ ] 데이터 저장 시 `window.변수명`도 함께 설정
- [ ] 렌더링 함수에서 전역 변수 우선 참조
- [ ] 로컬 변수와 전역 변수 동기화

---

#### 3. 함수 호출 체인 확인 ✅

**해결 방법:**
```javascript
// ✅ loadPageData에서 명시적으로 로그 추가
async function loadPageData(pageId) {
    console.log('🔵 loadPageData 호출됨, pageId:', pageId);
    
    switch(pageId) {
        case 'member-search':
            console.log('🔵🔵🔵 회원조회 페이지 로드 시작');
            
            // window.loadAllMembers가 로드될 때까지 대기
            let waitCount = 0;
            while (!window.loadAllMembers && waitCount < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }
            
            if (window.loadAllMembers) {
                await window.loadAllMembers();
            }
            break;
    }
}
```

**체크리스트:**
- [ ] 각 함수 호출 시점에 로그 추가
- [ ] 함수가 정의되지 않은 경우 대기 로직 추가
- [ ] 콘솔 로그로 호출 체인 확인

---

### 작동 원리

#### 전체 흐름

1. **페이지 전환**
   ```
   사용자 클릭 → switchToPage('member-search') → loadPageData('member-search')
   ```

2. **데이터 로드**
   ```
   loadPageData → window.loadAllMembers() → firebaseAdmin.memberService.getMembers()
   ```

3. **데이터 저장**
   ```
   members 배열 → window.allMembersData, window.filteredMembersData
   ```

4. **테이블 렌더링**
   ```
   renderMemberInfoTable() → window.filteredMembersData 참조 → 테이블 HTML 생성
   ```

#### 핵심 포인트

1. **함수 중복 정의 주의** ⚠️⚠️⚠️ (매우 중요!)
   - 같은 이름의 함수가 여러 번 정의되면 마지막 것이 덮어씀
   - `grep`으로 중복 확인 필수
   - **새로운 기능 추가 전 반드시 `grep`으로 중복 확인!**
   - `admin.js`와 `member-search.js` 등 여러 파일에 같은 함수가 있는지 확인
   - 중복 발견 시: 전용 파일(`member-search.js`, `settings.js` 등)의 함수만 남기고 `admin.js`의 중복 제거

2. **전역 변수와 로컬 변수 동기화**
   - 전역 변수(`window.변수명`)는 여러 파일에서 공유 가능
   - 로컬 변수는 파일 내부에서만 사용
   - 데이터 저장 시 둘 다 업데이트 필요

3. **함수 호출 체인 확인**
   - 각 함수가 실제로 호출되는지 콘솔 로그로 확인
   - 함수가 정의되지 않은 경우 대기 로직 추가

---

### 코드 템플릿: 회원조회 페이지

```javascript
// ✅ member-search.js 템플릿

// 1. Firebase 초기화 대기
async function waitForFirebaseAdmin(maxWait = 10000) {
    // ... (settings.js와 동일)
}

// 2. 데이터 로드 함수
async function loadAllMembers() {
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        const members = await firebaseAdmin.memberService.getMembers();
        
        // ✅ 전역 변수에 저장 (무조건 설정)
        window.allMembersData = members;
        window.filteredMembersData = members;
        window.currentMemberPage = 1;
        
        // ✅ 직접 테이블 렌더링
        const tbody = document.getElementById('memberTableBody');
        if (!tbody) return;
        
        if (!members || members.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13">등록된 회원이 없습니다.</td></tr>';
            return;
        }
        
        // 테이블 HTML 생성 및 렌더링
        const tableHTML = members.map((member, index) => {
            // ... HTML 생성
        }).join('');
        
        tbody.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('데이터 로드 오류:', error);
    }
}

// 3. 전역 export
window.loadAllMembers = loadAllMembers;
```

---

### 체크리스트: 회원조회 페이지

데이터가 표시되지 않을 때 확인할 사항:

- [ ] `loadPageData` 함수가 중복 정의되지 않았는가?
- [ ] `loadPageData`가 실제로 호출되는가? (콘솔 로그 확인)
- [ ] `window.loadAllMembers` 함수가 정의되어 있는가?
- [ ] `loadAllMembers`가 실제로 호출되는가? (콘솔 로그 확인)
- [ ] `window.allMembersData`와 `window.filteredMembersData`가 설정되는가?
- [ ] `renderMemberInfoTable`이 `window.filteredMembersData`를 참조하는가?
- [ ] `memberTableBody` 요소가 존재하는가?
- [ ] Firestore에 실제로 데이터가 있는가?

---

## 업데이트 이력

- 2026-02-05: 초기 문서 작성 (기본환경설정 페이지 성공 사례 기반)
- 2026-02-05: 네비게이션 이벤트 처리 성공 사례 추가 (동적 스크립트 로딩 환경 대응)
- 2026-02-05: 회원조회 페이지 데이터 표시 성공 사례 추가 (함수 중복 정의, 변수 스코프 문제 해결)
- 2026-02-05: 검색 함수 중복 정의 문제 추가 (admin.js와 member-search.js의 searchMemberInfo 충돌 해결)

