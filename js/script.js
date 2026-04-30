// 소수점 8자리까지 표시, 9번째부터 버림
function formatTrix(value) {
    var num = Number(value) || 0;
    if (num === 0) return '0';
    var truncated = Math.floor(num * 1e8) / 1e8;
    var str = truncated.toFixed(8);
    str = str.replace(/0+$/, '').replace(/\.$/, '');
    return str;
}

// 상수 정의

// 상품 데이터
const productsData = {
    hit: [
        {
            title: '제주도 노지 조생귤 5kg',
            option: '중과 (S-M)',
            support: '2,000 trix',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/FFA726/FFF?text=제주귤&font=nanum-gothic'
        },
        {
            title: '이앤위즈 원홀 무전원 우드스피커',
            option: '',
            support: '2,500 trix',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/78909C/FFF?text=스피커&font=nanum-gothic'
        },
        {
            title: '시치미쓱 프리미엄 데일리물티슈 100매 * 10팩',
            option: '',
            support: '3,000 trix',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/81C784/FFF?text=물티슈&font=nanum-gothic'
        },
        {
            title: '셀비엔 괄사 마사지 리프팅 앰플 스틱 15ml',
            option: '',
            support: '3,000 trix',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/FF8A80/FFF?text=앰플&font=nanum-gothic'
        },
        {
            title: '셀비엔 블래미쉬 크림 & 블랙스팟 패치 기미세트',
            option: '',
            support: '5,000 trix',
            badge: ['hit', 'popular'],
            image: 'https://placehold.co/300x300/FFB74D/FFF?text=크림세트&font=nanum-gothic'
        },
        {
            title: '감홍사과 산지직송 고당도 문경 꿀사과 가정용 3kg',
            option: '가정용 못난이 / 중과 10-13과',
            support: '5,000 trix',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/EF5350/FFF?text=사과&font=nanum-gothic'
        },
        {
            title: '애견 영양 간식 치킨맛 200g',
            option: '전연령',
            support: '1,500 trix',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/8D6E63/FFF?text=애견간식&font=nanum-gothic'
        },
        {
            title: '롯데 스퀘어 다이얼 에어프라이어 7L 민트',
            option: '',
            support: '10,000 trix',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/4FC3F7/FFF?text=에어프라이어&font=nanum-gothic'
        },
        {
            title: '정관장 홍삼보윤정 데일리스틱 10ml x 30포',
            option: '',
            support: '8,000 trix',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/A1887F/FFF?text=홍삼&font=nanum-gothic'
        }
    ],
    recommend: [
        {
            title: '페티피 드라이룸 강아지집 자동온도조절 난방 살균',
            option: '',
            support: '20,000 trix',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/BA68C8/FFF?text=강아지집&font=nanum-gothic'
        },
        {
            title: '닥터포밸런스 견활력 애견영양간식',
            option: '30개입',
            support: '8,000 trix',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/FFD54F/333?text=영양간식&font=nanum-gothic'
        },
        {
            title: '꿈꾸는 미니가습기 화이트 핑크 랜덤',
            option: '화이트 / 핑크 색상 랜덤발송',
            support: '3,500 trix',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/64B5F6/FFF?text=가습기&font=nanum-gothic'
        },
        {
            title: '극세사 양털 입는 무릎담요 블루',
            option: '',
            support: '3,500 trix',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/4DB6AC/FFF?text=담요&font=nanum-gothic'
        },
        {
            title: '클립 자바라 스탠드 화이트(전구색)',
            option: '',
            support: '3,000 trix',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/FFB300/FFF?text=스탠드&font=nanum-gothic'
        },
        {
            title: '닥터유 단백질바 50gx12ea',
            option: '',
            support: '3,000 trix',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/E91E63/FFF?text=단백질바&font=nanum-gothic'
        },
        {
            title: '키밍 스카치 스포츠 암밴드 그레이',
            option: '',
            support: '2,500 trix',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/9C27B0/FFF?text=암밴드&font=nanum-gothic'
        },
        {
            title: '넛츠앤 오너 31호 525베리 데일리 하루너츠 선물세트',
            option: '',
            support: '5,000 trix',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/FF5722/FFF?text=선물세트&font=nanum-gothic'
        }
    ],
    new: [
        {
            title: '홈스타일 미니멀 고밀도 러그 카펫 140x200',
            option: '',
            support: '5,000 trix',
            badge: ['new'],
            image: 'https://placehold.co/300x300/8BC34A/FFF?text=러그&font=nanum-gothic'
        },
        {
            title: '쿠션 목베개 인형 옐로우고양이',
            option: '',
            support: '2,000 trix',
            badge: ['new'],
            image: 'https://placehold.co/300x300/CDDC39/333?text=목베개&font=nanum-gothic'
        },
        {
            title: '자이리톨 대추방울토마토 1kg',
            option: '',
            support: '1,000 trix',
            badge: ['new'],
            image: 'https://placehold.co/300x300/FF5252/FFF?text=토마토&font=nanum-gothic'
        },
        {
            title: '네추럴라이즈 간건강 활력 밀크씨슬 800mg x 180정',
            option: '',
            support: '1,500 trix',
            badge: ['new'],
            image: 'https://placehold.co/300x300/4CAF50/FFF?text=밀크씨슬&font=nanum-gothic'
        },
        {
            title: '네추럴라이즈 비타민C & 아연 꾸미 150g',
            option: '',
            support: '3,000 trix',
            badge: ['new'],
            image: 'https://placehold.co/300x300/FFC107/333?text=비타민C&font=nanum-gothic'
        },
        {
            title: '네추럴라이즈 칼슘 & 비타민D 꾸미 150g',
            option: '',
            support: '2,000 trix',
            badge: ['new'],
            image: 'https://placehold.co/300x300/FF9800/FFF?text=칼슘&font=nanum-gothic'
        },
        {
            title: '네추럴라이즈 멀티비타민 꾸미 150g',
            option: '',
            support: '2,500 trix',
            badge: ['new'],
            image: 'https://placehold.co/300x300/FF6F00/FFF?text=멀티비타민&font=nanum-gothic'
        },
        {
            title: '뮤토 소프트 자카드 블랭킷',
            option: '',
            support: '3,000 trix',
            badge: ['new'],
            image: 'https://placehold.co/300x300/42A5F5/FFF?text=블랭킷&font=nanum-gothic'
        },
        {
            title: '[타가] 아토 크림밤 50ml',
            option: '',
            support: '3,000 trix',
            badge: ['new'],
            image: 'https://placehold.co/300x300/26C6DA/FFF?text=크림밤&font=nanum-gothic'
        }
    ],
    popular: [
        {
            title: '더담은 일키로 오리윙 1kg',
            option: '',
            support: '2,000 trix',
            badge: ['popular'],
            image: 'https://placehold.co/300x300/AB47BC/FFF?text=오리윙&font=nanum-gothic'
        },
        {
            title: '더담은 일키로 고구마치킨 1kg',
            option: '',
            support: '2,000 trix',
            badge: ['popular'],
            image: 'https://placehold.co/300x300/8E24AA/FFF?text=고구마치킨&font=nanum-gothic'
        },
        {
            title: '1000피스 직소퍼즐 모네의 정원',
            option: '',
            support: '3,000 trix',
            badge: ['popular'],
            image: 'https://placehold.co/300x300/7E57C2/FFF?text=퍼즐&font=nanum-gothic'
        },
        {
            title: '셀비엔 블래미쉬 크림 & 블랙스팟 패치 기미세트',
            option: '',
            support: '5,000 trix',
            badge: ['hit', 'popular'],
            image: 'https://placehold.co/300x300/FFB74D/FFF?text=크림세트&font=nanum-gothic'
        },
        {
            title: '독스플레이 펫TV 펫캠',
            option: '',
            support: '100,000 trix',
            badge: ['popular'],
            image: 'https://placehold.co/300x300/5C6BC0/FFF?text=펫캠&font=nanum-gothic'
        },
        {
            title: '정관장 홍삼본정 데일리스틱 10ml x 30포 + 쇼핑백',
            option: '',
            support: '6,000 trix',
            badge: ['popular'],
            image: 'https://placehold.co/300x300/8D6E63/FFF?text=홍삼본정&font=nanum-gothic'
        },
        {
            title: '포천이동갈비 1.1kg 꽃갈비 (6대)',
            option: '',
            support: '5,000 trix',
            badge: ['recommend', 'popular'],
            image: 'https://placehold.co/300x300/D32F2F/FFF?text=갈비&font=nanum-gothic'
        },
        {
            title: '과일 큐브 치즈 8가지맛 24구 80g x 2ea',
            option: '',
            support: '2,000 trix',
            badge: ['recommend', 'popular'],
            image: 'https://placehold.co/300x300/FDD835/333?text=치즈&font=nanum-gothic'
        }
    ]
};

// 배지 한글 매핑
const badgeLabels = {
    hit: '히트',
    new: '최신',
    recommend: '추천',
    popular: '인기'
};

// DOM 요소
const elements = {
    categoryBtn: document.getElementById('categoryBtn'),
    categorySidebar: document.getElementById('categorySidebar'),
    closeSidebar: document.getElementById('closeSidebar'),
    // 최근 본 상품: today-viewed.js 공통 스크립트 사용
};

// 팝업 관련 함수 제거됨

// 검색 실행
function performSearch(keyword) {
    if (!keyword || !keyword.trim()) return;
    try { sessionStorage.setItem('searchKeyword', keyword.trim()); } catch (e) {}
    window.location.href = '/search-results.html?q=' + encodeURIComponent(keyword.trim());
}

// 검색 폼 제출
function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput && searchInput.value ? searchInput.value.trim() : '';
    if (keyword) {
        try { sessionStorage.setItem('searchKeyword', keyword); } catch (e) {}
        window.location.href = '/search-results.html?q=' + encodeURIComponent(keyword);
    }
    return false;
}

// 슬라이더 관련 코드 삭제됨 (단일 슬라이드 사용)

// 상품 카드 생성 (히트/추천/최신/인기 배지 표시 안 함)
function createProductCard(product, index, type, linkIdOverride) {
    const hideBadges = ['hit', 'recommend', 'new', 'popular'];
    const badges = (product.badge || []).filter(b => !hideBadges.includes(b)).map(badge =>
        `<span class="badge ${badge}">${badgeLabels[badge] || badge}</span>`
    ).join('');
    const productId = (linkIdOverride != null && linkIdOverride !== '') ? String(linkIdOverride) : (product && product.id != null && product.id !== '') ? String(product.id) : '';
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const priceHtml = isLoggedIn
        ? ((product.price != null && product.price !== '') ? Number(product.price).toLocaleString() + '원' : '0원')
        : '';

    var cardIndex = (typeof index === 'number') ? index : '';
    return `
        <div class="product-card" data-product-id="${productId}" data-card-index="${cardIndex}">
            <a href="product-detail.html" class="product-link" data-product-link="1">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}">
                    ${badges ? `<div class="product-badge">${badges}</div>` : ''}
                </div>
            </a>
            <div class="product-info">
                <a href="product-detail.html" class="product-title" data-product-link="1">${product.title}</a>
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

// 메인 상품 페이징: 10줄 = 1페이지 (1줄 = 그리드 열 개수만큼 상품, 읽기 절감)
const MAIN_ROWS_PER_PAGE = 10;
const MAIN_GRID_COLUMNS = 4;
const MAIN_ITEMS_PER_PAGE = MAIN_ROWS_PER_PAGE * MAIN_GRID_COLUMNS;
let mainProductCurrentPage = 1;
const MAIN_PAGINATION_VISIBLE = 9;
const MAIN_PAGINATION_SKIP = 10;

/** URL ?page= 와 메인 목록 페이지 동기화 (뒤로가기 시 동일 페이지 유지) */
function applyMainPageFromUrl() {
    var list = (productsData.all && productsData.all.length) ? productsData.all : [];
    var totalPages = Math.max(1, Math.ceil(list.length / MAIN_ITEMS_PER_PAGE));
    var p = parseInt(new URLSearchParams(window.location.search).get('page') || '1', 10);
    if (isNaN(p) || p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    mainProductCurrentPage = p;
}

function replaceMainPageUrlWithPage(page) {
    try {
        var url = new URL(window.location.href);
        if (page <= 1) url.searchParams.delete('page');
        else url.searchParams.set('page', String(page));
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) { /* ignore */ }
}

function getMainPaginationVisible() {
    var w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (w <= 360) return 4;
    if (w <= 480) return 5;
    if (w <= 768) return 6;
    return 9;
}

function renderProducts() {
    const grid = document.getElementById('mainProductGrid');
    if (!grid) return;
    var list = (productsData.all && productsData.all.length) ? productsData.all : [];
    var totalPages = Math.max(1, Math.ceil(list.length / MAIN_ITEMS_PER_PAGE));
    if (mainProductCurrentPage > totalPages) mainProductCurrentPage = totalPages;
    var start = (mainProductCurrentPage - 1) * MAIN_ITEMS_PER_PAGE;
    var slice = list.slice(start, start + MAIN_ITEMS_PER_PAGE);
    var docIds = window.__mainProductDocIds || [];
    grid.innerHTML = slice.map(function (product, index) {
        var linkId = (docIds[start + index] != null && docIds[start + index] !== '') ? String(docIds[start + index]) : (product && product.id != null && product.id !== '') ? String(product.id) : '';
        return createProductCard(product, start + index, '', linkId);
    }).join('');
    grid.dataset.docIds = JSON.stringify(docIds);
    grid.dataset.sliceStart = String(start);
    updateProductRatings(slice);
    renderMainPagination(list.length);
}

function renderMainPagination(totalItems) {
    var wrap = document.getElementById('mainProductPaginationWrap');
    var container = document.getElementById('mainProductPagination');
    if (!wrap || !container) return;
    var totalPages = Math.max(1, Math.ceil(totalItems / MAIN_ITEMS_PER_PAGE));
    if (totalPages <= 1) {
        wrap.style.display = 'none';
        return;
    }
    wrap.style.display = 'block';
    var cur = mainProductCurrentPage;
    var visible = getMainPaginationVisible();
    var half = Math.floor(visible / 2);
    var start = Math.max(1, cur - half);
    var end = Math.min(totalPages, start + visible - 1);
    if (end - start + 1 < visible) start = Math.max(1, end - visible + 1);
    var html = '';
    html += '<button type="button" class="main-pagination-btn main-pagination-skip-prev" ' + (cur <= MAIN_PAGINATION_SKIP ? 'disabled' : '') + ' title="10페이지 이전">&lt;&lt;</button>';
    html += '<button type="button" class="main-pagination-btn main-pagination-prev" ' + (cur <= 1 ? 'disabled' : '') + ' title="이전">&lt;</button>';
    if (start > 1) html += '<button type="button" class="main-pagination-btn" disabled>...</button>';
    for (var p = start; p <= end; p++) {
        html += '<button type="button" class="main-pagination-btn' + (p === cur ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
    }
    if (end < totalPages) html += '<button type="button" class="main-pagination-btn" disabled>...</button>';
    html += '<button type="button" class="main-pagination-btn main-pagination-next" ' + (cur >= totalPages ? 'disabled' : '') + ' title="다음">&gt;</button>';
    html += '<button type="button" class="main-pagination-btn main-pagination-skip-next" ' + (cur + MAIN_PAGINATION_SKIP > totalPages ? 'disabled' : '') + ' title="10페이지 다음">&gt;&gt;</button>';
    container.innerHTML = html;
    container.onclick = function (e) {
        var btn = e.target.closest('.main-pagination-btn');
        if (!btn || btn.disabled) return;
        var totalPages = Math.max(1, Math.ceil((productsData.all || []).length / MAIN_ITEMS_PER_PAGE));
        if (btn.classList.contains('main-pagination-skip-prev')) { mainProductCurrentPage = Math.max(1, mainProductCurrentPage - MAIN_PAGINATION_SKIP); }
        else if (btn.classList.contains('main-pagination-prev')) { mainProductCurrentPage = Math.max(1, mainProductCurrentPage - 1); }
        else if (btn.classList.contains('main-pagination-next')) { mainProductCurrentPage = Math.min(totalPages, mainProductCurrentPage + 1); }
        else if (btn.classList.contains('main-pagination-skip-next')) { mainProductCurrentPage = Math.min(totalPages, mainProductCurrentPage + MAIN_PAGINATION_SKIP); }
        else if (btn.dataset.page) { mainProductCurrentPage = parseInt(btn.dataset.page, 10); }
        else return;
        replaceMainPageUrlWithPage(mainProductCurrentPage);
        renderProducts();
        var el = document.getElementById('main-products');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
}

// 상품 평점 업데이트 함수 (현재 페이지 상품만 조회해 읽기 절감)
async function updateProductRatings(productsToUpdate) {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        return;
    }

    const db = firebase.firestore();
    const list = Array.isArray(productsToUpdate) && productsToUpdate.length
        ? productsToUpdate
        : (productsData.all || []);

    for (const product of list) {
        if (!product.id) continue;

        try {
            const productIdStr = String(product.id);
            const reviewsSnapshot = await db.collection('posts')
                .where('boardType', '==', 'review')
                .where('productId', '==', productIdStr)
                .get();

            let totalRating = 0;
            let reviewCount = 0;

            reviewsSnapshot.docs.forEach(doc => {
                const review = doc.data();
                if (review.reviewType === 'product' && review.rating) {
                    totalRating += review.rating;
                    reviewCount++;
                } else if (!review.reviewType && review.rating) {
                    totalRating += review.rating;
                    reviewCount++;
                }
            });

            const avgRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;

            // 해당 상품 카드의 평점 업데이트
            const productCard = document.querySelector(`.product-card[data-product-id="${product.id}"]`);
            if (productCard) {
                const ratingSpan = productCard.querySelector('.product-rating .rating-value');
                if (ratingSpan) {
                    ratingSpan.textContent = avgRating;
                }
            }
        } catch (error) {
            console.error(`상품 ${product.id} 평점 로드 오류:`, error);
        }
    }
}

// 스크롤 시 헤더 고정
function initScrollHeader() {
    let lastScroll = 0;
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            header.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        } else {
            header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }

        lastScroll = currentScroll;
    });
}

// 공유 버튼 이벤트
function initShareButtons() {
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

// 초기화 - 히어로 문구 고정: 첫 줄 "세상에 없던 쇼핑몰", 둘째 줄 "10쇼핑게임" (10 강조)
function initHeroTitle() {
    const heroTitle = document.querySelector('.slide-content h1');
    if (!heroTitle) return;
    
    const toSpans = (str, offset) => str.split('').map((char, i) => {
        if (char === ' ') return '<span class="char-space"> </span>';
        return `<span class="char" data-char="${char}" style="animation-delay: ${(offset + i) * 0.1}s">${char}</span>`;
    }).join('');
    
    const line1 = '세상에 없던 쇼핑몰';
    const line2After10 = ' 쇼핑게임';
    
    heroTitle.innerHTML = '<span class="hero-line1">' + toSpans(line1, 0) + '</span><br class="hero-br"><span class="hero-line2">' + '<span class="hero-number">10</span>' + toSpans(line2After10, 1) + '</span>';
}

function initScrollDown() {
    const scrollDownBtn = document.getElementById('scrollDownBtn');
    if (!scrollDownBtn) return;
    
    scrollDownBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = document.getElementById('main-products');
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

function initTermsModal() {
    const termsLink = document.getElementById('termsOfServiceLink');
    const termsModal = document.getElementById('termsOfServiceModal');
    const closeBtn = document.getElementById('termsModalClose');
    const confirmBtn = document.getElementById('termsModalConfirm');

    if (!termsLink || !termsModal) return;

    // 모달 열기
    termsLink.addEventListener('click', (e) => {
        e.preventDefault();
        termsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // 모달 닫기
    const closeModal = () => {
        termsModal.style.display = 'none';
        document.body.style.overflow = '';
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', closeModal);
    }

    // 모달 배경 클릭 시 닫기
    termsModal.addEventListener('click', (e) => {
        if (e.target === termsModal) {
            closeModal();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && termsModal.style.display === 'flex') {
            closeModal();
        }
    });
}

function initPrivacyModal() {
    const privacyLink = document.getElementById('privacyPolicyLink');
    const privacyModal = document.getElementById('privacyPolicyModal');
    const closeBtn = document.getElementById('privacyModalClose');
    const confirmBtn = document.getElementById('privacyModalConfirm');

    if (!privacyLink || !privacyModal) return;

    // 모달 열기
    privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        privacyModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // 모달 닫기
    const closeModal = () => {
        privacyModal.style.display = 'none';
        document.body.style.overflow = '';
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', closeModal);
    }

    // 모달 배경 클릭 시 닫기
    privacyModal.addEventListener('click', (e) => {
        if (e.target === privacyModal) {
            closeModal();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && privacyModal.style.display === 'flex') {
            closeModal();
        }
    });
}

// 배너 슬라이더 초기화
function initBannerSlider() {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dots .dot');
    let currentSlide = 0;
    let slideInterval;

    if (slides.length === 0) return;

    function showSlide(index) {
        // 모든 슬라이드 숨기기
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // 현재 슬라이드 표시
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        
        currentSlide = index;
    }

    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    // 자동 슬라이드 (5초마다)
    function startSlideInterval() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function stopSlideInterval() {
        if (slideInterval) {
            clearInterval(slideInterval);
        }
    }

    // 도트 클릭 이벤트
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopSlideInterval();
            showSlide(index);
            startSlideInterval();
        });
    });

    // 슬라이더에 마우스 올리면 일시 정지
    const sliderContainer = document.querySelector('.banner-slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopSlideInterval);
        sliderContainer.addEventListener('mouseleave', startSlideInterval);
    }

    // 초기 슬라이드 표시 및 자동 슬라이드 시작
    showSlide(0);
    startSlideInterval();
}

function initScrollToTop() {
    var btn = document.getElementById('scrollToTopBtn');
    if (!btn) return;
    btn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initMainProductGridClick() {
    var grid = document.getElementById('mainProductGrid');
    if (!grid) return;
    grid.addEventListener('click', function (e) {
        if (!e.target.closest('[data-product-link="1"]')) return;
        var card = e.target.closest('.product-card');
        if (!card) return;
        var idx = card.getAttribute('data-card-index');
        if (idx === null || idx === '') return;
        var docIdsJson = grid.getAttribute('data-doc-ids');
        if (!docIdsJson) return;
        var docIds = [];
        try { docIds = JSON.parse(docIdsJson); } catch (err) { return; }
        var id = docIds[parseInt(idx, 10)];
        if (id) {
            e.preventDefault();
            e.stopPropagation();
            try { sessionStorage.setItem('selectedProductId', id); } catch (err) {}
            window.location.href = 'product-detail.html?id=' + encodeURIComponent(id);
        }
    });
}

function init() {
    if (typeof window.initCategorySidebar === 'function') window.initCategorySidebar();
    initHeroTitle();
    initScrollDown();
    initTermsModal();
    initPrivacyModal();
    initMainProductGridClick();
    renderProducts();
    initScrollHeader();
    initShareButtons();
    initBannerSlider();
    initScrollToTop();
}

// DOM 로드 완료 시 실행
// Firestore에서 상품 가져오기
async function loadProductsFromFirestore() {
    try {
        // Firebase가 초기화될 때까지 대기
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.log('Firebase가 아직 초기화되지 않았습니다. 기본 데이터를 사용합니다.');
            return;
        }

        const db = firebase.firestore();
        
        // where와 orderBy를 함께 사용하면 인덱스가 필요하므로 분리
        const productsSnapshot = await db.collection('products').get();

        if (productsSnapshot.empty) {
            console.log('Firestore에 상품이 없습니다. 기본 데이터를 사용합니다.');
            return;
        }
        
        // 스냅샷에서 바로 doc.id 사용 (캐시/덮어쓰기 방지)
        const docsWithData = [];
        productsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'sale') {
                docsWithData.push({ docId: doc.id, data: data });
            }
        });
        docsWithData.sort((a, b) => {
            const aTime = a.data.createdAt?.toMillis() || 0;
            const bTime = b.data.createdAt?.toMillis() || 0;
            return bTime - aTime;
        });

        const allList = [];
        docsWithData.forEach(function (item) {
            var d = item.data;
            allList.push({
                id: item.docId,
                title: d.name,
                option: d.shortDesc || '',
                price: d.price || 0,
                support: (d.supportAmount != null && d.supportAmount > 0) ? (formatTrix(d.supportAmount) + ' trix') : '0 trix',
                badge: Array.isArray(d.displayCategory) ? d.displayCategory : [],
                image: (window.resolveProductImageUrl && window.resolveProductImageUrl(d.mainImageUrl || d.imageUrl)) || d.mainImageUrl || d.imageUrl || 'https://placehold.co/300x300/E0E0E0/999?text=No+Image'
            });
        });
        productsData.all = allList;
        window.__mainProductDocIds = allList.map(function (p) { return p.id; });
        productsData.hit = [];
        productsData.recommend = [];
        productsData.new = [];
        productsData.popular = [];
        console.log('✅ Firestore에서 상품 데이터 불러옴:', allList.length, '개');
        if (allList.length > 0) {
            console.log('📌 상품 ID 샘플(첫 5개):', window.__mainProductDocIds.slice(0, 5));
        }

        applyMainPageFromUrl();
        // 상품 렌더링 다시 실행
        renderProducts();

    } catch (error) {
        console.error('❌ Firestore 상품 로드 오류:', error);
        window.__mainProductDocIds = [];
        console.log('기본 데이터를 사용합니다.');
    }
}

// Firebase 초기화 대기 함수
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5초
        
        const checkFirebase = setInterval(() => {
            attempts++;
            
            if (window.firebase && firebase.firestore) {
                clearInterval(checkFirebase);
                console.log('✅ Firebase 초기화 완료');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkFirebase);
                console.error('❌ Firebase 초기화 시간 초과');
                reject(new Error('Firebase 초기화 실패'));
            }
        }, 100);
    });
}

// 메인페이지 사용후기 로드 (Firestore posts, boardType=review)
async function loadMainPageReviews() {
    const container = document.getElementById('mainReviewContainer');
    const emptyEl = document.getElementById('mainReviewEmpty');
    if (!container) return;

    if (typeof firebase === 'undefined' || !firebase.firestore) {
        try {
            await waitForFirebase();
        } catch (e) {
            return;
        }
    }

    try {
        const db = firebase.firestore();
        var snapshot = await db.collection('posts')
            .where('boardType', '==', 'review')
            .get();

        var reviews = [];
        var seenIds = {};
        snapshot.docs.forEach(function(doc) {
            if (seenIds[doc.id]) return;
            seenIds[doc.id] = true;
            var d = doc.data();
            if (d.reviewType === 'product') return;
            var createdAt = null;
            if (d.createdAt) {
                if (d.createdAt.seconds != null) createdAt = new Date(d.createdAt.seconds * 1000);
                else if (typeof d.createdAt.toDate === 'function') createdAt = d.createdAt.toDate();
            }
            reviews.push({
                id: doc.id,
                title: d.title || '',
                content: d.content || '',
                authorName: d.authorNickname || d.authorName || '익명',
                rating: d.rating || 0,
                productName: d.productName || '',
                createdAt: createdAt
            });
        });
        window._mainPageUsageReviews = reviews;

        var sortOrder = 'latest';
        if (sortOrder === 'latest') {
            reviews.sort(function(a, b) {
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });
        } else {
            reviews.sort(function(a, b) {
                var ra = a.rating || 0, rb = b.rating || 0;
                if (rb !== ra) return rb - ra;
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });
        }

        if (reviews.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            var sw = document.getElementById('mainReviewSliderWrap');
            var eb = document.getElementById('mainReviewExpandBtn');
            if (sw) sw.style.display = 'none';
            if (eb) eb.style.display = 'none';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        var sliderWrap = document.getElementById('mainReviewSliderWrap');
        var expandBtn = document.getElementById('mainReviewExpandBtn');
        if (sliderWrap) sliderWrap.style.display = 'flex';
        if (expandBtn) expandBtn.style.display = 'inline-block';

        function buildReviewItem(r, index) {
            var dateStr = r.createdAt ? r.createdAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
            var stars = '<span class="main-review-stars">' + Array(5).fill(0).map(function(_, i) {
                return '<i class="' + (i < r.rating ? 'fas' : 'far') + ' fa-star" style="color:#FFD700;font-size:14px;"></i>';
            }).join('') + '</span>';
            var fullContent = escapeHtml(r.content || '');
            var safeId = 'review-content-' + (r.id || index);
            return '<article class="main-review-item">' +
                '<div class="main-review-header">' +
                '<strong class="main-review-title">' + escapeHtml(r.title) + '</strong>' +
                '</div>' +
                '<div class="main-review-content-box" id="' + safeId + '" data-full="' + fullContent.replace(/"/g, '&quot;') + '" role="button" tabindex="0" title="클릭 시 전체 내용 보기">' +
                '<div class="main-review-content-inner">' + fullContent + '</div>' +
                '</div>' +
                '<div class="main-review-meta">' + stars + ' <span class="main-review-author">' + escapeHtml(r.authorName) + '</span> · <span class="main-review-date">' + dateStr + '</span></div>' +
                '</article>';
        }

        var trackEl = document.getElementById('mainReviewTrack');
        if (trackEl) {
            trackEl.innerHTML = reviews.map(buildReviewItem).join('');
            trackEl.querySelectorAll('.main-review-content-box').forEach(function(box) {
                box.addEventListener('click', function() {
                    var full = this.getAttribute('data-full');
                    if (!full) return;
                    var modal = document.getElementById('reviewContentModal');
                    var body = document.getElementById('reviewContentModalBody');
                    if (modal && body) {
                        body.textContent = full;
                        modal.style.display = 'flex';
                        modal.style.visibility = 'visible';
                        modal.classList.add('active');
                    } else {
                        alert(full);
                    }
                });
            });
        }

        var track = document.getElementById('mainReviewTrack');
        var prevBtn = document.getElementById('mainReviewPrev');
        var nextBtn = document.getElementById('mainReviewNext');
        if (track && prevBtn && nextBtn && !track._reviewSliderBound) {
            track._reviewSliderBound = true;
            var scrollStep = 320;
            prevBtn.addEventListener('click', function() {
                track.scrollLeft = Math.max(0, track.scrollLeft - scrollStep);
            });
            nextBtn.addEventListener('click', function() {
                track.scrollLeft = Math.min(track.scrollWidth - track.clientWidth, track.scrollLeft + scrollStep);
            });
        }

        if (!window._reviewContentModalBound) {
            window._reviewContentModalBound = true;
            var modal = document.getElementById('reviewContentModal');
            var closeBtn = document.getElementById('reviewContentModalClose');
            function closeReviewModal() {
                if (modal) {
                    modal.style.display = 'none';
                    modal.style.visibility = 'hidden';
                    modal.classList.remove('active');
                }
            }
            if (modal) {
                if (closeBtn) closeBtn.addEventListener('click', closeReviewModal);
                var backdrop = modal.querySelector('.review-content-modal-backdrop');
                if (backdrop) backdrop.addEventListener('click', closeReviewModal);
            }
        }
    } catch (error) {
        console.error('메인페이지 후기 로드 오류:', error);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initMainPage() {
    updateHeaderForLoginStatus();
    init();
    waitForFirebase().then(async () => {
        try {
            if (typeof window.loadNavCategories === 'function') await window.loadNavCategories();
            await loadProductsFromFirestore();
        } catch (error) {
            console.error('초기화 오류:', error);
        } finally {
            await loadMainPageReviews();
        }
    }).catch(async () => {
        await loadMainPageReviews();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initMainPage();
        window.addEventListener('pageshow', function(ev) {
            if (ev.persisted || document.visibilityState === 'visible') {
                loadMainPageReviews();
            }
        });
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                loadMainPageReviews();
            }
        });
    });
} else {
    initMainPage();
    window.addEventListener('pageshow', function(ev) {
        if (ev.persisted || document.visibilityState === 'visible') {
            loadMainPageReviews();
        }
    });
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            loadMainPageReviews();
        }
    });
}

// 로그인 상태 확인 및 헤더 UI 업데이트
function updateHeaderForLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginUserData = localStorage.getItem('loginUser');
    
    if (isLoggedIn && loginUserData) {
        const user = JSON.parse(loginUserData);
        updateHeaderToLoggedIn(user);
    }
}

// 로그인 상태로 헤더 업데이트
function updateHeaderToLoggedIn(user) {
    // 상단 헤더의 로그인/회원가입 버튼 찾기
    const userMenus = document.querySelectorAll('.user-menu');
    
    userMenus.forEach(userMenu => {
        // 로그인 버튼 찾기 (href 또는 텍스트로 찾기)
        let loginLink = userMenu.querySelector('a[href="login.html"]');
        if (!loginLink) {
            // href가 login.html이 아닌 경우, 텍스트에 "로그인"이 포함된 링크 찾기
            const links = userMenu.querySelectorAll('a');
            for (const link of links) {
                if (link.textContent.includes('로그인')) {
                    loginLink = link;
                    break;
                }
            }
        }
        
        if (loginLink) {
            loginLink.href = '#';
            loginLink.innerHTML = `<i class="fas fa-sign-out-alt"></i> 로그아웃`;
            loginLink.onclick = (e) => {
                e.preventDefault();
                handleLogout();
            };
        }
        
        // 회원가입 버튼 찾기
        const signupLink = userMenu.querySelector('a[href="signup.html"], .signup-btn');
        if (signupLink) {
            signupLink.href = 'mypage.html';
            signupLink.innerHTML = `<i class="fas fa-user-circle"></i> 마이페이지`;
            signupLink.classList.remove('signup-btn');
            signupLink.classList.add('mypage-btn');
        }
    });
    
    // 사이드바 로그인/회원가입 버튼 찾기
    const sidebarQuick = document.querySelector('.user-quick');
    if (sidebarQuick) {
        sidebarQuick.innerHTML = `
            <a href="mypage.html"><i class="fas fa-user-circle"></i> ${user.name}님</a>
            <a href="#" onclick="handleLogout(); return false;"><i class="fas fa-sign-out-alt"></i> 로그아웃</a>
        `;
    }
    
    // 하단 모바일 네비게이션 (span 텍스트가 '로그인'인 링크 찾기)
    const bottomNavLinks = document.querySelectorAll('.bottom-nav .nav-item');
    if (bottomNavLinks && bottomNavLinks.length) {
        bottomNavLinks.forEach((a) => {
            const span = a.querySelector('span');
            if (span && span.textContent && span.textContent.trim() === '로그인') {
                a.href = 'mypage.html';
                const icon = a.querySelector('i');
                if (icon) icon.className = 'fas fa-user-circle';
                span.textContent = '마이페이지';
            }
        });
    }
}

// 로그아웃 처리
function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        // 로그인 정보 삭제
        localStorage.removeItem('loginUser');
        localStorage.removeItem('isLoggedIn');
        localStorage.setItem('isAdmin', 'false');
        
        alert('로그아웃 되었습니다.');
        
        // 메인 페이지로 이동
        window.location.href = 'index.html';
    }
}

// 상단 유틸 메뉴 네비게이션 클릭 이벤트
function initTopMenuNavigation() {
    const topMenuLinks = document.querySelectorAll('.top-menu a');
    
    topMenuLinks.forEach(link => {
        const icon = link.querySelector('i');
        if (!icon) return;
        
        const iconClass = icon.className;
        let section = null;
        
        // 아이콘 클래스로 섹션 판별
        if (iconClass.includes('fa-shopping-bag')) {
            // 주문내역
            section = 'orders';
        } else if (iconClass.includes('fa-question-circle')) {
            // FAQ는 이미 링크가 있으므로 처리하지 않음
            return;
        } else if (iconClass.includes('fa-comment')) {
            // 1:1문의
            section = 'inquiry';
        } else if (iconClass.includes('fa-star')) {
            // 사용후기 → 사용후기 작성하기 섹션으로 이동
            section = 'review-write';
        } else if (iconClass.includes('fa-keyboard')) {
            // 상품문의
            section = 'product-inquiry';
        }
        
        if (section) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 로그인 체크
                const loginUser = localStorage.getItem('loginUser');
                const isLoggedIn = localStorage.getItem('isLoggedIn');
                
                if (!loginUser || isLoggedIn !== 'true') {
                    alert('로그인이 필요합니다. 로그인 후 이용해주세요.');
                    window.location.href = 'login.html';
                    return;
                }
                
                // 마이페이지 해당 섹션으로 이동
                window.location.href = `mypage.html?section=${section}`;
            });
        }
    });
}

// 페이지 로드 시 네비게이션 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTopMenuNavigation);
} else {
    initTopMenuNavigation();
}

// bfcache로 메인 복원 시 URL ?page= 과 그리드 동기화
window.addEventListener('pageshow', function (ev) {
    if (!ev.persisted) return;
    if (!document.getElementById('mainProductGrid')) return;
    applyMainPageFromUrl();
    renderProducts();
});

// 전역으로 노출
window.handleLogout = handleLogout;
window.updateHeaderForLoginStatus = updateHeaderForLoginStatus;

