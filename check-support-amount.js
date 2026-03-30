// supportAmount 필드 확인
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

async function checkSupportAmount() {
    try {
        console.log('🔍 supportAmount 필드 확인 중...\n');
        
        const membersSnapshot = await getDocs(collection(db, 'members'));
        let hasSupport = [];
        let totalSupport = 0;
        
        membersSnapshot.forEach(doc => {
            const data = doc.data();
            const supportAmount = data.supportAmount || 0;
            
            if (supportAmount > 0) {
                hasSupport.push({
                    userId: data.userId,
                    name: data.name,
                    supportAmount: supportAmount
                });
                totalSupport += supportAmount;
            }
        });
        
        console.log(`💰 지원금 보유 회원: ${hasSupport.length}명`);
        console.log(`💰 총 지원금: ${totalSupport.toLocaleString()}\n`);
        
        if (hasSupport.length > 0) {
            console.log('📋 지원금 보유 회원 목록 (상위 10명):');
            hasSupport.slice(0, 10).forEach((user, index) => {
                console.log(`${index + 1}. ${user.name} (${user.userId}): ${user.supportAmount.toLocaleString()} 지원금`);
            });
            
            console.log('\n💡 해결책:');
            console.log('기존 supportAmount를 trixBalance로 활용할 수 있습니다.');
            console.log('1 지원금 = 1 트릭스로 변환하면 됩니다.');
        } else {
            console.log('❌ 지원금을 보유한 회원이 없습니다.');
            console.log('\n💡 해결책:');
            console.log('1. 트릭스 시스템은 새로운 기능이므로 초기 잔액은 0이 정상입니다.');
            console.log('2. 관리자가 트릭스를 지급하거나 사용자가 충전해야 합니다.');
            console.log('3. 테스트를 위해 특정 사용자에게만 트릭스를 지급할 수 있습니다.');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 확인 실패:', error);
        process.exit(1);
    }
}

checkSupportAmount();