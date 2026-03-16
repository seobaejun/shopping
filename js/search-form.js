/**
 * 공통 검색: form submit 기반. Enter / 검색 버튼 / 검색 링크 모두 search-results.html?q=검색어 로 이동.
 * (실제 파일명 사용 → 로컬·배포 모두 404 방지)
 */
(function () {
    var SEARCH_BASE = '/search-results.html';

    function goToSearch(keyword) {
        var q = (keyword != null) ? String(keyword).trim() : '';
        if (!q) return;
        try {
            sessionStorage.setItem('searchKeyword', q);
        } catch (e) {}
        var url = SEARCH_BASE + '?q=' + encodeURIComponent(q);
        window.location.href = url;
    }

    function onSearchSubmit(e) {
        e.preventDefault();
        var input = document.getElementById('searchInput');
        var q = (input && input.value) ? String(input.value).trim() : '';
        goToSearch(q);
        return false;
    }

    function init() {
        var form = document.getElementById('searchForm');
        if (form) {
            form.addEventListener('submit', onSearchSubmit);
            form.setAttribute('action', SEARCH_BASE);
            form.setAttribute('method', 'get');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.handleSearch = function (event) {
        if (event) event.preventDefault();
        var input = document.getElementById('searchInput');
        var q = (input && input.value) ? String(input.value).trim() : '';
        goToSearch(q);
        return false;
    };
})();
