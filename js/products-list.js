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
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || 'hit';
}

// 페이지 초기화
function initPage() {
    currentType = getUrlParameter('type');
    
    console.log('Current Type:', currentType);
    
    // 페이지 정보 업데이트
    updatePageInfo();
    
    // 상품 로드
    loadProducts();
    
    // 이벤트 리스너
    initEventListeners();
}

// 페이지 정보 업데이트
function updatePageInfo() {
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
                    // 분류 배열 처리
                    const displayCategories = Array.isArray(product.displayCategory) 
                        ? product.displayCategory 
                        : [product.displayCategory || 'all'];
                    
                    // 현재 페이지 타입과 일치하는 상품만 필터링
                    if (displayCategories.includes('all') || displayCategories.includes(currentType)) {
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
                
                if (firestoreProducts.length > 0) {
                    currentProducts = firestoreProducts;
                    console.log('✅ Firestore에서 상품 로드 성공:', currentProducts.length);
                } else {
                    // 해당 타입의 상품이 없으면 기본 데이터 사용
                    currentProducts = PRODUCTS_DATA[currentType] || [];
                    console.log('ℹ️ 해당 타입의 Firestore 상품이 없어 기본 데이터 사용');
                }
            } else {
                // Firestore에 상품이 없으면 기본 데이터 사용
                currentProducts = PRODUCTS_DATA[currentType] || [];
                console.log('ℹ️ Firestore에 상품이 없어 기본 데이터 사용');
            }
        } else {
            // Firebase가 초기화되지 않았으면 기본 데이터 사용
            currentProducts = PRODUCTS_DATA[currentType] || [];
            console.log('ℹ️ Firebase 미초기화, 기본 데이터 사용');
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
        // 오류 발생 시 기본 데이터 사용
        currentProducts = PRODUCTS_DATA[currentType] || [];
        
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
                categories.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

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
            html += `<a href="#" onclick="toggleSubmenu(event, this)">${cat1.name}</a>`;
        } else {
            html += `<a href="products-list.html?category=${cat1.id}">${cat1.name}</a>`;
        }
        
        if (hasChildren) {
            html += '<ul class="submenu">';
            cat1.children.forEach(cat2 => {
                const hasGrandChildren = cat2.children && cat2.children.length > 0;
                html += `<li${hasGrandChildren ? ' class="has-submenu"' : ''}>`;
                
                if (hasGrandChildren) {
                    html += `<a href="#" onclick="toggleSubmenu(event, this)">${cat2.name}</a>`;
                } else {
                    html += `<a href="products-list.html?category=${cat2.id}">${cat2.name}</a>`;
                }
                
                if (hasGrandChildren) {
                    html += '<ul class="submenu">';
                    cat2.children.forEach(cat3 => {
                        html += `<li><a href="products-list.html?category=${cat3.id}">${cat3.name}</a></li>`;
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

document.addEventListener('DOMContentLoaded', () => {
    // 로그인 상태 업데이트 (script.js 로드 대기)
    setTimeout(() => {
        if (typeof updateHeaderForLoginStatus === 'function') {
            updateHeaderForLoginStatus();
        } else {
            console.warn('updateHeaderForLoginStatus 함수를 찾을 수 없습니다.');
        }
    }, 100);
    
    initPage();
    setTimeout(loadCategoriesMenu, 1000);
    initShareButtonsForProductList();
});

