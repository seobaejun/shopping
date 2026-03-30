// sprince1004@naver.com 사용자 트릭스 데이터 확인
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

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

async function checkSprinceUser() {
    try {
        console.log('🔍 sprince1004@naver.com 사용자 확인...\n');
        
        // 이메일로 사용자 찾기
        const userQuery = await getDocs(query(
            collection(db, 'members'), 
            where('email', '==', 'sprince1004@naver.com')
        ));
        
        if (userQuery.empty) {
            console.log('❌ sprince1004@naver.com 사용자를 찾을 수 없습니다.');
            return;
        }
        
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        
        console.log('👤 사용자 정보:');
        console.log(`   - Document ID (UID): ${userDoc.id}`);
        console.log(`   - userId: ${userData.userId}`);
        console.log(`   - name: ${userData.name}`);
        console.log(`   - email: ${userData.email}`);
        console.log(`   - trixBalance: ${userData.trixBalance || '없음'} (타입: ${typeof userData.trixBalance})`);
        console.log(`   - supportAmount: ${userData.supportAmount || '없음'} (타입: ${typeof userData.supportAmount})`);
        
        // 모든 필드 출력
        console.log('\n📋 모든 필드:');
        Object.keys(userData).forEach(key => {
            const value = userData[key];
            if (key.toLowerCase().includes('trix') || 
                key.toLowerCase().includes('support') || 
                key.toLowerCase().includes('balance') ||
                key.toLowerCase().includes('point')) {
                console.log(`   - ${key}: ${value} (타입: ${typeof value})`);
            }
        });
        
        // 트릭스 내역 확인
        console.log('\n📜 트릭스 사용 내역:');
        const historyQuery = await getDocs(query(
            collection(db, 'trixHistory'),
            where('userId', '==', userData.userId)
        ));
        
        if (historyQuery.empty) {
            console.log('   - 트릭스 내역이 없습니다.');
        } else {
            historyQuery.forEach(doc => {
                const history = doc.data();
                const date = history.createdAt ? new Date(history.createdAt.seconds * 1000).toLocaleDateString() : '날짜 없음';
                console.log(`   - ${date}: ${history.description} (${history.amount > 0 ? '+' : ''}${history.amount} TRIX, 잔액: ${history.balance})`);
            });
        }
        
        console.log('\n🔧 디버깅 정보:');
        console.log(`마이페이지에서 이 UID로 조회: ${userDoc.id}`);
        console.log(`상품페이지에서 이 UID로 조회: ${userDoc.id}`);
        console.log('브라우저 개발자 도구에서 localStorage.getItem("loginUser") 확인 필요');
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 확인 실패:', error);
        process.exit(1);
    }
}

checkSprinceUser();