const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkMemberCount() {
    try {
        console.log('🔍 Firestore members 컬렉션 확인 중...');
        
        const membersSnapshot = await getDocs(collection(db, 'members'));
        const memberCount = membersSnapshot.size;
        
        console.log(`📊 총 회원 수: ${memberCount}명`);
        
        // 최근 추가된 회원 5명 확인
        console.log('\n📋 최근 회원 5명:');
        let count = 0;
        membersSnapshot.forEach((doc) => {
            if (count < 5) {
                const data = doc.data();
                console.log(`${count + 1}. ${data.userId} - ${data.name} (${data.email || 'no-email'})`);
                count++;
            }
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 확인 중 오류:', error);
        process.exit(1);
    }
}

checkMemberCount();