// 상품 목록 페이지 JavaScript

// 페이지 설정
const PAGE_CONFIG = {
    hit: {
        title: '히트상품 🔥',
        icon: 'fa-fire',
        description: '요즘 잘나가는 인기 상품입니다.',
        breadcrumb: '히트상품'
    },
    recommend: {
        title: '추천상품 👍',
        icon: 'fa-thumbs-up',
        description: '10쇼핑게임이 자신있게 추천하는 상품입니다.',
        breadcrumb: '추천상품'
    },
    new: {
        title: '최신상품 ✨',
        icon: 'fa-sparkles',
        description: '새롭게 입고된 따끈따끈한 상품입니다.',
        breadcrumb: '최신상품'
    },
    popular: {
        title: '인기상품 ❤️',
        icon: 'fa-heart',
        description: '고객님들이 가장 많이 찾는 상품입니다.',
        breadcrumb: '인기상품'
    }
};

// 전역 변수
let currentType = 'hit';
let currentCategory = null; // 카테고리 ID
let currentPage = 1;
let itemsPerPage = 12;
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

// 페이지 초기화
async function initPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentCategory = urlParams.get('category');
    currentType = urlParams.get('type');
    
    // category가 있으면 type 무시, 없으면 type 사용 (기본값: hit)
    if (!currentCategory && !currentType) {
        currentType = 'hit';
    }
    
    console.log('🔍 URL 파라미터 확인:');
    console.log('  - URL:', window.location.href);
    console.log('  - category:', currentCategory);
    console.log('  - type:', currentType);
    console.log('  - 카테고리 모드:', !!currentCategory);
    
    // 페이지 정보 업데이트
    await updatePageInfo();
    
    // 상품 로드
    await loadProducts();
    
    // 이벤트 리스너
    initEventListeners();
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
            // 마지막 항목은 텍스트만
            html += `<li class="current">${category.name}</li>`;
        } else {
            // 중간 항목은 드롭다운 가능한 링크
            const siblings = await getSiblingCategories(category.id);
            
            if (siblings.length > 1) {
                // 형제 카테고리가 있으면 드롭다운
                html += `<li class="breadcrumb-dropdown">`;
                html += `<a href="products-list.html?category=${category.id}" class="breadcrumb-link">${category.name} <i class="fas fa-chevron-down"></i></a>`;
                html += `<ul class="breadcrumb-dropdown-menu">`;
                siblings.forEach(sibling => {
                    const isActive = sibling.id === category.id;
                    html += `<li><a href="products-list.html?category=${sibling.id}" class="${isActive ? 'active' : ''}">${sibling.name}</a></li>`;
                });
                html += `</ul>`;
                html += `</li>`;
            } else {
                // 형제 카테고리가 없으면 일반 링크
                html += `<li><a href="products-list.html?category=${category.id}">${category.name}</a></li>`;
            }
        }
    }
    
    breadcrumbList.innerHTML = html;
    console.log('✅ 브레드크럼 HTML 생성 완료, HTML:', html.substring(0, 200));
    
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
            }
        } catch (error) {
            console.error('카테고리 정보 로드 오류:', error);
        }
    } else {
        // 타입 모드일 때는 브레드크럼 숨기기
        const breadcrumbContainer = document.getElementById('categoryBreadcrumb');
        if (breadcrumbContainer) breadcrumbContainer.style.display = 'none';
    }
    
    // 타입 모드인 경우
    const config = PAGE_CONFIG[currentType];
    
    if (config) {
        listElements.pageTitle.textContent = `${config.breadcrumb} - 10쇼핑게임`;
        listElements.pageHeading.innerHTML = `<i class="fas ${config.icon}"></i> ${config.title}`;
        listElements.pageDescription.textContent = config.description;
        listElements.breadcrumbCurrent.textContent = config.breadcrumb;
        
        // 페이지 헤더에 타입 데이터 속성 추가
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
            pageHeader.setAttribute('data-type', currentType);
            pageHeader.removeAttribute('data-category');
        }
    }
}

// 상품 로드
async function loadProducts() {
    // 로딩 표시
    showLoading();
    
    try {
        // Firebase가 초기화될 때까지 대기
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const db = firebase.firestore();
            
            // where와 orderBy를 함께 사용하면 인덱스가 필요하므로 분리
            const productsSnapshot = await db.collection('products').get();

            if (!productsSnapshot.empty) {
                // 클라이언트에서 필터링 및 정렬
                const allProducts = [];
                productsSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'sale') {
                        allProducts.push({
                            id: doc.id,
                            ...data
                        });
                    }
                });
                
                // createdAt으로 정렬 (최신순)
                allProducts.sort((a, b) => {
                    const aTime = a.createdAt?.toMillis() || 0;
                    const bTime = b.createdAt?.toMillis() || 0;
                    return bTime - aTime;
                });
                
                // Firestore 데이터를 기존 형식으로 변환
                const firestoreProducts = [];
                
                allProducts.forEach(product => {
                    let shouldInclude = false;
                    
                    // 카테고리 모드인 경우
                    if (currentCategory) {
                        // 상품의 category 필드가 현재 카테고리와 일치하는지 확인
                        const productCategory = product.category;
                        
                        if (!productCategory) {
                            // category 필드가 없으면 제외
                            shouldInclude = false;
                        } else if (Array.isArray(productCategory)) {
                            // 배열인 경우 포함 여부 확인
                            shouldInclude = productCategory.some(catId => String(catId) === String(currentCategory));
                        } else {
                            // 문자열인 경우 직접 비교 (양쪽 모두 문자열로 변환하여 비교)
                            shouldInclude = String(productCategory) === String(currentCategory);
                        }
                        
                        // 디버깅 로그 (처음 몇 개만)
                        if (shouldInclude && firestoreProducts.length < 3) {
                            console.log(`✅ 카테고리 매칭: 상품 ${product.name} (카테고리: ${productCategory}, 현재: ${currentCategory})`);
                        }
                    } else if (currentType) {
                        // 타입 모드인 경우 (currentType이 있을 때만)
                        const displayCategories = Array.isArray(product.displayCategory) 
                            ? product.displayCategory 
                            : [product.displayCategory || 'all'];
                        
                        if (displayCategories.includes('all') || displayCategories.includes(currentType)) {
                            shouldInclude = true;
                        }
                    }
                    
                    if (shouldInclude) {
                        firestoreProducts.push({
                            id: product.id,
                            title: product.name,
                            option: product.shortDesc || '',
                            support: `${(product.price * (product.supportRate || 5) / 100).toLocaleString()}원`,
                            rating: 0,
                            image: product.mainImageUrl || product.imageUrl || 'https://placehold.co/300x300/E0E0E0/999?text=No+Image',
                            description: product.description || product.shortDesc || ''
                        });
                    }
                });
                
                // 카테고리 모드일 때 디버깅 정보
                if (currentCategory) {
                    console.log(`🔍 카테고리 필터링 결과: ${firestoreProducts.length}개 상품 (카테고리 ID: ${currentCategory})`);
                    if (firestoreProducts.length === 0) {
                        console.warn('⚠️ 해당 카테고리의 상품이 없습니다.');
                        console.warn('   상품의 category 필드를 확인하세요.');
                        console.warn('   전체 상품 수:', allProducts.length);
                        // 샘플 상품의 category 필드 확인 (처음 5개)
                        const sampleProducts = allProducts.slice(0, 5);
                        sampleProducts.forEach((p, idx) => {
                            console.log(`   샘플 상품 ${idx + 1}: ${p.name}, category: ${p.category} (타입: ${typeof p.category})`);
                        });
                        console.log(`   찾는 카테고리 ID: ${currentCategory} (타입: ${typeof currentCategory})`);
                    } else {
                        console.log(`✅ 카테고리 필터링 성공: ${firestoreProducts.length}개 상품 발견`);
                    }
                } else if (currentType) {
                    console.log(`🔍 타입 필터링 결과: ${firestoreProducts.length}개 상품 (타입: ${currentType})`);
                }
                
                if (firestoreProducts.length > 0) {
                    currentProducts = firestoreProducts;
                    console.log('✅ Firestore에서 상품 로드 성공:', currentProducts.length);
                } else {
                    // 카테고리 모드일 때는 빈 배열 유지 (기본 데이터 사용 안 함)
                    if (currentCategory) {
                        currentProducts = [];
                        console.log('ℹ️ 해당 카테고리의 Firestore 상품이 없습니다.');
                    } else {
                        // 타입 모드일 때만 기본 데이터 사용
                        currentProducts = PRODUCTS_DATA[currentType] || [];
                        console.log('ℹ️ 해당 타입의 Firestore 상품이 없어 기본 데이터 사용');
                    }
                }
            } else {
                // Firestore에 상품이 없으면
                if (currentCategory) {
                    // 카테고리 모드일 때는 빈 배열
                    currentProducts = [];
                    console.log('ℹ️ Firestore에 상품이 없습니다.');
                } else {
                    // 타입 모드일 때만 기본 데이터 사용
                    currentProducts = PRODUCTS_DATA[currentType] || [];
                    console.log('ℹ️ Firestore에 상품이 없어 기본 데이터 사용');
                }
            }
        } else {
            // Firebase가 초기화되지 않았으면
            if (currentCategory) {
                // 카테고리 모드일 때는 빈 배열
                currentProducts = [];
                console.log('ℹ️ Firebase 미초기화, 카테고리 모드에서는 상품을 불러올 수 없습니다.');
            } else {
                // 타입 모드일 때만 기본 데이터 사용
                currentProducts = PRODUCTS_DATA[currentType] || [];
                console.log('ℹ️ Firebase 미초기화, 기본 데이터 사용');
            }
        }
        
        console.log('Loaded Products:', currentProducts);
        console.log('Products Count:', currentProducts.length);
        
        // 정렬 적용
        sortProducts();
        
        // 상품 렌더링
        renderProducts();
        
        // 페이지네이션 업데이트
        updatePagination();
        
        // 총 개수 업데이트
        listElements.totalCount.textContent = currentProducts.length;
    } catch (error) {
        console.error('❌ 상품 로드 오류:', error);
        // 오류 발생 시
        if (currentCategory) {
            // 카테고리 모드일 때는 빈 배열
            currentProducts = [];
            console.log('⚠️ 오류로 인해 카테고리 상품을 불러올 수 없습니다.');
        } else {
            // 타입 모드일 때만 기본 데이터 사용
            currentProducts = PRODUCTS_DATA[currentType] || [];
            console.log('⚠️ 오류로 인해 기본 데이터 사용');
        }
        
        // 정렬 적용
        sortProducts();
        
        // 상품 렌더링
        renderProducts();
        
        // 페이지네이션 업데이트
        updatePagination();
        
        // 총 개수 업데이트
        listElements.totalCount.textContent = currentProducts.length;
    }
}

// 로딩 표시
function showLoading() {
    listElements.productGrid.innerHTML = `
        <div class="loading-spinner" style="grid-column: 1 / -1;">
            <div class="spinner"></div>
            <p>상품을 불러오는 중입니다...</p>
        </div>
    `;
}

// 상품 정렬
function sortProducts() {
    switch (currentSort) {
        case 'recent':
            // 최신순 (ID 역순)
            currentProducts.sort((a, b) => b.id.localeCompare(a.id));
            break;
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
            // 가격순 (지원금 기준)
            currentProducts.sort((a, b) => {
                const aSupport = parseInt(a.support.replace(/[^0-9]/g, ''));
                const bSupport = parseInt(b.support.replace(/[^0-9]/g, ''));
                return currentSort === 'price-low' ? aSupport - bSupport : bSupport - aSupport;
            });
            break;
        case 'review':
            // 리뷰 많은순 (현재는 rating 기준)
            currentProducts.sort((a, b) => b.rating - a.rating);
            break;
    }
}

// 상품 렌더링
function renderProducts() {
    if (currentProducts.length === 0) {
        showEmptyState();
        return;
    }
    
    // 페이지네이션 적용
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = currentProducts.slice(startIndex, endIndex);
    
    const html = pageProducts.map((product, index) => {
        const actualIndex = startIndex + index;
        return createProductCard(product, actualIndex);
    }).join('');
    listElements.productGrid.innerHTML = html;
}

// 상품 카드 생성
function createProductCard(product, index) {
    const badgeClass = currentType;
    const badgeLabels = {
        hit: '히트',
        recommend: '추천',
        new: '최신',
        popular: '인기'
    };
    
    // Firestore ID 사용
    const productId = product.id;
    
    return `
        <div class="product-card">
            <a href="product-detail.html?id=${productId}" class="product-link">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}">
                    <div class="product-badge">
                        <span class="badge ${badgeClass}">${badgeLabels[badgeClass]}</span>
                    </div>
                </div>
            </a>
            <div class="product-info">
                <a href="product-detail.html?id=${productId}" class="product-title">${product.title}</a>
                <div class="product-option">${product.option || ''}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-support">쇼핑지원금 ${product.support}</div>
                <div class="product-footer">
                    <div class="product-rating">
                        <span>고객평점</span>
                        <i class="fas fa-star"></i>
                        <span>${product.rating}</span>
                    </div>
                    <button class="share-btn">
                        <i class="fas fa-share-alt"></i> 공유하기
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 빈 상태 표시
function showEmptyState() {
    listElements.productGrid.innerHTML = `
        <div class="empty-products" style="grid-column: 1 / -1;">
            <i class="fas fa-box-open"></i>
            <h3>등록된 상품이 없습니다</h3>
            <p>새로운 상품이 곧 준비될 예정입니다.</p>
            <a href="index.html" class="btn-home">
                <i class="fas fa-home"></i> 홈으로 가기
            </a>
        </div>
    `;
}

// 페이지네이션 업데이트
function updatePagination() {
    const totalPages = Math.ceil(currentProducts.length / itemsPerPage);
    
    if (totalPages <= 1) {
        listElements.pagination.style.display = 'none';
        return;
    }
    
    listElements.pagination.style.display = 'flex';
    
    // 페이지 번호 생성
    let pageNumbersHtml = '';
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageNumbersHtml += `
            <button class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }
    
    listElements.pageNumbers.innerHTML = pageNumbersHtml;
    
    // 이전/다음 버튼 상태
    const prevBtn = listElements.pagination.querySelector('.prev');
    const nextBtn = listElements.pagination.querySelector('.next');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// 이벤트 리스너 초기화
function initEventListeners() {
    // 정렬 변경
    listElements.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        currentPage = 1;
        loadProducts();
    });
    
    // 보기 타입 변경
    listElements.viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewType = btn.dataset.view;
            
            // 활성 상태 변경
            listElements.viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 그리드 클래스 변경
            listElements.productGrid.className = `product-grid ${viewType}-view`;
        });
    });
    
    // 페이지네이션
    listElements.pagination.addEventListener('click', (e) => {
        if (e.target.classList.contains('page-num')) {
            currentPage = parseInt(e.target.dataset.page);
            renderProducts();
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (e.target.closest('.prev')) {
            if (currentPage > 1) {
                currentPage--;
                renderProducts();
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else if (e.target.closest('.next')) {
            const totalPages = Math.ceil(currentProducts.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderProducts();
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
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

function renderCategoryMenu(categoryTree) {
    if (!categoryTree || categoryTree.length === 0) {
        return '<li><a href="#">등록된 카테고리가 없습니다.</a></li>';
    }

    let html = '';
    categoryTree.forEach(cat1 => {
        const hasChildren = cat1.children && cat1.children.length > 0;
        html += `<li${hasChildren ? ' class="has-submenu"' : ''}>`;
        
        if (hasChildren) {
            // 하위 카테고리가 있으면 클릭으로 펼치기 (하위 카테고리로 이동)
            html += `<a href="#" onclick="toggleSubmenu(event, this)">${(cat1.name || '(이름 없음)').replace(/</g, '&lt;')}</a>`;
        } else {
            html += `<a href="products-list.html?category=${cat1.id}">${(cat1.name || '(이름 없음)').replace(/</g, '&lt;')}</a>`;
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
                    html += `<a href="products-list.html?category=${cat2.id}">${(cat2.name || '(이름 없음)').replace(/</g, '&lt;')}</a>`;
                }
                
                if (hasGrandChildren) {
                    html += '<ul class="submenu">';
                    cat2.children.forEach(cat3 => {
                        html += `<li><a href="products-list.html?category=${cat3.id}">${(cat3.name || '(이름 없음)').replace(/</g, '&lt;')}</a></li>`;
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

document.addEventListener('DOMContentLoaded', async () => {
    // 로그인 상태 업데이트 (script.js 로드 대기)
    setTimeout(() => {
        if (typeof updateHeaderForLoginStatus === 'function') {
            updateHeaderForLoginStatus();
        } else {
            console.warn('updateHeaderForLoginStatus 함수를 찾을 수 없습니다.');
        }
    }, 100);
    
    await initPage();
    setTimeout(loadCategoriesMenu, 1000);
    initShareButtonsForProductList();
});

