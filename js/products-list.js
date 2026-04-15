console.log('[products-list] 스크립트 로드됨, readyState=', typeof document !== 'undefined' ? document.readyState : 'N/A');

// 이 시점 이후 등록 = 새 상품(등록순 최신순). 이 시점 이전 = 기존 상품(키워드별 묶음 유지). 필요 시 날짜만 수정.
const NEW_PRODUCT_CUTOFF_MS = new Date('2025-03-13T00:00:00+09:00').getTime();

// Firestore createdAt → 밀리초 (메인과 동일한 최신순 정렬용)
function getCreatedAtMs(createdAt) {
    if (!createdAt) return 0;
    if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
    if (createdAt.seconds != null) return createdAt.seconds * 1000;
    if (typeof createdAt.toDate === 'function') return createdAt.toDate().getTime();
    if (typeof createdAt.getTime === 'function') return createdAt.getTime();
    return 0;
}

// 소수점 8자리까지 표시, 9번째부터 버림
function formatTrix(value) {
    var num = Number(value) || 0;
    if (num === 0) return '0';
    var truncated = Math.floor(num * 1e8) / 1e8;
    var str = truncated.toFixed(8);
    str = str.replace(/0+$/, '').replace(/\.$/, '');
    return str;
}

// 상품 목록 페이지 JavaScript

// 페이지 설정
const PAGE_CONFIG = {
    hit: {
        title: '상품목록',
        icon: 'fa-shopping-bag',
        description: '상품 목록입니다.',
        breadcrumb: '상품목록'
    },
    recommend: {
        title: '상품목록',
        icon: 'fa-shopping-bag',
        description: '상품 목록입니다.',
        breadcrumb: '상품목록'
    },
    new: {
        title: '상품목록',
        icon: 'fa-shopping-bag',
        description: '상품 목록입니다.',
        breadcrumb: '상품목록'
    },
    popular: {
        title: '상품목록',
        icon: 'fa-shopping-bag',
        description: '상품 목록입니다.',
        breadcrumb: '상품목록'
    }
};

// 전역 변수
let currentType = 'hit';
let currentCategory = null; // 카테고리 ID
let currentPage = 1;
const ROWS_PER_PAGE = 15;
const GRID_COLUMNS = 4;
let itemsPerPage = ROWS_PER_PAGE * GRID_COLUMNS;
let currentProducts = [];
let currentSort = 'recent';

// DOM 요소
const listElements = {
    pageTitle: document.getElementById('pageTitle'),
    pageHeading: document.getElementById('pageHeading'),
    pageDescription: document.getElementById('pageDescription'),
    breadcrumbCurrent: document.getElementById('breadcrumbCurrent'),
    productGrid: document.getElementById('productGrid'),
    totalCount: document.getElementById('totalCount'),
    pagination: document.getElementById('pagination'),
    pageNumbers: document.getElementById('pageNumbers'),
    sortSelect: document.getElementById('sortSelect'),
    viewBtns: document.querySelectorAll('.view-btn'),
    searchToggle: document.getElementById('searchToggle'),
    popularKeywords: document.getElementById('popularKeywords')
};

// URL 파라미터 읽기
function getUrlParameter(name, defaultValue = null) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || defaultValue;
}

/** ?page= 쿼리와 목록 페이지 동기화 (상세에서 뒤로가기 시 동일 페이지 유지) */
function replaceListPageUrl(page) {
    try {
        var url = new URL(window.location.href);
        if (page <= 1) url.searchParams.delete('page');
        else url.searchParams.set('page', String(page));
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) { /* ignore */ }
}

function applyListPageFromUrlAfterProductsLoaded() {
    itemsPerPage = getItemsPerPageForView();
    var totalPages = Math.max(1, Math.ceil(currentProducts.length / itemsPerPage));
    var p = parseInt(new URLSearchParams(window.location.search || '').get('page') || '1', 10);
    if (isNaN(p) || p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    currentPage = p;
    replaceListPageUrl(currentPage);
}

// 페이지 초기화
async function initPage() {
    console.log('[products-list] initPage 시작');
    try {
        if (typeof window.whenFirebaseReady === 'function') {
            console.log('[products-list] whenFirebaseReady 대기 중...');
            await window.whenFirebaseReady();
            console.log('[products-list] whenFirebaseReady 완료');
        } else {
            console.warn('[products-list] whenFirebaseReady 없음');
        }
        var urlParams = new URLSearchParams(window.location.search || '');
        currentCategory = urlParams.get('category');
        currentType = urlParams.get('type');
        if (currentCategory !== null && currentCategory.trim() === '') currentCategory = null;
        if (currentType !== null && currentType.trim() === '') currentType = null;
        if (currentCategory) currentType = null;
        else if (!currentType) currentType = 'hit';
        console.log('[products-list] URL category=', currentCategory, 'type=', currentType);
        console.log('[products-list] updatePageInfo 호출');
        await updatePageInfo();
        console.log('[products-list] updatePageInfo 완료, loadProducts 호출');
        await loadProducts();
        console.log('[products-list] loadProducts 완료');
        initEventListeners();
        console.log('[products-list] initPage 완료');
    } catch (err) {
        console.error('[products-list] initPage 오류:', err);
        console.error('[products-list] 스택:', err && err.stack);
    }
}

// 카테고리 경로 가져오기 (현재 카테고리부터 루트까지)
async function getCategoryPath(categoryId) {
    if (!categoryId || typeof firebase === 'undefined' || !firebase.firestore) {
        return [];
    }
    
    try {
        const db = firebase.firestore();
        const path = [];
        let currentId = categoryId;
        
        // 현재 카테고리부터 루트까지 역순으로 수집
        while (currentId) {
            const categoryDoc = await db.collection('categories').doc(currentId).get();
            if (!categoryDoc.exists) break;
            
            const categoryData = categoryDoc.data();
            const categoryName = categoryData.name || categoryData.categoryName || categoryData.title || '카테고리';
            
            path.unshift({
                id: currentId,
                name: categoryName,
                level: categoryData.level || 1,
                parentId: categoryData.parentId || null
            });
            
            currentId = categoryData.parentId || null;
        }
        
        return path;
    } catch (error) {
        console.error('카테고리 경로 로드 오류:', error);
        return [];
    }
}

// 같은 레벨의 카테고리 목록 가져오기
async function getSiblingCategories(categoryId) {
    if (!categoryId || typeof firebase === 'undefined' || !firebase.firestore) {
        return [];
    }
    
    try {
        const db = firebase.firestore();
        const categoryDoc = await db.collection('categories').doc(categoryId).get();
        
        if (!categoryDoc.exists) return [];
        
        const categoryData = categoryDoc.data();
        const parentId = categoryData.parentId || null;
        const level = categoryData.level || 1;
        
        // 같은 부모를 가진 카테고리들 가져오기
        let query = db.collection('categories')
            .where('level', '==', level);
        
        if (parentId) {
            query = query.where('parentId', '==', parentId);
        } else {
            query = query.where('parentId', '==', null);
        }
        
        const snapshot = await query.get();
        const siblings = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.isHidden !== true && data.isPublic !== false) {
                const name = data.name || data.categoryName || data.title || '카테고리';
                siblings.push({
                    id: doc.id,
                    name: name,
                    sortOrder: data.sortOrder || 0
                });
            }
        });
        
        // 정렬
        siblings.sort((a, b) => {
            const aOrder = a.sortOrder || 0;
            const bOrder = b.sortOrder || 0;
            return aOrder - bOrder;
        });
        
        return siblings;
    } catch (error) {
        console.error('형제 카테고리 로드 오류:', error);
        return [];
    }
}

// 브레드크럼 현재 카테고리 옆에 상품 개수 표시
function updateBreadcrumbProductCount(count) {
    const el = document.getElementById('breadcrumbProductCount');
    if (!el) return;
    el.textContent = count >= 0 ? ' (' + count + '개)' : '';
}

// 브레드크럼 렌더링
async function renderCategoryBreadcrumb() {
    console.log('🔍 브레드크럼 렌더링 시작, currentCategory:', currentCategory);
    
    const breadcrumbContainer = document.getElementById('categoryBreadcrumb');
    const breadcrumbList = document.getElementById('categoryBreadcrumbList');
    
    if (!breadcrumbContainer) {
        console.error('❌ categoryBreadcrumb 요소를 찾을 수 없습니다.');
        return;
    }
    
    if (!breadcrumbList) {
        console.error('❌ categoryBreadcrumbList 요소를 찾을 수 없습니다.');
        return;
    }
    
    if (!currentCategory) {
        console.log('ℹ️ currentCategory가 없어 브레드크럼을 숨깁니다.');
        breadcrumbContainer.style.display = 'none';
        return;
    }
    
    // 카테고리 경로 가져오기
    console.log('🔍 카테고리 경로 가져오는 중...');
    const categoryPath = await getCategoryPath(currentCategory);
    console.log('✅ 카테고리 경로:', categoryPath);
    
    if (categoryPath.length === 0) {
        console.warn('⚠️ 카테고리 경로가 비어있어 브레드크럼을 숨깁니다.');
        breadcrumbContainer.style.display = 'none';
        return;
    }
    
    // 브레드크럼 표시
    breadcrumbContainer.style.display = 'block';
    console.log('✅ 브레드크럼 표시');
    
    let html = '';
    
    // 홈 추가
    html += '<li><a href="index.html"><i class="fas fa-home"></i> 홈</a></li>';
    
    // 각 카테고리 경로 추가
    for (let i = 0; i < categoryPath.length; i++) {
        const category = categoryPath[i];
        const isLast = i === categoryPath.length - 1;
        
        html += '<li><i class="fas fa-chevron-right"></i></li>';
        
        if (isLast) {
            // 마지막 항목: 카테고리명 + 상품 개수(로드 후 updateBreadcrumbProductCount에서 채움)
            html += `<li class="current">${category.name}<span class="breadcrumb-product-count" id="breadcrumbProductCount"></span></li>`;
        } else {
            // 중간 항목은 드롭다운 가능한 링크
            const siblings = await getSiblingCategories(category.id);
            
            if (siblings.length > 1) {
                // 형제 카테고리가 있으면 드롭다운
                html += `<li class="breadcrumb-dropdown">`;
                html += `<a href="/products-list?category=${category.id}" class="breadcrumb-link">${category.name} <i class="fas fa-chevron-down"></i></a>`;
                html += `<ul class="breadcrumb-dropdown-menu">`;
                siblings.forEach(sibling => {
                    const isActive = sibling.id === category.id;
                    html += `<li><a href="/products-list?category=${sibling.id}" class="${isActive ? 'active' : ''}">${sibling.name}</a></li>`;
                });
                html += `</ul>`;
                html += `</li>`;
            } else {
                // 형제 카테고리가 없으면 일반 링크
                html += `<li><a href="/products-list?category=${category.id}">${category.name}</a></li>`;
            }
        }
    }
    
    breadcrumbList.innerHTML = html;
    updateBreadcrumbProductCount(currentProducts.length);
    console.log('✅ 브레드크럼 HTML 생성 완료');

    // 드롭다운 이벤트 리스너 추가
    const dropdownLinks = breadcrumbList.querySelectorAll('.breadcrumb-dropdown > .breadcrumb-link');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdown = link.parentElement;
            const menu = dropdown.querySelector('.breadcrumb-dropdown-menu');
            
            // 다른 드롭다운 닫기
            breadcrumbList.querySelectorAll('.breadcrumb-dropdown-menu').forEach(m => {
                if (m !== menu) m.classList.remove('active');
            });
            
            // 현재 드롭다운 토글
            menu.classList.toggle('active');
        });
    });
    
    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.breadcrumb-dropdown')) {
            breadcrumbList.querySelectorAll('.breadcrumb-dropdown-menu').forEach(menu => {
                menu.classList.remove('active');
            });
            breadcrumbList.querySelectorAll('.breadcrumb-dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
}

// 페이지 정보 업데이트
async function updatePageInfo() {
    // 카테고리 모드인 경우
    if (currentCategory) {
        try {
            // 카테고리 이름 가져오기
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                const db = firebase.firestore();
                const categoryDoc = await db.collection('categories').doc(currentCategory).get();
                
                if (categoryDoc.exists) {
                    const categoryData = categoryDoc.data();
                    const categoryName = categoryData.name || categoryData.categoryName || categoryData.title || '카테고리';
                    
                    if (listElements.pageTitle) {
                        listElements.pageTitle.textContent = `${categoryName} - 10쇼핑게임`;
                    }
                    if (listElements.pageHeading) {
                        listElements.pageHeading.innerHTML = `<i class="fas fa-tag"></i> ${categoryName}`;
                    }
                    if (listElements.pageDescription) {
                        listElements.pageDescription.textContent = `${categoryName} 카테고리의 상품입니다.`;
                    }
                    if (listElements.breadcrumbCurrent) {
                        listElements.breadcrumbCurrent.textContent = categoryName;
                    }
                    
                    const pageHeader = document.querySelector('.page-header');
                    if (pageHeader) {
                        pageHeader.setAttribute('data-category', currentCategory);
                        pageHeader.removeAttribute('data-type');
                    }
                    
                    // 브레드크럼 렌더링
                    await renderCategoryBreadcrumb();
                    
                    return;
                }
                // 카테고리 문서가 없으면 "카테고리를 찾을 수 없습니다" 표시 (히트상품으로 넘어가지 않음)
                if (listElements.pageTitle) listElements.pageTitle.textContent = '카테고리 - 10쇼핑게임';
                if (listElements.pageHeading) listElements.pageHeading.innerHTML = '<i class="fas fa-tag"></i> 카테고리를 찾을 수 없습니다';
                if (listElements.pageDescription) listElements.pageDescription.textContent = '해당 카테고리가 없거나 삭제되었습니다.';
                if (listElements.breadcrumbCurrent) listElements.breadcrumbCurrent.textContent = '카테고리 없음';
                const pageHeader = document.querySelector('.page-header');
                if (pageHeader) {
                    pageHeader.setAttribute('data-category', currentCategory);
                    pageHeader.removeAttribute('data-type');
                }
                return;
            }
        } catch (error) {
            console.error('카테고리 정보 로드 오류:', error);
        }
        // 카테고리 로드 실패 시에도 히트상품으로 넘기지 않음
        if (listElements.pageTitle) listElements.pageTitle.textContent = '카테고리 - 10쇼핑게임';
        if (listElements.pageHeading) listElements.pageHeading.innerHTML = '<i class="fas fa-tag"></i> 카테고리 정보를 불러올 수 없습니다';
        if (listElements.pageDescription) listElements.pageDescription.textContent = '잠시 후 다시 시도해 주세요.';
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) pageHeader.setAttribute('data-category', currentCategory);
        return;
    } else {
        // 타입 모드일 때는 브레드크럼 숨기기
        const breadcrumbContainer = document.getElementById('categoryBreadcrumb');
        if (breadcrumbContainer) breadcrumbContainer.style.display = 'none';
    }
    
    // category 없을 때: 상단 멘트 비움 (카테고리 선택 시에만 카테고리명 표시)
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.removeAttribute('data-category');
        pageHeader.setAttribute('data-type', currentType || '');
    }
    if (listElements.pageTitle) listElements.pageTitle.textContent = '10쇼핑게임';
    if (listElements.pageHeading) listElements.pageHeading.innerHTML = '';
    if (listElements.pageDescription) listElements.pageDescription.textContent = '';
    if (listElements.breadcrumbCurrent) listElements.breadcrumbCurrent.textContent = '';
}

// Firestore 조회 타임아웃 (ms) - 이 시간 안에 응답 없으면 상품 없음 처리
const PRODUCTS_LOAD_TIMEOUT_MS = 10000;

// 상품에 저장된 카테고리 ID 하나 추출 (관리자 입력폼에서 선택한 값). 문자열/Reference 모두 처리.
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

// 상품이 지정한 카테고리 ID에 속하는지 (관리자에서 정한 카테고리 1개만 사용)
function productBelongsToCategory(product, categoryId) {
    const productCatId = getProductCategoryId(product);
    if (productCatId === '') return false;
    const idToMatch = String(categoryId).trim();
    return productCatId === idToMatch;
}

// 상품 로드 (로딩 스피너 없이 완료 시 바로 목록 또는 '상품 없음' 표시)
async function loadProducts() {
    var urlCategory = new URLSearchParams(window.location.search || '').get('category');
    var isCategoryPage = urlCategory != null && String(urlCategory).trim() !== '';
    console.log('[products-list] loadProducts 시작 isCategoryPage=', isCategoryPage, 'urlCategory=', urlCategory);

    try {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.warn('[products-list] Firebase 없음, currentProducts=[]');
            currentProducts = [];
            sortProducts();
            applyListPageFromUrlAfterProductsLoaded();
            renderProducts();
            updatePagination();
            listElements.totalCount.textContent = currentProducts.length;
            return;
        }
        console.log('[products-list] products 컬렉션에서 상품 조회 시작 (선택한 카테고리 ID로 필터링)');
        var db = firebase.firestore();
        var fetchPromise = db.collection('products').get();
        var timeoutPromise = new Promise(function (_, reject) {
            setTimeout(function () { reject(new Error('LOAD_TIMEOUT')); }, PRODUCTS_LOAD_TIMEOUT_MS);
        });
        var productsSnapshot = await Promise.race([fetchPromise, timeoutPromise]);
        console.log('[products-list] products 스냅샷 수신 empty=', productsSnapshot.empty, 'size=', productsSnapshot.size);

            if (!productsSnapshot.empty) {
                // doc.id를 별도 보관해 링크에 항상 문서 ID 사용 (개발환경 캐시/덮어쓰기 방지)
                var docsWithData = [];
                productsSnapshot.forEach(function (doc) {
                    const data = doc.data();
                    if (data.status === 'sale') {
                        docsWithData.push({ docId: doc.id, data: data });
                    }
                });
                console.log('[products-list] sale 상품 수=', docsWithData.length);
                docsWithData.sort(function (a, b) {
                    const aTime = getCreatedAtMs(a.data.createdAt);
                    const bTime = getCreatedAtMs(b.data.createdAt);
                    return bTime - aTime;
                });

                var firestoreProducts = [];
                if (isCategoryPage) {
                    var catId = String(urlCategory).trim();
                    docsWithData.forEach(function (item) {
                        if (!productBelongsToCategory(item.data, catId)) return;
                        var d = item.data;
                        firestoreProducts.push({
                            id: item.docId,
                            title: (d.name || d.productName || d.title || '').toString().trim(),
                            option: d.shortDesc || '',
                            price: d.price != null ? d.price : 0,
                            support: (d.supportAmount != null && d.supportAmount > 0) ? (formatTrix(d.supportAmount) + ' trix') : '0 trix',
                            rating: 0,
                            image: (window.resolveProductImageUrl && window.resolveProductImageUrl(d.mainImageUrl || d.imageUrl)) || d.mainImageUrl || d.imageUrl || 'https://placehold.co/300x300/E0E0E0/999?text=No+Image',
                            description: d.description || d.shortDesc || '',
                            createdAtMs: getCreatedAtMs(d.createdAt)
                        });
                    });
                    console.log('[products-list] products 컬렉션 → 카테고리 필터 결과: catId=', catId, ', sale 상품', docsWithData.length, '개 중', firestoreProducts.length, '개 표시');
                    currentProducts = firestoreProducts;
                } else {
                    // URL에 category 없음 → 전체 상품 표시 안 함, 빈 목록만
                    currentProducts = [];
                }
            } else {
                currentProducts = isCategoryPage ? [] : [];
            }
        console.log('[products-list] currentProducts 개수=', currentProducts.length);
        sortProducts();
        applyListPageFromUrlAfterProductsLoaded();
        
        // 상품 렌더링
        renderProducts();
        
        // 페이지네이션 업데이트
        updatePagination();
        
        // 총 개수 업데이트
        listElements.totalCount.textContent = currentProducts.length;
        if (currentCategory) updateBreadcrumbProductCount(currentProducts.length);
    } catch (error) {
        var isTimeout = error && error.message === 'LOAD_TIMEOUT';
        console.error('[products-list] loadProducts 오류:', error && error.message, isTimeout ? '(타임아웃)' : '');
        if (error && error.stack) console.error('[products-list] 스택:', error.stack);
        if (!isTimeout) console.error('[products-list] 오류 상세:', error);
        // 오류/타임아웃 시: 목록 페이지에서는 전체 상품 fallback 없이 빈 목록만 표시
        currentProducts = [];
        
        sortProducts();
        applyListPageFromUrlAfterProductsLoaded();
        renderProducts();
        updatePagination();
        listElements.totalCount.textContent = currentProducts.length;
        if (currentCategory) updateBreadcrumbProductCount(currentProducts.length);
    }
}

// 상품 정렬
function sortProducts() {
    switch (currentSort) {
        case 'recent': {
            // 새 상품(기준 시점 이후): 등록순(최신순). 기존 상품(이미 있던 것): 키워드별 묶음 순서 유지.
            const newProducts = currentProducts.filter(function (p) {
                return (p.createdAtMs || 0) >= NEW_PRODUCT_CUTOFF_MS;
            });
            const existingProducts = currentProducts.filter(function (p) {
                return (p.createdAtMs || 0) < NEW_PRODUCT_CUTOFF_MS;
            });
            newProducts.sort(function (a, b) {
                return (b.createdAtMs || 0) - (a.createdAtMs || 0);
            });
            existingProducts.sort(function (a, b) {
                const ta = (a.title != null ? String(a.title) : '').trim();
                const tb = (b.title != null ? String(b.title) : '').trim();
                const keyA = ta.split(/\s+/)[0] || ta;
                const keyB = tb.split(/\s+/)[0] || tb;
                const keyCmp = keyA.localeCompare(keyB, 'ko');
                if (keyCmp !== 0) return keyCmp;
                const titleCmp = ta.localeCompare(tb, 'ko');
                if (titleCmp !== 0) return titleCmp;
                return (b.createdAtMs || 0) - (a.createdAtMs || 0);
            });
            currentProducts.length = 0;
            currentProducts.push.apply(currentProducts, newProducts.concat(existingProducts));
            break;
        }
        case 'popular':
            // 인기순 (지원금 높은순)
            currentProducts.sort((a, b) => {
                const aSupport = parseInt(a.support.replace(/[^0-9]/g, ''));
                const bSupport = parseInt(b.support.replace(/[^0-9]/g, ''));
                return bSupport - aSupport;
            });
            break;
        case 'price-low':
        case 'price-high':
            // 가격순 (실제 상품 가격 기준)
            currentProducts.sort((a, b) => {
                const aPrice = Number(a.price) || 0;
                const bPrice = Number(b.price) || 0;
                return currentSort === 'price-low' ? aPrice - bPrice : bPrice - aPrice;
            });
            break;
        case 'review':
            // 리뷰 많은순 (현재는 rating 기준)
            currentProducts.sort((a, b) => b.rating - a.rating);
            break;
    }
}

// 상품 렌더링 (그리드가 아직 없으면 짧은 뒤 한 번만 재시도 → 첫 페인트 타이밍 대응)
function renderProducts(retryOnce) {
    var grid = listElements.productGrid;
    if (!grid) {
        if (retryOnce !== false) {
            console.log('[products-list] productGrid 없음, 50ms 후 재시도');
            setTimeout(function () { renderProducts(false); }, 50);
        }
        return;
    }
    if (currentProducts.length === 0) {
        showEmptyState();
        return;
    }
    itemsPerPage = getItemsPerPageForView();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = currentProducts.slice(startIndex, endIndex);
    
    const html = pageProducts.map((product, index) => {
        const actualIndex = startIndex + index;
        return createProductCard(product, actualIndex);
    }).join('');
    grid.innerHTML = html;
    updateProductRatingsInGrid(pageProducts);
}

// 상품 카드 생성 (히트/추천/최신/인기 배지 없음)
function createProductCard(product, index) {
    const productId = (product && product.id != null && product.id !== '') ? String(product.id) : '';
    const ratingVal = (product.rating != null && product.rating !== undefined) ? product.rating : 0;
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const priceHtml = isLoggedIn && product.price != null && product.price !== '' ? (Number(product.price).toLocaleString() + '원') : '';
    return `
        <div class="product-card" data-product-id="${productId}">
            <a href="${productId ? 'product-detail.html' : '#'}" class="product-link" data-product-link="1">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}">
                </div>
            </a>
            <div class="product-info">
                <a href="${productId ? 'product-detail.html' : '#'}" class="product-title" data-product-link="1">${product.title}</a>
                <div class="product-option">${product.option || ''}</div>
                <div class="product-price">${priceHtml}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-support">쇼핑지원금 ${product.support}</div>
                <div class="product-footer">
                    <div class="product-rating">
                        <span>고객평점</span>
                        <i class="fas fa-star"></i>
                        <span class="rating-value">${ratingVal}</span>
                    </div>
                    <button class="share-btn">
                        <i class="fas fa-share-alt"></i> 공유하기
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 상품 그리드 고객평점 업데이트 (Firestore 상품후기 기준)
async function updateProductRatingsInGrid(products) {
    if (!products || products.length === 0 || typeof firebase === 'undefined' || !firebase.firestore) return;
    const db = firebase.firestore();
    for (const product of products) {
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
            const card = listElements.productGrid.querySelector('.product-card[data-product-id="' + product.id + '"]');
            if (card) {
                const span = card.querySelector('.product-rating .rating-value');
                if (span) span.textContent = avg;
            }
        } catch (e) {
            console.warn('평점 로드 실패:', product.id, e);
        }
    }
}

// 빈 상태 표시
function showEmptyState() {
    if (!listElements.productGrid) return;
    const hasCategoryParam = new URLSearchParams(window.location.search).get('category');
    if (!hasCategoryParam) {
        listElements.productGrid.innerHTML = `
            <div class="empty-products" style="grid-column: 1 / -1;">
                <i class="fas fa-folder-open"></i>
                <h3>카테고리를 선택해 주세요</h3>
                <p>상단 <strong>전체카테고리</strong> 또는 네비게이션에서 카테고리를 선택하시면 해당 카테고리 상품만 표시됩니다.</p>
                <a href="index.html" class="btn-home">
                    <i class="fas fa-home"></i> 메인에서 전체 상품 보기
                </a>
            </div>
        `;
        return;
    }
    listElements.productGrid.innerHTML = `
        <div class="empty-products" style="grid-column: 1 / -1;">
            <i class="fas fa-box-open"></i>
            <h3>등록된 상품이 없습니다</h3>
            <p>이 카테고리에 등록된 상품이 없습니다.</p>
            <a href="index.html" class="btn-home">
                <i class="fas fa-home"></i> 홈으로 가기
            </a>
        </div>
    `;
}

const PAGINATION_VISIBLE = 9;
const PAGINATION_SKIP = 10;

function getPaginationVisible() {
    var w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (w <= 360) return 4;
    if (w <= 480) return 5;
    if (w <= 768) return 6;
    return 9;
}

function getItemsPerPageForView() {
    const grid = listElements.productGrid;
    if (!grid) return ROWS_PER_PAGE * GRID_COLUMNS;
    return grid.classList.contains('list-view') ? ROWS_PER_PAGE : ROWS_PER_PAGE * GRID_COLUMNS;
}

// 페이지네이션 업데이트 (<< = 10페이지 이전, < = 1페이지 이전, > = 1페이지 다음, >> = 10페이지 다음)
function updatePagination() {
    itemsPerPage = getItemsPerPageForView();
    const totalPages = Math.ceil(currentProducts.length / itemsPerPage);
    
    if (totalPages <= 1) {
        listElements.pagination.style.display = 'none';
        return;
    }
    
    listElements.pagination.style.display = 'flex';
    
    const cur = currentPage;
    const visible = getPaginationVisible();
    const half = Math.floor(visible / 2);
    let startPage = Math.max(1, cur - half);
    let endPage = Math.min(totalPages, startPage + visible - 1);
    if (endPage - startPage + 1 < visible) startPage = Math.max(1, endPage - visible + 1);
    
    let pageNumbersHtml = '';
    pageNumbersHtml += `<button type="button" class="page-btn skip-prev" title="10페이지 이전" ${cur <= PAGINATION_SKIP ? 'disabled' : ''}>&lt;&lt;</button>`;
    pageNumbersHtml += `<button type="button" class="page-btn prev" title="이전" ${cur <= 1 ? 'disabled' : ''}>&lt;</button>`;
    if (startPage > 1) pageNumbersHtml += `<button type="button" class="page-btn" disabled>...</button>`;
    for (let i = startPage; i <= endPage; i++) {
        pageNumbersHtml += `<button type="button" class="page-num ${i === cur ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (endPage < totalPages) pageNumbersHtml += `<button type="button" class="page-btn" disabled>...</button>`;
    pageNumbersHtml += `<button type="button" class="page-btn next" title="다음" ${cur >= totalPages ? 'disabled' : ''}>&gt;</button>`;
    pageNumbersHtml += `<button type="button" class="page-btn skip-next" title="10페이지 다음" ${cur + PAGINATION_SKIP > totalPages ? 'disabled' : ''}>&gt;&gt;</button>`;
    
    listElements.pageNumbers.innerHTML = pageNumbersHtml;
}

// 이벤트 리스너 초기화
// 메인과 동일: 상품 카드 클릭 시 sessionStorage에 ID 저장 후 product-detail.html?id= 로 이동
function initProductGridClickForList() {
    var grid = listElements.productGrid;
    if (!grid) return;
    grid.addEventListener('click', function (e) {
        if (!e.target.closest || !e.target.closest('[data-product-link="1"]')) return;
        var card = e.target.closest('.product-card');
        if (!card) return;
        var id = card.getAttribute('data-product-id');
        if (!id || id === '') return;
        e.preventDefault();
        e.stopPropagation();
        try { sessionStorage.setItem('selectedProductId', id); } catch (err) {}
        window.location.href = 'product-detail.html?id=' + encodeURIComponent(id);
    });
}

function initEventListeners() {
    initProductGridClickForList();
    // 정렬 변경
    listElements.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        currentPage = 1;
        replaceListPageUrl(1);
        loadProducts();
    });
    
    // 보기 타입 변경 (15줄 = 1페이지이므로 리스트는 15개, 그리드는 15*4=60개)
    listElements.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewType = btn.dataset.view;
            listElements.viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            listElements.productGrid.className = `product-grid ${viewType}-view`;
            currentPage = 1;
            replaceListPageUrl(1);
            renderProducts();
            updatePagination();
        });
    });
    
    // 페이지네이션 (위임): << 10페이지 이전, < 이전, > 다음, >> 10페이지 다음
    listElements.pagination.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || btn.disabled) return;
        itemsPerPage = getItemsPerPageForView();
        const totalPages = Math.ceil(currentProducts.length / itemsPerPage);
        if (btn.classList.contains('skip-prev')) currentPage = Math.max(1, currentPage - PAGINATION_SKIP);
        else if (btn.classList.contains('prev')) currentPage = Math.max(1, currentPage - 1);
        else if (btn.classList.contains('next')) currentPage = Math.min(totalPages, currentPage + 1);
        else if (btn.classList.contains('skip-next')) currentPage = Math.min(totalPages, currentPage + PAGINATION_SKIP);
        else if (btn.classList.contains('page-num') && btn.dataset.page) currentPage = parseInt(btn.dataset.page, 10);
        else return;
        replaceListPageUrl(currentPage);
        renderProducts();
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // 인기 검색어 토글
    if (listElements.searchToggle && listElements.popularKeywords) {
        listElements.searchToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            listElements.popularKeywords.classList.toggle('active');
        });
        
        // 외부 클릭 시 닫기
        document.addEventListener('click', (e) => {
            if (!listElements.popularKeywords.contains(e.target)) {
                listElements.popularKeywords.classList.remove('active');
            }
        });
    }

    window.addEventListener('resize', function () {
        updatePagination();
    });
}

// 카테고리 메뉴 로드 (script.js의 함수 재사용)
async function loadCategoriesMenu() {
    try {
        if (!firebase || !firebase.firestore) {
            console.log('Firebase가 아직 초기화되지 않았습니다.');
            return;
        }

        const db = firebase.firestore();
        const snapshot = await db.collection('categories').get();

        const categories = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.isHidden !== true) {
                const displayName = (data.name != null && String(data.name).trim() !== '')
                    ? String(data.name).trim()
                    : ((data.categoryName != null && String(data.categoryName).trim() !== '')
                        ? String(data.categoryName).trim()
                        : ((data.title != null && String(data.title).trim() !== '')
                            ? String(data.title).trim()
                            : '(이름 없음)'));
                categories.push({
                    ...data,
                    id: doc.id,
                    name: displayName,
                    level: data.level != null ? Number(data.level) : 1,
                    parentId: data.parentId != null && data.parentId !== '' ? data.parentId : null
                });
            }
        });

        categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        var isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) {
            categories = categories.filter(function(c) { return c.isPublic !== false; });
        }

        const categoryTree = buildCategoryTree(categories);
        const categoryList = document.getElementById('categoryList');
        if (categoryList) {
            categoryList.innerHTML = renderCategoryMenu(categoryTree);
        }
    } catch (error) {
        console.error('❌ 카테고리 로드 오류:', error);
    }
}

function buildCategoryTree(categories) {
    const level1 = categories.filter(cat => cat.level === 1 && !cat.parentId);
    return level1.map(cat1 => {
        const level2 = categories.filter(cat => cat.level === 2 && cat.parentId === cat1.id);
        return {
            ...cat1,
            children: level2.map(cat2 => {
                const level3 = categories.filter(cat => cat.level === 3 && cat.parentId === cat2.id);
                return {
                    ...cat2,
                    children: level3
                };
            })
        };
    });
}

// 이미 products-list 페이지면 ?category= 만 붙임 → /products-list?category=ID 유지
function categoryListHref(categoryId) {
    var path = (window.location && window.location.pathname) || '';
    if (/products-list/.test(path)) return '?category=' + encodeURIComponent(categoryId);
    return '/products-list?category=' + encodeURIComponent(categoryId);
}

function renderCategoryMenu(categoryTree) {
    if (!categoryTree || categoryTree.length === 0) {
        return '<li><a href="#">등록된 카테고리가 없습니다.</a></li>';
    }

    let html = '';
    categoryTree.forEach(cat1 => {
        const hasChildren = cat1.children && cat1.children.length > 0;
        html += `<li${hasChildren ? ' class="has-submenu"' : ''}>`;
        
        if (hasChildren) {
            html += `<a href="#" onclick="toggleSubmenu(event, this)">${(cat1.name || '(이름 없음)').replace(/</g, '&lt;')}</a>`;
        } else {
            html += `<a href="${categoryListHref(cat1.id)}">${(cat1.name || '(이름 없음)').replace(/</g, '&lt;')}</a>`;
        }
        
        if (hasChildren) {
            html += '<ul class="submenu">';
            cat1.children.forEach(cat2 => {
                const hasGrandChildren = cat2.children && cat2.children.length > 0;
                html += `<li${hasGrandChildren ? ' class="has-submenu"' : ''}>`;
                
                if (hasGrandChildren) {
                    // 3차 카테고리가 있으면 클릭으로 펼치기 (하위 카테고리로 이동)
                    html += `<a href="#" onclick="toggleSubmenu(event, this)">${(cat2.name || '(이름 없음)').replace(/</g, '&lt;')}</a>`;
                } else {
                    html += `<a href="${categoryListHref(cat2.id)}">${(cat2.name || '(이름 없음)').replace(/</g, '&lt;')}</a>`;
                }
                
                if (hasGrandChildren) {
                    html += '<ul class="submenu">';
                    cat2.children.forEach(cat3 => {
                        html += `<li><a href="${categoryListHref(cat3.id)}">${(cat3.name || '(이름 없음)').replace(/</g, '&lt;')}</a></li>`;
                    });
                    html += '</ul>';
                }
                html += '</li>';
            });
            html += '</ul>';
        }
        html += '</li>';
    });
    return html;
}

function toggleSubmenu(event, element) {
    event.preventDefault();
    event.stopPropagation();
    
    const parentLi = element.parentElement;
    const isActive = parentLi.classList.contains('active');
    
    const siblings = Array.from(parentLi.parentElement.children);
    siblings.forEach(sibling => {
        if (sibling !== parentLi) {
            sibling.classList.remove('active');
            const subMenus = sibling.querySelectorAll('.has-submenu');
            subMenus.forEach(sub => sub.classList.remove('active'));
        }
    });
    
    if (isActive) {
        parentLi.classList.remove('active');
        const subMenus = parentLi.querySelectorAll('.has-submenu');
        subMenus.forEach(sub => sub.classList.remove('active'));
    } else {
        parentLi.classList.add('active');
    }
}

window.toggleSubmenu = toggleSubmenu;

// 초기화
// 공유 버튼 이벤트 (상품 목록 페이지용)
function initShareButtonsForProductList() {
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

// 동적 로드 시 DOMContentLoaded가 이미 지났을 수 있음 → readyState 확인 후 즉시 실행
function runInit() {
    document.removeEventListener('DOMContentLoaded', runInit);
    console.log('[products-list] DOM 준비됨, initPage 호출');
    (async function () {
        if (typeof updateHeaderForLoginStatus === 'function') updateHeaderForLoginStatus();
        await initPage();
        setTimeout(loadCategoriesMenu, 1000);
        initShareButtonsForProductList();
    })();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInit);
} else {
    console.log('[products-list] DOM 이미 완료(readyState=' + document.readyState + '), initPage 즉시 호출');
    runInit();
}

// 뒤로가기/앞으로가기 시 bfcache 복원하면 스크립트가 다시 안 돌 수 있음 → URL 다시 읽고 목록 갱신
window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    console.log('[products-list] pageshow(persisted) → URL 재적용 후 목록 갱신');
    var urlParams = new URLSearchParams(window.location.search);
    currentCategory = urlParams.get('category');
    currentType = urlParams.get('type');
    if (currentCategory !== null && currentCategory.trim() === '') currentCategory = null;
    if (currentType !== null && currentType.trim() === '') currentType = null;
    if (currentCategory) currentType = null;
    else if (!currentType) currentType = 'hit';
    (async function () {
        await loadProducts();
        if (listElements.totalCount) listElements.totalCount.textContent = currentProducts.length;
        if (currentCategory && typeof updateBreadcrumbProductCount === 'function') updateBreadcrumbProductCount(currentProducts.length);
    })();
});

