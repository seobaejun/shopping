// 상품 상세 페이지 전용 JavaScript

var PRODUCT_DETAIL_FIREBASE_READY = false;

function _parseProductDoc(doc) {
    var product = doc.data();
    var options = [];
    if (Array.isArray(product.options) && product.options.length > 0) {
        product.options.forEach(function (o) {
            options.push({
                label: (o.label || o.name || '').trim() || '옵션',
                price: o.price != null ? Number(o.price) : 0
            });
        });
    }
    return {
        id: doc.id,
        name: product.name || '',
        option: product.shortDesc || '',
        price: product.price != null ? Number(product.price) : 0,
        originalPrice: product.originalPrice != null ? Number(product.originalPrice) : 0,
        image: product.mainImageUrl || product.imageUrl || 'https://placehold.co/600x600/E0E0E0/999?text=No+Image',
        detailImages: product.detailImageUrls || product.detailImages || [],
        description: product.description || '',
        details: product.details || [],
        category: product.category || '',
        brand: product.brand || '',
        stock: product.stock != null ? Number(product.stock) : 0,
        supportRate: product.supportRate != null ? Number(product.supportRate) : 5,
        options: options
    };
}

// URL에서 상품 ID 가져오기 및 Firestore에서 로드
async function getProductFromUrl() {
    var urlParams = new URLSearchParams(window.location.search);
    var productId = urlParams.get('id');
    
    console.log('📌 URL 상품 ID:', productId);
    
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.warn('⏳ Firestore 미준비, 대기 후 재시도');
        await new Promise(function (resolve) {
            var attempts = 0;
            var t = setInterval(function () {
                attempts++;
                if (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0) {
                    clearInterval(t);
                    resolve();
                }
                if (attempts > 50) {
                    clearInterval(t);
                    resolve();
                }
            }, 100);
        });
    }
    
    if (productId && typeof firebase !== 'undefined' && firebase.firestore) {
        try {
            var db = firebase.firestore();
            var doc = await db.collection('products').doc(productId).get();
            
            if (doc.exists) {
                console.log('✅ Firestore에서 상품 로드:', doc.id);
                return _parseProductDoc(doc);
            }
            console.warn('⚠️ Firestore에 해당 상품이 없습니다:', productId);
        } catch (error) {
            console.error('❌ Firestore에서 상품 로드 오류:', error);
        }
    }
    
    // URL에 id가 없거나 문서가 없을 때: 첫 번째 상품으로 폴백 시도
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
            var db = firebase.firestore();
            var snapshot = await db.collection('products').limit(1).get();
            if (!snapshot.empty) {
                var firstDoc = snapshot.docs[0];
                console.log('✅ 첫 번째 상품으로 표시:', firstDoc.id);
                if (!productId) {
                    window.history.replaceState({}, '', 'product-detail.html?id=' + firstDoc.id);
                }
                return _parseProductDoc(firstDoc);
            }
        } catch (e) {
            console.warn('첫 상품 폴백 실패:', e);
        }
    }
    
    return {
        id: null,
        name: '상품을 불러올 수 없습니다',
        option: '',
        price: 0,
        originalPrice: 0,
        image: 'https://placehold.co/600x600/E0E0E0/999?text=No+Product',
        detailImages: [],
        description: '',
        details: [],
        category: '',
        brand: '',
        stock: 0,
        supportRate: 5
    };
}

// 상품 정보 (비동기로 로드)
let PRODUCT_INFO = null;

// 카테고리 ID → 이름 맵 (상품의 category 필드는 Firestore 카테고리 문서 ID)
let _categoryNameMap = null;
async function getCategoryNameMap() {
    if (_categoryNameMap) return _categoryNameMap;
    if (typeof firebase === 'undefined' || !firebase.firestore) return new Map();
    try {
        const snapshot = await firebase.firestore().collection('categories').get();
        const map = new Map();
        snapshot.forEach(doc => {
            const data = doc.data();
            const name = (data.name != null && String(data.name).trim() !== '')
                ? String(data.name).trim()
                : ((data.categoryName != null && String(data.categoryName).trim() !== '')
                    ? String(data.categoryName).trim()
                    : ((data.title != null && String(data.title).trim() !== '')
                        ? String(data.title).trim()
                        : doc.id));
            map.set(doc.id, name);
        });
        _categoryNameMap = map;
        return map;
    } catch (e) {
        console.warn('카테고리 목록 로드 실패:', e);
        return new Map();
    }
}

// DOM 요소
const productDetailElements = {
    mainImage: document.getElementById('mainImage'),
    productOption: document.getElementById('productOption'),
    selectedOptions: document.getElementById('selectedOptions'),
    totalPrice: document.getElementById('totalPrice'),
    cartModal: document.getElementById('cartModal'),
    continueBtn: document.getElementById('continueBtn'),
    goCartBtn: document.getElementById('goCartBtn'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    categoryTag: document.getElementById('categoryTag'),
    supportAmount: document.getElementById('supportAmount'),
    productInfoTable: document.getElementById('productInfoTable'),
    buyNowDeliveryModal: document.getElementById('buyNowDeliveryModal'),
    buyNowDeliveryModalClose: document.getElementById('buyNowDeliveryModalClose'),
    buyNowDeliveryCancel: document.getElementById('buyNowDeliveryCancel'),
    buyNowDeliverySubmit: document.getElementById('buyNowDeliverySubmit'),
    deliveryOptionProfileSummary: document.getElementById('deliveryOptionProfileSummary'),
    deliveryOptionDefaultSummary: document.getElementById('deliveryOptionDefaultSummary'),
    deliveryNewForm: document.getElementById('deliveryNewForm')
};

// 썸네일 이미지 클릭 이벤트 (제거됨 - 더이상 썸네일 없음)
function initThumbnailClick() {
    // 썸네일 기능 제거
}

// 옵션 선택
let selectedOptionsData = [];

function initOptionSelect() {
    if (!productDetailElements.productOption) return;
    productDetailElements.productOption.addEventListener('change', function (e) {
        var selectedOpt = e.target.options[e.target.selectedIndex];
        var selectedValue = e.target.value;
        if (!selectedValue) return;
        var exists = selectedOptionsData.some(function (opt) { return opt.value === selectedValue; });
        if (exists) {
            alert('이미 선택된 옵션입니다.');
            e.target.selectedIndex = 0;
            return;
        }
        var price = selectedOpt.getAttribute('data-price') != null ? parseInt(selectedOpt.getAttribute('data-price'), 10) : (PRODUCT_INFO && PRODUCT_INFO.price) || 0;
        var label = selectedOpt.getAttribute('data-label') || selectedOpt.textContent;
        var newOption = {
            value: selectedValue,
            name: label + ' - ' + price.toLocaleString('ko-KR') + '원',
            quantity: 1,
            price: price
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

// 총 가격 업데이트 (선택 옵션 합계 또는 상품 기본가)
function updateTotalPrice() {
    var total;
    if (selectedOptionsData.length > 0) {
        total = selectedOptionsData.reduce(function (sum, option) {
            return sum + (option.price * option.quantity);
        }, 0);
    } else {
        total = (PRODUCT_INFO && PRODUCT_INFO.price != null) ? PRODUCT_INFO.price : 0;
    }
    if (productDetailElements.totalPrice) {
        productDetailElements.totalPrice.textContent = formatPrice(total) + '원';
    }
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
            
            // 마이페이지의 장바구니 개수 업데이트 (페이지가 열려있을 경우)
            if (typeof updateWishlistAndCartCount === 'function') {
                updateWishlistAndCartCount();
            }
            
            // 모달 표시
            productDetailElements.cartModal.classList.add('active');
        });
    });
}

// 바로구매 시 사용할 회원/로그인 정보 (배송지 모달에서 설정)
var _buyNowMember = null;
var _buyNowLoginUser = null;

// 배송지 요약 텍스트 생성
function _deliverySummary(rec, phone, postcode, address, detail) {
    var parts = [];
    if (rec) parts.push(rec);
    if (phone) parts.push(phone);
    var addr = [postcode, address, detail].filter(Boolean).join(' ');
    if (addr) parts.push(addr);
    return parts.length ? parts.join(' / ') : '-';
}

// 받는사람/연락처 입력란에 선택한 옵션 기본값 채우기
function fillDeliveryRecipientAndPhone() {
    var member = _buyNowMember;
    var source = document.querySelector('input[name="deliverySource"]:checked');
    var sourceVal = source ? source.value : 'profile';
    var recEl = document.getElementById('deliveryRecipient');
    var phoneEl = document.getElementById('deliveryPhone');
    if (!recEl || !phoneEl) return;
    if (sourceVal === 'profile' && member) {
        recEl.value = member.name || '';
        phoneEl.value = member.phone || '';
    } else if (sourceVal === 'default' && member && member.addresses) {
        var def = member.addresses.find(function (a) { return a.isDefault === true; });
        if (def) {
            recEl.value = def.recipientName || '';
            phoneEl.value = def.phone || '';
        } else {
            recEl.value = '';
            phoneEl.value = '';
        }
    } else if (sourceVal === 'new') {
        recEl.value = '';
        phoneEl.value = '';
    }
}

// 바로구매: 배송지 선택 모달 열기
function openBuyNowDeliveryModal(member, loginUser) {
    _buyNowMember = member;
    _buyNowLoginUser = loginUser;
    var profileSummary = document.getElementById('deliveryOptionProfileSummary');
    var defaultSummary = document.getElementById('deliveryOptionDefaultSummary');
    if (profileSummary) {
        profileSummary.textContent = _deliverySummary(
            member.name,
            member.phone,
            member.postcode,
            member.address,
            member.detailAddress
        );
    }
    var addresses = (member && member.addresses && Array.isArray(member.addresses)) ? member.addresses : [];
    var defaultAddr = addresses.find(function (a) { return a.isDefault === true; });
    if (defaultSummary) {
        if (defaultAddr) {
            defaultSummary.textContent = _deliverySummary(
                defaultAddr.recipientName,
                defaultAddr.phone,
                defaultAddr.postcode,
                defaultAddr.address,
                defaultAddr.detailAddress
            );
        } else {
            defaultSummary.textContent = '등록된 기본 배송지가 없습니다.';
        }
    }
    document.querySelector('input[name="deliverySource"][value="profile"]').checked = true;
    document.getElementById('deliveryNewForm').style.display = 'none';
    fillDeliveryRecipientAndPhone();
    var newPost = document.getElementById('deliveryNewPostcode');
    var newAddr = document.getElementById('deliveryNewAddress');
    var newDetail = document.getElementById('deliveryNewDetailAddress');
    if (newPost) newPost.value = '';
    if (newAddr) newAddr.value = '';
    if (newDetail) newDetail.value = '';
    if (productDetailElements.buyNowDeliveryModal) {
        productDetailElements.buyNowDeliveryModal.classList.add('active');
    }
}

function closeBuyNowDeliveryModal() {
    _buyNowMember = null;
    _buyNowLoginUser = null;
    if (productDetailElements.buyNowDeliveryModal) {
        productDetailElements.buyNowDeliveryModal.classList.remove('active');
    }
}

// 선택된 배송지 정보 반환 { recipientName, phone, postcode, address, detailAddress }
// 받는사람·연락처는 항상 상단 입력란 값 사용(기본값 또는 수정값)
function getSelectedDelivery() {
    var recEl = document.getElementById('deliveryRecipient');
    var phoneEl = document.getElementById('deliveryPhone');
    var recipientName = (recEl && recEl.value) ? recEl.value.trim() : '';
    var phone = (phoneEl && phoneEl.value) ? phoneEl.value.trim() : '';
    var source = document.querySelector('input[name="deliverySource"]:checked');
    var sourceVal = source ? source.value : 'profile';
    var member = _buyNowMember;
    var postcode = '', address = '', detailAddress = '';
    if (sourceVal === 'profile' && member) {
        postcode = member.postcode || '';
        address = member.address || '';
        detailAddress = member.detailAddress || '';
    } else if (sourceVal === 'default' && member && member.addresses) {
        var def = member.addresses.find(function (a) { return a.isDefault === true; });
        if (def) {
            postcode = def.postcode || '';
            address = def.address || '';
            detailAddress = def.detailAddress || '';
        }
    } else if (sourceVal === 'new') {
        var np = document.getElementById('deliveryNewPostcode');
        var na = document.getElementById('deliveryNewAddress');
        var nd = document.getElementById('deliveryNewDetailAddress');
        postcode = (np && np.value) ? np.value.trim() : '';
        address = (na && na.value) ? na.value.trim() : '';
        detailAddress = (nd && nd.value) ? nd.value.trim() : '';
    }
    return { recipientName: recipientName, phone: phone, postcode: postcode, address: address, detailAddress: detailAddress };
}

// 바로구매: 구매 요청을 Firestore orders에 저장 (배송지 선택 후)
function submitBuyNowOrder(delivery) {
    var loginUser = _buyNowLoginUser;
    if (!loginUser || !PRODUCT_INFO || !PRODUCT_INFO.id) return;
    var totalQuantity = selectedOptionsData.reduce(function (sum, opt) { return sum + (opt.quantity || 1); }, 0);
    var totalPrice = selectedOptionsData.reduce(function (sum, opt) { return sum + (opt.price || 0) * (opt.quantity || 1); }, 0);
    var supportRate = (PRODUCT_INFO.supportRate != null ? PRODUCT_INFO.supportRate : 5) / 100;
    var supportAmount = Math.round(totalPrice * supportRate);
    var orderData = {
        status: 'pending',
        userId: loginUser.userId,
        userName: loginUser.name,
        phone: loginUser.phone || '',
        accountNumber: loginUser.accountNumber || '',
        memberId: loginUser.docId || loginUser.userId,
        productId: PRODUCT_INFO.id,
        productName: PRODUCT_INFO.name,
        productPrice: totalPrice,
        supportAmount: supportAmount,
        quantity: totalQuantity,
        deliveryRecipientName: delivery.recipientName || '',
        deliveryPhone: delivery.phone || '',
        deliveryPostcode: delivery.postcode || '',
        deliveryAddress: delivery.address || '',
        deliveryDetailAddress: delivery.detailAddress || ''
    };
    return firebase.firestore().collection('orders').add({
        ...orderData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// 바로구매: 구매 버튼 클릭 시 배송지 모달 열기
function initBuyActions() {
    var buyBtns = document.querySelectorAll('.btn-buy, .btn-buy-fixed');

    buyBtns.forEach(function (btn) {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (selectedOptionsData.length === 0) {
                alert('옵션을 선택해주세요.');
                return;
            }
            if (!PRODUCT_INFO || !PRODUCT_INFO.id) {
                alert('상품 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                return;
            }

            var isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            var loginUserJson = localStorage.getItem('loginUser');
            if (!isLoggedIn || !loginUserJson) {
                alert('로그인 후 구매할 수 있습니다.');
                window.location.href = 'login.html?return=' + encodeURIComponent(window.location.href);
                return;
            }

            var loginUser = JSON.parse(loginUserJson);
            var docId = loginUser.docId || loginUser.userId;
            if (!docId) {
                alert('회원 정보를 확인할 수 없습니다.');
                return;
            }

            try {
                if (typeof firebase === 'undefined' || !firebase.firestore) {
                    alert('결제 시스템을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
                    return;
                }
                var db = firebase.firestore();
                var memberSnap = await db.collection('members').doc(docId).get();
                var member = memberSnap.exists ? { id: memberSnap.id, ...memberSnap.data() } : null;
                if (!member) {
                    member = {
                        name: loginUser.name,
                        phone: loginUser.phone || '',
                        postcode: '',
                        address: '',
                        detailAddress: '',
                        addresses: []
                    };
                }
                openBuyNowDeliveryModal(member, loginUser);
            } catch (err) {
                console.error('회원 정보 로드 오류:', err);
                alert('배송지 정보를 불러오는 중 오류가 발생했습니다.');
            }
        });
    });
}

// 바로구매 배송지 모달: 라디오/폼/취소/구매하기
function initBuyNowDeliveryModal() {
    var modal = productDetailElements.buyNowDeliveryModal;
    var closeBtn = productDetailElements.buyNowDeliveryModalClose;
    var cancelBtn = productDetailElements.buyNowDeliveryCancel;
    var submitBtn = productDetailElements.buyNowDeliverySubmit;
    var newForm = productDetailElements.deliveryNewForm;

    document.querySelectorAll('input[name="deliverySource"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
            if (newForm) newForm.style.display = this.value === 'new' ? 'block' : 'none';
            fillDeliveryRecipientAndPhone();
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeBuyNowDeliveryModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeBuyNowDeliveryModal);
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeBuyNowDeliveryModal();
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async function () {
            var delivery = getSelectedDelivery();
            if (!delivery.recipientName || !delivery.phone) {
                alert('받는사람과 연락처를 입력해주세요.');
                return;
            }
            var source = document.querySelector('input[name="deliverySource"]:checked');
            var sourceVal = source ? source.value : 'profile';
            if (sourceVal === 'new' && (!delivery.postcode || !delivery.address)) {
                alert('우편번호와 주소를 입력해주세요.');
                return;
            }
            submitBtn.disabled = true;
            try {
                await submitBuyNowOrder(delivery);
                closeBuyNowDeliveryModal();
                alert('구매 요청이 접수되었습니다. 관리자 승인 후 진행됩니다.');
                selectedOptionsData = [];
                renderSelectedOptions();
                updateTotalPrice();
            } catch (error) {
                console.error('구매 요청 오류:', error);
                alert('구매 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
            submitBtn.disabled = false;
        });
    }
}

// 관심상품
function initWishlistActions() {
    const wishlistBtns = document.querySelectorAll('.btn-wishlist');
    
    // 현재 상품이 관심상품에 있는지 확인
    const currentProductId = PRODUCT_INFO && PRODUCT_INFO.id ? PRODUCT_INFO.id : null;
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    let isWishlisted = currentProductId && wishlist.some(item => item.id === currentProductId);
    
    // 초기 상태 설정
    wishlistBtns.forEach(btn => {
        if (isWishlisted) {
            btn.innerHTML = '<i class="fas fa-heart"></i> 관심상품';
            btn.style.color = 'var(--danger-color)';
            btn.style.borderColor = 'var(--danger-color)';
        }
    });
    
    wishlistBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentProductId) {
                alert('상품 정보를 불러올 수 없습니다.');
                return;
            }
            
            isWishlisted = !isWishlisted;
            const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            
            if (isWishlisted) {
                // 관심상품에 추가
                const productData = {
                    id: currentProductId,
                    name: PRODUCT_INFO.name || '',
                    price: PRODUCT_INFO.price || 0,
                    image: PRODUCT_INFO.image || '',
                    addedAt: new Date().toISOString()
                };
                
                // 중복 체크
                const exists = wishlist.some(item => item.id === currentProductId);
                if (!exists) {
                    wishlist.push(productData);
                    localStorage.setItem('wishlist', JSON.stringify(wishlist));
                }
                
                btn.innerHTML = '<i class="fas fa-heart"></i> 관심상품';
                btn.style.color = 'var(--danger-color)';
                btn.style.borderColor = 'var(--danger-color)';
                
                // 관심상품 추가 후 마이페이지로 이동
                window.location.href = 'mypage.html?section=wishlist-cart&tab=wishlist';
            } else {
                // 관심상품에서 제거
                const filtered = wishlist.filter(item => item.id !== currentProductId);
                localStorage.setItem('wishlist', JSON.stringify(filtered));
                
                btn.innerHTML = '<i class="far fa-heart"></i> 관심상품';
                btn.style.color = '';
                btn.style.borderColor = '';
                alert('관심상품에서 제거되었습니다.');
            }
            
            // 마이페이지의 관심상품 개수 업데이트 (페이지가 열려있을 경우)
            if (typeof updateWishlistAndCartCount === 'function') {
                updateWishlistAndCartCount();
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
        // 마이페이지의 장바구니 섹션으로 이동
        window.location.href = 'mypage.html?section=wishlist-cart&tab=cart';
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
    
    shareBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const shareType = btn.dataset.share;
            
            // 현재 상품 정보 가져오기
            const currentUrl = window.location.href;
            
            switch(shareType) {
                case 'facebook':
                    if (typeof shareToFacebook === 'function') {
                        shareToFacebook(currentUrl);
                    } else {
                        alert('페이스북 공유 기능을 불러오는 중입니다.');
                    }
                    break;
                case 'instagram':
                    if (typeof shareToInstagram === 'function') {
                        shareToInstagram(currentUrl);
                    } else {
                        alert('인스타그램 공유 기능을 불러오는 중입니다.');
                    }
                    break;
                case 'link':
                    // URL 복사
                    if (typeof copyToClipboard === 'function') {
                        copyToClipboard(currentUrl);
                        alert('링크가 복사되었습니다!');
                    } else {
                        navigator.clipboard.writeText(currentUrl).then(() => {
                            alert('링크가 복사되었습니다!');
                        });
                    }
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
    if (!PRODUCT_INFO) {
        console.error('❌ PRODUCT_INFO가 없습니다!');
        return;
    }
    
    console.log('🔄 상품 정보 업데이트:', PRODUCT_INFO);
    
    var isError = !PRODUCT_INFO.id;
    
    // 상품명 업데이트 (제목)
    var productTitle = document.querySelector('.product-title');
    if (productTitle) {
        productTitle.textContent = PRODUCT_INFO.name;
        if (isError) {
            productTitle.innerHTML = PRODUCT_INFO.name + ' <a href="products-list.html" style="font-size:14px;margin-left:8px;">상품 목록 보기</a>';
        }
        console.log('✅ 제목 업데이트:', PRODUCT_INFO.name);
    }
    
    // 부제목(옵션) 업데이트
    var productSubtitle = document.getElementById('productSubtitle');
    if (productSubtitle) {
        productSubtitle.textContent = isError ? '상품 목록에서 상품을 선택해 주세요.' : (PRODUCT_INFO.option || PRODUCT_INFO.description || '');
        console.log('✅ 부제목 업데이트:', PRODUCT_INFO.option);
    }
    
    // 카테고리 태그는 ID→이름 변환 후 아래에서 설정
    const categoryTag = productDetailElements.categoryTag;
    
    // 쇼핑지원금 업데이트
    const supportAmount = productDetailElements.supportAmount;
    if (supportAmount) {
        const support = Math.floor(PRODUCT_INFO.price * (PRODUCT_INFO.supportRate / 100));
        supportAmount.textContent = support.toLocaleString() + '원';
        console.log('✅ 지원금 업데이트:', support);
    }
    
    // 브레드크럼 업데이트
    const breadcrumbProduct = document.querySelector('.breadcrumb li:last-child');
    if (breadcrumbProduct) {
        breadcrumbProduct.textContent = PRODUCT_INFO.name;
    }
    
    const breadcrumbCategory = document.querySelector('.breadcrumb li:nth-child(3) a');
    // breadcrumbCategory는 카테고리 이름 설정 시 함께 업데이트
    
    // 메인 이미지 업데이트
    const mainImage = productDetailElements.mainImage;
    if (mainImage) {
        mainImage.src = PRODUCT_INFO.image;
        mainImage.alt = PRODUCT_INFO.name;
        console.log('✅ 메인 이미지 업데이트:', PRODUCT_INFO.image);
    }
    
    // 상품 정보 고시 테이블 업데이트
    const productInfoTable = productDetailElements.productInfoTable;
    if (productInfoTable && PRODUCT_INFO.details && PRODUCT_INFO.details.length > 0) {
        const tableHTML = PRODUCT_INFO.details.map(detail => `
            <tr>
                <th>${detail.title}</th>
                <td>${detail.content}</td>
            </tr>
        `).join('');
        
        productInfoTable.innerHTML = tableHTML;
        console.log('✅ 상품 정보 고시 업데이트 완료');
    } else {
        // 기본 정보 표시 (카테고리 이름은 getCategoryNameMap 후 아래에서 보강)
        productInfoTable.innerHTML = `
            <tr>
                <th>브랜드</th>
                <td>${PRODUCT_INFO.brand || '상세페이지 참조'}</td>
            </tr>
            <tr>
                <th>카테고리</th>
                <td class="product-info-category-cell">${PRODUCT_INFO.category || '-'}</td>
            </tr>
        `;
    }
    
    // 총 상품금액 즉시 표시 (관리자에서 입력한 가격)
    selectedOptionsData = [];
    if (productDetailElements.totalPrice) {
        productDetailElements.totalPrice.textContent = (PRODUCT_INFO.price != null ? PRODUCT_INFO.price : 0).toLocaleString('ko-KR') + '원';
    }
    if (productDetailElements.selectedOptions && productDetailElements.selectedOptions.innerHTML !== undefined) {
        productDetailElements.selectedOptions.innerHTML = '';
    }

    // 옵션 선택 박스: 관리자에서 등록한 options 또는 기본 1개
    var optionSelect = productDetailElements.productOption;
    if (optionSelect) {
        optionSelect.innerHTML = '<option value="">옵션을 선택해주세요</option>';
        var basePrice = PRODUCT_INFO.price != null ? PRODUCT_INFO.price : 0;
        var opts = PRODUCT_INFO.options && PRODUCT_INFO.options.length > 0
            ? PRODUCT_INFO.options
            : [{ label: '기본', price: basePrice }];
        opts.forEach(function (o, i) {
            var opt = document.createElement('option');
            opt.value = String(i);
            opt.setAttribute('data-price', String(o.price));
            opt.setAttribute('data-label', o.label || '옵션' + (i + 1));
            opt.textContent = (o.label || '옵션' + (i + 1)) + ' - ' + (o.price != null ? o.price : 0).toLocaleString('ko-KR') + '원';
            optionSelect.appendChild(opt);
        });
        console.log('✅ 옵션 선택 박스 업데이트:', opts.length, '개');
    }
    
    // 상세 설명 이미지 업데이트
    const detailContent = document.querySelector('#detail .product-description');
    if (detailContent && PRODUCT_INFO.detailImages && PRODUCT_INFO.detailImages.length > 0) {
        const detailHTML = PRODUCT_INFO.detailImages.map(imageUrl => `
            <div class="detail-image">
                <img src="${imageUrl}" alt="상세 이미지" style="width: 100%; height: auto;">
            </div>
        `).join('');
        
        detailContent.innerHTML = detailHTML;
        console.log('✅ 상세 이미지 업데이트 완료:', PRODUCT_INFO.detailImages.length, '개');
    } else if (detailContent) {
        detailContent.innerHTML = '<p>상세 이미지가 없습니다.</p>';
    }
    
    // 상세정보 탭의 상품 정보 고시 테이블 업데이트
    const productSpecTable = document.getElementById('productSpecTable');
    if (productSpecTable && PRODUCT_INFO.details && PRODUCT_INFO.details.length > 0) {
        const specTableHTML = PRODUCT_INFO.details.map(detail => `
            <tr>
                <th>${detail.title}</th>
                <td>${detail.content}</td>
            </tr>
        `).join('');
        
        productSpecTable.innerHTML = specTableHTML;
        console.log('✅ 상세정보 탭 - 상품 정보 고시 업데이트 완료');
    } else if (productSpecTable) {
        // 기본 정보 표시 (카테고리 이름은 getCategoryNameMap 후 보강)
        productSpecTable.innerHTML = `
            <tr>
                <th>브랜드</th>
                <td>${PRODUCT_INFO.brand || '상품페이지 참고'}</td>
            </tr>
            <tr>
                <th>카테고리</th>
                <td class="product-spec-category-cell">${PRODUCT_INFO.category || '-'}</td>
            </tr>
        `;
    }
    
    // 카테고리 ID → 이름 변환 후 태그/브레드크럼/테이블에 반영
    getCategoryNameMap().then(map => {
        const categoryName = (PRODUCT_INFO.category && map.get(PRODUCT_INFO.category)) || PRODUCT_INFO.category || '카테고리';
        if (categoryTag) {
            categoryTag.innerHTML = `<i class="fas fa-tag"></i> ${categoryName.replace(/</g, '&lt;')}`;
        }
        if (breadcrumbCategory) {
            breadcrumbCategory.textContent = categoryName;
        }
        document.querySelectorAll('.product-info-category-cell, .product-spec-category-cell').forEach(el => {
            if (el) el.textContent = categoryName;
        });
    });
    
    // 페이지 제목 업데이트
    document.title = PRODUCT_INFO.name + ' - 10쇼핑게임';
    
    console.log('✅ 페이지 정보 업데이트 완료!');
    
    // 관련 상품 로드
    loadRelatedProducts();
}

// 관련 상품 로드
async function loadRelatedProducts() {
    if (!PRODUCT_INFO || !PRODUCT_INFO.category) {
        console.log('⚠️ 카테고리 정보가 없어 관련 상품을 로드할 수 없습니다.');
        return;
    }
    
    try {
        const db = firebase.firestore();
        
        // 같은 카테고리의 다른 상품들 가져오기
        const productsSnapshot = await db.collection('products')
            .where('category', '==', PRODUCT_INFO.category)
            .where('status', '==', 'sale')
            .limit(8)
            .get();
        
        const relatedProducts = [];
        productsSnapshot.forEach(doc => {
            // 현재 상품은 제외
            if (doc.id !== PRODUCT_INFO.id) {
                const product = doc.data();
                relatedProducts.push({
                    id: doc.id,
                    name: product.name,
                    price: product.price,
                    image: product.mainImageUrl || product.imageUrl || 'https://placehold.co/300x300/E0E0E0/999?text=No+Image',
                    supportRate: product.supportRate || 5
                });
            }
        });
        
        console.log('✅ 관련 상품 로드:', relatedProducts.length, '개');
        
        // 관련 상품 제목 업데이트
        const relatedTitle = document.getElementById('relatedProductsTitle');
        if (relatedTitle) {
            relatedTitle.textContent = `${PRODUCT_INFO.name} 상품의 관련상품이에요`;
        }
        
        // 관련 상품 렌더링
        const relatedGrid = document.getElementById('relatedProductsGrid');
        if (relatedGrid) {
            if (relatedProducts.length === 0) {
                relatedGrid.innerHTML = `
                    <div class="empty-related">
                        <i class="fas fa-box-open"></i>
                        <h3>관련 상품이 없습니다.</h3>
                        <p>현재 이용 가능한 관련 상품이 없습니다.</p>
                    </div>
                `;
            } else {
                const html = relatedProducts.map(product => {
                    const support = Math.floor(product.price * (product.supportRate / 100));
                    return `
                        <div class="product-card">
                            <a href="product-detail.html?id=${product.id}" class="product-link">
                                <div class="product-image">
                                    <img src="${product.image}" alt="${product.name}">
                                </div>
                                <div class="product-info">
                                    <h3 class="product-title">${product.name}</h3>
                                    <div class="product-support">쇼핑지원금 ${support.toLocaleString()}원</div>
                                </div>
                            </a>
                        </div>
                    `;
                }).join('');
                
                relatedGrid.innerHTML = html;
            }
        }
        
    } catch (error) {
        console.error('❌ 관련 상품 로드 오류:', error);
    }
}

// 초기화
async function initProductDetail() {
    console.log('🚀 상품 상세 페이지 초기화 시작');
    
    // Firebase가 로드·초기화될 때까지 대기
    if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
        console.log('⏳ Firebase 로딩·초기화 대기...');
        await new Promise(function (resolve) {
            var attempts = 0;
            var checkFirebase = setInterval(function () {
                attempts++;
                if (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0) {
                    clearInterval(checkFirebase);
                    resolve();
                }
                if (attempts > 80) {
                    clearInterval(checkFirebase);
                    resolve();
                }
            }, 100);
        });
    }
    
    console.log('✅ Firebase 준비 완료');
    
    // 상품 정보 로드
    PRODUCT_INFO = await getProductFromUrl();
    console.log('📦 로드된 상품 정보:', PRODUCT_INFO);
    
    // 페이지 업데이트
    updatePageInfo();
    initThumbnailClick();
    initOptionSelect();
    initCartActions();
    initBuyActions();
    initBuyNowDeliveryModal();
    initWishlistActions();
    initCartModal();
    initTabs();
    initZoom();
    initShareButtons();
    initWriteButtons();
    initMoreDescription();
    initHomeButton();
    initTodayViewedDetail();
    
    console.log('✅ 상품 상세 페이지 초기화 완료');
}

// DOM 로드 완료 시 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 로그인 상태 업데이트 (script.js 로드 대기)
        setTimeout(() => {
            if (typeof updateHeaderForLoginStatus === 'function') {
                updateHeaderForLoginStatus();
            } else {
                console.warn('updateHeaderForLoginStatus 함수를 찾을 수 없습니다.');
            }
        }, 100);
        initProductDetail();
    });
} else {
    // 로그인 상태 업데이트 (script.js 로드 대기)
    setTimeout(() => {
        if (typeof updateHeaderForLoginStatus === 'function') {
            updateHeaderForLoginStatus();
        } else {
            console.warn('updateHeaderForLoginStatus 함수를 찾을 수 없습니다.');
        }
    }, 100);
    initProductDetail();
}
