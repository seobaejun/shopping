// 접속자 집계용 로그 (메인 사이트 페이지 로드 시 1회 기록)
(function () {
    var STORAGE_KEY = 'visitor_session_id';
    var LOG_COLLECTION = 'visitor_logs';

    function getOrCreateSessionId() {
        try {
            var id = sessionStorage.getItem(STORAGE_KEY);
            if (id) return id;
            id = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
            sessionStorage.setItem(STORAGE_KEY, id);
            return id;
        } catch (e) {
            return 'u_' + Date.now();
        }
    }

    function getTodayDate() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function logVisit() {
        if (typeof firebase === 'undefined' || !firebase.firestore) return;
        try {
            var db = firebase.firestore();
            var path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
            if (path.indexOf('/admin') !== -1) return; // 관리자 페이지는 제외
            db.collection(LOG_COLLECTION).add({
                date: getTodayDate(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                sessionId: getOrCreateSessionId(),
                path: path || '/'
            }).catch(function (err) {
                console.warn('방문 로그 기록 실패:', err);
            });
        } catch (e) {
            console.warn('방문 로그 오류:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', logVisit);
    } else {
        logVisit();
    }
})();




