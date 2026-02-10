// 마이페이지 JavaScript

// Firebase 초기화 대기
async function initFirebase() {
    return new Promise((resolve) => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            resolve(firebase.firestore());
        } else {
            setTimeout(() => {
                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    resolve(firebase.firestore());
                } else {
                    console.error('Firebase가 로드되지 않았습니다.');
                    resolve(null);
                }
            }, 1000);
        }
    });
}

// 페이지 초기화
document.addEventListener('DOMContentLoaded', async () => {
    console.log('마이페이지 로드 시작');

    // 로그인 상태 확인 (script.js와 동일한 키 사용)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginUserData = localStorage.getItem('loginUser');
    
    console.log('로그인 상태:', isLoggedIn);
    console.log('로그인 사용자 데이터:', loginUserData);
    
    if (!isLoggedIn || !loginUserData) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(loginUserData);
    console.log('로그인 사용자:', user);

    // 사용자 정보 표시
    displayUserInfo(user);

    // 로그인 상태 업데이트 (script.js가 로드될 때까지 대기)
    let retryCount = 0;
    const maxRetries = 10;
    
    const updateHeaderInterval = setInterval(() => {
        if (typeof updateHeaderForLoginStatus === 'function') {
            console.log('✅ updateHeaderForLoginStatus 함수 찾음');
            updateHeaderForLoginStatus();
            clearInterval(updateHeaderInterval);
        } else {
            retryCount++;
            console.log(`⏳ updateHeaderForLoginStatus 대기 중... (${retryCount}/${maxRetries})`);
            
            if (retryCount >= maxRetries) {
                console.error('❌ updateHeaderForLoginStatus 함수를 찾을 수 없습니다.');
                clearInterval(updateHeaderInterval);
            }
        }
    }, 100);
});

// 사용자 정보 표시
function displayUserInfo(user) {
    console.log('사용자 정보 표시:', user);
    
    // 사용자 이름 표시
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        if (user.name) {
            userNameElement.textContent = user.name;
        } else if (user.userId) {
            userNameElement.textContent = user.userId;
        } else if (user.email) {
            userNameElement.textContent = user.email.split('@')[0];
        } else {
            userNameElement.textContent = '사용자';
        }
        console.log('✅ 사용자 이름 표시:', userNameElement.textContent);
    }

    // 쇼핑지원금 표시 (현재는 0원, 추후 Firestore에서 가져올 예정)
    const currentSupportElement = document.getElementById('currentSupport');
    const totalSupportElement = document.getElementById('totalSupport');
    
    if (currentSupportElement) {
        currentSupportElement.textContent = '0원';
    }
    
    if (totalSupportElement) {
        totalSupportElement.textContent = '0원';
    }
}

// 섹션 전환 함수
function showSection(sectionName) {
    console.log('섹션 전환:', sectionName);
    
    // 모든 네비게이션 링크에서 active 클래스 제거
    const navLinks = document.querySelectorAll('.nav-group a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // 클릭한 네비게이션 링크에 active 클래스 추가
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // 추후 구현: 해당 섹션의 콘텐츠 표시
    alert(`${sectionName} 기능은 추후 구현 예정입니다.`);
}

// 전역 함수로 노출
window.showSection = showSection;
