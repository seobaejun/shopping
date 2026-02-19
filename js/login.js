// 로그인 페이지 JavaScript

console.log('✅ login.js 로드됨');

// Firebase 초기화
let db = null;
const firebaseConfig = {
    apiKey: "AIzaSyBGQdEiVOl_49oVfb8TPWkc47uaFxV55Xg",
    authDomain: "shopping-31dce.firebaseapp.com",
    projectId: "shopping-31dce",
    storageBucket: "shopping-31dce.firebasestorage.app",
    messagingSenderId: "344605730776",
    appId: "1:344605730776:web:925f9d6206b1ff2e0374ad",
    measurementId: "G-B7V6HK8Z7X"
};

// Firebase 초기화 함수
async function initFirebase() {
    if (db) {
        return db;
    }
    
    try {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK가 로드되지 않았습니다.');
            alert('페이지를 새로고침해주세요.');
            return null;
        }
        
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase 앱 초기화 완료');
        }
        
        db = firebase.firestore();
        console.log('✅ Firestore 초기화 완료');
        return db;
    } catch (error) {
        console.error('❌ Firebase 초기화 오류:', error);
        return null;
    }
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOMContentLoaded - 로그인 페이지 초기화 시작');
    initLogin();
});

// 로그인 초기화
function initLogin() {
    console.log('✅ initLogin 호출됨');
    
    // 로그인 폼 제출
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('✅ 로그인 폼 찾음');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('❌ 로그인 폼을 찾을 수 없습니다.');
    }
    
    // 아이디 저장 기능
    loadSavedUserId();
}

// 폼 제출 핸들러 (HTML에서 직접 호출용)
function handleLoginSubmit(e) {
    console.log('✅ handleLoginSubmit 호출됨 (HTML onsubmit)');
    return handleLogin(e);
}

// 저장된 아이디 불러오기
function loadSavedUserId() {
    const savedUserId = localStorage.getItem('savedUserId');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedUserId && rememberMe) {
        document.getElementById('userId').value = savedUserId;
        document.getElementById('rememberMe').checked = true;
        console.log('✅ 저장된 아이디 불러옴:', savedUserId);
    }
}

// 로그인 처리
async function handleLogin(e) {
    e.preventDefault();
    console.log('✅ handleLogin 호출됨');
    
    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;
    
    console.log('입력된 아이디:', userId);
    
    if (!userId || !password) {
        alert('아이디와 비밀번호를 입력해주세요.');
        return false;
    }
    
    // 로그인 버튼 비활성화
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '로그인 중...';
    }
    
    try {
        console.log('🔄 Firebase 초기화 중...');
        const db = await initFirebase();
        if (!db) {
            throw new Error('Firebase 초기화 실패');
        }
        
        console.log('🔍 사용자 조회 중...');
        // Firestore에서 사용자 조회
        const snapshot = await db.collection('members')
            .where('userId', '==', userId)
            .get();
        
        console.log('조회 결과:', snapshot.empty ? '사용자 없음' : '사용자 찾음');
        
        if (snapshot.empty) {
            alert('아이디 또는 비밀번호가 일치하지 않습니다.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '로그인';
            }
            return false;
        }
        
        // 사용자 데이터 가져오기
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        
        console.log('사용자 데이터:', userData);
        
        // 비밀번호 확인
        if (userData.password !== password) {
            alert('아이디 또는 비밀번호가 일치하지 않습니다.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '로그인';
            }
            return false;
        }
        
        // 회원 상태 확인
        if (userData.status === '정지') {
            alert('정지된 계정입니다. 고객센터에 문의해주세요.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '로그인';
            }
            return false;
        }
        
        // 로그인 성공
        const loginData = {
            userId: userData.userId,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            status: userData.status,
            docId: userDoc.id,
            accountNumber: userData.accountNumber || '',
            loginTime: new Date().toISOString()
        };
        
        // 로그인 정보 저장
        localStorage.setItem('loginUser', JSON.stringify(loginData));
        localStorage.setItem('isLoggedIn', 'true');
        
        // 아이디 저장 기능
        if (rememberMe) {
            localStorage.setItem('savedUserId', userId);
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('savedUserId');
            localStorage.removeItem('rememberMe');
        }
        
        console.log('✅ 로그인 성공:', loginData);
        alert(`${userData.name}님, 환영합니다!`);
        
        // 메인 페이지로 이동
        window.location.href = 'index.html';
        
        return false;
        
    } catch (error) {
        console.error('❌ 로그인 오류:', error);
        alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '로그인';
        }
        return false;
    }
}

// 아이디 찾기
function findId(e) {
    e.preventDefault();
    alert('아이디 찾기 기능은 준비 중입니다.\n고객센터(1670-4519)로 문의해주세요.');
}

// 비밀번호 찾기
function findPassword(e) {
    e.preventDefault();
    alert('비밀번호 찾기 기능은 준비 중입니다.\n고객센터(1670-4519)로 문의해주세요.');
}

// 검색 폼 처리 (에러 방지용)
function handleSearch(e) {
    e.preventDefault();
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
        window.location.href = `search-results.html?keyword=${encodeURIComponent(searchInput.value.trim())}`;
    }
    return false;
}

// 전역으로 노출
window.handleLoginSubmit = handleLoginSubmit;
window.findId = findId;
window.findPassword = findPassword;
window.handleSearch = handleSearch;

console.log('✅ login.js 전역 함수 등록 완료');

