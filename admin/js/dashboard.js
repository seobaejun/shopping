// 관리자 대시보드 데이터 로드

// 대시보드 데이터 로드
async function loadDashboardData() {
    if (!window.firebaseAdmin || !window.firebaseAdmin.db) {
        await window.firebaseAdmin.initFirebase();
    }
    
    if (!window.firebaseAdmin || !window.firebaseAdmin.db) {
        console.error('Firebase가 초기화되지 않았습니다.');
        return;
    }
    
    try {
        // 1. 전체 회원 수 및 이번 주 신규 회원
        const allMembers = await window.firebaseAdmin.memberService.getMembers();
        const totalMembers = allMembers.length;
        
        // 이번 주 시작일 계산 (월요일 기준)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일로 조정
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekNewMembers = allMembers.filter(member => {
            if (!member.createdAt) return false;
            const memberDate = member.createdAt.toDate ? member.createdAt.toDate() : new Date(member.createdAt);
            return memberDate >= weekStart;
        }).length;
        
        // 2. 주문 데이터 가져오기
        const allOrders = await window.firebaseAdmin.orderService.getOrders();
        const totalOrders = allOrders.length;
        
        // 오늘 주문 수
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayOrders = allOrders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            return orderDate >= todayStart;
        }).length;
        
        // 3. 총 지원금 계산
        const totalSupport = allOrders.reduce((sum, order) => {
            return sum + (order.support || 0);
        }, 0);
        
        // 이번 달 지원금
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthSupport = allOrders
            .filter(order => {
                if (!order.createdAt) return false;
                const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                return orderDate >= monthStart;
            })
            .reduce((sum, order) => sum + (order.support || 0), 0);
        
        // 4. 승인 대기 주문
        const pendingOrders = allOrders.filter(order => order.status === 'pending' || order.status === '대기');
        
        // 5. 최근 가입 회원 (최근 3명)
        const recentMembers = allMembers
            .sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            })
            .slice(0, 3);
        
        // 6. 최근 구매 내역 (최근 3건)
        const recentOrders = allOrders
            .sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            })
            .slice(0, 3);
        
        // 7. 이번 주 통계
        const weekOrders = allOrders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
            return orderDate >= weekStart;
        });
        
        const weekTotalAmount = weekOrders.reduce((sum, order) => sum + (order.amount || order.price || 0), 0);
        const weekSupport = weekOrders.reduce((sum, order) => sum + (order.support || 0), 0);
        
        // 추첨 진행 횟수 (이번 주)
        let weekLotteries = [];
        try {
            const allLotteries = await window.firebaseAdmin.lotteryService.getLotteries();
            weekLotteries = allLotteries.filter(lottery => {
                if (!lottery.createdAt) return false;
                const lotteryDate = lottery.createdAt.toDate ? lottery.createdAt.toDate() : new Date(lottery.createdAt);
                return lotteryDate >= weekStart;
            });
        } catch (error) {
            console.warn('추첨 데이터 로드 오류:', error);
        }
        
        // UI 업데이트
        updateDashboardStats({
            totalMembers,
            weekNewMembers,
            totalOrders,
            todayOrders,
            totalSupport,
            monthSupport,
            pendingOrders: pendingOrders.length
        });
        
        updateRecentMembers(recentMembers);
        updateRecentOrders(recentOrders);
        updateWeekStats({
            weekNewMembers,
            weekTotalAmount,
            weekSupport,
            weekLotteries: weekLotteries.length
        });
        
    } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
        // 오류 시 빈 데이터 표시
        updateDashboardStats({
            totalMembers: 0,
            weekNewMembers: 0,
            totalOrders: 0,
            todayOrders: 0,
            totalSupport: 0,
            monthSupport: 0,
            pendingOrders: 0
        });
    }
}

// 통계 카드 업데이트
function updateDashboardStats(stats) {
    const totalMembersEl = document.getElementById('totalMembers');
    const memberChangeEl = document.getElementById('memberChange');
    const totalOrdersEl = document.getElementById('totalOrders');
    const orderChangeEl = document.getElementById('orderChange');
    const totalSupportEl = document.getElementById('totalSupport');
    const supportChangeEl = document.getElementById('supportChange');
    const pendingOrdersEl = document.getElementById('pendingOrders');
    
    if (totalMembersEl) {
        totalMembersEl.textContent = `${stats.totalMembers}명`;
    }
    if (memberChangeEl) {
        if (stats.weekNewMembers > 0) {
            memberChangeEl.textContent = `+${stats.weekNewMembers} (이번 주)`;
            memberChangeEl.className = 'stat-change positive';
        } else {
            memberChangeEl.textContent = '변동 없음';
            memberChangeEl.className = 'stat-change';
        }
    }
    
    if (totalOrdersEl) {
        totalOrdersEl.textContent = `${stats.totalOrders.toLocaleString()}건`;
    }
    if (orderChangeEl) {
        if (stats.todayOrders > 0) {
            orderChangeEl.textContent = `+${stats.todayOrders} (오늘)`;
            orderChangeEl.className = 'stat-change positive';
        } else {
            orderChangeEl.textContent = '변동 없음';
            orderChangeEl.className = 'stat-change';
        }
    }
    
    if (totalSupportEl) {
        totalSupportEl.textContent = `${stats.totalSupport.toLocaleString()}원`;
    }
    if (supportChangeEl) {
        if (stats.monthSupport > 0) {
            supportChangeEl.textContent = `+${stats.monthSupport.toLocaleString()}원 (이번 달)`;
            supportChangeEl.className = 'stat-change positive';
        } else {
            supportChangeEl.textContent = '변동 없음';
            supportChangeEl.className = 'stat-change';
        }
    }
    
    if (pendingOrdersEl) {
        pendingOrdersEl.textContent = `${stats.pendingOrders}건`;
    }
}

// 최근 가입 회원 업데이트
function updateRecentMembers(members) {
    const tbody = document.getElementById('recentMembersList');
    if (!tbody) return;
    
    if (members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-message">최근 가입 회원이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = members.map(member => {
        const name = member.name || '';
        const displayName = name.length > 2 ? name[0] + '**' : name;
        const userId = member.userId || '';
        const joinDate = member.createdAt 
            ? (member.createdAt.toDate ? member.createdAt.toDate().toISOString().split('T')[0] : new Date(member.createdAt).toISOString().split('T')[0])
            : (member.joinDate || '-');
        const status = member.status || '정상';
        const statusClass = status === '정상' ? 'badge-success' : 'badge-danger';
        
        return `
            <tr>
                <td>${displayName}</td>
                <td>${userId}</td>
                <td>${joinDate}</td>
                <td><span class="badge ${statusClass}">${status}</span></td>
            </tr>
        `;
    }).join('');
}

// 최근 구매 내역 업데이트
function updateRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersList');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-message">최근 구매 내역이 없습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        const memberName = order.memberName || order.name || '';
        const displayName = memberName.length > 2 ? memberName[0] + '**' : memberName;
        const productName = order.productName || order.product || '-';
        const amount = order.amount || order.price || 0;
        const status = order.status || '대기';
        const statusClass = status === '승인완료' || status === 'approved' ? 'badge-success' : 'badge-warning';
        const statusText = status === 'approved' ? '승인완료' : (status === 'pending' ? '승인대기' : status);
        
        return `
            <tr>
                <td>${displayName}</td>
                <td>${productName}</td>
                <td>${amount.toLocaleString()}원</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

// 이번 주 통계 업데이트
function updateWeekStats(stats) {
    const weekNewMembersEl = document.getElementById('weekNewMembers');
    const weekTotalAmountEl = document.getElementById('weekTotalAmount');
    const weekSupportEl = document.getElementById('weekSupport');
    const weekLotteriesEl = document.getElementById('weekLotteries');
    
    if (weekNewMembersEl) {
        weekNewMembersEl.textContent = `${stats.weekNewMembers}명`;
    }
    if (weekTotalAmountEl) {
        weekTotalAmountEl.textContent = `${stats.weekTotalAmount.toLocaleString()}원`;
    }
    if (weekSupportEl) {
        weekSupportEl.textContent = `${stats.weekSupport.toLocaleString()}원`;
    }
    if (weekLotteriesEl) {
        weekLotteriesEl.textContent = `${stats.weekLotteries}회`;
    }
}

// 전역으로 export
window.loadDashboardData = loadDashboardData;

