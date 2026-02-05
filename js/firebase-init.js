// Firebase 초기화 스크립트
// 이 파일은 HTML에서 직접 사용할 수 있도록 작성되었습니다.

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

// Firebase 모듈이 로드된 후 초기화
// 사용 예시:
// <script type="module">
//   import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
//   import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
//   
//   const app = initializeApp(firebaseConfig);
//   const analytics = getAnalytics(app);
// </script>

// 전역으로 사용할 수 있도록 설정
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
}


