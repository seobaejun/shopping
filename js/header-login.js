/**
 * 공통: 로그인 상태에 따라 헤더(로그인/로그아웃, 회원가입/마이페이지) 갱신
 * 상세페이지 등 script.js를 로드하지 않는 페이지에서 로그인 유지
 */
function updateHeaderForLoginStatus() {
    var isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    var loginUserData = localStorage.getItem('loginUser');
    if (isLoggedIn && loginUserData) {
        try {
            var user = JSON.parse(loginUserData);
            updateHeaderToLoggedIn(user);
        } catch (e) {
            console.warn('loginUser 파싱 오류:', e);
        }
    }
}

function updateHeaderToLoggedIn(user) {
    var userMenus = document.querySelectorAll('.user-menu');
    userMenus.forEach(function (userMenu) {
        var loginLink = userMenu.querySelector('a[href="login.html"]');
        if (!loginLink) {
            var links = userMenu.querySelectorAll('a');
            for (var i = 0; i < links.length; i++) {
                if (links[i].textContent.indexOf('로그인') !== -1) {
                    loginLink = links[i];
                    break;
                }
            }
        }
        if (loginLink) {
            loginLink.href = '#';
            loginLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> 로그아웃';
            loginLink.onclick = function (e) {
                e.preventDefault();
                handleLogout();
            };
        }
        var signupLink = userMenu.querySelector('a[href="signup.html"], .signup-btn');
        if (signupLink) {
            signupLink.href = 'mypage.html';
            signupLink.innerHTML = '<i class="fas fa-user-circle"></i> 마이페이지';
            signupLink.classList.remove('signup-btn');
            signupLink.classList.add('mypage-btn');
        }
    });
    var sidebarQuick = document.querySelector('.user-quick');
    if (sidebarQuick && user && user.name) {
        sidebarQuick.innerHTML =
            '<a href="mypage.html"><i class="fas fa-user-circle"></i> ' + (user.name || '') + '님</a>' +
            '<a href="#" onclick="handleLogout(); return false;"><i class="fas fa-sign-out-alt"></i> 로그아웃</a>';
    }
}

function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('loginUser');
        localStorage.removeItem('isLoggedIn');
        localStorage.setItem('isAdmin', 'false');
        alert('로그아웃 되었습니다.');
        window.location.href = 'index.html';
    }
}

(function () {
    function run() {
        updateHeaderForLoginStatus();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();

window.updateHeaderForLoginStatus = updateHeaderForLoginStatus;
window.handleLogout = handleLogout;
