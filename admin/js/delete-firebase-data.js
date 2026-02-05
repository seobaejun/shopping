// Firebase 가짜 데이터 삭제 스크립트
// 관리자 페이지에서 한 번 실행하여 Firebase의 모든 더미 데이터를 삭제

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

// 콘솔에서 실행 가능하도록
console.log('Firebase 데이터 삭제: deleteAllFirebaseData() 함수를 실행하세요.');


