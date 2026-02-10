// 마이페이지 JavaScript

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
            console.error('Firebase SDK가 로드되지 않았습니다.');
            return null;
        }
        
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        db = firebase.firestore();
        return db;
    } catch (error) {
        console.error('Firebase 초기화 오류:', error);
        return null;
    }
}

// 현재 로그인 사용자
let currentUser = null;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    initMyPage();
});

// 로그인 상태 확인
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginUserData = localStorage.getItem('loginUser');
    
    if (!isLoggedIn || !loginUserData) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = JSON.parse(loginUserData);
    displayUserInfo();
}

// 사용자 정보 표시
function displayUserInfo() {
    // 사이드바 사용자 정보
    document.getElementById('userName').textContent = currentUser.name + '님';
    document.getElementById('userId').textContent = currentUser.userId;
    
    // 회원정보수정 폼 초기화
    loadUserProfile();
}

// 사용자 프로필 로드
async function loadUserProfile() {
    try {
        const db = await initFirebase();
        if (!db) {
            throw new Error('Firebase 초기화 실패');
        }
        
        // Firestore에서 사용자 정보 가져오기
        const doc = await db.collection('members').doc(currentUser.docId).get();
        
        if (doc.exists) {
            const data = doc.data();
            
            document.getElementById('profileUserId').value = data.userId || '';
            document.getElementById('profileName').value = data.name || '';
            document.getElementById('profileEmail').value = data.email || '';
            document.getElementById('profilePhone').value = data.phone || '';
            document.getElementById('profilePostcode').value = data.postcode || '';
            document.getElementById('profileAddress').value = data.address || '';
            document.getElementById('profileDetailAddress').value = data.detailAddress || '';
            document.getElementById('profileAccount').value = data.accountNumber || '';
        }
    } catch (error) {
        console.error('프로필 로드 오류:', error);
    }
}

// 마이페이지 초기화
function initMyPage() {
    // 회원정보수정 폼 제출
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', handleProfileUpdate);
    
    // 비밀번호변경 폼 제출
    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', handlePasswordChange);
    
    // 비밀번호 일치 확인
    setupPasswordCheck();
}

// 섹션 전환
function showSection(sectionName) {
    // 모든 섹션 숨기기
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 선택된 섹션 표시
    document.getElementById(sectionName + '-section').classList.add('active');
    
    // 네비게이션 활성화 상태 변경
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
}

// 주소 검색
function searchAddress() {
    new daum.Postcode({
        oncomplete: function(data) {
            document.getElementById('profilePostcode').value = data.zonecode;
            document.getElementById('profileAddress').value = data.address;
            document.getElementById('profileDetailAddress').focus();
        }
    }).open();
}

// 회원정보 수정
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    if (!confirm('회원정보를 수정하시겠습니까?')) {
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '수정 중...';
    
    try {
        const db = await initFirebase();
        if (!db) {
            throw new Error('Firebase 초기화 실패');
        }
        
        const updateData = {
            email: document.getElementById('profileEmail').value.trim(),
            phone: document.getElementById('profilePhone').value.trim(),
            postcode: document.getElementById('profilePostcode').value.trim(),
            address: document.getElementById('profileAddress').value.trim(),
            detailAddress: document.getElementById('profileDetailAddress').value.trim(),
            accountNumber: document.getElementById('profileAccount').value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('members').doc(currentUser.docId).update(updateData);
        
        // localStorage 업데이트
        currentUser.email = updateData.email;
        currentUser.phone = updateData.phone;
        localStorage.setItem('loginUser', JSON.stringify(currentUser));
        
        alert('회원정보가 수정되었습니다.');
        
    } catch (error) {
        console.error('회원정보 수정 오류:', error);
        alert('회원정보 수정 중 오류가 발생했습니다.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '정보수정';
    }
}

// 비밀번호 일치 확인
function setupPasswordCheck() {
    const newPassword = document.getElementById('newPassword');
    const newPasswordConfirm = document.getElementById('newPasswordConfirm');
    const errorMessage = document.getElementById('passwordError');
    
    const checkPasswordMatch = () => {
        const password = newPassword.value;
        const confirm = newPasswordConfirm.value;
        
        if (confirm === '') {
            errorMessage.style.display = 'none';
            return;
        }
        
        if (password !== confirm) {
            errorMessage.style.display = 'block';
            errorMessage.style.color = '#f44336';
            errorMessage.textContent = '비밀번호가 일치하지 않습니다.';
        } else {
            errorMessage.style.display = 'block';
            errorMessage.style.color = '#4caf50';
            errorMessage.textContent = '비밀번호가 일치합니다.';
        }
    };
    
    newPassword.addEventListener('input', checkPasswordMatch);
    newPasswordConfirm.addEventListener('input', checkPasswordMatch);
}

// 비밀번호 변경
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;
    
    // 비밀번호 형식 검사
    if (newPassword.length < 8) {
        alert('새 비밀번호는 8자 이상이어야 합니다.');
        return;
    }
    
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    if (!(hasLetter && hasNumber && hasSpecial)) {
        alert('새 비밀번호는 영문, 숫자, 특수문자를 조합하여 입력해주세요.');
        return;
    }
    
    if (newPassword !== newPasswordConfirm) {
        alert('새 비밀번호가 일치하지 않습니다.');
        return;
    }
    
    if (currentPassword === newPassword) {
        alert('현재 비밀번호와 새 비밀번호가 동일합니다.');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '변경 중...';
    
    try {
        const db = await initFirebase();
        if (!db) {
            throw new Error('Firebase 초기화 실패');
        }
        
        // 현재 비밀번호 확인
        const doc = await db.collection('members').doc(currentUser.docId).get();
        
        if (!doc.exists) {
            throw new Error('사용자 정보를 찾을 수 없습니다.');
        }
        
        const userData = doc.data();
        
        if (userData.password !== currentPassword) {
            alert('현재 비밀번호가 일치하지 않습니다.');
            submitBtn.disabled = false;
            submitBtn.textContent = '비밀번호 변경';
            return;
        }
        
        // 새 비밀번호로 업데이트
        await db.collection('members').doc(currentUser.docId).update({
            password: newPassword,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('비밀번호가 변경되었습니다.\n다시 로그인해주세요.');
        
        // 로그아웃 처리
        localStorage.removeItem('loginUser');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        alert('비밀번호 변경 중 오류가 발생했습니다.');
        submitBtn.disabled = false;
        submitBtn.textContent = '비밀번호 변경';
    }
}

// 회원탈퇴
async function withdrawMember() {
    if (!confirm('정말로 회원탈퇴 하시겠습니까?\n\n탈퇴 후에는 복구할 수 없습니다.')) {
        return;
    }
    
    const password = prompt('비밀번호를 입력해주세요:');
    
    if (!password) {
        return;
    }
    
    try {
        const db = await initFirebase();
        if (!db) {
            throw new Error('Firebase 초기화 실패');
        }
        
        // 비밀번호 확인
        const doc = await db.collection('members').doc(currentUser.docId).get();
        
        if (!doc.exists) {
            throw new Error('사용자 정보를 찾을 수 없습니다.');
        }
        
        const userData = doc.data();
        
        if (userData.password !== password) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        
        // 회원 상태를 '탈퇴'로 변경 (실제 삭제 대신)
        await db.collection('members').doc(currentUser.docId).update({
            status: '탈퇴',
            withdrawDate: new Date().toISOString().split('T')[0],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('회원탈퇴가 완료되었습니다.');
        
        // 로그아웃 처리
        localStorage.removeItem('loginUser');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('회원탈퇴 오류:', error);
        alert('회원탈퇴 중 오류가 발생했습니다.');
    }
}

// 전역으로 노출
window.showSection = showSection;
window.searchAddress = searchAddress;
window.withdrawMember = withdrawMember;

