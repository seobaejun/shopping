// 천천히 처리하는 Firebase Auth 마이그레이션
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } = require('firebase/firestore');
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

async function checkExistingUser(userId, email) {
    try {
        // 더 긴 대기 시간으로 읽기 요청 제한 방지
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
        
        if (userId) {
            const userQuery = await getDocs(query(collection(db, 'members'), where('userId', '==', userId)));
            if (!userQuery.empty) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.log(`기존 회원 확인 오류 (${userId}):`, error.message);
        return true; // 오류 시 안전하게 스킵
    }
}

async function migrateUserToAuth(memberData) {
    const { userId, email, tempPassword, name } = memberData;

    try {
        // 기존 회원 확인 (천천히)
        const exists = await checkExistingUser(userId, email);
        if (exists) {
            console.log(`⏭️  기존 회원 스킵: ${userId}`);
            stats.skip++;
            return { success: true, skipped: true };
        }

        // 이메일이 없으면 임시 이메일 생성
        const authEmail = email || `${userId}@temp.local`;
        
        // Firebase Auth에 사용자 생성 (천천히)
        console.log(`🔄 Auth 계정 생성 중: ${userId} (${authEmail})`);
        
        await createUserWithEmailAndPassword(auth, authEmail, tempPassword);
        
        console.log(`✅ Auth 계정 생성 성공: ${userId}`);
        stats.success++;
        return { success: true };

    } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
            console.log(`⏭️  Auth 계정 이미 존재: ${userId}`);
            stats.skip++;
            return { success: true, skipped: true };
        } else {
            console.log(`❌ Auth 계정 생성 실패 (${userId}): ${authError.message}`);
            stats.error++;
            return { success: false, error: authError.message };
        }
    }
}

async function slowMigration() {
    try {
        console.log('🐌 천천히 Firebase Auth 마이그레이션 시작...');
        console.log('⏰ 각 회원마다 5초씩 대기하여 API 제한 방지');
        
        // Firestore에서 회원 데이터 가져오기
        const membersSnapshot = await getDocs(collection(db, 'members'));
        console.log(`📊 총 ${membersSnapshot.size}명의 회원 발견`);
        
        let processedCount = 0;
        const totalCount = membersSnapshot.size;
        
        for (const doc of membersSnapshot.docs) {
            const memberData = doc.data();
            processedCount++;
            
            console.log(`\n🔄 ${processedCount}/${totalCount} 처리 중: ${memberData.userId}`);
            
            await migrateUserToAuth(memberData);
            
            // 매우 긴 대기 시간 (5초) - API 제한 완전 방지
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
        
        console.log('\n🎉 천천히 마이그레이션 완료!');
        console.log(`✅ 성공: ${stats.success}명`);
        console.log(`⏭️  스킵: ${stats.skip}명`);
        console.log(`❌ 실패: ${stats.error}명`);
        console.log(`📊 총 처리: ${stats.success + stats.skip + stats.error}명`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 천천히 마이그레이션 실패:', error);
        process.exit(1);
    }
}

slowMigration();