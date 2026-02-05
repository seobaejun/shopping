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

// Firebase 초기화 (필요한 경우)
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// 
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// 
// export { app, analytics };

// 일반 JavaScript 환경에서 사용할 수 있도록 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig };
} else {
  window.firebaseConfig = firebaseConfig;
}


