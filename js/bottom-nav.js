/**
 * 하단 고정 네비게이션(모바일) 클릭 처리
 * - 전체메뉴: 왼쪽 카테고리 사이드바 열기
 * - 검색: 검색창 포커스 + 상단으로 스크롤
 * - 홈/찜: href로 이동 (기본 동작)
 * - 로그인/마이페이지: href로 이동 (header-login.js가 링크 갱신)
 */
(function () {
    function initBottomNav() {
        var items = document.querySelectorAll('.bottom-nav .nav-item');
        if (!items.length) return;

        items.forEach(function (item) {
            item.addEventListener('click', function (e) {
                var nav = item.getAttribute('data-nav');
                if (nav === 'category') {
                    e.preventDefault();
                    openCategorySidebar();
                } else if (nav === 'search') {
                    e.preventDefault();
                    openSearch();
                }
                /* home, wishlist, login: 기본 링크 동작 유지 */
            });
        });
    }

    function openCategorySidebar() {
        var btn = document.getElementById('categoryBtn');
        var sidebar = document.getElementById('categorySidebar');
        if (btn) {
            btn.click();
        } else if (sidebar) {
            sidebar.classList.add('active');
        }
    }

    function openSearch() {
        var searchInput = document.getElementById('searchInput') || document.querySelector('.search-bar input');
        var searchBar = document.querySelector('.search-bar');
        if (searchInput) {
            searchInput.focus();
            if (searchBar && searchBar.scrollIntoView) {
                searchBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBottomNav);
    } else {
        initBottomNav();
    }
})();
