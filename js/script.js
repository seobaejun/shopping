// 상수 정의
const SLIDE_INTERVAL = 5000;

// 상품 데이터
const productsData = {
    hit: [
        {
            title: '제주도 노지 조생귤 5kg',
            option: '중과 (S-M)',
            support: '2,000원',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/FFA726/FFF?text=제주귤&font=nanum-gothic'
        },
        {
            title: '이앤위즈 원홀 무전원 우드스피커',
            option: '',
            support: '2,500원',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/78909C/FFF?text=스피커&font=nanum-gothic'
        },
        {
            title: '시치미쓱 프리미엄 데일리물티슈 100매 * 10팩',
            option: '',
            support: '3,000원',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/81C784/FFF?text=물티슈&font=nanum-gothic'
        },
        {
            title: '셀비엔 괄사 마사지 리프팅 앰플 스틱 15ml',
            option: '',
            support: '3,000원',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/FF8A80/FFF?text=앰플&font=nanum-gothic'
        },
        {
            title: '셀비엔 블래미쉬 크림 & 블랙스팟 패치 기미세트',
            option: '',
            support: '5,000원',
            badge: ['hit', 'popular'],
            image: 'https://placehold.co/300x300/FFB74D/FFF?text=크림세트&font=nanum-gothic'
        },
        {
            title: '감홍사과 산지직송 고당도 문경 꿀사과 가정용 3kg',
            option: '가정용 못난이 / 중과 10-13과',
            support: '5,000원',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/EF5350/FFF?text=사과&font=nanum-gothic'
        },
        {
            title: '애견 영양 간식 치킨맛 200g',
            option: '전연령',
            support: '1,500원',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/8D6E63/FFF?text=애견간식&font=nanum-gothic'
        },
        {
            title: '롯데 스퀘어 다이얼 에어프라이어 7L 민트',
            option: '',
            support: '10,000원',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/4FC3F7/FFF?text=에어프라이어&font=nanum-gothic'
        },
        {
            title: '정관장 홍삼보윤정 데일리스틱 10ml x 30포',
            option: '',
            support: '8,000원',
            badge: ['hit'],
            image: 'https://placehold.co/300x300/A1887F/FFF?text=홍삼&font=nanum-gothic'
        }
    ],
    recommend: [
        {
            title: '페티피 드라이룸 강아지집 자동온도조절 난방 살균',
            option: '',
            support: '20,000원',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/BA68C8/FFF?text=강아지집&font=nanum-gothic'
        },
        {
            title: '닥터포밸런스 견활력 애견영양간식',
            option: '30개입',
            support: '8,000원',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/FFD54F/333?text=영양간식&font=nanum-gothic'
        },
        {
            title: '꿈꾸는 미니가습기 화이트 핑크 랜덤',
            option: '화이트 / 핑크 색상 랜덤발송',
            support: '3,500원',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/64B5F6/FFF?text=가습기&font=nanum-gothic'
        },
        {
            title: '극세사 양털 입는 무릎담요 블루',
            option: '',
            support: '3,500원',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/4DB6AC/FFF?text=담요&font=nanum-gothic'
        },
        {
            title: '클립 자바라 스탠드 화이트(전구색)',
            option: '',
            support: '3,000원',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/FFB300/FFF?text=스탠드&font=nanum-gothic'
        },
        {
            title: '닥터유 단백질바 50gx12ea',
            option: '',
            support: '3,000원',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/E91E63/FFF?text=단백질바&font=nanum-gothic'
        },
        {
            title: '키밍 스카치 스포츠 암밴드 그레이',
            option: '',
            support: '2,500원',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/9C27B0/FFF?text=암밴드&font=nanum-gothic'
        },
        {
            title: '넛츠앤 오너 31호 525베리 데일리 하루너츠 선물세트',
            option: '',
            support: '5,000원',
            badge: ['recommend'],
            image: 'https://placehold.co/300x300/FF5722/FFF?text=선물세트&font=nanum-gothic'
        }
    ],
    new: [
        {
            title: '홈스타일 미니멀 고밀도 러그 카펫 140x200',
            option: '',
            support: '5,000원',
            badge: ['new'],
            image: 'https://placehold.co/300x300/8BC34A/FFF?text=러그&font=nanum-gothic'
        },
        {
            title: '쿠션 목베개 인형 옐로우고양이',
            option: '',
            support: '2,000원',
            badge: ['new'],
            image: 'https://placehold.co/300x300/CDDC39/333?text=목베개&font=nanum-gothic'
        },
        {
            title: '자이리톨 대추방울토마토 1kg',
            option: '',
            support: '1,000원',
            badge: ['new'],
            image: 'https://placehold.co/300x300/FF5252/FFF?text=토마토&font=nanum-gothic'
        },
        {
            title: '네추럴라이즈 간건강 활력 밀크씨슬 800mg x 180정',
            option: '',
            support: '1,500원',
            badge: ['new'],
            image: 'https://placehold.co/300x300/4CAF50/FFF?text=밀크씨슬&font=nanum-gothic'
        },
        {
            title: '네추럴라이즈 비타민C & 아연 꾸미 150g',
            option: '',
            support: '3,000원',
            badge: ['new'],
            image: 'https://placehold.co/300x300/FFC107/333?text=비타민C&font=nanum-gothic'
        },
        {
            title: '네추럴라이즈 칼슘 & 비타민D 꾸미 150g',
            option: '',
            support: '2,000원',
            badge: ['new'],
            image: 'https://placehold.co/300x300/FF9800/FFF?text=칼슘&font=nanum-gothic'
        },
        {
            title: '네추럴라이즈 멀티비타민 꾸미 150g',
            option: '',
            support: '2,500원',
            badge: ['new'],
            image: 'https://placehold.co/300x300/FF6F00/FFF?text=멀티비타민&font=nanum-gothic'
        },
        {
            title: '뮤토 소프트 자카드 블랭킷',
            option: '',
            support: '3,000원',
            badge: ['new'],
            image: 'https://placehold.co/300x300/42A5F5/FFF?text=블랭킷&font=nanum-gothic'
        },
        {
            title: '[타가] 아토 크림밤 50ml',
            option: '',
            support: '3,000원',
            badge: ['new'],
            image: 'https://placehold.co/300x300/26C6DA/FFF?text=크림밤&font=nanum-gothic'
        }
    ],
    popular: [
        {
            title: '더담은 일키로 오리윙 1kg',
            option: '',
            support: '2,000원',
            badge: ['popular'],
            image: 'https://placehold.co/300x300/AB47BC/FFF?text=오리윙&font=nanum-gothic'
        },
        {
            title: '더담은 일키로 고구마치킨 1kg',
            option: '',
            support: '2,000원',
            badge: ['popular'],
            image: 'https://placehold.co/300x300/8E24AA/FFF?text=고구마치킨&font=nanum-gothic'
        },
        {
            title: '1000피스 직소퍼즐 모네의 정원',
            option: '',
            support: '3,000원',
            badge: ['popular'],
            image: 'https://placehold.co/300x300/7E57C2/FFF?text=퍼즐&font=nanum-gothic'
        },
        {
            title: '셀비엔 블래미쉬 크림 & 블랙스팟 패치 기미세트',
            option: '',
            support: '5,000원',
            badge: ['hit', 'popular'],
            image: 'https://placehold.co/300x300/FFB74D/FFF?text=크림세트&font=nanum-gothic'
        },
        {
            title: '독스플레이 펫TV 펫캠',
            option: '',
            support: '100,000원',
            badge: ['popular'],
            image: 'https://placehold.co/300x300/5C6BC0/FFF?text=펫캠&font=nanum-gothic'
        },
        {
            title: '정관장 홍삼본정 데일리스틱 10ml x 30포 + 쇼핑백',
            option: '',
            support: '6,000원',
            badge: ['popular'],
            image: 'https://placehold.co/300x300/8D6E63/FFF?text=홍삼본정&font=nanum-gothic'
        },
        {
            title: '포천이동갈비 1.1kg 꽃갈비 (6대)',
            option: '',
            support: '5,000원',
            badge: ['recommend', 'popular'],
            image: 'https://placehold.co/300x300/D32F2F/FFF?text=갈비&font=nanum-gothic'
        },
        {
            title: '과일 큐브 치즈 8가지맛 24구 80g x 2ea',
            option: '',
            support: '2,000원',
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
    prevSlide: document.getElementById('prevSlide'),
    nextSlide: document.getElementById('nextSlide'),
    sliderDots: document.getElementById('sliderDots'),
    toggleViewed: document.getElementById('toggleViewed'),
    viewedPanel: document.getElementById('viewedPanel'),
    viewedPanelClose: document.getElementById('viewedPanelClose'),
    viewedList: document.getElementById('viewedList'),
    viewedCountBadge: document.getElementById('viewedCountBadge'),
    btnClearAll: document.getElementById('btnClearAll')
};

// 팝업 관련 함수 제거됨

// 카테고리 사이드바
function initCategorySidebar() {
    elements.categoryBtn.addEventListener('click', () => {
        elements.categorySidebar.classList.add('active');
    });

    elements.closeSidebar.addEventListener('click', () => {
        elements.categorySidebar.classList.remove('active');
    });

    // 서브메뉴 토글
    const hasSubmenuItems = document.querySelectorAll('.category-list .has-submenu > a');
    hasSubmenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const parent = item.parentElement;
            parent.classList.toggle('active');
        });
    });
}

// 인기 검색어 데이터 (Firestore에서 실시간 로드)
let POPULAR_KEYWORDS = [];

let currentKeywordIndex = 0;
let keywordRotationInterval;

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

// 최근 7일간 인기 검색어 가져오기
async function loadPopularKeywords() {
    try {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.warn('Firebase가 초기화되지 않았습니다.');
            return [];
        }
        
        const db = firebase.firestore();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // 최근 7일간의 검색 로그 가져오기
        const snapshot = await db.collection('searchLogs')
            .where('createdAt', '>=', sevenDaysAgo)
            .get();
        
        // 검색어별 빈도 계산
        const keywordCount = {};
        snapshot.forEach(doc => {
            const keyword = doc.data().keyword;
            if (keyword) {
                keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
            }
        });
        
        // 빈도순으로 정렬하여 상위 10개 추출
        const sortedKeywords = Object.entries(keywordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([text, count], index) => ({
                rank: index + 1,
                text: text,
                count: count
            }));
        
        console.log('✅ 인기 검색어 로드:', sortedKeywords.length, '개');
        return sortedKeywords;
        
    } catch (error) {
        console.error('❌ 인기 검색어 로드 오류:', error);
        return [];
    }
}

// 인기 검색어 토글
async function initSearchToggle() {
    const keywordHeader = document.querySelector('.keyword-header');
    const keywordToggle = document.getElementById('keywordToggle');
    const popularKeywords = document.getElementById('popularKeywords');
    const currentKeyword = document.getElementById('currentKeyword');
    
    // 인기 검색어 로드
    POPULAR_KEYWORDS = await loadPopularKeywords();
    
    // 인기 검색어 목록 업데이트
    if (popularKeywords && POPULAR_KEYWORDS.length > 0) {
        const keywordList = popularKeywords.querySelector('ul');
        if (keywordList) {
            keywordList.innerHTML = POPULAR_KEYWORDS.map(kw => 
                `<li><span class="rank">${kw.rank}</span> ${kw.text}</li>`
            ).join('');
        }
    }
    
    // 토글 버튼 클릭
    if (keywordHeader && keywordToggle) {
        keywordHeader.addEventListener('click', () => {
            popularKeywords.classList.toggle('active');
            keywordToggle.classList.toggle('active');
            
            // 펼쳐지면 자동 슬라이드 중지, 접으면 재시작
            if (popularKeywords.classList.contains('active')) {
                stopKeywordRotation();
            } else {
                startKeywordRotation();
            }
        });
    }
    
    // 검색어 클릭 시 검색
    popularKeywords.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (li) {
            const text = li.textContent.replace(/^\d+\s*/, '').trim();
            performSearch(text);
        }
    });
    
    // 외부 클릭 시 닫기
    document.addEventListener('click', (e) => {
        if (keywordHeader && !keywordHeader.contains(e.target) && !popularKeywords.contains(e.target)) {
            popularKeywords.classList.remove('active');
            keywordToggle.classList.remove('active');
            if (!keywordRotationInterval) {
                startKeywordRotation();
            }
        }
    });
    
    // 자동 슬라이드 시작
    startKeywordRotation();
}

// 키워드 자동 슬라이드 시작
function startKeywordRotation() {
    if (POPULAR_KEYWORDS.length === 0) return;
    
    stopKeywordRotation();
    updateCurrentKeyword();
    keywordRotationInterval = setInterval(() => {
        currentKeywordIndex = (currentKeywordIndex + 1) % POPULAR_KEYWORDS.length;
        updateCurrentKeyword();
    }, 3000); // 3초마다 변경
}

// 키워드 자동 슬라이드 중지
function stopKeywordRotation() {
    if (keywordRotationInterval) {
        clearInterval(keywordRotationInterval);
        keywordRotationInterval = null;
    }
}

// 현재 키워드 업데이트
function updateCurrentKeyword() {
    const currentKeyword = document.getElementById('currentKeyword');
    if (currentKeyword) {
        const keyword = POPULAR_KEYWORDS[currentKeywordIndex];
        currentKeyword.innerHTML = `
            <span class="rank">${keyword.rank}</span>
            <span class="text">${keyword.text}</span>
        `;
    }
}

// 검색 실행
function performSearch(keyword) {
    console.log('검색:', keyword);
    // 검색어 로그 저장
    saveSearchLog(keyword);
    // 검색 결과 페이지로 이동
    window.location.href = `search-results.html?q=${encodeURIComponent(keyword)}`;
}

// 검색 폼 제출
function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput.value.trim();
    
    if (keyword) {
        // 검색어 로그 저장
        saveSearchLog(keyword);
        // 검색 결과 페이지로 이동
        window.location.href = `search-results.html?q=${encodeURIComponent(keyword)}`;
    }
    
    return false;
}

// 슬라이더
let currentSlide = 0;
let slideInterval;

function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;

    // 도트 생성
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        elements.sliderDots.appendChild(dot);
    }

    elements.prevSlide.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
        resetSlideInterval();
    });

    elements.nextSlide.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
        resetSlideInterval();
    });

    startSlideInterval();
}

function goToSlide(n) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dots .dot');
    const totalSlides = slides.length;

    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    currentSlide = (n + totalSlides) % totalSlides;

    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function startSlideInterval() {
    slideInterval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, SLIDE_INTERVAL);
}

function resetSlideInterval() {
    clearInterval(slideInterval);
    startSlideInterval();
}

// 상품 카드 생성
function createProductCard(product, index, type) {
    const badges = product.badge.map(badge => 
        `<span class="badge ${badge}">${badgeLabels[badge]}</span>`
    ).join('');
    
    // Firestore ID 사용
    const productId = product.id;

    return `
        <div class="product-card">
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

// 상품 목록 렌더링
function renderProducts() {
    const hitProducts = document.getElementById('hitProducts');
    const recommendProducts = document.getElementById('recommendProducts');
    const newProducts = document.getElementById('newProducts');
    const popularProducts = document.getElementById('popularProducts');

    if (hitProducts) {
        hitProducts.innerHTML = productsData.hit.map((product, index) => createProductCard(product, index, 'hit')).join('');
    }

    if (recommendProducts) {
        recommendProducts.innerHTML = productsData.recommend.map((product, index) => createProductCard(product, index, 'recommend')).join('');
    }

    if (newProducts) {
        newProducts.innerHTML = productsData.new.map((product, index) => createProductCard(product, index, 'new')).join('');
    }

    if (popularProducts) {
        popularProducts.innerHTML = productsData.popular.map((product, index) => createProductCard(product, index, 'popular')).join('');
    }
}

// 최근 본 상품 관리
function initTodayViewed() {
    // 퀵메뉴 버튼 클릭 시 패널 열기
    if (elements.toggleViewed && elements.viewedPanel) {
        elements.toggleViewed.addEventListener('click', () => {
            elements.viewedPanel.classList.add('active');
            updateViewedList();
        });
    }

    // X 버튼 클릭 시 패널 닫기
    if (elements.viewedPanelClose) {
        elements.viewedPanelClose.addEventListener('click', () => {
            elements.viewedPanel.classList.remove('active');
        });
    }

    // 오버레이 클릭 시 패널 닫기
    if (elements.viewedPanel) {
        const overlay = elements.viewedPanel.querySelector('.viewed-panel-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                elements.viewedPanel.classList.remove('active');
            });
        }
    }

    // 전체삭제 버튼
    if (elements.btnClearAll) {
        elements.btnClearAll.addEventListener('click', () => {
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

// 최근 본 상품 목록 업데이트
function updateViewedList() {
    if (!elements.viewedList) return;

    const viewedProducts = JSON.parse(localStorage.getItem('todayViewedProducts') || '[]');
    
    if (viewedProducts.length === 0) {
        elements.viewedList.innerHTML = '<p class="empty-message">최근 본 상품이 없습니다.</p>';
        return;
    }

    const listHTML = viewedProducts.map(product => `
        <div class="viewed-item" data-product-id="${product.id || ''}" style="cursor: pointer;">
            <img src="${product.image || 'https://via.placeholder.com/80x80'}" alt="${product.name}">
            <div class="viewed-item-info">
                <p>${product.name}</p>
                <span class="price">${product.price ? product.price.toLocaleString() + '원' : ''}</span>
            </div>
        </div>
    `).join('');

    elements.viewedList.innerHTML = listHTML;

    // 클릭 이벤트 추가
    const viewedItems = elements.viewedList.querySelectorAll('.viewed-item');
    viewedItems.forEach(item => {
        item.addEventListener('click', () => {
            const productId = item.getAttribute('data-product-id');
            if (productId) {
                // 패널 닫기
                if (elements.viewedPanel) {
                    elements.viewedPanel.classList.remove('active');
                }
                // 상품 상세 페이지로 이동
                window.location.href = `product-detail.html?id=${productId}`;
            }
        });
    });
}

// 최근 본 상품 개수 업데이트
function updateViewedCount() {
    const viewedProducts = JSON.parse(localStorage.getItem('todayViewedProducts') || '[]');
    const count = viewedProducts.length;

    // 퀵메뉴 뱃지 업데이트
    if (elements.toggleViewed) {
        const countBadge = elements.toggleViewed.querySelector('.count');
        if (countBadge) {
            countBadge.textContent = count;
            countBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // 패널 헤더 뱃지 업데이트
    if (elements.viewedCountBadge) {
        elements.viewedCountBadge.textContent = count;
    }
}

// 상품 상세 페이지에서 최근 본 상품에 추가
function addToTodayViewed(product) {
    if (!product || !product.id) return;

    const viewedProducts = JSON.parse(localStorage.getItem('todayViewedProducts') || '[]');
    
    // 이미 있는 상품 제거 (중복 방지)
    const filtered = viewedProducts.filter(p => p.id !== product.id);
    
    // 최신 상품을 맨 앞에 추가
    filtered.unshift({
        id: product.id,
        name: product.name || '',
        price: product.price || 0,
        image: product.image || ''
    });

    // 최대 20개까지만 저장
    const limited = filtered.slice(0, 20);
    
    localStorage.setItem('todayViewedProducts', JSON.stringify(limited));
    updateViewedCount();
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
        if (e.target.closest('.share-btn')) {
            e.preventDefault();
            alert('공유 기능은 준비 중입니다.');
        }
    });
}

// 공지 배너 닫기
function initNoticeBanner() {
    const noticeBanner = document.getElementById('noticeBanner');
    const closeBanner = document.getElementById('closeBanner');
    const closeToday = document.getElementById('closeToday');
    
    // 로컬스토리지 초기화 (테스트용 - 배너 강제 표시)
    localStorage.removeItem('noticeBannerClosed');
    localStorage.removeItem('noticeBannerClosedDate');
    
    // 로컬스토리지에서 배너 닫힘 상태 확인
    const bannerClosed = localStorage.getItem('noticeBannerClosed');
    const bannerClosedDate = localStorage.getItem('noticeBannerClosedDate');
    const today = new Date().toDateString();
    
    // 영구 닫힘이거나 오늘 닫힌 경우
    if (bannerClosed === 'true' || bannerClosedDate === today) {
        noticeBanner.style.display = 'none';
    }
    
    // X 버튼 - 영구 닫기
    if (closeBanner) {
        closeBanner.addEventListener('click', () => {
            noticeBanner.style.display = 'none';
            localStorage.setItem('noticeBannerClosed', 'true');
        });
    }
    
    // 오늘 하루 그만보기 - 오늘만 닫기
    if (closeToday) {
        closeToday.addEventListener('click', () => {
            noticeBanner.style.display = 'none';
            localStorage.setItem('noticeBannerClosedDate', today);
        });
    }
}

// 초기화
function init() {
    initNoticeBanner();
    initCategorySidebar();
    initSearchToggle();
    initSlider();
    renderProducts();
    initTodayViewed();
    initScrollHeader();
    initShareButtons();
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
        const firestoreProducts = {
            hit: [],
            recommend: [],
            new: [],
            popular: [],
            all: []
        };

        allProducts.forEach(productDoc => {
            const product = productDoc;
            const productItem = {
                id: product.id,
                title: product.name,
                option: product.shortDesc || '',
                support: `${(product.price * (product.supportRate || 5) / 100).toLocaleString()}원`,
                badge: [],
                image: product.mainImageUrl || product.imageUrl || 'https://placehold.co/300x300/E0E0E0/999?text=No+Image'
            };

            // 분류에 따라 배치 (배열 처리)
            const displayCategories = Array.isArray(product.displayCategory) 
                ? product.displayCategory 
                : [product.displayCategory || 'all'];
            
            // 각 분류에 상품 추가
            displayCategories.forEach(category => {
                if (category === 'all' || category === 'hit') {
                    if (!productItem.badge.includes('hit')) {
                        productItem.badge.push('hit');
                    }
                    if (!firestoreProducts.hit.find(p => p.id === productItem.id)) {
                        firestoreProducts.hit.push({...productItem});
                    }
                }
                if (category === 'all' || category === 'recommend') {
                    if (!productItem.badge.includes('recommend')) {
                        productItem.badge.push('recommend');
                    }
                    if (!firestoreProducts.recommend.find(p => p.id === productItem.id)) {
                        firestoreProducts.recommend.push({...productItem});
                    }
                }
                if (category === 'all' || category === 'new') {
                    if (!productItem.badge.includes('new')) {
                        productItem.badge.push('new');
                    }
                    if (!firestoreProducts.new.find(p => p.id === productItem.id)) {
                        firestoreProducts.new.push({...productItem});
                    }
                }
                if (category === 'all' || category === 'popular') {
                    if (!productItem.badge.includes('popular')) {
                        productItem.badge.push('popular');
                    }
                    if (!firestoreProducts.popular.find(p => p.id === productItem.id)) {
                        firestoreProducts.popular.push({...productItem});
                    }
                }
            });

            if (!firestoreProducts.all.find(p => p.id === productItem.id)) {
                firestoreProducts.all.push(productItem);
            }
        });

        // 기존 데이터를 Firestore 데이터로 교체
        Object.assign(productsData, firestoreProducts);
        
        console.log('✅ Firestore에서 상품 데이터를 성공적으로 불러왔습니다:', firestoreProducts);

        // 상품 렌더링 다시 실행
        renderProducts();

    } catch (error) {
        console.error('❌ Firestore 상품 로드 오류:', error);
        console.log('기본 데이터를 사용합니다.');
    }
}

// 카테고리 메뉴 동적 로드
async function loadCategoriesMenu() {
    try {
        if (!firebase || !firebase.firestore) {
            console.log('Firebase가 아직 초기화되지 않았습니다.');
            return;
        }

        const db = firebase.firestore();
        
        // 모든 카테고리 가져오기 (클라이언트에서 필터링)
        const snapshot = await db.collection('categories').get();

        const categories = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // isHidden이 true가 아닌 카테고리만 추가
            if (data.isHidden !== true) {
                categories.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        // sortOrder로 정렬
        categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        console.log('✅ 카테고리 로드 완료:', categories.length, '개');
        console.log('카테고리 데이터:', categories);

        // 카테고리 트리 구조 생성
        const categoryTree = buildCategoryTree(categories);
        
        console.log('✅ 카테고리 트리 생성 완료:', categoryTree);
        
        // HTML 렌더링
        const categoryList = document.getElementById('categoryList');
        if (categoryList) {
            categoryList.innerHTML = renderCategoryMenu(categoryTree);
            console.log('✅ 카테고리 메뉴 렌더링 완료');
        }

    } catch (error) {
        console.error('❌ 카테고리 로드 오류:', error);
        console.error('오류 상세:', error.message, error.stack);
        // 오류 발생 시 빈 상태 표시
        const categoryList = document.getElementById('categoryList');
        if (categoryList) {
            categoryList.innerHTML = '<li><a href="#">카테고리 로드 중 오류가 발생했습니다.</a></li>';
        }
    }
}

// 카테고리 트리 구조 생성
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

// 카테고리 메뉴 HTML 렌더링
function renderCategoryMenu(categoryTree) {
    if (!categoryTree || categoryTree.length === 0) {
        return '<li><a href="#">등록된 카테고리가 없습니다.</a></li>';
    }

    let html = '';
    
    categoryTree.forEach(cat1 => {
        const hasChildren = cat1.children && cat1.children.length > 0;
        
        html += `<li${hasChildren ? ' class="has-submenu"' : ''}>`;
        
        if (hasChildren) {
            // 하위 카테고리가 있으면 클릭으로 펼치기
            html += `<a href="#" onclick="toggleSubmenu(event, this)">${cat1.name}</a>`;
        } else {
            // 하위 카테고리가 없으면 링크로 이동
            html += `<a href="products-list.html?category=${cat1.id}">${cat1.name}</a>`;
        }
        
        if (hasChildren) {
            html += '<ul class="submenu">';
            
            cat1.children.forEach(cat2 => {
                const hasGrandChildren = cat2.children && cat2.children.length > 0;
                
                html += `<li${hasGrandChildren ? ' class="has-submenu"' : ''}>`;
                
                if (hasGrandChildren) {
                    // 3차 카테고리가 있으면 클릭으로 펼치기
                    html += `<a href="#" onclick="toggleSubmenu(event, this)">${cat2.name}</a>`;
                } else {
                    // 3차 카테고리가 없으면 링크로 이동
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

// 서브메뉴 토글 함수
function toggleSubmenu(event, element) {
    event.preventDefault();
    event.stopPropagation();
    
    const parentLi = element.parentElement;
    const isActive = parentLi.classList.contains('active');
    
    // 같은 레벨의 다른 메뉴 닫기
    const siblings = Array.from(parentLi.parentElement.children);
    siblings.forEach(sibling => {
        if (sibling !== parentLi) {
            sibling.classList.remove('active');
            // 하위 메뉴도 모두 닫기
            const subMenus = sibling.querySelectorAll('.has-submenu');
            subMenus.forEach(sub => sub.classList.remove('active'));
        }
    });
    
    // 현재 메뉴 토글
    if (isActive) {
        parentLi.classList.remove('active');
        // 하위 메뉴도 모두 닫기
        const subMenus = parentLi.querySelectorAll('.has-submenu');
        subMenus.forEach(sub => sub.classList.remove('active'));
    } else {
        parentLi.classList.add('active');
    }
}

// 전역 함수로 노출
window.toggleSubmenu = toggleSubmenu;

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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        init();
        // Firebase 초기화 대기 후 상품 및 카테고리 로드
        try {
            await waitForFirebase();
            await loadCategoriesMenu();
            await loadProductsFromFirestore();
        } catch (error) {
            console.error('초기화 오류:', error);
        }
    });
} else {
    init();
    waitForFirebase().then(async () => {
        await loadCategoriesMenu();
        await loadProductsFromFirestore();
    }).catch(error => {
        console.error('초기화 오류:', error);
    });
}

