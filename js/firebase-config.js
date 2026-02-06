// Firebase Configuration
// 브라우저 환경을 위한 Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBGQdEiVOl_49oVfb8TPWkc47uaFxV55Xg",
  authDomain: "shopping-31dce.firebaseapp.com",
  projectId: "shopping-31dce",
  storageBucket: "shopping-31dce.firebasestorage.app",
  messagingSenderId: "344605730776",
  appId: "1:344605730776:web:925f9d6206b1ff2e0374ad",
  measurementId: "G-B7V6HK8Z7X"
};

// Firebase 초기화 (브라우저 환경)
if (typeof firebase !== 'undefined') {
  try {
    // Firebase App 초기화
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase App 초기화 완료');
  } catch (error) {
    // 이미 초기화된 경우 무시
    if (error.code !== 'app/duplicate-app') {
      console.error('❌ Firebase 초기화 오류:', error);
    } else {
      console.log('✅ Firebase App 이미 초기화됨');
    }
  }
} else {
  console.warn('⚠️ Firebase SDK가 로드되지 않았습니다.');
}

// 일반 JavaScript 환경에서 사용할 수 있도록 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig };
} else {
  window.firebaseConfig = firebaseConfig;
}


