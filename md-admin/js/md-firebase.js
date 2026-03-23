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

/** Firestore Timestamp·Long 등 → UTC 밀리초 (MD조회 가입일 표시용, 스프레드 후에도 안정) */
function extractFirestoreTimeMillis(value) {
    if (value == null || value === '') return null;
    if (typeof value.toDate === 'function') {
        try {
            var d = value.toDate();
            if (d && !isNaN(d.getTime())) return d.getTime();
        } catch (e) { /* ignore */ }
    }
    if (typeof value === 'object' && value.seconds != null) {
        var s = value.seconds;
        if (s != null && typeof s.toNumber === 'function') s = s.toNumber();
        else if (s != null && typeof s.valueOf === 'function') s = Number(s.valueOf());
        var sec = typeof s === 'number' ? s : parseInt(s, 10);
        if (!isNaN(sec)) return sec * 1000;
    }
    if (typeof value === 'object' && value._seconds != null) {
        var s2 = value._seconds;
        if (s2 != null && typeof s2.toNumber === 'function') s2 = s2.toNumber();
        var sec2 = typeof s2 === 'number' ? s2 : parseInt(s2, 10);
        if (!isNaN(sec2)) return sec2 * 1000;
    }
    return null;
}

/** 문서 mdCode와 로그인/쿼리 폴백이 다를 때(예: DB 4자리·세션 5자리) 더 구체적인 소속 코드 선택 */
function pickBestMdCodeForLookup(fromDoc, fallback) {
    var a = (fromDoc != null ? String(fromDoc) : '').trim();
    var b = (fallback != null ? String(fallback) : '').trim();
    if (!a) return b;
    if (!b) return a;
    if (a === b) return a;
    if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
        if (a.length === 5 && b.length === 4) return a;
        if (b.length === 5 && a.length === 4) return b;
        if (b.length > a.length && b.indexOf(a) === 0) return b;
        if (a.length > b.length && a.indexOf(b) === 0) return a;
    }
    return a;
}

/**
 * Firestore mdCode가 문자열 또는 숫자로 저장된 레거시가 섞여 있어, 동일 값에 대해 타입별로 한 번씩 조회 후 doc.id 기준 중복 제거.
 * (문자 '13451' 쿼리는 number 13451 문서와 매칭되지 않음 → 4자리 상위 검색 시 하위 5자리가 안 잡히던 원인)
 */
function getMdCodeEqualityVariantsForQuery(codeStr) {
    var s = String(codeStr == null ? '' : codeStr).trim();
    if (!s) return [];
    var out = [s];
    var n = parseInt(s, 10);
    if (!isNaN(n) && String(n) === s && /^\d{4,5}$/.test(s)) {
        out.push(n);
    }
    return out;
}

async function fetchMemberDocsForMdCodeEquality(codeStr) {
    if (!window.db) return [];
    var col = window.db.collection('members');
    var variants = getMdCodeEqualityVariantsForQuery(codeStr);
    var seen = Object.create(null);
    var out = [];
    for (var vi = 0; vi < variants.length; vi++) {
        var snap = await col.where('mdCode', '==', variants[vi]).get();
        snap.forEach(function (doc) {
            var id = doc.id;
            if (seen[id]) return;
            seen[id] = true;
            out.push(doc);
        });
    }
    return out;
}

/** Firestore mdCode가 Long 등일 때 4~5자리 문자열로 */
function stringifyMemberMdCodeField(value) {
    if (value == null || value === '') return '';
    if (typeof value === 'number' && !isNaN(value)) return String(Math.trunc(value));
    if (typeof value === 'string') return value.replace(/\s/g, '').trim();
    if (typeof value === 'object' && value != null && typeof value.toString === 'function') {
        var t = String(value.toString()).replace(/\s/g, '').trim();
        if (/^\d{4,5}$/.test(t)) return t;
    }
    var s = String(value).replace(/\s/g, '').trim();
    return /^\d{4,5}$/.test(s) ? s : '';
}

/**
 * 조회 코드 vs 문서 mdCode
 * - 문서가 5자리·조회가 4자리(상위)면 문서(하위 줄) 우선
 * - 문서가 4자리·조회가 5자리(하위 줄로 검색)면 문서(실제 소속 4자리) 우선 — 잘못 return q 하면 13451로 덮임
 */
function resolveMdLookupRowDisplayMd(matchedQueryCode, docMdValue) {
    var q = matchedQueryCode != null ? String(matchedQueryCode).replace(/\s/g, '').trim() : '';
    var d = stringifyMemberMdCodeField(docMdValue);
    if (!/^\d{4,5}$/.test(q)) q = '';
    if (!q) return d;
    if (!d) return q;
    if (q === d) return q;
    if (d.length === 5 && q.length === 4 && d.indexOf(q) === 0) return d;
    if (q.length === 5 && d.length === 4 && q.indexOf(d) === 0) return d;
    return q;
}

/**
 * @param {string} [matchedQueryCode] 해당 행을 가져온 where('mdCode','==', …)에 대응하는 표시용 코드
 */
function pushMemberRowFromDoc(members, doc, matchedQueryCode) {
    const data = doc.data();
    const id = doc.id;
    const fromQuery = matchedQueryCode != null ? String(matchedQueryCode).replace(/\s/g, '').trim() : '';
    const rawMd = resolveMdLookupRowDisplayMd(fromQuery, data.mdCode);
    members.push({
        id,
        ...data,
        docId: id,
        mdCode: rawMd,
        mdLookupCreatedAtMs: extractFirestoreTimeMillis(data.createdAt),
        mdLookupJoinDateMs: extractFirestoreTimeMillis(data.joinDate),
        mdLookupRawMdCode: rawMd
    });
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
                const docs = await fetchMemberDocsForMdCodeEquality(searchCode);
                docs.forEach(function (doc) {
                    pushMemberRowFromDoc(members, doc, searchCode);
                });
            }
        } else if (code.length === 5) {
            // 5자리 코드: 해당 코드만 조회
            console.log('5자리 코드 조회:', code);
            
            const docs = await fetchMemberDocsForMdCodeEquality(code);
            docs.forEach(function (doc) {
                pushMemberRowFromDoc(members, doc, code);
            });
        }

        // mdManagers에만 있고 members에는 없거나 mdCode가 비어 목록에 안 잡히는 MD 본인(담당자) 병합
        const codesForManagers = code.length === 4
            ? [code, ...getSubordinateCodes(code)]
            : [code];
        await mergeMdManagersIntoMemberList(members, codesForManagers);

        // 로그인 MD: 회원 문서는 있는데 mdCode 불일치·누락으로 위 쿼리에 없을 때 본인 행 추가
        if (!isAdminViewingMd()) {
            await mergeLoggedInMdSelfIfMissingForLookup(members, codesForManagers);
        }
        
        console.log(`MD 코드 ${code}로 조회된 회원 수:`, members.length);
        return members;
        
    } catch (error) {
        console.error('회원 조회 오류:', error);
        throw error;
    }
}

/** MD조회·코드별 목록: Firestore mdManagers에서 해당 mdCode 담당자를 회원 목록에 합침(중복 userId·이메일 제외) */
async function mergeMdManagersIntoMemberList(members, mdCodes) {
    if (!window.db || !mdCodes || mdCodes.length === 0) return;
    const unique = [...new Set(mdCodes.filter(c => c && String(c).trim()))];
    if (unique.length === 0) return;

    function isAlreadyInList(dUserId, dEmail) {
        const uid = (dUserId || '').toString().trim();
        const em = (dEmail || '').toString().trim();
        return members.some(function (m) {
            const u = (m.userId || '').toString().trim();
            const e = (m.email || '').toString().trim();
            if (uid && u === uid) return true;
            if (em && e === em) return true;
            return false;
        });
    }

    for (let i = 0; i < unique.length; i += 10) {
        const chunk = unique.slice(i, i + 10);
        const seenMgrDocIds = new Set();
        function handleMdManagerDoc(doc) {
            if (seenMgrDocIds.has(doc.id)) return;
            seenMgrDocIds.add(doc.id);
            const d = doc.data();
            const st = (d.status != null ? String(d.status) : 'active').toLowerCase();
            if (st === 'inactive' || st === 'deleted' || st === 'suspended') return;
            const uid = (d.userId || '').toString().trim();
            const em = (d.email || '').toString().trim();
            if (!uid && !em) return;
            if (isAlreadyInList(uid, em)) return;
            var mgrMd = (d.mdCode != null ? String(d.mdCode) : '').trim();
            members.push({
                id: doc.id,
                docId: doc.id,
                userId: uid,
                name: d.name || '',
                email: em,
                phone: d.phone || '',
                mdCode: mgrMd,
                mdLookupRawMdCode: mgrMd,
                isMdManagerRecord: true
            });
        }
        try {
            const snap = await window.db.collection('mdManagers').where('mdCode', 'in', chunk).get();
            snap.forEach(handleMdManagerDoc);
        } catch (e) {
            console.warn('mergeMdManagersIntoMemberList: mdManagers 조회 실패', e);
        }
        const numChunk = [];
        for (let j = 0; j < chunk.length; j++) {
            const s = String(chunk[j]).trim();
            const n = parseInt(s, 10);
            if (!isNaN(n) && String(n) === s) numChunk.push(n);
        }
        if (numChunk.length > 0) {
            try {
                const snapN = await window.db.collection('mdManagers').where('mdCode', 'in', numChunk).get();
                snapN.forEach(handleMdManagerDoc);
            } catch (e2) {
                console.warn('mergeMdManagersIntoMemberList: mdManagers 숫자 in 조회 실패', e2);
            }
        }
    }
}

/** MD조회: 로그인한 MD의 members 문서가 mdCode 필터에 안 걸렸을 때 본인 한 명 추가 */
async function mergeLoggedInMdSelfIfMissingForLookup(members, mdCodes) {
    const raw = localStorage.getItem('mdAdminData');
    if (!raw) return;
    let mdData;
    try {
        mdData = JSON.parse(raw);
    } catch (e) {
        return;
    }
    const currentUserId = (mdData.userId || mdData.email || '').toString().trim();
    const currentEmail = (mdData.email || '').toString().trim();
    if (!currentUserId && !currentEmail) return;

    const inList = members.some(function (m) {
        const u = (m.userId || '').toString().trim();
        const e = (m.email || '').toString().trim();
        return (currentUserId && u === currentUserId) || (currentEmail && e === currentEmail);
    });
    if (inList) return;

    let selfSnap;
    if (currentEmail) {
        selfSnap = await window.db.collection('members').where('email', '==', currentEmail).limit(1).get();
    }
    if ((!selfSnap || selfSnap.empty) && currentUserId) {
        selfSnap = await window.db.collection('members').where('userId', '==', currentUserId).limit(1).get();
    }
    if (!selfSnap || selfSnap.empty) return;

    const doc = selfSnap.docs[0];
    const data = doc.data();
    const rawMdFromDoc = data.mdCode != null ? String(data.mdCode).trim() : '';
    const fallbackMd = mdData.mdCode || (mdCodes[0] || '');
    const bestMd = pickBestMdCodeForLookup(rawMdFromDoc, fallbackMd) || rawMdFromDoc || String(fallbackMd || '').trim();
    members.push({
        id: doc.id,
        ...data,
        docId: doc.id,
        mdCode: bestMd,
        mdLookupCreatedAtMs: extractFirestoreTimeMillis(data.createdAt),
        mdLookupJoinDateMs: extractFirestoreTimeMillis(data.joinDate),
        mdLookupRawMdCode: bestMd
    });
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
            const docs = await fetchMemberDocsForMdCodeEquality(code);
            docs.forEach(function (doc) {
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
        
        const termRaw = searchTerm.trim();
        const termLower = termRaw.toLowerCase();
        const members = [];
        const seen = Object.create(null);
        function pushDocIfNew(doc) {
            if (!doc) return;
            if (seen[doc.id]) return;
            seen[doc.id] = true;
            const data = doc.data();
            members.push({
                id: doc.id,
                ...data,
                docId: doc.id
            });
        }
        
        // 아이디로 검색
        const userIdSnapshot = await window.db.collection('members')
            .where('userId', '>=', termRaw)
            .where('userId', '<=', termRaw + '\uf8ff')
            .get();
        
        userIdSnapshot.forEach(pushDocIfNew);
        
        // 이름(userName)으로 검색 (중복 제거)
        const userNameSnapshot = await window.db.collection('members')
            .where('userName', '>=', termRaw)
            .where('userName', '<=', termRaw + '\uf8ff')
            .get();
        
        userNameSnapshot.forEach(pushDocIfNew);

        // 이름(name)으로 검색 (중복 제거)
        const nameSnapshot = await window.db.collection('members')
            .where('name', '>=', termRaw)
            .where('name', '<=', termRaw + '\uf8ff')
            .get();
        nameSnapshot.forEach(pushDocIfNew);

        // 대소문자/공백 차이 보정: in-memory 필터로 한 번 더 거르기
        function normalize(val) {
            return String(val == null ? '' : val).replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, '').trim().toLowerCase();
        }
        const normTerm = normalize(termLower);
        const filtered = members.filter(function (m) {
            const uid = normalize(m.userId || m.id || '');
            const n1 = normalize(m.name || '');
            const n2 = normalize(m.userName || '');
            const em = normalize(m.email || '');
            return (uid && uid.indexOf(normTerm) !== -1)
                || (n1 && n1.indexOf(normTerm) !== -1)
                || (n2 && n2.indexOf(normTerm) !== -1)
                || (em && em.indexOf(normTerm) !== -1);
        });
        
        console.log(`"${searchTerm}" 검색 결과:`, filtered.length, '명');
        return filtered;
        
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



