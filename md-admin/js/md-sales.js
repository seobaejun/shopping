// MD 매출 조회 로직
console.log('🔵 md-sales.js 로드됨');

// 전역 변수
let currentSearchResults = {
    members: [],
    orders: [],
    stats: null
};

// MD 매출 조회 함수
async function searchMdSales() {
    const mdCodeInput = document.getElementById('mdCodeSearch');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const resultsBody = document.getElementById('salesResultsBody');
    const searchSummary = document.getElementById('searchSummary');
    
    if (!mdCodeInput || !resultsBody) {
        console.error('필수 요소를 찾을 수 없습니다.');
        return;
    }
    
    const mdCode = mdCodeInput.value.trim();
    const startDate = startDateInput ? startDateInput.value : null;
    const endDate = endDateInput ? endDateValue.value : null;
    
    if (!mdCode) {
        alert('MD 코드를 입력해주세요.');
        mdCodeInput.focus();
        return;
    }
    
    try {
        // 로딩 표시
        resultsBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <div class="loading"></div>
                    <div style="margin-top: 1rem;">데이터를 조회하는 중...</div>
                </td>
            </tr>
        `;
        
        if (searchSummary) {
            searchSummary.style.display = 'none';
        }
        
        console.log('MD 매출 조회 시작:', mdCode, startDate, endDate);
        
        // 1. MD 코드로 회원 조회
        const members = await window.mdFirebase.getMembersByMdCode(mdCode);
        
        if (members.length === 0) {
            resultsBody.innerHTML = `
                <tr class="no-data">
                    <td colspan="7">해당 MD 코드로 가입한 회원이 없습니다.</td>
                </tr>
            `;
            return;
        }
        
        // 2. 회원들의 주문 내역 조회
        const memberIds = members.map(m => m.userId || m.id);
        const orders = await window.mdFirebase.getOrdersByMembers(memberIds, startDate, endDate);
        
        // 3. 회원별 매출 집계
        const memberSalesMap = {};
        
        // 회원 기본 정보 설정
        members.forEach(member => {
            memberSalesMap[member.userId || member.id] = {
                member: member,
                totalSales: 0,
                totalTokens: 0,
                orderCount: 0
            };
        });
        
        // 주문 데이터 집계
        orders.forEach(order => {
            const memberId = order.userId || order.memberId;
            if (memberSalesMap[memberId]) {
                const price = Number(order.totalPrice || order.price || 0);
                const support = Number(order.supportAmount || order.support || order.productSupport || 0);
                
                memberSalesMap[memberId].totalSales += price;
                memberSalesMap[memberId].totalTokens += support;
                memberSalesMap[memberId].orderCount++;
            }
        });
        
        // 4. 결과 데이터 준비
        const salesData = Object.values(memberSalesMap);
        
        // 매출액 기준으로 정렬
        salesData.sort((a, b) => b.totalSales - a.totalSales);
        
        // 5. 통계 계산
        const stats = window.mdFirebase.calculateSalesStats(members, orders);
        
        // 6. 결과 저장
        currentSearchResults = {
            members: members,
            orders: orders,
            stats: stats,
            salesData: salesData
        };
        
        // 7. 테이블 렌더링
        renderSalesResults(salesData);
        
        // 8. 요약 정보 표시
        if (searchSummary) {
            document.getElementById('resultCount').textContent = salesData.length;
            document.getElementById('resultSales').textContent = window.mdFirebase.formatCurrency(stats.totalSales);
            document.getElementById('resultTokens').textContent = window.mdFirebase.formatTrix(stats.totalTokens) + ' trix';
            searchSummary.style.display = 'block';
        }
        
        console.log('MD 매출 조회 완료:', salesData.length, '명');
        
    } catch (error) {
        console.error('MD 매출 조회 오류:', error);
        resultsBody.innerHTML = `
            <tr class="no-data">
                <td colspan="7" style="color: #dc3545;">
                    조회 중 오류가 발생했습니다: ${error.message}
                </td>
            </tr>
        `;
        
        if (searchSummary) {
            searchSummary.style.display = 'none';
        }
    }
}

// 매출 결과 테이블 렌더링
function renderSalesResults(salesData) {
    const resultsBody = document.getElementById('salesResultsBody');
    
    if (!resultsBody) {
        console.error('결과 테이블을 찾을 수 없습니다.');
        return;
    }
    
    if (salesData.length === 0) {
        resultsBody.innerHTML = `
            <tr class="no-data">
                <td colspan="7">조회 결과가 없습니다.</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    salesData.forEach((item, index) => {
        const member = item.member;
        const joinDate = window.mdFirebase.formatDate(member.createdAt || member.joinDate);
        const totalSales = window.mdFirebase.formatCurrency(item.totalSales);
        const totalTokens = window.mdFirebase.formatTrix(item.totalTokens) + ' trix';
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${member.userId || member.id || '-'}</td>
                <td>${member.userName || '-'}</td>
                <td>${joinDate}</td>
                <td>${member.mdCode || '-'}</td>
                <td>${totalSales}</td>
                <td>${totalTokens}</td>
            </tr>
        `;
    });
    
    resultsBody.innerHTML = html;
}

// 회원별 매출 상세 조회
async function searchMemberDetail() {
    const memberIdInput = document.getElementById('memberIdSearch');
    const resultsContainer = document.getElementById('memberDetailResults');
    
    if (!memberIdInput || !resultsContainer) {
        console.error('필수 요소를 찾을 수 없습니다.');
        return;
    }
    
    const memberId = memberIdInput.value.trim();
    
    if (!memberId) {
        alert('회원 아이디를 입력해주세요.');
        memberIdInput.focus();
        return;
    }
    
    try {
        console.log('회원별 매출 상세 조회:', memberId);
        
        // 로딩 표시
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div class="loading"></div>
                <div style="margin-top: 1rem;">회원 정보를 조회하는 중...</div>
            </div>
        `;
        
        // 1. 회원 정보 조회
        const members = await window.mdFirebase.searchMembers(memberId);
        const member = members.find(m => (m.userId || m.id) === memberId);
        
        if (!member) {
            resultsContainer.innerHTML = `
                <div class="alert alert-error">
                    해당 아이디의 회원을 찾을 수 없습니다.
                </div>
            `;
            return;
        }
        
        // 2. 회원의 주문 내역 조회
        const orders = await window.mdFirebase.getOrdersByMemberId(member.userId || member.id);
        
        // 3. 회원 정보 표시
        renderMemberDetail(member, orders);
        
        console.log('회원별 매출 상세 조회 완료:', orders.length, '건');
        
    } catch (error) {
        console.error('회원별 매출 상세 조회 오류:', error);
        resultsContainer.innerHTML = `
            <div class="alert alert-error">
                조회 중 오류가 발생했습니다: ${error.message}
            </div>
        `;
    }
}

// 회원 상세 정보 렌더링
function renderMemberDetail(member, orders) {
    const resultsContainer = document.getElementById('memberDetailResults');
    
    if (!resultsContainer) {
        console.error('결과 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    const joinDate = window.mdFirebase.formatDate(member.createdAt || member.joinDate);
    
    // 주문 통계 계산
    let totalSales = 0;
    let totalTokens = 0;
    
    orders.forEach(order => {
        totalSales += Number(order.totalPrice || order.price || 0);
        totalTokens += Number(order.supportAmount || order.support || order.productSupport || 0);
    });
    
    // 주문 내역 테이블 생성
    let orderHistoryHtml = '';
    
    if (orders.length === 0) {
        orderHistoryHtml = `
            <tr class="no-data">
                <td colspan="6">구매 내역이 없습니다.</td>
            </tr>
        `;
    } else {
        orders.forEach(order => {
            const orderDate = window.mdFirebase.formatDate(order.createdAt || order.purchaseDate);
            const productName = order.productName || order.title || '-';
            const quantity = order.quantity || 1;
            const price = window.mdFirebase.formatCurrency(order.totalPrice || order.price || 0);
            const support = window.mdFirebase.formatTrix(order.supportAmount || order.support || order.productSupport || 0) + ' trix';
            const status = window.mdFirebase.getStatusText(order.status);
            
            orderHistoryHtml += `
                <tr>
                    <td>${orderDate}</td>
                    <td>${productName}</td>
                    <td>${quantity}</td>
                    <td>${price}</td>
                    <td>${support}</td>
                    <td>${status}</td>
                </tr>
            `;
        });
    }
    
    resultsContainer.innerHTML = `
        <div class="member-info-card">
            <h3>회원 정보</h3>
            <div class="member-info-grid">
                <div class="info-item">
                    <label>아이디:</label>
                    <span id="memberDetailId">${member.userId || member.id || '-'}</span>
                </div>
                <div class="info-item">
                    <label>이름:</label>
                    <span id="memberDetailName">${member.userName || '-'}</span>
                </div>
                <div class="info-item">
                    <label>가입일:</label>
                    <span id="memberDetailJoinDate">${joinDate}</span>
                </div>
                <div class="info-item">
                    <label>추천인:</label>
                    <span id="memberDetailReferral">${member.mdCode || '-'}</span>
                </div>
                <div class="info-item">
                    <label>총 구매액:</label>
                    <span>${window.mdFirebase.formatCurrency(totalSales)}</span>
                </div>
                <div class="info-item">
                    <label>총 지원토큰:</label>
                    <span>${window.mdFirebase.formatTrix(totalTokens)} trix</span>
                </div>
                <div class="info-item">
                    <label>구매 횟수:</label>
                    <span>${orders.length}회</span>
                </div>
            </div>
        </div>

        <div class="purchase-history">
            <h3>구매 내역</h3>
            <div class="table-container">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>주문일</th>
                            <th>상품명</th>
                            <th>수량</th>
                            <th>금액</th>
                            <th>지원토큰</th>
                            <th>상태</th>
                        </tr>
                    </thead>
                    <tbody id="memberPurchaseHistory">
                        ${orderHistoryHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 추천 회원 목록 로드
async function loadReferralMembers() {
    try {
        console.log('추천 회원 목록 로드 시작');
        
        // 현재 MD가 조회 가능한 모든 회원 데이터 조회
        const members = await window.mdFirebase.getAllowedMembers();
        const memberIds = members.map(m => m.userId || m.id);
        const orders = await window.mdFirebase.getOrdersByMembers(memberIds);
        
        // 회원별 구매 통계 계산
        const memberStats = {};
        
        members.forEach(member => {
            const memberId = member.userId || member.id;
            memberStats[memberId] = {
                member: member,
                orderCount: 0,
                totalSales: 0
            };
        });
        
        orders.forEach(order => {
            const memberId = order.userId || order.memberId;
            if (memberStats[memberId]) {
                memberStats[memberId].orderCount++;
                memberStats[memberId].totalSales += Number(order.totalPrice || order.price || 0);
            }
        });
        
        // 통계 업데이트
        const stats = window.mdFirebase.calculateSalesStats(members, orders);
        document.getElementById('fourDigitMembers').textContent = stats.fourDigitMembers + '명';
        document.getElementById('fiveDigitMembers').textContent = stats.fiveDigitMembers + '명';
        
        // 테이블 렌더링
        renderReferralMembers(Object.values(memberStats));
        
    } catch (error) {
        console.error('추천 회원 목록 로드 오류:', error);
        const tbody = document.getElementById('referralMembersBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr class="no-data">
                    <td colspan="7" style="color: #dc3545;">
                        데이터 로드 중 오류가 발생했습니다: ${error.message}
                    </td>
                </tr>
            `;
        }
        
        // 권한 오류인 경우 로그인 페이지로 리다이렉트
        if (error.message.includes('권한') || error.message.includes('로그인')) {
            setTimeout(() => {
                alert('권한이 없습니다. 다시 로그인해주세요.');
                window.location.href = 'login.html';
            }, 2000);
        }
    }
}

// 추천 회원 목록 렌더링
function renderReferralMembers(memberStats) {
    const tbody = document.getElementById('referralMembersBody');
    
    if (!tbody) {
        console.error('추천 회원 테이블을 찾을 수 없습니다.');
        return;
    }
    
    if (memberStats.length === 0) {
        tbody.innerHTML = `
            <tr class="no-data">
                <td colspan="7">추천 회원이 없습니다.</td>
            </tr>
        `;
        return;
    }
    
    // 총 구매액 기준으로 정렬
    memberStats.sort((a, b) => b.totalSales - a.totalSales);
    
    let html = '';
    
    memberStats.forEach((item, index) => {
        const member = item.member;
        const joinDate = window.mdFirebase.formatDate(member.createdAt || member.joinDate);
        const totalSales = window.mdFirebase.formatCurrency(item.totalSales);
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${member.userId || member.id || '-'}</td>
                <td>${member.userName || '-'}</td>
                <td>${joinDate}</td>
                <td>${member.mdCode || '-'}</td>
                <td>${item.orderCount}회</td>
                <td>${totalSales}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// 상세 회원 검색
async function searchDetailMember() {
    const searchInput = document.getElementById('detailMemberSearch');
    const resultsContainer = document.getElementById('memberDetailFull');
    
    if (!searchInput || !resultsContainer) {
        console.error('필수 요소를 찾을 수 없습니다.');
        return;
    }
    
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        alert('검색어를 입력해주세요.');
        searchInput.focus();
        return;
    }
    
    try {
        console.log('상세 회원 검색:', searchTerm);
        
        // 로딩 표시
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div class="loading"></div>
                <div style="margin-top: 1rem;">회원을 검색하는 중...</div>
            </div>
        `;
        
        const members = await window.mdFirebase.searchMembers(searchTerm);
        
        if (members.length === 0) {
            resultsContainer.innerHTML = `
                <div class="alert alert-info">
                    검색 결과가 없습니다.
                </div>
            `;
            return;
        }
        
        // 검색 결과가 여러 명인 경우 목록 표시
        if (members.length > 1) {
            renderMemberSearchResults(members);
        } else {
            // 한 명인 경우 바로 상세 정보 표시
            const orders = await window.mdFirebase.getOrdersByMemberId(members[0].userId || members[0].id);
            renderMemberDetail(members[0], orders);
        }
        
    } catch (error) {
        console.error('상세 회원 검색 오류:', error);
        resultsContainer.innerHTML = `
            <div class="alert alert-error">
                검색 중 오류가 발생했습니다: ${error.message}
            </div>
        `;
    }
}

// 회원 검색 결과 렌더링 (여러 명)
function renderMemberSearchResults(members) {
    const resultsContainer = document.getElementById('memberDetailFull');
    
    let html = `
        <div class="search-results-list">
            <h3>검색 결과 (${members.length}명)</h3>
            <div class="table-container">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>아이디</th>
                            <th>이름</th>
                            <th>가입일</th>
                            <th>추천인</th>
                            <th>액션</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    members.forEach(member => {
        const joinDate = window.mdFirebase.formatDate(member.createdAt || member.joinDate);
        
        html += `
            <tr>
                <td>${member.userId || member.id || '-'}</td>
                <td>${member.userName || '-'}</td>
                <td>${joinDate}</td>
                <td>${member.mdCode || '-'}</td>
                <td>
                    <button class="btn-search" onclick="viewMemberDetail('${member.userId || member.id}')">
                        상세보기
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = html;
}

// 특정 회원 상세보기
async function viewMemberDetail(memberId) {
    try {
        const members = await window.mdFirebase.searchMembers(memberId);
        const member = members.find(m => (m.userId || m.id) === memberId);
        
        if (!member) {
            alert('회원 정보를 찾을 수 없습니다.');
            return;
        }
        
        const orders = await window.mdFirebase.getOrdersByMemberId(memberId);
        renderMemberDetail(member, orders);
        
    } catch (error) {
        console.error('회원 상세보기 오류:', error);
        alert('회원 정보 조회 중 오류가 발생했습니다.');
    }
}

// 전역 함수로 내보내기
window.mdSales = {
    searchMdSales,
    searchMemberDetail,
    loadReferralMembers,
    searchDetailMember,
    viewMemberDetail
};



