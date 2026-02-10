// URL에서 검색어 가져오기
function getSearchKeyword() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q') || '';
}

// 검색어 로그 저장
async function saveSearchLog(keyword) {
    if (!keyword || keyword.trim() === '') return;
    
    try {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.warn('Firebase가 초기화되지 않아 검색 로그를 저장할 수 없습니다.');
            return;
        }
        
        const db = firebase.firestore();
        await db.collection('searchLogs').add({
            keyword: keyword.trim(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date()
        });
        
        console.log('✅ 검색어 저장:', keyword);
    } catch (error) {
        console.error('❌ 검색어 저장 오류:', error);
    }
}

// Firestore에서 상품 검색
async function searchProductsFromFirestore(keyword) {
    console.log('🔍 Firestore에서 검색 시작:', keyword);
    
    try {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.error('❌ Firebase가 초기화되지 않았습니다.');
            return [];
        }
        
        const db = firebase.firestore();
        const lowerKeyword = keyword.toLowerCase();
        
        // 모든 판매 중인 상품 가져오기
        const productsSnapshot = await db.collection('products')
            .where('status', '==', 'sale')
            .get();
        
        const results = [];
        
        productsSnapshot.forEach(doc => {
            const product = doc.data();
            const productName = (product.name || '').toLowerCase();
            const productDesc = (product.shortDesc || '').toLowerCase();
            const productCategory = (product.category || '').toLowerCase();
            
            // 이름, 설명, 카테고리에서 검색
            if (productName.includes(lowerKeyword) || 
                productDesc.includes(lowerKeyword) || 
                productCategory.includes(lowerKeyword)) {
                
                const support = Math.floor(product.price * (product.supportRate || 5) / 100);
                
                results.push({
                    id: doc.id,
                    title: product.name,
                    option: product.shortDesc || '',
                    support: support.toLocaleString() + '원',
                    image: product.mainImageUrl || product.imageUrl || 'https://placehold.co/300x300/E0E0E0/999?text=No+Image',
                    category: product.category || '',
                    price: product.price,
                    badge: product.displayCategory || []
                });
            }
        });
        
        console.log('✅ 검색 완료:', results.length, '개');
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
    
    return `
        <div class="product-card">
            <a href="product-detail.html?id=${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}">
                    <div class="product-badge">
                        ${badges}
                    </div>
                </div>
            </a>
            <div class="product-info">
                <a href="product-detail.html?id=${product.id}" class="product-title">${product.title}</a>
                <div class="product-option">${product.option || ''}</div>
                <div class="product-support">쇼핑지원금 ${product.support}</div>
                <div class="product-footer">
                    <div class="product-rating">
                        <span>고객평점</span>
                        <i class="fas fa-star"></i>
                        <span>0</span>
                    </div>
                    <button class="share-btn">
                        <i class="fas fa-share-alt"></i> 공유하기
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 검색 결과 렌더링
async function renderSearchResults() {
    const keyword = getSearchKeyword();
    const keywordElement = document.getElementById('searchKeyword');
    const totalCountElement = document.getElementById('totalCount');
    const productGrid = document.getElementById('searchProductGrid');
    const noResults = document.getElementById('noResults');
    const searchInput = document.getElementById('searchInput');
    
    console.log('=== 검색 결과 렌더링 시작 ===');
    console.log('검색어:', keyword);
    
    // 검색어가 없으면 기본 메시지
    if (!keyword) {
        if (keywordElement) {
            keywordElement.textContent = '전체상품';
        }
        noResults.style.display = 'block';
        productGrid.style.display = 'none';
        return;
    }
    
    // 검색어 로그 저장
    await saveSearchLog(keyword);
    
    // 검색어 표시
    if (keywordElement) {
        keywordElement.textContent = keyword;
    }
    
    // 검색창에 검색어 유지
    if (searchInput) {
        searchInput.value = keyword;
    }
    
    // Firebase에서 검색
    const results = await searchProductsFromFirestore(keyword);
    console.log('검색 결과 개수:', results.length);
    
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
    } else {
        console.log('검색 결과 없음');
        productGrid.style.display = 'none';
        noResults.style.display = 'block';
    }
    
    // 카테고리 업데이트
    updateCategoryList(results);
    console.log('=== 검색 결과 렌더링 완료 ===');
}

// 카테고리 목록 업데이트
function updateCategoryList(results) {
    const categoryList = document.querySelector('.filter-sidebar .category-list');
    if (!categoryList) return;
    
    // 카테고리별 개수 계산
    const categoryMap = {};
    
    results.forEach(product => {
        const cat = product.category || '기타';
        if (!categoryMap[cat]) {
            categoryMap[cat] = 0;
        }
        categoryMap[cat]++;
    });
    
    // 카테고리 HTML 생성
    let html = `<a href="#">전체 (${results.length})</a>`;
    Object.keys(categoryMap).sort().forEach(category => {
        const count = categoryMap[category];
        html += `<a href="#">${category} (${count})</a>`;
    });
    
    categoryList.innerHTML = html;
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
            
            updateCategoryList(results);
        });
    }
}

// 검색 폼 핸들러
function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput.value.trim();
    
    if (keyword) {
        window.location.href = `search-results.html?q=${encodeURIComponent(keyword)}`;
    }
    
    return false;
}

// 초기화
async function init() {
    console.log('🚀 검색 결과 페이지 초기화 시작');
    
    // Firebase 대기
    if (typeof firebase === 'undefined') {
        console.log('⏳ Firebase SDK 로딩 대기...');
        await new Promise(resolve => {
            const checkFirebase = setInterval(() => {
                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    clearInterval(checkFirebase);
                    resolve();
                }
            }, 100);
        });
    }
    
    console.log('✅ Firebase SDK 로드 완료');
    
    // script.js의 함수들 초기화
    if (typeof initNoticeBanner === 'function') {
        try {
            initNoticeBanner();
        } catch (e) {
            console.warn('⚠️ 공지 배너 초기화 실패:', e);
        }
    }
    
    if (typeof initSearchToggle === 'function') {
        try {
            initSearchToggle();
        } catch (e) {
            console.warn('⚠️ 검색 토글 초기화 실패:', e);
        }
    }
    
    if (typeof initCategorySidebar === 'function') {
        try {
            initCategorySidebar();
        } catch (e) {
            console.warn('⚠️ 카테고리 사이드바 초기화 실패:', e);
        }
    }
    
    // 검색 결과 렌더링
    await renderSearchResults();
    
    // 필터 초기화
    initFilterToggle();
    initSortChange();
    initPriceFilter();
    
    console.log('✅ 검색 결과 페이지 초기화 완료');
}

// DOM 로드 완료 시 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
