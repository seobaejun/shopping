/**
 * 공통 네비게이션 카테고리 (사이드바 + 메인 네비)
 * 모든 페이지에서 동일한 카테고리 메뉴 표시, 호버 시 하위 카테고리 표시
 */

function buildCategoryTree(categories) {
    if (!categories || !Array.isArray(categories)) return [];
    const level1 = categories.filter(function (c) { return Number(c.level) === 1 && !c.parentId; });
    return level1.map(function (cat1) {
        const level2 = categories.filter(function (c) { return Number(c.level) === 2 && c.parentId === cat1.id; });
        return {
            id: cat1.id,
            name: cat1.name,
            children: level2.map(function (cat2) {
                const level3 = categories.filter(function (c) { return Number(c.level) === 3 && c.parentId === cat2.id; });
                return { id: cat2.id, name: cat2.name, children: level3 };
            })
        };
    });
}

function renderSidebarCategoryMenu(categoryTree) {
    if (!categoryTree || categoryTree.length === 0) return '';
    var html = '';
    categoryTree.forEach(function (cat1) {
        var hasChildren = cat1.children && cat1.children.length > 0;
        var name = (cat1.name || '(이름 없음)').replace(/</g, '&lt;');
        var dataId = (cat1.id || '').replace(/"/g, '&quot;');
        html += '<li' + (hasChildren ? ' class="has-submenu"' : '') + (dataId ? ' data-category-id="' + dataId + '"' : '') + '>';
        if (hasChildren) {
            html += '<a href="#" onclick="toggleSubmenu(event, this)">' + name + '</a>';
            html += '<ul class="submenu">';
            cat1.children.forEach(function (cat2) {
                var hasGrand = cat2.children && cat2.children.length > 0;
                var name2 = (cat2.name || '(이름 없음)').replace(/</g, '&lt;');
                html += '<li' + (hasGrand ? ' class="has-submenu"' : '') + '>';
                if (hasGrand) {
                    html += '<a href="#" onclick="toggleSubmenu(event, this)">' + name2 + '</a><ul class="submenu">';
                    cat2.children.forEach(function (cat3) {
                        var name3 = (cat3.name || '(이름 없음)').replace(/</g, '&lt;');
                        html += '<li><a href="' + getCategoryListHref(cat3.id) + '">' + name3 + '</a></li>';
                    });
                    html += '</ul>';
                } else {
                    html += '<a href="' + getCategoryListHref(cat2.id) + '">' + name2 + '</a>';
                }
                html += '</li>';
            });
            html += '</ul>';
        } else {
            html += '<a href="' + getCategoryListHref(cat1.id) + '">' + name + '</a>';
        }
        html += '</li>';
    });
    return html;
}

function getCategoryListHref(categoryId) {
    var path = window.location.pathname || '';
    if (/products-list/.test(path)) return '?category=' + encodeURIComponent(categoryId);
    return 'products-list.html?category=' + encodeURIComponent(categoryId);
}

function renderMainNavCategories(categoryTree) {
    if (!categoryTree || categoryTree.length === 0) return '';
    var html = '';
    categoryTree.forEach(function (cat1) {
        if (!cat1 || !cat1.id) return;
        var hasChildren = cat1.children && cat1.children.length > 0;
        var name = (cat1.name || '(이름 없음)').replace(/</g, '&lt;');
        var catHref = getCategoryListHref(cat1.id);
        html += '<li' + (hasChildren ? ' class="has-submenu"' : '') + '>';
        if (hasChildren) {
            html += '<span class="mainnav-toggle" data-mainnav-toggle role="button" tabindex="0">' + name + ' <i class="fas fa-chevron-down nav-cat-chevron"></i></span>';
        } else {
            html += '<a href="' + catHref + '">' + name + '</a>';
        }
        if (hasChildren) {
            html += '<ul class="submenu submenu-level2">';
            cat1.children.forEach(function (cat2) {
                if (!cat2 || !cat2.id) return;
                var name2 = (cat2.name || '(이름 없음)').replace(/</g, '&lt;');
                var hasGrand = cat2.children && cat2.children.length > 0;
                if (hasGrand) {
                    html += '<li class="has-submenu">';
                    html += '<span class="submenu-trigger-2" role="button" tabindex="0">' + name2 + ' <i class="fas fa-chevron-down submenu-chevron-down"></i></span>';
                    html += '<ul class="submenu submenu-level3">';
                    cat2.children.forEach(function (cat3) {
                        if (!cat3 || !cat3.id) return;
                        var name3 = (cat3.name || '(이름 없음)').replace(/</g, '&lt;');
                        html += '<li><a href="' + getCategoryListHref(cat3.id) + '">' + name3 + '</a></li>';
                    });
                    html += '</ul></li>';
                } else {
                    html += '<li><a href="' + getCategoryListHref(cat2.id) + '">' + name2 + '</a></li>';
                }
            });
            html += '</ul>';
        }
        html += '</li>';
    });
    return html;
}

function toggleMainNavSubmenu(event, element) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    var li = element && element.closest ? element.closest('li') : (element && element.parentElement);
    if (!li) return;
    var mainNav = document.getElementById('mainNavCategories');
    if (mainNav) {
        mainNav.querySelectorAll('li.submenu-open').forEach(function (el) {
            if (el !== li) el.classList.remove('submenu-open');
        });
    }
    var isOpen = li.classList.contains('submenu-open');
    if (isOpen) {
        li.classList.remove('submenu-open');
    } else {
        li.classList.add('submenu-open');
    }
}

function toggleSubmenu(event, element) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    var parentLi = element && element.parentElement;
    if (!parentLi) return;
    var isActive = parentLi.classList.contains('active');
    var siblings = parentLi.parentElement ? Array.from(parentLi.parentElement.children) : [];
    siblings.forEach(function (sibling) {
        if (sibling !== parentLi) {
            sibling.classList.remove('active');
            var subMenus = sibling.querySelectorAll('.has-submenu');
            subMenus.forEach(function (sub) { sub.classList.remove('active'); });
        }
    });
    if (isActive) {
        parentLi.classList.remove('active');
        parentLi.querySelectorAll('.has-submenu').forEach(function (sub) { sub.classList.remove('active'); });
    } else {
        parentLi.classList.add('active');
    }
}

function initCategorySidebar() {
    var categoryBtn = document.getElementById('categoryBtn');
    var categorySidebar = document.getElementById('categorySidebar');
    var closeSidebar = document.getElementById('closeSidebar');
    if (categoryBtn && categorySidebar) {
        categoryBtn.addEventListener('click', function () {
            categorySidebar.classList.add('active');
        });
    }
    if (closeSidebar && categorySidebar) {
        closeSidebar.addEventListener('click', function () {
            categorySidebar.classList.remove('active');
        });
    }
    if (categorySidebar) {
        categorySidebar.addEventListener('click', function (e) {
            if (e.target === categorySidebar) categorySidebar.classList.remove('active');
        });
    }
}

async function loadNavCategories() {
    var categoryList = document.getElementById('categoryList');
    var mainNavCategories = document.getElementById('mainNavCategories');
    if (!categoryList && !mainNavCategories) return;
    try {
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            if (!window._navCategoriesRetryCount) window._navCategoriesRetryCount = 0;
            if (window._navCategoriesRetryCount < 5) {
                window._navCategoriesRetryCount++;
                setTimeout(loadNavCategories, 300 * window._navCategoriesRetryCount);
            }
            return;
        }
        var db = firebase.firestore();
        var snapshot = await db.collection('categories').get();
        var categories = [];
        snapshot.forEach(function (doc) {
            var data = doc.data();
            if (data.isHidden === true) return;
            var displayName = (data.name != null && String(data.name).trim() !== '') ? String(data.name).trim()
                : ((data.categoryName != null && String(data.categoryName).trim() !== '') ? String(data.categoryName).trim()
                    : ((data.title != null && String(data.title).trim() !== '') ? String(data.title).trim() : '(이름 없음)'));
            categories.push({
                id: doc.id,
                name: displayName,
                level: data.level != null ? Number(data.level) : 1,
                parentId: data.parentId != null && data.parentId !== '' ? data.parentId : null,
                sortOrder: data.sortOrder != null ? Number(data.sortOrder) : 0,
                isPublic: data.isPublic
            });
        });
        categories.sort(function (a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });
        var isAdmin = localStorage.getItem('isAdmin') === 'true';
        var categoriesToShow = isAdmin ? categories : categories.filter(function (c) { return c.isPublic !== false; });
        var categoryTree = buildCategoryTree(categoriesToShow);
        if (categoryList) {
            categoryList.innerHTML = renderSidebarCategoryMenu(categoryTree);
        }
        if (mainNavCategories) {
            mainNavCategories.innerHTML = renderMainNavCategories(categoryTree);
        }
    } catch (err) {
        console.error('카테고리 로드 오류:', err);
    }
}

function initMainNavSubmenu() {
    if (window._mainNavDelegationDone) return;
    window._mainNavDelegationDone = true;

    var nav = document.getElementById('mainNavCategories');
    if (!nav) return;

    function openDropdown(li) {
        var sub = li.querySelector('.submenu');
        if (!sub) return;
        nav.querySelectorAll('li.submenu-open').forEach(function (el) { el.classList.remove('submenu-open'); });
        li.classList.add('submenu-open');

        var existing = document.getElementById('mainNavSubmenuPortal');
        if (existing) existing.parentNode.removeChild(existing);
        var rect = li.querySelector('[data-mainnav-toggle]').getBoundingClientRect();
        var clone = sub.cloneNode(true);
        clone.id = 'mainNavSubmenuPortal';
        clone.className = clone.className + ' main-nav-submenu-portal';
        document.body.appendChild(clone);
        clone.style.position = 'fixed';
        clone.style.left = Math.max(0, Math.min(rect.left, window.innerWidth - 220)) + 'px';
        clone.style.top = rect.bottom + 'px';
        clone.style.minWidth = Math.max(180, rect.width) + 'px';
        clone.style.zIndex = '1100';
        bindPortalSubmenuTrigger(clone);
    }

    function closeDropdown() {
        var portal = document.getElementById('mainNavSubmenuPortal');
        if (portal) portal.parentNode.removeChild(portal);
        nav.querySelectorAll('li.submenu-open').forEach(function (el) { el.classList.remove('submenu-open'); });
    }

    function bindPortalSubmenuTrigger(portalEl) {
        if (!portalEl) return;
        portalEl.addEventListener('click', function (e) {
            var trigger = e.target && e.target.closest ? e.target.closest('.submenu-trigger-2') : null;
            if (!trigger) return;
            e.preventDefault();
            e.stopPropagation();
            var li = trigger.closest('li');
            portalEl.querySelectorAll('li.has-submenu.submenu-open').forEach(function (node) {
                if (node !== li) node.classList.remove('submenu-open');
            });
            if (li) li.classList.toggle('submenu-open');
        });
    }

    document.body.addEventListener('click', function (e) {
        var toggle = e.target && e.target.closest ? e.target.closest('[data-mainnav-toggle]') : null;
        if (toggle) {
            e.preventDefault();
            e.stopPropagation();
            var li = toggle.closest('li');
            if (!li) return;
            var wasOpen = li.classList.contains('submenu-open');
            closeDropdown();
            if (!wasOpen) openDropdown(li);
            return;
        }
        var inPortal = e.target.closest && e.target.closest('#mainNavSubmenuPortal');
        var inNav = e.target.closest && e.target.closest('.navbar-row');
        if (!inPortal && !inNav && document.getElementById('mainNavSubmenuPortal')) {
            closeDropdown();
        }
    }, true);

    document.body.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (e.target.closest && e.target.closest('[data-mainnav-toggle]')) {
            e.preventDefault();
            var toggle = e.target.closest('[data-mainnav-toggle]');
            var li = toggle.closest('li');
            if (!li) return;
            var wasOpen = li.classList.contains('submenu-open');
            closeDropdown();
            if (!wasOpen) openDropdown(li);
        }
        if (e.target.closest && e.target.closest('.submenu-trigger-2')) {
            e.preventDefault();
            var trigger = e.target.closest('.submenu-trigger-2');
            var li = trigger.closest('li');
            if (li) li.classList.toggle('submenu-open');
        }
    }, true);
}

(function () {
    function init() {
        if (document.getElementById('categoryBtn')) initCategorySidebar();
        var el = document.getElementById('mainNavCategories') || document.getElementById('categoryList');
        if (el) {
            loadNavCategories();
            window.addEventListener('firebase-ready', loadNavCategories);
            setTimeout(loadNavCategories, 100);
            setTimeout(loadNavCategories, 500);
        }
        initMainNavSubmenu();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

window.loadNavCategories = loadNavCategories;
window.initCategorySidebar = initCategorySidebar;
window.toggleSubmenu = toggleSubmenu;
window.toggleMainNavSubmenu = toggleMainNavSubmenu;
