const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'shopping-31dce'
    });
}

async function checkAuthUsers() {
    try {
        console.log('🔍 Firebase Auth 사용자 수 확인 중...');
        
        const listUsers = await admin.auth().listUsers();
        console.log(`📊 Firebase Auth 총 사용자 수: ${listUsers.users.length}명`);
        
        // 최근 사용자 5명 확인
        console.log('\n📋 최근 사용자 5명:');
        listUsers.users.slice(0, 5).forEach((user, index) => {
            console.log(`${index + 1}. ${user.uid} - ${user.email}`);
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Auth 확인 중 오류:', error.message);
        process.exit(1);
    }
}

checkAuthUsers();