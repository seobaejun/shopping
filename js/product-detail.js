/** 가격 노출 여부: 로그인 시에만 true */
function isPriceVisible() {
    return localStorage.getItem('isLoggedIn') === 'true';
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
    var displayName = (product.name != null && String(product.name).trim() !== '') ? product.name
        : (product.productName != null && String(product.productName).trim() !== '') ? product.productName
        : (product.title != null && String(product.title).trim() !== '') ? product.title
        : '';
    return {
        id: doc.id,
        name: displayName,
        option: product.shortDesc || '',
        price: product.price != null ? Number(product.price) : 0,
        originalPrice: product.originalPrice != null ? Number(product.originalPrice) : 0,
        image: (window.resolveProductImageUrl && window.resolveProductImageUrl(product.mainImageUrl || product.imageUrl)) || product.mainImageUrl || product.imageUrl || 'https://placehold.co/600x600/E0E0E0/999?text=No+Image',
        detailImages: (product.detailImageUrls || product.detailImages || []).map(function(u) { return (window.resolveProductImageUrl && window.resolveProductImageUrl(u)) || u; }),
        description: product.description || '',
        descriptionHtml: product.descriptionHtml || '',
        details: product.details || [],
        category: product.category || '',
        manufacturer: product.manufacturer || '',
        brand: product.brand || '',
        stock: product.stock != null ? Number(product.stock) : 0,
        supportAmount: product.supportAmount != null ? Number(product.supportAmount) : null,
        supportRate: product.supportRate != null ? Number(product.supportRate) : 0,
        options: options
    };
}

// URL에서 상품 ID 가져오기 (없으면 메인에서 클릭 시 저장한 sessionStorage 사용) → Firestore에서 로드
async function getProductFromUrl() {
    var urlParams = new URLSearchParams(window.location.search);
    var productId = urlParams.get('id');
    if (!productId || (typeof productId === 'string' && productId.trim() === '')) {
        try { productId = sessionStorage.getItem('selectedProductId') || ''; } catch (e) {}
    }
    console.log('📌 상품 ID (URL 또는 저장값):', productId || '(없음)');
    
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
                try { sessionStorage.removeItem('selectedProductId'); } catch (e) {}
                if (!urlParams.get('id')) { window.history.replaceState({}, '', 'product-detail.html?id=' + encodeURIComponent(doc.id)); }
                return _parseProductDoc(doc);
            }
            console.warn('⚠️ Firestore에 해당 상품이 없습니다:', productId);
        } catch (error) {
            console.error('❌ Firestore에서 상품 로드 오류:', error);
        }
    }
    
    // URL·저장값 둘 다 없을 때만 안내 화면
    if (!productId || (typeof productId === 'string' && productId.trim() === '')) {
        console.warn('⚠️ 상품 ID가 없습니다. 메인/상품목록에서 상품을 클릭해 주세요.');
        return {
            id: null,
            name: '상품을 선택해 주세요',
            option: '주소에 상품 ID가 없습니다. 메인 또는 상품목록에서 상품을 클릭해 들어와 주세요.',
            price: 0,
            originalPrice: 0,
            image: 'https://placehold.co/600x600/E0E0E0/999?text=Select+Product',
            detailImages: [],
            description: '',
            descriptionHtml: '',
            details: [],
            category: '',
            brand: '',
            stock: 0,
            supportAmount: null,
            supportRate: 0,
            options: []
        };
    }
    
    return {
        id: null,
        name: '상품을 찾을 수 없습니다',
        option: '',
        price: 0,
        originalPrice: 0,
        image: 'https://placehold.co/600x600/E0E0E0/999?text=No+Product',
        detailImages: [],
        description: '',
        descriptionHtml: '',
        details: [],
        category: '',
        brand: '',
        stock: 0,
        supportAmount: null,
        supportRate: 0
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

// 페이지네이션 상태
let currentReviewPage = 1;
let currentInquiryPage = 1;
const ITEMS_PER_PAGE = 10;

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
    deliveryNewForm: document.getElementById('deliveryNewForm'),
    buyNowPaymentModal: document.getElementById('buyNowPaymentModal'),
    buyNowPaymentModalClose: document.getElementById('buyNowPaymentModalClose'),
    buyNowPaymentModalBody: document.getElementById('buyNowPaymentModalBody'),
    buyNowPaymentModalFooter: document.getElementById('buyNowPaymentModalFooter'),
    buyNowPaymentDoneFooter: document.getElementById('buyNowPaymentDoneFooter')
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
                <span class="option-price">${isPriceVisible() ? (formatPrice(option.price * option.quantity) + '원') : ''}</span>
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
    if (!productDetailElements.totalPrice) return;
    if (!isPriceVisible()) {
        productDetailElements.totalPrice.textContent = '';
        return;
    }
    var total;
    if (selectedOptionsData.length > 0) {
        total = selectedOptionsData.reduce(function (sum, option) {
            return sum + (option.price * option.quantity);
        }, 0);
    } else {
        total = (PRODUCT_INFO && PRODUCT_INFO.price != null) ? PRODUCT_INFO.price : 0;
    }
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
            var saveCart = window.wishlistCartFirebase && typeof window.wishlistCartFirebase.getCart === 'function' && typeof window.wishlistCartFirebase.setCart === 'function'
                ? window.wishlistCartFirebase.getCart().then(function (cart) {
                    selectedOptionsData.forEach(function (option) {
                        cart.push({
                            productId: PRODUCT_INFO.id,
                            productName: PRODUCT_INFO.name,
                            optionName: option.name,
                            quantity: option.quantity,
                            price: option.price,
                            image: PRODUCT_INFO.image
                        });
                    });
                    return window.wishlistCartFirebase.setCart(cart);
                })
                : Promise.resolve().then(function () {
                    var cart = JSON.parse(localStorage.getItem('cart') || '[]');
                    selectedOptionsData.forEach(function (option) {
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
                });
            saveCart.then(function () {
                if (typeof updateWishlistAndCartCount === 'function') {
                    updateWishlistAndCartCount();
                }
                productDetailElements.cartModal.classList.add('active');
            });
        });
    });
}

// 바로구매 시 사용할 회원/로그인 정보 (배송지 모달에서 설정)
var _buyNowMember = null;
var _buyNowLoginUser = null;
var _buyNowPendingDelivery = null;

// 배송지 요약: 위에 받는사람·연락처, 아래에 주소 (줄바꿈으로 구분)
function _deliverySummary(rec, phone, postcode, address, detail) {
    var topParts = [];
    if (rec) topParts.push(rec);
    if (phone) topParts.push(phone);
    var topLine = topParts.length ? topParts.join(' / ') : '-';
    var addr = [postcode, address, detail].filter(Boolean).join(' ');
    var bottomLine = addr || '-';
    return topLine + '\n' + bottomLine;
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
    var newAddr = document.getElementById('deliveryNewAddress');
    var newDetail = document.getElementById('deliveryNewDetailAddress');
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
        var na = document.getElementById('deliveryNewAddress');
        var nd = document.getElementById('deliveryNewDetailAddress');
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
    var supportAmount = (PRODUCT_INFO.supportAmount != null && PRODUCT_INFO.supportAmount > 0)
        ? (PRODUCT_INFO.supportAmount * totalQuantity)
        : 0;
    var optionsForOrder = selectedOptionsData.map(function (opt) {
        return { label: opt.label || '', value: opt.value || '', price: opt.price || 0, quantity: opt.quantity || 1 };
    });
    var orderProductName = (PRODUCT_INFO.name != null && String(PRODUCT_INFO.name).trim() !== '') ? PRODUCT_INFO.name
        : (PRODUCT_INFO.productName != null && String(PRODUCT_INFO.productName).trim() !== '') ? PRODUCT_INFO.productName
        : (PRODUCT_INFO.title != null && String(PRODUCT_INFO.title).trim() !== '') ? PRODUCT_INFO.title
        : '';
    var orderData = {
        status: 'pending',
        userId: loginUser.userId,
        userName: loginUser.name,
        phone: loginUser.phone || '',
        accountNumber: loginUser.accountNumber || '',
        memberId: loginUser.docId || loginUser.userId,
        productId: PRODUCT_INFO.id,
        productName: orderProductName || String(PRODUCT_INFO.id),
        productPrice: totalPrice,
        supportAmount: supportAmount,
        quantity: totalQuantity,
        selectedOptions: optionsForOrder,
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
        submitBtn.addEventListener('click', function () {
            var delivery = getSelectedDelivery();
            if (!delivery.recipientName || !delivery.phone) {
                alert('받는사람과 연락처를 입력해주세요.');
                return;
            }
            var source = document.querySelector('input[name="deliverySource"]:checked');
            var sourceVal = source ? source.value : 'profile';
            if (sourceVal === 'new' && !delivery.address) {
                alert('주소를 입력해주세요.');
                return;
            }
            _buyNowPendingDelivery = delivery;
            closeBuyNowDeliveryModal();
            openBuyNowPaymentModal(delivery);
        });
    }
}

function openBuyNowPaymentModal(delivery) {
    var totalQuantity = selectedOptionsData.reduce(function (sum, opt) { return sum + (opt.quantity || 1); }, 0);
    var totalPrice = selectedOptionsData.reduce(function (sum, opt) { return sum + (opt.price || 0) * (opt.quantity || 1); }, 0);
    var supportAmount = (PRODUCT_INFO && PRODUCT_INFO.supportAmount != null && PRODUCT_INFO.supportAmount > 0)
        ? PRODUCT_INFO.supportAmount * totalQuantity : 0;
    var productLine = (PRODUCT_INFO && PRODUCT_INFO.name) ? PRODUCT_INFO.name : '-';
    if (selectedOptionsData.length > 0) {
        productLine += ' ' + selectedOptionsData.map(function (o) {
            return (o.label || '') + (o.quantity > 1 ? ' x' + o.quantity : '');
        }).join(', ');
    }
    var amountLine = totalPrice.toLocaleString() + '원' + (supportAmount > 0 ? ' (지원금 ' + supportAmount.toLocaleString() + ' trix)' : '');
    var recipientLine = (delivery.recipientName || '-') + ' / ' + (delivery.phone || '-');
    var addressLine = [delivery.postcode, delivery.address, delivery.detailAddress].filter(Boolean).join(' ');

    var productEl = document.getElementById('paymentProductInfo');
    var amountEl = document.getElementById('paymentAmountInfo');
    var recipientEl = document.getElementById('paymentDeliveryRecipient');
    var addressEl = document.getElementById('paymentDeliveryAddress');
    if (productEl) productEl.textContent = productLine;
    if (amountEl) amountEl.textContent = amountLine;
    if (recipientEl) recipientEl.textContent = recipientLine;
    if (addressEl) addressEl.textContent = addressLine || '-';

    var footer = document.getElementById('buyNowPaymentModalFooter');
    var doneFooter = document.getElementById('buyNowPaymentDoneFooter');
    var body = document.getElementById('buyNowPaymentModalBody');
    if (footer) footer.style.display = 'flex';
    if (doneFooter) doneFooter.style.display = 'none';
    if (body) body.style.display = 'block';

    if (productDetailElements.buyNowPaymentModal) {
        productDetailElements.buyNowPaymentModal.classList.add('active');
    }
}

function closeBuyNowPaymentModal() {
    _buyNowPendingDelivery = null;
    if (productDetailElements.buyNowPaymentModal) {
        productDetailElements.buyNowPaymentModal.classList.remove('active');
    }
}

function initBuyNowPaymentModal() {
    var modal = productDetailElements.buyNowPaymentModal;
    var closeBtn = document.getElementById('buyNowPaymentModalClose');
    var copyBtn = document.getElementById('btnCopyPaymentAccount');
    var accountEl = document.getElementById('paymentAccountNumber');
    var confirmBtn = document.getElementById('buyNowPaymentConfirm');
    var orderHistoryBtn = document.getElementById('btnOrderHistory');
    var continueBtn = document.getElementById('btnContinueShopping');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeBuyNowPaymentModal);
    }
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeBuyNowPaymentModal();
        });
    }
    if (copyBtn && accountEl) {
        copyBtn.addEventListener('click', function () {
            var account = (accountEl && accountEl.textContent) ? accountEl.textContent.trim() : '670-910020-22804';
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(account).then(function () {
                    alert('계좌번호가 복사되었습니다.');
                }).catch(function () {
                    fallbackCopy(account);
                });
            } else {
                fallbackCopy(account);
            }
        });
    }
    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            alert('계좌번호가 복사되었습니다.');
        } catch (e) {
            alert('복사에 실패했습니다. 계좌번호: ' + text);
        }
        document.body.removeChild(ta);
    }
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async function () {
            var delivery = _buyNowPendingDelivery;
            if (!delivery) return;
            confirmBtn.disabled = true;
            try {
                await submitBuyNowOrder(delivery);
                var body = document.getElementById('buyNowPaymentModalBody');
                var footer = document.getElementById('buyNowPaymentModalFooter');
                var doneFooter = document.getElementById('buyNowPaymentDoneFooter');
                if (body) {
                    body.innerHTML = '<p class="payment-info-line" style="text-align:center; font-size:16px; margin:20px 0;">주문이 접수되었습니다.</p>';
                    body.style.display = 'block';
                }
                if (footer) footer.style.display = 'none';
                if (doneFooter) doneFooter.style.display = 'flex';
            } catch (error) {
                console.error('구매 요청 오류:', error);
                alert('구매 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
            confirmBtn.disabled = false;
        });
    }
    if (orderHistoryBtn) {
        orderHistoryBtn.addEventListener('click', function () {
            closeBuyNowPaymentModal();
            selectedOptionsData = [];
            renderSelectedOptions();
            updateTotalPrice();
            window.location.href = 'mypage.html?section=orders';
        });
    }
    if (continueBtn) {
        continueBtn.addEventListener('click', function () {
            closeBuyNowPaymentModal();
            selectedOptionsData = [];
            renderSelectedOptions();
            updateTotalPrice();
        });
    }
}

// 관심상품 (Firestore 저장)
function initWishlistActions() {
    var wishlistBtns = document.querySelectorAll('.btn-wishlist');
    var currentProductId = PRODUCT_INFO && PRODUCT_INFO.id ? PRODUCT_INFO.id : null;
    var getWishlistFn = window.wishlistCartFirebase && typeof window.wishlistCartFirebase.getWishlist === 'function'
        ? window.wishlistCartFirebase.getWishlist
        : function () { return Promise.resolve(JSON.parse(localStorage.getItem('wishlist') || '[]')); };
    var setWishlistFn = window.wishlistCartFirebase && typeof window.wishlistCartFirebase.setWishlist === 'function'
        ? window.wishlistCartFirebase.setWishlist
        : function (arr) { localStorage.setItem('wishlist', JSON.stringify(arr)); return Promise.resolve(); };

    getWishlistFn().then(function (wishlist) {
        var isWishlisted = currentProductId && wishlist.some(function (item) { return item.id === currentProductId; });
        wishlistBtns.forEach(function (btn) {
            if (isWishlisted) {
                btn.innerHTML = '<i class="fas fa-heart"></i> 관심상품';
                btn.style.color = 'var(--danger-color)';
                btn.style.borderColor = 'var(--danger-color)';
            }
        });

        wishlistBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (!currentProductId) {
                    alert('상품 정보를 불러올 수 없습니다.');
                    return;
                }
                getWishlistFn().then(function (wishlist) {
                    var isIn = wishlist.some(function (item) { return item.id === currentProductId; });
                    if (!isIn) {
                        var productData = {
                            id: currentProductId,
                            name: PRODUCT_INFO.name || '',
                            price: PRODUCT_INFO.price || 0,
                            image: PRODUCT_INFO.image || '',
                            addedAt: new Date().toISOString()
                        };
                        wishlist.push(productData);
                        setWishlistFn(wishlist).then(function () {
                            btn.innerHTML = '<i class="fas fa-heart"></i> 관심상품';
                            btn.style.color = 'var(--danger-color)';
                            btn.style.borderColor = 'var(--danger-color)';
                            updateWishlistCount();
                            if (typeof updateWishlistAndCartCount === 'function') updateWishlistAndCartCount();
                            window.location.href = 'mypage.html?section=wishlist-cart&tab=wishlist';
                        });
                    } else {
                        var filtered = wishlist.filter(function (item) { return item.id !== currentProductId; });
                        setWishlistFn(filtered).then(function () {
                            btn.innerHTML = '<i class="far fa-heart"></i> 관심상품';
                            btn.style.color = '';
                            btn.style.borderColor = '';
                            alert('관심상품에서 제거되었습니다.');
                            updateWishlistCount();
                            if (typeof updateWishlistAndCartCount === 'function') updateWishlistAndCartCount();
                        });
                    }
                });
            });
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
    // DOM 요소를 다시 찾기 (동적 로드 대비)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (!tabBtns || tabBtns.length === 0) {
        console.warn('탭 버튼을 찾을 수 없습니다.');
        return;
    }
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            if (!targetTab) {
                console.warn('탭 데이터 속성이 없습니다.');
                return;
            }
            
            // 모든 탭 버튼 비활성화
            tabBtns.forEach(b => b.classList.remove('active'));
            // 현재 탭 버튼 활성화
            btn.classList.add('active');
            
            // 모든 탭 컨텐츠 숨기기
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // 선택한 탭 컨텐츠 표시
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            } else {
                console.warn('탭 컨텐츠를 찾을 수 없습니다:', targetTab);
            }
        });
    });
}

// 확대보기 (버튼이 있을 때만 동작)
function initZoom() {
    const zoomBtn = document.querySelector('.zoom-btn');
    if (!zoomBtn) return;
    zoomBtn.addEventListener('click', () => {
        const mainImage = productDetailElements.mainImage;
        if (!mainImage) return;
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
                openReviewModal();
            } else if (parentId === 'qna') {
                openProductInquiryModal();
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

// 최근 본 상품: today-viewed.js 공통 스크립트 사용 (현재 상품만 추가 후 배지 갱신)
function initTodayViewedDetail() {
    if (PRODUCT_INFO && PRODUCT_INFO.id && typeof window.addToTodayViewed === 'function') {
        window.addToTodayViewed({
            id: PRODUCT_INFO.id,
            name: PRODUCT_INFO.name,
            price: PRODUCT_INFO.price,
            image: PRODUCT_INFO.image
        });
    }
    if (typeof window.updateViewedCount === 'function') window.updateViewedCount();
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
        var subtitleText = (PRODUCT_INFO.option || '').trim() || (PRODUCT_INFO.description || '').replace(/<[^>]+>/g, '').trim();
        productSubtitle.textContent = isError ? '상품 목록에서 상품을 선택해 주세요.' : (subtitleText || '');
        console.log('✅ 부제목 업데이트:', PRODUCT_INFO.option);
    }
    
    // 카테고리 태그는 ID→이름 변환 후 아래에서 설정
    const categoryTag = productDetailElements.categoryTag;
    
    // 쇼핑지원금: 관리자가 입력한 값만 표시
    const supportAmountEl = productDetailElements.supportAmount;
    if (supportAmountEl) {
        const support = (PRODUCT_INFO.supportAmount != null && PRODUCT_INFO.supportAmount > 0) ? PRODUCT_INFO.supportAmount : 0;
        supportAmountEl.textContent = formatTrix(support) + ' trix';
        console.log('✅ 지원금 업데이트:', support);
    }
    
    // 브레드크럼 업데이트
    const breadcrumbProduct = document.querySelector('.breadcrumb li:last-child');
    if (breadcrumbProduct) {
        breadcrumbProduct.textContent = PRODUCT_INFO.name;
    }
    
    const breadcrumbCategory = document.querySelector('.breadcrumb li:nth-child(3) a');
    // breadcrumbCategory는 카테고리 이름 설정 시 함께 업데이트
    
    // 메인 이미지: 로드 완료 후에만 표시 (노이미지 플래시 방지)
    const mainImage = productDetailElements.mainImage;
    if (mainImage) {
        mainImage.style.opacity = '0';
        mainImage.onerror = function () { this.style.opacity = '1'; };
        mainImage.onload = function () { this.style.opacity = '1'; };
        mainImage.src = PRODUCT_INFO.image;
        mainImage.alt = PRODUCT_INFO.name;
        if (mainImage.complete && mainImage.naturalWidth) mainImage.style.opacity = '1';
        console.log('✅ 메인 이미지 업데이트:', PRODUCT_INFO.image);
    }
    
    // 상품 정보 테이블 업데이트 (오른쪽 패널, 데이터 있으면 사용/없으면 기본값)
    const productInfoTable = productDetailElements.productInfoTable;
    var defaultTitles = ['카테고리', '제품소재', '색상', '치수', '제조국', '사용기한', '취급 시 주의사항', '품질보증기준'];
    function isManufacturerTitle(title) {
        if (!title || typeof title !== 'string') return false;
        var t = title.trim();
        return t === '제조사' || t === '제조자' || t.indexOf('제조사') !== -1 || t.indexOf('제조자') !== -1;
    }
    function buildInfoTableBody() {
        var map = {};
        if (PRODUCT_INFO.details && PRODUCT_INFO.details.length > 0) {
            PRODUCT_INFO.details.forEach(function (d) {
                var t = (d.title || '').trim();
                if (isManufacturerTitle(t)) return;
                map[t] = (d.content || '').trim();
            });
        }
        function val(title) {
            if (map[title] != null && String(map[title]).trim() !== '') return String(map[title]).trim();
            if (title === '카테고리') return PRODUCT_INFO.category || '-';
            return '-';
        }
        return defaultTitles.filter(function (title) { return !isManufacturerTitle(title); }).map(function (title) {
            var content = val(title);
            var tdClass = title === '카테고리' ? ' class="product-info-category-cell"' : '';
            return '<tr><th>' + String(title).replace(/</g, '&lt;') + '</th><td' + tdClass + '>' + String(content).replace(/</g, '&lt;') + '</td></tr>';
        }).join('');
    }
    if (productInfoTable) {
        productInfoTable.innerHTML = buildInfoTableBody();
    }
    
    // 총 상품금액 즉시 표시 (관리자에서 입력한 가격) — 로그인 시에만 표시
    selectedOptionsData = [];
    if (productDetailElements.totalPrice) {
        productDetailElements.totalPrice.textContent = isPriceVisible()
            ? ((PRODUCT_INFO.price != null ? PRODUCT_INFO.price : 0).toLocaleString('ko-KR') + '원')
            : '';
    }
    if (productDetailElements.selectedOptions && productDetailElements.selectedOptions.innerHTML !== undefined) {
        productDetailElements.selectedOptions.innerHTML = '';
    }

    // 옵션 선택 박스: 관리자에서 등록한 options 또는 기본 1개 (가격은 로그인 시에만 표시)
    var optionSelect = productDetailElements.productOption;
    if (optionSelect) {
        optionSelect.innerHTML = '<option value="">옵션을 선택해주세요</option>';
        var basePrice = PRODUCT_INFO.price != null ? PRODUCT_INFO.price : 0;
        var opts = PRODUCT_INFO.options && PRODUCT_INFO.options.length > 0
            ? PRODUCT_INFO.options
            : [{ label: '기본', price: basePrice }];
        var showPrice = isPriceVisible();
        opts.forEach(function (o, i) {
            var opt = document.createElement('option');
            opt.value = String(i);
            opt.setAttribute('data-price', String(o.price));
            opt.setAttribute('data-label', o.label || '옵션' + (i + 1));
            opt.textContent = (o.label || '옵션' + (i + 1)) + (showPrice ? ' - ' + (o.price != null ? o.price : 0).toLocaleString('ko-KR') + '원' : '');
            optionSelect.appendChild(opt);
        });
        console.log('✅ 옵션 선택 박스 업데이트:', opts.length, '개');
    }
    
    // 상세 설명: 글(descriptionHtml) 먼저, 그 아래 상세 이미지
    const detailContent = document.querySelector('#detail .product-description');
    if (detailContent) {
        const parts = [];
        var descHtml = (PRODUCT_INFO.descriptionHtml || PRODUCT_INFO.description || '').trim();
        if (descHtml && descHtml.replace(/<[^>]+>/g, '').trim()) {
            parts.push('<div class="product-description-html">' + descHtml + '</div>');
        }
        if (PRODUCT_INFO.detailImages && PRODUCT_INFO.detailImages.length > 0) {
            parts.push(PRODUCT_INFO.detailImages.map(imageUrl => `
                <div class="detail-image">
                    <img src="${imageUrl.replace(/"/g, '&quot;')}" alt="상세 이미지" style="width: 100%; height: auto;" loading="lazy" decoding="async">
                </div>
            `).join(''));
        }
        if (parts.length > 0) {
            detailContent.innerHTML = parts.join('');
        } else {
            detailContent.innerHTML = '<p>상세 이미지가 없습니다.</p>';
        }
        console.log('✅ 상세 설명 업데이트 완료 (글:', !!PRODUCT_INFO.descriptionHtml, ', 이미지:', (PRODUCT_INFO.detailImages || []).length, '개)');
    }
    
    // 상세정보 탭의 상품 정보 테이블 업데이트 (엑셀/관리자 details 있으면 사용, 없으면 기본값)
    const productSpecTable = document.getElementById('productSpecTable');
    var defaultSpecTitles = ['카테고리', '제품소재', '색상', '치수', '제조국', '사용기한', '취급 시 주의사항', '품질보증기준'];
    function buildSpecTableBody() {
        var detailMap = {};
        var extraDetails = [];
        if (PRODUCT_INFO.details && PRODUCT_INFO.details.length > 0) {
            PRODUCT_INFO.details.forEach(function (d) {
                var t = (d.title || '').trim();
                var c = (d.content || '').trim();
                if (!t || isManufacturerTitle(t)) return;
                detailMap[t] = c;
                if (defaultSpecTitles.indexOf(t) === -1) extraDetails.push({ title: t, content: c });
            });
        }
        function getCellContent(title) {
            var fromDetail = detailMap[title];
            if (fromDetail != null && String(fromDetail).trim() !== '') return String(fromDetail).trim();
            if (title === '카테고리') return PRODUCT_INFO.category || '-';
            return '-';
        }
        var rows = defaultSpecTitles.filter(function (title) { return !isManufacturerTitle(title); }).map(function (title) {
            var content = getCellContent(title);
            var tdClass = title === '카테고리' ? ' class="product-spec-category-cell"' : '';
            return '<tr><th>' + String(title).replace(/</g, '&lt;') + '</th><td' + tdClass + '>' + String(content).replace(/</g, '&lt;') + '</td></tr>';
        });
        extraDetails.forEach(function (d) {
            if (isManufacturerTitle(d.title)) return;
            rows.push('<tr><th>' + String(d.title).replace(/</g, '&lt;') + '</th><td>' + String(d.content || '-').replace(/</g, '&lt;') + '</td></tr>');
        });
        return rows.join('');
    }
    if (productSpecTable) {
        var tableHtml = buildSpecTableBody();
        tableHtml = tableHtml.replace(/<tr><th>[^<]*제조사[^<]*<\/th><td>[^<]*<\/td><\/tr>/g, '').replace(/<tr><th>[^<]*제조자[^<]*<\/th><td>[^<]*<\/td><\/tr>/g, '');
        productSpecTable.innerHTML = tableHtml;
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
                    image: (window.resolveProductImageUrl && window.resolveProductImageUrl(product.mainImageUrl || product.imageUrl)) || product.mainImageUrl || product.imageUrl || 'https://placehold.co/300x300/E0E0E0/999?text=No+Image',
                    supportAmount: product.supportAmount,
                    supportRate: product.supportRate != null ? product.supportRate : 0
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
                    const support = (product.supportAmount != null && product.supportAmount > 0) ? product.supportAmount : 0;
                    return `
                        <div class="product-card">
                            <a href="product-detail.html?id=${product.id}" class="product-link">
                                <div class="product-image">
                                    <img src="${product.image}" alt="${product.name}">
                                </div>
                                <div class="product-info">
                                    <h3 class="product-title">${product.name}</h3>
                                    <div class="product-support">쇼핑지원금 ${formatTrix(support)} trix</div>
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
    initBuyNowPaymentModal();
    initWishlistActions();
    initCartModal();
    initProductInquiry();
    initTabs();
    // 페이지네이션 초기화
    currentReviewPage = 1;
    currentInquiryPage = 1;
    loadProductReviews();
    loadProductInquiries();
    updateWishlistCount();
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
        if (typeof updateHeaderForLoginStatus === 'function') updateHeaderForLoginStatus();
        initProductDetail();
    });
} else {
    if (typeof updateHeaderForLoginStatus === 'function') updateHeaderForLoginStatus();
    initProductDetail();
}

// 상품문의 기능
function initProductInquiry() {
    const writeBtn = document.getElementById('btnProductInquiryWrite');
    const modal = document.getElementById('productInquiryModal');
    const closeBtn = document.getElementById('productInquiryModalClose');
    const cancelBtn = document.getElementById('productInquiryModalCancel');
    const saveBtn = document.getElementById('productInquiryModalSave');
    const contentInput = document.getElementById('productInquiryContent');
    const counterEl = document.getElementById('productInquiryContentCounter');

    if (writeBtn) {
        writeBtn.addEventListener('click', function() {
            openProductInquiryModal();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeProductInquiryModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeProductInquiryModal();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveProductInquiry();
        });
    }

    // 텍스트 카운터
    if (contentInput && counterEl) {
        contentInput.addEventListener('input', function() {
            const length = contentInput.value.length;
            counterEl.textContent = length;
            if (length > 1000) {
                counterEl.style.color = '#e53e3e';
            } else {
                counterEl.style.color = '#667eea';
            }
        });
    }

    // 모달 외부 클릭 시 닫기
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeProductInquiryModal();
            }
        });
    }
}

// 상품문의 모달 열기
function openProductInquiryModal() {
    const modal = document.getElementById('productInquiryModal');
    const titleInput = document.getElementById('productInquiryTitle');
    const contentInput = document.getElementById('productInquiryContent');
    const counterEl = document.getElementById('productInquiryContentCounter');

    if (!modal || !titleInput || !contentInput) return;

    // 로그인 확인
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }

    titleInput.value = '';
    contentInput.value = '';
    if (counterEl) counterEl.textContent = '0';
    modal.style.display = 'flex';
}

// 상품문의 모달 닫기
function closeProductInquiryModal() {
    const modal = document.getElementById('productInquiryModal');
    if (modal) modal.style.display = 'none';
}

// 상품문의 저장
function saveProductInquiry() {
    const titleInput = document.getElementById('productInquiryTitle');
    const contentInput = document.getElementById('productInquiryContent');

    if (!titleInput || !contentInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }

    if (!content) {
        alert('내용을 입력해주세요.');
        return;
    }

    if (!PRODUCT_INFO || !PRODUCT_INFO.id) {
        alert('상품 정보를 불러올 수 없습니다.');
        return;
    }

    const user = (function() {
        if (localStorage.getItem('isLoggedIn') !== 'true') return null;
        try {
            const raw = localStorage.getItem('loginUser');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    })();

    if (!user || !user.userId) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }

    if (typeof firebase === 'undefined' || !firebase.firestore) {
        alert('Firebase를 사용할 수 없습니다.');
        return;
    }

    const db = firebase.firestore();
    const data = {
        boardType: 'product-inquiry',
        title: title,
        content: content,
        productId: PRODUCT_INFO.id,
        productName: PRODUCT_INFO.name || '',
        productImage: PRODUCT_INFO.image || '',
        authorName: user.name || user.userId,
        authorId: user.userId,
        status: 'pending',
        viewCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('posts').add(data)
        .then(function(docRef) {
            alert('상품문의가 등록되었습니다.');
            closeProductInquiryModal();
            // 상품문의 목록 새로고침
            loadProductInquiries();
            // 현재 페이지에 머무름 (마이페이지로 이동하지 않음)
        })
        .catch(function(error) {
            console.error('상품문의 저장 오류:', error);
            alert('상품문의 등록에 실패했습니다.');
        });
}

// ============================================
// 상품후기 관련 함수
// ============================================

// 상품후기 모달 열기
function openReviewModal() {
    // 로그인 확인 (관리자는 로그인 없어도 후기 쓰기 허용)
    var user = null;
    try {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            var raw = localStorage.getItem('loginUser');
            if (raw) user = JSON.parse(raw);
        }
    } catch (e) { /* ignore */ }

    var isAdmin = localStorage.getItem('isAdmin') === 'true' ||
                    (user && user.userId && (user.userId === 'admin' || user.role === 'admin'));

    if (!isAdmin) {
        if (!user || !user.userId) {
            alert('로그인이 필요합니다.');
            window.location.href = 'login.html';
            return;
        }
        checkPurchaseAndDeliveryStatus().then(function(canWrite) {
            if (!canWrite) {
                alert('상품후기는 배송 완료된 상품에 대해서만 작성할 수 있습니다.\n구매하신 상품의 배송이 완료된 후 후기를 작성해주세요.');
                return;
            }
            openReviewModalInternal();
        }).catch(function(error) {
            console.error('구매 확인 오류:', error);
            alert('구매 정보를 확인하는 중 오류가 발생했습니다.');
        });
    } else {
        openReviewModalInternal();
    }
}

// 상품후기 모달 열기 (내부 함수)
function openReviewModalInternal() {

        const modal = document.getElementById('reviewModal');
        const titleInput = document.getElementById('reviewTitle');
        const contentInput = document.getElementById('reviewContent');
        const counterEl = document.getElementById('reviewContentCounter');
        const ratingValueInput = document.getElementById('reviewRatingValue');
        const ratingText = document.getElementById('reviewRatingText');
        const ratingStars = document.querySelectorAll('#reviewRating .star-icon');

        if (!modal || !titleInput || !contentInput) return;

        // 상품 정보 자동 입력
        if (PRODUCT_INFO && PRODUCT_INFO.name) {
            // 상품명은 모달에 없으므로 저장 시 사용
        }

        titleInput.value = '';
        contentInput.value = '';
        if (ratingValueInput) ratingValueInput.value = '0';
        if (ratingText) ratingText.textContent = '평점을 선택해주세요';
        if (counterEl) counterEl.textContent = '0';
        
        // 별점 초기화
        if (ratingStars && ratingStars.length > 0) {
            ratingStars.forEach(function(star) {
                star.classList.remove('fas');
                star.classList.add('far');
                star.style.color = '#ddd';
            });
        }

        // 평점 선택 기능 바인딩
        if (ratingStars && ratingStars.length > 0) {
            ratingStars.forEach(function(star) {
                star.onclick = function() {
                    const rating = parseInt(star.getAttribute('data-rating'));
                    setReviewRating(rating);
                };

                star.onmouseenter = function() {
                    const rating = parseInt(star.getAttribute('data-rating'));
                    highlightReviewStars(rating);
                };
            });

            const ratingContainer = document.getElementById('reviewRating');
            if (ratingContainer) {
                ratingContainer.onmouseleave = function() {
                    const currentRating = ratingValueInput ? parseInt(ratingValueInput.value) : 0;
                    highlightReviewStars(currentRating);
                };
            }
        }

        // 모달 닫기/저장 버튼 바인딩
        const closeBtn = document.getElementById('reviewModalClose');
        const cancelBtn = document.getElementById('reviewModalCancel');
        const saveBtn = document.getElementById('reviewModalSave');

        if (closeBtn) {
            closeBtn.onclick = closeReviewModal;
        }
        if (cancelBtn) {
            cancelBtn.onclick = closeReviewModal;
        }
        if (saveBtn) {
            saveBtn.onclick = saveReview;
        }

        // 텍스트 카운터
        if (contentInput && counterEl) {
            contentInput.oninput = function() {
                const length = contentInput.value.length;
                counterEl.textContent = length;
                if (length > 1000) {
                    counterEl.style.color = '#e53e3e';
                } else {
                    counterEl.style.color = '#667eea';
                }
            };
        }

    modal.style.display = 'flex';
}

// 상품후기 모달 닫기
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) modal.style.display = 'none';
}

// 평점 설정 함수
function setReviewRating(rating) {
    const ratingValueInput = document.getElementById('reviewRatingValue');
    const ratingText = document.getElementById('reviewRatingText');
    
    if (ratingValueInput) ratingValueInput.value = rating;
    highlightReviewStars(rating);
    if (ratingText) {
        const ratingLabels = ['', '매우 불만족', '불만족', '보통', '만족', '매우 만족'];
        ratingText.textContent = rating > 0 ? ratingLabels[rating] : '평점을 선택해주세요';
    }
}

// 별점 하이라이트 함수
function highlightReviewStars(rating) {
    const ratingStars = document.querySelectorAll('#reviewRating .star-icon');
    if (!ratingStars || ratingStars.length === 0) return;
    
    ratingStars.forEach(function(star, index) {
        const starRating = index + 1;
        if (starRating <= rating) {
            star.classList.remove('far');
            star.classList.add('fas');
            star.style.color = '#FFD700';
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
            star.style.color = '#ddd';
        }
    });
}

// 상품후기 저장
function saveReview() {
    var user = null;
    try {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            var raw = localStorage.getItem('loginUser');
            if (raw) user = JSON.parse(raw);
        }
    } catch (e) { /* ignore */ }

    var isAdmin = localStorage.getItem('isAdmin') === 'true' ||
                    (user && user.userId && (user.userId === 'admin' || user.role === 'admin'));

    if (!isAdmin) {
        if (!user || !user.userId) {
            alert('로그인이 필요합니다.');
            return;
        }
        checkPurchaseAndDeliveryStatus().then(function(canWrite) {
            if (!canWrite) {
                alert('상품후기는 배송 완료된 상품에 대해서만 작성할 수 있습니다.\n구매하신 상품의 배송이 완료된 후 후기를 작성해주세요.');
                return;
            }
            saveReviewInternal();
        }).catch(function(error) {
            console.error('구매 확인 오류:', error);
            alert('구매 정보를 확인하는 중 오류가 발생했습니다.');
        });
    } else {
        saveReviewInternal();
    }
}

// 상품후기 저장 (내부 함수)
function saveReviewInternal() {

    const titleInput = document.getElementById('reviewTitle');
    const contentInput = document.getElementById('reviewContent');
    const ratingValueInput = document.getElementById('reviewRatingValue');

    if (!titleInput || !contentInput || !ratingValueInput) return;

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const rating = parseInt(ratingValueInput.value) || 0;

        if (!rating || rating < 1 || rating > 5) {
            alert('평점을 선택해주세요.');
            return;
        }

        if (!title) {
            alert('제목을 입력해주세요.');
            return;
        }

        if (!content) {
            alert('내용을 입력해주세요.');
            return;
        }

        if (!PRODUCT_INFO || !PRODUCT_INFO.id) {
            alert('상품 정보를 불러올 수 없습니다.');
            return;
        }

        var user = null;
        try {
            if (localStorage.getItem('isLoggedIn') === 'true') {
                var raw = localStorage.getItem('loginUser');
                if (raw) user = JSON.parse(raw);
            }
        } catch (e) { /* ignore */ }

        var isAdmin = localStorage.getItem('isAdmin') === 'true' ||
                        (user && user.userId && (user.userId === 'admin' || user.role === 'admin'));

        if (!user || !user.userId) {
            if (!isAdmin) {
                alert('로그인이 필요합니다.');
                window.location.href = 'login.html';
                return;
            }
            user = { userId: 'admin', name: '관리자', authorName: '관리자' };
        }

        if (typeof firebase === 'undefined' || !firebase.firestore) {
            alert('Firebase를 사용할 수 없습니다.');
            return;
        }

        var db = firebase.firestore();
        var nickname = user.nickname || user.userId || user.name || (isAdmin ? '관리자' : '');
        const data = {
            boardType: 'review',
            reviewType: 'product',
            title: title,
            content: content,
            productId: String(PRODUCT_INFO.id), // 문자열로 변환
            productName: PRODUCT_INFO.name || '',
            productImage: PRODUCT_INFO.image || '',
            rating: rating,
            authorName: nickname,
            authorNickname: nickname,
            authorId: user.userId,
            status: 'published',
            viewCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('posts').add(data)
            .then(function(docRef) {
                alert('상품후기가 등록되었습니다.');
                closeReviewModal();
                // 페이지네이션을 1페이지로 초기화
                currentReviewPage = 1;
                // 후기 목록 새로고침
                loadProductReviews();
                // 마이페이지로 이동하지 않고 현재 페이지에 머무름
            })
            .catch(function(error) {
                console.error('상품후기 저장 오류:', error);
                alert('상품후기 등록에 실패했습니다.');
            });
}

// ============================================
// 구매 및 배송 완료 확인
// ============================================

// 구매 및 배송 완료 여부 확인
function checkPurchaseAndDeliveryStatus() {
    return new Promise(function(resolve, reject) {
        if (!PRODUCT_INFO || !PRODUCT_INFO.id) {
            resolve(false);
            return;
        }

        const user = (function() {
            if (localStorage.getItem('isLoggedIn') !== 'true') return null;
            try {
                const raw = localStorage.getItem('loginUser');
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        })();

        if (!user || !user.userId) {
            resolve(false);
            return;
        }

        // mypageApi를 통해 주문 목록 가져오기
        if (window.mypageApi && typeof window.mypageApi.getMyOrders === 'function') {
            window.mypageApi.getMyOrders().then(function(orders) {
                if (!orders || !Array.isArray(orders)) {
                    resolve(false);
                    return;
                }

                const productId = PRODUCT_INFO.id;
                const productName = PRODUCT_INFO.name || '';

                // 해당 상품을 구매하고 배송 완료 또는 입금확인(승인)된 주문이 있는지 확인
                const hasCompletedOrder = orders.some(function(order) {
                    const orderProductId = order.productId || '';
                    const orderProductName = order.productName || '';
                    const isSameProduct = (orderProductId && orderProductId === productId) || 
                                         (!orderProductId && orderProductName === productName);
                    const canReview = order.deliveryStatus === 'complete' || order.status === 'approved';
                    return isSameProduct && canReview;
                });

                resolve(hasCompletedOrder);
            }).catch(function(error) {
                console.error('주문 목록 조회 오류:', error);
                resolve(false);
            });
        } else {
            // mypageApi가 없으면 Firestore에서 직접 조회
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                resolve(false);
                return;
            }

            const db = firebase.firestore();
            const productId = PRODUCT_INFO.id;
            const productName = PRODUCT_INFO.name || '';

            // 주문 컬렉션에서 해당 사용자의 주문 조회 (배송 완료 또는 승인된 것만 후기 가능)
            db.collection('orders')
                .where('userId', '==', user.userId)
                .get()
                .then(function(snap) {
                    let hasCompletedOrder = false;
                    snap.docs.forEach(function(doc) {
                        const order = doc.data();
                        const orderProductId = order.productId || '';
                        const orderProductName = order.productName || '';
                        const isSameProduct = (orderProductId && orderProductId === productId) || 
                                             (!orderProductId && orderProductName === productName);
                        const canReview = order.deliveryStatus === 'complete' || order.status === 'approved';
                        if (isSameProduct && canReview) {
                            hasCompletedOrder = true;
                        }
                    });
                    resolve(hasCompletedOrder);
                })
                .catch(function(error) {
                    console.error('주문 조회 오류:', error);
                    resolve(false);
                });
        }
    });
}

// ============================================
// 상품후기 목록 로드 및 표시
// ============================================

// 상품후기 목록 로드
function loadProductReviews() {
    const reviewListContainer = document.getElementById('reviewListContainer');
    const reviewEmptyState = document.getElementById('reviewEmptyState');
    const reviewCountEl = document.getElementById('reviewCount');
    const reviewTabCountEl = document.querySelector('.tab-btn[data-tab="review"] .count');

    if (!reviewListContainer || !reviewEmptyState) return;

    function showEmpty() {
        if (reviewListContainer) reviewListContainer.innerHTML = '';
        if (reviewEmptyState) reviewEmptyState.style.display = 'block';
        if (reviewCountEl) reviewCountEl.textContent = '0';
        if (reviewTabCountEl) reviewTabCountEl.textContent = '0';
    }

    if (!PRODUCT_INFO || !PRODUCT_INFO.id) {
        showEmpty();
        return;
    }

    if (typeof firebase === 'undefined' || !firebase.firestore) {
        showEmpty();
        return;
    }

    const productId = PRODUCT_INFO.id;
    const db = firebase.firestore();
    const productIdStr = String(productId);
    
    db.collection('posts')
        .where('boardType', '==', 'review')
        .where('productId', '==', productIdStr)
        .get()
        .then(function(snap) {
            const reviews = [];
            let totalRating = 0;
            
            snap.docs.forEach(function(d) {
                const data = d.data();
                if (data.reviewType === 'usage') return;
                const review = { id: d.id, ...data };
                reviews.push(review);
                if (review.rating) {
                    totalRating += review.rating;
                }
            });
            
            // createdAt으로 정렬 (orderBy를 사용하지 않으므로 클라이언트에서 정렬)
            reviews.sort(function(a, b) {
                const at = (a.createdAt && a.createdAt.seconds != null) ? a.createdAt.seconds : 0;
                const bt = (b.createdAt && b.createdAt.seconds != null) ? b.createdAt.seconds : 0;
                return bt - at; // 내림차순
            });

            // 후기 개수 표시
            if (reviewCountEl) {
                reviewCountEl.textContent = reviews.length;
            }
            if (reviewTabCountEl) {
                reviewTabCountEl.textContent = reviews.length;
            }

            // 평균 평점 계산 및 표시
            const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
            updateReviewRatingDisplay(avgRating, reviews.length);

            if (reviews.length === 0) {
                showEmpty();
                return;
            }

            if (reviewEmptyState) reviewEmptyState.style.display = 'none';
            
            // 페이지네이션 처리
            const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);
            const startIndex = (currentReviewPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const currentReviews = reviews.slice(startIndex, endIndex);
            
            // 현재 사용자 확인
            const user = (function() {
                if (localStorage.getItem('isLoggedIn') !== 'true') return null;
                try {
                    const raw = localStorage.getItem('loginUser');
                    return raw ? JSON.parse(raw) : null;
                } catch (e) {
                    return null;
                }
            })();
            const currentUserId = user ? user.userId : null;
            
            // 후기 목록표 렌더링 (10개씩 페이지네이션)
            if (reviewListContainer) {
                const rows = currentReviews.map(function(review) {
                    const date = review.createdAt && review.createdAt.seconds 
                        ? new Date(review.createdAt.seconds * 1000).toLocaleDateString('ko-KR')
                        : '-';
                    const rating = review.rating || 0;
                    const authorName = review.authorName || '익명';
                    const authorId = review.authorId || '';
                    const isMyReview = currentUserId && authorId === currentUserId;
                    let starsHtml = '';
                    for (let i = 1; i <= 5; i++) {
                        starsHtml += i <= rating ? '<i class="fas fa-star" style="color:#FFD700;"></i>' : '<i class="far fa-star" style="color:#ddd;"></i>';
                    }
                    const deleteBtn = isMyReview 
                        ? '<button type="button" onclick="deleteProductReview(\'' + review.id + '\')" class="btn-review-delete">삭제</button>' 
                        : '';
                    const content = (review.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    var displayName = review.authorNickname || review.authorName || authorName;
                    return '<tr>' +
                        '<td class="review-td-title">' + (review.title || '제목 없음') + '</td>' +
                        '<td class="review-td-rating">' + starsHtml + '</td>' +
                        '<td class="review-td-author">' + displayName + '</td>' +
                        '<td class="review-td-date">' + date + '</td>' +
                        '<td class="review-td-content">' + content + '</td>' +
                        '<td class="review-td-action">' + deleteBtn + '</td>' +
                        '</tr>';
                }).join('');
                reviewListContainer.innerHTML = 
                    '<table class="review-list-table"><thead><tr>' +
                    '<th>제목</th><th>별점</th><th>작성자</th><th>날짜</th><th>내용</th><th>삭제</th>' +
                    '</tr></thead><tbody>' + rows + '</tbody></table>';
            }
            
            // 페이지네이션 UI 렌더링
            renderReviewPagination(totalPages, reviews.length);
        })
        .catch(function(error) {
            console.error('상품후기 로드 오류:', error);
            showEmpty();
        });
}

// 평점 표시 업데이트 (상단 통계 영역)
function updateReviewRatingDisplay(avgRating, reviewCount) {
    // 평점을 별표로 표시할 영역 찾기
    const ratingDisplay = document.querySelector('.product-stats .review-rating-display');
    
    // 상단 통계 영역에 평점 표시
    if (ratingDisplay) {
        if (reviewCount > 0 && avgRating > 0) {
            let starsHtml = '';
            const rating = Math.round(parseFloat(avgRating));
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    starsHtml += '<i class="fas fa-star" style="color: #FFD700; font-size: 14px;"></i>';
                } else {
                    starsHtml += '<i class="far fa-star" style="color: #ddd; font-size: 14px;"></i>';
                }
            }
            ratingDisplay.innerHTML = starsHtml + '<span style="color: #666; font-size: 13px; margin-left: 5px; display: inline; white-space: nowrap;">(' + avgRating + ')</span>';
            ratingDisplay.style.display = 'inline-flex';
            ratingDisplay.style.whiteSpace = 'nowrap';
            ratingDisplay.style.verticalAlign = 'middle';
            ratingDisplay.style.flexWrap = 'nowrap';
        } else {
            ratingDisplay.style.display = 'none';
        }
    }
}

// 관심상품 개수 업데이트 (Firestore/로컬 통합)
function updateWishlistCount() {
    if (!PRODUCT_INFO || !PRODUCT_INFO.id) return;
    var productId = String(PRODUCT_INFO.id);
    var getWishlist = window.wishlistCartFirebase && typeof window.wishlistCartFirebase.getWishlist === 'function'
        ? window.wishlistCartFirebase.getWishlist()
        : Promise.resolve(JSON.parse(localStorage.getItem('wishlist') || '[]'));
    getWishlist.then(function (wishlist) {
        var wishlistCount = wishlist.filter(function (item) {
            var itemId = String(item.id || item.productId || '');
            return itemId === productId;
        }).length;
        var likeStatusEl = document.getElementById('likeStatus');
        if (likeStatusEl) {
            likeStatusEl.textContent = wishlistCount > 0
                ? '이 상품을 좋아하는 회원 ' + wishlistCount + '명'
                : '이 상품을 좋아하는 회원이 없습니다.';
        }
    });
}

// ============================================
// 상품문의 목록 로드 및 표시
// ============================================

// 상품문의 목록 로드
function loadProductInquiries() {
    if (!PRODUCT_INFO || !PRODUCT_INFO.id) {
        return;
    }

    const productId = PRODUCT_INFO.id;
    const inquiryListContainer = document.getElementById('productInquiryListContainer');
    const inquiryEmptyState = document.getElementById('productInquiryEmptyState');
    const inquiryTabCountEl = document.querySelector('.tab-btn[data-tab="qna"] .count');

    if (!inquiryListContainer || !inquiryEmptyState) return;

    if (typeof firebase === 'undefined' || !firebase.firestore) {
        if (inquiryEmptyState) inquiryEmptyState.style.display = 'block';
        if (inquiryListContainer) inquiryListContainer.innerHTML = '';
        if (inquiryTabCountEl) inquiryTabCountEl.textContent = '0';
        return;
    }

    const db = firebase.firestore();
    
    // 상품 ID로 문의 조회 (상품 상세 페이지에서 작성한 문의만)
    // productId를 문자열로 변환하여 비교
    const productIdStr = String(productId);
    
    db.collection('posts')
        .where('boardType', '==', 'product-inquiry')
        .where('productId', '==', productIdStr)
        .get()
        .then(function(snap) {
            const inquiries = [];
            
            snap.docs.forEach(function(d) {
                const inquiry = { id: d.id, ...d.data() };
                inquiries.push(inquiry);
            });
            
            // createdAt으로 정렬 (orderBy를 사용하지 않으므로 클라이언트에서 정렬)
            inquiries.sort(function(a, b) {
                const at = (a.createdAt && a.createdAt.seconds != null) ? a.createdAt.seconds : 0;
                const bt = (b.createdAt && b.createdAt.seconds != null) ? b.createdAt.seconds : 0;
                return bt - at; // 내림차순
            });

            // 문의 개수 표시
            if (inquiryTabCountEl) {
                inquiryTabCountEl.textContent = inquiries.length;
            }

            if (inquiries.length === 0) {
                if (inquiryListContainer) inquiryListContainer.innerHTML = '';
                if (inquiryEmptyState) inquiryEmptyState.style.display = 'block';
                return;
            }

            if (inquiryEmptyState) inquiryEmptyState.style.display = 'none';
            
            // 페이지네이션 처리
            const totalPages = Math.ceil(inquiries.length / ITEMS_PER_PAGE);
            const startIndex = (currentInquiryPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const currentInquiries = inquiries.slice(startIndex, endIndex);
            
            // 현재 사용자 확인
            const user = (function() {
                if (localStorage.getItem('isLoggedIn') !== 'true') return null;
                try {
                    const raw = localStorage.getItem('loginUser');
                    return raw ? JSON.parse(raw) : null;
                } catch (e) {
                    return null;
                }
            })();
            const currentUserId = user ? user.userId : null;
            
            // 문의 목록 렌더링
            if (inquiryListContainer) {
                inquiryListContainer.innerHTML = currentInquiries.map(function(inquiry) {
                    const date = inquiry.createdAt && inquiry.createdAt.seconds 
                        ? new Date(inquiry.createdAt.seconds * 1000).toLocaleDateString('ko-KR')
                        : '-';
                    // authorId를 사용하되, 없으면 authorName 사용
                    const authorId = inquiry.authorId || inquiry.authorName || '익명';
                    const inquiryAuthorId = inquiry.authorId || '';
                    const isMyInquiry = currentUserId && inquiryAuthorId === currentUserId;
                    const answer = inquiry.answer || '';
                    const status = inquiry.status || 'pending';
                    const statusText = status === 'answered' ? '답변완료' : '답변대기';
                    const statusClass = status === 'answered' ? 'status-answered' : 'status-waiting';
                    
                    // 삭제 버튼 (내가 쓴 글일 때만 표시)
                    const deleteButton = isMyInquiry 
                        ? '<button onclick="deleteProductInquiryDetail(\'' + inquiry.id + '\')" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; margin-left: 10px;">삭제</button>'
                        : '';
                    
                    return '<div class="inquiry-item" style="border-bottom: 1px solid #e0e0e0; padding: 20px 0;">' +
                        '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; padding-left: 20px; padding-right: 20px;">' +
                        '<div style="flex: 1;">' +
                        '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">' +
                        '<strong style="font-size: 15px; color: #333; display: block;">' + (inquiry.title || '제목 없음') + '</strong>' +
                        '<span class="' + statusClass + '" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; ' +
                        (status === 'answered' ? 'background: #e6f7e6; color: #2d7d32;' : 'background: #fff3cd; color: #856404;') + '">' +
                        statusText + '</span>' +
                        '</div>' +
                        '<div style="display: flex; gap: 15px; font-size: 13px; color: #666; margin-top: 8px;">' +
                        '<span>' + authorId + '</span>' +
                        '<span>' + date + '</span>' +
                        '</div>' +
                        '</div>' +
                        deleteButton +
                        '</div>' +
                        '<div style="margin-top: 15px; padding-left: 20px; padding-right: 20px;">' +
                        '<p style="margin: 0 0 15px 0; color: #666; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">' + (inquiry.content || '') + '</p>' +
                        (answer ? '<div style="margin-top: 15px; padding: 20px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #667eea;">' +
                        '<strong style="color: #667eea; display: block; margin-bottom: 12px;">관리자 답변:</strong>' +
                        '<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">' + answer + '</p>' +
                        '</div>' : '') +
                        '</div>' +
                        '</div>';
                }).join('');
            }
            
            // 페이지네이션 UI 렌더링
            renderInquiryPagination(totalPages, inquiries.length);
        })
        .catch(function(error) {
            console.error('상품문의 목록 로드 오류:', error);
            if (inquiryListContainer) inquiryListContainer.innerHTML = '';
            if (inquiryEmptyState) inquiryEmptyState.style.display = 'block';
            if (inquiryTabCountEl) inquiryTabCountEl.textContent = '0';
        });
}

// ============================================
// 페이지네이션 함수
// ============================================

// 사용후기 페이지네이션 렌더링 (10개 미만이어도 항상 표시, 1페이지 인지 가능)
function renderReviewPagination(totalPages, totalItems) {
    const paginationContainer = document.getElementById('reviewPaginationContainer');
    if (!paginationContainer) return;
    
    if (totalPages < 1) totalPages = 1;
    paginationContainer.style.display = 'block';
    
    let paginationHtml = '<div style="display: flex; justify-content: center; align-items: center; gap: 5px;">';
    
    // 이전 버튼
    if (currentReviewPage > 1) {
        paginationHtml += '<button onclick="goToReviewPage(' + (currentReviewPage - 1) + ')" style="padding: 8px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">이전</button>';
    } else {
        paginationHtml += '<button disabled style="padding: 8px 12px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 4px; cursor: not-allowed; color: #999;">이전</button>';
    }
    
    // 페이지 번호 버튼
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentReviewPage) {
            paginationHtml += '<button onclick="goToReviewPage(' + i + ')" style="padding: 8px 12px; border: 1px solid #667eea; background: #667eea; color: white; border-radius: 4px; cursor: pointer; font-weight: bold;">' + i + '</button>';
        } else {
            paginationHtml += '<button onclick="goToReviewPage(' + i + ')" style="padding: 8px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">' + i + '</button>';
        }
    }
    
    // 다음 버튼
    if (currentReviewPage < totalPages) {
        paginationHtml += '<button onclick="goToReviewPage(' + (currentReviewPage + 1) + ')" style="padding: 8px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">다음</button>';
    } else {
        paginationHtml += '<button disabled style="padding: 8px 12px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 4px; cursor: not-allowed; color: #999;">다음</button>';
    }
    
    paginationHtml += '</div>';
    paginationContainer.innerHTML = paginationHtml;
}

// 사용후기 페이지 이동
function goToReviewPage(page) {
    currentReviewPage = page;
    loadProductReviews();
    // 페이지 상단으로 스크롤
    const reviewSection = document.getElementById('review');
    if (reviewSection) {
        reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 상품문의 페이지네이션 렌더링
function renderInquiryPagination(totalPages, totalItems) {
    const paginationContainer = document.getElementById('inquiryPaginationContainer');
    if (!paginationContainer) return;
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'block';
    
    let paginationHtml = '<div style="display: flex; justify-content: center; align-items: center; gap: 5px;">';
    
    // 이전 버튼
    if (currentInquiryPage > 1) {
        paginationHtml += '<button onclick="goToInquiryPage(' + (currentInquiryPage - 1) + ')" style="padding: 8px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">이전</button>';
    } else {
        paginationHtml += '<button disabled style="padding: 8px 12px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 4px; cursor: not-allowed; color: #999;">이전</button>';
    }
    
    // 페이지 번호 버튼
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentInquiryPage) {
            paginationHtml += '<button onclick="goToInquiryPage(' + i + ')" style="padding: 8px 12px; border: 1px solid #667eea; background: #667eea; color: white; border-radius: 4px; cursor: pointer; font-weight: bold;">' + i + '</button>';
        } else {
            paginationHtml += '<button onclick="goToInquiryPage(' + i + ')" style="padding: 8px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">' + i + '</button>';
        }
    }
    
    // 다음 버튼
    if (currentInquiryPage < totalPages) {
        paginationHtml += '<button onclick="goToInquiryPage(' + (currentInquiryPage + 1) + ')" style="padding: 8px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">다음</button>';
    } else {
        paginationHtml += '<button disabled style="padding: 8px 12px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 4px; cursor: not-allowed; color: #999;">다음</button>';
    }
    
    paginationHtml += '</div>';
    paginationContainer.innerHTML = paginationHtml;
}

// 상품문의 페이지 이동
function goToInquiryPage(page) {
    currentInquiryPage = page;
    loadProductInquiries();
    // 페이지 상단으로 스크롤
    const inquirySection = document.getElementById('qna');
    if (inquirySection) {
        inquirySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============================================
// 삭제 함수
// ============================================

// 상품후기 삭제
function deleteProductReview(reviewId) {
    if (!reviewId || !confirm('이 후기를 삭제하시겠습니까?')) return;
    
    const user = (function() {
        if (localStorage.getItem('isLoggedIn') !== 'true') return null;
        try {
            const raw = localStorage.getItem('loginUser');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    })();
    
    if (!user || !user.userId) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        alert('Firebase를 사용할 수 없습니다.');
        return;
    }
    
    const db = firebase.firestore();
    
    // 후기 확인 및 삭제
    db.collection('posts').doc(reviewId).get()
        .then(function(doc) {
            if (!doc.exists) {
                alert('후기를 찾을 수 없습니다.');
                return;
            }
            
            const review = doc.data();
            // 작성자 확인
            if (review.authorId !== user.userId) {
                alert('본인이 작성한 후기만 삭제할 수 있습니다.');
                return;
            }
            
            // 삭제 실행
            return db.collection('posts').doc(reviewId).delete();
        })
        .then(function() {
            alert('후기가 삭제되었습니다.');
            loadProductReviews();
        })
        .catch(function(error) {
            console.error('후기 삭제 오류:', error);
            alert('후기 삭제에 실패했습니다.');
        });
}

// 상품문의 삭제 (상품 상세 페이지)
function deleteProductInquiryDetail(inquiryId) {
    if (!inquiryId || !confirm('이 문의를 삭제하시겠습니까?')) return;
    
    const user = (function() {
        if (localStorage.getItem('isLoggedIn') !== 'true') return null;
        try {
            const raw = localStorage.getItem('loginUser');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    })();
    
    if (!user || !user.userId) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        alert('Firebase를 사용할 수 없습니다.');
        return;
    }
    
    const db = firebase.firestore();
    
    // 문의 확인 및 삭제
    db.collection('posts').doc(inquiryId).get()
        .then(function(doc) {
            if (!doc.exists) {
                alert('문의를 찾을 수 없습니다.');
                return;
            }
            
            const inquiry = doc.data();
            // 작성자 확인
            if (inquiry.authorId !== user.userId) {
                alert('본인이 작성한 문의만 삭제할 수 있습니다.');
                return;
            }
            
            // 삭제 실행
            return db.collection('posts').doc(inquiryId).delete();
        })
        .then(function() {
            alert('문의가 삭제되었습니다.');
            loadProductInquiries();
        })
        .catch(function(error) {
            console.error('문의 삭제 오류:', error);
            alert('문의 삭제에 실패했습니다.');
        });
}

// 전역 함수로 등록
window.goToReviewPage = goToReviewPage;
window.goToInquiryPage = goToInquiryPage;
window.deleteProductReview = deleteProductReview;
window.deleteProductInquiryDetail = deleteProductInquiryDetail;
