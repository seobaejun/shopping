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

// 구매 정보 검색 함수
window.searchMemberPurchase = async function() {
    try {
        const keyword = document.getElementById('purchaseSearchKeyword')?.value.trim();
        
        if (!keyword) {
            alert('아이디 또는 이름을 입력해주세요.');
            return;
        }
        
        console.log('🔵 구매 정보 검색 시작:', keyword);
        
        // Firebase Admin 초기화 대기
        const firebaseAdmin = await waitForFirebaseAdminPurchase();
        
        // 회원 정보 검색
        const members = await firebaseAdmin.memberService.getMembers();
        const member = members.find(m => 
            (m.userId && m.userId.toLowerCase().includes(keyword.toLowerCase())) ||
            (m.name && m.name.includes(keyword))
        );
        
        if (!member) {
            alert('해당 회원을 찾을 수 없습니다.');
            return;
        }
        
        console.log('✅ 회원 찾음:', member);
        
        // 날짜 범위
        const startDate = document.getElementById('purchaseStartDate')?.value;
        const endDate = document.getElementById('purchaseEndDate')?.value;
        
        // 구매 내역 가져오기 (Firestore에서)
        // TODO: purchases 컬렉션에서 데이터 가져오기
        // 현재는 더미 데이터 사용
        const searchId = member.userId || member.id;
        const purchases = await getMemberPurchases(searchId, startDate, endDate);
        var paidSupport = 0;
        var paidSupportByOrderId = {};
        if (firebaseAdmin.lotteryConfirmedService) {
            if (typeof firebaseAdmin.lotteryConfirmedService.getPaidSupportByMember === 'function') {
                var byMember = await firebaseAdmin.lotteryConfirmedService.getPaidSupportByMember();
                paidSupport = byMember[member.userId] ?? byMember[member.id] ?? 0;
            }
            if (typeof firebaseAdmin.lotteryConfirmedService.getPaidSupportByOrderId === 'function') {
                paidSupportByOrderId = await firebaseAdmin.lotteryConfirmedService.getPaidSupportByOrderId(member.userId, member.id);
            }
        }
        console.log('✅ 구매 내역:', purchases.length, '건, 지급완료 지원금:', paidSupport);
        displayPurchaseResults(member, purchases, paidSupport, paidSupportByOrderId);
        
    } catch (error) {
        console.error('❌ 구매 정보 검색 오류:', error);
        alert('구매 정보 검색 중 오류가 발생했습니다: ' + error.message);
    }
};

// 회원의 구매 내역 가져오기 (orders 컬렉션에서 조회)
async function getMemberPurchases(memberId, startDate, endDate) {
    try {
        const firebaseAdmin = window.firebaseAdmin;
        
        const snapshot = await firebaseAdmin.db.collection('orders').get();
        
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

// 검색 결과 표시. totalPaidSupport=지급완료 지원금 합계, paidSupportByOrderId=행별 지급완료 지원금 맵
function displayPurchaseResults(member, purchases, totalPaidSupport, paidSupportByOrderId) {
    paidSupportByOrderId = paidSupportByOrderId || {};
    const resultsContainer = document.getElementById('purchaseResultsContainer');
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
    }
    
    document.getElementById('memberInfoUserId').textContent = member.userId || member.id || '-';
    document.getElementById('memberInfoName').textContent = member.name || '-';
    document.getElementById('memberInfoPhone').textContent = member.phone || '-';
    
    const totalCount = purchases.length;
    const totalAmount = purchases.reduce((sum, p) => sum + (p.productPrice || 0), 0);
    const totalSupport = (totalPaidSupport != null && totalPaidSupport !== undefined)
        ? Number(totalPaidSupport)
        : purchases.reduce((sum, p) => sum + (p.supportAmount || 0), 0);
    
    document.getElementById('totalPurchaseCount').textContent = totalCount.toLocaleString();
    document.getElementById('totalPurchaseAmount').textContent = totalAmount.toLocaleString();
    document.getElementById('totalSupportAmount').textContent = formatTrix(totalSupport);
    
    renderPurchaseDetailTable(purchases, paidSupportByOrderId);
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
        
        var paidSupport = paidSupportByOrderId[purchase.id] != null ? Number(paidSupportByOrderId[purchase.id]) : 0;
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
};

// 페이지 진입 시 초기화 (loadPageData에서 호출)
window.initMemberPurchasePage = function() {
    const keywordInput = document.getElementById('purchaseSearchKeyword');
    const startDateInput = document.getElementById('purchaseStartDate');
    const endDateInput = document.getElementById('purchaseEndDate');
    const resultsContainer = document.getElementById('purchaseResultsContainer');
    const detailBody = document.getElementById('purchaseDetailBody');

    if (keywordInput) keywordInput.value = '';
    if (startDateInput) {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        startDateInput.value = oneMonthAgo.toISOString().split('T')[0];
    }
    if (endDateInput) endDateInput.value = new Date().toISOString().split('T')[0];
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (detailBody) detailBody.innerHTML = '';
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
        
        console.log('✅ 구매 정보 페이지 초기화 완료');
    }
})();


