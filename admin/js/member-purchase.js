// trix 지원금 표시: 실제 값을 소수점 8자리까지 그대로 표시 (9번째 자리 버림)
function formatTrix(value) {
    var num = Number(value) || 0;
    var truncated = Math.floor(num * 1e8) / 1e8;
    return truncated.toFixed(8);
}

// 개인별 구매 누적정보 페이지 관리
console.log('🔵 member-purchase.js 로드됨');

// Firebase 초기화 대기 함수
async function waitForFirebaseAdminPurchase(maxWait = 10000) {
    const startTime = Date.now();
    let waitCount = 0;
    
    console.log('🔵 구매정보: Firebase Admin 대기 시작...');
    
    while (!window.firebaseAdmin) {
        waitCount++;
        if (Date.now() - startTime > maxWait) {
            console.error('Firebase Admin 초기화 시간 초과');
            throw new Error('Firebase Admin이 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        }
        if (waitCount % 10 === 0) {
            console.log(`구매정보: Firebase Admin 대기 중... (${waitCount * 100}ms 경과)`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ 구매정보: Firebase Admin 발견됨');
    
    // Firebase 초기화 확인 및 실행
    if (!window.firebaseAdmin.db) {
        console.log('구매정보: Firebase DB 초기화 중...');
        if (window.firebaseAdmin.initFirebase) {
            await window.firebaseAdmin.initFirebase();
        } else {
            throw new Error('initFirebase 함수를 찾을 수 없습니다.');
        }
    }
    
    console.log('✅ 구매정보: Firebase Admin 초기화 완료');
    return window.firebaseAdmin;
}

/** MD 관리자 전용: Firebase Admin 대기 (타임아웃 시 null 반환, 예외 없음) */
async function waitForFirebaseAdminPurchaseMdOptional(maxWait = 3000) {
    const startTime = Date.now();
    while (!window.firebaseAdmin) {
        if (Date.now() - startTime > maxWait) {
            console.warn('MD 관리자: 구매정보 Firebase Admin 대기 타임아웃, window.db로 진행');
            return null;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!window.firebaseAdmin.db && window.firebaseAdmin.initFirebase) {
        await window.firebaseAdmin.initFirebase();
    }
    return window.firebaseAdmin;
}

// 구매 정보 검색 함수
window.searchMemberPurchase = async function() {
    try {
        const keyword = document.getElementById('purchaseSearchKeyword')?.value.trim();
        
        if (!keyword) {
            alert('아이디 또는 이름을 입력해주세요.');
            return;
        }
        
        console.log('🔵 구매 정보 검색 시작:', keyword);
        
        var firebaseAdmin = null;
        if (window.isMdAdmin && window.mdFirebase && typeof window.mdFirebase.getAllowedMembers === 'function') {
            firebaseAdmin = await waitForFirebaseAdminPurchaseMdOptional(3000);
        }
        if (!firebaseAdmin && !window.isMdAdmin) {
            firebaseAdmin = await waitForFirebaseAdminPurchase();
        }
        
        // 회원 목록 (MD일 때 getAllowedMembers 사용; firebaseAdmin이 null이어도 window.db로 구매 내역 조회)
        var members;
        if (window.isMdAdmin && window.mdFirebase && typeof window.mdFirebase.getAllowedMembers === 'function') {
            members = await window.mdFirebase.getAllowedMembers();
        } else {
            members = await firebaseAdmin.memberService.getMembers();
        }
        function normalizeSearchText(value) {
            if (value == null) return '';
            return String(value)
                .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
                .replace(/\s+/g, '')
                .trim()
                .toLowerCase();
        }

        function isMatchedMemberByKeyword(m, normalizedKeyword) {
            if (!m) return false;
            var uid = normalizeSearchText(m.userId || m.id || '');
            var nm = normalizeSearchText(m.name || '');
            var userNm = normalizeSearchText(m.userName || '');
            var em = normalizeSearchText(m.email || '');
            return (uid && uid.indexOf(normalizedKeyword) !== -1)
                || (nm && nm.indexOf(normalizedKeyword) !== -1)
                || (userNm && userNm.indexOf(normalizedKeyword) !== -1)
                || (em && em.indexOf(normalizedKeyword) !== -1);
        }
        function isExactMatchedMemberByKeyword(m, normalizedKeyword) {
            if (!m) return false;
            var uid = normalizeSearchText(m.userId || m.id || '');
            var nm = normalizeSearchText(m.name || '');
            var userNm = normalizeSearchText(m.userName || '');
            var em = normalizeSearchText(m.email || '');
            return uid === normalizedKeyword
                || nm === normalizedKeyword
                || userNm === normalizedKeyword
                || em === normalizedKeyword;
        }

        // 날짜 범위 (동명이인 해소 시에도 동일 조건으로 구매 건수 비교)
        const startDate = document.getElementById('purchaseStartDate')?.value;
        const endDate = document.getElementById('purchaseEndDate')?.value;

        var keywordNorm = normalizeSearchText(keyword);
        var merged = members.slice();
        var member = null;

        // 이름/아이디 검색 정확도 확보: mdFirebase.searchMembers 결과를 우선 병합해 다시 매칭
        if (window.mdFirebase && typeof window.mdFirebase.searchMembers === 'function') {
            try {
                var searched = await window.mdFirebase.searchMembers(keyword);
                var byId = Object.create(null);
                var mergedList = [];
                members.forEach(function (m) {
                    var k = String(m.id || m.docId || m.userId || '').trim();
                    if (k && !byId[k]) {
                        byId[k] = true;
                        mergedList.push(m);
                    }
                });
                (searched || []).forEach(function (m) {
                    var k = String(m.id || m.docId || m.userId || '').trim();
                    if (!k || byId[k]) return;
                    byId[k] = true;
                    mergedList.push(m);
                });
                merged = mergedList;
            } catch (e) {
                console.warn('purchase 검색 폴백(searchMembers) 실패:', e);
            }
        }

        var exactCandidates = merged.filter(function (m) { return isExactMatchedMemberByKeyword(m, keywordNorm); });
        var fuzzyCandidates = merged.filter(function (m) { return isMatchedMemberByKeyword(m, keywordNorm); });
        var candidates = exactCandidates.length > 0 ? exactCandidates : fuzzyCandidates;

        // 이름 검색은 동명이인/부분일치가 많아 잘못된 회원을 집는 경우가 있음.
        // 후보가 여러 명이면 같은 기간 실제 구매 건수가 가장 많은 회원을 선택.
        var chosenPurchases = null;
        if (candidates.length === 1) {
            member = candidates[0];
        } else if (candidates.length > 1) {
            var best = null;
            for (var ci = 0; ci < candidates.length; ci++) {
                var cand = candidates[ci];
                var candId = cand.userId || cand.id;
                if (!candId) continue;
                var candPurchases = await getMemberPurchases(candId, startDate, endDate, firebaseAdmin);
                var score = candPurchases.length;
                if (!best || score > best.score) {
                    best = { member: cand, purchases: candPurchases, score: score };
                }
            }
            if (best) {
                member = best.member;
                chosenPurchases = best.purchases;
            }
        }
        
        if (!member) {
            alert('해당 회원을 찾을 수 없습니다.');
            return;
        }
        
        console.log('✅ 회원 찾음:', member);
        
        const searchId = member.userId || member.id;
        const purchases = chosenPurchases || await getMemberPurchases(searchId, startDate, endDate, firebaseAdmin);
        var paidSupport = 0;
        var paidSupportByOrderId = {};
        if (window.isMdAdmin) {
            var mdSupport = await getPaidSupportMdFallback(member.userId, member.id, member.email);
            paidSupport = mdSupport.totalSupport;
            paidSupportByOrderId = mdSupport.byOrderId || {};
        }
        if ((paidSupport === 0 && Object.keys(paidSupportByOrderId).length === 0) && firebaseAdmin && firebaseAdmin.lotteryConfirmedService) {
            if (typeof firebaseAdmin.lotteryConfirmedService.getPaidSupportByMember === 'function') {
                var byMember = await firebaseAdmin.lotteryConfirmedService.getPaidSupportByMember();
                paidSupport = byMember[member.userId] ?? byMember[member.id] ?? 0;
            }
            if (typeof firebaseAdmin.lotteryConfirmedService.getPaidSupportByOrderId === 'function') {
                paidSupportByOrderId = await firebaseAdmin.lotteryConfirmedService.getPaidSupportByOrderId(member.userId, member.id);
            }
        }
        console.log('✅ 구매 내역:', purchases.length, '건, 지급완료 지원금:', paidSupport, 'byOrderId 키 수:', Object.keys(paidSupportByOrderId).length);
        var tokenDeposits = await getMemberTokenPurchases(member, startDate, endDate, firebaseAdmin);
        displayPurchaseResults(member, purchases, paidSupport, paidSupportByOrderId, tokenDeposits);
        
    } catch (error) {
        console.error('❌ 구매 정보 검색 오류:', error);
        alert('구매 정보 검색 중 오류가 발생했습니다: ' + error.message);
    }
};

/** MD 관리자 전용: window.db로 지급완료 지원금 합계·orderId별 맵 조회 */
async function getPaidSupportMdFallback(memberUserId, memberId, memberEmail) {
    var db = window.db || (window.firebaseAdmin && window.firebaseAdmin.db);
    if (!db && typeof firebase !== 'undefined' && firebase.firestore) db = firebase.firestore();
    if (!db) {
        console.warn('getPaidSupportMdFallback: db 없음');
        return { totalSupport: 0, byOrderId: {} };
    }
    try {
        var snap = await db.collection('lotteryConfirmedResults').get();
        var total = 0;
        var byOrderId = {};
        var uid = (memberUserId || '').toString().trim();
        var mid = (memberId != null && memberId !== '') ? String(memberId).trim() : '';
        var uEmail = (memberEmail || '').toString().trim();
        snap.docs.forEach(function (doc) {
            var d = doc.data();
            if ((d.paymentStatus || '').toString().toLowerCase() !== 'paid') return;
            var dUid = (d.userId || '').toString().trim();
            var dMid = (d.memberId != null && d.memberId !== '') ? String(d.memberId).trim() : '';
            var match = (uid && (dUid === uid || dMid === uid)) || (mid && (dMid === mid || dUid === mid)) || (uEmail && (dUid === uEmail || dUid.toLowerCase() === uEmail.toLowerCase()));
            if (!match) return;
            var support = Number(d.support != null ? d.support : d.supportAmount) || 0;
            total += support;
            var oid = (d.orderId != null ? d.orderId : '').toString().trim();
            if (oid) byOrderId[oid] = (byOrderId[oid] || 0) + support;
        });
        console.log('🔵 getPaidSupportMdFallback:', total, 'trix, orderId 수:', Object.keys(byOrderId).length);
        return { totalSupport: total, byOrderId: byOrderId };
    } catch (e) {
        console.warn('getPaidSupportMdFallback 오류:', e);
        return { totalSupport: 0, byOrderId: {} };
    }
}

// 회원의 구매 내역 가져오기 (orders 컬렉션에서 조회). firebaseAdmin이 null이면 window.db 사용(MD 폴백)
async function getMemberPurchases(memberId, startDate, endDate, firebaseAdminArg) {
    try {
        const db = (firebaseAdminArg && firebaseAdminArg.db) ? firebaseAdminArg.db : (window.db || (window.firebaseAdmin && window.firebaseAdmin.db));
        if (!db) {
            console.error('구매 내역 조회: DB를 사용할 수 없습니다.');
            return [];
        }
        const snapshot = await db.collection('orders').get();
        
        const startMs = startDate ? new Date(startDate + 'T00:00:00').getTime() : null;
        const endMs = endDate ? new Date(endDate + 'T23:59:59.999').getTime() : null;
        
        const purchases = [];
        snapshot.forEach(function (doc) {
            var data = doc.data();
            var uid = data.userId || data.memberId || '';
            if (uid !== memberId && data.memberId !== memberId) return;
            
            var ts = null;
            if (data.createdAt && data.createdAt.toDate) ts = data.createdAt.toDate().getTime();
            else if (data.createdAt && data.createdAt.seconds) ts = data.createdAt.seconds * 1000;
            
            if (startMs && ts && ts < startMs) return;
            if (endMs && ts && ts > endMs) return;
            
            purchases.push({
                id: doc.id,
                purchaseDate: data.createdAt,
                productName: data.productName || '-',
                productPrice: data.productPrice || data.amount || 0,
                supportAmount: data.supportAmount || 0,
                status: data.status || '-',
                ...data
            });
        });
        
        purchases.sort(function (a, b) {
            var ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
            var tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
            return tb - ta;
        });
        
        console.log('✅ ' + memberId + '의 구매 내역 ' + purchases.length + '건 조회');
        return purchases;
        
    } catch (error) {
        console.error('❌ 구매 내역 조회 오류:', error);
        return [];
    }
}

function getTokenDepositCreatedAtMs(createdAt) {
    if (!createdAt) return null;
    try {
        if (typeof createdAt.toDate === 'function') {
            var d = createdAt.toDate();
            if (d && !isNaN(d.getTime())) return d.getTime();
        }
        if (createdAt.seconds != null) {
            var s = createdAt.seconds;
            if (typeof s === 'object' && typeof s.valueOf === 'function') s = s.valueOf();
            var sec = typeof s === 'number' ? s : parseInt(s, 10);
            if (!isNaN(sec)) return sec * 1000;
        }
    } catch (e) { /* ignore */ }
    return null;
}

/** 회원의 토큰 구매(입금) 내역 — tokenDeposits, type import 제외, 날짜 필터 동일 */
async function getMemberTokenPurchases(member, startDate, endDate, firebaseAdminArg) {
    try {
        var db = (firebaseAdminArg && firebaseAdminArg.db) ? firebaseAdminArg.db : (window.db || (window.firebaseAdmin && window.firebaseAdmin.db));
        if (!db || !member) {
            return [];
        }
        var startMs = startDate ? new Date(startDate + 'T00:00:00').getTime() : null;
        var endMs = endDate ? new Date(endDate + 'T23:59:59.999').getTime() : null;
        var merged = {};

        function mergeSnap(snap) {
            snap.docs.forEach(function (doc) {
                var data = doc.data();
                if (data.type === 'import') return;
                var ts = getTokenDepositCreatedAtMs(data.createdAt);
                if (startMs != null && (ts == null || ts < startMs)) return;
                if (endMs != null && (ts == null || ts > endMs)) return;
                merged[doc.id] = Object.assign({ id: doc.id }, data);
            });
        }

        var uidStr = member.userId != null ? String(member.userId).trim() : '';
        var memberDocId = member.id != null ? String(member.id).trim() : '';

        try {
            if (uidStr) {
                var q1 = await db.collection('tokenDeposits').where('userId', '==', uidStr).get();
                mergeSnap(q1);
                var n = parseInt(uidStr, 10);
                if (!isNaN(n) && String(n) === uidStr && /^\d+$/.test(uidStr)) {
                    var q1n = await db.collection('tokenDeposits').where('userId', '==', n).get();
                    mergeSnap(q1n);
                }
            }
        } catch (e1) {
            console.warn('tokenDeposits userId 조회 실패:', e1);
        }
        try {
            if (memberDocId) {
                var q2 = await db.collection('tokenDeposits').where('memberId', '==', memberDocId).get();
                mergeSnap(q2);
            }
        } catch (e2) {
            console.warn('tokenDeposits memberId 조회 실패:', e2);
        }

        var list = Object.keys(merged).map(function (k) { return merged[k]; });
        list.sort(function (a, b) {
            var ta = getTokenDepositCreatedAtMs(a.createdAt) || 0;
            var tb = getTokenDepositCreatedAtMs(b.createdAt) || 0;
            return tb - ta;
        });
        console.log('✅ 토큰 구매(입금) 내역 ' + list.length + '건');
        return list;
    } catch (err) {
        console.error('❌ 토큰 구매 내역 조회 오류:', err);
        return [];
    }
}

function tokenDepositStatusLabel(status) {
    var map = { pending: '대기', approved: '승인', cancelled: '취소' };
    return map[status] || status || '-';
}

// 검색 결과 표시. totalPaidSupport=지급완료 지원금 합계, paidSupportByOrderId=행별 지급완료 지원금 맵
function displayPurchaseResults(member, purchases, totalPaidSupport, paidSupportByOrderId, tokenDeposits) {
    paidSupportByOrderId = paidSupportByOrderId || {};
    const resultsContainer = document.getElementById('purchaseResultsContainer');
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
    }
    
    document.getElementById('memberInfoUserId').textContent = member.userId || member.id || '-';
    document.getElementById('memberInfoName').textContent = member.name || '-';
    var phoneEl = document.getElementById('memberInfoPhone');
    if (phoneEl) {
        var phoneRow = phoneEl.closest('div');
        if (window.isMdAdmin && phoneRow) {
            phoneRow.style.display = 'none';
        } else if (phoneRow) {
            phoneRow.style.display = '';
            phoneEl.textContent = member.phone || '-';
        } else {
            phoneEl.textContent = member.phone || '-';
        }
    }
    
    const totalCount = purchases.length;
    const totalAmount = purchases.reduce((sum, p) => sum + (p.productPrice || 0), 0);
    const totalSupport = (totalPaidSupport != null && totalPaidSupport !== undefined)
        ? Number(totalPaidSupport)
        : purchases.reduce((sum, p) => sum + (p.supportAmount || 0), 0);
    const totalTokenPurchaseAmount = (tokenDeposits || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const totalTokenPurchaseQuantity = (tokenDeposits || []).reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
    
    document.getElementById('totalPurchaseCount').textContent = totalCount.toLocaleString();
    document.getElementById('totalPurchaseAmount').textContent = totalAmount.toLocaleString();
    document.getElementById('totalSupportAmount').textContent = formatTrix(totalSupport);
    var totalTokenPurchaseAmountEl = document.getElementById('totalTokenPurchaseAmount');
    if (totalTokenPurchaseAmountEl) totalTokenPurchaseAmountEl.textContent = totalTokenPurchaseAmount.toLocaleString();
    var totalTokenPurchaseQuantityEl = document.getElementById('totalTokenPurchaseQuantity');
    if (totalTokenPurchaseQuantityEl) totalTokenPurchaseQuantityEl.textContent = totalTokenPurchaseQuantity.toLocaleString();
    
    renderPurchaseDetailTable(purchases, paidSupportByOrderId);
    renderTokenPurchaseDetailTable(tokenDeposits || []);
}

// 구매 상세 내역 테이블 렌더링. 지원금 컬럼은 지급완료된 금액만 표시(paidSupportByOrderId[orderId], 없으면 0)
function renderPurchaseDetailTable(purchases, paidSupportByOrderId) {
    paidSupportByOrderId = paidSupportByOrderId || {};
    const tbody = document.getElementById('purchaseDetailBody');
    
    if (!tbody) {
        console.error('❌ purchaseDetailBody를 찾을 수 없습니다.');
        return;
    }
    
    if (!purchases || purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">구매 내역이 없습니다.</td></tr>';
        return;
    }
    
    const tableHTML = purchases.map((purchase, index) => {
        let purchaseDate = '-';
        var dateSource = purchase.createdAt || purchase.purchaseDate;
        if (dateSource) {
            if (dateSource.toDate) {
                purchaseDate = dateSource.toDate().toLocaleString('ko-KR');
            } else if (dateSource.seconds) {
                purchaseDate = new Date(dateSource.seconds * 1000).toLocaleString('ko-KR');
            } else {
                purchaseDate = new Date(dateSource).toLocaleString('ko-KR');
            }
        }
        
        var paidSupport = (paidSupportByOrderId[purchase.id] != null ? Number(paidSupportByOrderId[purchase.id]) : (paidSupportByOrderId[purchase.orderId] != null ? Number(paidSupportByOrderId[purchase.orderId]) : 0));
        var isPaid = paidSupport > 0;
        
        var statusDisplay, statusClass;
        if (isPaid) {
            statusDisplay = '지급완료';
            statusClass = 'badge-success';
        } else {
            var statusRaw = (purchase.status || '완료').toLowerCase();
            var statusMap = { pending: '대기', approved: '승인', cancelled: '취소', '완료': '완료', '대기': '대기', '정상': '승인', '취소': '취소' };
            statusDisplay = statusMap[statusRaw] || purchase.status || '완료';
            statusClass = (statusRaw === 'approved' || statusRaw === '승인' || statusRaw === '완료') ? 'badge-success' :
                               (statusRaw === 'pending' || statusRaw === '대기') ? 'badge-warning' :
                               (statusRaw === 'cancelled' || statusRaw === '취소') ? 'badge-secondary' : 'badge-danger';
        }
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${purchaseDate}</td>
                <td>${purchase.productName || '-'}</td>
                <td>${(purchase.productPrice || 0).toLocaleString()}원</td>
                <td>${formatTrix(paidSupport)} trix</td>
                <td><span class="badge ${statusClass}">${statusDisplay}</span></td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = tableHTML;
}

function renderTokenPurchaseDetailTable(deposits) {
    var tbody = document.getElementById('tokenPurchaseDetailBody');
    if (!tbody) {
        return;
    }
    if (!deposits || deposits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">토큰 구매 내역이 없습니다.</td></tr>';
        return;
    }
    var rows = deposits.map(function (d, index) {
        var dateStr = '-';
        var src = d.createdAt;
        if (src) {
            if (src.toDate) {
                dateStr = src.toDate().toLocaleString('ko-KR');
            } else if (src.seconds) {
                dateStr = new Date(src.seconds * 1000).toLocaleString('ko-KR');
            }
        }
        var qty = Number(d.quantity) || 0;
        var amount = Number(d.amount) || 0;
        var st = tokenDepositStatusLabel(d.status);
        var statusRaw = (d.status || '').toString().toLowerCase();
        var statusClass = statusRaw === 'approved' ? 'badge-success' :
            statusRaw === 'pending' ? 'badge-warning' :
            statusRaw === 'cancelled' ? 'badge-secondary' : 'badge-danger';
        return '<tr>' +
            '<td>' + (index + 1) + '</td>' +
            '<td>' + dateStr + '</td>' +
            '<td>' + qty.toLocaleString() + '</td>' +
            '<td>' + amount.toLocaleString() + '원</td>' +
            '<td><span class="badge ' + statusClass + '">' + st + '</span></td>' +
            '</tr>';
    }).join('');
    tbody.innerHTML = rows;
}

// 검색 초기화
window.resetMemberPurchase = function() {
    document.getElementById('purchaseSearchKeyword').value = '';
    document.getElementById('purchaseStartDate').value = '';
    document.getElementById('purchaseEndDate').value = '';
    
    // 결과 영역 숨기기
    const resultsContainer = document.getElementById('purchaseResultsContainer');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    var tokenTbody = document.getElementById('tokenPurchaseDetailBody');
    if (tokenTbody) tokenTbody.innerHTML = '';
    var totalTokenPurchaseAmountEl = document.getElementById('totalTokenPurchaseAmount');
    if (totalTokenPurchaseAmountEl) totalTokenPurchaseAmountEl.textContent = '0';
    var totalTokenPurchaseQuantityEl = document.getElementById('totalTokenPurchaseQuantity');
    if (totalTokenPurchaseQuantityEl) totalTokenPurchaseQuantityEl.textContent = '0';
};

// 페이지 진입 시 초기화 (loadPageData에서 호출)
window.initMemberPurchasePage = function() {
    const keywordInput = document.getElementById('purchaseSearchKeyword');
    const startDateInput = document.getElementById('purchaseStartDate');
    const endDateInput = document.getElementById('purchaseEndDate');
    const resultsContainer = document.getElementById('purchaseResultsContainer');
    const detailBody = document.getElementById('purchaseDetailBody');
    const tokenDetailBody = document.getElementById('tokenPurchaseDetailBody');

    if (keywordInput) keywordInput.value = '';
    if (startDateInput) {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        startDateInput.value = oneMonthAgo.toISOString().split('T')[0];
    }
    if (endDateInput) endDateInput.value = new Date().toISOString().split('T')[0];
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (detailBody) detailBody.innerHTML = '';
    if (tokenDetailBody) tokenDetailBody.innerHTML = '';
    var totalTokenPurchaseAmountEl = document.getElementById('totalTokenPurchaseAmount');
    if (totalTokenPurchaseAmountEl) totalTokenPurchaseAmountEl.textContent = '0';
    var totalTokenPurchaseQuantityEl = document.getElementById('totalTokenPurchaseQuantity');
    if (totalTokenPurchaseQuantityEl) totalTokenPurchaseQuantityEl.textContent = '0';
};

// 페이지 로드 시 날짜 초기화
(function() {
    console.log('🔵 member-purchase.js 초기화');
    
    // DOM이 준비되면 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPurchasePage);
    } else {
        initPurchasePage();
    }
    
    function initPurchasePage() {
        // 오늘 날짜로 종료일 설정
        const today = new Date().toISOString().split('T')[0];
        const endDateInput = document.getElementById('purchaseEndDate');
        if (endDateInput && !endDateInput.value) {
            endDateInput.value = today;
        }
        
        // 한 달 전 날짜로 시작일 설정
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const startDateStr = oneMonthAgo.toISOString().split('T')[0];
        const startDateInput = document.getElementById('purchaseStartDate');
        if (startDateInput && !startDateInput.value) {
            startDateInput.value = startDateStr;
        }
        
        // 버튼 이벤트 등록
        const searchBtn = document.getElementById('searchPurchaseBtn');
        const resetBtn = document.getElementById('resetPurchaseBtn');
        
        if (searchBtn) {
            searchBtn.onclick = window.searchMemberPurchase;
        }
        
        if (resetBtn) {
            resetBtn.onclick = window.resetMemberPurchase;
        }
        if (window.isMdAdmin) {
            var phoneElInit = document.getElementById('memberInfoPhone');
            if (phoneElInit && phoneElInit.closest('div')) {
                phoneElInit.closest('div').style.display = 'none';
            }
        }
        console.log('✅ 구매 정보 페이지 초기화 완료');
    }
})();


