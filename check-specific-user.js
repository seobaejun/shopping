// 특정 사용자(서배준) 트릭스 데이터 확인
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

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

async function checkSpecificUser() {
    try {
        console.log('🔍 서배준 사용자 트릭스 데이터 확인...\n');
        
        // 서배준 사용자 찾기 (여러 방법으로 검색)
        const searches = [
            { field: 'userId', value: '서배준' },
            { field: 'name', value: '서배준' },
            { field: 'userId', value: 'seobaejun' },
            { field: 'name', value: 'seobaejun' }
        ];
        
        let foundUser = null;
        
        for (const search of searches) {
            console.log(`🔍 ${search.field}='${search.value}'로 검색 중...`);
            const userQuery = await getDocs(query(
                collection(db, 'members'), 
                where(search.field, '==', search.value)
            ));
            
            if (!userQuery.empty) {
                foundUser = {
                    docId: userQuery.docs[0].id,
                    data: userQuery.docs[0].data()
                };
                console.log(`✅ 사용자 발견!`);
                break;
            }
        }
        
        if (!foundUser) {
            console.log('❌ 서배준 사용자를 찾을 수 없습니다.');
            
            // 이름에 '서' 또는 '배준'이 포함된 사용자 검색
            console.log('\n🔍 유사한 이름의 사용자 검색...');
            const allUsers = await getDocs(collection(db, 'members'));
            const similarUsers = [];
            
            allUsers.forEach(doc => {
                const data = doc.data();
                const name = data.name || '';
                const userId = data.userId || '';
                
                if (name.includes('서') || name.includes('배') || name.includes('준') ||
                    userId.includes('seo') || userId.includes('baejun')) {
                    similarUsers.push({
                        docId: doc.id,
                        userId: data.userId,
                        name: data.name,
                        trixBalance: data.trixBalance,
                        supportAmount: data.supportAmount
                    });
                }
            });
            
            if (similarUsers.length > 0) {
                console.log('📋 유사한 사용자들:');
                similarUsers.forEach((user, index) => {
                    console.log(`${index + 1}. ${user.name} (${user.userId}) - 트릭스: ${user.trixBalance || 0}, 지원금: ${user.supportAmount || 0}`);
                });
            }
            
            return;
        }
        
        // 사용자 정보 출력
        const userData = foundUser.data;
        console.log('\n👤 사용자 정보:');
        console.log(`   - Document ID: ${foundUser.docId}`);
        console.log(`   - userId: ${userData.userId}`);
        console.log(`   - name: ${userData.name}`);
        console.log(`   - email: ${userData.email}`);
        console.log(`   - trixBalance: ${userData.trixBalance || '없음'} (타입: ${typeof userData.trixBalance})`);
        console.log(`   - supportAmount: ${userData.supportAmount || '없음'} (타입: ${typeof userData.supportAmount})`);
        
        // 트릭스 내역 확인
        console.log('\n📜 트릭스 사용 내역:');
        const historyQuery = await getDocs(query(
            collection(db, 'trixHistory'),
            where('userId', '==', userData.userId)
        ));
        
        if (historyQuery.empty) {
            console.log('   - 트릭스 내역이 없습니다.');
        } else {
            historyQuery.forEach(doc => {
                const history = doc.data();
                const date = history.createdAt ? new Date(history.createdAt.seconds * 1000).toLocaleDateString() : '날짜 없음';
                console.log(`   - ${date}: ${history.description} (${history.amount > 0 ? '+' : ''}${history.amount} TRIX, 잔액: ${history.balance})`);
            });
        }
        
        // 로그인 정보와 매칭 확인
        console.log('\n🔍 로그인 정보 매칭 확인:');
        console.log('마이페이지에서 사용하는 UID와 일치하는지 확인이 필요합니다.');
        console.log(`현재 Document ID: ${foundUser.docId}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('💥 확인 실패:', error);
        process.exit(1);
    }
}

checkSpecificUser();