// Firestore와 Auth 동기화 상태 확인
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, listUsers } = require('firebase/auth');

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
const auth = getAuth(app);

async function checkSync() {
    try {
        console.log('🔍 Firestore와 Auth 동기화 상태 확인 시작...\n');
        
        // 1. Firestore에서 회원 목록 가져오기
        console.log('📊 Firestore에서 회원 데이터 가져오는 중...');
        const membersSnapshot = await getDocs(collection(db, 'members'));
        const firestoreUsers = [];
        
        membersSnapshot.forEach(doc => {
            const data = doc.data();
            firestoreUsers.push({
                userId: data.userId,
                email: data.email,
                name: data.name
            });
        });
        
        console.log(`✅ Firestore 회원 수: ${firestoreUsers.length}명`);
        
        // 2. Auth 사용자는 클라이언트 SDK로는 목록을 가져올 수 없음
        console.log('❌ Auth 사용자 목록은 Admin SDK가 필요합니다.');
        console.log('🔧 대신 Firestore 회원들이 Auth에 있는지 개별 확인...\n');
        
        // 3. Firestore 회원들의 Auth 존재 여부 확인
        let authExists = 0;
        let authMissing = 0;
        const missingInAuth = [];
        
        for (const user of firestoreUsers) {
            try {
                const authEmail = user.email || `${user.userId}@temp.local`;
                
                // Auth 존재 확인 (실제로는 로그인 시도 등으로 확인해야 하지만, 
                // 여기서는 이전 마이그레이션 결과를 기반으로 추정)
                console.log(`🔍 ${user.userId} (${authEmail}) 확인 중...`);
                
                // 간단한 확인을 위해 이메일 형식으로 판단
                if (user.email && user.email.includes('@') && !user.email.includes('@temp.local')) {
                    authExists++;
                    console.log(`✅ Auth 존재 추정: ${user.userId}`);
                } else {
                    authMissing++;
                    missingInAuth.push(user);
                    console.log(`❌ Auth 없음 추정: ${user.userId}`);
                }
                
                // API 제한 방지를 위한 짧은 대기
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.log(`❌ 확인 실패: ${user.userId} - ${error.message}`);
                authMissing++;
                missingInAuth.push(user);
            }
        }
        
        console.log('\n📊 최종 결과:');
        console.log(`🗂️  Firestore 총 회원: ${firestoreUsers.length}명`);
        console.log(`✅ Auth 존재 추정: ${authExists}명`);
        console.log(`❌ Auth 없음 추정: ${authMissing}명`);
        
        if (missingInAuth.length > 0) {
            console.log('\n❌ Auth에 없는 것으로 추정되는 회원들:');
            missingInAuth.forEach((user, index) => {
                console.log(`${index + 1}. ${user.userId} (${user.name}) - ${user.email || '이메일 없음'}`);
            });
        }
        
        console.log('\n💡 정확한 확인을 위해서는 Firebase Admin SDK가 필요합니다.');
        console.log('💡 또는 Firebase Console에서 Auth 사용자 목록을 직접 확인하세요.');
        
    } catch (error) {
        console.error('💥 동기화 확인 실패:', error);
    }
}

checkSync();