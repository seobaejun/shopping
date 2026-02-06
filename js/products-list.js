// 상품 목록 페이지 JavaScript

// 상품 데이터 (실제로는 서버에서 가져올 데이터)
const PRODUCTS_DATA = {
    hit: [
        {
            id: '1763960055',
            title: '제주도 노지 조생귤 5kg',
            option: '중과 (S-M)',
            support: '2,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/FFE082/333?text=제주+조생귤',
            description: '제주도에서 직송하는 신선한 조생귤입니다. 달콤하고 과즙이 풍부합니다.'
        },
        {
            id: '1761873848',
            title: '이앤위즈 원홀 무전원 우드스피커',
            option: '',
            support: '2,500원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/8B7355/fff?text=우드스피커',
            description: '전원 없이 사용 가능한 친환경 우드 스피커입니다.'
        },
        {
            id: '1761726997',
            title: '시치미쓱 프리미엄 데일리물티슈 100매 * 10팩',
            option: '',
            support: '3,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/E3F2FD/333?text=물티슈',
            description: '부드럽고 두꺼운 프리미엄 물티슈 대용량 구성입니다.'
        },
        {
            id: '1761203471',
            title: '셀비엔 괄사 마사지 리프팅 앰플 스틱 15ml',
            option: '',
            support: '3,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/FFE5E5/333?text=괄사+앰플',
            description: '집에서 간편하게 괄사 마사지를 즐길 수 있는 리프팅 앰플 스틱입니다.'
        },
        {
            id: '1761202305',
            title: '셀비엔 블래미쉬 크림 & 블랙스팟 패치 기미세트',
            option: '',
            support: '5,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/FFF3E0/333?text=기미+세트',
            description: '기미와 잡티 관리를 위한 올인원 세트입니다.'
        },
        {
            id: '1760950239',
            title: '감홍사과 산지직송 고당도 문경 꿀사과 가정용 3kg',
            option: '가정용 못난이 / 중과 10-13과',
            support: '5,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/FFCDD2/333?text=꿀사과',
            description: '산지에서 직송하는 달콤한 꿀사과입니다.'
        },
        {
            id: '100001517',
            title: '롯데 스퀘어 다이얼 에어프라이어 7L 민트',
            option: '',
            support: '10,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/B2DFDB/333?text=에어프라이어',
            description: '대용량 7L 에어프라이어로 온 가족이 함께 즐기세요.'
        },
        {
            id: '1000001487',
            title: '정관장 홍삼보윤정 데일리스틱 10ml x 30포',
            option: '',
            support: '8,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/D7CCC8/333?text=홍삼',
            description: '매일 간편하게 즐기는 프리미엄 홍삼 스틱입니다.'
        }
    ],
    recommend: [
        {
            id: '1762142001',
            title: '프리미엄 유기농 현미 5kg',
            option: '',
            support: '4,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/F5F5DC/333?text=유기농+현미',
            description: '건강한 식단을 위한 유기농 현미입니다.'
        },
        {
            id: '1762142002',
            title: '천연 허브 비누 세트',
            option: '3종 세트',
            support: '2,500원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/E8F5E9/333?text=허브+비누',
            description: '피부에 자극이 적은 천연 허브 비누 세트입니다.'
        },
        {
            id: '1762142003',
            title: '스테인레스 보온병 500ml',
            option: '블랙/화이트',
            support: '3,500원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/ECEFF1/333?text=보온병',
            description: '24시간 보온 보냉이 가능한 프리미엄 보온병입니다.'
        },
        {
            id: '1762142004',
            title: '국산 김 선물세트',
            option: '50g x 10봉',
            support: '6,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/C8E6C9/333?text=김+세트',
            description: '신선한 국산 김으로 만든 프리미엄 선물세트입니다.'
        }
    ],
    new: [
        {
            id: '1763950001',
            title: '2026 신상 무선 블루투스 이어폰',
            option: '화이트/블랙',
            support: '7,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/E1F5FE/333?text=블루투스+이어폰',
            description: '최신 노이즈 캔슬링 기능이 탑재된 프리미엄 이어폰입니다.'
        },
        {
            id: '1763950002',
            title: 'LED 무드등 스피커',
            option: '',
            support: '5,500원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/FFF9C4/333?text=무드등',
            description: '조명과 스피커가 결합된 감성 인테리어 아이템입니다.'
        },
        {
            id: '1763950003',
            title: '프리미엄 차량용 방향제',
            option: '3종',
            support: '2,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/E0F2F1/333?text=방향제',
            description: '차량 내부를 상쾌하게 유지하는 고급 방향제입니다.'
        },
        {
            id: '1763950004',
            title: '스마트 체중계',
            option: '',
            support: '8,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/F3E5F5/333?text=체중계',
            description: '앱과 연동되는 스마트 체중계로 건강을 관리하세요.'
        }
    ],
    popular: [
        {
            id: '1763453356',
            title: '더담은 일키로 오리윙 1kg',
            option: '',
            support: '2,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/FFE0B2/333?text=오리윙',
            description: '바삭하고 맛있는 오리윙 대용량 구성입니다.'
        },
        {
            id: '1763453022',
            title: '더담은 일키로 고구마치킨 1kg',
            option: '',
            support: '2,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/FFD54F/333?text=고구마치킨',
            description: '달콤한 고구마와 바삭한 치킨의 환상 조합입니다.'
        },
        {
            id: '1762849137',
            title: '1000피스 직소퍼즐 모네의 정원',
            option: '',
            support: '3,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/C5E1A5/333?text=퍼즐',
            description: '집중력 향상에 좋은 프리미엄 직소퍼즐입니다.'
        },
        {
            id: '1761202305_2',
            title: '셀비엔 블래미쉬 크림 & 블랙스팟 패치 기미세트',
            option: '',
            support: '5,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/FFF3E0/333?text=기미+세트',
            description: '기미와 잡티 관리를 위한 올인원 세트입니다.'
        },
        {
            id: '1763000001',
            title: '국산 꿀 선물세트',
            option: '1kg x 2병',
            support: '10,000원',
            rating: 0,
            image: 'https://via.placeholder.com/300x300/FFF8E1/333?text=꿀+세트',
            description: '100% 국산 순수 꿀로 만든 프리미엄 선물세트입니다.'
        }
    ]
};

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
    console.log('Available Products:', PRODUCTS_DATA[currentType]);
    
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
            const productsSnapshot = await db.collection('products')
                .where('status', '==', 'sale')
                .orderBy('createdAt', 'desc')
                .get();

            if (!productsSnapshot.empty) {
                // Firestore 데이터를 기존 형식으로 변환
                const firestoreProducts = [];
                
                productsSnapshot.forEach(doc => {
                    const product = doc.data();
                    const displayCategory = product.displayCategory || 'all';
                    
                    // 현재 페이지 타입과 일치하는 상품만 필터링
                    if (displayCategory === 'all' || displayCategory === currentType) {
                        firestoreProducts.push({
                            id: doc.id,
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
    
    const productId = `${currentType}_${index}`;
    
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
document.addEventListener('DOMContentLoaded', () => {
    initPage();
    setTimeout(loadCategoriesMenu, 1000);
});

