/**
 * 공지사항 페이지 전용 JavaScript
 * 로그인 없이도 모든 사용자가 공지사항을 볼 수 있도록 구현
 */

(function() {
    'use strict';

    var _noticeListCache = [];
    var db = null;

    /**
     * Firebase 초기화 (로그인 없이도 작동)
     */
    function initFirebase() {
        return new Promise(function(resolve) {
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.warn('공지사항: Firebase SDK 대기 중...');
                setTimeout(function() { initFirebase().then(resolve); }, 300);
                return;
            }
            try {
                var config = window.firebaseConfig || {
                    apiKey: 'AIzaSyBGQdEiVOl_49oVfb8TPWkc47uaFxV55Xg',
                    authDomain: 'shopping-31dce.firebaseapp.com',
                    projectId: 'shopping-31dce',
                    storageBucket: 'shopping-31dce.firebasestorage.app',
                    messagingSenderId: '344605730776',
                    appId: '1:344605730776:web:925f9d6206b1ff2e0374ad',
                    measurementId: 'G-B7V6HK8Z7X'
                };
                if (!firebase.apps.length) {
                    firebase.initializeApp(config);
                }
                db = firebase.firestore();
                console.log('✅ 공지사항: Firebase 초기화 완료');
                resolve(db);
            } catch (e) {
                console.error('❌ 공지사항: Firebase 초기화 오류', e);
                resolve(null);
            }
        });
    }

    /**
     * 날짜 포맷팅 (YY-MM-DD)
     */
    function formatDate(createdAt) {
        if (!createdAt || createdAt.seconds == null) return '-';
        var d = new Date(createdAt.seconds * 1000);
        var year = String(d.getFullYear()).slice(-2);
        return year + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    /**
     * 공지사항 목록 렌더링
     */
    function renderNoticeList() {
        var tbody = document.getElementById('noticeListBody');
        if (!tbody) return;

        if (!_noticeListCache || _noticeListCache.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-message" style="padding: 20px; text-align: center;">등록된 공지사항이 없습니다.</td></tr>';
            return;
        }

        // 게시중인 공지사항만 필터링
        var list = _noticeListCache.filter(function(p) {
            return p.status !== 'draft';
        });

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-message" style="padding: 20px; text-align: center;">등록된 공지사항이 없습니다.</td></tr>';
            return;
        }

        var html = list.map(function (p) {
            var title = (p.title || '-').replace(/</g, '&lt;');
            var author = (p.authorName || '-').replace(/</g, '&lt;');
            var viewCount = (p.viewCount != null ? p.viewCount : 0);
            var date = formatDate(p.createdAt);
            var content = (p.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            
            return '<tr class="notice-title-row" style="border-bottom: 1px solid #eee; cursor: pointer;" data-notice-id="' + (p.id || '') + '">' +
                '<td style="padding: 10px;"><a href="#" class="notice-title-link" data-id="' + (p.id || '') + '">' + title + '</a></td>' +
                '<td style="padding: 10px; text-align: center;">' + author + '</td>' +
                '<td style="padding: 10px; text-align: center;">' + viewCount + '</td>' +
                '<td style="padding: 10px; text-align: right;">' + date + '</td>' +
                '</tr>' +
                '<tr class="notice-detail-row" id="notice-detail-' + (p.id || '') + '" style="display: none;">' +
                '<td colspan="4" class="notice-detail-cell">' + content + '</td>' +
                '</tr>';
        }).join('');

        tbody.innerHTML = html;

        // 클릭 이벤트 바인딩
        bindNoticeClickEvents();
    }

    /**
     * 공지사항 클릭 이벤트 바인딩
     */
    function bindNoticeClickEvents() {
        var table = document.querySelector('.notice-list-wrap .mypage-table');
        if (!table) return;

        table.addEventListener('click', function(e) {
            var link = e.target && e.target.closest ? e.target.closest('a.notice-title-link') : null;
            if (!link) return;

            e.preventDefault();
            var id = link.getAttribute('data-id');
            if (!id) return;

            var detailRow = document.getElementById('notice-detail-' + id);
            if (!detailRow) return;

            // 다른 모든 상세 행 닫기
            var allDetailRows = table.querySelectorAll('.notice-detail-row');
            allDetailRows.forEach(function(row) {
                if (row.id !== 'notice-detail-' + id) {
                    row.style.display = 'none';
                }
            });

            // 현재 행 토글
            var isOpen = detailRow.style.display !== 'none';
            detailRow.style.display = isOpen ? 'none' : 'table-row';

            // 조회수 증가 (중복 방지)
            if (!isOpen) {
                updateViewCount(id);
            }
        });
    }

    /**
     * 조회수 업데이트
     */
    function updateViewCount(noticeId) {
        if (!db || !noticeId) return;

        // localStorage에 조회한 공지사항 ID 저장 (중복 방지)
        var viewedNotices = JSON.parse(localStorage.getItem('viewedNotices') || '[]');
        if (viewedNotices.indexOf(noticeId) !== -1) {
            return; // 이미 조회한 공지사항
        }

        viewedNotices.push(noticeId);
        localStorage.setItem('viewedNotices', JSON.stringify(viewedNotices));

        // Firestore에서 조회수 증가
        var noticeRef = db.collection('posts').doc(noticeId);
        noticeRef.get().then(function(doc) {
            if (doc.exists) {
                var currentCount = doc.data().viewCount || 0;
                noticeRef.update({
                    viewCount: currentCount + 1
                }).then(function() {
                    // 목록 새로고침
                    loadNoticeData();
                }).catch(function(error) {
                    console.error('조회수 업데이트 오류:', error);
                });
            }
        }).catch(function(error) {
            console.error('공지사항 조회 오류:', error);
        });
    }

    /**
     * 공지사항 데이터 로드 (Firestore에서)
     */
    function loadNoticeData() {
        if (!db) {
            console.warn('⚠️ 공지사항: Firestore를 사용할 수 없습니다.');
            _noticeListCache = [];
            renderNoticeList();
            return;
        }

        db.collection('posts')
            .where('boardType', '==', 'notice')
            .get()
            .then(function(snap) {
                var list = [];
                snap.docs.forEach(function(d) {
                    list.push({ id: d.id, ...d.data() });
                });
                
                // 공지사항 우선 정렬 (isNotice가 true인 것 먼저), 그 다음 최신순
                list.sort(function(a, b) {
                    var aIsNotice = a.isNotice === true;
                    var bIsNotice = b.isNotice === true;
                    if (aIsNotice !== bIsNotice) {
                        return bIsNotice ? 1 : -1;
                    }
                    var at = (a.createdAt && a.createdAt.seconds != null) ? a.createdAt.seconds : 0;
                    var bt = (b.createdAt && b.createdAt.seconds != null) ? b.createdAt.seconds : 0;
                    return bt - at;
                });
                
                _noticeListCache = list;
                console.log('✅ 공지사항: 데이터 로드 완료', list.length, '개');
                renderNoticeList();
            })
            .catch(function(error) {
                console.error('❌ 공지사항: 데이터 로드 오류', error);
                _noticeListCache = [];
                renderNoticeList();
            });
    }

    /**
     * 페이지 초기화
     */
    function init() {
        console.log('🔵 공지사항 페이지 초기화 시작');
        
        // Firebase 초기화
        initFirebase().then(function() {
            // 공지사항 데이터 로드
            loadNoticeData();
        });
    }

    // DOM 로드 완료 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

