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
        const purchases = await getMemberPurchases(member.id || member.userId, startDate, endDate);
        
        console.log('✅ 구매 내역:', purchases);
        
        // 결과 표시
        displayPurchaseResults(member, purchases);
        
    } catch (error) {
        console.error('❌ 구매 정보 검색 오류:', error);
        alert('구매 정보 검색 중 오류가 발생했습니다: ' + error.message);
    }
};

// 회원의 구매 내역 가져오기
async function getMemberPurchases(memberId, startDate, endDate) {
    try {
        const firebaseAdmin = window.firebaseAdmin;
        
        // Firestore에서 purchases 컬렉션 조회
        let query = firebaseAdmin.db.collection('purchases')
            .where('userId', '==', memberId);
        
        // 날짜 필터 적용
        if (startDate) {
            query = query.where('purchaseDate', '>=', new Date(startDate));
        }
        if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            query = query.where('purchaseDate', '<=', endDateTime);
        }
        
        const snapshot = await query.orderBy('purchaseDate', 'desc').get();
        
        const purchases = [];
        snapshot.forEach(doc => {
            purchases.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ ${memberId}의 구매 내역 ${purchases.length}건 조회`);
        return purchases;
        
    } catch (error) {
        console.error('❌ 구매 내역 조회 오류:', error);
        // 데이터가 없거나 오류 발생 시 빈 배열 반환
        return [];
    }
}

// 검색 결과 표시
function displayPurchaseResults(member, purchases) {
    // 결과 영역 표시
    const resultsContainer = document.getElementById('purchaseResultsContainer');
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
    }
    
    // 회원 정보 표시
    document.getElementById('memberInfoUserId').textContent = member.userId || member.id || '-';
    document.getElementById('memberInfoName').textContent = member.name || '-';
    document.getElementById('memberInfoPhone').textContent = member.phone || '-';
    
    // 누계 정보 계산
    const totalCount = purchases.length;
    const totalAmount = purchases.reduce((sum, p) => sum + (p.productPrice || 0), 0);
    const totalSupport = purchases.reduce((sum, p) => sum + (p.supportAmount || 0), 0);
    
    // 누계 정보 표시
    document.getElementById('totalPurchaseCount').textContent = totalCount.toLocaleString();
    document.getElementById('totalPurchaseAmount').textContent = totalAmount.toLocaleString();
    document.getElementById('totalSupportAmount').textContent = totalSupport.toLocaleString();
    
    // 구매 내역 테이블 렌더링
    renderPurchaseDetailTable(purchases);
}

// 구매 상세 내역 테이블 렌더링
function renderPurchaseDetailTable(purchases) {
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
        // 날짜 포맷팅
        let purchaseDate = '-';
        if (purchase.purchaseDate) {
            if (purchase.purchaseDate.seconds) {
                const date = new Date(purchase.purchaseDate.seconds * 1000);
                purchaseDate = date.toLocaleString('ko-KR');
            } else if (purchase.purchaseDate.toDate) {
                purchaseDate = purchase.purchaseDate.toDate().toLocaleString('ko-KR');
            } else {
                purchaseDate = new Date(purchase.purchaseDate).toLocaleString('ko-KR');
            }
        }
        
        // 상태 표시
        const status = purchase.status || '완료';
        const statusClass = status === '완료' ? 'badge-success' : 
                           status === '대기' ? 'badge-warning' : 'badge-danger';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${purchaseDate}</td>
                <td>${purchase.productName || '-'}</td>
                <td>${(purchase.productPrice || 0).toLocaleString()}원</td>
                <td>${(purchase.supportAmount || 0).toLocaleString()}원</td>
                <td><span class="badge ${statusClass}">${status}</span></td>
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

