/**
 * 공지사항 페이지 전용 JavaScript
 * 로그인 없이도 모든 사용자가 공지사항을 볼 수 있도록 구현
 */

(function() {
    'use strict';

    var _noticeListCache = [];
    var db = null;
    var noticePdfOverlayEl = null;

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
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /** 관리자 Quill HTML: 스크립트·iframe 등 제거 (본문 표시용) */
    function sanitizeNoticeHtml(html) {
        if (!html) return '';
        var s = String(html);
        s = s.replace(/<script\b[\s\S]*?<\/script>/gi, '');
        s = s.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '');
        s = s.replace(/<object\b[\s\S]*?<\/object>/gi, '');
        s = s.replace(/<embed\b[\s\S]*?>/gi, '');
        s = s.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
        s = s.replace(/href\s*=\s*["']\s*javascript:/gi, 'href="#"');
        return s;
    }

    function closeNoticePdfOverlay() {
        if (!noticePdfOverlayEl) return;
        noticePdfOverlayEl.style.display = 'none';
        var frame = noticePdfOverlayEl.querySelector('iframe');
        if (frame) frame.src = 'about:blank';
        document.body.style.overflow = '';
    }

    function openNoticePdfOverlay(url, fileName) {
        if (!url) return;
        if (!noticePdfOverlayEl) {
            noticePdfOverlayEl = document.createElement('div');
            noticePdfOverlayEl.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.72);display:none;';
            noticePdfOverlayEl.innerHTML =
                '<div style="position:absolute;inset:12px;background:#fff;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#1f2937;color:#fff;">' +
                '<strong id="noticePdfOverlayTitle" style="font-size:14px;max-width:70%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></strong>' +
                '<div style="display:flex;gap:8px;">' +
                '<a id="noticePdfOverlayOpenNew" target="_blank" rel="noopener noreferrer" style="padding:6px 10px;background:#374151;color:#fff;border-radius:6px;text-decoration:none;font-size:12px;">새 창</a>' +
                '<button type="button" id="noticePdfOverlayClose" style="padding:6px 10px;background:#ef4444;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">닫기</button>' +
                '</div></div>' +
                '<iframe id="noticePdfOverlayFrame" title="Notice PDF viewer" style="flex:1;border:0;"></iframe>' +
                '</div>';
            document.body.appendChild(noticePdfOverlayEl);
            noticePdfOverlayEl.querySelector('#noticePdfOverlayClose').addEventListener('click', closeNoticePdfOverlay);
            noticePdfOverlayEl.addEventListener('click', function (e) {
                if (e.target === noticePdfOverlayEl) closeNoticePdfOverlay();
            });
        }
        noticePdfOverlayEl.querySelector('#noticePdfOverlayTitle').textContent = fileName || '첨부파일.pdf';
        noticePdfOverlayEl.querySelector('#noticePdfOverlayOpenNew').href = url;
        noticePdfOverlayEl.querySelector('#noticePdfOverlayFrame').src = url;
        noticePdfOverlayEl.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    /** 공지 PDF: 아이폰 대응 인페이지 뷰어 */
    function triggerPdfDownload(url, fileName, storagePath) {
        openNoticePdfOverlay(url, fileName || '첨부파일.pdf');
    }

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
            tbody.innerHTML = '<tr><td colspan="2" class="empty-message" style="padding: 20px; text-align: center;">등록된 공지사항이 없습니다.</td></tr>';
            return;
        }

        // 게시중인 공지사항만 필터링
        var list = _noticeListCache.filter(function(p) {
            return p.status !== 'draft';
        });

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="empty-message" style="padding: 20px; text-align: center;">등록된 공지사항이 없습니다.</td></tr>';
            return;
        }

        var html = list.map(function (p) {
            var title = (p.title || '-').replace(/</g, '&lt;');
            var date = formatDate(p.createdAt);
            var content = (p.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            return '<tr class="notice-title-row" style="border-bottom: 1px solid #eee; cursor: pointer;" data-notice-id="' + (p.id || '') + '">' +
                '<td class="cell-title" style="padding: 10px;"><a href="#" class="notice-title-link" data-id="' + (p.id || '') + '">' + title + '</a></td>' +
                '<td class="col-date" style="padding: 10px; text-align: right;">' + date + '</td>' +
                '</tr>' +
                '<tr class="notice-detail-row" id="notice-detail-' + (p.id || '') + '" style="display: none;">' +
                '<td colspan="2" class="notice-detail-cell">' + content + '</td>' +
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

            // 상세 페이지로 이동
            window.location.href = 'notice.html?id=' + id;
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
     * URL 파라미터에서 ID 가져오기
     */
    function getNoticeIdFromUrl() {
        var params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    /**
     * 공지사항 상세 내용 표시
     */
    function renderNoticeDetail(noticeId) {
        if (!db || !noticeId) {
            console.warn('공지사항 상세: Firestore를 사용할 수 없습니다.');
            return;
        }

        var listWrapper = document.getElementById('noticeListWrapper');
        var detailWrapper = document.getElementById('noticeDetailWrapper');
        
        if (!listWrapper || !detailWrapper) return;

        // 목록 숨기고 상세 표시
        listWrapper.style.display = 'none';
        detailWrapper.style.display = 'block';

        // Firestore에서 공지사항 데이터 가져오기
        db.collection('posts').doc(noticeId).get().then(function(doc) {
            if (!doc.exists) {
                alert('공지사항을 찾을 수 없습니다.');
                window.location.href = 'notice.html';
                return;
            }

            var data = doc.data();
            var viewCount = data.viewCount != null ? data.viewCount : 0;
            var date = formatDate(data.createdAt);

            // 상세 내용 렌더링 (제목·작성자는 텍스트만, 본문은 Quill HTML)
            document.getElementById('noticeDetailTitle').textContent = data.title || '-';
            document.getElementById('noticeDetailAuthor').querySelector('span').textContent = data.authorName || '-';
            document.getElementById('noticeDetailViews').querySelector('span').textContent = viewCount + '회';
            document.getElementById('noticeDetailDate').querySelector('span').textContent = date;
            document.getElementById('noticeDetailContent').innerHTML = sanitizeNoticeHtml(data.content || '');

            var pdfEl = document.getElementById('noticeDetailPdf');
            if (pdfEl) {
                if (data.pdfUrl) {
                    pdfEl.style.display = 'block';
                    var pdfName = escapeHtml(data.pdfFileName || '첨부파일.pdf');
                    var safeUrl = data.pdfUrl;
                    var safeFileName = data.pdfFileName || '첨부파일.pdf';
                    var safePath = data.pdfStoragePath || '';
                    pdfEl.innerHTML = '<button type="button" class="notice-pdf-download" style="font-size: 16px; font-weight: 600; color: #1565c0; text-decoration: none; background: none; border: none; padding: 0; cursor: pointer; text-align: left;"><i class="fas fa-file-pdf" style="color:#c62828;margin-right:10px;"></i>' + pdfName + ' <span style="font-weight:400;color:#666;">(PDF 보기)</span></button>';
                    var btn = pdfEl.querySelector('button.notice-pdf-download');
                    if (btn) {
                        btn.addEventListener('click', function () {
                            triggerPdfDownload(safeUrl, safeFileName, safePath);
                        });
                    }
                } else {
                    pdfEl.style.display = 'none';
                    pdfEl.innerHTML = '';
                }
            }

            // 조회수 증가 (중복 방지)
            updateViewCount(noticeId);
        }).catch(function(error) {
            console.error('공지사항 상세 로드 오류:', error);
            alert('공지사항을 불러오는 중 오류가 발생했습니다.');
            window.location.href = 'notice.html';
        });
    }

    /**
     * 페이지 초기화
     */
    function init() {
        console.log('🔵 공지사항 페이지 초기화 시작');
        
        // Firebase 초기화
        initFirebase().then(function() {
            // URL 파라미터에서 ID 확인
            var noticeId = getNoticeIdFromUrl();
            
            if (noticeId) {
                // 상세 페이지 표시
                renderNoticeDetail(noticeId);
            } else {
                // 목록 페이지 표시
                loadNoticeData();
            }
        });
    }

    // DOM 로드 완료 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();


