// 관리자 버튼: 로그인 + 관리자일 때만 표시. 페이지 로드 시 Firestore에서 관리자 여부 재확인
(function () {
    function apply() {
        var isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        var isAdmin = localStorage.getItem('isAdmin') === 'true';
        var showLink = isLoggedIn && isAdmin;

        document.body.classList.remove('show-admin-link');
        var links = document.querySelectorAll('.admin-link');
        if (links.length === 0) return;
        links.forEach(function (el) {
            if (showLink) {
                el.style.setProperty('display', 'inline-flex', 'important');
                el.style.setProperty('visibility', 'visible', 'important');
                el.removeAttribute('aria-hidden');
                el.removeAttribute('tabindex');
            } else {
                el.style.setProperty('display', 'none', 'important');
                el.style.setProperty('visibility', 'hidden', 'important');
                el.setAttribute('aria-hidden', 'true');
                el.setAttribute('tabindex', '-1');
            }
        });
        if (showLink) {
            document.body.classList.add('show-admin-link');
        } else {
            localStorage.setItem('isAdmin', 'false');
        }
    }

    /** 로그인한 회원의 userId (admins 컬렉션과 비교용). loginUser.userId 우선, 없으면 uid */
    function getCurrentUserId() {
        try {
            var raw = localStorage.getItem('loginUser');
            if (raw) {
                var u = JSON.parse(raw);
                if (u && u.userId) return String(u.userId).trim();
                if (u && u.uid) return String(u.uid).trim();
            }
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                return firebase.auth().currentUser.uid;
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    function getCurrentUserName() {
        try {
            var raw = localStorage.getItem('loginUser');
            if (raw) {
                var u = JSON.parse(raw);
                if (u && u.name) return String(u.name).trim();
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    function refreshAdminAndApply() {
        var isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            apply();
            return;
        }
        var userId = getCurrentUserId();
        if (!userId) {
            apply();
            return;
        }
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            setTimeout(refreshAdminAndApply, 600);
            return;
        }
        var db;
        try {
            db = firebase.firestore();
        } catch (e) {
            setTimeout(refreshAdminAndApply, 600);
            return;
        }
        db.collection('admins').where('userId', '==', userId).get().then(function (snap) {
            var isAdminUser = false;
            if (snap && !snap.empty) {
                snap.docs.forEach(function (doc) {
                    if (doc.data().status === 'active') isAdminUser = true;
                });
            }
            if (!isAdminUser) {
                return db.collection('admins').get();
            }
            localStorage.setItem('isAdmin', 'true');
            apply();
            return null;
        }).then(function (allSnap) {
            if (!allSnap) return;
            var isAdminUser = false;
            var userId = getCurrentUserId();
            var userName = getCurrentUserName();
            if (allSnap && !allSnap.empty) {
                allSnap.docs.forEach(function (doc) {
                    var d = doc.data();
                    if (d.status !== 'active') return;
                    if (userId && String(d.userId || '').trim() === userId) isAdminUser = true;
                    if (!isAdminUser && userName && String(d.name || '').trim() === userName) isAdminUser = true;
                });
            }
            localStorage.setItem('isAdmin', isAdminUser ? 'true' : 'false');
            apply();
        }).catch(function () { apply(); });
    }

    function run() {
        apply();
        setTimeout(refreshAdminAndApply, 400);
        setTimeout(refreshAdminAndApply, 1500);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
