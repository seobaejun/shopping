(function() {
    var PER_PAGE = 10;
    var allReviews = [];
    var currentSort = 'latest';
    var currentPage = 1;

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function waitForFirebase() {
        return new Promise(function(resolve, reject) {
            var attempts = 0;
            var t = setInterval(function() {
                attempts++;
                if (typeof firebase !== 'undefined' && firebase.firestore) {
                    clearInterval(t);
                    resolve();
                } else if (attempts >= 50) {
                    clearInterval(t);
                    reject(new Error('Firebase 초기화 시간 초과'));
                }
            }, 100);
        });
    }

    function loadReviews() {
        var listEl = document.getElementById('reviewsListPage');
        var emptyEl = document.getElementById('reviewsEmpty');
        var paginationEl = document.getElementById('reviewsPagination');
        if (!listEl || !emptyEl) return;

        if (typeof firebase === 'undefined' || !firebase.firestore) {
            waitForFirebase().then(loadReviews).catch(function() {
                emptyEl.style.display = 'block';
                listEl.innerHTML = '';
            });
            return;
        }

        var db = firebase.firestore();
        db.collection('posts').where('boardType', '==', 'review').get()
            .then(function(snapshot) {
                allReviews = [];
                var seenIds = {};
                snapshot.docs.forEach(function(doc) {
                    if (seenIds[doc.id]) return;
                    seenIds[doc.id] = true;
                    var d = doc.data();
                    if (d.reviewType === 'product') return;
                    var createdAt = null;
                    if (d.createdAt) {
                        if (d.createdAt.seconds != null) createdAt = new Date(d.createdAt.seconds * 1000);
                        else if (typeof d.createdAt.toDate === 'function') createdAt = d.createdAt.toDate();
                    }
                    allReviews.push({
                        id: doc.id,
                        title: d.title || '',
                        content: d.content || '',
                        authorName: d.authorNickname || d.authorName || '익명',
                        rating: d.rating || 0,
                        createdAt: createdAt
                    });
                });

                if (currentSort === 'latest') {
                    allReviews.sort(function(a, b) {
                        if (!a.createdAt) return 1;
                        if (!b.createdAt) return -1;
                        return b.createdAt.getTime() - a.createdAt.getTime();
                    });
                } else {
                    allReviews.sort(function(a, b) {
                        var ra = a.rating || 0, rb = b.rating || 0;
                        if (rb !== ra) return rb - ra;
                        if (!a.createdAt) return 1;
                        if (!b.createdAt) return -1;
                        return b.createdAt.getTime() - a.createdAt.getTime();
                    });
                }

                renderPage();
            })
            .catch(function(err) {
                console.error('후기 로드 오류:', err);
                emptyEl.style.display = 'block';
                listEl.innerHTML = '';
            });
    }

    function renderPage() {
        var listEl = document.getElementById('reviewsListPage');
        var emptyEl = document.getElementById('reviewsEmpty');
        var paginationEl = document.getElementById('reviewsPagination');
        if (!listEl || !emptyEl) return;

        var total = allReviews.length;
        if (total === 0) {
            listEl.innerHTML = '';
            emptyEl.style.display = 'block';
            paginationEl.innerHTML = '';
            return;
        }
        emptyEl.style.display = 'none';

        var totalPages = Math.ceil(total / PER_PAGE);
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        var start = (currentPage - 1) * PER_PAGE;
        var pageItems = allReviews.slice(start, start + PER_PAGE);

        listEl.innerHTML = pageItems.map(function(r) {
            var dateStr = r.createdAt ? r.createdAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
            var stars = Array(5).fill(0).map(function(_, i) {
                return '<i class="' + (i < r.rating ? 'fas' : 'far') + ' fa-star" style="color:#FFD700;font-size:14px;"></i>';
            }).join('');
            return '<article class="review-item">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">' +
                '<strong style="font-size:16px;">' + escapeHtml(r.title) + '</strong>' +
                '<span style="color:#999;font-size:13px;">' + dateStr + '</span>' +
                '</div>' +
                '<p style="margin:0 0 12px 0;color:#555;line-height:1.6;font-size:14px;">' + escapeHtml(r.content || '') + '</p>' +
                '<div style="font-size:13px;color:#666;">' + stars + ' <span style="font-weight:500;color:#333;">' + escapeHtml(r.authorName) + '</span></div>' +
                '</article>';
        }).join('');

        if (totalPages < 1) totalPages = 1;
        var paginationHtml = '<div class="reviews-pagination-inner" style="display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;">';
        if (currentPage > 1) {
            paginationHtml += '<button type="button" data-page="' + (currentPage - 1) + '">이전</button>';
        } else {
            paginationHtml += '<button type="button" disabled style="opacity:0.5;cursor:not-allowed;">이전</button>';
        }
        for (var p = 1; p <= totalPages; p++) {
            paginationHtml += '<button type="button" class="' + (p === currentPage ? 'active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        if (currentPage < totalPages) {
            paginationHtml += '<button type="button" data-page="' + (currentPage + 1) + '">다음</button>';
        } else {
            paginationHtml += '<button type="button" disabled style="opacity:0.5;cursor:not-allowed;">다음</button>';
        }
        paginationHtml += '</div>';
        paginationEl.innerHTML = paginationHtml;
        paginationEl.querySelectorAll('button').forEach(function(btn) {
            btn.onclick = function() {
                currentPage = parseInt(btn.getAttribute('data-page'), 10);
                renderPage();
            };
        });
    }

    function init() {
        var sortEl = document.getElementById('reviewsSort');
        if (sortEl) {
            sortEl.querySelectorAll('button').forEach(function(btn) {
                btn.onclick = function() {
                    sortEl.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    currentSort = btn.getAttribute('data-sort');
                    currentPage = 1;
                    if (allReviews.length > 0) {
                        if (currentSort === 'latest') {
                            allReviews.sort(function(a, b) {
                                if (!a.createdAt) return 1;
                                if (!b.createdAt) return -1;
                                return b.createdAt.getTime() - a.createdAt.getTime();
                            });
                        } else {
                            allReviews.sort(function(a, b) {
                                var ra = a.rating || 0, rb = b.rating || 0;
                                if (rb !== ra) return rb - ra;
                                if (!a.createdAt) return 1;
                                if (!b.createdAt) return -1;
                                return b.createdAt.getTime() - a.createdAt.getTime();
                            });
                        }
                        renderPage();
                    } else {
                        loadReviews();
                    }
                };
            });
        }

        waitForFirebase().then(loadReviews).catch(function() {
            document.getElementById('reviewsEmpty').style.display = 'block';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
