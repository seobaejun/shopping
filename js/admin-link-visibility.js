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

    function getCurrentUserId() {
        try {
            var raw = localStorage.getItem('loginUser');
            if (raw) {
                var u = JSON.parse(raw);
                if (u && u.userId) return u.userId;
            }
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                return firebase.auth().currentUser.uid;
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
            apply();
            return;
        }
        try {
            var db = firebase.firestore();
            db.collection('admins').where('userId', '==', userId).get().then(function (snap) {
                var isAdminUser = false;
                if (snap && !snap.empty) {
                    snap.docs.forEach(function (doc) {
                        if (doc.data().status === 'active') isAdminUser = true;
                    });
                }
                if (isAdminUser) {
                    localStorage.setItem('isAdmin', 'true');
                    apply();
                    return;
                }
                db.collection('admins').get().then(function (allSnap) {
                    if (allSnap && !allSnap.empty) {
                        allSnap.docs.forEach(function (doc) {
                            var d = doc.data();
                            if (d.status === 'active' && d.userId === userId) isAdminUser = true;
                        });
                    }
                    localStorage.setItem('isAdmin', isAdminUser ? 'true' : 'false');
                    apply();
                }).catch(function () { apply(); });
            }).catch(function () { apply(); });
        } catch (e) {
            apply();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            apply();
            setTimeout(refreshAdminAndApply, 500);
        });
    } else {
        apply();
        setTimeout(refreshAdminAndApply, 500);
    }
})();
