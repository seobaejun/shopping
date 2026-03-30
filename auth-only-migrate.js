// Firestore에는 있지만 Auth에는 없는 회원들을 Auth에 추가
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

let stats = { success: 0, skip: 0, error: 0 };

function generateTempPassword(userId, phone) {
    const phoneDigits = (phone || '').replace(/\D/g, '');
    const last4 = phoneDigits.slice(-4) || '0000';
    return `${userId}${last4}`;
}

async function checkAuthUserExists(email) {
    try {
        // Auth에 해당 이메일이 있는지 확인 (로그인 시도로 확인)
        // 실제로는 Admin SDK가 필요하지만, 클라이언트에서는 다른 방법 사용
        return false; // 일단 모든 사용자를 시도해보기
    } catch (error) {
        return false;
    }
}

async function addToAuth(memberData) {
    const { userId, email, phone, name, tempPassword } = memberData;

    try {
        // 이메일이 없으면 임시 이메일 생성
        const authEmail = email || `${userId}@temp.local`;
        const password = tempPassword || generateTempPassword(userId, phone);
        
        console.log(`🔄 Auth 계정 생성 시도: ${userId} (${authEmail})`);
        
        // Firebase Auth에 사용자 생성
        await createUserWithEmailAndPassword(auth, authEmail, password);
        
        console.log(`✅ Auth 계정 생성 성공: ${userId}`);
        stats.success++;
        return { success: true };

    } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
            console.log(`⏭️  Auth 계정 이미 존재: ${userId}`);
            stats.skip++;
            return { success: true, skipped: true };
        } else if (authError.code === 'auth/too-many-requests') {
            console.log(`⏳ API 제한 발생: ${userId} - 10초 추가 대기`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 추가 대기
            stats.error++;
            return { success: false, retry: true };
        } else {
            console.log(`❌ Auth 계정 생성 실패 (${userId}): ${authError.message}`);
            stats.error++;
            return { success: false, error: authError.message };
        }
    }
}

async function slowAuthMigration() {
    try {
        console.log('🐌 Firestore → Auth 천천히 마이그레이션 시작...');
        console.log('⏰ 각 회원마다 5초씩 대기, API 제한 시 10초 추가 대기');
        
        // Firestore에서 회원 데이터 가져오기
        const membersSnapshot = await getDocs(collection(db, 'members'));
        console.log(`📊 총 ${membersSnapshot.size}명의 Firestore 회원 발견`);
        
        let processedCount = 0;
        const totalCount = membersSnapshot.size;
        
        for (const doc of membersSnapshot.docs) {
            const memberData = doc.data();
            processedCount++;
            
            console.log(`\n🔄 ${processedCount}/${totalCount} 처리 중: ${memberData.userId}`);
            
            const result = await addToAuth(memberData);
            
            // 기본 대기 시간 (5초)
            console.log('⏳ 5초 대기 중... (API 제한 방지)');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // 10명마다 진행 상황 출력
            if (processedCount % 10 === 0) {
                console.log(`\n📊 중간 결과 (${processedCount}/${totalCount})`);
                console.log(`✅ 성공: ${stats.success}명`);
                console.log(`⏭️  스킵: ${stats.skip}명`);
                console.log(`❌ 실패: ${stats.error}명`);
            }
        }
        
        console.log('\n🎉 천천히 Auth 마이그레이션 완료!');
        console.log(`✅ 성공: ${stats.success}명`);
        console.log(`⏭️  스킵: ${stats.skip}명`);
        console.log(`❌ 실패: ${stats.error}명`);
        console.log(`📊 총 처리: ${stats.success + stats.skip + stats.error}명`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 천천히 Auth 마이그레이션 실패:', error);
        process.exit(1);
    }
}

slowAuthMigration();