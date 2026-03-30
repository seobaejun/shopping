// 관리자 페이지 173명 vs Firebase Auth 172명의 1명 차이 찾기
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

async function findMissingOne() {
    try {
        console.log('🔍 1명 차이의 정체 찾기 시작...\n');
        
        // 1. Firestore에서 모든 회원 가져오기
        const membersSnapshot = await getDocs(collection(db, 'members'));
        const allMembers = [];
        
        membersSnapshot.forEach(doc => {
            const data = doc.data();
            allMembers.push({
                userId: data.userId,
                email: data.email,
                name: data.name,
                hasEmail: !!(data.email && data.email.trim() && !data.email.includes('@temp.local'))
            });
        });
        
        console.log(`📊 Firestore 총 회원: ${allMembers.length}명`);
        
        // 2. 이메일 있는 회원만 필터링
        const membersWithEmail = allMembers.filter(m => m.hasEmail);
        console.log(`✅ 이메일 있는 회원: ${membersWithEmail.length}명`);
        
        // 3. 이메일 없는 회원 확인
        const membersWithoutEmail = allMembers.filter(m => !m.hasEmail);
        console.log(`❌ 이메일 없는 회원: ${membersWithoutEmail.length}명`);
        console.log('이메일 없는 회원들:', membersWithoutEmail.map(m => `${m.userId} (${m.name})`).join(', '));
        
        // 4. 관리자 페이지에서 필터링될 가능성이 있는 회원들 찾기
        console.log('\n🔍 특별한 회원들 분석:');
        
        const specialMembers = membersWithEmail.filter(m => {
            return (
                m.userId === 'admin' ||
                m.userId === 'admin2' ||
                m.userId.startsWith('test') ||
                m.userId.includes('admin') ||
                m.name === '최고관리자' ||
                m.email.includes('admin') ||
                m.email.includes('test')
            );
        });
        
        console.log(`🎯 특별한 회원들: ${specialMembers.length}명`);
        specialMembers.forEach((member, index) => {
            console.log(`${index + 1}. ${member.userId} (${member.name}) - ${member.email}`);
        });
        
        // 5. 예상 계산
        console.log('\n📊 예상 계산:');
        console.log(`전체 이메일 있는 회원: ${membersWithEmail.length}명`);
        console.log(`특별한 회원 (필터링 가능): ${specialMembers.length}명`);
        console.log(`일반 회원 (관리자 페이지 표시): ${membersWithEmail.length - specialMembers.length}명`);
        
        // 6. 관리자 페이지 173명과 비교
        const expectedNormalMembers = membersWithEmail.length - specialMembers.length;
        console.log(`\n🎯 분석 결과:`);
        console.log(`예상 일반 회원: ${expectedNormalMembers}명`);
        console.log(`관리자 페이지 실제: 173명`);
        console.log(`차이: ${expectedNormalMembers - 173}명`);
        
        if (expectedNormalMembers === 173) {
            console.log('✅ 관리자 페이지 수가 정확합니다!');
            console.log('🔍 Firebase Auth에서 누락된 1명을 찾아야 합니다.');
        } else if (expectedNormalMembers > 173) {
            console.log(`⚠️ 관리자 페이지에서 ${expectedNormalMembers - 173}명이 추가로 필터링되고 있습니다.`);
        }
        
        // 7. 마이그레이션 로그에서 실패한 회원 찾기
        console.log('\n🔍 마이그레이션 실패 가능성 높은 회원들:');
        const suspiciousMembers = membersWithEmail.filter(m => {
            return (
                m.email.includes('@temp10shopping.com') ||
                !m.email.includes('@') ||
                m.email.length < 5
            );
        });
        
        console.log(`🎯 의심스러운 이메일: ${suspiciousMembers.length}명`);
        suspiciousMembers.slice(0, 5).forEach((member, index) => {
            console.log(`${index + 1}. ${member.userId} (${member.name}) - ${member.email}`);
        });
        
        console.log('\n💡 결론:');
        console.log('1. 관리자 페이지 173명은 특별한 회원들을 제외한 정상적인 수일 가능성');
        console.log('2. Firebase Auth 172명은 마이그레이션 중 1명이 실패했을 가능성');
        console.log('3. 정확한 확인을 위해서는 Firebase Console에서 Auth 목록을 직접 비교 필요');
        
    } catch (error) {
        console.error('💥 분석 실패:', error);
    }
}

findMissingOne();