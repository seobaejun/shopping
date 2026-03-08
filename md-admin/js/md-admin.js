// MD 관리자페이지 메인 로직
console.log('🔵 md-admin.js 로드됨');

// 전역 변수
let currentPage = 'dashboard';
let dashboardData = {
    totalMembers: 0,
    totalSales: 0,
    totalTokens: 0,
    averageSales: 0
};

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('MD 관리자페이지 초기화 시작');
    
    initializeEventListeners();
    initializePage();
    loadDashboardData();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    // 메뉴 토글
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('mdAdminSidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // 사이드바 네비게이션
    const navLinks = document.querySelectorAll('.sidebar-nav a[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            switchPage(page);
        });
    });
    
    // 로그아웃 버튼
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('로그아웃 하시겠습니까?')) {
                logout();
            }
        });
    }
    
    // 홈 버튼
    const homeBtn = document.querySelector('.btn-home');
    if (homeBtn) {
        homeBtn.addEventListener('click', function() {
            window.open('../index.html', '_blank');
        });
    }
    
    // 검색 폼 엔터키 처리
    const searchInputs = document.querySelectorAll('input[type="text"]');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const form = this.closest('.search-form');
                if (form) {
                    const searchBtn = form.querySelector('.btn-search');
                    if (searchBtn) {
                        searchBtn.click();
                    }
                }
            }
        });
    });
    
    console.log('이벤트 리스너 초기화 완료');
}

// 페이지 초기화
function initializePage() {
    // 현재 로그인한 MD 정보 또는 관리자 전체보기 표시
    const mdAdminName = document.getElementById('mdAdminName');
    if (mdAdminName) {
        if (sessionStorage.getItem('mdAdminFromAdmin') === 'true') {
            mdAdminName.textContent = '관리자 (전체보기)';
            return;
        }
        const mdAdminData = localStorage.getItem('mdAdminData');
        if (mdAdminData) {
            try {
                const mdData = JSON.parse(mdAdminData);
                mdAdminName.textContent = `${mdData.userName || 'MD관리자'} (${mdData.mdCode}) 님 로그인 중`;
            } catch (e) {
                mdAdminName.textContent = 'MD관리자 님 로그인 중';
            }
        } else {
            mdAdminName.textContent = 'MD관리자 님 로그인 중';
        }
    }
    
    // 기본 페이지 활성화
    switchPage('dashboard');
    
    // 날짜 입력 필드 기본값 설정
    setDefaultDates();
    
    console.log('페이지 초기화 완료');
}

// 페이지 전환
function switchPage(pageId) {
    console.log('페이지 전환:', currentPage, '->', pageId);
    
    // 모든 페이지 숨기기
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // 모든 네비게이션 비활성화
    const navItems = document.querySelectorAll('.nav-list li');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // 선택된 페이지 활성화
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 선택된 네비게이션 활성화
    const targetNav = document.querySelector(`a[data-page="${pageId}"]`);
    if (targetNav) {
        targetNav.parentElement.classList.add('active');
    }
    
    // 페이지별 초기화 작업
    currentPage = pageId;
    
    switch (pageId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'sales-search':
            // 검색 페이지는 별도 초기화 불필요
            break;
        case 'member-sales':
            // 회원별 매출 페이지는 별도 초기화 불필요
            break;
        case 'referral-members':
            loadReferralMembers();
            break;
        case 'member-detail':
            // 회원 상세 페이지는 별도 초기화 불필요
            break;
        case 'member-search':
            if (typeof window.loadAllMembers === 'function') {
                window.loadAllMembers();
            }
            break;
        case 'member-purchase':
            // 검색 버튼 등은 member-purchase.js에서 바인딩
            break;
    }
}

// 대시보드 데이터 로드
async function loadDashboardData() {
    try {
        console.log('대시보드 데이터 로드 시작');
        
        // 로딩 표시
        updateDashboardCards({
            totalMembers: '로딩중...',
            totalSales: '로딩중...',
            totalTokens: '로딩중...',
            averageSales: '로딩중...'
        });
        
        // 현재 MD가 조회 가능한 모든 회원 데이터 조회
        const members = await window.mdFirebase.getAllowedMembers();
        
        if (members.length > 0) {
            const memberIds = members.map(m => m.userId || m.id);
            const orders = await window.mdFirebase.getOrdersByMembers(memberIds);
            
            // 통계 계산
            dashboardData = window.mdFirebase.calculateSalesStats(members, orders);
        } else {
            dashboardData = {
                totalMembers: 0,
                totalSales: 0,
                totalTokens: 0,
                averageSales: 0
            };
        }
        
        // 대시보드 업데이트
        updateDashboardCards(dashboardData);
        
        console.log('대시보드 데이터 로드 완료:', dashboardData);
        
    } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
        
        // 에러 표시
        updateDashboardCards({
            totalMembers: '권한 없음',
            totalSales: '권한 없음',
            totalTokens: '권한 없음',
            averageSales: '권한 없음'
        });
        
        // 권한 오류인 경우 로그인 페이지로 리다이렉트
        if (error.message.includes('권한') || error.message.includes('로그인')) {
            setTimeout(() => {
                alert('권한이 없습니다. 다시 로그인해주세요.');
                window.location.href = 'login.html';
            }, 2000);
        }
    }
}

// 대시보드 카드 업데이트
function updateDashboardCards(data) {
    const elements = {
        totalMembers: document.getElementById('totalMembers'),
        totalSales: document.getElementById('totalSales'),
        totalTokens: document.getElementById('totalTokens'),
        averageSales: document.getElementById('averageSales')
    };
    
    if (elements.totalMembers) {
        elements.totalMembers.textContent = typeof data.totalMembers === 'number' 
            ? data.totalMembers + '명' 
            : data.totalMembers;
    }
    
    if (elements.totalSales) {
        elements.totalSales.textContent = typeof data.totalSales === 'number' 
            ? window.mdFirebase.formatCurrency(data.totalSales) 
            : data.totalSales;
    }
    
    if (elements.totalTokens) {
        elements.totalTokens.textContent = typeof data.totalTokens === 'number' 
            ? window.mdFirebase.formatTrix(data.totalTokens) + ' trix' 
            : data.totalTokens;
    }
    
    if (elements.averageSales) {
        elements.averageSales.textContent = typeof data.averageSales === 'number' 
            ? window.mdFirebase.formatCurrency(data.averageSales) 
            : data.averageSales;
    }
}

// 추천 회원 목록 로드 (래퍼 함수)
async function loadReferralMembers() {
    if (window.mdSales && window.mdSales.loadReferralMembers) {
        await window.mdSales.loadReferralMembers();
    } else {
        console.error('mdSales.loadReferralMembers 함수를 찾을 수 없습니다.');
    }
}

// 기본 날짜 설정
function setDefaultDates() {
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.value = oneMonthAgo.toISOString().split('T')[0];
    }
    
    if (endDateInput) {
        endDateInput.value = today.toISOString().split('T')[0];
    }
}

// 로그아웃
function logout() {
    var fromAdmin = sessionStorage.getItem('mdAdminFromAdmin') === 'true';
    sessionStorage.removeItem('mdAdminFromAdmin');
    localStorage.removeItem('isMdAdmin');
    localStorage.removeItem('mdAdminData');
    localStorage.removeItem('currentMdCode');
    if (fromAdmin) {
        window.location.replace('../admin/index.html');
    } else {
        window.location.replace('login.html');
    }
}

// 전역 함수들 (HTML에서 직접 호출)
window.searchMdSales = function() {
    if (window.mdSales && window.mdSales.searchMdSales) {
        window.mdSales.searchMdSales();
    } else {
        console.error('mdSales.searchMdSales 함수를 찾을 수 없습니다.');
    }
};

window.searchMemberDetail = function() {
    if (window.mdSales && window.mdSales.searchMemberDetail) {
        window.mdSales.searchMemberDetail();
    } else {
        console.error('mdSales.searchMemberDetail 함수를 찾을 수 없습니다.');
    }
};

window.searchDetailMember = function() {
    if (window.mdSales && window.mdSales.searchDetailMember) {
        window.mdSales.searchDetailMember();
    } else {
        console.error('mdSales.searchDetailMember 함수를 찾을 수 없습니다.');
    }
};

window.viewMemberDetail = function(memberId) {
    if (window.mdSales && window.mdSales.viewMemberDetail) {
        window.mdSales.viewMemberDetail(memberId);
    } else {
        console.error('mdSales.viewMemberDetail 함수를 찾을 수 없습니다.');
    }
};

// 유틸리티 함수들
window.mdAdmin = {
    switchPage,
    loadDashboardData,
    updateDashboardCards,
    logout,
    setDefaultDates
};

console.log('MD 관리자페이지 초기화 완료');



