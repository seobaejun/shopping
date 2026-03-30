const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

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

async function addToAuth() {
    try {
        console.log('🔍 Firestore에서 회원 데이터 가져오는 중...');
        
        const membersSnapshot = await getDocs(collection(db, 'members'));
        console.log(`📊 총 ${membersSnapshot.size}명의 회원 발견`);
        
        let success = 0;
        let skip = 0;
        let error = 0;
        
        for (const doc of membersSnapshot.docs) {
            const memberData = doc.data();
            const { userId, email, tempPassword, name } = memberData;
            
            // 이메일이 없으면 임시 이메일 생성
            const authEmail = email || `${userId}@temp.local`;
            
            try {
                console.log(`🔄 Auth 계정 생성 중: ${userId} (${authEmail})`);
                
                // Firebase Auth에 사용자 생성
                await createUserWithEmailAndPassword(auth, authEmail, tempPassword);
                
                console.log(`✅ Auth 계정 생성 성공: ${userId}`);
                success++;
                
            } catch (authError) {
                if (authError.code === 'auth/email-already-in-use') {
                    console.log(`⏭️  Auth 계정 이미 존재: ${userId}`);
                    skip++;
                } else {
                    console.log(`❌ Auth 계정 생성 실패 (${userId}): ${authError.message}`);
                    error++;
                }
            }
            
            // API 제한 방지
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n🎉 Firebase Auth 추가 완료!');
        console.log(`✅ 성공: ${success}명`);
        console.log(`⏭️  스킵: ${skip}명`);
        console.log(`❌ 실패: ${error}명`);
        console.log(`📊 총 처리: ${success + skip + error}명`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 Auth 추가 실패:', error);
        process.exit(1);
    }
}

addToAuth();