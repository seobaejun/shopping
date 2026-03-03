/**
 * 최근 본 상품 - 공통 스크립트 (모든 페이지 동일 로직, 개수/목록 일치)
 * localStorage 키: todayViewedProducts
 */
(function () {
    var STORAGE_KEY = 'todayViewedProducts';
    var MAX_ITEMS = 20;

    function getViewedProducts() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function getUniqueCount() {
        var list = getViewedProducts();
        var ids = new Set();
        list.forEach(function (p) {
            if (p && p.id) ids.add(p.id);
        });
        return ids.size;
    }

    function getUniqueList() {
        var list = getViewedProducts();
        var out = [];
        var seen = new Set();
        list.forEach(function (p) {
            if (p && p.id && !seen.has(p.id)) {
                seen.add(p.id);
                out.push(p);
            }
        });
        return out;
    }

    function updateViewedCount() {
        var count = getUniqueCount();
        var toggleViewed = document.getElementById('toggleViewed');
        if (toggleViewed) {
            var countBadge = toggleViewed.querySelector('.count');
            if (countBadge) {
                countBadge.textContent = count;
                countBadge.style.display = count > 0 ? 'flex' : 'none';
            }
        }
        var viewedCountBadge = document.getElementById('viewedCountBadge');
        if (viewedCountBadge) viewedCountBadge.textContent = count;
    }

    function updateViewedList() {
        var viewedList = document.getElementById('viewedList');
        if (!viewedList) return;
        var list = getUniqueList();
        if (list.length === 0) {
            viewedList.innerHTML = '<p class="empty-message">최근 본 상품이 없습니다.</p>';
            return;
        }
        var html = list.map(function (p) {
            var name = (p.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            var price = p.price != null ? Number(p.price).toLocaleString() + '원' : '';
            return '<div class="viewed-item" data-product-id="' + (p.id || '') + '" style="cursor: pointer;">' +
                '<img src="' + (p.image || 'https://via.placeholder.com/80x80') + '" alt="">' +
                '<div class="viewed-item-info"><p>' + name + '</p><span class="price">' + price + '</span></div></div>';
        }).join('');
        viewedList.innerHTML = html;
        viewedList.querySelectorAll('.viewed-item').forEach(function (el) {
            el.addEventListener('click', function () {
                var id = el.getAttribute('data-product-id');
                if (id) {
                    var panel = document.getElementById('viewedPanel');
                    if (panel) panel.classList.remove('active');
                    window.location.href = 'product-detail.html?id=' + encodeURIComponent(id);
                }
            });
        });
    }

    function initTodayViewed() {
        updateViewedCount();
        var toggleViewed = document.getElementById('toggleViewed');
        var viewedPanel = document.getElementById('viewedPanel');
        if (toggleViewed && viewedPanel) {
            toggleViewed.addEventListener('click', function () {
                viewedPanel.classList.add('active');
                updateViewedList();
            });
        }
        var closeBtn = document.getElementById('viewedPanelClose');
        if (closeBtn && viewedPanel) {
            closeBtn.addEventListener('click', function () {
                viewedPanel.classList.remove('active');
            });
        }
        if (viewedPanel) {
            var overlay = viewedPanel.querySelector('.viewed-panel-overlay');
            if (overlay) {
                overlay.addEventListener('click', function () {
                    viewedPanel.classList.remove('active');
                });
            }
        }
        var btnClearAll = document.getElementById('btnClearAll');
        if (btnClearAll) {
            btnClearAll.addEventListener('click', function () {
                if (confirm('최근 본 상품을 모두 삭제하시겠습니까?')) {
                    localStorage.removeItem(STORAGE_KEY);
                    updateViewedList();
                    updateViewedCount();
                }
            });
        }
    }

    function addToTodayViewed(product) {
        if (!product || !product.id) return;
        var list = getViewedProducts();
        list = list.filter(function (p) { return p && p.id !== product.id; });
        list.unshift({
            id: product.id,
            name: product.name || '',
            price: product.price != null ? product.price : 0,
            image: product.image || ''
        });
        list = list.slice(0, MAX_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        updateViewedCount();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTodayViewed);
    } else {
        initTodayViewed();
    }

    window.updateViewedCount = updateViewedCount;
    window.updateViewedList = updateViewedList;
    window.addToTodayViewed = addToTodayViewed;
})();
