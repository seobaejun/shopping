// 특정 사용자의 트릭스 데이터 확인
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, doc, getDoc } = require('firebase/firestore');

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

async function checkUserTrix() {
    try {
        console.log('🔍 사용자 트릭스 데이터 확인 중...\n');
        
        // 몇 명의 샘플 사용자 확인
        const membersSnapshot = await getDocs(collection(db, 'members'));
        console.log(`📊 총 ${membersSnapshot.size}명의 회원 데이터 구조 확인\n`);
        
        let sampleCount = 0;
        membersSnapshot.forEach(doc => {
            if (sampleCount < 5) {
                const data = doc.data();
                console.log(`👤 회원 ${sampleCount + 1}:`);
                console.log(`   - UID: ${doc.id}`);
                console.log(`   - userId: ${data.userId}`);
                console.log(`   - name: ${data.name}`);
                console.log(`   - trixBalance: ${data.trixBalance || '없음'} (타입: ${typeof data.trixBalance})`);
                console.log(`   - supportAmount: ${data.supportAmount || '없음'}`);
                
                // 모든 필드 확인
                const fields = Object.keys(data);
                const trixRelated = fields.filter(field => 
                    field.toLowerCase().includes('trix') || 
                    field.toLowerCase().includes('support') ||
                    field.toLowerCase().includes('balance')
                );
                
                if (trixRelated.length > 0) {
                    console.log(`   - 트릭스 관련 필드: ${trixRelated.join(', ')}`);
                }
                console.log('');
                sampleCount++;
            }
        });
        
        // members 컬렉션 구조 분석
        console.log('📋 데이터베이스 구조 분석:');
        console.log('1. trixBalance 필드가 있는지 확인');
        console.log('2. supportAmount 필드와의 관계 확인');
        console.log('3. 기존 포인트/지원금 시스템과의 연동 확인\n');
        
        // 실제 트릭스 시스템이 구현되어 있는지 확인
        console.log('💡 해결 방법:');
        console.log('1. 기존 supportAmount를 trixBalance로 사용');
        console.log('2. 새로운 trixBalance 필드 추가');
        console.log('3. 마이페이지 로직 수정');
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 확인 실패:', error);
        process.exit(1);
    }
}

checkUserTrix();