// Firebase 가짜 데이터 삭제 스크립트
// 관리자 페이지에서 한 번 실행하여 Firebase의 모든 더미 데이터를 삭제

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

// 콘솔에서 실행 가능하도록
console.log('Firebase 데이터 삭제: deleteAllFirebaseData() / searchLogs만: deleteSearchLogsCollection()');


