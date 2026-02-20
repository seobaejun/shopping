// 마이페이지 JavaScript
// 로그인 사용자 식별: mypageApi.getLoginUser(), getCurrentMemberId() 사용 (mypage-api.js)

// Firebase 초기화 대기 (mypage-api.js 사용 시 getMypageDb() 권장)
async function initFirebase() {
    if (window.mypageApi && typeof window.mypageApi.getMypageDb === 'function') {
        return window.mypageApi.getMypageDb();
    }
    return new Promise((resolve) => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            resolve(firebase.firestore());
        } else {
            setTimeout(() => {
                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    resolve(firebase.firestore());
                } else {
                    console.error('Firebase가 로드되지 않았습니다.');
                    resolve(null);
                }
            }, 1000);
        }
    });
}

// 페이지 초기화 (DOM 준비 후 또는 이미 로드됐으면 즉시 실행)
function runMypageInit() {
    (async function init() {
        console.log('마이페이지 로드 시작');

        // 로그인 사용자: mypageApi 있으면 통일된 getLoginUser() 사용
        const user = window.mypageApi && typeof window.mypageApi.getLoginUser === 'function'
            ? window.mypageApi.getLoginUser()
            : (() => {
                if (localStorage.getItem('isLoggedIn') !== 'true') return null;
                try {
                    const raw = localStorage.getItem('loginUser');
                    return raw ? JSON.parse(raw) : null;
                } catch (e) { return null; }
            })();

        if (!user || !user.userId) {
            alert('로그인이 필요합니다.');
            window.location.href = 'login.html';
            return;
        }

        console.log('로그인 사용자:', user);

        // docId 없으면 Firestore에서 조회해 localStorage에 보강 (식별자 통일)
        if (window.mypageApi && typeof window.mypageApi.getCurrentMemberId === 'function') {
            const ids = await window.mypageApi.getCurrentMemberId();
            if (ids && ids.docId && !user.docId) {
                const updated = { ...user, docId: ids.docId };
                try {
                    localStorage.setItem('loginUser', JSON.stringify(updated));
                } catch (e) { /* ignore */ }
            }
        }

        // Firestore 회원 + 주문 로드 후 표시
        var member = null;
        var orders = [];
        if (window.mypageApi) {
            try {
                member = await window.mypageApi.getCurrentMember();
                orders = await window.mypageApi.getMyOrders() || [];
            } catch (e) {
                console.warn('마이페이지 데이터 로드 실패:', e);
            }
        }
        window._mypageOrders = orders || [];
        displayUserInfo(user, member, orders);
        updateWishlistAndCartCount();
        renderOrderSteps(orders);
        renderOrderList(orders);
        renderNoticeList();
    fillProfileForm(member);
    fillMarketingForm(member);
    bindBankSelectToggle();
    bindProfileForm();
    bindMarketingForm();
    bindAddressSection();
    bindWithdrawSection();
    bindFaqSection();
    bindSectionNav();
    bindPostExpandClicks();
    if (window.location.search.indexOf('section=faq') !== -1) {
        var faqLink = document.querySelector('.mypage-nav a[data-section="faq"]');
        showSection('faq', faqLink || null);
    }
    if (window.location.search.indexOf('section=wishlist-cart') !== -1) {
        var wishlistCartLink = document.querySelector('.mypage-nav a[data-section="wishlist-cart"]');
        showSection('wishlist-cart', wishlistCartLink || null);
        
        // URL 파라미터에서 탭 정보 확인
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab === 'cart') {
            setTimeout(function() {
                const cartTab = document.querySelector('.wishlist-cart-tab[data-tab="cart"]');
                if (cartTab) cartTab.click();
            }, 100);
        }
    }
    if (window.location.search.indexOf('section=inquiry') !== -1) {
        var inquiryLink = document.querySelector('.mypage-nav a[data-section="inquiry"]');
        showSection('inquiry', inquiryLink || null);
    }
    if (window.location.search.indexOf('section=product-inquiry') !== -1) {
        var productInquiryLink = document.querySelector('.mypage-nav a[data-section="product-inquiry"]');
        showSection('product-inquiry', productInquiryLink || null);
    }

        // 정보수정 버튼: 클릭 시 회원정보 수정 섹션 표시
        var btnEdit = document.getElementById('mypageBtnInfoEdit') || document.querySelector('.btn-info-edit');
        if (btnEdit) {
            btnEdit.onclick = function () {
                var profileLink = document.querySelector('.mypage-nav a[data-section="profile"]');
                showSection('profile', profileLink || null);
                var profileSection = document.getElementById('mypageSectionProfile');
                if (profileSection) {
                    setTimeout(function () {
                        profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            };
            console.log('정보수정 버튼 연결됨');
        } else {
            console.warn('정보수정 버튼을 찾을 수 없음');
        }

        // 로그인 상태 업데이트 (script.js가 로드될 때까지 대기)
        var retryCount = 0;
        var maxRetries = 10;
        var updateHeaderInterval = setInterval(function () {
            if (typeof updateHeaderForLoginStatus === 'function') {
                updateHeaderForLoginStatus();
                clearInterval(updateHeaderInterval);
            } else {
                retryCount++;
                if (retryCount >= maxRetries) clearInterval(updateHeaderInterval);
            }
        }, 100);
    })();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runMypageInit);
} else {
    runMypageInit();
}

// 사용자 정보 표시 (회원 문서 + 주문 기반 지원금)
function displayUserInfo(user, member, orders) {
    member = member || user;
    const name = (member && member.name) || user.name || user.userId || (user.email && user.email.split('@')[0]) || '사용자';
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = name;

    let totalSupport = 0;
    if (orders && orders.length) {
        const approved = orders.filter(function (o) { return o.status === 'approved'; });
        approved.forEach(function (o) { totalSupport += (o.supportAmount || 0); });
    }
    const totalSupportEl = document.getElementById('totalSupport');
    const currentSupportEl = document.getElementById('currentSupport');
    const supportStr = totalSupport.toLocaleString() + '원';
    if (totalSupportEl) totalSupportEl.textContent = supportStr;
    if (currentSupportEl) currentSupportEl.textContent = supportStr;
    
    // 관심상품과 장바구니 개수 업데이트
    updateWishlistAndCartCount();
}

// 관심상품과 장바구니 개수 업데이트
function updateWishlistAndCartCount() {
    // 장바구니 개수
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartCount = cart.length || 0;
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) {
            cartCountEl.textContent = cartCount;
        }
    } catch (e) {
        console.warn('장바구니 개수 업데이트 실패:', e);
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) cartCountEl.textContent = '0';
    }
    
    // 관심상품 개수 (localStorage에서 wishlist 키 확인)
    try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const wishlistCount = wishlist.length || 0;
        const wishlistCountEl = document.getElementById('wishlistCount');
        if (wishlistCountEl) {
            wishlistCountEl.textContent = wishlistCount;
        }
    } catch (e) {
        console.warn('관심상품 개수 업데이트 실패:', e);
        const wishlistCountEl = document.getElementById('wishlistCount');
        if (wishlistCountEl) wishlistCountEl.textContent = '0';
    }
}

// 주문 단계별 건수 (주문/입금/준비/배송/완료)
function renderOrderSteps(orders) {
    if (!orders || !orders.length) {
        ['orderStep1', 'orderStep2', 'orderStep3', 'orderStep4', 'orderStep5'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
        return;
    }
    const pending = orders.filter(function (o) { return o.status === 'pending' || o.status === '대기'; });
    const approved = orders.filter(function (o) { return o.status === 'approved'; });
    const ready = approved.filter(function (o) { return (o.deliveryStatus || '') === 'ready'; });
    const shipping = orders.filter(function (o) { return o.deliveryStatus === 'shipping'; });
    const complete = orders.filter(function (o) { return o.deliveryStatus === 'complete'; });
    const step2 = approved.length;
    const el1 = document.getElementById('orderStep1');
    const el2 = document.getElementById('orderStep2');
    const el3 = document.getElementById('orderStep3');
    const el4 = document.getElementById('orderStep4');
    const el5 = document.getElementById('orderStep5');
    if (el1) el1.textContent = pending.length;
    if (el2) el2.textContent = step2;
    if (el3) el3.textContent = ready.length;
    if (el4) el4.textContent = shipping.length;
    if (el5) el5.textContent = complete.length;
}

// 쇼핑지원금 내역 테이블 (승인된 주문만)
function renderSupportList() {
    var tbody = document.getElementById('mypageSupportListBody');
    var summaryEl = document.getElementById('supportSummaryText');
    if (!tbody) return;
    var orders = window._mypageOrders || [];
    var list = orders.filter(function (o) { return o.status === 'approved'; });
    if (summaryEl) summaryEl.textContent = '승인된 주문 기준 쇼핑지원금 내역입니다. (총 ' + list.length + '건, 합계 ' + (list.reduce(function (s, o) { return s + (o.supportAmount || 0); }, 0)).toLocaleString() + '원)';
    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-message" style="padding: 20px; text-align: center;">내역이 없습니다.</td></tr>';
        return;
    }
    function formatDate(createdAt) {
        if (!createdAt) return '-';
        var ts = createdAt.seconds != null ? createdAt.seconds * 1000 : (createdAt.getTime ? createdAt.getTime() : 0);
        if (!ts) return '-';
        var d = new Date(ts);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    var html = list.map(function (o) {
        var date = formatDate(o.createdAt);
        var name = (o.productName || '-').replace(/</g, '&lt;');
        var support = (o.supportAmount != null ? o.supportAmount : 0).toLocaleString();
        return '<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">' + date + '</td><td style="padding: 10px;">' + name + '</td><td style="padding: 10px; text-align: right;">' + support + '원</td></tr>';
    }).join('');
    tbody.innerHTML = html;
}

// 공지사항 목록 (Firestore posts boardType 'notice')
function renderNoticeList() {
    var tbody = document.getElementById('mypageNoticeListBody');
    if (!tbody) return;
    if (!window.mypageApi || typeof window.mypageApi.getBoardPosts !== 'function') {
        tbody.innerHTML = '<tr><td colspan="2" class="empty-message" style="padding: 20px; text-align: center;">등록된 공지사항이 없습니다.</td></tr>';
        return;
    }
    window.mypageApi.getBoardPosts('notice').then(function (list) {
        if (!list || !list.length) {
            tbody.innerHTML = '<tr><td colspan="2" class="empty-message" style="padding: 20px; text-align: center;">등록된 공지사항이 없습니다.</td></tr>';
            return;
        }
        window._mypageNoticePosts = list;
        function formatDate(createdAt) {
            if (!createdAt || createdAt.seconds == null) return '-';
            var d = new Date(createdAt.seconds * 1000);
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        }
        var html = list.map(function (p) {
            var title = (p.title || '-').replace(/</g, '&lt;');
            var date = formatDate(p.createdAt);
            var content = (p.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            return '<tr class="notice-title-row" style="border-bottom: 1px solid #eee;"><td style="padding: 10px;"><a href="#" class="notice-title-link" data-id="' + (p.id || '') + '">' + title + '</a></td><td class="col-date" style="padding: 10px; text-align: right;">' + date + '</td></tr>' +
                '<tr class="notice-detail-row" id="notice-detail-' + (p.id || '') + '" style="display: none;"><td colspan="2" class="notice-detail-cell">' + content + '</td></tr>';
        }).join('');
        tbody.innerHTML = html;
    }).catch(function () {
        tbody.innerHTML = '<tr><td colspan="2" class="empty-message" style="padding: 20px; text-align: center;">등록된 공지사항이 없습니다.</td></tr>';
    });
}

// 이벤트 목록 (Firestore posts boardType 'event')
function renderEventsList() {
    var tbody = document.getElementById('mypageEventsListBody');
    if (!tbody) return;
    if (!window.mypageApi || typeof window.mypageApi.getBoardPosts !== 'function') {
        tbody.innerHTML = '<tr><td colspan="2" class="empty-message" style="padding: 20px; text-align: center;">등록된 이벤트가 없습니다.</td></tr>';
        return;
    }
    window.mypageApi.getBoardPosts('event').then(function (list) {
        if (!list || !list.length) {
            tbody.innerHTML = '<tr><td colspan="2" class="empty-message" style="padding: 20px; text-align: center;">등록된 이벤트가 없습니다.</td></tr>';
            return;
        }
        window._mypageEventPosts = list;
        function formatDate(createdAt) {
            if (!createdAt || createdAt.seconds == null) return '-';
            var d = new Date(createdAt.seconds * 1000);
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        }
        var html = list.map(function (p) {
            var title = (p.title || '-').replace(/</g, '&lt;');
            var date = formatDate(p.createdAt);
            var content = (p.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            return '<tr class="event-title-row" style="border-bottom: 1px solid #eee;"><td style="padding: 10px;"><a href="#" class="event-title-link" data-id="' + (p.id || '') + '">' + title + '</a></td><td class="col-date" style="padding: 10px; text-align: right;">' + date + '</td></tr>' +
                '<tr class="event-detail-row" id="event-detail-' + (p.id || '') + '" style="display: none;"><td colspan="2" class="notice-detail-cell">' + content + '</td></tr>';
        }).join('');
        tbody.innerHTML = html;
    }).catch(function () {
        tbody.innerHTML = '<tr><td colspan="2" class="empty-message" style="padding: 20px; text-align: center;">등록된 이벤트가 없습니다.</td></tr>';
    });
}

// 주첨결과 내역 (Firestore 연동 시 mypageApi.getMyLotteryResults 등으로 채우기)
function renderLotteryList() {
    var tbody = document.getElementById('mypageLotteryListBody');
    if (!tbody) return;
    if (window.mypageApi && typeof window.mypageApi.getMyLotteryResults === 'function') {
        window.mypageApi.getMyLotteryResults().then(function (list) {
            if (!list || !list.length) {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-message" style="padding: 20px; text-align: center;">확정된 주첨 결과가 없습니다.</td></tr>';
                return;
            }
            var html = list.map(function (r) {
                var round = (r.round || r.roundId || '-').toString().replace(/</g, '&lt;');
                var product = (r.productName || '-').replace(/</g, '&lt;');
                var result = r.result === 'winner' ? '당첨' : '미선정';
                var support = (r.support != null ? r.support : 0).toLocaleString();
                return '<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">' + round + '</td><td style="padding: 10px;">' + product + '</td><td style="padding: 10px; text-align: center;">' + result + '</td><td style="padding: 10px; text-align: right;">' + support + '원</td></tr>';
            }).join('');
            tbody.innerHTML = html;
        }).catch(function () {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-message" style="padding: 20px; text-align: center;">확정된 주첨 결과가 없습니다.</td></tr>';
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-message" style="padding: 20px; text-align: center;">확정된 주첨 결과가 없습니다.</td></tr>';
    }
}

// 주문 목록 테이블
function renderOrderList(orders) {
    const tbody = document.getElementById('mypageOrderListBody');
    if (!tbody) return;
    if (!orders || !orders.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message" style="padding: 20px; text-align: center;">주문 내역이 없습니다.</td></tr>';
        return;
    }
    function formatDate(createdAt) {
        if (!createdAt) return '-';
        const ts = createdAt.seconds != null ? createdAt.seconds * 1000 : (createdAt.getTime ? createdAt.getTime() : 0);
        if (!ts) return '-';
        const d = new Date(ts);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function statusLabel(o) {
        if (o.status === 'cancelled') return '취소';
        if (o.deliveryStatus === 'complete') return '배송완료';
        if (o.deliveryStatus === 'shipping') return '배송중';
        if (o.deliveryStatus === 'ready') return '배송준비';
        if (o.status === 'approved') return '입금확인';
        return '주문';
    }
    let html = '';
    orders.forEach(function (o) {
        const date = formatDate(o.createdAt);
        const name = (o.productName || '-').replace(/</g, '&lt;');
        const price = (o.price != null ? o.price : 0).toLocaleString();
        const support = (o.supportAmount != null ? o.supportAmount : 0).toLocaleString();
        const status = statusLabel(o);
        html += '<tr style="border-bottom: 1px solid #eee;"><td style="padding: 10px;">' + date + '</td><td style="padding: 10px;">' + name + '</td><td style="padding: 10px; text-align: right;">' + price + '원</td><td style="padding: 10px; text-align: right;">' + support + '원</td><td style="padding: 10px; text-align: center;">' + status + '</td></tr>';
    });
    tbody.innerHTML = html;
}

// 마케팅 수신동의 폼 채우기
function fillMarketingForm(member) {
    if (!member) return;
    var emailEl = document.getElementById('marketingEmail');
    var smsEl = document.getElementById('marketingSms');
    if (emailEl) emailEl.checked = member.marketingEmail === true;
    if (smsEl) smsEl.checked = member.marketingSms === true;
}

// 마케팅 수신동의 폼 바인딩
function bindMarketingForm() {
    var form = document.getElementById('mypageMarketingForm');
    var saveBtn = document.getElementById('mypageMarketingSave');
    if (!form || !window.mypageApi) return;
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var ids = await window.mypageApi.getCurrentMemberId();
        if (!ids || !ids.docId) {
            alert('로그인 정보를 확인할 수 없습니다.');
            return;
        }
        var emailEl = document.getElementById('marketingEmail');
        var smsEl = document.getElementById('marketingSms');
        var data = {
            marketingEmail: emailEl ? emailEl.checked : false,
            marketingSms: smsEl ? smsEl.checked : false
        };
        if (saveBtn) saveBtn.disabled = true;
        try {
            await window.mypageApi.updateMember(ids.docId, data);
            alert('저장되었습니다.');
        } catch (err) {
            console.error(err);
            alert('저장에 실패했습니다.');
        }
        if (saveBtn) saveBtn.disabled = false;
    });
}

// 배송지 목록 렌더
function renderAddressList() {
    var listEl = document.getElementById('addressList');
    var emptyEl = document.getElementById('addressEmpty');
    var addWrap = document.getElementById('addressAddWrap');
    if (!listEl || !emptyEl) return;
    listEl.innerHTML = '';
    if (!window.mypageApi) {
        emptyEl.style.display = 'block';
        if (addWrap) addWrap.style.display = 'block';
        return;
    }
    window.mypageApi.getCurrentMember().then(function (member) {
        var addresses = (member && member.addresses && Array.isArray(member.addresses)) ? member.addresses : [];
        if (!addresses.length) {
            listEl.innerHTML = '';
            emptyEl.style.display = 'block';
            if (addWrap) addWrap.style.display = 'block';
            return;
        }
        emptyEl.style.display = 'none';
        addresses.forEach(function (addr, idx) {
            var rec = (addr.recipientName || '').trim() || '수령인';
            var phone = (addr.phone || '').trim() || '';
            var post = (addr.postcode || '').trim();
            var addr1 = (addr.address || '').trim();
            var addr2 = (addr.detailAddress || '').trim();
            var fullAddr = [post, addr1, addr2].filter(Boolean).join(' ');
            var isDef = addr.isDefault === true;
            var li = document.createElement('li');
            li.className = 'address-item' + (isDef ? ' is-default' : '');
            li.innerHTML = '<div class="address-item-body">' +
                '<span class="address-recipient">' + escapeHtml(rec) + '</span>' +
                (isDef ? ' <span class="address-default-badge">기본</span>' : '') +
                '<p class="address-detail">' + escapeHtml(phone) + '</p>' +
                '<p class="address-detail">' + escapeHtml(fullAddr) + '</p>' +
                '</div>' +
                '<div class="address-item-actions">' +
                (isDef ? '' : '<button type="button" class="btn-address-set-default" data-index="' + idx + '">기본배송지</button>') +
                '<button type="button" class="btn-address-edit" data-index="' + idx + '">수정</button>' +
                '<button type="button" class="btn-address-delete" data-index="' + idx + '">삭제</button>' +
                '</div>';
            listEl.appendChild(li);
        });
        if (addWrap) addWrap.style.display = 'block';
    }).catch(function () {
        emptyEl.style.display = 'block';
        if (addWrap) addWrap.style.display = 'block';
    });
}

function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

// 배송지 섹션 바인딩 (추가/수정/삭제/기본)
function bindAddressSection() {
    var addBtn = document.getElementById('addressAddBtn');
    var cancelBtn = document.getElementById('addressCancelBtn');
    var formWrap = document.getElementById('addressFormWrap');
    var addWrap = document.getElementById('addressAddWrap');
    var form = document.getElementById('mypageAddressForm');
    var formTitle = document.getElementById('addressFormTitle');
    var editIndexEl = document.getElementById('addressEditIndex');
    if (!addBtn || !formWrap || !form || !window.mypageApi) return;

    function showForm(isEdit, index) {
        formTitle.textContent = isEdit ? '배송지 수정' : '배송지 추가';
        if (editIndexEl) editIndexEl.value = isEdit ? String(index) : '';
        clearAddressForm();
        if (isEdit && index >= 0) {
            window.mypageApi.getCurrentMember().then(function (member) {
                var addrs = (member && member.addresses) ? member.addresses : [];
                var addr = addrs[index];
                if (addr) {
                    setAddressFormValue(addr);
                }
            });
        }
        formWrap.style.display = 'block';
        if (addWrap) addWrap.style.display = 'none';
    }

    function hideForm() {
        formWrap.style.display = 'none';
        if (addWrap) addWrap.style.display = 'block';
        clearAddressForm();
        if (editIndexEl) editIndexEl.value = '';
    }

    addBtn.addEventListener('click', function () { showForm(false, -1); });
    if (cancelBtn) cancelBtn.addEventListener('click', hideForm);

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var ids = await window.mypageApi.getCurrentMemberId();
        if (!ids || !ids.docId) {
            alert('로그인 정보를 확인할 수 없습니다.');
            return;
        }
        var member = await window.mypageApi.getCurrentMember();
        var addresses = (member && member.addresses && Array.isArray(member.addresses)) ? member.addresses.slice() : [];
        var rec = (document.getElementById('addrRecipientName') && document.getElementById('addrRecipientName').value.trim()) || '';
        var phone = (document.getElementById('addrPhone') && document.getElementById('addrPhone').value.trim()) || '';
        var postcode = (document.getElementById('addrPostcode') && document.getElementById('addrPostcode').value.trim()) || '';
        var address = (document.getElementById('addrAddress') && document.getElementById('addrAddress').value.trim()) || '';
        var detailAddress = (document.getElementById('addrDetailAddress') && document.getElementById('addrDetailAddress').value.trim()) || '';
        var isDefault = document.getElementById('addrIsDefault') ? document.getElementById('addrIsDefault').checked : false;
        if (!rec) {
            alert('수령인을 입력해주세요.');
            return;
        }
        var payload = { recipientName: rec, phone: phone, postcode: postcode, address: address, detailAddress: detailAddress, isDefault: !!isDefault };
        var editIdx = editIndexEl && editIndexEl.value !== '' ? parseInt(editIndexEl.value, 10) : -1;
        if (editIdx >= 0 && editIdx < addresses.length) {
            if (isDefault) {
                addresses = addresses.map(function (a, i) { return { ...a, isDefault: i === editIdx }; });
            }
            addresses[editIdx] = payload;
        } else {
            if (isDefault) {
                addresses = addresses.map(function (a) { return { ...a, isDefault: false }; });
            }
            addresses.push(payload);
        }
        try {
            await window.mypageApi.updateMember(ids.docId, { addresses: addresses });
            alert('저장되었습니다.');
            hideForm();
            renderAddressList();
        } catch (err) {
            console.error(err);
            alert('저장에 실패했습니다.');
        }
    });

    document.getElementById('addressListWrap').addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.classList) return;
        var idx = t.getAttribute('data-index');
        if (idx == null) return;
        idx = parseInt(idx, 10);
        if (t.classList.contains('btn-address-edit')) {
            showForm(true, idx);
        } else if (t.classList.contains('btn-address-delete')) {
            if (!confirm('이 배송지를 삭제할까요?')) return;
            window.mypageApi.getCurrentMemberId().then(function (ids) {
                if (!ids || !ids.docId) return;
                return window.mypageApi.getCurrentMember().then(function (member) {
                    var addrs = (member && member.addresses) ? member.addresses.slice() : [];
                    addrs.splice(idx, 1);
                    return window.mypageApi.updateMember(ids.docId, { addresses: addrs });
                }).then(function () {
                    renderAddressList();
                });
            });
        } else if (t.classList.contains('btn-address-set-default')) {
            window.mypageApi.getCurrentMemberId().then(function (ids) {
                if (!ids || !ids.docId) return;
                return window.mypageApi.getCurrentMember().then(function (member) {
                    var addrs = (member && member.addresses) ? member.addresses.slice() : [];
                    addrs = addrs.map(function (a, i) { return { ...a, isDefault: i === idx }; });
                    return window.mypageApi.updateMember(ids.docId, { addresses: addrs });
                }).then(function () {
                    renderAddressList();
                });
            });
        }
    });
}

function clearAddressForm() {
    var ids = ['addrRecipientName', 'addrPhone', 'addrPostcode', 'addrAddress', 'addrDetailAddress'];
    ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });
    var def = document.getElementById('addrIsDefault');
    if (def) def.checked = false;
}

function setAddressFormValue(addr) {
    var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
    set('addrRecipientName', addr.recipientName);
    set('addrPhone', addr.phone);
    set('addrPostcode', addr.postcode);
    set('addrAddress', addr.address);
    set('addrDetailAddress', addr.detailAddress);
    var def = document.getElementById('addrIsDefault');
    if (def) def.checked = addr.isDefault === true;
}

// 회원탈퇴 섹션 바인딩
function bindWithdrawSection() {
    var form = document.getElementById('mypageWithdrawForm');
    var confirmCheck = document.getElementById('withdrawConfirm');
    var submitBtn = document.getElementById('mypageWithdrawBtn');
    if (!form || !confirmCheck || !submitBtn || !window.mypageApi) return;

    function updateButtonState() {
        submitBtn.disabled = !confirmCheck.checked;
    }
    confirmCheck.addEventListener('change', updateButtonState);
    updateButtonState();

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!confirmCheck.checked) {
            alert('탈퇴 동의에 체크해주세요.');
            return;
        }
        if (!confirm('회원탈퇴를 진행합니다. 되돌릴 수 없습니다. 계속하시겠습니까?')) return;
        var ids = await window.mypageApi.getCurrentMemberId();
        if (!ids || !ids.docId) {
            alert('로그인 정보를 확인할 수 없습니다.');
            return;
        }
        submitBtn.disabled = true;
        try {
            await window.mypageApi.withdrawMember(ids.docId);
            try {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('loginUser');
            } catch (e) { /* ignore */ }
            alert('탈퇴되었습니다. 이용해 주셔서 감사합니다.');
            window.location.href = 'index.html';
        } catch (err) {
            console.error(err);
            alert('탈퇴 처리에 실패했습니다.');
            submitBtn.disabled = false;
        }
    });
}

// 회원정보 수정 폼 바인딩
function bindProfileForm() {
    const form = document.getElementById('mypageProfileForm');
    const saveBtn = document.getElementById('mypageProfileSave');
    if (!form || !window.mypageApi) return;
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const ids = await window.mypageApi.getCurrentMemberId();
        if (!ids || !ids.docId) {
            alert('로그인 정보를 확인할 수 없습니다.');
            return;
        }
        const nameEl = document.getElementById('profileName');
        const phoneEl = document.getElementById('profilePhone');
        const postcodeEl = document.getElementById('profilePostcode');
        const addressEl = document.getElementById('profileAddress');
        const detailEl = document.getElementById('profileDetailAddress');
        const bankEl = document.getElementById('profileBank');
        const bankDirectEl = document.getElementById('profileBankDirect');
        const accountEl = document.getElementById('profileAccountNumber');
        var bankValue = (bankEl && bankEl.value === '직접입력' && bankDirectEl) ? bankDirectEl.value.trim() : (bankEl ? bankEl.value.trim() : '');
        const data = {
            name: nameEl ? nameEl.value.trim() : '',
            phone: phoneEl ? phoneEl.value.trim() : '',
            postcode: postcodeEl ? postcodeEl.value.trim() : '',
            address: addressEl ? addressEl.value.trim() : '',
            detailAddress: detailEl ? detailEl.value.trim() : '',
            bank: bankValue,
            accountNumber: accountEl ? accountEl.value.trim() : ''
        };
        if (saveBtn) saveBtn.disabled = true;
        try {
            await window.mypageApi.updateMember(ids.docId, data);
            alert('저장되었습니다.');
            const member = await window.mypageApi.getCurrentMember();
            fillProfileForm(member);
            const user = window.mypageApi.getLoginUser();
            if (user) displayUserInfo({ ...user, ...data }, member, window._mypageOrders || []);
        } catch (err) {
            console.error(err);
            alert('저장에 실패했습니다.');
        }
        if (saveBtn) saveBtn.disabled = false;
    });
}

// 은행 선택 ↔ 직접입력 전환
var PROFILE_BANK_OPTIONS = ['국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행', 'SC제일은행', '대구은행', '부산은행', '케이뱅크', '카카오뱅크', '토스뱅크', '우체국', '새마을금고', '신협'];

function bindBankSelectToggle() {
    var selectEl = document.getElementById('profileBank');
    var directWrap = document.querySelector('.profile-bank-direct-wrap');
    var selectWrap = document.querySelector('.profile-bank-select-wrap');
    if (!selectEl || !directWrap || !selectWrap) return;
    function toggle() {
        if (selectEl.value === '직접입력') {
            selectWrap.style.display = 'none';
            directWrap.style.display = 'block';
        } else {
            selectWrap.style.display = 'block';
            directWrap.style.display = 'none';
        }
    }
    selectEl.addEventListener('change', toggle);
    toggle();
}

// 프로필 폼 채우기 (회원 데이터로)
function fillProfileForm(member) {
    if (!member) return;
    const set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
    set('profileName', member.name);
    set('profilePhone', member.phone);
    set('profilePostcode', member.postcode);
    set('profileAddress', member.address);
    set('profileDetailAddress', member.detailAddress);
    set('profileAccountNumber', member.accountNumber);
    var bank = (member.bank || '').trim();
    var selectEl = document.getElementById('profileBank');
    var directEl = document.getElementById('profileBankDirect');
    var selectWrap = document.querySelector('.profile-bank-select-wrap');
    var directWrap = document.querySelector('.profile-bank-direct-wrap');
    if (selectEl && directEl && selectWrap && directWrap) {
        if (bank && PROFILE_BANK_OPTIONS.indexOf(bank) !== -1) {
            selectEl.value = bank;
            selectWrap.style.display = 'block';
            directWrap.style.display = 'none';
            directEl.value = '';
        } else if (bank) {
            selectEl.value = '직접입력';
            directEl.value = bank;
            selectWrap.style.display = 'none';
            directWrap.style.display = 'block';
        } else {
            selectEl.value = '';
            selectWrap.style.display = 'block';
            directWrap.style.display = 'none';
            directEl.value = '';
        }
    } else {
        set('profileBank', bank);
    }
}

// 자주 묻는 질문: Q&A 게시판 연동, 4개 카테고리 탭, 아코디언
var _faqListCache = [];

function getCurrentFaqCategory() {
    var tab = document.querySelector('.faq-tab.active');
    return (tab && tab.getAttribute('data-faq-category')) ? tab.getAttribute('data-faq-category') : '상품구매';
}

function renderFaqList() {
    var listEl = document.getElementById('faqAccordionList');
    var emptyEl = document.getElementById('faqEmpty');
    if (!listEl || !emptyEl) return;
    var category = getCurrentFaqCategory();
    var searchKw = (document.getElementById('faqSearchInput') && document.getElementById('faqSearchInput').value) ? document.getElementById('faqSearchInput').value.trim().toLowerCase() : '';
    var list = _faqListCache.filter(function (p) {
        var cat = (p.faqCategory || '상품구매').trim();
        if (cat !== category) return false;
        if (p.status === 'draft') return false;
        if (searchKw) {
            var title = (p.title || '').toLowerCase();
            var content = (p.content || '').toLowerCase();
            if (title.indexOf(searchKw) === -1 && content.indexOf(searchKw) === -1) return false;
        }
        return true;
    });
    listEl.innerHTML = '';
    emptyEl.style.display = list.length ? 'none' : 'block';
    list.forEach(function (p, idx) {
        var li = document.createElement('li');
        li.className = 'faq-accordion-item';
        li.setAttribute('data-faq-id', p.id || '');
        var title = (p.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var content = (p.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
        li.innerHTML = '<div class="faq-accordion-q"><span class="faq-q-icon">Q</span><span class="faq-q-text">' + title + '</span><span class="faq-accordion-toggle"><i class="fas fa-chevron-down"></i></span></div>' +
            '<div class="faq-accordion-a" style="display: none;"><span class="faq-a-icon">A</span><div class="faq-a-text">' + content + '</div></div>';
        listEl.appendChild(li);
    });
}

function bindFaqSection() {
    var wrap = document.getElementById('faqAccordionWrap');
    if (!wrap) return;
    document.querySelectorAll('.faq-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.faq-tab').forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            renderFaqList();
        });
    });
    var searchInput = document.getElementById('faqSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () { renderFaqList(); });
        searchInput.addEventListener('keyup', function (e) { if (e.key === 'Enter') renderFaqList(); });
    }
    wrap.addEventListener('click', function (e) {
        var qEl = e.target && e.target.closest ? e.target.closest('.faq-accordion-q') : null;
        if (!qEl) return;
        var item = qEl.closest('.faq-accordion-item');
        if (!item) return;
        var aEl = item.querySelector('.faq-accordion-a');
        if (!aEl) return;
        var isOpen = aEl.style.display !== 'none';
        aEl.style.display = isOpen ? 'none' : 'block';
    });
    if (!window.mypageApi || typeof window.mypageApi.getBoardPosts !== 'function') {
        document.getElementById('faqAccordionList').innerHTML = '';
        document.getElementById('faqEmpty').style.display = 'block';
        return;
    }
    window.mypageApi.getBoardPosts('qna', { limit: 200 }).then(function (list) {
        _faqListCache = list || [];
        renderFaqList();
    }).catch(function () {
        _faqListCache = [];
        renderFaqList();
    });
}

// 섹션 전환: orders, profile 표시/숨김
function bindSectionNav() {
    document.querySelectorAll('.mypage-nav a[onclick*="showSection"]').forEach(function (link) {
        const oldOnclick = link.getAttribute('onclick');
        if (!oldOnclick || oldOnclick.indexOf('showSection') === -1) return;
        link.removeAttribute('onclick');
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const m = oldOnclick.match(/showSection\s*\(\s*['"]([^'"]+)['"]/);
            const sectionName = m ? m[1] : '';
            showSection(sectionName, link);
        });
    });
}

// 섹션 전환 함수 (orders/notice 함께, profile/support/coupons/marketing/address/withdraw 단독 표시)
function showSection(sectionName, clickedLink) {
    if (!clickedLink) {
        clickedLink = document.querySelector('.mypage-nav a[data-section="' + sectionName + '"]');
    }
    const sections = document.querySelectorAll('.mypage-section');
    const soloSections = ['profile', 'support', 'coupons', 'notice', 'events', 'marketing', 'address', 'withdraw', 'faq'];
    const isSolo = soloSections.indexOf(sectionName) !== -1;
    sections.forEach(function (sec) {
        const dataSection = sec.getAttribute('data-section');
        let show = false;
        if (dataSection === sectionName) show = true;
        else if (!isSolo && (dataSection === 'orders' || dataSection === 'notice')) show = true;
        sec.style.display = show ? 'block' : 'none';
    });
    if (sectionName === 'support') renderSupportList();
    if (sectionName === 'coupons') renderLotteryList();
    if (sectionName === 'notice') renderNoticeList();
    if (sectionName === 'events') renderEventsList();
    if (sectionName === 'marketing') {
        if (window.mypageApi) {
            window.mypageApi.getCurrentMember().then(function (member) { fillMarketingForm(member); });
        }
    }
    if (sectionName === 'address') {
        renderAddressList();
        var formWrap = document.getElementById('addressFormWrap');
        var addWrap = document.getElementById('addressAddWrap');
        if (formWrap) formWrap.style.display = 'none';
        if (addWrap) addWrap.style.display = 'block';
    }
    if (sectionName === 'faq') renderFaqList();
    if (sectionName === 'wishlist-cart') {
        renderWishlistCartSection();
    }
    if (sectionName === 'inquiry') {
        renderInquiryList();
        bindInquirySection();
    }
    if (sectionName === 'product-inquiry') {
        renderProductInquiryList();
        bindProductInquirySection();
    }
    const navLinks = document.querySelectorAll('.nav-group a');
    navLinks.forEach(function (link) { link.classList.remove('active'); });
    if (clickedLink) clickedLink.classList.add('active');
    if (sectionName === 'profile') {
        if (window.mypageApi) {
            window.mypageApi.getCurrentMember().then(function (member) {
                fillProfileForm(member);
            });
        } else {
            try {
                var raw = localStorage.getItem('loginUser');
                if (raw) fillProfileForm(JSON.parse(raw));
            } catch (e) { /* ignore */ }
        }
    }
    const implemented = ['orders', 'profile', 'support', 'coupons', 'notice', 'events', 'marketing', 'address', 'withdraw', 'faq', 'wishlist-cart', 'inquiry', 'product-inquiry'];
    if (implemented.indexOf(sectionName) === -1) {
        alert(sectionName + ' 기능은 추후 구현 예정입니다.');
    }
}

// 관심상품/장바구니 섹션 렌더링
function renderWishlistCartSection() {
    renderWishlistList();
    renderCartList();
    bindWishlistCartTabs();
}

// 관심상품 목록 렌더링
function renderWishlistList() {
    const listEl = document.getElementById('wishlistList');
    const emptyEl = document.getElementById('wishlistEmpty');
    if (!listEl || !emptyEl) return;

    try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        
        if (wishlist.length === 0) {
            listEl.innerHTML = '';
            emptyEl.style.display = 'block';
            return;
        }

        emptyEl.style.display = 'none';
        listEl.innerHTML = wishlist.map(function(item) {
            return '<div class="wishlist-item" style="display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #e0e0e0;">' +
                '<div style="width: 100px; height: 100px; margin-right: 20px; background: #f5f5f5; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden;">' +
                (item.image ? '<img src="' + item.image + '" style="width: 100%; height: 100%; object-fit: cover;">' : '<i class="fas fa-image" style="font-size: 32px; color: #ddd;"></i>') +
                '</div>' +
                '<div style="flex: 1;">' +
                '<h4 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">' + (item.name || '상품명 없음') + '</h4>' +
                '<p style="margin: 0; color: #666; font-size: 14px;">' + (item.price ? item.price.toLocaleString() + '원' : '가격 정보 없음') + '</p>' +
                '</div>' +
                '<div style="display: flex; gap: 10px;">' +
                '<button type="button" class="btn btn-secondary" onclick="removeFromWishlist(\'' + item.id + '\')" style="padding: 8px 16px; font-size: 14px;">삭제</button>' +
                '<a href="product-detail.html?id=' + item.id + '" class="btn btn-primary" style="padding: 8px 16px; font-size: 14px; text-decoration: none; display: inline-block;">상세보기</a>' +
                '</div>' +
                '</div>';
        }).join('');
    } catch (e) {
        console.error('관심상품 목록 렌더링 오류:', e);
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
    }
}

// 장바구니 목록 렌더링
function renderCartList() {
    const listEl = document.getElementById('cartList');
    const emptyEl = document.getElementById('cartEmpty');
    if (!listEl || !emptyEl) return;

    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart.length === 0) {
            listEl.innerHTML = '';
            emptyEl.style.display = 'block';
            return;
        }

        emptyEl.style.display = 'none';
        listEl.innerHTML = cart.map(function(item, index) {
            return '<div class="cart-item" style="display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #e0e0e0;">' +
                '<div style="width: 100px; height: 100px; margin-right: 20px; background: #f5f5f5; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden;">' +
                (item.image ? '<img src="' + item.image + '" style="width: 100%; height: 100%; object-fit: cover;">' : '<i class="fas fa-image" style="font-size: 32px; color: #ddd;"></i>') +
                '</div>' +
                '<div style="flex: 1;">' +
                '<h4 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">' + (item.productName || '상품명 없음') + '</h4>' +
                '<p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">옵션: ' + (item.optionName || '기본') + '</p>' +
                '<p style="margin: 0; color: #666; font-size: 14px;">수량: ' + (item.quantity || 1) + '개 | ' + (item.price ? item.price.toLocaleString() + '원' : '가격 정보 없음') + '</p>' +
                '</div>' +
                '<div style="display: flex; gap: 10px;">' +
                '<button type="button" class="btn btn-secondary" onclick="removeFromCart(' + index + ')" style="padding: 8px 16px; font-size: 14px;">삭제</button>' +
                '<a href="product-detail.html?id=' + item.productId + '" class="btn btn-primary" style="padding: 8px 16px; font-size: 14px; text-decoration: none; display: inline-block;">상세보기</a>' +
                '</div>' +
                '</div>';
        }).join('');
    } catch (e) {
        console.error('장바구니 목록 렌더링 오류:', e);
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
    }
}

// 관심상품/장바구니 탭 전환
function bindWishlistCartTabs() {
    const tabs = document.querySelectorAll('.wishlist-cart-tab');
    const wishlistContent = document.getElementById('wishlistTabContent');
    const cartContent = document.getElementById('cartTabContent');

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            const tabType = tab.getAttribute('data-tab');
            
            // 탭 활성화
            tabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            
            // 콘텐츠 표시/숨김
            if (tabType === 'wishlist') {
                wishlistContent.style.display = 'block';
                cartContent.style.display = 'none';
            } else {
                wishlistContent.style.display = 'none';
                cartContent.style.display = 'block';
            }
        });
    });
}

// 관심상품에서 제거
function removeFromWishlist(productId) {
    if (!confirm('관심상품에서 제거하시겠습니까?')) return;
    
    try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const filtered = wishlist.filter(function(item) { return item.id !== productId; });
        localStorage.setItem('wishlist', JSON.stringify(filtered));
        
        renderWishlistList();
        updateWishlistAndCartCount();
        alert('관심상품에서 제거되었습니다.');
    } catch (e) {
        console.error('관심상품 제거 오류:', e);
        alert('오류가 발생했습니다.');
    }
}

// 장바구니에서 제거
function removeFromCart(index) {
    if (!confirm('장바구니에서 제거하시겠습니까?')) return;
    
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        
        renderCartList();
        updateWishlistAndCartCount();
        alert('장바구니에서 제거되었습니다.');
    } catch (e) {
        console.error('장바구니 제거 오류:', e);
        alert('오류가 발생했습니다.');
    }
}

// 전역 함수로 노출
window.removeFromWishlist = removeFromWishlist;
window.removeFromCart = removeFromCart;

// 공지/이벤트 제목 클릭 시 아래 행 펼치기/접기
function bindPostExpandClicks() {
    document.addEventListener('click', function (e) {
        var link = e.target && e.target.closest ? e.target.closest('a.notice-title-link, a.event-title-link') : null;
        if (!link) return;
        e.preventDefault();
        var id = link.getAttribute('data-id') || '';
        var isEvent = link.classList.contains('event-title-link');
        var table = link.closest('table');
        if (!table) return;
        var detailRow = document.getElementById(isEvent ? 'event-detail-' + id : 'notice-detail-' + id);
        if (!detailRow) return;
        var isOpen = detailRow.style.display !== 'none';
        var allDetailRows = table.querySelectorAll(isEvent ? '.event-detail-row' : '.notice-detail-row');
        allDetailRows.forEach(function (row) { row.style.display = 'none'; });
        if (!isOpen) detailRow.style.display = '';
    });
}

// 1:1문의 목록 렌더링
function renderInquiryList() {
    const listEl = document.getElementById('inquiryList');
    const emptyEl = document.getElementById('inquiryEmpty');
    if (!listEl || !emptyEl) return;

    const user = window.mypageApi && typeof window.mypageApi.getLoginUser === 'function'
        ? window.mypageApi.getLoginUser()
        : null;
    
    if (!user || !user.userId) {
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }

    // Firestore에서 현재 사용자의 1:1문의만 조회
    if (!window.mypageApi || typeof window.mypageApi.getMypageDb !== 'function') {
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }

    window.mypageApi.getMypageDb().then(function(db) {
        if (!db) {
            listEl.innerHTML = '';
            emptyEl.style.display = 'block';
            return;
        }

        // boardType이 'inquiry'이고 authorId가 현재 사용자인 것만 조회
        db.collection('posts')
            .where('boardType', '==', 'inquiry')
            .where('authorId', '==', user.userId)
            .get()
            .then(function(snap) {
                let list = [];
                snap.docs.forEach(function(d) {
                    list.push({ id: d.id, ...d.data() });
                });
                
                // 상품 관련 문의 제외 (productId가 있거나 카테고리가 '상품'인 것 제외)
                list = list.filter(function(item) {
                    return !item.productId && item.inquiryCategory !== '상품';
                });
                
                list.sort(function(a, b) {
                    const at = (a.createdAt && a.createdAt.seconds != null) ? a.createdAt.seconds : 0;
                    const bt = (b.createdAt && b.createdAt.seconds != null) ? b.createdAt.seconds : 0;
                    return bt - at;
                });

                if (list.length === 0) {
                    listEl.innerHTML = '';
                    emptyEl.style.display = 'block';
                    return;
                }

                emptyEl.style.display = 'none';
                listEl.innerHTML = list.map(function(item) {
                    const date = item.createdAt && item.createdAt.seconds 
                        ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('ko-KR')
                        : '-';
                    const status = item.status === 'answered' ? '답변완료' : '답변대기';
                    const statusClass = item.status === 'answered' ? 'status-answered' : 'status-waiting';
                    const answer = item.answer || '';
                    
                    const inquiryCategory = item.inquiryCategory || '기타';
                    
                    return '<div class="inquiry-item" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: #fff;">' +
                        '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">' +
                        '<div style="flex: 1;">' +
                        '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">' +
                        '<h4 style="margin: 0; font-size: 16px; color: #333;">' + (item.title || '제목 없음') + '</h4>' +
                        '<span class="' + statusClass + '" style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; ' +
                        (item.status === 'answered' ? 'background: #e8f5e9; color: #2e7d32;' : 'background: #fff3e0; color: #e65100;') + '">' + status + '</span>' +
                        '</div>' +
                        '<div style="margin-bottom: 8px;">' +
                        '<span style="font-size: 13px; color: #666; background: #f0f0f0; padding: 4px 10px; border-radius: 4px; display: inline-block;">' +
                        '<i class="fas fa-tag" style="margin-right: 5px;"></i>' + inquiryCategory + '</span>' +
                        '</div>' +
                        '<div style="display: flex; gap: 15px; font-size: 13px; color: #666;">' +
                        '<span>작성일: ' + date + '</span>' +
                        '</div>' +
                        '</div>' +
                        '<button type="button" class="btn btn-secondary" onclick="deleteInquiry(\'' + item.id + '\')" style="padding: 6px 12px; font-size: 13px;">삭제</button>' +
                        '</div>' +
                        '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">' +
                        '<p style="margin: 0 0 10px 0; color: #666; font-size: 14px; white-space: pre-wrap;">' + (item.content || '') + '</p>' +
                        (answer ? '<div style="margin-top: 15px; padding: 15px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #333;">' +
                        '<strong style="color: #333; display: block; margin-bottom: 8px;">관리자 답변:</strong>' +
                        '<p style="margin: 0; color: #666; font-size: 14px; white-space: pre-wrap;">' + answer + '</p>' +
                        '</div>' : '') +
                        '</div>' +
                        '</div>';
                }).join('');
            })
            .catch(function(error) {
                console.error('1:1문의 목록 로드 오류:', error);
                listEl.innerHTML = '';
                emptyEl.style.display = 'block';
            });
    });
}

// 1:1문의 섹션 이벤트 바인딩
function bindInquirySection() {
    const writeBtn = document.getElementById('btnInquiryWrite');
    const modal = document.getElementById('inquiryModal');
    const closeBtn = document.getElementById('inquiryModalClose');
    const cancelBtn = document.getElementById('inquiryModalCancel');
    const saveBtn = document.getElementById('inquiryModalSave');

    if (writeBtn) {
        writeBtn.addEventListener('click', function() {
            openInquiryModal();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeInquiryModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeInquiryModal();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveInquiry();
        });
    }

    // 텍스트 카운터
    const contentInput = document.getElementById('inquiryContent');
    const counterEl = document.getElementById('inquiryContentCounter');
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
                closeInquiryModal();
            }
        });
    }
}

// 1:1문의 모달 열기
function openInquiryModal() {
    const modal = document.getElementById('inquiryModal');
    const titleEl = document.getElementById('inquiryModalTitle');
    const idEl = document.getElementById('inquiryId');
    const titleInput = document.getElementById('inquiryTitle');
    const contentInput = document.getElementById('inquiryContent');
    const categorySelect = document.getElementById('inquiryCategory');

    if (!modal || !titleEl || !idEl || !titleInput || !contentInput) return;

    idEl.value = '';
    titleEl.textContent = '1:1문의 작성';
    titleInput.value = '';
    contentInput.value = '';
    if (categorySelect) categorySelect.value = '기타';
    modal.style.display = 'flex';
}

// 1:1문의 모달 닫기
function closeInquiryModal() {
    const modal = document.getElementById('inquiryModal');
    if (modal) modal.style.display = 'none';
}

// 1:1문의 저장
function saveInquiry() {
    const idEl = document.getElementById('inquiryId');
    const titleInput = document.getElementById('inquiryTitle');
    const contentInput = document.getElementById('inquiryContent');
    const categorySelect = document.getElementById('inquiryCategory');

    if (!titleInput || !contentInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const category = categorySelect ? categorySelect.value : '기타';

    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }

    if (!content) {
        alert('내용을 입력해주세요.');
        return;
    }

    const user = window.mypageApi && typeof window.mypageApi.getLoginUser === 'function'
        ? window.mypageApi.getLoginUser()
        : null;

    if (!user || !user.userId) {
        alert('로그인이 필요합니다.');
        return;
    }

    if (!window.mypageApi || typeof window.mypageApi.getMypageDb !== 'function') {
        alert('데이터베이스에 연결할 수 없습니다.');
        return;
    }

    window.mypageApi.getMypageDb().then(function(db) {
        if (!db) {
            alert('데이터베이스에 연결할 수 없습니다.');
            return;
        }

        const data = {
            boardType: 'inquiry',
            title: title,
            content: content,
            inquiryCategory: category,
            authorName: user.name || user.userId,
            authorId: user.userId,
            status: 'pending',
            viewCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('posts').add(data)
            .then(function(docRef) {
                alert('문의가 등록되었습니다.');
                closeInquiryModal();
                renderInquiryList();
            })
            .catch(function(error) {
                console.error('1:1문의 저장 오류:', error);
                alert('문의 등록에 실패했습니다.');
            });
    });
}

// 1:1문의 삭제
function deleteInquiry(inquiryId) {
    if (!inquiryId || !confirm('이 문의를 삭제하시겠습니까?')) return;

    if (!window.mypageApi || typeof window.mypageApi.getMypageDb !== 'function') {
        alert('데이터베이스에 연결할 수 없습니다.');
        return;
    }

    window.mypageApi.getMypageDb().then(function(db) {
        if (!db) {
            alert('데이터베이스에 연결할 수 없습니다.');
            return;
        }

        db.collection('posts').doc(inquiryId).delete()
            .then(function() {
                alert('문의가 삭제되었습니다.');
                renderInquiryList();
            })
            .catch(function(error) {
                console.error('1:1문의 삭제 오류:', error);
                alert('문의 삭제에 실패했습니다.');
            });
    });
}

// 상품문의 목록 렌더링
function renderProductInquiryList() {
    const listEl = document.getElementById('productInquiryList');
    const emptyEl = document.getElementById('productInquiryEmpty');
    if (!listEl || !emptyEl) return;

    const user = window.mypageApi && typeof window.mypageApi.getLoginUser === 'function'
        ? window.mypageApi.getLoginUser()
        : null;
    
    if (!user || !user.userId) {
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }

    if (!window.mypageApi || typeof window.mypageApi.getMypageDb !== 'function') {
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
        return;
    }

    window.mypageApi.getMypageDb().then(function(db) {
        if (!db) {
            listEl.innerHTML = '';
            emptyEl.style.display = 'block';
            return;
        }

        // boardType이 'product-inquiry'이고 authorId가 현재 사용자인 것만 조회
        db.collection('posts')
            .where('boardType', '==', 'product-inquiry')
            .where('authorId', '==', user.userId)
            .get()
            .then(function(snap) {
                const list = [];
                snap.docs.forEach(function(d) {
                    list.push({ id: d.id, ...d.data() });
                });
                list.sort(function(a, b) {
                    const at = (a.createdAt && a.createdAt.seconds != null) ? a.createdAt.seconds : 0;
                    const bt = (b.createdAt && b.createdAt.seconds != null) ? b.createdAt.seconds : 0;
                    return bt - at;
                });

                if (list.length === 0) {
                    listEl.innerHTML = '';
                    emptyEl.style.display = 'block';
                    return;
                }

                emptyEl.style.display = 'none';
                listEl.innerHTML = list.map(function(item) {
                    const date = item.createdAt && item.createdAt.seconds 
                        ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('ko-KR')
                        : '-';
                    const status = item.status === 'answered' ? '답변완료' : '답변대기';
                    const statusClass = item.status === 'answered' ? 'status-answered' : 'status-waiting';
                    const answer = item.answer || '';
                    const productName = item.productName || '상품명 없음';
                    const productId = item.productId || '';
                    
                    return '<div class="inquiry-item" style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px; background: #fff;">' +
                        '<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">' +
                        '<div style="flex: 1;">' +
                        '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">' +
                        '<h4 style="margin: 0; font-size: 16px; color: #333;">' + (item.title || '제목 없음') + '</h4>' +
                        '<span class="' + statusClass + '" style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; ' +
                        (item.status === 'answered' ? 'background: #e8f5e9; color: #2e7d32;' : 'background: #fff3e0; color: #e65100;') + '">' + status + '</span>' +
                        '</div>' +
                        '<div style="margin-bottom: 8px;">' +
                        '<span style="font-size: 13px; color: #666; background: #f0f0f0; padding: 4px 10px; border-radius: 4px; display: inline-block;">' +
                        '<i class="fas fa-shopping-bag" style="margin-right: 5px;"></i>' + productName + '</span>' +
                        '</div>' +
                        '<div style="display: flex; gap: 15px; font-size: 13px; color: #666;">' +
                        '<span>작성일: ' + date + '</span>' +
                        '</div>' +
                        '</div>' +
                        '<button type="button" class="btn btn-secondary" onclick="deleteProductInquiry(\'' + item.id + '\')" style="padding: 6px 12px; font-size: 13px;">삭제</button>' +
                        '</div>' +
                        '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">' +
                        '<p style="margin: 0 0 10px 0; color: #666; font-size: 14px; white-space: pre-wrap;">' + (item.content || '') + '</p>' +
                        (answer ? '<div style="margin-top: 15px; padding: 15px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #333;">' +
                        '<strong style="color: #333; display: block; margin-bottom: 8px;">관리자 답변:</strong>' +
                        '<p style="margin: 0; color: #666; font-size: 14px; white-space: pre-wrap;">' + answer + '</p>' +
                        '</div>' : '') +
                        '</div>' +
                        '</div>';
                }).join('');
            })
            .catch(function(error) {
                console.error('상품문의 목록 로드 오류:', error);
                listEl.innerHTML = '';
                emptyEl.style.display = 'block';
            });
    });
}

// 상품문의 삭제
function deleteProductInquiry(inquiryId) {
    if (!inquiryId || !confirm('이 문의를 삭제하시겠습니까?')) return;

    if (!window.mypageApi || typeof window.mypageApi.getMypageDb !== 'function') {
        alert('데이터베이스에 연결할 수 없습니다.');
        return;
    }

    window.mypageApi.getMypageDb().then(function(db) {
        if (!db) {
            alert('데이터베이스에 연결할 수 없습니다.');
            return;
        }

        db.collection('posts').doc(inquiryId).delete()
            .then(function() {
                alert('문의가 삭제되었습니다.');
                renderProductInquiryList();
            })
            .catch(function(error) {
                console.error('상품문의 삭제 오류:', error);
                alert('문의 삭제에 실패했습니다.');
            });
    });
}

// 상품문의 섹션 이벤트 바인딩
function bindProductInquirySection() {
    const writeBtn = document.getElementById('btnProductInquiryWriteMypage');
    const modal = document.getElementById('productInquiryModalMypage');
    const closeBtn = document.getElementById('productInquiryModalMypageClose');
    const cancelBtn = document.getElementById('productInquiryModalMypageCancel');
    const saveBtn = document.getElementById('productInquiryModalMypageSave');
    const contentInput = document.getElementById('productInquiryMypageContent');
    const counterEl = document.getElementById('productInquiryMypageContentCounter');
    const productNameInput = document.getElementById('productInquiryMypageProductName');

    if (writeBtn) {
        writeBtn.addEventListener('click', function() {
            openProductInquiryModalMypage();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeProductInquiryModalMypage();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeProductInquiryModalMypage();
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveProductInquiryMypage();
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
                closeProductInquiryModalMypage();
            }
        });
    }
}

// 상품문의 모달 열기 (마이페이지용)
function openProductInquiryModalMypage() {
    const modal = document.getElementById('productInquiryModalMypage');
    const titleInput = document.getElementById('productInquiryMypageTitle');
    const contentInput = document.getElementById('productInquiryMypageContent');
    const counterEl = document.getElementById('productInquiryMypageContentCounter');
    const productNameInput = document.getElementById('productInquiryMypageProductName');

    if (!modal || !titleInput || !contentInput || !productNameInput) return;

    titleInput.value = '';
    contentInput.value = '';
    productNameInput.value = '';
    if (counterEl) counterEl.textContent = '0';
    modal.style.display = 'flex';
}

// 상품문의 모달 닫기 (마이페이지용)
function closeProductInquiryModalMypage() {
    const modal = document.getElementById('productInquiryModalMypage');
    if (modal) modal.style.display = 'none';
}

// 상품문의 저장 (마이페이지용)
function saveProductInquiryMypage() {
    const titleInput = document.getElementById('productInquiryMypageTitle');
    const contentInput = document.getElementById('productInquiryMypageContent');
    const productNameInput = document.getElementById('productInquiryMypageProductName');

    if (!titleInput || !contentInput || !productNameInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const productName = productNameInput.value.trim();

    if (!productName) {
        alert('상품명을 입력해주세요.');
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

    const user = window.mypageApi && typeof window.mypageApi.getLoginUser === 'function'
        ? window.mypageApi.getLoginUser()
        : null;

    if (!user || !user.userId) {
        alert('로그인이 필요합니다.');
        return;
    }

    if (!window.mypageApi || typeof window.mypageApi.getMypageDb !== 'function') {
        alert('데이터베이스에 연결할 수 없습니다.');
        return;
    }

    const db = window.mypageApi.getMypageDb();
    db.then(function(database) {
        if (!database) {
            alert('데이터베이스에 연결할 수 없습니다.');
            return;
        }

        const data = {
            boardType: 'product-inquiry',
            title: title,
            content: content,
            productId: '', // 상품명만 입력하는 경우 productId는 빈 값
            productName: productName,
            productImage: '',
            authorName: user.name || user.userId,
            authorId: user.userId,
            status: 'pending',
            viewCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        return database.collection('posts').add(data);
    })
    .then(function(docRef) {
        if (!docRef) return;
        alert('상품문의가 등록되었습니다.');
        closeProductInquiryModalMypage();
        renderProductInquiryList();
    })
    .catch(function(error) {
        console.error('상품문의 저장 오류:', error);
        alert('상품문의 등록에 실패했습니다.');
    });
}

// 전역 함수로 노출
window.showSection = showSection;
window.deleteInquiry = deleteInquiry;
window.removeFromWishlist = removeFromWishlist;
window.removeFromCart = removeFromCart;
window.deleteProductInquiry = deleteProductInquiry;
