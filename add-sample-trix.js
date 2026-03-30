// 샘플 트릭스 지급 스크립트
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } = require('firebase/firestore');

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

async function addSampleTrix() {
    try {
        console.log('💰 샘플 트릭스 지급 시작...\n');
        
        // 첫 10명의 회원에게 트릭스 지급
        const membersSnapshot = await getDocs(collection(db, 'members'));
        const members = [];
        
        membersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.userId && data.name) {
                members.push({
                    docId: doc.id,
                    userId: data.userId,
                    name: data.name,
                    email: data.email
                });
            }
        });
        
        console.log(`📊 총 ${members.length}명의 회원 중 10명에게 트릭스 지급`);
        
        // 첫 10명에게 다양한 금액의 트릭스 지급
        const trixAmounts = [1000, 500, 750, 300, 1200, 800, 600, 400, 900, 1500];
        
        for (let i = 0; i < Math.min(10, members.length); i++) {
            const member = members[i];
            const trixAmount = trixAmounts[i];
            
            console.log(`💰 ${member.name} (${member.userId})에게 ${trixAmount} TRIX 지급 중...`);
            
            // 회원 문서에 트릭스 잔액 추가
            const memberRef = doc(db, 'members', member.docId);
            await updateDoc(memberRef, {
                trixBalance: trixAmount,
                updatedAt: serverTimestamp()
            });
            
            // 트릭스 내역 추가
            await addDoc(collection(db, 'trixHistory'), {
                userId: member.userId,
                type: 'admin_grant',
                amount: trixAmount,
                balance: trixAmount,
                description: '관리자 지급 (테스트용)',
                createdAt: serverTimestamp()
            });
            
            console.log(`✅ ${member.name}에게 ${trixAmount} TRIX 지급 완료`);
        }
        
        console.log('\n🎉 샘플 트릭스 지급 완료!');
        console.log('이제 마이페이지나 상품 페이지에서 트릭스 잔액을 확인할 수 있습니다.');
        
        // 지급 결과 요약
        const totalGiven = trixAmounts.slice(0, Math.min(10, members.length)).reduce((sum, amount) => sum + amount, 0);
        console.log(`\n📊 지급 요약:`);
        console.log(`- 지급 대상: ${Math.min(10, members.length)}명`);
        console.log(`- 총 지급량: ${totalGiven.toLocaleString()} TRIX`);
        console.log(`- 원화 상당: ${(totalGiven * 100).toLocaleString()}원`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 트릭스 지급 실패:', error);
        process.exit(1);
    }
}

addSampleTrix();