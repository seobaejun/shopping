const admin = require('firebase-admin');

// Firebase Admin 초기화 (기존 설정 사용)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'shopping-31dce'
    });
}

const db = admin.firestore();

// 회원 데이터 (10명)
const users = [
    { userId: 'lesc0', name: '이상철', email: 'ssang9087@gmail.com', phone: '010-3024-2083', joinDate: '2025-10-17' },
    { userId: 'lesc2733', name: '이상철2', email: 'lesc2733@gmail.com', phone: '010-3024-2084', joinDate: '2025-09-29' },
    { userId: 'song53', name: '송원우', email: 'thdtjdaus@naver.com', phone: '010-3749-2700', joinDate: '2025-09-29' },
    { userId: 'juni8009', name: '이승준', email: '', phone: '010-3138-1230', joinDate: '2025-04-18' },
    { userId: 'dldudghk04', name: '이영화', email: '', phone: '010-7380-8805', joinDate: '2025-09-17' },
    { userId: 'PL464900', name: '조용훈', email: '', phone: '010-9346-5291', joinDate: '2025-05-20' },
    { userId: 'jgj4399', name: '정규정', email: '', phone: '010-4066-4399', joinDate: '2025-05-07' },
    { userId: 'ok7377', name: '이계정', email: '', phone: '010-5169-7377', joinDate: '2025-04-10' },
    { userId: 'bizidea1', name: '박종원', email: 'bizidea@kipa.org', phone: '010-5840-9881', joinDate: '2025-10-15' },
    { userId: 'khm7571', name: '김현미', email: '', phone: '010-7900-7571', joinDate: '2025-06-29' }
];

// 임시 비밀번호 생성
function generateTempPassword(userId, phone) {
    const phoneDigits = (phone || '').replace(/\D/g, '');
    const last4 = phoneDigits.slice(-4) || '0000';
    return `${userId}${last4}`;
}

// 기존 회원 확인
async function checkExistingUser(userId) {
    try {
        const userQuery = await db.collection('members').where('userId', '==', userId).limit(1).get();
        return !userQuery.empty;
    } catch (error) {
        console.log(`기존 회원 확인 오류 (${userId}):`, error.message);
        return true;
    }
}

// 단일 사용자 마이그레이션
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
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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

        const docRef = db.collection('members').doc();
        await docRef.set(memberData);

        console.log(`✅ 회원 생성 성공: ${userId} (${name}) -> ${docRef.id}`);
        return { success: true };

    } catch (error) {
        console.log(`❌ 회원 생성 실패 (${userId}):`, error.message);
        return { success: false };
    }
}

// 마이그레이션 실행
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
        
        // API 제한 방지를 위한 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 마이그레이션 완료!');
    console.log(`✅ 성공: ${success}명`);
    console.log(`⏭️  스킵: ${skip}명`);
    console.log(`❌ 실패: ${error}명`);
    console.log(`📊 총 처리: ${success + skip + error}명`);
    
    process.exit(0);
}

// 실행
startMigration().catch(error => {
    console.error('💥 마이그레이션 실패:', error);
    process.exit(1);
});