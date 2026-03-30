// 서배준 사용자에게 트릭스 지급
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBGQdEiVOl_49oVfb8TPWkc47uaFxV55Xg",
    authDomain: "shopping-31dce.firebaseapp.com",
    projectId: "shopping-31dce",
    storageBucket: "shopping-31dce.firebasestorage.app",
    messagingSenderId: "344605730776",
    appId: "1:344605730776:web:925f9d6206b1ff2e0374ad",
    measurementId: "G-B7V6HK8Z7X"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addTrixToSeobaejun() {
    try {
        console.log('💰 서배준 사용자에게 트릭스 지급 시작...\n');
        
        // 서배준 사용자 찾기
        const userQuery = await getDocs(query(
            collection(db, 'members'), 
            where('name', '==', '서배준')
        ));
        
        if (userQuery.empty) {
            console.log('❌ 서배준 사용자를 찾을 수 없습니다.');
            return;
        }
        
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        const trixAmount = 5000; // 5000 트릭스 지급
        
        console.log(`👤 사용자: ${userData.name} (${userData.userId})`);
        console.log(`💰 지급할 트릭스: ${trixAmount} TRIX`);
        
        // 트릭스 잔액 업데이트
        await updateDoc(userDoc.ref, {
            trixBalance: trixAmount,
            updatedAt: serverTimestamp()
        });
        
        // 트릭스 내역 추가
        await addDoc(collection(db, 'trixHistory'), {
            userId: userData.userId,
            type: 'admin_grant',
            amount: trixAmount,
            balance: trixAmount,
            description: '테스트용 트릭스 지급',
            createdAt: serverTimestamp()
        });
        
        console.log('✅ 트릭스 지급 완료!');
        console.log(`📊 지급 내용:`);
        console.log(`   - 사용자: ${userData.name} (${userData.userId})`);
        console.log(`   - 지급량: ${trixAmount} TRIX`);
        console.log(`   - 원화 상당: ${(trixAmount * 100).toLocaleString()}원`);
        
        console.log('\n🎯 이제 다음을 테스트해보세요:');
        console.log('1. 마이페이지에서 트릭스 잔액 확인');
        console.log('2. 상품 페이지에서 트릭스 결제 옵션 선택');
        console.log('3. 브라우저 개발자 도구 콘솔에서 디버깅 로그 확인');
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 트릭스 지급 실패:', error);
        process.exit(1);
    }
}

addTrixToSeobaejun();