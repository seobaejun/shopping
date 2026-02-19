// 관리자 버튼: 로그인 + 관리자일 때만 표시. 그 외에는 절대 안 보이게 함
(function () {
    function apply() {
        var isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        var isAdmin = localStorage.getItem('isAdmin') === 'true';
        var showLink = isLoggedIn && isAdmin;

        document.body.classList.remove('show-admin-link');
        document.querySelectorAll('.admin-link').forEach(function (el) {
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
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }
})();



