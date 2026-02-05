// Firebase Configuration
// 환경 변수에서 Firebase 설정 가져오기
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBGQdEiVOl_49oVfb8TPWkc47uaFxV55Xg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shopping-31dce.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shopping-31dce",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shopping-31dce.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "344605730776",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:344605730776:web:925f9d6206b1ff2e0374ad",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-B7V6HK8Z7X"
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

