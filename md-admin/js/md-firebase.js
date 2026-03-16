// MD 관리자용 Firebase 연동
console.log('🔵 md-firebase.js 로드됨');

// 소수점 8자리까지 표시, 9번째부터 버림
function formatTrix(value) {
    var num = Number(value) || 0;
    if (num === 0) return '0';
    var truncated = Math.floor(num * 1e8) / 1e8;
    var str = truncated.toFixed(8);
    str = str.replace(/0+$/, '').replace(/\.$/, '');
    return str;
}

// Firebase 초기화 대기 함수
async function waitForFirebaseMd(maxWait = 10000) {
    const startTime = Date.now();
    let waitCount = 0;
    
    console.log('🔵 MD Firebase 대기 시작...');
    
    while (!window.db) {
        waitCount++;
        if (Date.now() - startTime > maxWait) {
            console.error('Firebase 초기화 시간 초과');
            throw new Error('Firebase가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        }
        if (waitCount % 10 === 0) {
            console.log(`MD Firebase 대기 중... (${waitCount * 100}ms 경과)`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ MD Firebase 발견됨');
    return window.db;
}

// MD 코드 유효성 검사
function validateMdCode(mdCode) {
    if (!mdCode || typeof mdCode !== 'string') {
        return { valid: false, message: 'MD 코드를 입력해주세요.' };
    }
    
    const trimmedCode = mdCode.trim();
    
    // 4자리 또는 5자리 숫자인지 확인
    if (!/^\d{4,5}$/.test(trimmedCode)) {
        return { valid: false, message: 'MD 코드는 4자리 또는 5자리 숫자여야 합니다.' };
    }
    
    return { valid: true, code: trimmedCode };
}

// MD 코드 하위 코드 생성 (4자리 코드용)
function getSubordinateCodes(mdCode) {
    if (mdCode.length !== 4) {
        return [];
    }
    
    const subordinates = [];
    const baseCode = mdCode;
    
    // 5자리 하위 코드들 생성 (예: 1024 -> 10241, 10242, ... 10249)
    for (let i = 1; i <= 9; i++) {
        subordinates.push(baseCode + i.toString());
    }
    
    return subordinates;
}

// 관리자에서 MD 바로가기로 들어온 경우 전체 권한 허용
function isAdminViewingMd() {
    return sessionStorage.getItem('mdAdminFromAdmin') === 'true';
}

// 현재 로그인한 MD의 권한 체크
function checkMdPermission(requestedMdCode) {
    if (isAdminViewingMd()) return true;
    const mdAdminData = localStorage.getItem('mdAdminData');
    if (!mdAdminData) {
        throw new Error('MD 관리자 로그인이 필요합니다.');
    }
    
    const mdData = JSON.parse(mdAdminData);
    const currentMdCode = mdData.mdCode;
    
    if (!currentMdCode) {
        throw new Error('MD 코드 정보가 없습니다.');
    }
    
    // 요청된 코드가 현재 MD의 권한 범위인지 확인
    if (currentMdCode.length === 4) {
        // 4자리 코드: 본인 + 하위 5자리 코드 허용
        const subordinates = getSubordinateCodes(currentMdCode);
        const allowedCodes = [currentMdCode, ...subordinates];
        
        if (!allowedCodes.includes(requestedMdCode)) {
            throw new Error('해당 MD 코드에 대한 권한이 없습니다.');
        }
    } else if (currentMdCode.length === 5) {
        // 5자리 코드: 본인 것만 허용
        if (requestedMdCode !== currentMdCode) {
            throw new Error('본인의 MD 코드만 조회할 수 있습니다.');
        }
    }
    
    return true;
}

// 현재 MD가 조회 가능한 모든 MD 코드 반환
function getAllowedMdCodes() {
    const mdAdminData = localStorage.getItem('mdAdminData');
    if (!mdAdminData) {
        return [];
    }
    
    const mdData = JSON.parse(mdAdminData);
    const currentMdCode = mdData.mdCode;
    
    if (!currentMdCode) {
        return [];
    }
    
    if (currentMdCode.length === 4) {
        // 4자리 코드: 본인 + 하위 5자리 코드들
        const subordinates = getSubordinateCodes(currentMdCode);
        return [currentMdCode, ...subordinates];
    } else if (currentMdCode.length === 5) {
        // 5자리 코드: 본인만
        return [currentMdCode];
    }
    
    return [];
}

// 회원 데이터 조회 (MD 코드 기반) - 권한 체크 추가
async function getMembersByMdCode(mdCode) {
    try {
        await waitForFirebaseMd();
        
        const validation = validateMdCode(mdCode);
        if (!validation.valid) {
            throw new Error(validation.message);
        }
        
        const code = validation.code;
        
        // 권한 체크
        checkMdPermission(code);
        
        const members = [];
        
        if (code.length === 4) {
            // 4자리 코드: 본인 + 하위 5자리 코드 모두 조회
            const subordinates = getSubordinateCodes(code);
            const allCodes = [code, ...subordinates];
            
            console.log('4자리 코드 조회:', code, '하위 코드들:', subordinates);
            
            for (const searchCode of allCodes) {
                const snapshot = await window.db.collection('members')
                    .where('mdCode', '==', searchCode)
                    .get();
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    members.push({
                        id: doc.id,
                        ...data,
                        docId: doc.id
                    });
                });
            }
        } else if (code.length === 5) {
            // 5자리 코드: 해당 코드만 조회
            console.log('5자리 코드 조회:', code);
            
            const snapshot = await window.db.collection('members')
                .where('mdCode', '==', code)
                .get();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                members.push({
                    id: doc.id,
                    ...data,
                    docId: doc.id
                });
            });
        }
        
        console.log(`MD 코드 ${code}로 조회된 회원 수:`, members.length);
        return members;
        
    } catch (error) {
        console.error('회원 조회 오류:', error);
        throw error;
    }
}

// 현재 MD의 모든 허용된 회원 조회
async function getAllowedMembers() {
    try {
        await waitForFirebaseMd();
        if (isAdminViewingMd() && window.firebaseAdmin && window.firebaseAdmin.memberService && typeof window.firebaseAdmin.memberService.getMembers === 'function') {
            var all = await window.firebaseAdmin.memberService.getMembers();
            console.log('관리자 조회: 전체 회원 수', all ? all.length : 0);
            return all || [];
        }
        const allowedCodes = getAllowedMdCodes();
        if (allowedCodes.length === 0) {
            throw new Error('조회 권한이 없습니다.');
        }
        const members = [];
        
        for (const code of allowedCodes) {
            const snapshot = await window.db.collection('members')
                .where('mdCode', '==', code)
                .get();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                members.push({
                    id: doc.id,
                    ...data,
                    docId: doc.id
                });
            });
        }
        
        // 본인(MD)이 회원으로 등록돼 있지만 mdCode가 비어있거나 달라서 목록에 없을 수 있음 → 본인 회원 추가
        const mdAdminData = localStorage.getItem('mdAdminData');
        if (mdAdminData) {
            const mdData = JSON.parse(mdAdminData);
            const currentUserId = (mdData.userId || mdData.email || '').toString().trim();
            const currentEmail = (mdData.email || '').toString().trim();
            const alreadyInList = members.some(function (m) {
                const uid = (m.userId || m.id || '').toString().trim();
                const em = (m.email || '').toString().trim();
                return (currentUserId && uid === currentUserId) || (currentEmail && em === currentEmail);
            });
            if (!alreadyInList && (currentUserId || currentEmail)) {
                let selfSnap;
                if (currentEmail) {
                    selfSnap = await window.db.collection('members').where('email', '==', currentEmail).limit(1).get();
                }
                if ((!selfSnap || selfSnap.empty) && currentUserId) {
                    selfSnap = await window.db.collection('members').where('userId', '==', currentUserId).limit(1).get();
                }
                if (selfSnap && !selfSnap.empty) {
                    const doc = selfSnap.docs[0];
                    const data = doc.data();
                    members.push({
                        id: doc.id,
                        ...data,
                        docId: doc.id,
                        mdCode: data.mdCode || mdData.mdCode || ''
                    });
                    console.log('본인(MD) 회원 1명 목록에 추가');
                }
            }
        }
        
        console.log(`허용된 회원 수:`, members.length);
        return members;
        
    } catch (error) {
        console.error('허용된 회원 조회 오류:', error);
        throw error;
    }
}

// 특정 회원들의 주문 내역 조회
async function getOrdersByMembers(memberIds, startDate = null, endDate = null) {
    try {
        await waitForFirebaseMd();
        
        if (!memberIds || memberIds.length === 0) {
            return [];
        }
        
        console.log('주문 조회 대상 회원 수:', memberIds.length);
        
        const orders = [];
        const batchSize = 10; // Firestore 'in' 쿼리 제한
        
        // 회원 ID를 배치로 나누어 조회
        for (let i = 0; i < memberIds.length; i += batchSize) {
            const batch = memberIds.slice(i, i + batchSize);
            
            let query = window.db.collection('orders')
                .where('userId', 'in', batch);
            
            // 날짜 필터링 (선택사항)
            if (startDate) {
                const startTimestamp = new Date(startDate);
                startTimestamp.setHours(0, 0, 0, 0);
                query = query.where('createdAt', '>=', startTimestamp);
            }
            
            if (endDate) {
                const endTimestamp = new Date(endDate);
                endTimestamp.setHours(23, 59, 59, 999);
                query = query.where('createdAt', '<=', endTimestamp);
            }
            
            const snapshot = await query.get();
            
            snapshot.forEach(doc => {
                const data = doc.data();
                orders.push({
                    id: doc.id,
                    ...data,
                    docId: doc.id
                });
            });
        }
        
        console.log('조회된 주문 수:', orders.length);
        return orders;
        
    } catch (error) {
        console.error('주문 조회 오류:', error);
        throw error;
    }
}

// 특정 회원의 주문 내역 조회
async function getOrdersByMemberId(memberId) {
    try {
        await waitForFirebaseMd();
        
        const snapshot = await window.db.collection('orders')
            .where('userId', '==', memberId)
            .orderBy('createdAt', 'desc')
            .get();
        
        const orders = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            orders.push({
                id: doc.id,
                ...data,
                docId: doc.id
            });
        });
        
        console.log(`회원 ${memberId}의 주문 수:`, orders.length);
        return orders;
        
    } catch (error) {
        console.error('회원별 주문 조회 오류:', error);
        throw error;
    }
}

// 회원 검색 (아이디 또는 이름)
async function searchMembers(searchTerm) {
    try {
        await waitForFirebaseMd();
        
        if (!searchTerm || searchTerm.trim() === '') {
            return [];
        }
        
        const term = searchTerm.trim().toLowerCase();
        const members = [];
        
        // 아이디로 검색
        const userIdSnapshot = await window.db.collection('members')
            .where('userId', '>=', term)
            .where('userId', '<=', term + '\uf8ff')
            .get();
        
        userIdSnapshot.forEach(doc => {
            const data = doc.data();
            members.push({
                id: doc.id,
                ...data,
                docId: doc.id
            });
        });
        
        // 이름으로 검색 (중복 제거)
        const nameSnapshot = await window.db.collection('members')
            .where('userName', '>=', term)
            .where('userName', '<=', term + '\uf8ff')
            .get();
        
        nameSnapshot.forEach(doc => {
            const data = doc.data();
            const existing = members.find(m => m.docId === doc.id);
            if (!existing) {
                members.push({
                    id: doc.id,
                    ...data,
                    docId: doc.id
                });
            }
        });
        
        console.log(`"${searchTerm}" 검색 결과:`, members.length, '명');
        return members;
        
    } catch (error) {
        console.error('회원 검색 오류:', error);
        throw error;
    }
}

// 매출 통계 계산
function calculateSalesStats(members, orders) {
    const stats = {
        totalMembers: members.length,
        totalSales: 0,
        totalTokens: 0,
        averageSales: 0,
        fourDigitMembers: 0,
        fiveDigitMembers: 0
    };
    
    // 회원 통계
    members.forEach(member => {
        if (member.mdCode) {
            if (member.mdCode.length === 4) {
                stats.fourDigitMembers++;
            } else if (member.mdCode.length === 5) {
                stats.fiveDigitMembers++;
            }
        }
    });
    
    // 주문 통계
    orders.forEach(order => {
        const price = Number(order.totalPrice || order.price || 0);
        const support = Number(order.supportAmount || order.support || order.productSupport || 0);
        
        stats.totalSales += price;
        stats.totalTokens += support;
    });
    
    // 평균 계산
    if (stats.totalMembers > 0) {
        stats.averageSales = Math.round(stats.totalSales / stats.totalMembers);
    }
    
    return stats;
}

// 날짜 포맷팅
function formatDate(date) {
    if (!date) return '-';
    
    let dateObj;
    if (date.toDate && typeof date.toDate === 'function') {
        // Firestore Timestamp
        dateObj = date.toDate();
    } else if (date instanceof Date) {
        dateObj = date;
    } else {
        dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
        return '-';
    }
    
    return dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// 금액 포맷팅
function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('ko-KR') + '원';
}

// 상태 텍스트 변환
function getStatusText(status) {
    const statusMap = {
        'pending': '대기중',
        'approved': '승인됨',
        'completed': '완료',
        'cancelled': '취소됨',
        'delivered': '배송완료'
    };
    
    return statusMap[status] || status || '알 수 없음';
}

// 전역 함수로 내보내기
window.mdFirebase = {
    validateMdCode,
    getMembersByMdCode,
    getAllowedMembers,
    getOrdersByMembers,
    getOrdersByMemberId,
    searchMembers,
    calculateSalesStats,
    formatDate,
    formatCurrency,
    formatTrix,
    getStatusText,
    checkMdPermission,
    getAllowedMdCodes
};



