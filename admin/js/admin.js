// 관리자 페이지 JavaScript

// DOM 요소
const menuToggle = document.getElementById('menuToggle');
const adminSidebar = document.getElementById('adminSidebar');
const navLinks = document.querySelectorAll('.nav-list a');
const contentPages = document.querySelectorAll('.content-page');

// 사이드바 토글
menuToggle.addEventListener('click', () => {
    adminSidebar.classList.toggle('open');
});

// 페이지 전환
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetPage = link.dataset.page;
        
        // 모든 페이지 숨기기
        contentPages.forEach(page => {
            page.classList.remove('active');
        });
        
        // 선택한 페이지 표시
        const targetElement = document.getElementById(targetPage);
        if (targetElement) {
            targetElement.classList.add('active');
        }
        
        // 네비게이션 활성 상태 변경
        document.querySelectorAll('.nav-list li').forEach(li => {
            li.classList.remove('active');
        });
        link.parentElement.classList.add('active');
        
        // 모바일에서 사이드바 닫기
        if (window.innerWidth <= 1024) {
            adminSidebar.classList.remove('open');
        }
    });
});

// 검색 기능
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');

if (searchBtn) {
    searchBtn.addEventListener('click', () => {
        // 검색 로직 구현
        alert('검색 기능은 서버 연동 후 구현됩니다.');
    });
}

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        // 폼 초기화
        document.querySelectorAll('.form-control').forEach(input => {
            if (input.type === 'text' || input.type === 'date') {
                input.value = '';
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            }
        });
    });
}

if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        // 엑셀 다운로드 로직
        alert('엑셀 다운로드 기능은 서버 연동 후 구현됩니다.');
    });
}

// 테이블 편집/삭제 버튼
document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-edit')) {
        const row = e.target.closest('tr');
        const userId = row.cells[1].textContent;
        alert(`${userId} 회원 정보를 수정합니다.`);
        // 수정 모달 열기 등
    }
    
    if (e.target.closest('.btn-delete')) {
        const row = e.target.closest('tr');
        const userId = row.cells[1].textContent;
        if (confirm(`${userId} 회원을 삭제하시겠습니까?`)) {
            // 삭제 로직
            alert('삭제되었습니다.');
        }
    }
});

// 페이지네이션
const pageNums = document.querySelectorAll('.page-num');
pageNums.forEach(btn => {
    btn.addEventListener('click', () => {
        pageNums.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 페이지 데이터 로드
        const pageNumber = btn.textContent;
        loadPageData(pageNumber);
    });
});

function loadPageData(pageNumber) {
    console.log(`Loading page ${pageNumber}`);
    // 서버에서 데이터 로드
}

// 반응형 처리
window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
        adminSidebar.classList.remove('open');
    }
});

// 외부 클릭 시 사이드바 닫기 (모바일)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
        if (!adminSidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            adminSidebar.classList.remove('open');
        }
    }
});

// 로그아웃
const logoutBtn = document.querySelector('.btn-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            // 로그아웃 처리
            window.location.href = '../index.html';
        }
    });
}

// 홈 버튼
const homeBtn = document.querySelector('.btn-home');
if (homeBtn) {
    homeBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
    });
}

// MD관리자 버튼
const mdAdminBtn = document.querySelector('.btn-md-admin');
if (mdAdminBtn) {
    mdAdminBtn.addEventListener('click', () => {
        alert('MD관리자 페이지로 이동합니다.');
        // window.location.href = 'md-admin.html';
    });
}

// 설정 버튼
const settingsBtn = document.querySelector('.btn-settings');
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        alert('설정 페이지로 이동합니다.');
    });
}

// ============================================
// 회원 데이터 (샘플)
// ============================================
const MEMBER_DATA = [
    { id: 1, userId: 'user001', name: '김철수', phone: '010-1234-5678', joinDate: '2025-12-01', recommender: '관리자', status: '정상' },
    { id: 2, userId: 'user002', name: '이영희', phone: '010-2345-6789', joinDate: '2025-12-05', recommender: 'user001', status: '정상' },
    { id: 3, userId: 'user003', name: '박민수', phone: '010-3456-7890', joinDate: '2025-12-10', recommender: 'user001', status: '정상' },
    { id: 4, userId: 'user004', name: '최지은', phone: '010-4567-8901', joinDate: '2025-12-15', recommender: 'user002', status: '정지' },
    { id: 5, userId: 'user005', name: '정태양', phone: '010-5678-9012', joinDate: '2025-12-20', recommender: '관리자', status: '정상' },
    { id: 6, userId: 'user006', name: '강민지', phone: '010-6789-0123', joinDate: '2026-01-05', recommender: 'user003', status: '정상' },
    { id: 7, userId: 'user007', name: '윤서준', phone: '010-7890-1234', joinDate: '2026-01-10', recommender: 'user005', status: '정상' },
    { id: 8, userId: 'user008', name: '임하늘', phone: '010-8901-2345', joinDate: '2026-01-15', recommender: 'user002', status: '정상' },
];

// ============================================
// 회원조회 기능
// ============================================
function searchMembers() {
    const searchId = document.getElementById('searchId')?.value.toLowerCase() || '';
    const searchName = document.getElementById('searchName')?.value.toLowerCase() || '';
    const searchPhone = document.getElementById('searchPhone')?.value || '';

    const filtered = MEMBER_DATA.filter(member => {
        const matchId = !searchId || member.userId.toLowerCase().includes(searchId);
        const matchName = !searchName || member.name.includes(searchName);
        const matchPhone = !searchPhone || member.phone.includes(searchPhone);
        return matchId && matchName && matchPhone;
    });

    renderMemberTable(filtered);
}

function resetSearch() {
    document.getElementById('searchId').value = '';
    document.getElementById('searchName').value = '';
    document.getElementById('searchPhone').value = '';
    renderMemberTable(MEMBER_DATA);
}

function renderMemberTable(data) {
    const tbody = document.getElementById('memberSearchBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-message">검색 결과가 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(member => `
        <tr>
            <td>${member.id}</td>
            <td>${member.userId}</td>
            <td>${member.name}</td>
            <td>${member.phone}</td>
            <td>${member.joinDate}</td>
            <td>${member.recommender}</td>
            <td><span class="badge ${member.status === '정상' ? 'badge-success' : 'badge-danger'}">${member.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editMember('${member.userId}')">수정</button>
                <button class="btn btn-sm btn-secondary" onclick="deleteMember('${member.userId}')">삭제</button>
            </td>
        </tr>
    `).join('');
}

function editMember(userId) {
    alert(`${userId} 회원 정보를 수정합니다.\n(서버 연동 후 구현)`);
}

function deleteMember(userId) {
    if (confirm(`${userId} 회원을 삭제하시겠습니까?`)) {
        alert('삭제되었습니다.\n(서버 연동 후 구현)');
    }
}

// ============================================
// 개인별 구매 누적정보 기능
// ============================================
const PURCHASE_DATA = [
    { id: 1, name: '김철수', date: '2026-01-15', product: '메가커피 모바일금액권 3만원', price: 30000, support: 1500 },
    { id: 2, name: '이영희', date: '2026-01-18', product: '스타벅스 아메리카노 Tall', price: 4500, support: 225 },
    { id: 3, name: '박민수', date: '2026-01-20', product: '배스킨라빈스 파인트', price: 15000, support: 750 },
];

function searchPurchase() {
    const name = document.getElementById('purchaseName')?.value || '';
    const startDate = document.getElementById('purchaseStartDate')?.value || '';
    const endDate = document.getElementById('purchaseEndDate')?.value || '';

    const filtered = PURCHASE_DATA.filter(item => {
        const matchName = !name || item.name.includes(name);
        const matchDate = (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate);
        return matchName && matchDate;
    });

    renderPurchaseTable(filtered);
}

function resetPurchase() {
    document.getElementById('purchaseName').value = '';
    document.getElementById('purchaseStartDate').value = '2025-12-04';
    document.getElementById('purchaseEndDate').value = '2026-02-02';
    renderPurchaseTable([]);
}

function renderPurchaseTable(data) {
    const tbody = document.getElementById('purchaseTableBody');
    if (!tbody) return;

    const totalPrice = data.reduce((sum, item) => sum + item.price, 0);
    const totalSupport = data.reduce((sum, item) => sum + item.support, 0);

    // 누계 정보 업데이트
    const statsTable = document.querySelector('.stats-table tbody');
    if (statsTable) {
        statsTable.innerHTML = `
            <tr>
                <td>${data.length}</td>
                <td>${totalPrice.toLocaleString()}원</td>
                <td>${totalSupport.toLocaleString()}원</td>
            </tr>
        `;
    }

    // 검색 결과 메시지
    const emptyMsg = document.querySelector('#member-purchase .empty-message');
    if (emptyMsg) {
        emptyMsg.textContent = `총 ${data.length} 명의 회원이 검색되었습니다.`;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">검색 결과가 없습니다.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.date}</td>
            <td>${item.product}</td>
            <td>${item.price.toLocaleString()}원</td>
            <td>${item.support.toLocaleString()}원</td>
        </tr>
    `).join('');
}

// ============================================
// ============================================
// 대시보드 빠른 작업 네비게이션
// ============================================
function navigateToPage(pageId) {
    // 모든 페이지 숨기기
    contentPages.forEach(page => {
        page.classList.remove('active');
    });
    
    // 선택한 페이지 표시
    const targetElement = document.getElementById(pageId);
    if (targetElement) {
        targetElement.classList.add('active');
    }
    
    // 네비게이션 활성 상태 변경
    document.querySelectorAll('.nav-list li').forEach(li => {
        li.classList.remove('active');
    });
    
    // 해당 메뉴 활성화
    const menuLink = document.querySelector(`[data-page="${pageId}"]`);
    if (menuLink) {
        menuLink.parentElement.classList.add('active');
    }
}

// ============================================
// 게시판 탭 전환
// ============================================
function switchBoardTab(boardType) {
    // 모든 탭 비활성화
    document.querySelectorAll('.board-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 클릭한 탭 활성화
    event.target.classList.add('active');
    
    // 게시판 데이터 로드 (서버 연동 시 구현)
    console.log(`${boardType} 게시판 로드`);
}

// ============================================
// 패널 링크 클릭 이벤트
// ============================================
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('panel-link')) {
        e.preventDefault();
        const pageId = e.target.dataset.page;
        if (pageId) {
            navigateToPage(pageId);
        }
    }
});

// ============================================
// ============================================
// 상품 데이터 (샘플)
// ============================================
const PRODUCT_DATA = [
    { id: 1, name: '메가커피 모바일금액권 3만원', category: 'coffee', price: 30000, stock: 999, status: 'sale', image: 'https://via.placeholder.com/80/FF6B6B/FFFFFF?text=커피', date: '2026-01-15' },
    { id: 2, name: '스타벅스 아메리카노 Tall', category: 'coffee', price: 4500, stock: 999, status: 'sale', image: 'https://via.placeholder.com/80/4ECDC4/FFFFFF?text=스벅', date: '2026-01-18' },
    { id: 3, name: '배스킨라빈스 파인트 아이스크림', category: 'food', price: 15000, stock: 50, status: 'sale', image: 'https://via.placeholder.com/80/FFD93D/000000?text=아이스크림', date: '2026-01-20' },
    { id: 4, name: 'CU 편의점 모바일상품권 1만원', category: 'life', price: 10000, stock: 999, status: 'sale', image: 'https://via.placeholder.com/80/6BCB77/FFFFFF?text=CU', date: '2026-01-22' },
    { id: 5, name: 'GS25 모바일상품권 1만원', category: 'life', price: 10000, stock: 999, status: 'sale', image: 'https://via.placeholder.com/80/4D96FF/FFFFFF?text=GS25', date: '2026-01-25' },
    { id: 6, name: '설화수 윤조에센스 60ml', category: 'beauty', price: 85000, stock: 20, status: 'sale', image: 'https://via.placeholder.com/80/FF6BA9/FFFFFF?text=뷰티', date: '2026-01-28' },
    { id: 7, name: '나이키 에어포스 운동화', category: 'fashion', price: 129000, stock: 0, status: 'soldout', image: 'https://via.placeholder.com/80/95E1D3/000000?text=신발', date: '2026-02-01' },
    { id: 8, name: '다이슨 헤어드라이어', category: 'beauty', price: 450000, stock: 5, status: 'sale', image: 'https://via.placeholder.com/80/F38181/FFFFFF?text=가전', date: '2026-02-02' },
];

// ============================================
// 상품 목록 조회
// ============================================
function searchProducts() {
    const name = document.getElementById('productSearchName')?.value.toLowerCase() || '';
    const category = document.getElementById('productSearchCategory')?.value || '';
    const status = document.getElementById('productSearchStatus')?.value || '';

    const filtered = PRODUCT_DATA.filter(product => {
        const matchName = !name || product.name.toLowerCase().includes(name);
        const matchCategory = !category || product.category === category;
        const matchStatus = !status || product.status === status;
        return matchName && matchCategory && matchStatus;
    });

    renderProductTable(filtered);
}

function resetProductSearch() {
    document.getElementById('productSearchName').value = '';
    document.getElementById('productSearchCategory').value = '';
    document.getElementById('productSearchStatus').value = '';
    renderProductTable(PRODUCT_DATA);
}

function renderProductTable(data) {
    const tbody = document.getElementById('productListBody');
    const countEl = document.getElementById('productCount');
    
    if (!tbody) return;

    if (countEl) {
        countEl.textContent = data.length;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">검색 결과가 없습니다.</td></tr>';
        return;
    }

    const statusMap = {
        sale: { text: '판매중', class: 'badge-success' },
        soldout: { text: '품절', class: 'badge-danger' },
        hidden: { text: '숨김', class: 'badge-warning' }
    };

    const categoryMap = {
        coffee: '커피/음료',
        food: '식품',
        beauty: '뷰티',
        life: '생활용품',
        fashion: '패션'
    };

    tbody.innerHTML = data.map(product => `
        <tr>
            <td>${product.id}</td>
            <td><img src="${product.image}" alt="${product.name}" class="product-image"></td>
            <td style="text-align: left; padding-left: 15px;">${product.name}</td>
            <td>${categoryMap[product.category] || product.category}</td>
            <td>${product.price.toLocaleString()}원</td>
            <td>${product.stock}</td>
            <td><span class="badge ${statusMap[product.status].class}">${statusMap[product.status].text}</span></td>
            <td>${product.date}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})">수정</button>
                <button class="btn btn-sm btn-secondary" onclick="deleteProduct(${product.id})">삭제</button>
            </td>
        </tr>
    `).join('');
}

function editProduct(id) {
    alert(`상품 ID ${id} 수정 기능\n(서버 연동 후 구현)`);
}

function deleteProduct(id) {
    if (confirm('정말 삭제하시겠습니까?')) {
        alert(`상품 ID ${id} 삭제됨\n(서버 연동 후 구현)`);
    }
}

// ============================================
// 상품 등록
// ============================================
function registerProduct(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    console.log('상품 등록 데이터:', data);
    alert('상품이 등록되었습니다!\n(서버 연동 후 실제 저장)');
    
    // 상품 목록으로 이동
    navigateToPage('product-list');
}

// ============================================
// 카테고리 관리
// ============================================
function showAddCategoryForm() {
    resetCategoryForm();
}

function editCategory(id) {
    alert(`카테고리 ID ${id} 수정\n(서버 연동 후 구현)`);
}

function deleteCategory(id) {
    if (confirm('카테고리를 삭제하시겠습니까?\n해당 카테고리의 상품도 함께 삭제됩니다.')) {
        alert(`카테고리 ID ${id} 삭제됨\n(서버 연동 후 구현)`);
    }
}

function saveCategory(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    console.log('카테고리 저장 데이터:', data);
    alert('카테고리가 저장되었습니다!\n(서버 연동 후 실제 저장)');
    
    resetCategoryForm();
}

function resetCategoryForm() {
    const form = document.getElementById('categoryForm');
    if (form) {
        form.reset();
        // 아이콘 버튼 초기화
        document.querySelectorAll('.icon-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.icon-btn').classList.add('active');
    }
}

// 아이콘 선택
document.addEventListener('click', (e) => {
    if (e.target.closest('.icon-btn')) {
        const btn = e.target.closest('.icon-btn');
        document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
});

// ============================================
// ============================================
// 추첨 시스템
// ============================================

// 추첨 대기 데이터 (샘플)
const LOTTERY_WAITING_DATA = {
    'product-1': [ // 메가커피 30,000원
        { id: 1, name: '김철수', phone: '010-1234-5678', amount: 30000, support: 1500, confirmed: true, date: '2026-02-04 09:30' },
        { id: 2, name: '이영희', phone: '010-2345-6789', amount: 30000, support: 1500, confirmed: true, date: '2026-02-04 10:15' },
        { id: 3, name: '박민수', phone: '010-3456-7890', amount: 30000, support: 1500, confirmed: true, date: '2026-02-04 11:20' },
        { id: 4, name: '최지은', phone: '010-4567-8901', amount: 30000, support: 1500, confirmed: true, date: '2026-02-04 13:45' },
        { id: 5, name: '정태양', phone: '010-5678-9012', amount: 30000, support: 1500, confirmed: true, date: '2026-02-04 14:30' },
        { id: 6, name: '강민지', phone: '010-6789-0123', amount: 30000, support: 1500, confirmed: true, date: '2026-02-04 15:10' },
        { id: 7, name: '윤서준', phone: '010-7890-1234', amount: 30000, support: 1500, confirmed: true, date: '2026-02-04 16:00' },
        { id: 8, name: '임하늘', phone: '010-8901-2345', amount: 30000, support: 1500, confirmed: true, date: '2026-02-04 16:45' },
        { id: 9, name: '한별', phone: '010-9012-3456', amount: 30000, support: 1500, confirmed: true, date: '2026-02-04 17:20' },
        { id: 10, name: '송하나', phone: '010-0123-4567', amount: 30000, support: 1500, confirmed: true, date: '2026-02-04 18:00' },
    ],
    'product-2': [ // 스타벅스 4,500원
        { id: 11, name: '오민석', phone: '010-1111-2222', amount: 4500, support: 225, confirmed: true, date: '2026-02-04 09:00' },
        { id: 12, name: '신예진', phone: '010-2222-3333', amount: 4500, support: 225, confirmed: true, date: '2026-02-04 10:00' },
        { id: 13, name: '조현우', phone: '010-3333-4444', amount: 4500, support: 225, confirmed: true, date: '2026-02-04 11:00' },
        { id: 14, name: '배수지', phone: '010-4444-5555', amount: 4500, support: 225, confirmed: true, date: '2026-02-04 12:00' },
        { id: 15, name: '나준호', phone: '010-5555-6666', amount: 4500, support: 225, confirmed: true, date: '2026-02-04 13:00' },
    ]
};

let selectedProductId = null;
let currentRound = 1;

// 추첨 현황 카드 렌더링
function renderLotteryStatus() {
    const container = document.querySelector('.lottery-status-grid');
    if (!container) return;

    const products = [
        { id: 'product-1', name: '메가커피 모바일금액권 3만원', price: 30000, support: 1500, waiting: LOTTERY_WAITING_DATA['product-1']?.length || 0 },
        { id: 'product-2', name: '스타벅스 아메리카노 Tall', price: 4500, support: 225, waiting: LOTTERY_WAITING_DATA['product-2']?.length || 0 },
        { id: 'product-3', name: '배스킨라빈스 파인트', price: 15000, support: 750, waiting: 0 },
    ];

    container.innerHTML = products.map(product => {
        const groupSize = parseInt(document.getElementById('groupSize')?.value || 10);
        const canDraw = product.waiting >= groupSize;
        const progress = Math.min((product.waiting / groupSize) * 100, 100);

        return `
            <div class="lottery-product-card ${selectedProductId === product.id ? 'selected' : ''}" 
                 onclick="selectProduct('${product.id}')">
                <div class="product-card-header">
                    <h4 class="product-card-title">${product.name}</h4>
                    <div class="product-card-price">${product.price.toLocaleString()}원</div>
                </div>
                <div class="product-card-info">
                    <div class="info-row">
                        <span class="info-label">대기 인원</span>
                        <span class="info-value ${canDraw ? 'highlight' : 'ready'}">${product.waiting}명 / ${groupSize}명</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">진행률</span>
                        <span class="info-value">${progress.toFixed(0)}%</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">지원금</span>
                        <span class="info-value">${product.support.toLocaleString()}원</span>
                    </div>
                    ${canDraw ? '<div class="info-row"><span class="badge badge-success">추첨 가능</span></div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 상품 선택
function selectProduct(productId) {
    selectedProductId = productId;
    renderLotteryStatus();
    renderWaitingList(productId);
    
    const waitingData = LOTTERY_WAITING_DATA[productId] || [];
    const groupSize = parseInt(document.getElementById('groupSize')?.value || 10);
    const canDraw = waitingData.length >= groupSize;
    
    document.getElementById('executeLotteryBtn').disabled = !canDraw;
}

// 대기자 목록 렌더링
function renderWaitingList(productId) {
    const tbody = document.getElementById('lotteryWaitingList');
    const productNameEl = document.getElementById('selectedProductName');
    const countEl = document.getElementById('waitingCount');
    
    if (!tbody) return;

    const waitingData = LOTTERY_WAITING_DATA[productId] || [];
    
    if (waitingData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-message">대기 중인 참가자가 없습니다.</td></tr>';
        if (productNameEl) productNameEl.textContent = '대기자 없음';
        if (countEl) countEl.textContent = '0명';
        return;
    }

    const products = {
        'product-1': '메가커피 모바일금액권 3만원',
        'product-2': '스타벅스 아메리카노 Tall',
        'product-3': '배스킨라빈스 파인트',
    };

    if (productNameEl) productNameEl.textContent = products[productId];
    if (countEl) countEl.textContent = `${waitingData.length}명 대기`;

    tbody.innerHTML = waitingData.map((person, index) => `
        <tr>
            <td><input type="checkbox" class="person-select" data-id="${person.id}"></td>
            <td>${index + 1}</td>
            <td>${person.name}</td>
            <td>${person.phone}</td>
            <td>${person.amount.toLocaleString()}원</td>
            <td>${person.support.toLocaleString()}원</td>
            <td><span class="badge badge-success">확인완료</span></td>
            <td>${person.date}</td>
        </tr>
    `).join('');
}

// 전체 선택 토글
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.person-select');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
}

// 자동 모드 토글
function toggleAutoMode() {
    const autoMode = document.getElementById('autoLotteryMode').checked;
    if (autoMode) {
        alert('자동 추첨 모드가 활성화되었습니다.\n10명 달성 시 자동으로 추첨이 실행됩니다.');
    }
}

// 추첨 실행
function executeLottery() {
    if (!selectedProductId) {
        alert('상품을 선택해주세요.');
        return;
    }

    const waitingData = LOTTERY_WAITING_DATA[selectedProductId] || [];
    const groupSize = parseInt(document.getElementById('groupSize').value);
    const winnerCount = parseInt(document.getElementById('winnerCount').value);

    if (waitingData.length < groupSize) {
        if (!confirm(`현재 ${waitingData.length}명만 대기 중입니다.\n${groupSize}명 미만으로 추첨하시겠습니까?`)) {
            return;
        }
    }

    // 참가자 목록
    const participants = waitingData.slice(0, groupSize);
    
    // 랜덤 추첨 (암호학적 난수 사용 시뮬레이션)
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, winnerCount);
    const losers = shuffled.slice(winnerCount);

    // 지원금 계산
    const winnersSupport = winners.reduce((sum, w) => sum + w.support, 0);
    const losersTotal = losers.reduce((sum, l) => sum + l.amount, 0);
    
    losers.forEach(loser => {
        // 공식: (당첨자 지원금 합계 / 미선정자 총 구매금) × 나의 구매금
        const supportAmount = (winnersSupport / losersTotal) * loser.amount;
        // 10원 단위 절삭
        loser.calculatedSupport = Math.floor(supportAmount / 10) * 10;
    });

    // 결과 표시
    showLotteryResult(winners, losers, participants.length);
}

// 추첨 결과 표시
function showLotteryResult(winners, losers, totalCount) {
    const modal = document.getElementById('lotteryResultModal');
    const winnersListEl = document.getElementById('winnersList');
    const losersListEl = document.getElementById('losersList');
    
    // 당첨자 렌더링 (지원금 없음)
    winnersListEl.innerHTML = winners.map(w => `
        <div class="result-person winner">
            <div class="person-name">🎉 ${w.name}</div>
            <div class="person-phone">${w.phone}</div>
            <div class="person-amount">구매 확정: ${w.amount.toLocaleString()}원</div>
            <div class="person-support" style="color: #999;">지원금: 없음</div>
        </div>
    `).join('');

    // 미선정자 렌더링
    losersListEl.innerHTML = losers.map(l => `
        <div class="result-person loser">
            <div class="person-name">💰 ${l.name}</div>
            <div class="person-phone">${l.phone}</div>
            <div class="person-amount">구매금: ${l.amount.toLocaleString()}원</div>
            <div class="person-support">지원금: ${l.calculatedSupport.toLocaleString()}원</div>
        </div>
    `).join('');

    // 요약 정보
    const totalSupport = losers.reduce((sum, l) => sum + l.calculatedSupport, 0);
    document.getElementById('resultRound').textContent = `${currentRound}회차`;
    document.getElementById('resultTotal').textContent = totalCount;
    document.getElementById('resultWinners').textContent = winners.length;
    document.getElementById('resultSupport').textContent = totalSupport.toLocaleString();

    modal.style.display = 'flex';
}

// 추첨 결과 닫기
function closeLotteryResult() {
    document.getElementById('lotteryResultModal').style.display = 'none';
}

// 추첨 확정 결과 저장소
let LOTTERY_CONFIRMED_RESULTS = [];

// 추첨 결과 확정
function confirmLotteryResult() {
    const winnersListEl = document.getElementById('winnersList');
    const losersListEl = document.getElementById('losersList');
    
    if (!winnersListEl || !losersListEl) return;
    
    // 현재 결과 데이터 추출
    const winners = Array.from(winnersListEl.querySelectorAll('.result-person')).map((el, index) => {
        const name = el.querySelector('.person-name').textContent.replace('🎉 ', '');
        const phone = el.querySelector('.person-phone').textContent;
        const amountText = el.querySelector('.person-amount').textContent.replace('구매 확정: ', '').replace('원', '').replace(/,/g, '');
        
        return {
            id: Date.now() + index,
            round: currentRound,
            productId: selectedProductId,
            productName: getProductName(selectedProductId),
            name: name,
            phone: phone,
            amount: parseInt(amountText),
            result: 'winner',
            support: 0, // 당첨자는 지원금 없음
            paymentStatus: 'completed', // 당첨자는 지급 완료 상태
            date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
        };
    });
    
    const losers = Array.from(losersListEl.querySelectorAll('.result-person')).map((el, index) => {
        const name = el.querySelector('.person-name').textContent.replace('💰 ', '');
        const phone = el.querySelector('.person-phone').textContent;
        const amountText = el.querySelector('.person-amount').textContent.replace('구매금: ', '').replace('원', '').replace(/,/g, '');
        const supportText = el.querySelector('.person-support').textContent.replace('지원금: ', '').replace('원', '').replace(/,/g, '');
        
        return {
            id: Date.now() + winners.length + index,
            round: currentRound,
            productId: selectedProductId,
            productName: getProductName(selectedProductId),
            name: name,
            phone: phone,
            amount: parseInt(amountText),
            result: 'loser',
            support: parseInt(supportText),
            paymentStatus: 'pending',
            date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
        };
    });
    
    // 확정 결과에 추가
    LOTTERY_CONFIRMED_RESULTS.push(...winners, ...losers);
    
    alert(`추첨 결과가 확정되었습니다!\n\n회차: ${currentRound}회\n당첨: ${winners.length}명\n미선정: ${losers.length}명\n총 지원금: ${losers.reduce((sum, l) => sum + l.support, 0).toLocaleString()}원\n\n※ 지원금은 당일 일괄 지급됩니다.`);
    
    // 대기 목록에서 제거
    if (selectedProductId && LOTTERY_WAITING_DATA[selectedProductId]) {
        const groupSize = parseInt(document.getElementById('groupSize').value);
        LOTTERY_WAITING_DATA[selectedProductId].splice(0, groupSize);
    }
    
    currentRound++;
    closeLotteryResult();
    renderLotteryStatus();
    if (selectedProductId) {
        renderWaitingList(selectedProductId);
    }
    
    // 확정 현황 페이지 업데이트
    updateConfirmPage();
}

// 상품명 가져오기
function getProductName(productId) {
    const productNames = {
        'product-1': '메가커피 모바일금액권 3만원',
        'product-2': '스타벅스 아메리카노 Tall',
        'product-3': '배스킨라빈스 파인트'
    };
    return productNames[productId] || '알 수 없는 상품';
}

// ============================================
// 조별 추첨 확정 현황
// ============================================

// 확정 현황 페이지 업데이트
function updateConfirmPage() {
    updateConfirmSummary();
    renderConfirmResults();
    updateRoundFilter();
}

// 요약 정보 업데이트
function updateConfirmSummary() {
    const rounds = [...new Set(LOTTERY_CONFIRMED_RESULTS.map(r => r.round))].length;
    const winners = LOTTERY_CONFIRMED_RESULTS.filter(r => r.result === 'winner').length;
    const losers = LOTTERY_CONFIRMED_RESULTS.filter(r => r.result === 'loser').length;
    const totalSupport = LOTTERY_CONFIRMED_RESULTS
        .filter(r => r.result === 'loser')
        .reduce((sum, r) => sum + r.support, 0);
    
    const totalRoundsEl = document.getElementById('totalRounds');
    const totalWinnersEl = document.getElementById('totalWinners');
    const totalLosersEl = document.getElementById('totalLosers');
    const totalSupportEl = document.getElementById('totalSupport');
    
    if (totalRoundsEl) totalRoundsEl.textContent = `${rounds}회`;
    if (totalWinnersEl) totalWinnersEl.textContent = `${winners}명`;
    if (totalLosersEl) totalLosersEl.textContent = `${losers}명`;
    if (totalSupportEl) totalSupportEl.textContent = `${totalSupport.toLocaleString()}원`;
}

// 회차 필터 업데이트
function updateRoundFilter() {
    const roundFilter = document.getElementById('confirmRoundFilter');
    if (!roundFilter) return;
    
    const rounds = [...new Set(LOTTERY_CONFIRMED_RESULTS.map(r => r.round))].sort((a, b) => b - a);
    
    roundFilter.innerHTML = '<option value="">전체 회차</option>' + 
        rounds.map(round => `<option value="${round}">${round}회차</option>`).join('');
}

// 확정 결과 렌더링
function renderConfirmResults() {
    const tbody = document.getElementById('confirmResultsBody');
    const countEl = document.getElementById('confirmCount');
    
    if (!tbody) return;
    
    let filtered = [...LOTTERY_CONFIRMED_RESULTS];
    
    // 필터 적용
    const productFilter = document.getElementById('confirmProductFilter')?.value;
    const roundFilter = document.getElementById('confirmRoundFilter')?.value;
    const resultFilter = document.getElementById('confirmResultFilter')?.value;
    const startDate = document.getElementById('confirmStartDate')?.value;
    const endDate = document.getElementById('confirmEndDate')?.value;
    
    if (productFilter) {
        filtered = filtered.filter(r => r.productId === productFilter);
    }
    if (roundFilter) {
        filtered = filtered.filter(r => r.round === parseInt(roundFilter));
    }
    if (resultFilter) {
        filtered = filtered.filter(r => r.result === resultFilter);
    }
    if (startDate) {
        filtered = filtered.filter(r => r.date.split(' ')[0] >= startDate);
    }
    if (endDate) {
        filtered = filtered.filter(r => r.date.split(' ')[0] <= endDate);
    }
    
    if (countEl) countEl.textContent = filtered.length;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-message">조건에 맞는 결과가 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((result, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><span class="badge badge-info">${result.round}회</span></td>
            <td style="text-align: left; padding-left: 15px;">${result.productName}</td>
            <td>${result.name}</td>
            <td>${result.phone}</td>
            <td>${result.amount.toLocaleString()}원</td>
            <td>
                ${result.result === 'winner' 
                    ? '<span class="badge badge-success">당첨</span>' 
                    : '<span class="badge badge-info">미선정</span>'}
            </td>
            <td>${result.result === 'winner' ? '-' : result.support.toLocaleString() + '원'}</td>
            <td>
                ${result.result === 'winner'
                    ? '<span class="payment-status paid">구매확정</span>'
                    : `<button class="btn btn-sm ${result.paymentStatus === 'paid' ? 'btn-success' : 'btn-secondary'}" 
                              onclick="togglePaymentStatus(${result.id})" 
                              style="min-width: 80px;">
                          ${result.paymentStatus === 'paid' ? '지급완료' : '지급대기'}
                       </button>`}
            </td>
            <td>${result.date}</td>
        </tr>
    `).join('');
}

// 필터 적용
function filterConfirmResults() {
    renderConfirmResults();
}

// 필터 초기화
function resetConfirmFilter() {
    document.getElementById('confirmProductFilter').value = '';
    document.getElementById('confirmRoundFilter').value = '';
    document.getElementById('confirmResultFilter').value = '';
    document.getElementById('confirmStartDate').value = '2026-01-01';
    document.getElementById('confirmEndDate').value = '2026-02-04';
    renderConfirmResults();
}

// 엑셀 다운로드
function exportConfirmResults() {
    alert('엑셀 다운로드 기능\n(서버 연동 후 구현)');
}

// 개별 지급 상태 토글
function togglePaymentStatus(resultId) {
    const result = LOTTERY_CONFIRMED_RESULTS.find(r => r.id === resultId);
    
    if (!result) return;
    
    if (result.paymentStatus === 'paid') {
        // 지급완료 → 지급대기
        if (confirm(`${result.name}님의 지급 상태를 '지급대기'로 변경하시겠습니까?`)) {
            result.paymentStatus = 'pending';
            alert('지급대기 상태로 변경되었습니다.');
            renderConfirmResults();
            updateConfirmSummary();
        }
    } else {
        // 지급대기 → 지급완료
        if (confirm(`${result.name}님에게 ${result.support.toLocaleString()}원을 지급하시겠습니까?`)) {
            result.paymentStatus = 'paid';
            alert(`${result.name}님에게 ${result.support.toLocaleString()}원이 지급되었습니다.`);
            renderConfirmResults();
            updateConfirmSummary();
        }
    }
}

// 이미지 미리보기
function previewImage(event, previewId) {
    const file = event.target.files[0];
    const preview = document.getElementById(previewId);
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="미리보기">
                <button type="button" class="remove-image" onclick="removeImage('${event.target.id}', '${previewId}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
        };
        
        reader.readAsDataURL(file);
    }
}

// 이미지 제거
function removeImage(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    input.value = '';
    
    if (inputId === 'mainImage') {
        preview.innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-3x"></i>
            <p>클릭하여 이미지 업로드</p>
            <small>권장 크기: 600x600px (JPG, PNG)</small>
        `;
    } else {
        preview.innerHTML = '<i class="fas fa-plus"></i>';
    }
}

// 당일 지원금 일괄 지급
function processDailyPayment() {
    const today = new Date().toISOString().split('T')[0];
    const pendingResults = LOTTERY_CONFIRMED_RESULTS.filter(r => 
        r.paymentStatus === 'pending' && 
        r.result === 'loser' && 
        r.date.startsWith(today)
    );
    
    if (pendingResults.length === 0) {
        alert('오늘 지급할 지원금이 없습니다.\n\n※ 지급대기 상태의 미선정자만 대상입니다.');
        return;
    }
    
    const totalAmount = pendingResults.reduce((sum, r) => sum + r.support, 0);
    
    // 명단 표시
    const nameList = pendingResults.map((r, i) => `${i+1}. ${r.name} - ${r.support.toLocaleString()}원`).join('\n');
    
    if (confirm(`오늘(${today}) 지급할 지원금 내역:\n\n${nameList}\n\n━━━━━━━━━━━━━━━━━━━\n총 ${pendingResults.length}명, ${totalAmount.toLocaleString()}원\n\n일괄 지급하시겠습니까?`)) {
        // 지급 상태 업데이트
        pendingResults.forEach(result => {
            result.paymentStatus = 'paid';
        });
        
        alert(`✅ 지급이 완료되었습니다!\n\n지급 인원: ${pendingResults.length}명\n지급 금액: ${totalAmount.toLocaleString()}원\n\n각 회원의 계좌로 현금이 입금되었습니다.`);
        
        updateConfirmPage();
    }
}

// 페이지 로드 시 초기 데이터 렌더링
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    renderMemberTable(MEMBER_DATA);
    renderProductTable(PRODUCT_DATA);
    renderLotteryStatus();
    updateConfirmPage();
    
    // 페이지 전환 시 추첨 현황 업데이트
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (link.dataset.page === 'draw-lottery') {
                setTimeout(renderLotteryStatus, 100);
            } else if (link.dataset.page === 'draw-confirm') {
                setTimeout(updateConfirmPage, 100);
            }
        });
    });
});

// 초기화
console.log('10쇼핑게임 관리자 페이지 로드 완료');

