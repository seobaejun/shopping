/**
 * 상단 유틸 메뉴(.top-menu): 로그인 필요한 메뉴 클릭 시
 * 비로그인이면 "로그인이 필요합니다" 팝업 후 로그인 페이지로 이동
 */
(function () {
    var LOGIN_REQUIRED_MENUS = [
        { icon: 'fa-shopping-bag', section: 'orders', text: '주문내역' },
        { icon: 'fa-comment', section: 'inquiry', text: '1:1문의' },
        { icon: 'fa-star', section: 'review-write', text: '사용후기' },
        { icon: 'fa-keyboard', section: 'product-inquiry', text: '상품문의' }
    ];

    function isLoggedIn() {
        try {
            return localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('loginUser');
        } catch (e) {
            return false;
        }
    }

    function isLoginRequiredLink(link) {
        var icon = link.querySelector('i');
        if (!icon) return null;
        var className = (icon.className || '').trim();
        for (var i = 0; i < LOGIN_REQUIRED_MENUS.length; i++) {
            if (className.indexOf(LOGIN_REQUIRED_MENUS[i].icon) !== -1) return LOGIN_REQUIRED_MENUS[i];
        }
        return null;
    }

    function init() {
        var topMenu = document.querySelector('.top-menu');
        if (!topMenu) return;

        var links = topMenu.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var menu = isLoginRequiredLink(link);
            if (!menu) continue;

            link.addEventListener('click', function (e) {
                var target = e.currentTarget;
                var m = isLoginRequiredLink(target);
                if (!m) return;

                if (!isLoggedIn()) {
                    e.preventDefault();
                    alert('로그인이 필요합니다. 로그인 후 이용해 주세요.');
                    window.location.href = 'login.html';
                    return;
                }
                e.preventDefault();
                window.location.href = 'mypage.html?section=' + m.section;
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

