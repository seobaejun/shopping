// 관리자 페이지 JavaScript

// DOM 요소 (나중에 초기화됨)
let menuToggle, adminSidebar, navLinks, contentPages;

// 사이드바 토글 (나중에 초기화됨)

// 페이지 전환 (나중에 초기화됨)

// 카테고리 목록을 동적으로 로드하는 함수
async function loadCategoriesForProduct() {
    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('categories')
            .orderBy('sortOrder', 'asc')
            .get();
        
        const categories = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const displayName = (data.name != null && String(data.name).trim() !== '')
                ? String(data.name).trim()
                : ((data.categoryName != null && String(data.categoryName).trim() !== '')
                    ? String(data.categoryName).trim()
                    : ((data.title != null && String(data.title).trim() !== '')
                        ? String(data.title).trim()
                        : doc.id));
            categories.push({
                ...data,
                id: doc.id,
                name: displayName
            });
        });
        
        // 숨겨지지 않은 카테고리만 필터링
        const visibleCategories = categories.filter(cat => !cat.isHidden);
        
        console.log('✅ 상품용 카테고리 로드 완료:', categories.length, '개 (표시:', visibleCategories.length, '개)');
        
        // 상품등록 페이지의 카테고리 select 업데이트
        const registerCategorySelect = document.querySelector('#product-register select[name="category"]');
        if (registerCategorySelect) {
            registerCategorySelect.innerHTML = '<option value="">선택하세요</option>';
            visibleCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                const levelLabel = cat.level === 1 ? '1차' : cat.level === 2 ? '2차' : '3차';
                option.textContent = `${levelLabel} - ${cat.name || cat.id}`;
                registerCategorySelect.appendChild(option);
            });
            console.log('✅ 상품등록 카테고리 select 업데이트 완료');
        }
        
        // 상품수정 모달의 카테고리 select 업데이트
        const editCategorySelect = document.getElementById('editProductCategory');
        if (editCategorySelect) {
            editCategorySelect.innerHTML = '<option value="">선택하세요</option>';
            visibleCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                const levelLabel = cat.level === 1 ? '1차' : cat.level === 2 ? '2차' : '3차';
                option.textContent = `${levelLabel} - ${cat.name || cat.id}`;
                editCategorySelect.appendChild(option);
            });
            console.log('✅ 상품수정 카테고리 select 업데이트 완료');
        }
        
        // 상품 목록 검색용 카테고리 select 업데이트
        const searchCategorySelect = document.getElementById('productSearchCategory');
        if (searchCategorySelect) {
            searchCategorySelect.innerHTML = '<option value="">전체</option>';
            visibleCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                const levelLabel = cat.level === 1 ? '1차' : cat.level === 2 ? '2차' : '3차';
                option.textContent = `${levelLabel} - ${cat.name || cat.id}`;
                searchCategorySelect.appendChild(option);
            });
        }
        
        return categories;
    } catch (error) {
        console.error('❌ 카테고리 로드 오류:', error);
        return [];
    }
}

// 페이지 전환 함수
async function switchToPage(targetPage, clickedLink = null) {
    if (!targetPage) {
        console.warn('targetPage가 없습니다. dashboard로 전환합니다.');
        targetPage = 'dashboard'; // 기본값
    }
    
    console.log('페이지 전환 시작:', targetPage);
    
    // 현재 페이지를 localStorage에 저장
    try {
        localStorage.setItem('adminCurrentPage', targetPage);
        console.log('현재 페이지 저장됨:', targetPage);
    } catch (error) {
        console.warn('localStorage 저장 실패:', error);
    }
    
    // contentPages가 없으면 다시 초기화
    if (!contentPages || contentPages.length === 0) {
        contentPages = document.querySelectorAll('.content-page');
        console.log('contentPages 재초기화:', contentPages.length);
    }
    
    // 모든 페이지 숨기기
    if (contentPages && contentPages.length > 0) {
        contentPages.forEach(page => {
            page.classList.remove('active');
        });
        console.log('모든 페이지 active 제거 완료');
    } else {
        console.warn('contentPages가 비어있습니다');
    }
    
    // 선택한 페이지 표시
    const targetElement = document.getElementById(targetPage);
    if (targetElement) {
        targetElement.classList.add('active');
        console.log('페이지 활성화:', targetPage);
        
        // 페이지별 데이터 로드
        try {
            await loadPageData(targetPage);
        } catch (error) {
            console.error('페이지 데이터 로드 오류:', error);
        }
    } else {
        console.error('페이지를 찾을 수 없습니다:', targetPage);
        // 페이지를 찾을 수 없으면 기본 페이지로
        const dashboardPage = document.getElementById('dashboard');
        if (dashboardPage) {
            dashboardPage.classList.add('active');
            targetPage = 'dashboard';
            console.log('기본 페이지로 전환:', targetPage);
        } else {
            console.error('dashboard 페이지도 찾을 수 없습니다!');
            return;
        }
    }
    
    // 네비게이션 활성 상태 변경
    document.querySelectorAll('.nav-list li').forEach(li => {
        li.classList.remove('active');
    });
    
    // 클릭된 링크가 있으면 해당 링크 활성화, 없으면 해당 페이지 링크 찾기
    if (clickedLink) {
        clickedLink.parentElement.classList.add('active');
        console.log('클릭된 링크 활성화:', clickedLink);
    } else {
        const pageLink = document.querySelector(`[data-page="${targetPage}"]`);
        if (pageLink) {
            pageLink.parentElement.classList.add('active');
            console.log('네비게이션 활성화:', targetPage);
        } else {
            console.warn('네비게이션 링크를 찾을 수 없습니다:', targetPage);
        }
    }
    
    // 모바일에서 사이드바 닫기
    if (window.innerWidth <= 1024 && adminSidebar) {
        adminSidebar.classList.remove('open');
    }
    
    console.log('페이지 전환 완료:', targetPage);
}

// 페이지별 데이터 로드 함수
async function loadPageData(pageId) {
    console.log('🔵 loadPageData 호출됨, pageId:', pageId);
    
    // Firebase 초기화 확인
    if (window.firebaseAdmin && !window.firebaseAdmin.db) {
        await window.firebaseAdmin.initFirebase();
    }
    
    console.log('🔵 loadPageData switch 진입, pageId:', pageId);
    
    switch(pageId) {
        case 'dashboard':
            if (window.loadDashboardData) {
                await window.loadDashboardData();
            }
            break;
        case 'basic-settings':
            if (window.loadSettings) {
                await window.loadSettings();
            }
            // 이벤트 위임이 이미 등록되어 있으므로 추가 작업 불필요
            console.log('기본환경설정 페이지 로드 완료');
            break;
        case 'admin-settings':
            if (typeof loadAdminSettings === 'function') {
                await loadAdminSettings();
            }
            break;
        case 'visitor-stats':
            if (typeof loadVisitorStats === 'function') {
                if (!window._visitorStatsDateInitialized) {
                    var vsEnd = document.getElementById('visitorStatsEndDate');
                    var vsStart = document.getElementById('visitorStatsStartDate');
                    if (vsEnd && !vsEnd.value) vsEnd.value = new Date().toISOString().split('T')[0];
                    if (vsStart && !vsStart.value) {
                        var d = new Date();
                        d.setDate(d.getDate() - 30);
                        vsStart.value = d.toISOString().split('T')[0];
                    }
                    window._visitorStatsDateInitialized = true;
                }
                await loadVisitorStats();
            }
            break;
        case 'product-sales':
            if (typeof loadProductSales === 'function') {
                if (!window._productSalesDateInitialized) {
                    var psEnd = document.getElementById('productSalesEndDate');
                    var psStart = document.getElementById('productSalesStartDate');
                    if (psEnd && !psEnd.value) psEnd.value = new Date().toISOString().split('T')[0];
                    if (psStart && !psStart.value) {
                        var d = new Date();
                        d.setDate(d.getDate() - 30);
                        psStart.value = d.toISOString().split('T')[0];
                    }
                    window._productSalesDateInitialized = true;
                }
                await loadProductSales();
            }
            break;
        case 'board-manage':
            if (typeof loadBoardPosts === 'function') {
                if (!window._boardManageDateInitialized) {
                    var bEnd = document.getElementById('boardSearchEndDate');
                    var bStart = document.getElementById('boardSearchStartDate');
                    if (bEnd && !bEnd.value) bEnd.value = new Date().toISOString().split('T')[0];
                    if (bStart && !bStart.value) {
                        var bd = new Date();
                        bd.setDate(bd.getDate() - 30);
                        bStart.value = bd.toISOString().split('T')[0];
                    }
                    window._boardManageDateInitialized = true;
                }
                window._currentBoardType = window._currentBoardType || 'notice';
                await loadBoardPosts(window._currentBoardType);
            }
            break;
        case 'product-register':
            // 상품등록 페이지 진입 시 카테고리 로드
            console.log('🔵 상품등록 페이지 로드 - 카테고리 로드 시작');
            await loadCategoriesForProduct();
            break;
        case 'member-search':
            // 회원조회 페이지 로드 (기본환경설정과 동일한 패턴)
            console.log('🔵🔵🔵 회원조회 페이지 로드 시작 (loadPageData)');
            
            // 테이블 초기화
            const memberTableBody = document.getElementById('memberTableBody');
            if (memberTableBody) {
                memberTableBody.innerHTML = '<tr><td colspan="13" class="empty-message">데이터를 불러오는 중...</td></tr>';
                console.log('✅ 테이블 초기화 완료');
            } else {
                console.error('❌ memberTableBody를 찾을 수 없습니다!');
            }
            
            // loadAllMembers 함수가 로드될 때까지 대기 (최대 5초)
            let waitCount = 0;
            const maxWait = 50; // 5초
            
            while (!window.loadAllMembers && waitCount < maxWait) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
                if (waitCount % 10 === 0) {
                    console.log(`🔵 loadAllMembers 함수 대기 중... (${waitCount * 100}ms)`);
                }
            }
            
            // loadAllMembers 함수 호출 (settings.js의 loadSettings와 동일한 패턴)
            console.log('🔵 window.loadAllMembers 확인:', typeof window.loadAllMembers);
            if (window.loadAllMembers) {
                console.log('🔵 loadAllMembers 함수 호출 시작...');
                try {
                    await window.loadAllMembers();
                    console.log('✅✅✅ 회원조회 페이지 로드 완료');
                } catch (error) {
                    console.error('❌❌❌ 회원조회 페이지 로드 오류:', error);
                    console.error('오류 스택:', error.stack);
                    if (memberTableBody) {
                        memberTableBody.innerHTML = `<tr><td colspan="13" class="empty-message">오류 발생: ${error.message}</td></tr>`;
                    }
                }
            } else {
                console.error('❌❌❌ loadAllMembers 함수를 찾을 수 없습니다! (대기 후에도 없음)');
                console.error('window 객체 확인:', Object.keys(window).filter(k => k.includes('load') || k.includes('member')));
                if (memberTableBody) {
                    memberTableBody.innerHTML = '<tr><td colspan="13" class="empty-message">loadAllMembers 함수를 찾을 수 없습니다. 페이지를 새로고침해주세요.</td></tr>';
                }
            }
            break;
        case 'product-list':
            // 상품 목록 페이지 로드
            console.log('🔵 상품 목록 페이지 로드 시작');
            
            // loadAllProducts 함수가 로드될 때까지 대기
            let productWaitCount = 0;
            const productMaxWait = 50; // 5초
            
            while (!window.loadAllProducts && productWaitCount < productMaxWait) {
                await new Promise(resolve => setTimeout(resolve, 100));
                productWaitCount++;
            }
            
            if (window.loadAllProducts) {
                console.log('🔵 loadAllProducts 함수 호출 시작...');
                try {
                    await window.loadAllProducts();
                    console.log('✅ 상품 목록 페이지 로드 완료');
                } catch (error) {
                    console.error('❌ 상품 목록 페이지 로드 오류:', error);
                }
            } else {
                console.error('❌ loadAllProducts 함수를 찾을 수 없습니다!');
            }
            break;
        case 'category-manage':
            // 카테고리 관리 페이지 로드
            console.log('🔵 카테고리 관리 페이지 로드 시작');
            
            // loadCategories 함수가 로드될 때까지 대기
            let categoryWaitCount = 0;
            const categoryMaxWait = 50; // 5초
            
            while (!window.loadCategories && categoryWaitCount < categoryMaxWait) {
                await new Promise(resolve => setTimeout(resolve, 100));
                categoryWaitCount++;
            }
            
            if (window.loadCategories) {
                console.log('🔵 loadCategories 함수 호출 시작...');
                try {
                    await window.loadCategories();
                    console.log('✅ 카테고리 목록 로드 완료');
                } catch (error) {
                    console.error('❌ 카테고리 목록 로드 오류:', error);
                }
            } else {
                console.error('❌ loadCategories 함수를 찾을 수 없습니다!');
            }
            break;
        case 'member-purchase':
            if (typeof window.initMemberPurchasePage === 'function') {
                window.initMemberPurchasePage();
                console.log('✅ 개인별 구매 누적정보 페이지 초기화 완료');
            }
            break;
        case 'purchase-request':
            await loadPurchaseRequests();
            break;
        case 'draw-lottery':
            // 승인된 주문을 조별 추첨 대기 명단으로 로드 후 현황 표시
            if (typeof loadLotteryWaitingData === 'function') {
                await loadLotteryWaitingData();
            } else if (typeof renderLotteryStatus === 'function') {
                setTimeout(renderLotteryStatus, 100);
            }
            break;
        case 'draw-confirm':
            // 추첨 확정 현황 업데이트
            if (typeof updateConfirmPage === 'function') {
                setTimeout(updateConfirmPage, 100);
            }
            break;
        case 'settlement-personal':
            if (!window._settlementPersonalDateInitialized) {
                var spEnd = document.getElementById('settlementPersonalEnd');
                var spStart = document.getElementById('settlementPersonalStart');
                if (spEnd && !spEnd.value) spEnd.value = new Date().toISOString().split('T')[0];
                if (spStart && !spStart.value) { var d = new Date(); d.setMonth(d.getMonth() - 1); spStart.value = d.toISOString().split('T')[0]; }
                window._settlementPersonalDateInitialized = true;
            }
            await loadSettlementPersonal();
            break;
        case 'settlement-round':
            if (!window._settlementRoundDateInitialized) {
                var srEnd = document.getElementById('settlementRoundEnd');
                var srStart = document.getElementById('settlementRoundStart');
                if (srEnd && !srEnd.value) srEnd.value = new Date().toISOString().split('T')[0];
                if (srStart && !srStart.value) { var d = new Date(); d.setMonth(d.getMonth() - 1); srStart.value = d.toISOString().split('T')[0]; }
                window._settlementRoundDateInitialized = true;
            }
            await loadSettlementRound();
            break;
        case 'delivery-register':
            if (!window._deliveryRegisterDateInitialized) {
                var drEnd = document.getElementById('deliveryRegisterEnd');
                var drStart = document.getElementById('deliveryRegisterStart');
                if (drEnd && !drEnd.value) drEnd.value = new Date().toISOString().split('T')[0];
                if (drStart && !drStart.value) { var d = new Date(); d.setMonth(d.getMonth() - 1); drStart.value = d.toISOString().split('T')[0]; }
                window._deliveryRegisterDateInitialized = true;
            }
            await loadDeliveryRegister();
            break;
    }
}

// 상품 목록 로드
async function loadProducts() {
    try {
        const products = await window.firebaseAdmin.productService.getProducts();
        await renderProductTable(products);
    } catch (error) {
        console.error('상품 목록 로드 오류:', error);
        await renderProductTable(PRODUCT_DATA);
    }
}

// 구매요청 페이지용 유틸
function _orderFormatDate(createdAt) {
    if (!createdAt) return '-';
    if (createdAt.seconds != null) return new Date(createdAt.seconds * 1000).toLocaleString('ko-KR').slice(0, 16);
    if (createdAt.toDate) return createdAt.toDate().toLocaleString('ko-KR').slice(0, 16);
    return new Date(createdAt).toLocaleString('ko-KR').slice(0, 16);
}
function _orderEscapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}
function _orderMaskName(name) { return (name && name.length > 1 ? name.substring(0, 1) + '**' : name || '-'); }
function _orderMaskPhone(phone) { return (phone ? phone.replace(/(\d{3})-?(\d{4})-?(\d{4})/, '$1-****-$3') : '-'); }
function _orderPhone(order) {
    if (!order) return '-';
    var v = order.deliveryPhone || order.phone || order.phoneNumber || order.tel || order.userPhone;
    if (v == null || v === '') return '-';
    return String(v).trim() || '-';
}
function _orderPhoneWithMember(order, memberMap) {
    var p = _orderPhone(order);
    if (p !== '-') return p;
    if (!memberMap) return '-';
    var m = memberMap[order.memberId] || memberMap[order.userId];
    if (!m) return '-';
    var v = m.phone || m.phoneNumber || m.tel;
    return (v != null && String(v).trim() !== '') ? String(v).trim() : '-';
}
function _orderAddressWithMember(order, memberMap) {
    var a = _orderAddress(order);
    if (a !== '-') return a;
    if (!memberMap) return '-';
    var m = memberMap[order.memberId] || memberMap[order.userId];
    if (!m) return '-';
    var parts = [m.postcode, m.address, m.detailAddress].filter(Boolean);
    return parts.length ? parts.join(' ') : (m.address || '-');
}
function _orderGetCreatedTime(order) {
    const c = order.createdAt;
    if (!c) return 0;
    if (c.seconds != null) return c.seconds * 1000;
    if (c.toDate) return c.toDate().getTime();
    return new Date(c).getTime();
}

// 승인대기 목록만 테이블에 그리기 (전체 목록 표시용, 검색 결과는 별도 검색 결과 영역에 표시)
function renderPurchaseRequestTable(orders) {
    const tbody = document.getElementById('purchaseRequestTableBody');
    const infoText = document.getElementById('purchaseRequestInfoText');
    if (!tbody) return;
    if (infoText) infoText.textContent = '총 ' + (orders ? orders.length : 0) + '개의 구매 요청이 있습니다.';
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">승인 대기 중인 구매 요청이 없습니다.</td></tr>';
        return;
    }
    const rows = orders.map((order, index) => {
        const name = _orderEscapeHtml(order.userName || order.name || '-');
        const accountNumber = _orderEscapeHtml(order.accountNumber || '-');
        const price = (order.productPrice || 0).toLocaleString();
        const support = (order.supportAmount || 0).toLocaleString();
        const date = _orderFormatDate(order.createdAt);
        const orderId = _orderEscapeHtml(order.id);
        return `<tr data-order-id="${orderId}">
            <td>${index + 1}</td>
            <td>${name}</td>
            <td>${accountNumber}</td>
            <td>${_orderEscapeHtml(order.productName || '-')}</td>
            <td>${price}</td>
            <td>${support}</td>
            <td>${date}</td>
            <td><span class="badge badge-warning">승인대기</span></td>
            <td>
                <button class="btn btn-sm btn-primary btn-approve-order" data-order-id="${orderId}" type="button">승인</button>
                <button class="btn btn-sm btn-secondary btn-reject-order" data-order-id="${orderId}" type="button">구매취소</button>
            </td>
        </tr>`;
    }).join('');
    tbody.innerHTML = rows;
}

// 승인 목록 테이블 그리기 (status === 'approved') — 상태 변경 가능
function renderPurchaseRequestApprovedTable(orders) {
    const tbody = document.getElementById('purchaseRequestApprovedTableBody');
    const infoText = document.getElementById('purchaseRequestApprovedInfoText');
    if (!tbody) return;
    if (infoText) infoText.textContent = '총 ' + (orders ? orders.length : 0) + '건의 승인 내역이 있습니다.';
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">승인된 내역이 없습니다.</td></tr>';
        return;
    }
    const rows = orders.map((order, index) => {
        const name = _orderEscapeHtml(order.userName || order.name || '-');
        const accountNumber = _orderEscapeHtml(order.accountNumber || '-');
        const price = (order.productPrice || 0).toLocaleString();
        const support = (order.supportAmount || 0).toLocaleString();
        const date = _orderFormatDate(order.createdAt);
        const orderId = _orderEscapeHtml(order.id);
        const select = '<select class="form-control order-status-select" data-order-id="' + orderId + '" style="width:100px;display:inline-block;padding:4px 8px;">' +
            '<option value="pending">승인대기</option>' +
            '<option value="approved" selected>승인</option>' +
            '<option value="cancelled">취소</option></select>';
        return '<tr data-order-id="' + orderId + '"><td>' + (index + 1) + '</td><td>' + name + '</td><td>' + accountNumber + '</td><td>' +
            _orderEscapeHtml(order.productName || '-') + '</td><td>' + price + '</td><td>' + support + '</td><td>' + date +
            '</td><td><span class="badge badge-success">승인</span></td><td>' + select + ' <button type="button" class="btn btn-sm btn-outline-primary btn-change-order-status" data-order-id="' + orderId + '">변경</button></td></tr>';
    }).join('');
    tbody.innerHTML = rows;
}

// 구매취소 목록 테이블 그리기 (status === 'cancelled') — 상태 변경 가능
function renderPurchaseRequestCancelledTable(orders) {
    const tbody = document.getElementById('purchaseRequestCancelledTableBody');
    const infoText = document.getElementById('purchaseRequestCancelledInfoText');
    if (!tbody) return;
    if (infoText) infoText.textContent = '총 ' + (orders ? orders.length : 0) + '건의 취소 내역이 있습니다.';
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">취소된 내역이 없습니다.</td></tr>';
        return;
    }
    const rows = orders.map((order, index) => {
        const name = _orderEscapeHtml(order.userName || order.name || '-');
        const accountNumber = _orderEscapeHtml(order.accountNumber || '-');
        const price = (order.productPrice || 0).toLocaleString();
        const support = (order.supportAmount || 0).toLocaleString();
        const date = _orderFormatDate(order.createdAt);
        const orderId = _orderEscapeHtml(order.id);
        const select = '<select class="form-control order-status-select" data-order-id="' + orderId + '" style="width:100px;display:inline-block;padding:4px 8px;">' +
            '<option value="pending">승인대기</option>' +
            '<option value="approved">승인</option>' +
            '<option value="cancelled" selected>취소</option></select>';
        return '<tr data-order-id="' + orderId + '"><td>' + (index + 1) + '</td><td>' + name + '</td><td>' + accountNumber + '</td><td>' +
            _orderEscapeHtml(order.productName || '-') + '</td><td>' + price + '</td><td>' + support + '</td><td>' + date +
            '</td><td><span class="badge badge-secondary">취소</span></td><td>' + select + ' <button type="button" class="btn btn-sm btn-outline-primary btn-change-order-status" data-order-id="' + orderId + '">변경</button></td></tr>';
    }).join('');
    tbody.innerHTML = rows;
}

// 구매 요청 목록 로드 (승인대기 + 승인 목록 + 구매취소 목록)
async function loadPurchaseRequests() {
    const tbody = document.getElementById('purchaseRequestTableBody');
    const infoText = document.getElementById('purchaseRequestInfoText');
    const page = document.getElementById('purchase-request');
    if (!tbody) return;
    try {
        let wait = 0;
        while (!window.firebaseAdmin && wait < 50) {
            await new Promise(r => setTimeout(r, 100));
            wait++;
        }
        if (window.firebaseAdmin && !window.firebaseAdmin.db) {
            await window.firebaseAdmin.initFirebase();
        }
        if (!window.firebaseAdmin || !window.firebaseAdmin.orderService) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-message">Firebase를 불러올 수 없습니다.</td></tr>';
            if (infoText) infoText.textContent = '총 0개의 구매 요청이 있습니다.';
            return;
        }
        const allOrders = await window.firebaseAdmin.orderService.getOrders({}) || [];
        const pendingOrders = allOrders.filter(function (o) { return o.status === 'pending' || o.status === '대기'; });
        const approvedOrders = allOrders.filter(function (o) { return o.status === 'approved'; });
        const cancelledOrders = allOrders.filter(function (o) { return o.status === 'cancelled'; });
        window._purchaseRequestPendingOrders = pendingOrders;
        renderPurchaseRequestTable(pendingOrders);
        renderPurchaseRequestApprovedTable(approvedOrders);
        renderPurchaseRequestCancelledTable(cancelledOrders);
        var searchResultsContainer = document.getElementById('purchaseRequestSearchResultsContainer');
        if (searchResultsContainer) searchResultsContainer.style.display = 'none';
        if (!window._purchaseRequestDateInitialized && page) {
            const endInput = document.getElementById('purchaseRequestEndDate');
            const startInput = document.getElementById('purchaseRequestStartDate');
            if (endInput && !endInput.value) endInput.value = new Date().toISOString().split('T')[0];
            if (startInput && !startInput.value) {
                const d = new Date();
                d.setMonth(d.getMonth() - 1);
                startInput.value = d.toISOString().split('T')[0];
            }
            window._purchaseRequestDateInitialized = true;
        }
        bindPurchaseRequestSearchButtons();
    } catch (error) {
        console.error('구매 요청 목록 로드 오류:', error);
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">목록을 불러오는 중 오류가 발생했습니다.</td></tr>';
        if (infoText) infoText.textContent = '총 0개의 구매 요청이 있습니다.';
    }
}

// 개인별 정산관리: 총 정산 + 전체 목록만 표시 (검색 결과는 별도 컨테이너에만 표시)
async function loadSettlementPersonal() {
    var tbody = document.getElementById('settlementPersonalTableBody');
    var infoText = document.getElementById('settlementPersonalInfoText');
    var totalEl = document.getElementById('settlementPersonalTotalSupport');
    if (!tbody) return;
    try {
        if (!window.firebaseAdmin || !window.firebaseAdmin.orderService) {
            tbody.innerHTML = '<tr><td colspan="10" class="empty-message">Firebase를 불러올 수 없습니다.</td></tr>';
            if (infoText) infoText.textContent = '총 0개의 구매상품이 있습니다.';
            return;
        }
        var allOrders = await window.firebaseAdmin.orderService.getOrders({}) || [];
        var fullList = allOrders.filter(function (o) { return o.status === 'approved'; });
        window._settlementPersonalFullList = fullList;
        var memberMap = {};
        if (window.firebaseAdmin.memberService) {
            try {
                var members = await window.firebaseAdmin.memberService.getMembers() || [];
                members.forEach(function (m) {
                    var uid = m.userId || m.id;
                    var docId = m.id;
                    if (uid) memberMap[uid] = m;
                    if (docId) memberMap[docId] = m;
                });
            } catch (e) { /* ignore */ }
        }
        window._settlementMemberMap = memberMap;
        var fullTotalSupport = fullList.reduce(function (sum, o) { return sum + (o.supportAmount || 0); }, 0);
        if (totalEl) totalEl.textContent = fullTotalSupport.toLocaleString();
        if (infoText) infoText.textContent = '총 ' + fullList.length + '개의 구매상품이 있습니다.';
        if (!fullList || fullList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="empty-message">정산 내역이 없습니다.</td></tr>';
            return;
        }
        tbody.innerHTML = fullList.map(function (order, i) {
            var dateStr = _orderFormatDate(order.createdAt);
            var phoneStr = _orderEscapeHtml(_orderPhoneWithMember(order, memberMap));
            var addrStr = _orderEscapeHtml(_orderAddressWithMember(order, memberMap));
            return '<tr><td>' + (i + 1) + '</td><td>' + _orderEscapeHtml(order.userName || order.name || '-') + '</td><td>' + dateStr + '</td><td>' + phoneStr + '</td><td>' + _orderEscapeHtml(order.accountNumber || '-') + '</td><td>' + addrStr + '</td><td>' + _orderEscapeHtml(order.productName || '-') + '</td><td>구매</td><td>' + (order.supportAmount || 0).toLocaleString() + '</td><td><span class="badge badge-success">승인</span></td></tr>';
        }).join('');
    } catch (e) {
        console.error('개인별 정산 로드 오류:', e);
        tbody.innerHTML = '<tr><td colspan="10" class="empty-message">목록을 불러오는 중 오류가 발생했습니다.</td></tr>';
        if (infoText) infoText.textContent = '총 0개의 구매상품이 있습니다.';
        if (totalEl) totalEl.textContent = '0';
    }
}

// 개인별 정산 검색: 필터 결과만 검색 결과 컨테이너에 표시 (총 정산·전체 목록은 건드리지 않음, 구매요청과 동일)
function applySettlementPersonalSearch() {
    var fullList = window._settlementPersonalFullList || [];
    var nameInput = document.getElementById('settlementPersonalName');
    var startInput = document.getElementById('settlementPersonalStart');
    var endInput = document.getElementById('settlementPersonalEnd');
    var name = (nameInput && nameInput.value) ? nameInput.value.trim().toLowerCase() : '';
    var startStr = (startInput && startInput.value) ? startInput.value.trim() : '';
    var endStr = (endInput && endInput.value) ? endInput.value.trim() : '';
    var startMs = _orderStartOfDayLocal(startStr);
    var endMs = _orderEndOfDayLocal(endStr);
    var filtered = fullList.filter(function (order) {
        if (name) {
            var orderName = (order.userName != null) ? String(order.userName).toLowerCase() : '';
            if (!orderName || orderName.indexOf(name) === -1) return false;
        }
        var t = _orderGetCreatedTime(order);
        if (startMs != null && t < startMs) return false;
        if (endMs != null && t > endMs) return false;
        return true;
    });
    var searchContainer = document.getElementById('settlementPersonalSearchResultsContainer');
    var searchTbody = document.getElementById('settlementPersonalSearchResultsBody');
    var countEl = document.getElementById('settlementPersonalSearchResultCount');
    if (!searchContainer || !searchTbody) return;
    searchContainer.style.display = 'block';
    if (countEl) countEl.textContent = filtered.length;
    var memberMap = window._settlementMemberMap || {};
    if (!filtered || filtered.length === 0) {
        searchTbody.innerHTML = '<tr><td colspan="10" class="empty-message">검색 조건에 맞는 정산 내역이 없습니다.</td></tr>';
    } else {
        searchTbody.innerHTML = filtered.map(function (order, i) {
            var dateStr = _orderFormatDate(order.createdAt);
            var phoneStr = _orderEscapeHtml(_orderPhoneWithMember(order, memberMap));
            var addrStr = _orderEscapeHtml(_orderAddressWithMember(order, memberMap));
            return '<tr><td>' + (i + 1) + '</td><td>' + _orderEscapeHtml(order.userName || order.name || '-') + '</td><td>' + dateStr + '</td><td>' + phoneStr + '</td><td>' + _orderEscapeHtml(order.accountNumber || '-') + '</td><td>' + addrStr + '</td><td>' + _orderEscapeHtml(order.productName || '-') + '</td><td>구매</td><td>' + (order.supportAmount || 0).toLocaleString() + '</td><td><span class="badge badge-success">승인</span></td></tr>';
        }).join('');
    }
    searchContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 회차별 정산관리: 총 정산 + 전체 목록만 표시 (검색 결과는 별도 컨테이너에만 표시)
async function loadSettlementRound() {
    var tbody = document.getElementById('settlementRoundTableBody');
    var infoText = document.getElementById('settlementRoundInfoText');
    var totalEl = document.getElementById('settlementRoundTotalSupport');
    if (!tbody) return;
    try {
        if (!window.firebaseAdmin || !window.firebaseAdmin.orderService) {
            tbody.innerHTML = '<tr><td colspan="11" class="empty-message">Firebase를 불러올 수 없습니다.</td></tr>';
            if (infoText) infoText.textContent = '총 0건의 정산 내역이 있습니다.';
            if (totalEl) totalEl.textContent = '0';
            return;
        }
        var allOrders = await window.firebaseAdmin.orderService.getOrders({}) || [];
        var fullList = allOrders.filter(function (o) { return o.status === 'approved'; });
        window._settlementRoundFullList = fullList;
        var memberMap = {};
        if (window.firebaseAdmin.memberService) {
            try {
                var members = await window.firebaseAdmin.memberService.getMembers() || [];
                members.forEach(function (m) {
                    var uid = m.userId || m.id;
                    var docId = m.id;
                    if (uid) memberMap[uid] = m;
                    if (docId) memberMap[docId] = m;
                });
            } catch (e) { /* ignore */ }
        }
        window._settlementMemberMap = memberMap;
        var fullTotalSupport = fullList.reduce(function (sum, o) { return sum + (o.supportAmount || 0); }, 0);
        if (totalEl) totalEl.textContent = fullTotalSupport.toLocaleString();
        if (infoText) infoText.textContent = '총 ' + (fullList ? fullList.length : 0) + '건의 정산 내역이 있습니다.';
        if (!fullList || fullList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="empty-message">정산 내역이 없습니다.</td></tr>';
            return;
        }
        tbody.innerHTML = fullList.map(function (order, i) {
            var t = _orderGetCreatedTime(order);
            var d = new Date(t);
            var dateOnly = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            var roundDisplay = (order.settlementRound != null || order.round != null) ? (order.settlementRound != null ? order.settlementRound : order.round) + '회차' : '미배정';
            var phoneStr = _orderEscapeHtml(_orderPhoneWithMember(order, memberMap));
            var addrStr = _orderEscapeHtml(_orderAddressWithMember(order, memberMap));
            return '<tr><td>' + (i + 1) + '</td><td>' + dateOnly + '</td><td>' + _orderEscapeHtml(roundDisplay) + '</td><td>' + _orderEscapeHtml(order.userName || order.name || '-') + '</td><td>' + phoneStr + '</td><td>' + _orderEscapeHtml(order.accountNumber || '-') + '</td><td>' + addrStr + '</td><td>' + _orderEscapeHtml(order.productName || '-') + '</td><td>구매</td><td>' + (order.supportAmount || 0).toLocaleString() + '</td><td><span class="badge badge-success">승인</span></td></tr>';
        }).join('');
    } catch (e) {
        console.error('회차별 정산 로드 오류:', e);
        tbody.innerHTML = '<tr><td colspan="11" class="empty-message">목록을 불러오는 중 오류가 발생했습니다.</td></tr>';
        if (infoText) infoText.textContent = '총 0건의 정산 내역이 있습니다.';
        var totalElErr = document.getElementById('settlementRoundTotalSupport');
        if (totalElErr) totalElErr.textContent = '0';
    }
}

// 회차별 정산 검색: 필터 결과만 검색 결과 컨테이너에 표시 (총 정산·전체 목록은 건드리지 않음, 구매요청과 동일)
function applySettlementRoundSearch() {
    var fullList = window._settlementRoundFullList || [];
    var productInput = document.getElementById('settlementRoundProduct');
    var roundInput = document.getElementById('settlementRoundRound');
    var startInput = document.getElementById('settlementRoundStart');
    var endInput = document.getElementById('settlementRoundEnd');
    var product = (productInput && productInput.value) ? productInput.value.trim().toLowerCase() : '';
    var roundStr = (roundInput && roundInput.value) ? roundInput.value.trim().replace(/회차/g, '') : '';
    var roundNum = roundStr ? parseInt(roundStr, 10) : null;
    if (roundNum !== null && isNaN(roundNum)) roundNum = null;
    var startStr = (startInput && startInput.value) ? startInput.value.trim() : '';
    var endStr = (endInput && endInput.value) ? endInput.value.trim() : '';
    var startMs = _orderStartOfDayLocal(startStr);
    var endMs = _orderEndOfDayLocal(endStr);
    var filtered = fullList.filter(function (order) {
        if (product) {
            var pn = (order.productName != null) ? String(order.productName).toLowerCase() : '';
            if (!pn || pn.indexOf(product) === -1) return false;
        }
        if (roundNum != null) {
            var r = order.settlementRound != null ? order.settlementRound : order.round;
            if (r == null) return false;
            if (Number(r) !== roundNum) return false;
        }
        var t = _orderGetCreatedTime(order);
        if (startMs != null && t < startMs) return false;
        if (endMs != null && t > endMs) return false;
        return true;
    });
    var searchContainer = document.getElementById('settlementRoundSearchResultsContainer');
    var searchTbody = document.getElementById('settlementRoundSearchResultsBody');
    var countEl = document.getElementById('settlementRoundSearchResultCount');
    if (!searchContainer || !searchTbody) return;
    searchContainer.style.display = 'block';
    if (countEl) countEl.textContent = filtered.length;
    var memberMap = window._settlementMemberMap || {};
    if (!filtered || filtered.length === 0) {
        searchTbody.innerHTML = '<tr><td colspan="11" class="empty-message">검색 조건에 맞는 정산 내역이 없습니다.</td></tr>';
    } else {
        searchTbody.innerHTML = filtered.map(function (order, i) {
            var t = _orderGetCreatedTime(order);
            var d = new Date(t);
            var dateOnly = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            var roundDisplay = (order.settlementRound != null || order.round != null) ? (order.settlementRound != null ? order.settlementRound : order.round) + '회차' : '미배정';
            var phoneStr = _orderEscapeHtml(_orderPhoneWithMember(order, memberMap));
            var addrStr = _orderEscapeHtml(_orderAddressWithMember(order, memberMap));
            return '<tr><td>' + (i + 1) + '</td><td>' + dateOnly + '</td><td>' + _orderEscapeHtml(roundDisplay) + '</td><td>' + _orderEscapeHtml(order.userName || order.name || '-') + '</td><td>' + phoneStr + '</td><td>' + _orderEscapeHtml(order.accountNumber || '-') + '</td><td>' + addrStr + '</td><td>' + _orderEscapeHtml(order.productName || '-') + '</td><td>구매</td><td>' + (order.supportAmount || 0).toLocaleString() + '</td><td><span class="badge badge-success">승인</span></td></tr>';
        }).join('');
    }
    searchContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 주문의 주소 문자열 반환 (바로구매 배송지 우선, 그 다음 기존 필드)
function _orderAddress(order) {
    if (!order) return '-';
    var deliveryParts = [order.deliveryPostcode, order.deliveryAddress, order.deliveryDetailAddress].filter(Boolean);
    if (deliveryParts.length) return deliveryParts.join(' ');
    if (order.deliveryAddress) return order.deliveryAddress;
    var parts = [order.postcode, order.address, order.detailAddress].filter(Boolean);
    if (parts.length) return parts.join(' ');
    if (order.address) return order.address;
    if (order.addr) return order.addr;
    return '-';
}

// 배송 진행 등록: 추첨 확정 주문만 전체 목록 로드 (검색 필터 없음)
async function loadDeliveryRegister() {
    var tbody = document.getElementById('deliveryRegisterTableBody');
    var infoText = document.getElementById('deliveryRegisterInfoText');
    if (!tbody) return;
    try {
        if (!window.firebaseAdmin || !window.firebaseAdmin.orderService) {
            tbody.innerHTML = '<tr><td colspan="11" class="empty-message">Firebase를 불러올 수 없습니다.</td></tr>';
            if (infoText) infoText.textContent = '총 0건의 배송 상품이 있습니다.';
            return;
        }
        var allOrders = await window.firebaseAdmin.orderService.getOrders({}) || [];
        var confirmedOrderIds = new Set((window.LOTTERY_CONFIRMED_RESULTS || []).map(function (r) { return r.orderId; }).filter(Boolean));
        var fullList = allOrders.filter(function (o) {
            return o.status === 'approved' && confirmedOrderIds.has(o.id);
        });
        window._deliveryRegisterFullList = fullList;
        var memberMap = {};
        if (window.firebaseAdmin.memberService) {
            try {
                var members = await window.firebaseAdmin.memberService.getMembers() || [];
                members.forEach(function (m) {
                    var uid = m.userId || m.id;
                    var docId = m.id;
                    if (uid) memberMap[uid] = m;
                    if (docId) memberMap[docId] = m;
                });
            } catch (e) { /* ignore */ }
        }
        window._deliveryMemberMap = memberMap;
        if (infoText) infoText.textContent = '총 ' + (fullList ? fullList.length : 0) + '건의 배송 상품이 있습니다.';
        if (!fullList || fullList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="empty-message">추첨 확정된 배송 내역이 없습니다.</td></tr>';
            return;
        }
        tbody.innerHTML = _deliveryRegisterBuildRows(fullList, memberMap);
    } catch (e) {
        console.error('배송 진행 등록 로드 오류:', e);
        tbody.innerHTML = '<tr><td colspan="11" class="empty-message">목록을 불러오는 중 오류가 발생했습니다.</td></tr>';
        if (infoText) infoText.textContent = '총 0건의 배송 상품이 있습니다.';
    }
}

// 배송 목록 한 행 HTML 생성 (공통) — 전화번호·주소 전체 표시, 회원 정보로 보완
function _deliveryRegisterBuildRows(list, memberMap) {
    memberMap = memberMap || window._deliveryMemberMap || {};
    return list.map(function (order, i) {
        var orderId = order.id;
        var ds = order.deliveryStatus || 'ready';
        var company = _orderEscapeHtml(order.deliveryCompany || '');
        var tracking = _orderEscapeHtml(order.trackingNumber || '');
        var statusSelectHtml = '<select class="form-control delivery-status-select" data-order-id="' + _orderEscapeHtml(orderId) + '" style="min-width:100px;">' +
            '<option value="ready"' + (ds === 'ready' ? ' selected' : '') + '>배송준비</option>' +
            '<option value="shipping"' + (ds === 'shipping' ? ' selected' : '') + '>배송중</option>' +
            '<option value="complete"' + (ds === 'complete' ? ' selected' : '') + '>배송완료</option></select>';
        var dateStr = _orderFormatDate(order.createdAt);
        var addressStr = _orderEscapeHtml(_orderAddressWithMember(order, memberMap));
        var phoneStr = _orderEscapeHtml(_orderPhoneWithMember(order, memberMap));
        var buyer = order.userName || order.name || '-';
        var recipient = order.deliveryRecipientName ? String(order.deliveryRecipientName).trim() : '';
        var buyerDisplay = recipient && recipient !== buyer ? _orderEscapeHtml(buyer) + ' (' + _orderEscapeHtml(recipient) + ')' : _orderEscapeHtml(buyer);
        return '<tr data-order-id="' + _orderEscapeHtml(orderId) + '">' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + buyerDisplay + '</td>' +
            '<td>' + _orderEscapeHtml(order.productName || '-') + '</td>' +
            '<td>1</td>' +
            '<td>' + phoneStr + '</td>' +
            '<td>' + addressStr + '</td>' +
            '<td>' + dateStr + '</td>' +
            '<td>' + statusSelectHtml + '</td>' +
            '<td><input type="text" class="form-control delivery-company-input" data-order-id="' + _orderEscapeHtml(orderId) + '" placeholder="택배사" value="' + company + '" style="min-width:90px;"></td>' +
            '<td><input type="text" class="form-control delivery-tracking-input" data-order-id="' + _orderEscapeHtml(orderId) + '" placeholder="송장번호" value="' + tracking + '" style="min-width:120px;"></td>' +
            '<td><button type="button" class="btn btn-sm btn-primary btn-save-delivery" data-order-id="' + _orderEscapeHtml(orderId) + '">저장</button></td></tr>';
    }).join('');
}

// 배송 진행 등록 검색: 필터 결과만 검색 결과 컨테이너에 표시 (전체 목록은 건드리지 않음)
function applyDeliveryRegisterSearch() {
    var fullList = window._deliveryRegisterFullList || [];
    var nameInput = document.getElementById('deliveryRegisterName');
    var statusSelect = document.getElementById('deliveryRegisterStatus');
    var startInput = document.getElementById('deliveryRegisterStart');
    var endInput = document.getElementById('deliveryRegisterEnd');
    var name = (nameInput && nameInput.value) ? nameInput.value.trim().toLowerCase() : '';
    var statusFilter = (statusSelect && statusSelect.value) ? statusSelect.value.trim() : '';
    var startStr = (startInput && startInput.value) ? startInput.value.trim() : '';
    var endStr = (endInput && endInput.value) ? endInput.value.trim() : '';
    var startMs = _orderStartOfDayLocal(startStr);
    var endMs = _orderEndOfDayLocal(endStr);
    var filtered = fullList.filter(function (order) {
        if (name) {
            var orderName = (order.userName != null) ? String(order.userName).toLowerCase() : '';
            if (!orderName || orderName.indexOf(name) === -1) return false;
        }
        if (statusFilter) {
            var ds = order.deliveryStatus || 'ready';
            if (ds !== statusFilter) return false;
        }
        var t = _orderGetCreatedTime(order);
        if (startMs != null && t < startMs) return false;
        if (endMs != null && t > endMs) return false;
        return true;
    });
    var searchContainer = document.getElementById('deliveryRegisterSearchResultsContainer');
    var searchTbody = document.getElementById('deliveryRegisterSearchResultsBody');
    var countEl = document.getElementById('deliveryRegisterSearchResultCount');
    if (!searchContainer || !searchTbody) return;
    searchContainer.style.display = 'block';
    if (countEl) countEl.textContent = filtered.length;
    if (!filtered || filtered.length === 0) {
        searchTbody.innerHTML = '<tr><td colspan="11" class="empty-message">검색 조건에 맞는 배송 내역이 없습니다.</td></tr>';
    } else {
        searchTbody.innerHTML = _deliveryRegisterBuildRows(filtered, window._deliveryMemberMap);
    }
    searchContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 날짜 문자열을 로컬 자정/종료 시각(ms)으로 변환 (UTC 해석 방지)
function _orderStartOfDayLocal(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr + 'T00:00:00').getTime();
}
function _orderEndOfDayLocal(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.getTime() - 1;
}

// 구매요청 검색: 필터 후 **검색 결과 테이블**에만 그리기 (회원조회와 동일, 승인대기 테이블은 그대로 유지)
function applyPurchaseRequestSearch() {
    const list = window._purchaseRequestPendingOrders || [];
    const nameInput = document.getElementById('purchaseRequestSearchName');
    const startInput = document.getElementById('purchaseRequestStartDate');
    const endInput = document.getElementById('purchaseRequestEndDate');
    const name = (nameInput && nameInput.value) ? nameInput.value.trim().toLowerCase() : '';
    const startStr = startInput && startInput.value ? startInput.value.trim() : '';
    const endStr = endInput && endInput.value ? endInput.value.trim() : '';
    const startMs = _orderStartOfDayLocal(startStr);
    const endMs = _orderEndOfDayLocal(endStr);
    const filtered = list.filter(function (order) {
        if (name) {
            const orderName = (order.userName != null) ? String(order.userName).toLowerCase() : '';
            if (!orderName || orderName.indexOf(name) === -1) return false;
        }
        const t = _orderGetCreatedTime(order);
        if (startMs != null && t < startMs) return false;
        if (endMs != null && t > endMs) return false;
        return true;
    });
    var searchContainer = document.getElementById('purchaseRequestSearchResultsContainer');
    var searchTbody = document.getElementById('purchaseRequestSearchResultsBody');
    var countEl = document.getElementById('purchaseRequestSearchResultCount');
    if (!searchContainer || !searchTbody) return;
    searchContainer.style.display = 'block';
    if (countEl) countEl.textContent = filtered.length;
    if (!filtered || filtered.length === 0) {
        searchTbody.innerHTML = '<tr><td colspan="9" class="empty-message">검색 조건에 맞는 구매 요청이 없습니다.</td></tr>';
        return;
    }
    var rows = filtered.map(function (order, index) {
        var nameStr = _orderEscapeHtml(order.userName || order.name || '-');
        var accountNumber = _orderEscapeHtml(order.accountNumber || '-');
        var price = (order.productPrice || 0).toLocaleString();
        var support = (order.supportAmount || 0).toLocaleString();
        var date = _orderFormatDate(order.createdAt);
        var orderId = _orderEscapeHtml(order.id);
        return '<tr data-order-id="' + orderId + '">' +
            '<td>' + (index + 1) + '</td>' +
            '<td>' + nameStr + '</td>' +
            '<td>' + accountNumber + '</td>' +
            '<td>' + _orderEscapeHtml(order.productName || '-') + '</td>' +
            '<td>' + price + '</td>' +
            '<td>' + support + '</td>' +
            '<td>' + date + '</td>' +
            '<td><span class="badge badge-warning">승인대기</span></td>' +
            '<td><button class="btn btn-sm btn-primary btn-approve-order" data-order-id="' + orderId + '" type="button">승인</button> ' +
            '<button class="btn btn-sm btn-secondary btn-reject-order" data-order-id="' + orderId + '" type="button">구매취소</button></td></tr>';
    }).join('');
    searchTbody.innerHTML = rows;
    searchContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 구매요청 페이지 검색/취소 버튼 직접 연결 (페이지 로드 시마다 호출)
function bindPurchaseRequestSearchButtons() {
    const searchBtn = document.getElementById('purchaseRequestSearchBtn');
    const resetBtn = document.getElementById('purchaseRequestResetBtn');
    if (searchBtn) {
        searchBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            applyPurchaseRequestSearch();
            return false;
        };
    }
    if (resetBtn) {
        resetBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            const nameInput = document.getElementById('purchaseRequestSearchName');
            const startInput = document.getElementById('purchaseRequestStartDate');
            const endInput = document.getElementById('purchaseRequestEndDate');
            if (nameInput) nameInput.value = '';
            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';
            var searchContainer = document.getElementById('purchaseRequestSearchResultsContainer');
            if (searchContainer) searchContainer.style.display = 'none';
            return false;
        };
    }
}

// 회원조회 검색/엑셀/취소는 member-search.js에서 구현, initAdminPage에서 memberSearchBtn/memberResetBtn/memberExportBtn에 연결됨

// 테이블 편집/삭제 버튼 (구매요청 검색/취소는 위임으로 항상 동작)
document.addEventListener('click', (e) => {
    if (e.target.closest('#purchaseRequestSearchBtn')) {
        e.preventDefault();
        e.stopPropagation();
        applyPurchaseRequestSearch();
        return;
    }
    if (e.target.closest('#purchaseRequestResetBtn')) {
        e.preventDefault();
        e.stopPropagation();
        const nameInput = document.getElementById('purchaseRequestSearchName');
        const startInput = document.getElementById('purchaseRequestStartDate');
        const endInput = document.getElementById('purchaseRequestEndDate');
        if (nameInput) nameInput.value = '';
        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';
        var searchContainer = document.getElementById('purchaseRequestSearchResultsContainer');
        if (searchContainer) searchContainer.style.display = 'none';
        return;
    }
    if (e.target.closest('#settlementPersonalSearchBtn')) {
        e.preventDefault();
        e.stopPropagation();
        applySettlementPersonalSearch();
        return;
    }
    if (e.target.closest('#settlementPersonalResetBtn')) {
        e.preventDefault();
        e.stopPropagation();
        var n = document.getElementById('settlementPersonalName');
        var s = document.getElementById('settlementPersonalStart');
        var en = document.getElementById('settlementPersonalEnd');
        if (n) n.value = '';
        if (s) s.value = '';
        if (en) en.value = '';
        var searchContainer = document.getElementById('settlementPersonalSearchResultsContainer');
        if (searchContainer) searchContainer.style.display = 'none';
        return;
    }
    if (e.target.closest('#settlementRoundSearchBtn')) {
        e.preventDefault();
        e.stopPropagation();
        applySettlementRoundSearch();
        return;
    }
    if (e.target.closest('#settlementRoundResetBtn')) {
        e.preventDefault();
        e.stopPropagation();
        var p = document.getElementById('settlementRoundProduct');
        var r = document.getElementById('settlementRoundRound');
        var s = document.getElementById('settlementRoundStart');
        var en = document.getElementById('settlementRoundEnd');
        if (p) p.value = '';
        if (r) r.value = '';
        if (s) s.value = '';
        if (en) en.value = '';
        var searchContainer = document.getElementById('settlementRoundSearchResultsContainer');
        if (searchContainer) searchContainer.style.display = 'none';
        return;
    }
    if (e.target.closest('#deliveryRegisterSearchBtn')) {
        e.preventDefault();
        e.stopPropagation();
        applyDeliveryRegisterSearch();
        return;
    }
    if (e.target.closest('#deliveryRegisterResetBtn')) {
        e.preventDefault();
        e.stopPropagation();
        var n = document.getElementById('deliveryRegisterName');
        var st = document.getElementById('deliveryRegisterStatus');
        var s = document.getElementById('deliveryRegisterStart');
        var en = document.getElementById('deliveryRegisterEnd');
        if (n) n.value = '';
        if (st) st.value = '';
        if (s) s.value = '';
        if (en) en.value = '';
        var searchContainer = document.getElementById('deliveryRegisterSearchResultsContainer');
        if (searchContainer) searchContainer.style.display = 'none';
        return;
    }
    if (e.target.closest('.btn-save-delivery')) {
        var btn = e.target.closest('.btn-save-delivery');
        var orderId = btn.getAttribute('data-order-id');
        if (!orderId) return;
        var row = btn.closest('tr');
        if (!row) return;
        var statusSelect = row.querySelector('.delivery-status-select');
        var companyInput = row.querySelector('.delivery-company-input');
        var trackingInput = row.querySelector('.delivery-tracking-input');
        var deliveryStatus = (statusSelect && statusSelect.value) ? statusSelect.value : 'ready';
        var deliveryCompany = (companyInput && companyInput.value) ? companyInput.value.trim() : '';
        var trackingNumber = (trackingInput && trackingInput.value) ? trackingInput.value.trim() : '';
        (async function () {
            try {
                if (window.firebaseAdmin && window.firebaseAdmin.orderService) {
                    await window.firebaseAdmin.orderService.updateOrder(orderId, {
                        deliveryStatus: deliveryStatus,
                        deliveryCompany: deliveryCompany,
                        trackingNumber: trackingNumber
                    });
                    if (typeof loadDeliveryRegister === 'function') loadDeliveryRegister();
                    var searchContainer = document.getElementById('deliveryRegisterSearchResultsContainer');
                    if (searchContainer && searchContainer.style.display !== 'none' && typeof applyDeliveryRegisterSearch === 'function') {
                        applyDeliveryRegisterSearch();
                    }
                }
            } catch (err) {
                console.error('배송 정보 저장 오류:', err);
                alert('배송 정보 저장에 실패했습니다.');
            }
        })();
        return;
    }
    if (e.target.closest('.btn-approve-order')) {
        const btn = e.target.closest('.btn-approve-order');
        const orderId = btn.getAttribute('data-order-id');
        if (!orderId) return;
        if (!confirm('이 구매 요청을 승인하시겠습니까?')) return;
        (async () => {
            try {
                if (window.firebaseAdmin && window.firebaseAdmin.orderService) {
                    await window.firebaseAdmin.orderService.updateOrder(orderId, { status: 'approved' });
                    alert('승인되었습니다.');
                    await loadPurchaseRequests();
                }
            } catch (err) {
                console.error(err);
                alert('승인 처리 중 오류가 발생했습니다.');
            }
        })();
        return;
    }
    if (e.target.closest('.btn-reject-order')) {
        const btn = e.target.closest('.btn-reject-order');
        const orderId = btn.getAttribute('data-order-id');
        if (!orderId) return;
        if (!confirm('이 구매 요청을 취소하시겠습니까?')) return;
        (async () => {
            try {
                if (window.firebaseAdmin && window.firebaseAdmin.orderService) {
                    await window.firebaseAdmin.orderService.updateOrder(orderId, { status: 'cancelled' });
                    alert('구매가 취소되었습니다.');
                    await loadPurchaseRequests();
                }
            } catch (err) {
                console.error(err);
                alert('취소 처리 중 오류가 발생했습니다.');
            }
        })();
        return;
    }
    if (e.target.closest('.btn-change-order-status')) {
        const btn = e.target.closest('.btn-change-order-status');
        const orderId = btn.getAttribute('data-order-id');
        const row = btn.closest('tr');
        const select = row ? row.querySelector('.order-status-select') : null;
        if (!orderId || !select) return;
        const newStatus = select.value;
        if (!newStatus) return;
        (async () => {
            try {
                if (window.firebaseAdmin && window.firebaseAdmin.orderService) {
                    await window.firebaseAdmin.orderService.updateOrder(orderId, { status: newStatus });
                    alert('상태가 변경되었습니다.');
                    await loadPurchaseRequests();
                }
            } catch (err) {
                console.error(err);
                alert('상태 변경 중 오류가 발생했습니다.');
            }
        })();
        return;
    }
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

// 페이지네이션 (DOMContentLoaded 이벤트 내부로 이동)
// 이 코드는 DOMContentLoaded 이벤트 핸들러 내부에서 실행됩니다

// loadPageData 함수는 위에서 이미 정의됨 (89번째 줄)
// 중복 정의 제거됨

// 반응형 처리 및 외부 클릭 이벤트는 DOMContentLoaded 내부에서 초기화됩니다
// (이 코드는 DOMContentLoaded 이벤트 핸들러 내부로 이동됨)

// 로그아웃, 홈 버튼 등은 DOMContentLoaded 내부에서 초기화됩니다
// 이 코드는 DOMContentLoaded 이벤트 핸들러 내부로 이동되었습니다

// ============================================
// 회원 데이터 - Firestore에서 가져옴
// 더미데이터는 제거되었습니다.
// ============================================

// ============================================
// 회원정보 페이지 기능 (Firestore 연동)
// ============================================

// 페이지네이션 변수
let currentMemberPage = 1;
const membersPerPage = 10;
let allMembersData = []; // 전체 회원 데이터
let filteredMembersData = []; // 필터링된 회원 데이터

// 전역으로도 export (member-search.js에서 사용)
window.allMembersData = allMembersData;
window.filteredMembersData = filteredMembersData;
window.currentMemberPage = currentMemberPage;

// 회원 검색 함수는 member-search.js로 이동됨
// admin.js에서는 제거하고 member-search.js의 함수를 사용

// 전체 회원 데이터 로드
async function loadAllMembers() {
    console.log('🔵 loadAllMembers 함수 호출됨');
    
    try {
        // Firebase 초기화 확인 및 대기
        if (!window.firebaseAdmin) {
            console.log('Firebase Admin 대기 중...');
            let waitCount = 0;
            while (!window.firebaseAdmin && waitCount < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }
        }
        
        if (!window.firebaseAdmin) {
            console.error('❌ Firebase Admin을 찾을 수 없습니다.');
            const tbody = document.getElementById('memberTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="13" class="empty-message">Firebase가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.</td></tr>';
            }
            return;
        }
        
        // Firebase 초기화 확인
        if (!window.firebaseAdmin.db) {
            console.log('Firebase DB 초기화 중...');
            const initResult = await window.firebaseAdmin.initFirebase();
            console.log('초기화 결과:', initResult);
        }
        
        if (!window.firebaseAdmin.db) {
            console.error('❌ DB 초기화 실패!');
            const tbody = document.getElementById('memberTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="13" class="empty-message">Firebase DB 초기화에 실패했습니다. 콘솔에서 testFirestoreMembers()를 실행해보세요.</td></tr>';
            }
            return;
        }
        
        console.log('✅ DB 확인 완료:', window.firebaseAdmin.db);
        
        if (!window.firebaseAdmin.memberService) {
            console.error('❌ memberService를 찾을 수 없습니다.');
            console.log('window.firebaseAdmin:', window.firebaseAdmin);
            const tbody = document.getElementById('memberTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="13" class="empty-message">memberService를 찾을 수 없습니다.</td></tr>';
            }
            return;
        }
        
        console.log('✅ Firebase Admin 및 memberService 확인 완료');
        console.log('전체 회원 데이터 로드 시작...');
        console.log('memberService:', window.firebaseAdmin.memberService);
        console.log('getMembers 함수:', typeof window.firebaseAdmin.memberService.getMembers);
        
        // 직접 Firestore 접근 (가장 확실한 방법)
        console.log('🔵🔵🔵 직접 Firestore 접근으로 데이터 가져오기 시작');
        let members = [];
        
        try {
            // 방법 1: memberService.getMembers() 시도
            console.log('🔵 방법 1: memberService.getMembers() 호출');
            members = await window.firebaseAdmin.memberService.getMembers();
            console.log('✅✅✅ memberService.getMembers() 성공:', members.length, '명');
        } catch (error) {
            console.error('❌ memberService.getMembers() 실패:', error);
            console.error('오류 상세:', error.message, error.code);
            
            // 방법 2: 직접 Firestore 접근
            console.log('🔵 방법 2: 직접 Firestore 접근 시도');
            try {
                const membersRef = window.firebaseAdmin.db.collection('members');
                console.log('members 컬렉션 참조 생성:', membersRef);
                
                const snapshot = await membersRef.get();
                console.log('✅✅✅ 직접 접근 성공!');
                console.log('문서 개수:', snapshot.docs.length);
                console.log('빈 컬렉션 여부:', snapshot.empty);
                
                if (snapshot.empty) {
                    console.warn('⚠️ members 컬렉션이 비어있습니다.');
                    members = [];
                } else {
                    members = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data
                        };
                    });
                    console.log('✅ 직접 접근으로 데이터 변환 완료:', members.length, '명');
                }
            } catch (directError) {
                console.error('❌❌❌ 직접 접근도 실패:', directError);
                console.error('오류 메시지:', directError.message);
                console.error('오류 코드:', directError.code);
                console.error('오류 스택:', directError.stack);
                throw directError;
            }
        }
        
        // 데이터 확인 및 로그
        console.log('🔵🔵🔵 최종 회원 데이터 확인');
        console.log('members 배열:', members);
        console.log('members 개수:', members.length);
        console.log('members 타입:', typeof members);
        console.log('members 배열 여부:', Array.isArray(members));
        
        if (members && members.length > 0) {
            console.log('✅✅✅ 회원 데이터 있음!');
            console.log('첫 번째 회원 데이터 샘플:', JSON.stringify(members[0], null, 2));
            console.log('모든 회원 ID:', members.map(m => m.id));
        } else {
            console.warn('⚠️⚠️⚠️ 회원 데이터가 없습니다!');
            console.log('Firestore Console에서 members 컬렉션을 확인하세요.');
        }
        
        // 데이터 저장 (전역 변수에 저장 - member-search.js에서 사용)
        window.allMembersData = Array.isArray(members) ? members : [];
        window.filteredMembersData = window.allMembersData;
        allMembersData = window.allMembersData;
        filteredMembersData = window.filteredMembersData;
        
        console.log('🔵🔵🔵 데이터 저장 완료');
        console.log('window.allMembersData:', window.allMembersData);
        console.log('window.allMembersData.length:', window.allMembersData.length);
        console.log('window.filteredMembersData:', window.filteredMembersData);
        console.log('window.filteredMembersData.length:', window.filteredMembersData.length);
        
        // 총 회원 수 업데이트
        updateTotalMemberCount(window.allMembersData.length);
        console.log('✅ 총 회원 수 업데이트:', window.allMembersData.length);
        
        // 첫 페이지로 리셋
        window.currentMemberPage = 1;
        currentMemberPage = 1;
        console.log('✅ 현재 페이지 리셋:', currentMemberPage);
        
        // 테이블 렌더링 (window.filteredMembersData 사용)
        console.log('🔵🔵🔵 테이블 렌더링 시작');
        renderMemberInfoTable();
        console.log('✅✅✅ 회원정보 테이블 렌더링 완료!');
        
    } catch (error) {
        console.error('❌ 회원 데이터 로드 오류:', error);
        console.error('오류 상세:', error.message, error.stack);
        
        const tbody = document.getElementById('memberTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="13" class="empty-message">오류 발생: ${error.message}</td></tr>`;
        }
    }
}

// 전역 함수로 export
window.loadAllMembers = loadAllMembers;

// 테스트 함수 - 콘솔에서 직접 호출 가능
window.testFirestoreMembers = async function() {
    console.log('🔵 테스트: Firestore members 컬렉션 직접 접근');
    
    try {
        // Firebase 확인
        if (!window.firebaseAdmin) {
            console.error('❌ window.firebaseAdmin이 없습니다!');
            return;
        }
        
        console.log('✅ window.firebaseAdmin 존재:', window.firebaseAdmin);
        
        // DB 초기화
        if (!window.firebaseAdmin.db) {
            console.log('DB 초기화 중...');
            await window.firebaseAdmin.initFirebase();
        }
        
        if (!window.firebaseAdmin.db) {
            console.error('❌ DB 초기화 실패!');
            return;
        }
        
        console.log('✅ DB 초기화 완료:', window.firebaseAdmin.db);
        
        // 직접 members 컬렉션 접근
        console.log('members 컬렉션 직접 접근 시도...');
        const membersRef = window.firebaseAdmin.db.collection('members');
        console.log('members 컬렉션 참조:', membersRef);
        
        const snapshot = await membersRef.get();
        console.log('✅ Firestore 쿼리 완료!');
        console.log('문서 개수:', snapshot.docs.length);
        console.log('빈 컬렉션 여부:', snapshot.empty);
        
        if (snapshot.empty) {
            console.warn('⚠️ members 컬렉션이 비어있습니다.');
        } else {
            console.log('첫 번째 문서:', snapshot.docs[0].id, snapshot.docs[0].data());
            const allMembers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('전체 회원 데이터:', allMembers);
            
            // 테이블에 표시
            allMembersData = allMembers;
            filteredMembersData = allMembers;
            updateTotalMemberCount(allMembers.length);
            renderMemberInfoTable();
            console.log('✅ 테이블 업데이트 완료!');
        }
        
    } catch (error) {
        console.error('❌ 테스트 실패:', error);
        console.error('오류 메시지:', error.message);
        console.error('오류 코드:', error.code);
        console.error('오류 스택:', error.stack);
    }
};

// 총 회원 수 업데이트
function updateTotalMemberCount(count) {
    const totalCountEl = document.getElementById('totalMemberCount');
    if (totalCountEl) {
        totalCountEl.textContent = count;
    }
}

// 회원정보 테이블 렌더링 (새로운 구조)
function renderMemberInfoTable(data = null) {
    console.log('🔵🔵🔵 renderMemberInfoTable 호출됨');
    console.log('전달된 data:', data);
    console.log('filteredMembersData:', filteredMembersData);
    console.log('filteredMembersData 타입:', typeof filteredMembersData);
    console.log('filteredMembersData 배열 여부:', Array.isArray(filteredMembersData));
    console.log('filteredMembersData.length:', filteredMembersData?.length || 0);
    console.log('allMembersData:', allMembersData);
    console.log('allMembersData.length:', allMembersData?.length || 0);
    
    const tbody = document.getElementById('memberTableBody');
    if (!tbody) {
        console.error('❌❌❌ memberTableBody를 찾을 수 없습니다!');
        console.error('HTML에 id="memberTableBody"가 있는지 확인하세요.');
        return;
    }
    
    console.log('✅ memberTableBody 찾음');
    
    // 데이터가 없으면 필터링된 데이터 사용 (전역 변수 우선)
    // window.filteredMembersData를 명시적으로 확인
    let membersToRender;
    if (data !== null && Array.isArray(data) && data.length > 0) {
        membersToRender = data;
        console.log('🔵 전달된 data 사용:', data.length, '명');
    } else if (window.filteredMembersData && Array.isArray(window.filteredMembersData) && window.filteredMembersData.length > 0) {
        membersToRender = window.filteredMembersData;
        console.log('🔵 window.filteredMembersData 사용:', window.filteredMembersData.length, '명');
    } else if (filteredMembersData && Array.isArray(filteredMembersData) && filteredMembersData.length > 0) {
        membersToRender = filteredMembersData;
        console.log('🔵 로컬 filteredMembersData 사용:', filteredMembersData.length, '명');
    } else {
        membersToRender = [];
        console.log('🔵 모든 데이터 소스가 비어있음');
    }
    
    console.log('🔵🔵🔵 렌더링할 회원 데이터 확인');
    console.log('membersToRender:', membersToRender);
    console.log('membersToRender 타입:', typeof membersToRender);
    console.log('membersToRender 배열 여부:', Array.isArray(membersToRender));
    console.log('membersToRender.length:', membersToRender?.length || 0);
    
    if (!membersToRender || !Array.isArray(membersToRender) || membersToRender.length === 0) {
        console.warn('⚠️⚠️⚠️ 렌더링할 회원 데이터가 없습니다!');
        console.log('membersToRender 값:', membersToRender);
        console.log('membersToRender 타입:', typeof membersToRender);
        console.log('Firestore Console에서 members 컬렉션에 데이터가 있는지 확인하세요.');
        tbody.innerHTML = '<tr><td colspan="13" class="empty-message">등록된 회원이 없습니다. Firestore Console에서 members 컬렉션을 확인하세요.</td></tr>';
        renderMemberPagination(0);
        return;
    }
    
    console.log('✅✅✅ 렌더링할 데이터 있음:', membersToRender.length, '명');
    
    // 페이지네이션 계산
    const totalPages = Math.ceil(membersToRender.length / membersPerPage);
    const startIndex = (currentMemberPage - 1) * membersPerPage;
    const endIndex = startIndex + membersPerPage;
    const pageMembers = membersToRender.slice(startIndex, endIndex);
    
    console.log(`페이지 ${currentMemberPage}/${totalPages} 렌더링: ${pageMembers.length}명`);
    console.log('현재 페이지 회원 데이터:', pageMembers);
    
    try {
        const tableHTML = pageMembers.map((member, index) => {
        // Firestore 데이터 형식에 맞게 변환
        const memberId = member.userId || member.id || '';
        const name = member.name || '';
        const phone = member.phone || '';
        
        // 가입일 처리
        let joinDate = '';
        if (member.joinDate) {
            joinDate = member.joinDate;
        } else if (member.createdAt) {
            if (member.createdAt.seconds) {
                const date = new Date(member.createdAt.seconds * 1000);
                joinDate = date.toISOString().replace('T', ' ').substring(0, 19);
            } else if (member.createdAt.toDate) {
                const date = member.createdAt.toDate();
                joinDate = date.toISOString().replace('T', ' ').substring(0, 19);
            }
        }
        
        // 주소 (postcode + address + detailAddress)
        const address = [member.postcode, member.address, member.detailAddress]
            .filter(Boolean)
            .join(' ') || '';
        
        // 은행 / 계좌번호 (마이페이지에서 입력)
        const bank = member.bank || '';
        const accountNumber = member.accountNumber || '';
        
        // 추천인 코드 (referralCode 우선)
        const referralCode = member.referralCode || member.recommender || '';
        
        // 구매금액 (현재는 없음, 추후 추가 가능)
        const purchaseAmount = member.purchaseAmount || 0;
        
        // 지원금/누적 (현재는 없음, 추후 추가 가능)
        const supportAmount = member.supportAmount || 0;
        const accumulatedSupport = member.accumulatedSupport || 0;
        
        // 상태 (withdrawn → 탈퇴 표시)
        const status = member.status || '정상';
        const statusDisplay = status === 'withdrawn' ? '탈퇴' : status;
        const statusCell = status === 'withdrawn'
            ? `<span class="badge badge-secondary">탈퇴</span>`
            : `<select class="status-select" onchange="changeMemberStatus('${member.id || memberId}', this.value)">
                        <option value="정상" ${status === '정상' ? 'selected' : ''}>정상</option>
                        <option value="대기" ${status === '대기' ? 'selected' : ''}>대기</option>
                        <option value="정지" ${status === '정지' ? 'selected' : ''}>정지</option>
                    </select>`;

        return `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td>${escapeHtml(memberId)}</td>
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(phone)}</td>
                <td>${escapeHtml(joinDate)}</td>
                <td>${escapeHtml(address)}</td>
                <td>${escapeHtml(bank)}</td>
                <td>${escapeHtml(accountNumber)}</td>
                <td>${escapeHtml(referralCode)}</td>
                <td>${purchaseAmount.toLocaleString()}</td>
                <td>${supportAmount.toLocaleString()} / ${accumulatedSupport.toLocaleString()}</td>
                <td>${statusCell}</td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editMemberInfo('${member.id || memberId}')" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteMemberInfo('${member.id || memberId}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        }).join('');
        
        console.log('테이블 HTML 생성 완료, 길이:', tableHTML.length);
        tbody.innerHTML = tableHTML;
        console.log('✅ 테이블 렌더링 완료');
        
        // 페이지네이션 렌더링
        renderMemberPagination(membersToRender.length);
    } catch (error) {
        console.error('❌ 테이블 렌더링 중 오류:', error);
        console.error('오류 상세:', error.message, error.stack);
        tbody.innerHTML = `<tr><td colspan="13" class="empty-message">테이블 렌더링 오류: ${error.message}</td></tr>`;
    }
}

// HTML 이스케이프 함수
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (m) => {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return map[m];
    });
}

// 페이지네이션 렌더링
function renderMemberPagination(totalMembers) {
    const paginationEl = document.getElementById('memberPagination');
    if (!paginationEl) return;
    
    const totalPages = Math.ceil(totalMembers / membersPerPage);
    
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 이전 버튼
    paginationHTML += `<button class="page-btn" ${currentMemberPage === 1 ? 'disabled' : ''} onclick="changeMemberPage(${currentMemberPage - 1})">
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    // 페이지 번호
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentMemberPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="page-num ${i === currentMemberPage ? 'active' : ''}" onclick="changeMemberPage(${i})">${i}</button>`;
    }
    
    // 다음 버튼
    paginationHTML += `<button class="page-btn" ${currentMemberPage === totalPages ? 'disabled' : ''} onclick="changeMemberPage(${currentMemberPage + 1})">
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    paginationEl.innerHTML = paginationHTML;
}

// 페이지 변경
function changeMemberPage(page) {
    const totalPages = Math.ceil(filteredMembersData.length / membersPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentMemberPage = page;
    renderMemberInfoTable();
    
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 전역 함수로 export (member-search.js의 함수를 사용)
// window.searchMemberInfo는 member-search.js에서 export됨
// window.resetMemberSearch는 member-search.js에서 export됨
// window.editMemberInfo는 member-search.js에서 export됨
// window.deleteMemberInfo는 member-search.js에서 export됨
window.changeMemberPage = changeMemberPage;

function renderMemberTable(data) {
    const tbody = document.getElementById('memberSearchBody');
    if (!tbody) {
        console.warn('memberSearchBody를 찾을 수 없습니다.');
        return;
    }

    // 데이터가 없거나 빈 배열인 경우
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-message">등록된 회원이 없습니다.</td></tr>';
        console.log('회원 데이터가 없습니다. 빈 테이블 표시.');
        return;
    }

    console.log('회원 테이블 렌더링:', data.length, '명');
    
    tbody.innerHTML = data.map((member, index) => {
        // Firestore 데이터 형식에 맞게 변환
        const memberId = member.id || member.userId || '';
        const name = member.name || '';
        const phone = member.phone || '';
        
        // 가입일 처리 (Firestore Timestamp 또는 문자열)
        let joinDate = '';
        if (member.joinDate) {
            joinDate = member.joinDate;
        } else if (member.createdAt) {
            if (member.createdAt.seconds) {
                // Firestore Timestamp
                joinDate = new Date(member.createdAt.seconds * 1000).toISOString().split('T')[0];
            } else if (member.createdAt.toDate) {
                // Firestore Timestamp 객체
                joinDate = member.createdAt.toDate().toISOString().split('T')[0];
            } else {
                // 문자열 또는 Date 객체
                joinDate = new Date(member.createdAt).toISOString().split('T')[0];
            }
        }
        
        const recommender = member.recommender || member.recommenderId || '';
        const status = member.status || '정상';
        const statusDisplay = status === 'withdrawn' ? '탈퇴' : status;
        const statusBadgeClass = status === 'withdrawn' ? 'badge-secondary' : (status === '정상' ? 'badge-success' : 'badge-danger');

        // XSS 방지를 위한 이스케이프 (간단한 버전)
        const escapeHtml = (str) => {
            if (!str) return '';
            return String(str).replace(/[&<>"']/g, (m) => {
                const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
                return map[m];
            });
        };

        return `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(memberId)}</td>
            <td>${escapeHtml(name)}</td>
            <td>${escapeHtml(phone)}</td>
            <td>${escapeHtml(joinDate)}</td>
            <td>${escapeHtml(recommender)}</td>
            <td><span class="badge ${statusBadgeClass}">${escapeHtml(statusDisplay)}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editMember('${member.id || memberId}')">수정</button>
                <button class="btn btn-sm btn-secondary" onclick="deleteMember('${member.id || memberId}')">삭제</button>
            </td>
        </tr>
    `;
    }).join('');
}

async function editMember(memberId) {
    try {
        // Firestore에서 회원 정보 가져오기
        const members = await window.firebaseAdmin.memberService.getMembers();
        const member = members.find(m => m.id === memberId || m.userId === memberId);
        
        if (member) {
            // 수정 모달 열기 (추후 구현)
            const newName = prompt('이름을 입력하세요:', member.name);
            if (newName) {
                await window.firebaseAdmin.memberService.updateMember(memberId, {
                    name: newName
                });
                alert('회원 정보가 수정되었습니다.');
                searchMembers(); // 목록 새로고침
            }
        } else {
            alert(`${memberId} 회원을 찾을 수 없습니다.`);
        }
    } catch (error) {
        console.error('회원 수정 오류:', error);
        alert('회원 정보 수정 중 오류가 발생했습니다.');
    }
}

async function deleteMember(memberId) {
    if (confirm('회원을 삭제하시겠습니까?')) {
        try {
            await window.firebaseAdmin.memberService.deleteMember(memberId);
            alert('삭제되었습니다.');
            searchMembers(); // 목록 새로고침
        } catch (error) {
            console.error('회원 삭제 오류:', error);
            alert('회원 삭제 중 오류가 발생했습니다.');
        }
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
    console.log('navigateToPage 호출:', pageId);
    // switchToPage 함수 사용
    switchToPage(pageId);
}

// ============================================
// 게시판 관리
// ============================================
const BOARD_TYPE_LABELS = { notice: '공지사항', event: '이벤트', qna: 'Q&A', review: '상품후기' };

function getCurrentBoardType() {
    var active = document.querySelector('#board-manage .board-tab.active');
    return (active && active.getAttribute('data-board-type')) || 'notice';
}

function getBoardFilters() {
    return {
        keyword: (document.getElementById('boardSearchKeyword') && document.getElementById('boardSearchKeyword').value) || '',
        author: (document.getElementById('boardSearchAuthor') && document.getElementById('boardSearchAuthor').value) || '',
        startDate: (document.getElementById('boardSearchStartDate') && document.getElementById('boardSearchStartDate').value) || '',
        endDate: (document.getElementById('boardSearchEndDate') && document.getElementById('boardSearchEndDate').value) || ''
    };
}

async function loadBoardPosts(boardType) {
    window._currentBoardType = boardType;
    var tbody = document.getElementById('boardTableBody');
    var infoText = document.getElementById('boardInfoText');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="empty-message">조회 중...</td></tr>';
    try {
        await window.firebaseAdmin.getInitPromise();
        var filters = getBoardFilters();
        var list = await window.firebaseAdmin.boardService.getPosts(boardType, filters);
        window._boardPostsList = list;
        renderBoardTable(list, boardType);
        if (infoText) infoText.textContent = '총 ' + (list.length) + '개의 게시글이 있습니다.';
    } catch (error) {
        console.error('게시판 로드 오류:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">목록을 불러오지 못했습니다.</td></tr>';
        if (infoText) infoText.textContent = '총 0개의 게시글이 있습니다.';
    }
}

function formatBoardDate(createdAt) {
    if (!createdAt) return '-';
    var ts = createdAt.seconds != null ? createdAt.seconds * 1000 : (createdAt.getTime ? createdAt.getTime() : 0);
    if (!ts) return '-';
    var d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function renderBoardTable(list, boardType) {
    var tbody = document.getElementById('boardTableBody');
    var infoText = document.getElementById('boardInfoText');
    if (!tbody) return;
    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">등록된 게시글이 없습니다.</td></tr>';
        if (infoText) infoText.textContent = '총 0개의 게시글이 있습니다.';
        return;
    }
    var html = '';
    list.forEach(function (p, idx) {
        var numCell = p.isNotice ? '<span class="badge badge-danger">공지</span>' : (list.length - idx);
        var title = (p.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var author = (p.authorName || '-').replace(/</g, '&lt;');
        var date = formatBoardDate(p.createdAt);
        var viewCount = (p.viewCount != null ? p.viewCount : 0).toLocaleString();
        var statusBadge = (p.status === 'draft') ? '<span class="badge badge-warning">임시저장</span>' : '<span class="badge badge-success">게시중</span>';
        html += '<tr data-post-id="' + (p.id || '') + '">' +
            '<td>' + numCell + '</td>' +
            '<td style="text-align: left; padding-left: 15px;">' + title + '</td>' +
            '<td>' + author + '</td>' +
            '<td>' + date + '</td>' +
            '<td>' + viewCount + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td><button type="button" class="btn btn-sm btn-primary btn-board-edit">수정</button> <button type="button" class="btn btn-sm btn-secondary btn-board-delete">삭제</button></td>' +
            '</tr>';
    });
    tbody.innerHTML = html;
    if (infoText) infoText.textContent = '총 ' + list.length + '개의 게시글이 있습니다.';
}

function switchBoardTab(boardType) {
    document.querySelectorAll('#board-manage .board-tab').forEach(function (tab) {
        tab.classList.toggle('active', tab.getAttribute('data-board-type') === boardType);
    });
    loadBoardPosts(boardType);
}

function openBoardPostModal(editId, boardType) {
    boardType = boardType || getCurrentBoardType();
    var modal = document.getElementById('boardPostModal');
    var titleEl = document.getElementById('boardPostModalTitle');
    var idEl = document.getElementById('boardPostId');
    var titleInput = document.getElementById('boardPostTitle');
    var authorInput = document.getElementById('boardPostAuthor');
    var contentInput = document.getElementById('boardPostContent');
    var statusSelect = document.getElementById('boardPostStatus');
    var noticeWrap = document.getElementById('boardPostNoticeWrap');
    var noticeCheck = document.getElementById('boardPostIsNotice');
    if (!modal || !titleEl || !idEl || !titleInput) return;
    idEl.value = editId || '';
    if (editId && window._boardPostsList) {
        var post = window._boardPostsList.find(function (p) { return p.id === editId; });
        if (post) {
            titleEl.textContent = '글 수정';
            titleInput.value = post.title || '';
            authorInput.value = post.authorName || '관리자';
            contentInput.value = post.content || '';
            statusSelect.value = post.status === 'draft' ? 'draft' : 'published';
            noticeCheck.checked = post.isNotice === true;
        } else {
            titleEl.textContent = '글 수정';
            titleInput.value = '';
            authorInput.value = '관리자';
            contentInput.value = '';
            statusSelect.value = 'published';
            noticeCheck.checked = false;
        }
    } else {
        titleEl.textContent = '글 작성';
        titleInput.value = '';
        authorInput.value = '관리자';
        contentInput.value = '';
        statusSelect.value = 'published';
        noticeCheck.checked = false;
    }
    noticeWrap.style.display = (boardType === 'notice') ? 'block' : 'none';
    modal.style.display = 'flex';
}

function closeBoardPostModal() {
    var modal = document.getElementById('boardPostModal');
    if (modal) modal.style.display = 'none';
}

async function saveBoardPost() {
    var idEl = document.getElementById('boardPostId');
    var titleInput = document.getElementById('boardPostTitle');
    var authorInput = document.getElementById('boardPostAuthor');
    var contentInput = document.getElementById('boardPostContent');
    var statusSelect = document.getElementById('boardPostStatus');
    var noticeCheck = document.getElementById('boardPostIsNotice');
    var postId = (idEl && idEl.value) || '';
    var boardType = getCurrentBoardType();
    var title = (titleInput && titleInput.value) ? titleInput.value.trim() : '';
    if (!title) {
        alert('제목을 입력해 주세요.');
        return;
    }
    try {
        await window.firebaseAdmin.getInitPromise();
        if (postId) {
            await window.firebaseAdmin.boardService.updatePost(postId, {
                title: title,
                authorName: (authorInput && authorInput.value) ? authorInput.value.trim() : '관리자',
                content: (contentInput && contentInput.value) ? contentInput.value : '',
                status: (statusSelect && statusSelect.value) || 'published',
                isNotice: (noticeCheck && noticeCheck.checked) || false
            });
            alert('수정되었습니다.');
        } else {
            await window.firebaseAdmin.boardService.addPost({
                boardType: boardType,
                title: title,
                authorName: (authorInput && authorInput.value) ? authorInput.value.trim() : '관리자',
                content: (contentInput && contentInput.value) ? contentInput.value : '',
                status: (statusSelect && statusSelect.value) || 'published',
                isNotice: (noticeCheck && noticeCheck.checked) || false
            });
            alert('등록되었습니다.');
        }
        closeBoardPostModal();
        loadBoardPosts(boardType);
    } catch (error) {
        console.error('게시글 저장 오류:', error);
        alert('저장에 실패했습니다.');
    }
}

async function deleteBoardPost(postId) {
    if (!postId || !confirm('이 게시글을 삭제하시겠습니까?')) return;
    try {
        await window.firebaseAdmin.getInitPromise();
        await window.firebaseAdmin.boardService.deletePost(postId);
        alert('삭제되었습니다.');
        loadBoardPosts(getCurrentBoardType());
    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        alert('삭제에 실패했습니다.');
    }
}

// ============================================
// navigateToPage 함수 - switchToPage로 통일
// ============================================
function navigateToPage(pageId) {
    console.log('navigateToPage 호출:', pageId);
    switchToPage(pageId);
}

// ============================================
// ============================================
// 상품 데이터 (샘플)
// ============================================
const PRODUCT_DATA = [
    { id: 1, name: '메가커피 모바일금액권 3만원', category: 'coffee', price: 30000, stock: 999, status: 'sale', image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23FF6B6B" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="14"%3E커피%3C/text%3E%3C/svg%3E', date: '2026-01-15' },
    { id: 2, name: '스타벅스 아메리카노 Tall', category: 'coffee', price: 4500, stock: 999, status: 'sale', image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%234ECDC4" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="14"%3E스벅%3C/text%3E%3C/svg%3E', date: '2026-01-18' },
    { id: 3, name: '배스킨라빈스 파인트 아이스크림', category: 'food', price: 15000, stock: 50, status: 'sale', image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23FFD93D" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="black" font-size="12"%3E아이스크림%3C/text%3E%3C/svg%3E', date: '2026-01-20' },
    { id: 4, name: 'CU 편의점 모바일상품권 1만원', category: 'life', price: 10000, stock: 999, status: 'sale', image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%236BCB77" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="14"%3ECU%3C/text%3E%3C/svg%3E', date: '2026-01-22' },
    { id: 5, name: 'GS25 모바일상품권 1만원', category: 'life', price: 10000, stock: 999, status: 'sale', image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%234D96FF" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="14"%3EGS25%3C/text%3E%3C/svg%3E', date: '2026-01-25' },
    { id: 6, name: '설화수 윤조에센스 60ml', category: 'beauty', price: 85000, stock: 20, status: 'sale', image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23FF6BA9" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="14"%3E뷰티%3C/text%3E%3C/svg%3E', date: '2026-01-28' },
    { id: 7, name: '나이키 에어포스 운동화', category: 'fashion', price: 129000, stock: 0, status: 'soldout', image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%2395E1D3" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="black" font-size="14"%3E신발%3C/text%3E%3C/svg%3E', date: '2026-02-01' },
    { id: 8, name: '다이슨 헤어드라이어', category: 'beauty', price: 450000, stock: 5, status: 'sale', image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23F38181" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="14"%3E가전%3C/text%3E%3C/svg%3E', date: '2026-02-02' },
];

// ============================================
// 상품 목록 조회 (Firestore 연동)
// ============================================
async function searchProducts() {
    const name = document.getElementById('productSearchName')?.value.toLowerCase() || '';
    const category = document.getElementById('productSearchCategory')?.value || '';
    const status = document.getElementById('productSearchStatus')?.value || '';

    try {
        const filters = {};
        if (status) filters.status = status;
        if (category) filters.category = category;
        
        const products = await window.firebaseAdmin.productService.getProducts(filters);
        
        // 클라이언트 측 필터링
        const filtered = products.filter(product => {
            const matchName = !name || (product.name || '').toLowerCase().includes(name);
            const matchCategory = !category || product.category === category;
            const matchStatus = !status || product.status === status;
            return matchName && matchCategory && matchStatus;
        });

        await renderProductTable(filtered);
    } catch (error) {
        console.error('상품 검색 오류:', error);
        const filtered = PRODUCT_DATA.filter(product => {
            const matchName = !name || product.name.toLowerCase().includes(name);
            const matchCategory = !category || product.category === category;
            const matchStatus = !status || product.status === status;
            return matchName && matchCategory && matchStatus;
        });
        await renderProductTable(filtered);
    }
}

async function resetProductSearch() {
    document.getElementById('productSearchName').value = '';
    document.getElementById('productSearchCategory').value = '';
    document.getElementById('productSearchStatus').value = '';
    
    try {
        const products = await window.firebaseAdmin.productService.getProducts();
        await renderProductTable(products);
    } catch (error) {
        console.error('상품 목록 로드 오류:', error);
        await renderProductTable(PRODUCT_DATA);
    }
}

async function renderProductTable(data) {
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

    let categoryMap = {};
    try {
        const categories = await loadCategoriesForProduct();
        categories.forEach(c => {
            categoryMap[c.id] = c.name || c.id;
        });
    } catch (e) {
        console.warn('카테고리 로드 실패, ID로 표시:', e);
    }

    tbody.innerHTML = data.map((product, index) => {
        const productId = product.id || `product-${index}`;
        const name = product.name || '';
        const image = product.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect fill="%23cccccc" width="50" height="50"/%3E%3C/svg%3E';
        const category = categoryMap[product.category] || product.category || '';
        const price = product.price || 0;
        const stock = product.stock || 0;
        const status = product.status || 'sale';
        const date = product.date || (product.createdAt ? new Date(product.createdAt.seconds * 1000).toISOString().split('T')[0] : '');
        
        return `
        <tr>
            <td>${index + 1}</td>
            <td><img src="${image}" alt="${name}" class="product-image"></td>
            <td style="text-align: left; padding-left: 15px;">${name}</td>
            <td>${category}</td>
            <td>${price.toLocaleString()}원</td>
            <td>${stock}</td>
            <td><span class="badge ${statusMap[status]?.class || 'badge-success'}">${statusMap[status]?.text || status}</span></td>
            <td>${date}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editProduct('${productId}')">수정</button>
                <button class="btn btn-sm btn-secondary" onclick="deleteProduct('${productId}')">삭제</button>
            </td>
        </tr>
    `;
    }).join('');
}

async function editProduct(productId) {
    try {
        const products = await window.firebaseAdmin.productService.getProducts();
        const product = products.find(p => p.id === productId);
        
        if (product) {
            const newName = prompt('상품명을 입력하세요:', product.name);
            if (newName) {
                await window.firebaseAdmin.productService.updateProduct(productId, {
                    name: newName
                });
                alert('상품 정보가 수정되었습니다.');
                searchProducts();
            }
        } else {
            alert('상품을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('상품 수정 오류:', error);
        alert('상품 정보 수정 중 오류가 발생했습니다.');
    }
}

async function deleteProduct(productId) {
    if (confirm('정말 삭제하시겠습니까?')) {
        try {
            await window.firebaseAdmin.productService.deleteProduct(productId);
            alert('삭제되었습니다.');
            searchProducts();
        } catch (error) {
            console.error('상품 삭제 오류:', error);
            alert('상품 삭제 중 오류가 발생했습니다.');
        }
    }
}

// ============================================
// 상품 등록 (Firestore 연동)
// ============================================
// 상세 설명 항목 추가/삭제 함수
let detailRowCounter = 0;

function addDetailRow() {
    detailRowCounter++;
    const container = document.getElementById('detailRowsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'detail-row';
    newRow.setAttribute('data-row-id', detailRowCounter);
    newRow.innerHTML = `
        <div class="detail-row-inputs">
            <div class="form-group" style="flex: 1; margin: 0;">
                <input type="text" class="form-control" name="detailTitle[]" placeholder="항목명 (예: 표장단위별 용량)">
            </div>
            <div class="form-group" style="flex: 1; margin: 0;">
                <input type="text" class="form-control" name="detailContent[]" placeholder="내용 (예: 5KG)">
            </div>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeDetailRow(${detailRowCounter})" style="flex-shrink: 0;">
                <i class="fas fa-minus"></i>
            </button>
        </div>
    `;
    container.appendChild(newRow);
}

function removeDetailRow(rowId) {
    const row = document.querySelector(`[data-row-id="${rowId}"]`);
    if (row) {
        row.remove();
    }
}

// 상품 선택 옵션 행 추가/삭제
let productOptionRowCounter = 0;
function addProductOptionRow() {
    productOptionRowCounter++;
    const container = document.getElementById('productOptionsContainer');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'product-option-row';
    row.setAttribute('data-option-id', productOptionRowCounter);
    row.innerHTML = '<input type="text" class="form-control" name="optionLabel[]" placeholder="옵션명 (예: 기본)" style="max-width: 200px;">' +
        '<input type="number" class="form-control" name="optionPrice[]" placeholder="가격" style="max-width: 120px;"> 원' +
        '<button type="button" class="btn btn-sm btn-danger btn-remove-option"><i class="fas fa-minus"></i></button>';
    container.appendChild(row);
}
function initProductOptionButtons() {
    const btnAdd = document.getElementById('btnAddProductOption');
    if (btnAdd) btnAdd.onclick = addProductOptionRow;
    const container = document.getElementById('productOptionsContainer');
    if (container) {
        container.addEventListener('click', function (e) {
            if (e.target.closest('.btn-remove-option')) {
                const row = e.target.closest('.product-option-row');
                if (row && container.querySelectorAll('.product-option-row').length > 1) row.remove();
            }
        });
    }
}

// 상세 이미지 업로드 추가/삭제 함수
let detailImageUploadCounter = 0;

function addDetailImageUpload() {
    detailImageUploadCounter++;
    const container = document.getElementById('detailImagesContainer');
    
    // 버튼 div 찾기 (flex-direction: column 스타일을 가진 div)
    const allDivs = container.querySelectorAll('div');
    let buttonsDiv = null;
    for (const div of allDivs) {
        const style = div.getAttribute('style');
        if (style && style.includes('flex-direction: column')) {
            buttonsDiv = div;
            break;
        }
    }
    
    const newUpload = document.createElement('div');
    newUpload.className = 'detail-image-upload';
    newUpload.setAttribute('data-image-id', detailImageUploadCounter);
    newUpload.innerHTML = `
        <div class="image-upload-box small">
            <input type="file" id="detailImage${detailImageUploadCounter}" name="detailImages[]" accept="image/*" onchange="previewDetailImage(event, ${detailImageUploadCounter})" hidden>
            <label for="detailImage${detailImageUploadCounter}" class="upload-label">
                <div id="detailImagePreview${detailImageUploadCounter}" class="image-preview">
                    <i class="fas fa-plus"></i>
                </div>
            </label>
        </div>
    `;
    
    // 버튼 바로 앞에 삽입
    if (buttonsDiv) {
        container.insertBefore(newUpload, buttonsDiv);
    } else {
        container.appendChild(newUpload);
    }
}

function removeLastDetailImageUpload() {
    const container = document.getElementById('detailImagesContainer');
    const uploads = container.querySelectorAll('.detail-image-upload');
    
    // 최소 1개는 남겨두기
    if (uploads.length > 1) {
        const lastUpload = uploads[uploads.length - 1];
        lastUpload.remove();
    } else {
        alert('최소 1개의 이미지 업로드 칸은 유지되어야 합니다.');
    }
}

// 대표 이미지 미리보기
function previewMainImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('mainImagePreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="대표 이미지">`;
        };
        reader.readAsDataURL(file);
    }
}

// 상세 이미지 미리보기
function previewDetailImage(event, imageId) {
    const file = event.target.files[0];
    const preview = document.getElementById(`detailImagePreview${imageId}`);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="상세 이미지">`;
        };
        reader.readAsDataURL(file);
    }
}

// 파일을 Base64로 변환하는 함수
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function registerProduct(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        // 상세 설명 항목 수집
        const detailTitles = formData.getAll('detailTitle[]');
        const detailContents = formData.getAll('detailContent[]');
        const details = [];
        
        for (let i = 0; i < detailTitles.length; i++) {
            if (detailTitles[i].trim() && detailContents[i].trim()) {
                details.push({
                    title: detailTitles[i].trim(),
                    content: detailContents[i].trim()
                });
            }
        }
        
        // 대표 이미지 처리
        const mainImageFile = formData.get('mainImage');
        let mainImageUrl = '';
        if (mainImageFile && mainImageFile.size > 0) {
            mainImageUrl = await fileToBase64(mainImageFile);
        }
        
        // 상세 이미지 처리
        const detailImageFiles = formData.getAll('detailImages[]');
        const detailImageUrls = [];
        for (const file of detailImageFiles) {
            if (file && file.size > 0) {
                const base64 = await fileToBase64(file);
                detailImageUrls.push(base64);
            }
        }
        
        // 분류 체크박스 값 수집 (배열)
        const displayCategories = formData.getAll('displayCategory');
        
        // 선택 옵션 수집 (옵션명, 가격)
        const optionLabels = formData.getAll('optionLabel[]');
        const optionPrices = formData.getAll('optionPrice[]');
        const options = [];
        for (let i = 0; i < optionLabels.length; i++) {
            const label = (optionLabels[i] || '').trim();
            const price = parseInt(optionPrices[i], 10);
            if (label || (price != null && !isNaN(price))) {
                options.push({
                    label: label || '옵션' + (i + 1),
                    price: !isNaN(price) ? price : 0
                });
            }
        }
        
        // 숫자 필드 변환
        const productData = {
            name: data.productName,
            displayCategory: displayCategories.length > 0 ? displayCategories : ['all'], // 분류 배열로 저장
            category: data.category,
            price: parseInt(data.salePrice) || 0,
            options: options,
            stock: parseInt(data.stock) || 0,
            status: data.status || 'sale',
            description: data.description || '',
            details: details, // 상세 설명 항목 추가
            mainImageUrl: mainImageUrl, // 대표 이미지
            detailImageUrls: detailImageUrls, // 상세 이미지들
            imageUrl: mainImageUrl, // 하위 호환성
            brand: data.brand || '',
            shortDesc: data.shortDesc || '',
            originalPrice: parseInt(data.originalPrice) || 0,
            discountRate: parseInt(data.discountRate) || 0,
            supportRate: parseInt(data.supportRate) || 5,
            minOrder: parseInt(data.minOrder) || 1,
            maxOrder: parseInt(data.maxOrder) || 10,
            deliveryFee: parseInt(data.deliveryFee) || 0,
            deliveryMethod: data.deliveryMethod || 'parcel',
            deliveryDays: data.deliveryDays || '2-3일',
            freeDeliveryAmount: parseInt(data.freeDeliveryAmount) || 0,
            isNew: data.isNew === 'on',
            isBest: data.isBest === 'on',
            isRecommended: data.isRecommended === 'on',
            createdAt: new Date()
        };
        
        await window.firebaseAdmin.productService.addProduct(productData);
        alert('상품이 등록되었습니다!');
        
        // 폼 초기화
        event.target.reset();
        
        // 이미지 미리보기 초기화
        document.getElementById('mainImagePreview').innerHTML = `
            <i class="fas fa-cloud-upload-alt fa-3x"></i>
            <p>클릭하여 이미지 업로드</p>
            <small>권장 크기: 600x600px (JPG, PNG)</small>
        `;
        
        // 상세 설명 항목 초기화 (첫 번째 행만 남기기)
        const detailContainer = document.getElementById('detailRowsContainer');
        const detailRows = detailContainer.querySelectorAll('.detail-row');
        detailRows.forEach((row, index) => {
            if (index > 0) {
                row.remove();
            } else {
                row.querySelectorAll('input').forEach(input => input.value = '');
            }
        });
        detailRowCounter = 0;
        
        // 상세 이미지 항목 초기화 (첫 번째 행만 남기기)
        const imageContainer = document.getElementById('detailImagesContainer');
        const imageUploads = imageContainer.querySelectorAll('.detail-image-upload');
        imageUploads.forEach((upload, index) => {
            if (index > 0) {
                upload.remove();
            } else {
                const preview = upload.querySelector('.image-preview');
                if (preview) {
                    preview.innerHTML = '<i class="fas fa-plus"></i>';
                }
            }
        });
        detailImageUploadCounter = 0;
        
        // 선택 옵션 초기화 (첫 번째 행만 남기기)
        const optionsContainer = document.getElementById('productOptionsContainer');
        if (optionsContainer) {
            const optionRows = optionsContainer.querySelectorAll('.product-option-row');
            optionRows.forEach((row, index) => {
                if (index > 0) {
                    row.remove();
                } else {
                    row.querySelectorAll('input').forEach(input => { input.value = ''; });
                }
            });
        }
        
        // 상품 목록으로 이동
        const productListLink = document.querySelector('[data-page="product-list"]');
        if (productListLink) {
            productListLink.click();
        }
    } catch (error) {
        console.error('상품 등록 오류:', error);
        alert('상품 등록 중 오류가 발생했습니다: ' + error.message);
    }
}

// 전역으로 export
window.addDetailRow = addDetailRow;
window.removeDetailRow = removeDetailRow;
window.addDetailImageUpload = addDetailImageUpload;
window.removeLastDetailImageUpload = removeLastDetailImageUpload;
window.previewMainImage = previewMainImage;
window.previewDetailImage = previewDetailImage;

// ============================================
// 카테고리 관리
// ============================================
// 카테고리 관리 함수는 category-manage.js에서 처리됨
// showAddCategoryForm, resetCategoryForm, editCategory, deleteCategory, saveCategory 함수는 제거됨

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

// 추첨 대기 데이터 — 승인(approved)된 주문을 조별 추첨 명단으로 사용. loadLotteryWaitingData()에서 Firestore 기준으로 채움.
let LOTTERY_WAITING_DATA = {};
window.LOTTERY_PRODUCTS = [];

let selectedProductId = null;
let currentRound = 1;

// 승인된 주문을 조별 추첨 대기 명단으로 로드 (구매요청에서 승인 시 여기로 넘어감)
async function loadLotteryWaitingData() {
    try {
        if (!window.firebaseAdmin || !window.firebaseAdmin.orderService || !window.firebaseAdmin.productService) return;
        const allOrders = await window.firebaseAdmin.orderService.getOrders({}) || [];
        const approved = allOrders.filter(function (o) { return o.status === 'approved'; });
        const products = await window.firebaseAdmin.productService.getProducts() || [];
        window.LOTTERY_PRODUCTS = Array.isArray(products) ? products : [];
        const byProduct = {};
        approved.forEach(function (order) {
            const pid = order.productId || 'unknown';
            if (!byProduct[pid]) byProduct[pid] = [];
            byProduct[pid].push({
                id: order.id,
                name: order.userName || order.name || '-',
                phone: order.phone || '-',
                amount: order.productPrice || 0,
                productSupport: order.supportAmount || 0,
                confirmed: true,
                date: _orderFormatDate(order.createdAt)
            });
        });
        LOTTERY_WAITING_DATA = byProduct;
        if (typeof renderLotteryStatus === 'function') renderLotteryStatus();
        if (selectedProductId && typeof renderWaitingList === 'function') renderWaitingList(selectedProductId);
    } catch (e) {
        console.error('추첨 대기 명단 로드 오류:', e);
    }
}

// 추첨 현황 카드 렌더링 (실제 상품 + 승인 주문 기준 대기 인원)
function renderLotteryStatus() {
    const container = document.querySelector('.lottery-status-grid');
    if (!container) return;

    const products = (window.LOTTERY_PRODUCTS && window.LOTTERY_PRODUCTS.length > 0)
        ? window.LOTTERY_PRODUCTS.map(function (p) {
            const waitingList = LOTTERY_WAITING_DATA[p.id] || [];
            const firstSupport = waitingList[0] ? (waitingList[0].productSupport || 0) : 0;
            return { id: p.id, name: p.name, price: p.price || 0, productSupport: firstSupport, waiting: waitingList.length };
        })
        : [];

    if (products.length === 0) {
        container.innerHTML = '<p class="empty-message">등록된 상품이 없거나, 승인된 구매가 없습니다. 구매 요청에서 승인하면 여기 명단에 올라옵니다.</p>';
        return;
    }

    container.innerHTML = products.map(function (product) {
        const groupSize = parseInt(document.getElementById('groupSize')?.value || 10);
        const winnerCount = parseInt(document.getElementById('winnerCount')?.value || 2);
        const canDraw = product.waiting >= groupSize;
        const progress = Math.min((product.waiting / groupSize) * 100, 100);
        
        // 당첨자 인원 × 상품 표기 지원금 = 총 지원금
        const totalSupport = product.productSupport * winnerCount;

        var safeId = (product.id || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return `
            <div class="lottery-product-card ${selectedProductId === product.id ? 'selected' : ''}" 
                 data-product-id="${safeId}" onclick="selectProduct(this.getAttribute('data-product-id'))">
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
                        <span class="info-value">${totalSupport.toLocaleString()}원</span>
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

    var productName = '상품';
    if (window.LOTTERY_PRODUCTS && window.LOTTERY_PRODUCTS.length > 0) {
        var p = window.LOTTERY_PRODUCTS.find(function (x) { return x.id === productId; });
        if (p && p.name) productName = p.name;
    }

    if (productNameEl) productNameEl.textContent = productName;
    if (countEl) countEl.textContent = `${waitingData.length}명 대기`;

    // 대기 목록에서 계산된 지원금 표시
    const groupSize = parseInt(document.getElementById('groupSize')?.value || 10);
    const winnerCount = parseInt(document.getElementById('winnerCount')?.value || 2);
    
    console.log('🔍 대기자 데이터 확인:', waitingData[0]);
    
    // 당첨자가 받을 표기 지원금 합계 계산
    const participants = waitingData.slice(0, groupSize);
    const winnersSupport = participants.slice(0, winnerCount).reduce((sum, p) => sum + (p.productSupport || 0), 0);
    // 미선정자 수 계산
    const losersCount = Math.max(0, participants.length - winnerCount);
    
    console.log('🔍 지원금 계산 정보:');
    console.log('  - 대기자 수:', waitingData.length);
    console.log('  - 그룹 크기:', groupSize);
    console.log('  - 당첨자 수:', winnerCount);
    console.log('  - 참가자 수:', participants.length);
    console.log('  - 당첨자 지원금 합계:', winnersSupport);
    console.log('  - 미선정자 수:', losersCount);
    
    // 실제 추첨 결과가 있으면 사용 (확정된 지원금)
    const hasCurrentResult = currentLotteryLosers && currentLotteryLosers.length > 0 && selectedProductId === productId;
    
    const htmlContent = waitingData.map((person, index) => {
        let displaySupport = 0;
        
        // 1순위: 현재 추첨 결과에서 calculatedSupport 사용
        if (hasCurrentResult) {
            const actualLoser = currentLotteryLosers.find(l => (l.id === person.id || (l.name === person.name && l.phone === person.phone)));
            if (actualLoser && actualLoser.calculatedSupport !== undefined && !isNaN(actualLoser.calculatedSupport) && actualLoser.calculatedSupport !== null) {
                displaySupport = actualLoser.calculatedSupport;
                console.log(`✅ ${person.name}: 현재 추첨 결과 사용 (${displaySupport}원)`);
            }
        }
        
        // 2순위: 확정 결과에서 support 사용 (이미 확정된 경우)
        if (displaySupport === 0) {
            const confirmedResult = LOTTERY_CONFIRMED_RESULTS.find(r => 
                r.result === 'loser' && 
                (r.name === person.name && r.phone === person.phone) &&
                r.productId === productId
            );
            if (confirmedResult && confirmedResult.support !== undefined && !isNaN(confirmedResult.support) && confirmedResult.support !== null) {
                displaySupport = confirmedResult.support;
                console.log(`✅ ${person.name}: 확정 결과 사용 (${displaySupport}원)`);
            }
        }
        
        // 3순위: 예상 지원금 계산 (추첨 전 또는 확정되지 않은 경우)
        if (displaySupport === 0) {
            // 미선정자 예상 지원금 계산 (균등 분배)
            // 당첨자는 index < winnerCount, 미선정자는 winnerCount <= index < groupSize
            // 대기자 수가 그룹 크기보다 작아도 참가자 범위 내에서는 계산 가능
            const isParticipant = index < Math.min(waitingData.length, groupSize);
            const isLoser = index >= winnerCount;
            
            if (isParticipant && isLoser && losersCount > 0) {
                displaySupport = winnersSupport / losersCount;
                displaySupport = Math.floor(displaySupport / 10) * 10;
                console.log(`${person.name}: 예상 지원금 계산 (${displaySupport}원, ${winnersSupport}원 ÷ ${losersCount}명)`);
            }
        }
        
        console.log(`${person.name} (index: ${index}, amount: ${person.amount}): displaySupport = ${displaySupport}원`);
        
        return `
        <tr>
            <td><input type="checkbox" class="person-select" data-id="${person.id}"></td>
            <td>${index + 1}</td>
            <td>${person.name}</td>
            <td>${person.phone}</td>
            <td>${person.amount.toLocaleString()}원</td>
            <td>${displaySupport.toLocaleString()}원</td>
            <td><span class="badge badge-success">확인완료</span></td>
            <td>${person.date}</td>
        </tr>
        `;
    }).join('');
    
    console.log('🔍 생성된 HTML (첫 번째 행):', htmlContent.substring(0, 300));
    tbody.innerHTML = htmlContent;
    console.log('🔍 실제 렌더링된 HTML:', tbody.innerHTML.substring(0, 300));
}

// 전체 선택 토글
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.person-select');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
}

// 자동 모드 토글 (auto-lottery.js의 함수 사용)
function toggleAutoMode() {
    if (typeof window.toggleAutoLotteryMode === 'function') {
        window.toggleAutoLotteryMode();
    } else {
        console.error('toggleAutoLotteryMode 함수를 찾을 수 없습니다. auto-lottery.js가 로드되었는지 확인하세요.');
        alert('자동 추첨 모드를 사용할 수 없습니다. 페이지를 새로고침해주세요.');
    }
}

// 현재 추첨 결과 저장 (confirmLotteryResult에서 사용)
let currentLotteryWinners = [];
let currentLotteryLosers = [];

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

    // 참가자 목록 (10명)
    const participants = waitingData.slice(0, groupSize);
    
    // 랜덤 추첨 (암호학적 난수 사용 시뮬레이션)
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, winnerCount); // 당첨자 2명
    let losers = shuffled.slice(winnerCount); // 미선정자 8명
    
    // 지원금 계산 (먼저 계산)
    // 당첨자의 상품 표기 지원금 합계 (productSupport 사용)
    const winnersSupport = winners.reduce((sum, w) => sum + (w.productSupport || 0), 0);
    const losersCount = losers.length;
    
    console.log('🔵 지원금 계산 시작:');
    console.log('  - 당첨자 표기 지원금 합계:', winnersSupport);
    console.log('  - 미선정자 수:', losersCount);
    
    // 지원금 계산 및 새로운 객체로 생성 (참조 문제 완전 해결)
    // 공식: 당첨자 지원금 합계 / 미선정자 수 (균등 분배)
    losers = losers.map((loser, index) => {
        let supportAmount = 0;
        if (losersCount > 0) {
            supportAmount = winnersSupport / losersCount;
        }
        // 10원 단위 절삭
        const calculatedSupport = Math.floor(supportAmount / 10) * 10;
        
        console.log(`  - ${loser.name}: 지원금 ${calculatedSupport}원 (${winnersSupport}원 ÷ ${losersCount}명)`);
        
        // 새로운 객체 반환 (calculatedSupport 포함)
        return {
            ...loser,
            calculatedSupport: calculatedSupport // 반드시 설정
        };
    });
    
    console.log('✅ 지원금 계산 완료');
    console.log('🔵 계산된 losers 배열:', losers.map(l => ({ name: l.name, calculatedSupport: l.calculatedSupport, hasSupport: !!l.support })));
    
    // 전역 변수에 저장 (confirmLotteryResult에서 사용)
    currentLotteryWinners = winners;
    currentLotteryLosers = losers;

    // 결과 표시
    showLotteryResult(winners, losers, participants.length);
    
    // ✅ 순환 구조: 당첨자 2명만 제거, 미선정자 8명은 다음 추첨에 포함
    // 당첨자 2명의 인덱스를 찾아서 제거
    const winnerIds = new Set(winners.map(w => w.id || w.userId));
    const remainingData = waitingData.filter(person => {
        const personId = person.id || person.userId;
        return !winnerIds.has(personId);
    });
    
    // 다음 대기 목록에서 2명 추가 (10명 유지)
    const nextWaitingCount = groupSize - remainingData.length; // 필요한 인원 수
    if (nextWaitingCount > 0 && waitingData.length > groupSize) {
        // 대기 목록에 더 많은 인원이 있으면 추가
        const additionalPeople = waitingData.slice(groupSize, groupSize + nextWaitingCount);
        remainingData.push(...additionalPeople);
    }
    
    // 대기 목록 업데이트 (당첨자 제거 + 다음 인원 추가)
    LOTTERY_WAITING_DATA[selectedProductId] = remainingData;
    
    // UI 업데이트
    if (typeof renderLotteryStatus === 'function') {
        renderLotteryStatus();
    }
    if (typeof renderWaitingList === 'function') {
        renderWaitingList();
    }
    
    console.log(`✅ 추첨 완료: 당첨자 ${winners.length}명 제거, 미선정자 ${losers.length}명 유지, 남은 대기 인원: ${remainingData.length}명`);
}

// 추첨 결과 표시
function showLotteryResult(winners, losers, totalCount) {
    const modal = document.getElementById('lotteryResultModal');
    const winnersListEl = document.getElementById('winnersList');
    const losersListEl = document.getElementById('losersList');
    
    // ✅ 추첨 확정 현황과 동일하게 currentLotteryLosers 사용 (calculatedSupport 포함)
    // 전역 변수에 저장된 계산된 데이터 사용
    const displayLosers = currentLotteryLosers && currentLotteryLosers.length > 0 ? currentLotteryLosers : losers;
    const displayWinners = currentLotteryWinners && currentLotteryWinners.length > 0 ? currentLotteryWinners : winners;
    
    console.log('🔵 showLotteryResult - currentLotteryLosers 사용:', displayLosers.map(l => ({ 
        name: l.name, 
        calculatedSupport: l.calculatedSupport 
    })));
    
    // 당첨자 렌더링 (지원금 없음)
    winnersListEl.innerHTML = displayWinners.map(w => `
        <div class="result-person winner">
            <div class="person-name">🎉 ${w.name}</div>
            <div class="person-phone">${w.phone}</div>
            <div class="person-amount">구매 확정: ${w.amount.toLocaleString()}원</div>
            <div class="person-support" style="color: #999;">지원금: 없음</div>
        </div>
    `).join('');

    // 미선정자 렌더링 - 추첨 확정 현황과 동일하게 calculatedSupport 직접 사용
    console.log('🔵 showLotteryResult - displayLosers 확인:', displayLosers.map(l => ({ 
        name: l.name, 
        calculatedSupport: l.calculatedSupport,
        support: l.support,
        amount: l.amount
    })));
    
    losersListEl.innerHTML = displayLosers.map((l, index) => {
        // ✅ 추첨 확정 현황과 동일: calculatedSupport 직접 사용
        let supportAmount = 0;
        
        // calculatedSupport가 있으면 사용 (추첨 확정 현황과 동일)
        if (l.calculatedSupport !== undefined && !isNaN(l.calculatedSupport) && l.calculatedSupport !== null) {
            supportAmount = l.calculatedSupport;
            console.log(`✅ ${l.name}: calculatedSupport 사용 (${supportAmount}원)`);
        } else {
            // calculatedSupport가 없으면 재계산 (균등 분배)
            console.warn(`⚠️ ${l.name}: calculatedSupport가 없어서 재계산합니다.`);
            const winnersSupport = displayWinners.reduce((sum, w) => sum + (w.productSupport || 0), 0);
            const losersCount = displayLosers.length;
            if (losersCount > 0) {
                supportAmount = winnersSupport / losersCount;
                supportAmount = Math.floor(supportAmount / 10) * 10;
                console.log(`✅ ${l.name}: 재계산 완료 (${supportAmount}원, ${winnersSupport}원 ÷ ${losersCount}명)`);
            }
        }
        
        return `
        <div class="result-person loser">
            <div class="person-name">💰 ${l.name}</div>
            <div class="person-phone">${l.phone}</div>
            <div class="person-amount">구매금: ${l.amount.toLocaleString()}원</div>
            <div class="person-support">지원금: ${supportAmount.toLocaleString()}원</div>
        </div>
        `;
    }).join('');

    // 요약 정보 (calculatedSupport 직접 사용 - 추첨 확정 현황과 동일)
    const totalSupport = displayLosers.reduce((sum, l) => {
        // ✅ calculatedSupport 직접 사용 (추첨 확정 현황과 동일)
        let support = 0;
        if (l.calculatedSupport !== undefined && !isNaN(l.calculatedSupport) && l.calculatedSupport !== null) {
            support = l.calculatedSupport;
        } else {
            // calculatedSupport가 없으면 재계산 (균등 분배)
            const winnersSupport = displayWinners.reduce((sum, w) => sum + (w.productSupport || 0), 0);
            const losersCount = displayLosers.length;
            if (losersCount > 0) {
                support = winnersSupport / losersCount;
                support = Math.floor(support / 10) * 10;
            }
        }
        return sum + support;
    }, 0);
    document.getElementById('resultRound').textContent = `${currentRound}회차`;
    document.getElementById('resultTotal').textContent = totalCount;
    document.getElementById('resultWinners').textContent = displayWinners.length;
    document.getElementById('resultSupport').textContent = totalSupport.toLocaleString();

    modal.style.display = 'flex';
}

// 추첨 결과 닫기
function closeLotteryResult() {
    document.getElementById('lotteryResultModal').style.display = 'none';
}

// 추첨 확정 결과 저장소 (페이지 로드 시 초기화)
let LOTTERY_CONFIRMED_RESULTS = [];

// 기존 확정 결과 초기화 함수
function clearConfirmedResults() {
    if (confirm('⚠️ 모든 확정된 추첨 결과를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
        LOTTERY_CONFIRMED_RESULTS = [];
        updateConfirmPage();
        alert('✅ 모든 확정 결과가 삭제되었습니다.');
    }
}

// 추첨 결과 확정
function confirmLotteryResult() {
    // executeLottery에서 저장된 데이터 사용 (calculatedSupport 포함)
    if (!currentLotteryWinners || !currentLotteryLosers || currentLotteryWinners.length === 0) {
        alert('추첨 결과를 찾을 수 없습니다. 다시 추첨해주세요.');
        return;
    }
    
    // 저장된 데이터로 확정 결과 생성 (orderId: 배송 진행 목록에서 사용)
    const winners = currentLotteryWinners.map((w, index) => ({
        id: Date.now() + index,
        orderId: w.id || w.orderId,
        round: currentRound,
        productId: selectedProductId,
        productName: getProductName(selectedProductId),
        name: w.name,
        phone: w.phone,
        amount: w.amount,
        result: 'winner',
        support: 0, // 당첨자는 지원금 없음
        paymentStatus: 'completed', // 당첨자는 지급 완료 상태
        date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
    }));
    
    // ✅ 디버깅: currentLotteryLosers 확인
    console.log('🔵 confirmLotteryResult - currentLotteryLosers:', currentLotteryLosers.map(l => ({
        name: l.name,
        calculatedSupport: l.calculatedSupport,
        support: l.support,
        amount: l.amount
    })));
    
    const losers = currentLotteryLosers.map((l, index) => {
        // ✅ calculatedSupport가 제대로 계산되었는지 확인
        let supportAmount = 0;
        
        // calculatedSupport 우선 사용 (반드시)
        if (l.calculatedSupport !== undefined && !isNaN(l.calculatedSupport) && l.calculatedSupport !== null) {
            supportAmount = l.calculatedSupport;
            console.log(`✅ ${l.name}: calculatedSupport 사용 (${supportAmount}원)`);
        } else {
            // calculatedSupport가 없으면 재계산 (균등 분배)
            console.warn(`⚠️ ${l.name}: calculatedSupport가 없어서 재계산합니다.`);
            const winnersSupport = currentLotteryWinners.reduce((sum, w) => sum + (w.productSupport || 0), 0);
            const losersCount = currentLotteryLosers.length;
            if (losersCount > 0) {
                supportAmount = winnersSupport / losersCount;
                supportAmount = Math.floor(supportAmount / 10) * 10;
                console.log(`✅ ${l.name}: 재계산 완료 (${supportAmount}원, ${winnersSupport}원 ÷ ${losersCount}명)`);
            }
        }
        
        return {
            id: Date.now() + winners.length + index,
            orderId: l.id || l.orderId,
            round: currentRound,
            productId: selectedProductId,
            productName: getProductName(selectedProductId),
            name: l.name,
            phone: l.phone,
            amount: l.amount,
            result: 'loser',
            support: supportAmount, // ✅ calculatedSupport 사용 (절대 1500원 아님)
            paymentStatus: 'pending',
            date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
        };
    });
    
    // ✅ 저장 전 최종 확인
    console.log('🔵 confirmLotteryResult - 저장할 losers:', losers.map(l => ({
        name: l.name,
        support: l.support
    })));
    
    // 확정 결과에 추가
    LOTTERY_CONFIRMED_RESULTS.push(...winners, ...losers);
    
    alert(`추첨 결과가 확정되었습니다!\n\n회차: ${currentRound}회\n당첨: ${winners.length}명\n미선정: ${losers.length}명\n총 지원금: ${losers.reduce((sum, l) => sum + l.support, 0).toLocaleString()}원\n\n※ 지원금은 당일 일괄 지급됩니다.`);
    
    // ✅ 순환 구조: 당첨자만 제거 (이미 executeLottery에서 처리됨)
    // confirmLotteryResult는 결과를 확정하는 것이므로 여기서는 제거하지 않음
    // executeLottery에서 이미 당첨자만 제거하고 미선정자는 유지하도록 수정됨
    
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
    // 지급 대상 모드일 때는 별도 렌더링
    if (isShowingDailyPayment && dailyPaymentResults.length > 0) {
        renderDailyPaymentResults(dailyPaymentResults);
        return;
    }
    
    const tbody = document.getElementById('confirmResultsBody');
    const countEl = document.getElementById('confirmCount');
    
    if (!tbody) return;
    
    // 지급 완료 버튼 제거
    hidePaymentCompleteButton();
    
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
        filtered = filtered.filter(r => {
            if (!r.date) return false;
            const datePart = r.date.split(' ')[0];
            return datePart >= startDate;
        });
    }
    if (endDate) {
        filtered = filtered.filter(r => {
            if (!r.date) return false;
            const datePart = r.date.split(' ')[0];
            return datePart <= endDate;
        });
    }
    
    if (countEl) {
        if (LOTTERY_CONFIRMED_RESULTS.length === 0) {
            countEl.textContent = '0';
        } else {
            countEl.textContent = filtered.length;
        }
    }
    
    if (filtered.length === 0) {
        // 원본 데이터가 없으면 "추첨 확정 내역이 없습니다" 표시
        if (LOTTERY_CONFIRMED_RESULTS.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="empty-message">추첨 확정 내역이 없습니다.</td></tr>';
        } else {
            tbody.innerHTML = '<tr><td colspan="10" class="empty-message">조건에 맞는 결과가 없습니다.</td></tr>';
        }
        return;
    }
    
    tbody.innerHTML = filtered.map((result, index) => {
        const round = result.round || 0;
        const productName = result.productName || '알 수 없음';
        const name = result.name || '이름 없음';
        const phone = result.phone || '-';
        const amount = result.amount || 0;
        const support = result.support || 0;
        const date = result.date || '-';
        const paymentStatus = result.paymentStatus || 'pending';
        
        return `
        <tr>
            <td>${index + 1}</td>
            <td><span class="badge badge-info">${round}회</span></td>
            <td style="text-align: left; padding-left: 15px;">${escapeHtml(productName)}</td>
            <td>${escapeHtml(name)}</td>
            <td>${escapeHtml(phone)}</td>
            <td>${amount.toLocaleString()}원</td>
            <td>
                ${result.result === 'winner' 
                    ? '<span class="badge badge-success">당첨</span>' 
                    : '<span class="badge badge-info">미선정</span>'}
            </td>
            <td>${result.result === 'winner' ? '-' : support.toLocaleString() + '원'}</td>
            <td>
                ${result.result === 'winner'
                    ? '<span class="payment-status paid">구매확정</span>'
                    : `<button class="btn btn-sm ${paymentStatus === 'paid' ? 'btn-success' : 'btn-secondary'}" 
                              onclick="togglePaymentStatus(${result.id})" 
                              style="min-width: 80px;">
                          ${paymentStatus === 'paid' ? '지급완료' : '지급대기'}
                       </button>`}
            </td>
            <td>${escapeHtml(date)}</td>
        </tr>
        `;
    }).join('');
}

// 필터 적용
function filterConfirmResults() {
    renderConfirmResults();
}

// 필터 초기화
function resetConfirmFilter() {
    // 지급 대상 모드 해제
    isShowingDailyPayment = false;
    dailyPaymentResults = [];
    hidePaymentCompleteButton();
    
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

// 당일 지원금 일괄 지급 대상 표시
let isShowingDailyPayment = false;
let dailyPaymentResults = [];

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
    
    // 지급 대상 목록 저장
    dailyPaymentResults = pendingResults;
    isShowingDailyPayment = true;
    
    // 테이블에 지급 대상만 표시
    renderDailyPaymentResults(pendingResults);
}

// 당일 지원금 일괄 지급 완료
function completeDailyPayment() {
    if (dailyPaymentResults.length === 0) {
        alert('지급할 지원금이 없습니다.');
        return;
    }
    
    const totalAmount = dailyPaymentResults.reduce((sum, r) => sum + r.support, 0);
    const paymentCount = dailyPaymentResults.length;
    
    if (confirm(`총 ${paymentCount}명, ${totalAmount.toLocaleString()}원을 일괄 지급하시겠습니까?`)) {
        // 지급 상태 업데이트
        dailyPaymentResults.forEach(result => {
            result.paymentStatus = 'paid';
        });
        
        // 지급 대상 목록 초기화
        dailyPaymentResults = [];
        isShowingDailyPayment = false;
        
        // 필터 초기화 및 전체 목록 표시
        resetConfirmFilter();
        
        alert(`✅ 지급이 완료되었습니다!\n\n지급 인원: ${paymentCount}명\n지급 금액: ${totalAmount.toLocaleString()}원\n\n각 회원의 계좌로 현금이 입금되었습니다.`);
        
        updateConfirmPage();
    }
}

// 당일 지원금 지급 대상 목록 렌더링
function renderDailyPaymentResults(pendingResults) {
    const tbody = document.getElementById('confirmResultsBody');
    const countEl = document.getElementById('confirmCount');
    
    if (!tbody) return;
    
    const totalAmount = pendingResults.reduce((sum, r) => sum + r.support, 0);
    
    if (countEl) {
        countEl.textContent = `${pendingResults.length}건 (지급 대상)`;
    }
    
    if (pendingResults.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-message">오늘 지급할 지원금이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = pendingResults.map((result, index) => {
        const round = result.round || 0;
        const productName = result.productName || '알 수 없음';
        const name = result.name || '이름 없음';
        const phone = result.phone || '-';
        const amount = result.amount || 0;
        const support = result.support || 0;
        const date = result.date || '-';
        
        return `
        <tr style="background-color: #fff9e6;">
            <td>${index + 1}</td>
            <td><span class="badge badge-info">${round}회</span></td>
            <td style="text-align: left; padding-left: 15px;">${escapeHtml(productName)}</td>
            <td>${escapeHtml(name)}</td>
            <td>${escapeHtml(phone)}</td>
            <td>${amount.toLocaleString()}원</td>
            <td><span class="badge badge-info">미선정</span></td>
            <td style="font-weight: bold; color: #e74c3c;">${support.toLocaleString()}원</td>
            <td><span class="badge badge-warning">지급대기</span></td>
            <td>${escapeHtml(date)}</td>
        </tr>
        `;
    }).join('');
    
    // 지급 완료 버튼 표시
    showPaymentCompleteButton(totalAmount, pendingResults.length);
}

// 지급 완료 버튼 표시
function showPaymentCompleteButton(totalAmount, count) {
    // 기존 버튼 제거
    const existingBtn = document.getElementById('paymentCompleteBtn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // 새 버튼 추가
    const tableHeader = document.querySelector('.table-header-actions');
    if (tableHeader) {
        const completeBtn = document.createElement('button');
        completeBtn.id = 'paymentCompleteBtn';
        completeBtn.className = 'btn btn-success btn-sm';
        completeBtn.style.marginLeft = '10px';
        completeBtn.innerHTML = `<i class="fas fa-check-circle"></i> 지급 완료 (${count}명, ${totalAmount.toLocaleString()}원)`;
        completeBtn.onclick = completeDailyPayment;
        tableHeader.appendChild(completeBtn);
    }
}

// 지급 완료 버튼 제거
function hidePaymentCompleteButton() {
    const existingBtn = document.getElementById('paymentCompleteBtn');
    if (existingBtn) {
        existingBtn.remove();
    }
}

// ============================================
// 관리권한설정 (admin-settings)
// [관리자 목록이 안 보였던 이유]
// 1. firebase-admin.js에서 window.firebaseAdmin.db를 스크립트 로드 시점의 null로 한 번만 넣어서,
//    나중에 initFirebase()가 db를 설정해도 화면에서는 계속 null로 인식함.
// 2. firebase-admin 로드 후 곧바로 다른 스크립트를 로드해, initFirebase() 완료 전에 관리자 페이지가
//    열리면 db가 아직 null인 상태에서 getAdmins() 등이 호출됨.
// 3. "준비됨" 판단을 getter만으로 하다 보니, 일부 환경에서 getter가 기대대로 동작하지 않을 수 있음.
// 해결: getInitPromise()로 초기화 완료 대기, getDb()로 db 조회, HTML에서 초기화 완료 후 다음 스크립트
// 로드, 목록은 getAdmins() 성공 시에만 그리도록 변경함.
// ============================================
const SEED_ADMIN_NAME = '서배준';
const SEED_ADMIN_USER_ID = 'seobaejun';
const ADMIN_ADD_PASSWORD = '7979';

/** Firebase가 준비될 때까지 대기 후, 실제 db/서비스 사용 가능 여부 반환 */
async function ensureFirebaseReady() {
    if (!window.firebaseAdmin) return false;
    try {
        if (typeof window.firebaseAdmin.getInitPromise === 'function') {
            await Promise.race([
                window.firebaseAdmin.getInitPromise(),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000))
            ]);
        }
        if (typeof window.firebaseAdmin.initFirebase === 'function') {
            await window.firebaseAdmin.initFirebase();
        }
        var d = window.firebaseAdmin.getDb ? window.firebaseAdmin.getDb() : window.firebaseAdmin.db;
        return !!d;
    } catch (e) {
        console.warn('ensureFirebaseReady:', e);
        var d = window.firebaseAdmin.getDb ? window.firebaseAdmin.getDb() : window.firebaseAdmin.db;
        return !!d;
    }
}

function showAdminSettingsError(tbody, infoText, msg) {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="empty-message">' + (msg || 'Firebase가 준비되지 않았습니다.') + ' <button type="button" class="btn btn-primary btn-sm" id="adminSettingsRetryBtn" style="margin-left:8px;">재시도</button></td></tr>';
    if (infoText) infoText.textContent = '총 0명의 관리자가 있습니다.';
    var retryBtn = document.getElementById('adminSettingsRetryBtn');
    if (retryBtn) retryBtn.onclick = function() { loadAdminSettings(); };
}

async function loadAdminSettings() {
    const tbody = document.getElementById('adminSettingsTableBody');
    const infoText = document.getElementById('adminSettingsInfoText');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="empty-message">데이터를 불러오는 중...</td></tr>';
    try {
        await ensureFirebaseReady();
        const adminService = window.firebaseAdmin && window.firebaseAdmin.adminService;
        if (!adminService) {
            showAdminSettingsError(tbody, infoText, 'Firebase가 준비되지 않았습니다.');
            return;
        }
        let admins = await adminService.getAdmins();
        if (admins.length === 0) {
            await adminService.addAdmin({
                userId: SEED_ADMIN_USER_ID,
                name: SEED_ADMIN_NAME,
                email: '',
                phone: '',
                status: 'active'
            });
            admins = await adminService.getAdmins();
        }
        var memberMap = {};
        try {
            var memberService = window.firebaseAdmin && window.firebaseAdmin.memberService;
            if (memberService) {
                var members = await memberService.getMembers();
                (members || []).forEach(function(m) {
                    if (m.userId) memberMap[m.userId] = m;
                    if (m.name && !memberMap[m.name]) memberMap[m.name] = m;
                });
            }
        } catch (e) {
            console.warn('회원 목록 보조 로드 실패:', e);
        }
        if (infoText) infoText.textContent = `총 ${admins.length}명의 관리자가 있습니다.`;
        renderAdminSettingsTable(admins, memberMap);
    } catch (err) {
        console.error('관리자 목록 로드 오류:', err);
        showAdminSettingsError(tbody, infoText, '오류: ' + (err.message || '알 수 없음'));
    }
}

function formatAdminDate(ts) {
    if (!ts) return '-';
    if (ts.seconds != null) {
        const d = new Date(ts.seconds * 1000);
        return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    return '-';
}

function renderAdminSettingsTable(admins, memberMap) {
    memberMap = memberMap || {};
    const tbody = document.getElementById('adminSettingsTableBody');
    if (!tbody) return;
    if (!admins || admins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-message">등록된 관리자가 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = admins.map((a, i) => {
        var member = memberMap[a.userId] || memberMap[a.name];
        var displayUserId = (member && member.userId) ? member.userId : (a.userId || '');
        var displayEmail = (member && member.email) ? member.email : (a.email || '');
        var displayPhone = (member && member.phone) ? member.phone : (a.phone || '');
        const createdAt = formatAdminDate(a.createdAt);
        const statusBadge = a.status === 'active'
            ? '<span class="badge badge-success">활성</span>'
            : '<span class="badge badge-secondary">비활성</span>';
        const toggleLabel = a.status === 'active' ? '비활성화' : '활성화';
        return `<tr data-admin-id="${a.id}">
            <td>${i + 1}</td>
            <td>${escapeHtml(displayUserId)}</td>
            <td>${escapeHtml(a.name || '')}</td>
            <td>${escapeHtml(displayEmail)}</td>
            <td>${escapeHtml(displayPhone)}</td>
            <td>${createdAt}</td>
            <td>${statusBadge}</td>
            <td>
                <button type="button" class="btn btn-sm btn-secondary btn-admin-toggle">${toggleLabel}</button>
                <button type="button" class="btn btn-sm btn-danger btn-admin-delete">삭제</button>
            </td>
        </tr>`;
    }).join('');
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

let selectedAdminMemberIndex = -1;

async function openAdminModal(editId) {
    const modal = document.getElementById('adminEditModal');
    const title = document.getElementById('adminEditModalTitle');
    const addFormSection = document.getElementById('adminAddFormSection');
    const adminEditForm = document.getElementById('adminEditForm');
    if (!modal) return;
    if (editId) {
        if (addFormSection) addFormSection.style.display = 'none';
        if (adminEditForm) adminEditForm.style.display = 'block';
        title.textContent = '관리자 수정';
        document.getElementById('adminEditId').value = editId;
        const adminService = window.firebaseAdmin && window.firebaseAdmin.adminService;
        if (!adminService) return;
        const admins = await adminService.getAdmins();
        const a = admins.find(x => x.id === editId);
        if (a) {
            var memberService = window.firebaseAdmin && window.firebaseAdmin.memberService;
            var editUserId = a.userId || '';
            var editEmail = a.email || '';
            var editPhone = a.phone || '';
            if (memberService && (editUserId || a.name)) {
                try {
                    var members = await memberService.getMembers(editUserId ? { searchTerm: editUserId } : { searchTerm: a.name });
                    var mem = (members && members[0]) ? members[0] : null;
                    if (mem) {
                        editUserId = mem.userId || editUserId;
                        editEmail = mem.email || editEmail;
                        editPhone = mem.phone || editPhone;
                    }
                } catch (e) { console.warn('수정 시 회원 정보 보조 로드 실패:', e); }
            }
            document.getElementById('adminEditUserId').value = editUserId;
            document.getElementById('adminEditUserId').readOnly = true;
            document.getElementById('adminEditName').value = a.name || '';
            document.getElementById('adminEditEmail').value = editEmail;
            document.getElementById('adminEditPhone').value = editPhone;
        }
    } else {
        title.textContent = '관리자 추가';
        if (addFormSection) addFormSection.style.display = 'block';
        if (adminEditForm) adminEditForm.style.display = 'none';
        document.getElementById('adminEditId').value = '';
        const nameEl = document.getElementById('adminAddName');
        const pwEl = document.getElementById('adminAddPassword');
        if (nameEl) nameEl.value = '';
        if (pwEl) pwEl.value = '';
    }
    modal.style.display = 'flex';
}

function closeAdminModal() {
    const modal = document.getElementById('adminEditModal');
    if (modal) modal.style.display = 'none';
}

let lastAdminSearchMembers = [];

async function searchMemberForAdmin() {
    const nameInput = document.getElementById('adminEditMemberSearchName');
    const resultsEl = document.getElementById('adminEditMemberSearchResults');
    if (!nameInput || !resultsEl) return;
    const name = (nameInput.value || '').trim();
    if (!name) {
        alert('이름을 입력한 뒤 검색해주세요.');
        return;
    }
    const memberService = window.firebaseAdmin && window.firebaseAdmin.memberService;
    if (!memberService) {
        alert('회원 목록을 불러올 수 없습니다.');
        return;
    }
    resultsEl.innerHTML = '<p class="empty-message">검색 중...</p>';
    try {
        const members = await memberService.getMembers({ searchTerm: name });
        lastAdminSearchMembers = members || [];
        if (lastAdminSearchMembers.length === 0) {
            resultsEl.innerHTML = '<p class="empty-message">검색 결과가 없습니다.</p>';
            return;
        }
        resultsEl.innerHTML = lastAdminSearchMembers.map((m, idx) => {
            const userId = escapeHtml(m.userId || '');
            const displayName = escapeHtml(m.name || '');
            const phone = escapeHtml(m.phone || '');
            const email = escapeHtml(m.email || '');
            const extra = phone || email || '-';
            const selectedClass = idx === selectedAdminMemberIndex ? ' admin-search-result-row-selected' : '';
            return `<div class="admin-search-result-row${selectedClass}" data-index="${idx}">
                <span class="admin-search-name">${displayName}</span>
                <span class="admin-search-id">${userId}</span>
                <span class="admin-search-extra">${escapeHtml(extra)}</span>
            </div>`;
        }).join('');
    } catch (err) {
        console.error('회원 검색 오류:', err);
        resultsEl.innerHTML = '<p class="empty-message">검색 중 오류가 발생했습니다.</p>';
    }
}

function selectMemberForAdminRow(index) {
    selectedAdminMemberIndex = index;
    const resultsEl = document.getElementById('adminEditMemberSearchResults');
    if (!resultsEl) return;
    resultsEl.querySelectorAll('.admin-search-result-row').forEach((row, idx) => {
        if (idx === index) {
            row.classList.add('admin-search-result-row-selected');
        } else {
            row.classList.remove('admin-search-result-row-selected');
        }
    });
}

async function saveAdminModal() {
    const id = document.getElementById('adminEditId').value.trim();
    await ensureFirebaseReady();
    const adminService = window.firebaseAdmin && window.firebaseAdmin.adminService;
    if (!adminService || !window.firebaseAdmin.db) {
        alert('Firebase가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    try {
        if (id) {
            const name = document.getElementById('adminEditName').value.trim();
            const email = document.getElementById('adminEditEmail').value.trim();
            const phone = document.getElementById('adminEditPhone').value.trim();
            if (!name) {
                alert('이름을 입력해주세요.');
                return;
            }
            await adminService.updateAdmin(id, { name, email, phone });
            alert('수정되었습니다.');
        } else {
            const name = (document.getElementById('adminAddName') && document.getElementById('adminAddName').value || '').trim();
            const password = document.getElementById('adminAddPassword') ? document.getElementById('adminAddPassword').value : '';
            if (!name) {
                alert('이름을 입력해주세요.');
                return;
            }
            if (password !== ADMIN_ADD_PASSWORD) {
                alert('비밀번호가 올바르지 않습니다.');
                return;
            }
            var userId = name.replace(/\s+/g, '_') || 'admin';
            var email = '';
            var phone = '';
            var memberService = window.firebaseAdmin && window.firebaseAdmin.memberService;
            if (memberService) {
                try {
                    var members = await memberService.getMembers({ searchTerm: name });
                    if (members && members.length > 0) {
                        var m = members[0];
                        userId = m.userId || userId;
                        email = m.email || '';
                        phone = m.phone || '';
                    }
                } catch (e) { console.warn('관리자 추가 시 회원 조회 실패:', e); }
            }
            await adminService.addAdmin({
                userId: userId,
                name: name,
                email: email,
                phone: phone,
                status: 'active'
            });
            alert('관리자로 추가되었습니다.');
        }
        closeAdminModal();
        await loadAdminSettings();
    } catch (err) {
        console.error(err);
        alert('저장 중 오류가 발생했습니다: ' + (err.message || '알 수 없음'));
    }
}

async function toggleAdminStatus(adminId) {
    const adminService = window.firebaseAdmin && window.firebaseAdmin.adminService;
    if (!adminService) return;
    const admins = await adminService.getAdmins();
    const a = admins.find(x => x.id === adminId);
    if (!a) return;
    const next = a.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`이 관리자를 ${next === 'active' ? '활성화' : '비활성화'}하시겠습니까?`)) return;
    try {
        await adminService.updateAdmin(adminId, { status: next });
        await loadAdminSettings();
    } catch (err) {
        alert('변경 중 오류: ' + (err.message || '알 수 없음'));
    }
}

async function deleteAdminById(adminId) {
    if (!confirm('이 관리자를 목록에서 삭제하시겠습니까?')) return;
    const adminService = window.firebaseAdmin && window.firebaseAdmin.adminService;
    if (!adminService) return;
    try {
        await adminService.deleteAdmin(adminId);
        await loadAdminSettings();
    } catch (err) {
        alert('삭제 중 오류: ' + (err.message || '알 수 없음'));
    }
}

// ============================================
// 접속자 집계 (visitor-stats)
// ============================================
var lastVisitorStatsRows = [];

function formatVisitorDate(str) {
    if (!str) return '-';
    var y = str.substring(0, 4), m = str.substring(5, 7), d = str.substring(8, 10);
    return y + '-' + m + '-' + d;
}

function getDateKey(d, type) {
    if (type === 'monthly') return d.substring(0, 7);
    if (type === 'weekly') {
        var date = new Date(d + 'T12:00:00');
        var day = date.getDay();
        var diff = date.getDate() - day + (day === 0 ? -6 : 1);
        var monday = new Date(date);
        monday.setDate(diff);
        return monday.toISOString().split('T')[0];
    }
    return d;
}

async function loadVisitorStats() {
    var startEl = document.getElementById('visitorStatsStartDate');
    var endEl = document.getElementById('visitorStatsEndDate');
    var typeEl = document.getElementById('visitorStatsType');
    var tbody = document.getElementById('visitorStatsTableBody');
    if (!startEl || !endEl || !tbody) return;
    var startDate = (startEl.value || '').trim();
    var endDate = (endEl.value || '').trim();
    var type = (typeEl && typeEl.value) || 'daily';
    if (!startDate || !endDate) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">시작일과 종료일을 선택해주세요.</td></tr>';
        return;
    }
    if (startDate > endDate) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">시작일이 종료일보다 늦을 수 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = '<tr><td colspan="5" class="empty-message">조회 중...</td></tr>';
    try {
        await ensureFirebaseReady();
        var visitorStatsService = window.firebaseAdmin && window.firebaseAdmin.visitorStatsService;
        var memberService = window.firebaseAdmin && window.firebaseAdmin.memberService;
        if (!visitorStatsService) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-message">서비스를 사용할 수 없습니다.</td></tr>';
            return;
        }
        var logs = await visitorStatsService.getLogsByDateRange(startDate, endDate);
        var byKey = {};
        logs.forEach(function (log) {
            var key = getDateKey(log.date || '', type);
            if (!byKey[key]) byKey[key] = { date: key, total: 0, sessionIds: {}, pageViews: 0 };
            byKey[key].total += 1;
            byKey[key].pageViews += 1;
            if (log.sessionId) byKey[key].sessionIds[log.sessionId] = true;
        });
        var newMembersByDate = {};
        if (memberService && window.firebaseAdmin.db) {
            try {
                var members = await memberService.getMembers();
                var startTs = new Date(startDate + 'T00:00:00').getTime();
                var endTs = new Date(endDate + 'T23:59:59').getTime();
                (members || []).forEach(function (m) {
                    var ct = m.createdAt;
                    var t = 0;
                    if (ct && (ct.seconds != null)) t = ct.seconds * 1000;
                    else if (ct && ct.toDate) t = ct.toDate().getTime();
                    if (t >= startTs && t <= endTs) {
                        var d = new Date(t);
                        var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                        var key = getDateKey(dateStr, type);
                        newMembersByDate[key] = (newMembersByDate[key] || 0) + 1;
                    }
                });
            } catch (e) {
                console.warn('신규 회원 집계 실패:', e);
            }
        }
        var keys = Object.keys(byKey).sort().reverse();
        var totalVisitors = 0, uniqueSet = {}, totalPageViews = 0, totalNewMembers = 0;
        var rows = keys.map(function (key) {
            var row = byKey[key];
            var unique = Object.keys(row.sessionIds).length;
            totalVisitors += row.total;
            totalPageViews += row.pageViews;
            Object.keys(row.sessionIds).forEach(function (s) { uniqueSet[s] = true; });
            var newCount = newMembersByDate[key] || 0;
            totalNewMembers += newCount;
            return { date: key, visitors: row.total, unique: unique, pageViews: row.pageViews, newMembers: newCount };
        });
        lastVisitorStatsRows = rows;
        var periodLabel = startDate + ' ~ ' + endDate;
        document.getElementById('visitorStatsTotalVisitors').textContent = totalVisitors.toLocaleString() + '명';
        document.getElementById('visitorStatsUniqueVisitors').textContent = Object.keys(uniqueSet).length.toLocaleString() + '명';
        document.getElementById('visitorStatsPageViews').textContent = totalPageViews.toLocaleString() + '회';
        document.getElementById('visitorStatsNewMembers').textContent = totalNewMembers.toLocaleString() + '명';
        ['visitorStatsSummaryPeriod', 'visitorStatsSummaryPeriod2', 'visitorStatsSummaryPeriod3', 'visitorStatsSummaryPeriod4'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.textContent = periodLabel;
        });
        var titleEl = document.getElementById('visitorStatsTableTitle');
        if (titleEl) titleEl.textContent = (type === 'monthly' ? '월별' : type === 'weekly' ? '주별' : '일별') + ' 접속 통계';
        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-message">해당 기간 접속 데이터가 없습니다.</td></tr>';
        } else {
            tbody.innerHTML = rows.map(function (r) {
                return '<tr><td>' + formatVisitorDate(r.date) + '</td><td>' + r.visitors.toLocaleString() + '</td><td>' + r.unique.toLocaleString() + '</td><td>' + r.pageViews.toLocaleString() + '</td><td>' + r.newMembers.toLocaleString() + '</td></tr>';
            }).join('');
        }
    } catch (err) {
        console.error('접속자 집계 오류:', err);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">오류: ' + (err.message || '알 수 없음') + '</td></tr>';
    }
}

function exportVisitorStatsExcel() {
    if (lastVisitorStatsRows.length === 0) {
        alert('먼저 조회를 실행해주세요.');
        return;
    }
    var BOM = '\uFEFF';
    var header = '날짜,방문자 수,순 방문자,페이지뷰,신규 회원\n';
    var body = lastVisitorStatsRows.map(function (r) {
        return formatVisitorDate(r.date) + ',' + r.visitors + ',' + r.unique + ',' + r.pageViews + ',' + r.newMembers;
    }).join('\n');
    var csv = BOM + header + body;
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '접속자집계_' + (document.getElementById('visitorStatsStartDate') && document.getElementById('visitorStatsStartDate').value) + '_' + (document.getElementById('visitorStatsEndDate') && document.getElementById('visitorStatsEndDate').value) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
}

// ============================================
// 상품 판매 순위 (product-sales)
// ============================================
var lastProductSalesRows = [];

function escapeHtmlSales(str) {
    if (str == null) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadProductSales() {
    var startEl = document.getElementById('productSalesStartDate');
    var endEl = document.getElementById('productSalesEndDate');
    var categoryEl = document.getElementById('productSalesCategory');
    var gridEl = document.getElementById('productSalesRankingGrid');
    var tbody = document.getElementById('productSalesTableBody');
    if (!startEl || !endEl || !tbody) return;
    var startDate = (startEl.value || '').trim();
    var endDate = (endEl.value || '').trim();
    var categoryFilter = (categoryEl && categoryEl.value) || '';
    if (!startDate || !endDate) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">시작일과 종료일을 선택해주세요.</td></tr>';
        if (gridEl) gridEl.innerHTML = '<p class="empty-message">시작일과 종료일을 선택해주세요.</p>';
        return;
    }
    if (startDate > endDate) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">시작일이 종료일보다 늦을 수 없습니다.</td></tr>';
        if (gridEl) gridEl.innerHTML = '<p class="empty-message">시작일이 종료일보다 늦을 수 없습니다.</p>';
        return;
    }
    tbody.innerHTML = '<tr><td colspan="7" class="empty-message">조회 중...</td></tr>';
    if (gridEl) gridEl.innerHTML = '<p class="empty-message">조회 중...</p>';
    try {
        await ensureFirebaseReady();
        var orderService = window.firebaseAdmin && window.firebaseAdmin.orderService;
        var productService = window.firebaseAdmin && window.firebaseAdmin.productService;
        var db = window.firebaseAdmin && window.firebaseAdmin.db;
        if (!orderService || !productService) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-message">서비스를 사용할 수 없습니다.</td></tr>';
            if (gridEl) gridEl.innerHTML = '<p class="empty-message">서비스를 사용할 수 없습니다.</p>';
            return;
        }
        var startTs = new Date(startDate + 'T00:00:00').getTime();
        var endTs = new Date(endDate + 'T23:59:59').getTime();
        var orders = await orderService.getOrders();
        orders = (orders || []).filter(function (o) {
            var t = 0;
            var ct = o.createdAt;
            if (ct && (ct.seconds != null)) t = ct.seconds * 1000;
            else if (ct && ct.toDate) t = ct.toDate().getTime();
            return t >= startTs && t <= endTs;
        });
        var byProduct = {};
        orders.forEach(function (o) {
            var pid = o.productId || 'unknown';
            if (!byProduct[pid]) byProduct[pid] = { productId: pid, count: 0, totalSales: 0, supportTotal: 0 };
            var qty = o.quantity || 1;
            var price = o.productPrice || 0;
            byProduct[pid].count += 1;
            byProduct[pid].totalSales += price * qty;
            byProduct[pid].supportTotal += (o.supportAmount || 0);
        });
        var products = await productService.getProducts();
        var productMap = {};
        (products || []).forEach(function (p) {
            productMap[p.id] = { name: p.name || p.title || p.id, categoryId: p.categoryId || p.category || '' };
        });
        var categoryMap = {};
        if (db) {
            try {
                var catSnap = await db.collection('categories').get();
                catSnap.docs.forEach(function (d) {
                    categoryMap[d.id] = (d.data().name || d.id);
                });
            } catch (e) {
                console.warn('카테고리 로드 실패:', e);
            }
        }
        if (categoryEl && categoryEl.options.length <= 1) {
            categoryEl.innerHTML = '<option value="">전체</option>';
            Object.keys(categoryMap).forEach(function (id) {
                var opt = document.createElement('option');
                opt.value = id;
                opt.textContent = categoryMap[id];
                categoryEl.appendChild(opt);
            });
        }
        var rows = [];
        Object.keys(byProduct).forEach(function (pid) {
            var agg = byProduct[pid];
            var prod = productMap[pid] || { name: pid, categoryId: '' };
            if (categoryFilter && prod.categoryId !== categoryFilter) return;
            var categoryName = categoryMap[prod.categoryId] || prod.categoryId || '-';
            var netProfit = agg.totalSales - agg.supportTotal;
            rows.push({
                productId: pid,
                productName: prod.name,
                categoryName: categoryName,
                categoryId: prod.categoryId,
                count: agg.count,
                totalSales: agg.totalSales,
                supportTotal: agg.supportTotal,
                netProfit: netProfit
            });
        });
        rows.sort(function (a, b) {
            return b.totalSales - a.totalSales;
        });
        lastProductSalesRows = rows;
        var top10 = rows.slice(0, 10);
        if (gridEl) {
            if (top10.length === 0) {
                gridEl.innerHTML = '<p class="empty-message">해당 기간 판매 데이터가 없습니다.</p>';
            } else {
                gridEl.innerHTML = top10.map(function (r, i) {
                    var rankClass = (i === 0) ? ' rank-1' : (i === 1) ? ' rank-2' : (i === 2) ? ' rank-3' : '';
                    return '<div class="ranking-card' + rankClass + '"><div class="rank-badge">' + (i + 1) + '</div><div class="product-info"><h4>' + escapeHtmlSales(r.productName) + '</h4><p class="sales-count">판매: ' + r.count.toLocaleString() + '건</p><p class="sales-amount">매출: ' + r.totalSales.toLocaleString() + '원</p></div></div>';
                }).join('');
            }
        }
        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-message">해당 기간 판매 데이터가 없습니다.</td></tr>';
        } else {
            tbody.innerHTML = rows.map(function (r, i) {
                var rankBadge = (i === 0) ? '<span class="rank-badge-small gold">1</span>' : (i === 1) ? '<span class="rank-badge-small silver">2</span>' : (i === 2) ? '<span class="rank-badge-small bronze">3</span>' : (i + 1);
                return '<tr><td>' + rankBadge + '</td><td style="text-align:left;padding-left:15px;">' + escapeHtmlSales(r.productName) + '</td><td>' + escapeHtmlSales(r.categoryName) + '</td><td>' + r.count.toLocaleString() + '건</td><td>' + r.totalSales.toLocaleString() + '원</td><td>' + r.supportTotal.toLocaleString() + '원</td><td>' + r.netProfit.toLocaleString() + '원</td></tr>';
            }).join('');
        }
    } catch (err) {
        console.error('상품 판매 순위 오류:', err);
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">오류: ' + (err.message || '알 수 없음') + '</td></tr>';
        if (gridEl) gridEl.innerHTML = '<p class="empty-message">오류가 발생했습니다.</p>';
    }
}

function exportProductSalesExcel() {
    if (lastProductSalesRows.length === 0) {
        alert('먼저 조회를 실행해주세요.');
        return;
    }
    var BOM = '\uFEFF';
    var header = '순위,상품명,카테고리,판매건수,총 매출,지원금,순이익\n';
    var body = lastProductSalesRows.map(function (r, i) {
        return (i + 1) + ',"' + (r.productName || '').replace(/"/g, '""') + '","' + (r.categoryName || '').replace(/"/g, '""') + '",' + r.count + ',' + r.totalSales + ',' + r.supportTotal + ',' + r.netProfit;
    }).join('\n');
    var csv = BOM + header + body;
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '상품판매순위_' + (document.getElementById('productSalesStartDate') && document.getElementById('productSalesStartDate').value) + '_' + (document.getElementById('productSalesEndDate') && document.getElementById('productSalesEndDate').value) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
}

// 페이지 로드 시 초기 데이터 렌더링
// ============================================
// DOMContentLoaded와 window.onload 모두 처리
async function initAdminPage() {
    console.log('🔵🔵🔵 initAdminPage 함수 실행 시작');
    // DOM 요소 초기화
    menuToggle = document.getElementById('menuToggle');
    adminSidebar = document.getElementById('adminSidebar');
    navLinks = document.querySelectorAll('.nav-list a');
    contentPages = document.querySelectorAll('.content-page');
    
    // 메인 콘텐츠 영역이 한 개도 보이도록: 대시보드만 active로 표시
    var dashboardEl = document.getElementById('dashboard');
    if (contentPages && contentPages.length > 0) {
        contentPages.forEach(function (page) {
            page.classList.remove('active');
        });
        if (dashboardEl) {
            dashboardEl.classList.add('active');
        } else if (contentPages[0]) {
            contentPages[0].classList.add('active');
        }
    }
    document.querySelectorAll('.nav-list li').forEach(function (li) {
        li.classList.remove('active');
    });
    var dashboardLink = document.querySelector('[data-page="dashboard"]');
    if (dashboardLink && dashboardLink.parentElement) {
        dashboardLink.parentElement.classList.add('active');
    }
    
    console.log('DOM 요소 초기화:', {
        menuToggle: !!menuToggle,
        adminSidebar: !!adminSidebar,
        navLinks: navLinks.length,
        contentPages: contentPages.length
    });
    
    // 사이드바 토글 초기화
    if (menuToggle && adminSidebar) {
        menuToggle.addEventListener('click', () => {
            adminSidebar.classList.toggle('open');
        });
    }
    
    // 페이지 전환 이벤트 초기화 - 가장 간단하고 확실한 방법
    console.log('🔵 네비게이션 이벤트 초기화 시작...');
    
    // 모든 네비게이션 링크에 직접 이벤트 등록
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
    
    // 헤더 버튼에 직접 이벤트 등록
    const homeBtn = document.querySelector('.btn-home');
    const logoutBtn = document.querySelector('.btn-logout');
    const mdAdminBtn = document.querySelector('.btn-md-admin');
    const settingsBtn = document.querySelector('.btn-settings');
    
    if (homeBtn) {
        homeBtn.onclick = function(e) {
            e.preventDefault();
            console.log('🔵 홈 버튼 클릭됨');
            window.location.href = '../index.html';
            return false;
        };
        console.log('✅ 홈 버튼 등록 완료');
    } else {
        console.error('❌ 홈 버튼을 찾을 수 없습니다!');
    }
    
    if (logoutBtn) {
        logoutBtn.onclick = function(e) {
            e.preventDefault();
            console.log('🔵 로그아웃 버튼 클릭됨');
            if (confirm('로그아웃 하시겠습니까?')) {
                localStorage.removeItem('loginUser');
                localStorage.removeItem('isLoggedIn');
                localStorage.setItem('isAdmin', 'false');
                window.location.href = '../index.html';
            }
            return false;
        };
        console.log('✅ 로그아웃 버튼 등록 완료');
    }
    
    if (mdAdminBtn) {
        mdAdminBtn.onclick = function(e) {
            e.preventDefault();
            alert('MD관리자 페이지로 이동합니다.');
            return false;
        };
    }
    
    if (settingsBtn) {
        settingsBtn.onclick = function(e) {
            e.preventDefault();
            alert('설정 페이지로 이동합니다.');
            return false;
        };
    }
    
    console.log('✅ 모든 네비게이션 이벤트 등록 완료');
    
    // localStorage에서 마지막 페이지 복원
    let savedPage = null;
    try {
        savedPage = localStorage.getItem('adminCurrentPage');
        console.log('저장된 페이지:', savedPage);
    } catch (error) {
        console.warn('localStorage 읽기 실패:', error);
    }
    
    // 저장된 페이지가 있으면 복원
    if (savedPage && document.getElementById(savedPage)) {
        console.log('🔵 저장된 페이지로 복원:', savedPage);
        setTimeout(() => {
            switchToPage(savedPage);
        }, 300);
    } else {
        console.log('🔵 기본 페이지(dashboard) 사용');
    }
    
    // 초기 데이터 렌더링
    try {
        // 현재 활성화된 페이지 확인
        const activePage = document.querySelector('.content-page.active');
        if (activePage && activePage.id === 'member-search') {
            console.log('🔵 초기 로드: member-search 페이지가 활성화되어 있음, 즉시 데이터 로드');
            // 약간의 지연 후 데이터 로드 (다른 스크립트 로드 대기)
            setTimeout(async () => {
                if (typeof loadAllMembers === 'function' || typeof window.loadAllMembers === 'function') {
                    const loadFn = typeof loadAllMembers === 'function' ? loadAllMembers : window.loadAllMembers;
                    try {
                        await loadFn();
                    } catch (error) {
                        console.error('초기 로드 중 오류:', error);
                    }
                }
            }, 500);
        }
        
        // 회원정보 페이지 검색 버튼 이벤트 등록
        const memberSearchBtn = document.getElementById('memberSearchBtn');
        const memberResetBtn = document.getElementById('memberResetBtn');
        const memberExportBtn = document.getElementById('memberExportBtn');
        
        if (memberSearchBtn) {
            memberSearchBtn.onclick = async function(e) {
                e.preventDefault();
                if (typeof window.searchMemberInfo === 'function') {
                    await window.searchMemberInfo();
                } else {
                    console.error('searchMemberInfo 함수를 찾을 수 없습니다.');
                    alert('검색 기능을 사용할 수 없습니다. 페이지를 새로고침해주세요.');
                }
                return false;
            };
            console.log('✅ 회원정보 검색 버튼 등록 완료');
        }
        
        if (memberResetBtn) {
            memberResetBtn.onclick = async function(e) {
                e.preventDefault();
                if (typeof window.resetMemberSearch === 'function') {
                    await window.resetMemberSearch();
                } else {
                    console.error('resetMemberSearch 함수를 찾을 수 없습니다.');
                }
                return false;
            };
            console.log('✅ 회원정보 초기화 버튼 등록 완료');
        }
        
        if (memberExportBtn) {
            memberExportBtn.onclick = function(e) {
                e.preventDefault();
                if (typeof window.exportMembersToExcel === 'function') {
                    window.exportMembersToExcel();
                } else {
                    console.error('exportMembersToExcel 함수를 찾을 수 없습니다.');
                    alert('엑셀 다운로드 기능을 사용할 수 없습니다. 페이지를 새로고침해주세요.');
                }
                return false;
            };
            console.log('✅ 회원정보 엑셀 다운로드 버튼 등록 완료');
        }

        // 관리권한설정: 추가 버튼, 모달, 테이블 이벤트
        const adminSettingsAddBtn = document.getElementById('adminSettingsAddBtn');
        if (adminSettingsAddBtn) {
            adminSettingsAddBtn.onclick = function() { openAdminModal(null); };
        }
        const adminEditModal = document.getElementById('adminEditModal');
        const adminEditModalClose = document.getElementById('adminEditModalClose');
        const adminEditModalCancel = document.getElementById('adminEditModalCancel');
        const adminEditModalSave = document.getElementById('adminEditModalSave');
        if (adminEditModalClose) adminEditModalClose.onclick = closeAdminModal;
        if (adminEditModalCancel) adminEditModalCancel.onclick = closeAdminModal;
        if (adminEditModalSave) adminEditModalSave.onclick = function() { saveAdminModal(); };
        if (adminEditModal && adminEditModal.querySelector('.modal-content')) {
            adminEditModal.querySelector('.modal-content').onclick = function(e) { e.stopPropagation(); };
            adminEditModal.onclick = function(e) { if (e.target === adminEditModal) closeAdminModal(); };
        }
        const adminSettingsTableBody = document.getElementById('adminSettingsTableBody');
        if (adminSettingsTableBody) {
            adminSettingsTableBody.addEventListener('click', function(e) {
                const row = e.target.closest('tr[data-admin-id]');
                if (!row) return;
                const adminId = row.getAttribute('data-admin-id');
                if (e.target.classList.contains('btn-admin-toggle')) {
                    toggleAdminStatus(adminId);
                } else if (e.target.classList.contains('btn-admin-delete')) {
                    deleteAdminById(adminId);
                }
            });
        }
        const adminEditMemberSearchBtn = document.getElementById('adminEditMemberSearchBtn');
        if (adminEditMemberSearchBtn) {
            adminEditMemberSearchBtn.onclick = function() { searchMemberForAdmin(); };
        }
        const adminEditMemberSearchResults = document.getElementById('adminEditMemberSearchResults');
        if (adminEditMemberSearchResults) {
            adminEditMemberSearchResults.addEventListener('click', function(e) {
                const row = e.target.closest('.admin-search-result-row');
                if (!row) return;
                const idx = parseInt(row.getAttribute('data-index'), 10);
                if (isNaN(idx) || idx < 0) return;
                selectMemberForAdminRow(idx);
            });
        }
        var visitorStatsQueryBtn = document.getElementById('visitorStatsQueryBtn');
        if (visitorStatsQueryBtn) visitorStatsQueryBtn.onclick = function () { loadVisitorStats(); };
        var visitorStatsExcelBtn = document.getElementById('visitorStatsExcelBtn');
        if (visitorStatsExcelBtn) visitorStatsExcelBtn.onclick = function () { exportVisitorStatsExcel(); };
        var productSalesQueryBtn = document.getElementById('productSalesQueryBtn');
        if (productSalesQueryBtn) productSalesQueryBtn.onclick = function () { loadProductSales(); };
        var productSalesExcelBtn = document.getElementById('productSalesExcelBtn');
        if (productSalesExcelBtn) productSalesExcelBtn.onclick = function () { exportProductSalesExcel(); };

        // 게시판관리: 탭, 검색, 초기화, 글작성, 모달, 수정/삭제
        document.querySelectorAll('#board-manage .board-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                var boardType = tab.getAttribute('data-board-type');
                if (boardType) switchBoardTab(boardType);
            });
        });
        var boardSearchBtn = document.getElementById('boardSearchBtn');
        if (boardSearchBtn) boardSearchBtn.onclick = function () { loadBoardPosts(getCurrentBoardType()); };
        var boardResetBtn = document.getElementById('boardResetBtn');
        if (boardResetBtn) {
            boardResetBtn.onclick = function () {
                var kw = document.getElementById('boardSearchKeyword');
                var author = document.getElementById('boardSearchAuthor');
                var start = document.getElementById('boardSearchStartDate');
                var end = document.getElementById('boardSearchEndDate');
                if (kw) kw.value = '';
                if (author) author.value = '';
                if (start) start.value = '';
                if (end) end.value = '';
                loadBoardPosts(getCurrentBoardType());
            };
        }
        var boardWriteBtn = document.getElementById('boardWriteBtn');
        if (boardWriteBtn) boardWriteBtn.onclick = function () { openBoardPostModal(null); };
        var boardPostModal = document.getElementById('boardPostModal');
        var boardPostModalClose = document.getElementById('boardPostModalClose');
        var boardPostModalCancel = document.getElementById('boardPostModalCancel');
        var boardPostModalSave = document.getElementById('boardPostModalSave');
        if (boardPostModalClose) boardPostModalClose.onclick = closeBoardPostModal;
        if (boardPostModalCancel) boardPostModalCancel.onclick = closeBoardPostModal;
        if (boardPostModalSave) boardPostModalSave.onclick = function () { saveBoardPost(); };
        if (boardPostModal && boardPostModal.querySelector('.modal-content')) {
            boardPostModal.querySelector('.modal-content').onclick = function (e) { e.stopPropagation(); };
            boardPostModal.onclick = function (e) { if (e.target === boardPostModal) closeBoardPostModal(); };
        }
        var boardTableBody = document.getElementById('boardTableBody');
        if (boardTableBody) {
            boardTableBody.addEventListener('click', function (e) {
                var row = e.target.closest('tr[data-post-id]');
                if (!row) return;
                var postId = row.getAttribute('data-post-id');
                if (e.target.classList.contains('btn-board-edit')) openBoardPostModal(postId);
                else if (e.target.classList.contains('btn-board-delete')) deleteBoardPost(postId);
            });
        }
        
        // 구매요청 및 승인대기: 검색/취소 버튼
        const purchaseRequestSearchBtn = document.getElementById('purchaseRequestSearchBtn');
        const purchaseRequestResetBtn = document.getElementById('purchaseRequestResetBtn');
        if (purchaseRequestSearchBtn) {
            purchaseRequestSearchBtn.onclick = function(e) {
                e.preventDefault();
                applyPurchaseRequestSearch();
                return false;
            };
        }
        if (purchaseRequestResetBtn) {
            purchaseRequestResetBtn.onclick = function(e) {
                e.preventDefault();
                const page = document.getElementById('purchase-request');
                const nameInput = page ? page.querySelector('#purchaseRequestSearchName') : document.getElementById('purchaseRequestSearchName');
                const startInput = page ? page.querySelector('#purchaseRequestStartDate') : document.getElementById('purchaseRequestStartDate');
                const endInput = page ? page.querySelector('#purchaseRequestEndDate') : document.getElementById('purchaseRequestEndDate');
                if (nameInput) nameInput.value = '';
                if (startInput) startInput.value = '';
                if (endInput) endInput.value = '';
                renderPurchaseRequestTable(window._purchaseRequestPendingOrders || []);
                return false;
            };
        }
        
        await renderProductTable(PRODUCT_DATA);
        renderLotteryStatus();
        updateConfirmPage();
    } catch (error) {
        console.error('초기 데이터 렌더링 오류:', error);
    }
    
    // 페이지네이션 초기화
    const pageNums = document.querySelectorAll('.page-num');
    if (pageNums && pageNums.length > 0) {
        pageNums.forEach(btn => {
            if (btn && btn.classList) {
                btn.addEventListener('click', () => {
                    pageNums.forEach(b => {
                        if (b && b.classList) {
                            b.classList.remove('active');
                        }
                    });
                    if (btn.classList) {
                        btn.classList.add('active');
                    }
                    
                    // 페이지 데이터 로드
                    const pageNumber = btn.textContent;
                    loadPageData(pageNumber);
                });
            }
        });
        console.log('페이지네이션 이벤트 리스너 등록 완료:', pageNums.length, '개');
    }
    
    // 헤더 버튼은 위의 전역 이벤트 위임에서 처리됨
    console.log('✅ 모든 네비게이션 이벤트 초기화 완료');
    
    // 상품 등록 - 선택 옵션 추가/삭제 버튼
    initProductOptionButtons();
    
    // 초기 활성화된 페이지가 member-search인 경우 데이터 로드
    const activePage = document.querySelector('.content-page.active');
    if (activePage && activePage.id === 'member-search') {
        console.log('🔵🔵🔵 초기 로드: member-search 페이지 활성화됨, 데이터 로드 시작');
        setTimeout(async () => {
            if (typeof window.loadAllMembers === 'function') {
                try {
                    await window.loadAllMembers();
                    console.log('✅✅✅ 초기 로드: 회원 데이터 로드 완료');
                } catch (error) {
                    console.error('❌ 초기 로드: 회원 데이터 로드 오류:', error);
                }
            } else {
                console.error('❌ 초기 로드: window.loadAllMembers 함수를 찾을 수 없습니다.');
            }
        }, 300);
    }
}

// 즉시 실행 + DOMContentLoaded + window.onload 모두 처리
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

// 전역 함수 노출
window.loadCategoriesForProduct = loadCategoriesForProduct;
window.registerProduct = registerProduct;
window.previewMainImage = previewMainImage;
window.previewDetailImage = previewDetailImage;
window.addDetailImageUpload = addDetailImageUpload;
window.removeLastDetailImageUpload = removeLastDetailImageUpload;
window.addDetailRow = addDetailRow;
window.removeDetailRow = removeDetailRow;
window.addProductOptionRow = addProductOptionRow;
window.fileToBase64 = fileToBase64;

// 초기화
console.log('10쇼핑게임 관리자 페이지 로드 완료');
