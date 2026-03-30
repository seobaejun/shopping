// 간단한 Firebase 클라이언트 SDK 사용
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } = require('firebase/firestore');

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

// 새로운 회원 데이터 (아직 추가되지 않은 회원들)
const users = [
    { userId: 'like816', name: '이정은', email: '', phone: '010-9076-1673', joinDate: '2025-04-04' },
    { userId: 'jofk1130', name: '이요한', email: '', phone: '010-7702-7702', joinDate: '2025-04-10' },
    { userId: 'jyooncho0718', name: '조재윤', email: '', phone: '010-4499-2518', joinDate: '2025-04-17' },
    { userId: 'jpg07004', name: '김은혜', email: '', phone: '010-4279-1434', joinDate: '2025-07-04' },
    { userId: 'koreambk', name: '민복기', email: '', phone: '010-7226-4589', joinDate: '2025-09-16' },
    { userId: 'vbnm2233', name: '박귀환', email: '', phone: '010-6866-8179', joinDate: '2025-07-04' },
    { userId: 'htwins', name: '재성', email: '', phone: '010-6404-6439', joinDate: '2025-09-26' },
    { userId: 'can123', name: '이기태', email: '', phone: '010-7572-3788', joinDate: '2025-04-17' },
    { userId: 'dorlqhd113', name: '김기순', email: '', phone: '010-8865-4286', joinDate: '2025-06-19' },
    { userId: 'thdbs0216', name: '황소윤', email: '', phone: '010-5592-9439', joinDate: '2025-04-23' }
];

function generateTempPassword(userId, phone) {
    const phoneDigits = (phone || '').replace(/\D/g, '');
    const last4 = phoneDigits.slice(-4) || '0000';
    return `${userId}${last4}`;
}

async function checkExistingUser(userId) {
    try {
        const q = query(collection(db, 'members'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.log(`기존 회원 확인 오류 (${userId}):`, error.message);
        return true;
    }
}

async function migrateUser(userData) {
    const { userId, name, joinDate, email, phone } = userData;

    try {
        const exists = await checkExistingUser(userId);
        if (exists) {
            console.log(`⏭️  기존 회원 스킵: ${userId}`);
            return { success: true, skipped: true };
        }

        const tempPassword = generateTempPassword(userId, phone);

        const memberData = {
            userId: userId,
            email: email || '',
            name: name || '',
            userName: name || '',
            phone: phone || '',
            tempPassword: tempPassword,
            status: '정상',
            joinDate: joinDate ? new Date(joinDate) : new Date(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            purchaseAmount: 0,
            supportAmount: 0,
            referralCode: '',
            recommender: '관리자',
            mdCode: '',
            address: '',
            detailAddress: '',
            postcode: '',
            accountNumber: ''
        };

        const docRef = await addDoc(collection(db, 'members'), memberData);

        console.log(`✅ 회원 생성 성공: ${userId} (${name}) -> ${docRef.id}`);
        return { success: true };

    } catch (error) {
        console.log(`❌ 회원 생성 실패 (${userId}):`, error.message);
        return { success: false };
    }
}

async function startMigration() {
    console.log('🚀 새로운 회원 마이그레이션 시작...');
    console.log(`📋 대상 회원: ${users.length}명`);
    
    let success = 0;
    let skip = 0;
    let error = 0;

    for (let i = 0; i < users.length; i++) {
        const userData = users[i];
        console.log(`🔄 ${i + 1}/${users.length} 처리 중: ${userData.userId} (${userData.name})`);
        
        const result = await migrateUser(userData);
        
        if (result.success) {
            if (result.skipped) {
                skip++;
            } else {
                success++;
            }
        } else {
            error++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 마이그레이션 완료!');
    console.log(`✅ 성공: ${success}명`);
    console.log(`⏭️  스킵: ${skip}명`);
    console.log(`❌ 실패: ${error}명`);
    console.log(`📊 총 처리: ${success + skip + error}명`);
    
    process.exit(0);
}

startMigration().catch(error => {
    console.error('💥 마이그레이션 실패:', error);
    process.exit(1);
});