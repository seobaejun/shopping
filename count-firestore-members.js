// Firestore members 컬렉션의 정확한 회원 수 확인
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

async function countFirestoreMembers() {
    try {
        console.log('📊 Firestore members 컬렉션 회원 수 확인 중...\n');
        
        // Firestore에서 모든 회원 가져오기
        const membersSnapshot = await getDocs(collection(db, 'members'));
        
        console.log(`🎯 Firestore members 컬렉션 총 회원 수: ${membersSnapshot.size}명`);
        
        // 각 회원의 기본 정보 확인
        const members = [];
        membersSnapshot.forEach(doc => {
            const data = doc.data();
            members.push({
                userId: data.userId,
                email: data.email,
                name: data.name
            });
        });
        
        // 이메일 유무별 분류
        const withEmail = members.filter(m => m.email && m.email.trim() && !m.email.includes('@temp.local'));
        const withoutEmail = members.filter(m => !m.email || !m.email.trim() || m.email.includes('@temp.local'));
        
        console.log(`✅ 이메일 있는 회원: ${withEmail.length}명`);
        console.log(`❌ 이메일 없는 회원: ${withoutEmail.length}명`);
        
        // 특별한 계정들 확인
        const specialAccounts = members.filter(m => 
            m.userId === 'admin' || 
            m.userId === 'admin2' || 
            m.userId.startsWith('test') ||
            m.name === '최고관리자'
        );
        
        console.log(`🎯 특별한 계정: ${specialAccounts.length}명`);
        
        console.log('\n📊 요약:');
        console.log(`🗂️  Firestore 총 회원: ${membersSnapshot.size}명`);
        console.log(`👤 관리자 페이지: 173명`);
        console.log(`🔐 Firebase Auth: 172명`);
        
        console.log('\n🔍 차이 분석:');
        console.log(`Firestore vs 관리자 페이지: ${membersSnapshot.size - 173}명 차이`);
        console.log(`관리자 페이지 vs Auth: ${173 - 172} = 1명 차이`);
        console.log(`Firestore vs Auth: ${membersSnapshot.size - 172}명 차이`);
        
        if (membersSnapshot.size === 187) {
            console.log('\n✅ Firestore는 187명으로 예상대로입니다!');
            console.log('📝 결론:');
            console.log('- Firestore: 187명 (전체)');
            console.log('- 관리자 페이지: 173명 (일부 필터링됨)');
            console.log('- Firebase Auth: 172명 (1명 누락)');
        }
        
    } catch (error) {
        console.error('💥 Firestore 회원 수 확인 실패:', error);
    }
}

countFirestoreMembers();