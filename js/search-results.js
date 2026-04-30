// 소수점 8자리까지 표시, 9번째부터 버림
function formatTrix(value) {
    var num = Number(value) || 0;
    if (num === 0) return '0';
    var truncated = Math.floor(num * 1e8) / 1e8;
    var str = truncated.toFixed(8);
    str = str.replace(/0+$/, '').replace(/\.$/, '');
    return str;
}

// URL에서 검색어 가져오기. 서버가 쿼리를 제거해도 sessionStorage 폴백으로 검색 유지.
function getSearchKeyword() {
    var search = window.location.search;
    if (!search && window.location.href && window.location.href.indexOf('?') !== -1) {
        search = window.location.href.slice(window.location.href.indexOf('?'));
    }
    var urlParams = new URLSearchParams(search || '');
    var q = urlParams.get('q');
    if (q != null && String(q).trim() !== '') return String(q).trim();
    var keyword = urlParams.get('keyword');
    if (keyword != null && String(keyword).trim() !== '') return String(keyword).trim();
    var searchParam = urlParams.get('search');
    if (searchParam != null && String(searchParam).trim() !== '') return String(searchParam).trim();
    try {
        var fromStorage = sessionStorage.getItem('searchKeyword');
        if (fromStorage != null && String(fromStorage).trim() !== '') {
            sessionStorage.removeItem('searchKeyword');
            return String(fromStorage).trim();
        }
    } catch (e) {}
    var searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) return String(searchInput.value).trim();
    return '';
}

// 상품의 카테고리 ID 추출 (Firestore Reference/문자열/배열 모두 처리)
function getProductCategoryId(product) {
    const raw = product.category != null ? product.category : product.categoryId;
    if (raw == null || raw === '') return '';
    if (Array.isArray(raw) && raw.length > 0) {
        const c = raw[0];
        if (c && typeof c === 'object' && (c.id != null || c.path)) return (c.id != null ? c.id : (c.path || '').split('/').pop()) || '';
        return String(c).trim();
    }
    if (typeof raw === 'object') {
        if (raw.id != null) return String(raw.id).trim();
        if (raw.path) return String((raw.path || '').split('/').pop()).trim();
        return '';
    }
    return String(raw).trim();
}

// Firestore에서 상품 검색
async function searchProductsFromFirestore(keyword) {
    console.log('🔍 Firestore에서 검색 시작:', keyword);
    
    try {
        if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.apps || firebase.apps.length === 0) {
            console.warn('[search-results] Firebase 미준비');
            return [];
        }
        const db = firebase.firestore();
        const lowerKeyword = keyword.toLowerCase();
        
        const categoryNameMap = {};
        try {
            const catSnap = await db.collection('categories').get();
            catSnap.forEach(doc => {
                const data = doc.data();
                const name = (data.name != null && String(data.name).trim() !== '') ? String(data.name).trim()
                    : (data.categoryName != null && String(data.categoryName).trim() !== '') ? String(data.categoryName).trim()
                    : (data.title != null && String(data.title).trim() !== '') ? String(data.title).trim()
                    : doc.id;
                categoryNameMap[doc.id] = name;
            });
        } catch (e) {
            console.warn('[search-results] 카테고리 맵 로드 실패:', e);
        }
        
        const productsSnapshot = await db.collection('products').get();
        const totalDocs = productsSnapshot.size;
        console.log('[search-results] products 컬렉션 조회:', totalDocs, '건 (status=sale만 검색 대상)');
        
        const results = [];
        
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            const status = (product.status || '').toString().toLowerCase();
            if (status !== 'sale') return;
            // 상품명: 관리자/ Firestore 저장 필드 name (productName, title 호환)
            const titleRaw = product.name || product.productName || product.title || '';
            const productName = String(titleRaw).toLowerCase();
            const productDesc = (product.shortDesc || product.description || product.desc || '').toLowerCase();
            let categoryId = '';
            let categoryName = '';
            try {
                categoryId = getProductCategoryId(product);
                categoryName = (categoryNameMap[categoryId] || '').toLowerCase();
            } catch (e) {
                console.warn('[search-results] 카테고리 추출 실패 docId=', doc.id, e);
            }
            
            if (productName.includes(lowerKeyword) ||
                productDesc.includes(lowerKeyword) ||
                categoryName.includes(lowerKeyword)) {
                
                const support = (product.supportAmount != null && product.supportAmount > 0) ? product.supportAmount : 0;
                results.push({
                    id: doc.id,
                    title: titleRaw,
                    option: product.shortDesc || product.description || product.desc || '',
                    support: formatTrix(support) + ' trix',
                    image: (window.resolveProductImageUrl && window.resolveProductImageUrl(product.mainImageUrl || product.imageUrl)) || product.mainImageUrl || product.imageUrl || 'https://placehold.co/300x300/E0E0E0/999?text=No+Image',
                    category: categoryId,
                    price: product.price,
                    badge: product.displayCategory || []
                });
            }
        });
        
        console.log('✅ 검색 완료: 매칭', results.length, '개 (전체', totalDocs, '건 중)');
        return results;
        
    } catch (error) {
        console.error('❌ 검색 오류:', error);
        return [];
    }
}

// 상품 카드 생성
function createProductCard(product) {
    const badgeLabels = {
        hit: '히트',
        new: '최신',
        recommend: '추천',
        popular: '인기',
        all: '전체'
    };
    
    const badgeArray = Array.isArray(product.badge) ? product.badge : [];
    const badges = badgeArray
        .filter(badge => badge !== 'all')
        .map(badge => `<span class="badge">${badgeLabels[badge] || badge}</span>`)
        .join('');
    
    const productId = product.id || '';
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const priceHtml = isLoggedIn && product.price != null && product.price !== '' ? (Number(product.price).toLocaleString() + '원') : '';
    return `
        <div class="product-card" data-product-id="${productId}">
            <a href="product-detail.html?id=${productId}" class="product-link">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}">
                    <div class="product-badge">
                        ${badges}
                    </div>
                </div>
            </a>
            <div class="product-info">
                <a href="product-detail.html?id=${productId}" class="product-title">${product.title}</a>
                <div class="product-option">${product.option || ''}</div>
                <div class="product-price">${priceHtml}</div>
                <div class="product-support">쇼핑지원금 ${product.support}</div>
                <div class="product-footer">
                    <div class="product-rating">
                        <span>고객평점</span>
                        <i class="fas fa-star"></i>
                        <span class="rating-value">0</span>
                    </div>
                    <button class="share-btn">
                        <i class="fas fa-share-alt"></i> 공유하기
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 검색 결과 고객평점 업데이트 (Firestore 상품후기 기준)
async function updateSearchResultRatings(results, productGrid) {
    if (!results || results.length === 0 || !productGrid || typeof firebase === 'undefined' || !firebase.firestore) return;
    const db = firebase.firestore();
    for (const product of results) {
        if (!product.id) continue;
        try {
            const snapshot = await db.collection('posts')
                .where('boardType', '==', 'review')
                .where('productId', '==', String(product.id))
                .get();
            let total = 0, count = 0;
            snapshot.docs.forEach(doc => {
                const d = doc.data();
                if ((d.reviewType === 'product' || !d.reviewType) && d.rating) {
                    total += d.rating;
                    count++;
                }
            });
            const avg = count > 0 ? (total / count).toFixed(1) : 0;
            const card = productGrid.querySelector('.product-card[data-product-id="' + product.id + '"]');
            if (card) {
                const span = card.querySelector('.product-rating .rating-value');
                if (span) span.textContent = avg;
            }
        } catch (e) {
            console.warn('검색 결과 평점 로드 실패:', product.id, e);
        }
    }
}

// 검색 결과 렌더링
async function renderSearchResults() {
    console.log('[search-results] renderSearchResults 시작');
    console.log('[search-results] location.href:', window.location.href);
    console.log('[search-results] location.search:', window.location.search);
    var keyword = getSearchKeyword();
    console.log('[search-results] getSearchKeyword() 반환값:', JSON.stringify(keyword), '| length:', (keyword || '').length);
    const keywordElement = document.getElementById('searchKeyword');
    const totalCountElement = document.getElementById('totalCount');
    const productGrid = document.getElementById('searchProductGrid');
    const noResults = document.getElementById('noResults');
    const searchInput = document.getElementById('searchInput');
    
    console.log('=== 검색 결과 렌더링 시작 ===');
    console.log('검색어(query):', JSON.stringify(keyword), '| length:', (keyword || '').length);
    
    // 검색어가 없으면 '검색 결과 없음'만 표시 (메인으로 리다이렉트하지 않음)
    if (!keyword) {
        if (keywordElement) keywordElement.textContent = '전체상품';
        if (totalCountElement) totalCountElement.textContent = '0';
        if (productGrid) productGrid.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
        const categoryList = document.querySelector('.filter-sidebar .category-list') || document.querySelector('#filterSidebar .category-list');
        if (categoryList) categoryList.innerHTML = '<a href="#">전체 (0)</a>';
        return;
    }
    
    // 검색어 표시
    if (keywordElement) {
        keywordElement.textContent = keyword;
    }
    
    // 검색창에 검색어 유지
    if (searchInput) {
        searchInput.value = keyword;
    }
    
        console.log('[search-results] searchProductsFromFirestore 호출 keyword=', keyword);
    var results = [];
    try {
        results = await searchProductsFromFirestore(keyword);
        console.log('[search-results] 검색 결과 개수:', results.length);
    } catch (e) {
        console.error('[search-results] searchProductsFromFirestore 오류:', e);
        if (e && e.stack) console.error('[search-results] 스택:', e.stack);
    }
    
    // 총 개수 표시
    if (totalCountElement) {
        totalCountElement.textContent = results.length;
    }
    
    // 결과 렌더링
    if (results.length > 0) {
        console.log('상품 카드 생성 중...');
        productGrid.innerHTML = results.map(product => createProductCard(product)).join('');
        productGrid.style.display = 'grid';
        noResults.style.display = 'none';
        updateSearchResultRatings(results, productGrid);
    } else {
        console.log('검색 결과 없음');
        productGrid.style.display = 'none';
        noResults.style.display = 'block';
    }
    
    // 카테고리 업데이트 (반드시 실행되도록)
    console.log('🔵🔵🔵 카테고리 목록 업데이트 시작 (results:', results.length, ')');
    try {
        await updateCategoryList(results);
        console.log('✅✅✅ 카테고리 목록 업데이트 완료');
    } catch (error) {
        console.error('❌❌❌ 카테고리 목록 업데이트 실패:', error);
        console.error('에러 스택:', error.stack);
    }
    console.log('=== 검색 결과 렌더링 완료 ===');
}

// 카테고리 목록 업데이트
let _categoryNameMapCache = null;
async function updateCategoryList(results) {
    console.log('🔵 updateCategoryList 호출됨, results:', results.length);
    const categoryList = document.querySelector('.filter-sidebar .category-list');
    if (!categoryList) {
        console.error('❌ 카테고리 리스트 요소를 찾을 수 없습니다. selector: .filter-sidebar .category-list');
        // 다른 selector 시도
        const altCategoryList = document.querySelector('#filterSidebar .category-list');
        if (altCategoryList) {
            console.log('✅ 대체 selector로 찾음: #filterSidebar .category-list');
            return await updateCategoryListWithElement(results, altCategoryList);
        }
        return;
    }
    return await updateCategoryListWithElement(results, categoryList);
}

async function updateCategoryListWithElement(results, categoryList) {
    
    // 카테고리 ID → 이름 맵 로드 (캐시 사용)
    if (!_categoryNameMapCache || Object.keys(_categoryNameMapCache).length === 0) {
        console.log('🔵 카테고리 이름 맵 로드 시작...');
        _categoryNameMapCache = {};
        try {
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.error('❌ Firebase가 초기화되지 않았습니다.');
            } else {
                const snapshot = await firebase.firestore().collection('categories').get();
                console.log('🔵 카테고리 문서 개수:', snapshot.size);
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const displayName = (data.name != null && String(data.name).trim() !== '')
                        ? String(data.name).trim()
                        : ((data.categoryName != null && String(data.categoryName).trim() !== '')
                            ? String(data.categoryName).trim()
                            : ((data.title != null && String(data.title).trim() !== '')
                                ? String(data.title).trim()
                                : doc.id));
                    _categoryNameMapCache[doc.id] = displayName;
                });
                console.log('✅ 카테고리 이름 맵 로드 완료:', Object.keys(_categoryNameMapCache).length, '개');
                console.log('카테고리 이름 맵 샘플:', Object.entries(_categoryNameMapCache).slice(0, 3));
            }
        } catch (error) {
            console.error('❌ 카테고리 이름 맵 로드 실패:', error);
        }
    } else {
        console.log('✅ 카테고리 이름 맵 캐시 사용:', Object.keys(_categoryNameMapCache).length, '개');
    }
    
    // 카테고리별 개수 계산
    const categoryMap = {};
    
    results.forEach(product => {
        const catId = typeof product.category === 'string'
            ? product.category
            : getProductCategoryId({ category: product.category, categoryId: product.category });
        const catName = (catId && _categoryNameMapCache && _categoryNameMapCache[catId])
            ? _categoryNameMapCache[catId]
            : (catId && typeof catId === 'string' && catId.length < 15 ? catId : '기타');
        if (!catId) {
            if (!categoryMap['기타']) categoryMap['기타'] = 0;
            categoryMap['기타']++;
            return;
        }
        if (!categoryMap[catName]) categoryMap[catName] = 0;
        categoryMap[catName]++;
    });
    
    console.log('카테고리 맵:', categoryMap);
    console.log('카테고리 이름 맵 캐시:', _categoryNameMapCache);
    
    // 카테고리 HTML 생성
    let html = `<a href="#">전체 (${results.length})</a>`;
    Object.keys(categoryMap).sort().forEach(category => {
        const count = categoryMap[category];
        html += `<a href="#">${category} (${count})</a>`;
    });
    
    categoryList.innerHTML = html;
    console.log('✅ 카테고리 목록 업데이트 완료:', Object.keys(categoryMap).length, '개');
}

// 필터 토글
function initFilterToggle() {
    const filterToggle = document.getElementById('filterToggle');
    const filterSidebar = document.getElementById('filterSidebar');
    
    if (filterToggle && filterSidebar) {
        filterToggle.addEventListener('click', () => {
            filterSidebar.classList.toggle('active');
        });
    }
}

// 정렬 변경
function initSortChange() {
    const sortSelect = document.getElementById('sortSelect');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            console.log('정렬 변경:', sortSelect.value);
            // 정렬 기능은 추후 구현
        });
    }
}

// 가격 필터
async function initPriceFilter() {
    const applyBtn = document.querySelector('.apply-btn');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const minPrice = parseInt(minPriceInput.value) || 0;
            const maxPrice = parseInt(maxPriceInput.value) || Infinity;
            
            const keyword = getSearchKeyword();
            let results = await searchProductsFromFirestore(keyword);
            
            // 가격 필터링
            results = results.filter(product => {
                return product.price >= minPrice && product.price <= maxPrice;
            });
            
            // 필터링된 결과 렌더링
            const productGrid = document.getElementById('searchProductGrid');
            const noResults = document.getElementById('noResults');
            const totalCountElement = document.getElementById('totalCount');
            
            if (totalCountElement) {
                totalCountElement.textContent = results.length;
            }
            
            if (results.length > 0) {
                productGrid.innerHTML = results.map(product => createProductCard(product)).join('');
                productGrid.style.display = 'grid';
                noResults.style.display = 'none';
            } else {
                productGrid.style.display = 'none';
                noResults.style.display = 'block';
            }
            
            await updateCategoryList(results);
        });
    }
}

// 검색 폼 핸들러
function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput.value.trim();
    
    if (keyword) {
        try { sessionStorage.setItem('searchKeyword', keyword); } catch (e) {}
        window.location.href = '/search-results.html?q=' + encodeURIComponent(keyword);
    }
    
    return false;
}

// Firebase 준비 대기 (검색 JS가 Firebase 로딩보다 먼저 실행되지 않도록)
function waitForFirebaseReady() {
    if (typeof window.whenFirebaseReady === 'function') {
        return window.whenFirebaseReady();
    }
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        return Promise.resolve();
    }
    return new Promise(function (resolve) {
        var check = setInterval(function () {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                clearInterval(check);
                resolve();
            }
        }, 100);
    });
}

// 초기화
async function init() {
    console.log('[search-results] init 시작');
    try {
        console.log('[search-results] whenFirebaseReady 대기 중...');
        await waitForFirebaseReady();
        console.log('[search-results] whenFirebaseReady 완료');

        // 로그인 상태 업데이트
        setTimeout(function () {
            if (typeof window.updateHeaderForLoginStatus === 'function') {
                window.updateHeaderForLoginStatus();
            }
        }, 100);

        console.log('✅ Firebase SDK 로드 완료');

        // script.js의 함수들 초기화
        if (typeof initSearchToggle === 'function') {
            try { initSearchToggle(); } catch (e) { console.warn('⚠️ 검색 토글 초기화 실패:', e); }
        }
        if (typeof initCategorySidebar === 'function') {
            try { initCategorySidebar(); } catch (e) { console.warn('⚠️ 카테고리 사이드바 초기화 실패:', e); }
        }

        // Firebase 준비 후에만 검색 결과 렌더링 (순서 보장)
        console.log('[search-results] renderSearchResults 호출');
        await renderSearchResults();
        console.log('[search-results] renderSearchResults 완료');
    
    // 최근 본 상품 초기화 (검색 결과 렌더링 후)
    console.log('🔵🔵🔵 최근 본 상품 초기화 예약...');
    setTimeout(() => {
        console.log('🔵🔵🔵 최근 본 상품 초기화 시작...');
        try {
            initSearchResultsViewedProducts();
        } catch (error) {
            console.error('❌❌❌ 최근 본 상품 초기화 실패:', error);
            console.error('에러 스택:', error.stack);
        }
    }, 300);
    
    // 필터 초기화
    initFilterToggle();
    initSortChange();
    initPriceFilter();
    
    // 공유 버튼 초기화
    initShareButtonsForSearch();
    
        console.log('[search-results] init 완료');
    } catch (err) {
        console.error('[search-results] init 오류:', err);
        if (err && err.stack) console.error('[search-results] 스택:', err.stack);
    }
}

// 검색 결과 페이지용 최근 본 상품 초기화 (today-viewed.js 사용 시 스킵)
function initSearchResultsViewedProducts() {
    if (typeof window.updateViewedCount === 'function') return;
    const toggleViewed = document.getElementById('toggleViewed');
    const viewedPanel = document.getElementById('viewedPanel');
    const viewedPanelClose = document.getElementById('viewedPanelClose');
    const viewedList = document.getElementById('viewedList');
    const viewedCountBadge = document.getElementById('viewedCountBadge');
    const btnClearAll = document.getElementById('btnClearAll');
    
    console.log('🔵 DOM 요소 확인:', {
        toggleViewed: !!toggleViewed,
        viewedPanel: !!viewedPanel,
        viewedPanelClose: !!viewedPanelClose,
        viewedList: !!viewedList,
        viewedCountBadge: !!viewedCountBadge,
        btnClearAll: !!btnClearAll
    });
    
    if (!toggleViewed || !viewedPanel) {
        console.error('❌ 최근 본 상품 요소를 찾을 수 없습니다. toggleViewed:', !!toggleViewed, 'viewedPanel:', !!viewedPanel);
        // 요소를 찾을 수 없으면 나중에 다시 시도
        setTimeout(() => {
            console.log('🔵 최근 본 상품 재시도...');
            initSearchResultsViewedProducts();
        }, 500);
        return;
    }
    
    console.log('✅ 최근 본 상품 요소 찾기 성공');

    function updateViewedList() {
        if (!viewedList) return;

        const viewedProducts = JSON.parse(localStorage.getItem('todayViewedProducts') || '[]');
        
        // 중복 제거
        const uniqueProducts = [];
        const seenIds = new Set();
        for (let i = 0; i < viewedProducts.length; i++) {
            const product = viewedProducts[i];
            if (product && product.id && !seenIds.has(product.id)) {
                seenIds.add(product.id);
                uniqueProducts.push(product);
            }
        }
        
        if (uniqueProducts.length !== viewedProducts.length) {
            localStorage.setItem('todayViewedProducts', JSON.stringify(uniqueProducts));
        }
        
        const count = uniqueProducts.length;
        if (viewedCountBadge) viewedCountBadge.textContent = count;
        if (toggleViewed) {
            const countEl = toggleViewed.querySelector('.count');
            if (countEl) countEl.textContent = count;
        }
        
        if (uniqueProducts.length === 0) {
            viewedList.innerHTML = '<p class="empty-message">최근 본 상품이 없습니다.</p>';
            return;
        }

        const showPrice = localStorage.getItem('isLoggedIn') === 'true';
        const listHTML = uniqueProducts.map(product => `
            <div class="viewed-item" data-product-id="${product.id || ''}" style="cursor: pointer;">
                <img src="${product.image || 'https://via.placeholder.com/80x80'}" alt="${product.name}">
                <div class="viewed-item-info">
                    <p>${(product.name || '').replace(/</g, '&lt;')}</p>
                    <span class="price">${showPrice && product.price ? product.price.toLocaleString() + '원' : ''}</span>
                </div>
            </div>
        `).join('');

        viewedList.innerHTML = listHTML;

        // 클릭 이벤트 추가
        const viewedItems = viewedList.querySelectorAll('.viewed-item');
        viewedItems.forEach(item => {
            item.addEventListener('click', () => {
                const productId = item.getAttribute('data-product-id');
                if (productId) {
                    if (viewedPanel) viewedPanel.classList.remove('active');
                    window.location.href = `product-detail.html?id=${productId}`;
                }
            });
        });
    }

    function updateViewedCount() {
        const viewedProducts = JSON.parse(localStorage.getItem('todayViewedProducts') || '[]');
        const uniqueIds = new Set();
        viewedProducts.forEach(product => {
            if (product && product.id) {
                uniqueIds.add(product.id);
            }
        });
        const count = uniqueIds.size;
        if (viewedCountBadge) viewedCountBadge.textContent = count;
        if (toggleViewed) {
            const countEl = toggleViewed.querySelector('.count');
            if (countEl) countEl.textContent = count;
        }
    }

    if (toggleViewed && viewedPanel) {
        toggleViewed.addEventListener('click', () => {
            viewedPanel.classList.add('active');
            updateViewedList();
        });
    }

    if (viewedPanelClose && viewedPanel) {
        viewedPanelClose.addEventListener('click', () => {
            viewedPanel.classList.remove('active');
        });
    }

    if (viewedPanel) {
        const overlay = viewedPanel.querySelector('.viewed-panel-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                viewedPanel.classList.remove('active');
            });
        }
    }

    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            if (confirm('최근 본 상품을 모두 삭제하시겠습니까?')) {
                localStorage.removeItem('todayViewedProducts');
                updateViewedList();
                updateViewedCount();
            }
        });
    }

    // 초기 목록 업데이트
    updateViewedCount();
}

// 공유 버튼 이벤트 (검색 결과 페이지용)
function initShareButtonsForSearch() {
    document.addEventListener('click', (e) => {
        const shareBtn = e.target.closest('.share-btn');
        if (shareBtn) {
            e.preventDefault();
            
            // 상품 카드에서 정보 추출
            const productCard = shareBtn.closest('.product-card');
            if (productCard) {
                const productId = productCard.querySelector('a')?.href?.split('id=')[1];
                const productName = productCard.querySelector('.product-name')?.textContent;
                const productImage = productCard.querySelector('.product-image img')?.src;
                
                // 공유 모달 표시
                if (typeof showShareModal === 'function') {
                    showShareModal(productId, productName, productImage);
                } else {
                    alert('공유 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                }
            }
        }
    });
}

// DOM 로드 완료 시 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
