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

function _doFirebaseInit() {
  if (typeof firebase === 'undefined') return false;
  if (firebase.apps && firebase.apps.length > 0) {
    try { window.dispatchEvent(new Event('firebase-ready')); } catch (e) {}
    return true;
  }
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase App 초기화 완료');
    try { window.dispatchEvent(new Event('firebase-ready')); } catch (e) {}
    return true;
  } catch (error) {
    if (error.code === 'app/duplicate-app') {
      try { window.dispatchEvent(new Event('firebase-ready')); } catch (e) {}
      return true;
    }
    console.error('❌ Firebase 초기화 오류:', error);
    return false;
  }
}

_doFirebaseInit();

if (typeof firebase === 'undefined') {
  console.warn('⚠️ Firebase SDK가 로드되지 않았습니다. 로드 후 초기화 재시도.');
  (function retryInit() {
    var attempts = 0;
    var t = setInterval(function () {
      attempts++;
      if (typeof firebase !== 'undefined') {
        clearInterval(t);
        _doFirebaseInit();
        return;
      }
      if (attempts >= 80) {
        clearInterval(t);
      }
    }, 100);
  })();
}

document.addEventListener('DOMContentLoaded', function () {
  if (typeof firebase !== 'undefined' && (!firebase.apps || firebase.apps.length === 0)) {
    _doFirebaseInit();
  }
  setTimeout(function () {
    if (typeof firebase !== 'undefined' && firebase.firestore) try { window.dispatchEvent(new Event('firebase-ready')); } catch (e) {};
  }, 300);
});

// Firebase 준비될 때까지 대기. 이벤트 + 폴링并用 (캐시/탭 전환 등 타이밍 꼬여도 동작)
window.whenFirebaseReady = function () {
  return new Promise(function (resolve) {
    var ready = typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0;
    if (ready) {
      console.log('[firebase-config] whenFirebaseReady 이미 준비됨');
      resolve();
      return;
    }
    console.log('[firebase-config] whenFirebaseReady 대기 시작 (이벤트+폴링)');
    var resolved = false;
    function done() {
      if (resolved) return;
      resolved = true;
      window.removeEventListener('firebase-ready', onReady);
      if (intervalId) clearInterval(intervalId);
      console.log('[firebase-config] whenFirebaseReady 완료');
      resolve();
    }
    function onReady() { done(); }
    window.addEventListener('firebase-ready', onReady);
    var intervalId = setInterval(function () {
      if (typeof firebase !== 'undefined' && firebase.firestore && firebase.apps && firebase.apps.length > 0) done();
    }, 150);
    setTimeout(function () {
      if (!resolved) {
        console.warn('[firebase-config] whenFirebaseReady 8초 타임아웃');
        done();
      }
    }, 8000);
  });
};

// 일반 JavaScript 환경에서 사용할 수 있도록 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig };
} else {
  window.firebaseConfig = firebaseConfig;
}


