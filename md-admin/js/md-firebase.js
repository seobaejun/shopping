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

/** 배포(다른 도메인)에서 localStorage에 mdCode가 없을 때 Firestore에서 다시 가져와서 채움. Auth 현재 사용자 이메일로도 시도 */
async function refreshMdCodeFromFirestoreIfNeeded() {
    var mdAdminData = localStorage.getItem('mdAdminData');
    var mdData = null;
    var email = '';
    if (mdAdminData) {
        try {
            mdData = JSON.parse(mdAdminData);
            if (mdData.mdCode && /^\d{4,5}$/.test(String(mdData.mdCode).trim())) return mdData.mdCode;
            email = (mdData.email || mdData.userId || '').toString().trim();
        } catch (e) {}
    }
    if (!email && typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        email = (firebase.auth().currentUser.email || '').toString().trim();
        if (!mdData) mdData = { email: email, userId: email, userName: 'MD관리자' };
    }
    if (!email || !window.db) return null;
    try {
        var mdSnap = await window.db.collection('mdManagers').where('email', '==', email).get();
        if (mdSnap.empty) mdSnap = await window.db.collection('mdManagers').where('userId', '==', email).get();
        var mdCode = null;
        var foundMdData = null;
        if (!mdSnap.empty) {
            foundMdData = mdSnap.docs[0].data();
            mdCode = (foundMdData.mdCode || '').toString().trim();
        }
        if (!mdCode || !/^\d{4,5}$/.test(mdCode)) {
            var memberSnap = await window.db.collection('members').where('email', '==', email).limit(1).get();
            if (memberSnap.empty) memberSnap = await window.db.collection('members').where('userId', '==', email).limit(1).get();
            if (!memberSnap.empty) {
                var memberData = memberSnap.docs[0].data();
                mdCode = (memberData.mdCode || '').toString().trim();
                if (!foundMdData) foundMdData = memberData;
            }
        }
        if (mdCode && /^\d{4,5}$/.test(mdCode)) {
            if (!mdData) mdData = { email: email, userId: email, userName: (foundMdData && (foundMdData.name || foundMdData.userName)) || 'MD관리자' };
            mdData.mdCode = mdCode;
            if (foundMdData) {
                if (foundMdData.name || foundMdData.userName) mdData.userName = foundMdData.name || foundMdData.userName;
                if (foundMdData.email) mdData.email = foundMdData.email;
                if (foundMdData.userId) mdData.userId = foundMdData.userId;
            }
            localStorage.setItem('mdAdminData', JSON.stringify(mdData));
            localStorage.setItem('currentMdCode', mdCode);
            localStorage.setItem('isMdAdmin', 'true');
            console.log('MD 코드 Firestore에서 복구:', mdCode);
            return mdCode;
        }
    } catch (e) {
        console.warn('MD 코드 Firestore 복구 실패:', e);
    }
    return null;
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
        if (isAdminViewingMd() && window.db) {
            var snapshot = await window.db.collection('members').get();
            var allMembers = [];
            snapshot.forEach(function(doc) {
                var data = doc.data();
                allMembers.push({ id: doc.id, docId: doc.id, ...data });
            });
            console.log('관리자 조회(폴백): Firestore에서 전체 회원 수', allMembers.length);
            return allMembers;
        }
        var allowedCodes = getAllowedMdCodes();
        if (allowedCodes.length === 0 && typeof refreshMdCodeFromFirestoreIfNeeded === 'function') {
            await refreshMdCodeFromFirestoreIfNeeded();
            allowedCodes = getAllowedMdCodes();
        }
        if (allowedCodes.length === 0) {
            console.warn('MD 코드가 없어 빈 목록 반환. 관리자에게 MD 코드(4~5자리) 발급을 요청하세요.');
            return [];
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

/** 관리자 → MD 화면(mdAdminFromAdmin)에서만: 전체회원 행의 MD 추가 → mdManagers에 관리자 권한설정과 동일 스키마로 저장 */
window.mdAdminAddMdFromMemberDocId = async function (memberDocId) {
    if (typeof sessionStorage === 'undefined' || sessionStorage.getItem('mdAdminFromAdmin') !== 'true') {
        alert('관리자 페이지에서 MD 바로가기로 들어온 경우에만 MD 추가가 가능합니다.');
        return;
    }
    var docId = memberDocId != null ? String(memberDocId).trim() : '';
    if (!docId) {
        alert('회원 문서 ID가 없습니다.');
        return;
    }
    var m = null;
    var lists = [window.allMembersData, window.filteredMembersData];
    for (var i = 0; i < lists.length; i++) {
        var arr = lists[i];
        if (!Array.isArray(arr)) continue;
        for (var j = 0; j < arr.length; j++) {
            var x = arr[j];
            if (String(x.id || x.docId) === docId) {
                m = x;
                break;
            }
        }
        if (m) break;
    }
    if (!m) {
        alert('회원 정보를 찾을 수 없습니다. 목록을 새로고침한 뒤 다시 시도해주세요.');
        return;
    }
    var userId = (m.userId || '').toString().trim();
    var nameRaw = (m.name || m.userName || '').toString().trim();
    var name = nameRaw && nameRaw.indexOf('@') === -1 ? nameRaw : '';
    if (!userId) {
        alert('아이디(userId)가 없는 회원은 MD로 등록할 수 없습니다.');
        return;
    }
    if (!name) {
        alert('이름이 없는 회원은 MD로 등록할 수 없습니다.');
        return;
    }
    var defaultCode = (m.mdCode || '').toString().trim();
    var mdCodeInput = typeof window.prompt === 'function' ? window.prompt('MD 코드(4~5자리 숫자)를 입력하세요.', defaultCode || '') : '';
    if (mdCodeInput == null) return;
    var mdCode = String(mdCodeInput).trim();
    if (!/^\d{4,5}$/.test(mdCode)) {
        alert('MD 코드는 4자리 또는 5자리 숫자여야 합니다.');
        return;
    }
    try {
        await waitForFirebaseMd();
        var dup = await window.db.collection('mdManagers').where('userId', '==', userId).limit(1).get();
        if (!dup.empty) {
            alert('이미 MD로 등록된 아이디입니다.');
            return;
        }
        var email = (m.email || '').toString().trim();
        var phone = (m.phone || m.mobile || '').toString().trim();
        var payload = {
            userId: userId,
            name: name,
            mdCode: mdCode,
            email: email,
            phone: phone,
            status: 'active'
        };
        if (window.firebaseAdmin && window.firebaseAdmin.mdService && typeof window.firebaseAdmin.mdService.addMd === 'function') {
            await window.firebaseAdmin.mdService.addMd(payload);
        } else {
            await window.db.collection('mdManagers').add(Object.assign({}, payload, {
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }));
        }
        alert('MD로 추가되었습니다. 관리자 권한 설정의 MD 목록과 동일한 데이터로 표시됩니다.');
        if (typeof window.loadAllMembers === 'function') await window.loadAllMembers();
        if (typeof window.searchMemberInfo === 'function') await window.searchMemberInfo();
    } catch (err) {
        console.error('MD 추가 오류:', err);
        alert('MD 추가에 실패했습니다: ' + (err && err.message ? err.message : String(err)));
    }
};

(function bindMdAdminAddMdDelegation() {
    function onBodyClick(e) {
        if (!window.isMdAdmin || typeof sessionStorage === 'undefined' || sessionStorage.getItem('mdAdminFromAdmin') !== 'true') return;
        var btn = e.target && e.target.closest && e.target.closest('.btn-md-admin-add');
        if (!btn) return;
        e.preventDefault();
        var id = btn.getAttribute('data-member-doc-id');
        if (id != null && window.mdAdminAddMdFromMemberDocId) window.mdAdminAddMdFromMemberDocId(id);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { document.body.addEventListener('click', onBodyClick); });
    } else {
        document.body.addEventListener('click', onBodyClick);
    }
})();

// 전역 함수로보내기
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



