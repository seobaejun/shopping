// URL에서 검색어 가져오기
function getSearchKeyword() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q') || '';
}

// 모든 상품 데이터
// script.js에서 productsData를 가져옴
function getAllProductsData() {
    if (typeof productsData !== 'undefined' && productsData) {
        console.log('✅ productsData 발견:', productsData);
        return productsData;
    }
    
    console.warn('⚠️ productsData 없음 - fallback 데이터 사용');
    return {
    hit: [
        {
            title: "제주 노지 조생골 5kg",
            image: "https://placehold.co/400x400/FFA726/FFF?text=제주+조생골",
            support: "2,000원",
            option: "중과 (S-M)",
            badges: ["히트"]
        },
        {
            title: "GAP 인증 사과 10kg",
            image: "https://placehold.co/400x400/EF5350/FFF?text=사과+10kg",
            support: "3,500원",
            option: "특대과",
            badges: ["히트"]
        },
        {
            title: "당도선별 배 7.5kg",
            image: "https://placehold.co/400x400/66BB6A/FFF?text=배+7.5kg",
            support: "2,800원",
            option: "대과",
            badges: ["히트"]
        },
        {
            title: "프리미엄 딸기 2kg",
            image: "https://placehold.co/400x400/EC407A/FFF?text=딸기+2kg",
            support: "1,500원",
            option: "",
            badges: ["히트"]
        }
    ],
    recommend: [
        {
            title: "유기농 바나나 1.5kg",
            image: "https://placehold.co/400x400/FFEE58/333?text=바나나+1.5kg",
            support: "1,200원",
            option: "친환경 인증",
            badges: ["추천"]
        },
        {
            title: "스위트 오렌지 3kg",
            image: "https://placehold.co/400x400/FF9800/FFF?text=오렌지+3kg",
            support: "1,800원",
            option: "수입산",
            badges: ["추천"]
        },
        {
            title: "애플망고 2kg",
            image: "https://placehold.co/400x400/FDD835/333?text=망고+2kg",
            support: "3,000원",
            option: "태국산",
            badges: ["추천"]
        },
        {
            title: "골드키위 1.2kg",
            image: "https://placehold.co/400x400/9CCC65/FFF?text=키위+1.2kg",
            support: "900원",
            option: "",
            badges: ["추천"]
        }
    ],
    new: [
        {
            title: "햇 감자 10kg",
            image: "https://placehold.co/400x400/D7CCC8/333?text=감자+10kg",
            support: "2,200원",
            option: "대지마",
            badges: ["최신"]
        },
        {
            title: "국산 양파 10kg",
            image: "https://placehold.co/400x400/FFAB91/333?text=양파+10kg",
            support: "1,600원",
            option: "무안산",
            badges: ["최신"]
        },
        {
            title: "유기농 당근 5kg",
            image: "https://placehold.co/400x400/FF7043/FFF?text=당근+5kg",
            support: "1,400원",
            option: "친환경",
            badges: ["최신"]
        },
        {
            title: "대파 3kg",
            image: "https://placehold.co/400x400/AED581/333?text=대파+3kg",
            support: "800원",
            option: "",
            badges: ["최신"]
        }
    ],
    popular: [
        {
            title: "프리미엄 쌀 20kg",
            image: "https://placehold.co/400x400/FFF9C4/333?text=쌀+20kg",
            support: "5,000원",
            option: "2024년산",
            badges: ["인기"]
        },
        {
            title: "국산 고등어 10마리",
            image: "https://placehold.co/400x400/81D4FA/333?text=고등어",
            support: "2,500원",
            option: "냉동",
            badges: ["인기"]
        },
        {
            title: "한우 불고기 1kg",
            image: "https://placehold.co/400x400/FFCDD2/333?text=한우+1kg",
            support: "8,000원",
            option: "1등급",
            badges: ["인기"]
        },
        {
            title: "생 삼겹살 1kg",
            image: "https://placehold.co/400x400/F8BBD0/333?text=삼겹살+1kg",
            support: "3,500원",
            option: "",
            badges: ["인기"]
        }
    ]
    }; // getAllProductsData의 fallback return 끝
}

// 검색 함수
function searchProducts(keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();
    
    console.log('=== 검색 시작 ===');
    console.log('검색 키워드:', keyword);
    
    // 상품 데이터 가져오기
    const allProductsData = getAllProductsData();
    console.log('사용할 상품 데이터:', allProductsData);
    
    // 모든 상품에서 검색
    Object.keys(allProductsData).forEach(type => {
        console.log(`${type} 카테고리 상품 수:`, allProductsData[type].length);
        allProductsData[type].forEach((product, index) => {
            const titleMatch = product.title.toLowerCase().includes(lowerKeyword);
            const optionMatch = product.option && product.option.toLowerCase().includes(lowerKeyword);
            
            if (titleMatch || optionMatch) {
                console.log('✅ 매칭된 상품:', product.title);
                results.push({
                    ...product,
                    type: type,
                    index: index,
                    id: `${type}_${index}`
                });
            }
        });
    });
    
    console.log('총 검색 결과:', results.length, '개');
    console.log('=== 검색 완료 ===');
    return results;
}

// 상품 카드 생성
function createProductCard(product) {
    // badge 또는 badges 속성 지원
    const badgeArray = product.badge || product.badges || [];
    const badgeLabels = {
        hit: '히트',
        new: '최신',
        recommend: '추천',
        popular: '인기'
    };
    const badges = badgeArray.map(badge => `<span class="badge">${badgeLabels[badge] || badge}</span>`).join('');
    
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
function renderSearchResults() {
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
    
    // 검색어 표시
    if (keywordElement) {
        keywordElement.textContent = keyword;
    }
    
    // 검색창에 검색어 유지
    if (searchInput) {
        searchInput.value = keyword;
    }
    
    // 검색 실행
    const results = searchProducts(keyword);
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
    
    // 전체 카테고리 목록 (항상 표시)
    const allCategories = [
        '반려동물',
        '식품',
        '건강보조식품',
        '화장품',
        '생활용품',
        '가전제품',
        '선물용품',
        'e-쿠폰'
    ];
    
    // 카테고리별 개수 계산
    const categoryMap = {};
    allCategories.forEach(cat => {
        categoryMap[cat] = 0;
    });
    
    results.forEach(product => {
        // 상품에 category 속성이 있으면 그것을 사용 (나중에 업로드 시 사용)
        if (product.category) {
            const cat = product.category;
            if (categoryMap[cat] !== undefined) {
                categoryMap[cat]++;
            }
            console.log(`✅ ${cat}으로 분류 (실제 카테고리):`, product.title);
            return;
        }
        
        // category가 없으면 제목으로 추측 (임시 데이터용)
        const title = product.title.toLowerCase();
        
        // 반려동물
        if (title.includes('애견') || title.includes('고양이') || title.includes('강아지') || 
            title.includes('반려') || title.includes('펫') || title.includes('사료') || title.includes('간식')) {
            categoryMap['반려동물']++;
            console.log('✅ 반려동물로 분류 (제목 추측):', product.title);
        } 
        // 식품
        else if (title.includes('사과') || title.includes('배') || title.includes('귤') || title.includes('과일') || 
                 title.includes('김치') || title.includes('채소') || title.includes('고기') || title.includes('갈비') ||
                 title.includes('조생') || title.includes('감홍')) {
            categoryMap['식품']++;
            console.log('✅ 식품으로 분류 (제목 추측):', product.title);
        } 
        // 생활용품
        else if (title.includes('물티슈') || title.includes('티슈') || title.includes('스피커') || 
                 title.includes('에어프라이어') || title.includes('퍼즐')) {
            categoryMap['생활용품']++;
            console.log('✅ 생활용품으로 분류 (제목 추측):', product.title);
        } 
        // 화장품
        else if (title.includes('크림') || title.includes('앰플') || title.includes('화장') || 
                 title.includes('괄사') || title.includes('마사지')) {
            categoryMap['화장품']++;
            console.log('✅ 화장품으로 분류 (제목 추측):', product.title);
        }
    });
    
    // 카테고리 HTML 생성 - 항상 전체 목록 표시
    let html = `<a href="#">전체 (${results.length})</a>`;
    allCategories.forEach(category => {
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
            // 정렬 기능은 추후 구현
            console.log('정렬 변경:', sortSelect.value);
        });
    }
}

// 가격 필터 초기화
function initPriceFilter() {
    const applyBtn = document.querySelector('.apply-btn');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const minPrice = parseInt(minPriceInput.value) || 0;
            const maxPrice = parseInt(maxPriceInput.value) || Infinity;
            
            // 현재 검색 결과에 가격 필터 적용
            const keyword = getSearchKeyword();
            let results = searchProducts(keyword);
            
            // 가격 필터링
            results = results.filter(product => {
                const price = parseInt(product.support.replace(/[^0-9]/g, '')) || 0;
                return price >= minPrice && price <= maxPrice;
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
            
            // 카테고리 업데이트
            updateCategoryList(results);
        });
    }
}

// 검색 폼 핸들러 오버라이드
function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput.value.trim();
    
    if (keyword) {
        // 같은 페이지에서 URL 변경하고 다시 렌더링
        window.location.href = `search-results.html?q=${encodeURIComponent(keyword)}`;
    }
    
    return false;
}

// 초기화
function init() {
    console.log('🚀 검색 결과 페이지 초기화 시작');
    
    // script.js의 함수들이 있는지 확인하고 호출
    if (typeof initNoticeBanner === 'function') {
        try {
            initNoticeBanner();
            console.log('✅ 공지 배너 초기화 완료');
        } catch (e) {
            console.warn('⚠️ 공지 배너 초기화 실패:', e);
        }
    }
    
    if (typeof initSearchToggle === 'function') {
        try {
            initSearchToggle();
            console.log('✅ 검색 토글 초기화 완료');
        } catch (e) {
            console.warn('⚠️ 검색 토글 초기화 실패:', e);
        }
    }
    
    // 카테고리 사이드바 초기화
    if (typeof initCategorySidebar === 'function') {
        try {
            initCategorySidebar();
            console.log('✅ 카테고리 사이드바 초기화 완료');
        } catch (e) {
            console.warn('⚠️ 카테고리 사이드바 초기화 실패:', e);
        }
    }
    
    console.log('📦 검색 결과 렌더링 시작');
    renderSearchResults();
    
    console.log('🔧 필터 초기화 시작');
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

