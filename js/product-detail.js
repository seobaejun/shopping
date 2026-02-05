// 상품 상세 페이지 전용 JavaScript

// 모든 상품 데이터 (script.js와 동일)
const allProductsData = {
    hit: [
        { title: '제주도 노지 조생귤 5kg', option: '중과 (S-M)', price: 28000, image: 'https://placehold.co/600x600/FFA726/FFF?text=제주귤&font=nanum-gothic' },
        { title: '이앤위즈 원홀 무전원 우드스피커', option: '', price: 35000, image: 'https://placehold.co/600x600/78909C/FFF?text=스피커&font=nanum-gothic' },
        { title: '시치미쓱 프리미엄 데일리물티슈 100매 * 10팩', option: '', price: 18000, image: 'https://placehold.co/600x600/81C784/FFF?text=물티슈&font=nanum-gothic' },
        { title: '셀비엔 괄사 마사지 리프팅 앰플 스틱 15ml', option: '', price: 25000, image: 'https://placehold.co/600x600/FF8A80/FFF?text=앰플&font=nanum-gothic' },
        { title: '셀비엔 블래미쉬 크림 & 블랙스팟 패치 기미세트', option: '', price: 42000, image: 'https://placehold.co/600x600/FFB74D/FFF?text=크림세트&font=nanum-gothic' },
        { title: '감홍사과 산지직송 고당도 문경 꿀사과 가정용 3kg', option: '가정용 못난이', price: 32000, image: 'https://placehold.co/600x600/EF5350/FFF?text=사과&font=nanum-gothic' },
        { title: '롯데 스퀘어 다이얼 에어프라이어 7L 민트', option: '', price: 89000, image: 'https://placehold.co/600x600/4FC3F7/FFF?text=에어프라이어&font=nanum-gothic' },
        { title: '정관장 홍삼보윤정 데일리스틱 10ml x 30포', option: '', price: 65000, image: 'https://placehold.co/600x600/A1887F/FFF?text=홍삼&font=nanum-gothic' }
    ],
    recommend: [
        { title: '페티피 드라이룸 강아지집 자동온도조절 난방 살균', option: '', price: 150000, image: 'https://placehold.co/600x600/BA68C8/FFF?text=강아지집&font=nanum-gothic' },
        { title: '닥터포밸런스 견활력 애견영양간식', option: '30개입', price: 25000, image: 'https://placehold.co/600x600/FFD54F/333?text=영양간식&font=nanum-gothic' },
        { title: '꿈꾸는 미니가습기 화이트 핑크 랜덤', option: '', price: 15000, image: 'https://placehold.co/600x600/64B5F6/FFF?text=가습기&font=nanum-gothic' },
        { title: '극세사 양털 입는 무릎담요 블루', option: '', price: 12000, image: 'https://placehold.co/600x600/4DB6AC/FFF?text=담요&font=nanum-gothic' },
        { title: '클립 자바라 스탠드 화이트(전구색)', option: '', price: 18000, image: 'https://placehold.co/600x600/FFB300/FFF?text=스탠드&font=nanum-gothic' },
        { title: '닥터유 단백질바 50gx12ea', option: '', price: 24000, image: 'https://placehold.co/600x600/E91E63/FFF?text=단백질바&font=nanum-gothic' },
        { title: '키밍 스카치 스포츠 암밴드 그레이', option: '', price: 9000, image: 'https://placehold.co/600x600/9C27B0/FFF?text=암밴드&font=nanum-gothic' },
        { title: '넛츠앤 오너 31호 525베리 데일리 하루너츠 선물세트', option: '', price: 35000, image: 'https://placehold.co/600x600/FF5722/FFF?text=선물세트&font=nanum-gothic' }
    ],
    new: [
        { title: '홈스타일 미니멀 고밀도 러그 카펫 140x200', option: '', price: 45000, image: 'https://placehold.co/600x600/8BC34A/FFF?text=러그&font=nanum-gothic' },
        { title: '쿠션 목베개 인형 옐로우고양이', option: '', price: 8000, image: 'https://placehold.co/600x600/CDDC39/333?text=목베개&font=nanum-gothic' },
        { title: '자이리톨 대추방울토마토 1kg', option: '', price: 12000, image: 'https://placehold.co/600x600/FF5252/FFF?text=토마토&font=nanum-gothic' },
        { title: '네추럴라이즈 간건강 활력 밀크씨슬 800mg x 180정', option: '', price: 28000, image: 'https://placehold.co/600x600/4CAF50/FFF?text=밀크씨슬&font=nanum-gothic' },
        { title: '네추럴라이즈 비타민C & 아연 꾸미 150g', option: '', price: 22000, image: 'https://placehold.co/600x600/FFC107/333?text=비타민C&font=nanum-gothic' },
        { title: '네추럴라이즈 칼슘 & 비타민D 꾸미 150g', option: '', price: 22000, image: 'https://placehold.co/600x600/FF9800/FFF?text=칼슘&font=nanum-gothic' },
        { title: '네추럴라이즈 멀티비타민 꾸미 150g', option: '', price: 22000, image: 'https://placehold.co/600x600/FF6F00/FFF?text=멀티비타민&font=nanum-gothic' },
        { title: '뮤토 소프트 자카드 블랭킷', option: '', price: 38000, image: 'https://placehold.co/600x600/42A5F5/FFF?text=블랭킷&font=nanum-gothic' },
        { title: '[타가] 아토 크림밤 50ml', option: '', price: 15000, image: 'https://placehold.co/600x600/26C6DA/FFF?text=크림밤&font=nanum-gothic' }
    ],
    popular: [
        { title: '더담은 일키로 오리윙 1kg', option: '', price: 22000, image: 'https://placehold.co/600x600/AB47BC/FFF?text=오리윙&font=nanum-gothic' },
        { title: '더담은 일키로 고구마치킨 1kg', option: '', price: 22000, image: 'https://placehold.co/600x600/8E24AA/FFF?text=고구마치킨&font=nanum-gothic' },
        { title: '1000피스 직소퍼즐 모네의 정원', option: '', price: 15000, image: 'https://placehold.co/600x600/7E57C2/FFF?text=퍼즐&font=nanum-gothic' },
        { title: '셀비엔 블래미쉬 크림 & 블랙스팟 패치 기미세트', option: '', price: 42000, image: 'https://placehold.co/600x600/FFB74D/FFF?text=크림세트&font=nanum-gothic' },
        { title: '독스플레이 펫TV 펫캠', option: '', price: 280000, image: 'https://placehold.co/600x600/5C6BC0/FFF?text=펫캠&font=nanum-gothic' },
        { title: '정관장 홍삼본정 데일리스틱 10ml x 30포', option: '', price: 68000, image: 'https://placehold.co/600x600/8D6E63/FFF?text=홍삼본정&font=nanum-gothic' },
        { title: '포천이동갈비 1.1kg 꽃갈비 (6대)', option: '', price: 45000, image: 'https://placehold.co/600x600/D32F2F/FFF?text=갈비&font=nanum-gothic' },
        { title: '과일 큐브 치즈 8가지맛 24구 80g x 2ea', option: '', price: 18000, image: 'https://placehold.co/600x600/FDD835/333?text=치즈&font=nanum-gothic' }
    ]
};

// URL에서 상품 ID 가져오기
function getProductFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        const [type, index] = productId.split('_');
        const productList = allProductsData[type];
        
        if (productList && productList[index]) {
            const product = productList[index];
            return {
                id: productId,
                name: product.title,
                option: product.option,
                price: product.price,
                image: product.image
            };
        }
    }
    
    // 기본값 (첫 번째 상품)
    return {
        id: 'hit_0',
        name: '제주도 노지 조생귤 5kg',
        option: '중과 (S-M)',
        price: 28000,
        image: 'https://placehold.co/600x600/FFA726/FFF?text=제주귤+5kg&font=nanum-gothic'
    };
}

// 상품 정보
const PRODUCT_INFO = getProductFromUrl();

// DOM 요소
const productDetailElements = {
    mainImage: document.getElementById('mainImage'),
    thumbnails: document.querySelectorAll('.thumbnail-images img'),
    productOption: document.getElementById('productOption'),
    selectedOptions: document.getElementById('selectedOptions'),
    totalPrice: document.getElementById('totalPrice'),
    cartModal: document.getElementById('cartModal'),
    continueBtn: document.getElementById('continueBtn'),
    goCartBtn: document.getElementById('goCartBtn'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content')
};

// 썸네일 이미지 클릭 이벤트
function initThumbnailClick() {
    productDetailElements.thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => {
            // 활성 상태 변경
            productDetailElements.thumbnails.forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
            
            // 메인 이미지 변경
            productDetailElements.mainImage.src = thumbnail.src.replace('100x100', '600x600');
        });
    });
}

// 옵션 선택
let selectedOptionsData = [];

function initOptionSelect() {
    productDetailElements.productOption.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        
        if (!selectedValue) return;
        
        // 이미 선택된 옵션인지 확인
        const exists = selectedOptionsData.find(opt => opt.value === selectedValue);
        if (exists) {
            alert('이미 선택된 옵션입니다.');
            e.target.selectedIndex = 0;
            return;
        }
        
        // 새 옵션 추가
        const newOption = {
            value: selectedValue,
            name: e.target.options[e.target.selectedIndex].text,
            quantity: 1,
            price: PRODUCT_INFO.price
        };
        
        selectedOptionsData.push(newOption);
        e.target.selectedIndex = 0;
        
        renderSelectedOptions();
        updateTotalPrice();
    });
}

// 선택된 옵션 렌더링
function renderSelectedOptions() {
    if (selectedOptionsData.length === 0) {
        productDetailElements.selectedOptions.innerHTML = '';
        return;
    }
    
    const html = selectedOptionsData.map((option, index) => `
        <div class="selected-option-item">
            <div class="option-header">
                <span class="option-name">${option.name}</span>
                <button class="remove-option" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="option-controls">
                <div class="quantity-control">
                    <button class="qty-minus" data-index="${index}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" value="${option.quantity}" min="1" readonly>
                    <button class="qty-plus" data-index="${index}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <span class="option-price">${formatPrice(option.price * option.quantity)}원</span>
            </div>
        </div>
    `).join('');
    
    productDetailElements.selectedOptions.innerHTML = html;
    
    // 이벤트 리스너 추가
    attachOptionEventListeners();
}

// 옵션 이벤트 리스너
function attachOptionEventListeners() {
    // 제거 버튼
    document.querySelectorAll('.remove-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            selectedOptionsData.splice(index, 1);
            renderSelectedOptions();
            updateTotalPrice();
        });
    });
    
    // 수량 감소
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            if (selectedOptionsData[index].quantity > 1) {
                selectedOptionsData[index].quantity--;
                renderSelectedOptions();
                updateTotalPrice();
            }
        });
    });
    
    // 수량 증가
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            selectedOptionsData[index].quantity++;
            renderSelectedOptions();
            updateTotalPrice();
        });
    });
}

// 총 가격 업데이트
function updateTotalPrice() {
    const total = selectedOptionsData.reduce((sum, option) => {
        return sum + (option.price * option.quantity);
    }, 0);
    
    productDetailElements.totalPrice.textContent = formatPrice(total) + '원';
}

// 가격 포맷팅
function formatPrice(price) {
    return price.toLocaleString('ko-KR');
}

// 장바구니 담기
function initCartActions() {
    const cartBtns = document.querySelectorAll('.btn-cart');
    
    cartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (selectedOptionsData.length === 0) {
                alert('옵션을 선택해주세요.');
                return;
            }
            
            // 장바구니에 담기 (로컬스토리지 활용)
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            
            selectedOptionsData.forEach(option => {
                cart.push({
                    productId: PRODUCT_INFO.id,
                    productName: PRODUCT_INFO.name,
                    optionName: option.name,
                    quantity: option.quantity,
                    price: option.price,
                    image: PRODUCT_INFO.image
                });
            });
            
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // 모달 표시
            productDetailElements.cartModal.classList.add('active');
        });
    });
}

// 바로구매
function initBuyActions() {
    const buyBtns = document.querySelectorAll('.btn-buy, .btn-buy-fixed');
    
    buyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (selectedOptionsData.length === 0) {
                alert('옵션을 선택해주세요.');
                return;
            }
            
            alert('바로구매 기능은 준비 중입니다.');
        });
    });
}

// 관심상품
function initWishlistActions() {
    const wishlistBtns = document.querySelectorAll('.btn-wishlist');
    let isWishlisted = false;
    
    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            isWishlisted = !isWishlisted;
            
            if (isWishlisted) {
                btn.innerHTML = '<i class="fas fa-heart"></i> 관심상품';
                btn.style.color = 'var(--danger-color)';
                btn.style.borderColor = 'var(--danger-color)';
            } else {
                btn.innerHTML = '<i class="far fa-heart"></i> 관심상품';
                btn.style.color = '';
                btn.style.borderColor = '';
            }
        });
    });
}

// 장바구니 모달
function initCartModal() {
    productDetailElements.continueBtn.addEventListener('click', () => {
        productDetailElements.cartModal.classList.remove('active');
        
        // 선택 옵션 초기화
        selectedOptionsData = [];
        renderSelectedOptions();
        updateTotalPrice();
    });
    
    productDetailElements.goCartBtn.addEventListener('click', () => {
        // 장바구니 페이지로 이동
        alert('장바구니 페이지로 이동합니다.');
        // window.location.href = 'cart.html';
    });
    
    // 배경 클릭 시 닫기
    productDetailElements.cartModal.addEventListener('click', (e) => {
        if (e.target === productDetailElements.cartModal) {
            productDetailElements.cartModal.classList.remove('active');
        }
    });
}

// 탭 전환
function initTabs() {
    productDetailElements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // 모든 탭 버튼 비활성화
            productDetailElements.tabBtns.forEach(b => b.classList.remove('active'));
            // 현재 탭 버튼 활성화
            btn.classList.add('active');
            
            // 모든 탭 컨텐츠 숨기기
            productDetailElements.tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // 선택한 탭 컨텐츠 표시
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// 확대보기
function initZoom() {
    const zoomBtn = document.querySelector('.zoom-btn');
    
    zoomBtn.addEventListener('click', () => {
        const mainImage = productDetailElements.mainImage;
        
        // 새 창에서 이미지 열기
        const newWindow = window.open('', '_blank', 'width=800,height=800');
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>이미지 확대보기</title>
                <style>
                    body { margin: 0; padding: 20px; background: #000; display: flex; align-items: center; justify-content: center; }
                    img { max-width: 100%; height: auto; }
                </style>
            </head>
            <body>
                <img src="${mainImage.src}" alt="확대 이미지">
            </body>
            </html>
        `);
    });
}

// 공유하기
function initShareButtons() {
    const shareBtns = document.querySelectorAll('.share-buttons .share-btn');
    
    shareBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const icons = ['facebook-f', 'twitter', 'line', 'link'];
            const icon = icons[index];
            
            switch(icon) {
                case 'facebook-f':
                    alert('페이스북 공유 기능은 준비 중입니다.');
                    break;
                case 'twitter':
                    alert('트위터 공유 기능은 준비 중입니다.');
                    break;
                case 'line':
                    alert('라인 공유 기능은 준비 중입니다.');
                    break;
                case 'link':
                    // URL 복사
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        alert('링크가 복사되었습니다.');
                    });
                    break;
            }
        });
    });
}

// 리뷰/문의 작성 버튼
function initWriteButtons() {
    const writeBtns = document.querySelectorAll('.btn-write');
    
    writeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const parentId = btn.closest('.tab-content').id;
            
            if (parentId === 'review') {
                alert('사용후기 작성 페이지로 이동합니다.');
            } else if (parentId === 'qna') {
                alert('상품문의 작성 페이지로 이동합니다.');
            }
        });
    });
}

// 상품설명 더보기
function initMoreDescription() {
    const moreBtn = document.querySelector('.btn-more-desc');
    
    if (moreBtn) {
        moreBtn.addEventListener('click', () => {
            alert('상품설명 전체보기 기능은 준비 중입니다.');
        });
    }
}

// 홈으로 버튼
function initHomeButton() {
    const homeBtns = document.querySelectorAll('.btn-home');
    
    homeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    });
}

// 최근 본 상품 관리 (product-detail.js용)
function initTodayViewedDetail() {
    // 최근 본 상품에 현재 상품 추가
    if (PRODUCT_INFO && PRODUCT_INFO.id) {
        addToTodayViewed({
            id: PRODUCT_INFO.id,
            name: PRODUCT_INFO.name,
            price: PRODUCT_INFO.price,
            image: PRODUCT_INFO.image
        });
    }

    // 퀵메뉴 버튼 클릭 시 패널 열기
    const toggleViewed = document.getElementById('toggleViewed');
    const viewedPanel = document.getElementById('viewedPanel');
    
    if (toggleViewed && viewedPanel) {
        toggleViewed.addEventListener('click', () => {
            viewedPanel.classList.add('active');
            updateViewedListDetail();
        });
    }

    // X 버튼 클릭 시 패널 닫기
    const viewedPanelClose = document.getElementById('viewedPanelClose');
    if (viewedPanelClose && viewedPanel) {
        viewedPanelClose.addEventListener('click', () => {
            viewedPanel.classList.remove('active');
        });
    }

    // 오버레이 클릭 시 패널 닫기
    if (viewedPanel) {
        const overlay = viewedPanel.querySelector('.viewed-panel-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                viewedPanel.classList.remove('active');
            });
        }
    }

    // 전체삭제 버튼
    const btnClearAll = document.getElementById('btnClearAll');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            if (confirm('최근 본 상품을 모두 삭제하시겠습니까?')) {
                localStorage.removeItem('todayViewedProducts');
                updateViewedListDetail();
                updateViewedCountDetail();
            }
        });
    }

    // 초기 목록 업데이트
    updateViewedCountDetail();
}

// 최근 본 상품 목록 업데이트 (product-detail.js용)
function updateViewedListDetail() {
    const viewedList = document.getElementById('viewedList');
    if (!viewedList) return;

    const viewedProducts = JSON.parse(localStorage.getItem('todayViewedProducts') || '[]');
    
    if (viewedProducts.length === 0) {
        viewedList.innerHTML = '<p class="empty-message">최근 본 상품이 없습니다.</p>';
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

    viewedList.innerHTML = listHTML;

    // 클릭 이벤트 추가
    const viewedItems = viewedList.querySelectorAll('.viewed-item');
    viewedItems.forEach(item => {
        item.addEventListener('click', () => {
            const productId = item.getAttribute('data-product-id');
            if (productId) {
                // 패널 닫기
                const viewedPanel = document.getElementById('viewedPanel');
                if (viewedPanel) {
                    viewedPanel.classList.remove('active');
                }
                // 상품 상세 페이지로 이동
                window.location.href = `product-detail.html?id=${productId}`;
            }
        });
    });
}

// 최근 본 상품 개수 업데이트 (product-detail.js용)
function updateViewedCountDetail() {
    const viewedProducts = JSON.parse(localStorage.getItem('todayViewedProducts') || '[]');
    const count = viewedProducts.length;

    // 퀵메뉴 뱃지 업데이트
    const toggleViewed = document.getElementById('toggleViewed');
    if (toggleViewed) {
        const countBadge = toggleViewed.querySelector('.count');
        if (countBadge) {
            countBadge.textContent = count;
            countBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // 패널 헤더 뱃지 업데이트
    const viewedCountBadge = document.getElementById('viewedCountBadge');
    if (viewedCountBadge) {
        viewedCountBadge.textContent = count;
    }
}

// 최근 본 상품에 추가 (product-detail.js용)
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
    updateViewedCountDetail();
}

// 페이지 정보 업데이트
function updatePageInfo() {
    console.log('🔄 상품 정보 업데이트:', PRODUCT_INFO);
    
    // 상품명 업데이트 (제목)
    const productTitle = document.querySelector('.product-title');
    if (productTitle) {
        productTitle.textContent = PRODUCT_INFO.name;
        console.log('✅ 제목 업데이트:', PRODUCT_INFO.name);
    }
    
    // 부제목(옵션) 업데이트
    const productSubtitle = document.getElementById('productSubtitle');
    if (productSubtitle) {
        productSubtitle.textContent = PRODUCT_INFO.option || '단일 상품';
        console.log('✅ 부제목 업데이트:', PRODUCT_INFO.option);
    }
    
    // 브레드크럼 업데이트
    const breadcrumbProduct = document.querySelector('.breadcrumb li:last-child');
    if (breadcrumbProduct) {
        breadcrumbProduct.textContent = PRODUCT_INFO.name;
    }
    
    // 메인 이미지 업데이트
    const mainImage = productDetailElements.mainImage;
    if (mainImage) {
        mainImage.src = PRODUCT_INFO.image;
        mainImage.alt = PRODUCT_INFO.name;
        console.log('✅ 메인 이미지 업데이트:', PRODUCT_INFO.image);
    }
    
    // 썸네일 이미지 업데이트
    const thumbnails = productDetailElements.thumbnails;
    if (thumbnails.length > 0) {
        const thumbnailImage = PRODUCT_INFO.image.replace('600x600', '100x100');
        
        thumbnails[0].src = thumbnailImage;
        thumbnails[0].classList.add('active');
        
        // 나머지 썸네일도 같은 이미지로 (다른 뷰 시뮬레이션)
        for (let i = 1; i < thumbnails.length; i++) {
            thumbnails[i].src = thumbnailImage;
        }
        
        console.log('✅ 썸네일 업데이트 완료');
    }
    
    // 옵션 선택 박스 업데이트
    const optionSelect = productDetailElements.productOption;
    if (optionSelect) {
        const optionText = PRODUCT_INFO.option 
            ? `${PRODUCT_INFO.name} - ${PRODUCT_INFO.option}` 
            : PRODUCT_INFO.name;
        const priceText = PRODUCT_INFO.price.toLocaleString() + '원';
        
        // 두 번째 옵션(실제 상품) 업데이트
        if (optionSelect.children.length > 1) {
            optionSelect.children[1].textContent = `${optionText} - ${priceText}`;
            optionSelect.children[1].value = optionText;
        } else {
            // 옵션이 없으면 추가
            const option = document.createElement('option');
            option.value = optionText;
            option.textContent = `${optionText} - ${priceText}`;
            optionSelect.appendChild(option);
        }
        
        console.log('✅ 옵션 선택 박스 업데이트');
    }
    
    // 페이지 제목 업데이트
    document.title = PRODUCT_INFO.name + ' - 10쇼핑게임';
    
    console.log('✅ 페이지 정보 업데이트 완료!');
}

// 초기화
function initProductDetail() {
    updatePageInfo();
    initThumbnailClick();
    initOptionSelect();
    initCartActions();
    initBuyActions();
    initWishlistActions();
    initCartModal();
    initTabs();
    initZoom();
    initShareButtons();
    initWriteButtons();
    initMoreDescription();
    initHomeButton();
    initTodayViewedDetail();
}

// DOM 로드 완료 시 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductDetail);
} else {
    initProductDetail();
}

