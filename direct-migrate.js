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

// 회원 데이터
const users = [
    { userId: 'sky9012', name: '이윤주', email: '', phone: '010-2795-0912', joinDate: '2025-06-18' },
    { userId: 'gic585800', name: '홍정미', email: '', phone: '010-7785-9987', joinDate: '2025-04-21' },
    { userId: 'moon05', name: '문종택', email: '', phone: '010-4247-2757', joinDate: '2025-04-28' },
    { userId: 'yjjang042', name: '장영주', email: '', phone: '010-8384-2734', joinDate: '2025-05-16' },
    { userId: 'jungkee99', name: '홍정기', email: '', phone: '010-6606-0128', joinDate: '2025-08-07' },
    { userId: 'Son2759', name: '손정숙', email: '', phone: '010-2863-2759', joinDate: '2025-04-28' },
    { userId: 'kst8008', name: '김국태', email: '', phone: '010-8008-4848', joinDate: '2025-04-10' },
    { userId: 'akrasiel', name: '김새별', email: '', phone: '010-4763-5536', joinDate: '2025-04-14' },
    { userId: 'Jefferson', name: '김건형', email: '', phone: '010-2388-0470', joinDate: '2025-09-26' },
    { userId: 'kmj0048', name: '김민주', email: '', phone: '010-7256-0048', joinDate: '2025-04-15' }
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
    console.log('🚀 회원 마이그레이션 시작...');
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