// 트릭스 잔액 디버깅 스크립트
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

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

async function debugTrixBalance() {
    try {
        console.log('🔍 트릭스 잔액 디버깅 시작...\n');
        
        // 모든 회원의 트릭스 잔액 확인
        const membersSnapshot = await getDocs(collection(db, 'members'));
        console.log(`📊 총 ${membersSnapshot.size}명의 회원 발견\n`);
        
        let trixUsers = [];
        let totalTrix = 0;
        
        membersSnapshot.forEach(doc => {
            const data = doc.data();
            const trixBalance = data.trixBalance || 0;
            
            if (trixBalance > 0) {
                trixUsers.push({
                    uid: doc.id,
                    userId: data.userId,
                    name: data.name,
                    trixBalance: trixBalance
                });
                totalTrix += trixBalance;
            }
        });
        
        console.log(`💰 트릭스 보유 회원: ${trixUsers.length}명`);
        console.log(`💰 총 트릭스: ${totalTrix.toLocaleString()}\n`);
        
        if (trixUsers.length > 0) {
            console.log('📋 트릭스 보유 회원 목록:');
            trixUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name} (${user.userId}): ${user.trixBalance.toLocaleString()} TRIX`);
            });
        } else {
            console.log('❌ 트릭스를 보유한 회원이 없습니다.');
            
            // 샘플 데이터 생성 제안
            console.log('\n💡 샘플 트릭스 데이터를 생성하시겠습니까?');
            console.log('일부 회원에게 테스트용 트릭스를 지급할 수 있습니다.');
        }
        
        // 트릭스 내역 확인
        console.log('\n📜 트릭스 사용 내역 확인...');
        const historySnapshot = await getDocs(collection(db, 'trixHistory'));
        console.log(`📊 총 ${historySnapshot.size}건의 트릭스 내역 발견`);
        
        if (historySnapshot.size > 0) {
            console.log('\n최근 트릭스 내역 (최대 5건):');
            let count = 0;
            historySnapshot.forEach(doc => {
                if (count < 5) {
                    const history = doc.data();
                    const date = history.createdAt ? new Date(history.createdAt.seconds * 1000).toLocaleDateString() : '날짜 없음';
                    console.log(`- ${date}: ${history.description} (${history.amount > 0 ? '+' : ''}${history.amount} TRIX)`);
                    count++;
                }
            });
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 디버깅 실패:', error);
        process.exit(1);
    }
}

debugTrixBalance();