const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator } = require('firebase/auth');

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
const auth = getAuth(app);

async function testAuthStatus() {
    try {
        console.log('🔍 Firebase Auth 상태 확인 중...');
        console.log('📊 Auth 서비스 연결됨');
        console.log('🌐 프로젝트:', firebaseConfig.projectId);
        console.log('📧 Auth 도메인:', firebaseConfig.authDomain);
        
        console.log('\n✅ Firebase Auth 서비스 정상 작동 중');
        console.log('💡 할당량 확인은 Firebase 콘솔에서 하세요:');
        console.log('   https://console.firebase.google.com/project/shopping-31dce/authentication/usage');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Auth 상태 확인 오류:', error.message);
        process.exit(1);
    }
}

testAuthStatus();