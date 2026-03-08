// Firebase 가짜 데이터 삭제 스크립트
// 관리자 페이지에서 한 번 실행하여 Firebase의 테스트/가짜 데이터만 삭제

/** 회원·MD 테스트 데이터만 삭제 (진짜 데이터는 유지) */
async function deleteFakeMembers() {
    if (!window.firebaseAdmin || !window.firebaseAdmin.db) {
        await window.firebaseAdmin.initFirebase();
    }
    if (!window.firebaseAdmin || !window.firebaseAdmin.db) {
        alert('Firebase가 초기화되지 않았습니다.');
        return;
    }
    var isTestMember = window.firebaseAdmin.isTestMember;
    if (typeof isTestMember !== 'function') {
        alert('isTestMember 함수를 찾을 수 없습니다. firebase-admin.js를 먼저 로드해주세요.');
        return;
    }
    var db = window.firebaseAdmin.db;
    var BATCH_SIZE = 500;

    try {
        var toDeleteMembers = [];
        var snap = await db.collection('members').get();
        snap.docs.forEach(function (doc) {
            if (isTestMember(doc.data())) toDeleteMembers.push(doc.ref);
        });

        var toDeleteMd = [];
        var mdSnap = await db.collection('mdManagers').get();
        mdSnap.docs.forEach(function (doc) {
            var d = doc.data();
            var email = (d.email || '').toString().toLowerCase();
            var name = (d.name || '').toString().trim();
            if (email === 'test4@md.com' || email === 'test5@md.com' || name === '4자리테스트' || name === '5자리테스트') {
                toDeleteMd.push(doc.ref);
            }
        });

        var total = toDeleteMembers.length + toDeleteMd.length;
        if (total === 0) {
            alert('삭제할 테스트/가짜 데이터가 없습니다.');
            return;
        }
        if (!confirm('테스트/가짜 데이터를 삭제하시겠습니까?\n\n회원: ' + toDeleteMembers.length + '명\nMD: ' + toDeleteMd.length + '명\n\n진짜 데이터는 그대로 유지됩니다.')) {
            return;
        }

        var deleted = 0;
        while (toDeleteMembers.length > 0) {
            var batch = db.batch();
            var chunk = toDeleteMembers.splice(0, BATCH_SIZE);
            chunk.forEach(function (ref) { batch.delete(ref); });
            await batch.commit();
            deleted += chunk.length;
        }
        while (toDeleteMd.length > 0) {
            var batch2 = db.batch();
            var chunk2 = toDeleteMd.splice(0, BATCH_SIZE);
            chunk2.forEach(function (ref) { batch2.delete(ref); });
            await batch2.commit();
            deleted += chunk2.length;
        }

        alert('✅ 테스트/가짜 데이터 삭제 완료.\n삭제된 문서: ' + deleted + '개');
        if (typeof window.loadAllMembers === 'function') {
            await window.loadAllMembers();
        }
        if (typeof location !== 'undefined' && location.reload) {
            location.reload();
        }
    } catch (error) {
        console.error('가짜 데이터 삭제 오류:', error);
        alert('삭제 중 오류: ' + error.message);
    }
}

/** searchLogs 컬렉션 전체 삭제 (사용 중단된 검색 로그) - 한 번 실행 후 불필요 */
async function deleteSearchLogsCollection() {
    if (!window.firebaseAdmin || !window.firebaseAdmin.db) {
        await window.firebaseAdmin.initFirebase();
    }
    if (!window.firebaseAdmin.db) {
        alert('Firebase가 초기화되지 않았습니다.');
        return;
    }
    if (!confirm('searchLogs 컬렉션의 모든 문서를 삭제하시겠습니까?')) {
        return;
    }
    const db = window.firebaseAdmin.db;
    const COLLECTION_NAME = 'searchLogs';
    const BATCH_SIZE = 500;

    try {
        let totalDeleted = 0;
        let snapshot = await db.collection(COLLECTION_NAME).limit(BATCH_SIZE).get();
        while (!snapshot.empty) {
            const batch = db.batch();
            snapshot.docs.forEach(function (doc) {
                batch.delete(doc.ref);
            });
            await batch.commit();
            totalDeleted += snapshot.docs.length;
            snapshot = await db.collection(COLLECTION_NAME).limit(BATCH_SIZE).get();
        }
        alert('searchLogs 컬렉션 삭제 완료. 삭제된 문서 수: ' + totalDeleted);
    } catch (error) {
        console.error('searchLogs 삭제 오류:', error);
        alert('삭제 중 오류: ' + error.message);
    }
}

async function deleteAllFirebaseData() {
    if (!window.firebaseAdmin || !window.firebaseAdmin.db) {
        await window.firebaseAdmin.initFirebase();
    }
    
    if (!window.firebaseAdmin.db) {
        alert('Firebase가 초기화되지 않았습니다.');
        return;
    }
    
    if (!confirm('⚠️ 경고: Firebase의 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!')) {
        return;
    }
    
    try {
        console.log('데이터 삭제 시작...');
        
        // 회원 데이터 삭제
        const members = await window.firebaseAdmin.memberService.getMembers();
        console.log(`회원 ${members.length}명 삭제 중...`);
        for (const member of members) {
            await window.firebaseAdmin.memberService.deleteMember(member.id);
        }
        console.log('회원 데이터 삭제 완료');
        
        // 상품 데이터 삭제
        const products = await window.firebaseAdmin.productService.getProducts();
        console.log(`상품 ${products.length}개 삭제 중...`);
        for (const product of products) {
            await window.firebaseAdmin.productService.deleteProduct(product.id);
        }
        console.log('상품 데이터 삭제 완료');
        
        alert(`✅ 모든 데이터 삭제 완료!\n- 회원: ${members.length}명\n- 상품: ${products.length}개`);
        
        // 페이지 새로고침
        location.reload();
        
    } catch (error) {
        console.error('데이터 삭제 오류:', error);
        alert('데이터 삭제 중 오류가 발생했습니다: ' + error.message);
    }
}

// 전역으로 export
window.deleteAllFirebaseData = deleteAllFirebaseData;
window.deleteSearchLogsCollection = deleteSearchLogsCollection;
window.deleteFakeMembers = deleteFakeMembers;

// 콘솔에서 실행 가능하도록
console.log('Firebase 데이터 삭제: deleteAllFirebaseData() / 가짜만: deleteFakeMembers() / searchLogs만: deleteSearchLogsCollection()');


