/**
 * FAQ 페이지 전용 JavaScript
 * 로그인 없이도 모든 사용자가 FAQ를 볼 수 있도록 구현
 */

(function() {
    'use strict';

    var _faqListCache = [];
    var db = null;

    /**
     * Firebase 초기화 (로그인 없이도 작동)
     */
    function initFirebase() {
        return new Promise(function(resolve) {
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.warn('FAQ: Firebase SDK 대기 중...');
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
                console.log('✅ FAQ: Firebase 초기화 완료');
                resolve(db);
            } catch (e) {
                console.error('❌ FAQ: Firebase 초기화 오류', e);
                resolve(null);
            }
        });
    }

    /**
     * 현재 선택된 FAQ 카테고리 반환
     */
    function getCurrentFaqCategory() {
        var tab = document.querySelector('.faq-tab.active');
        return (tab && tab.getAttribute('data-faq-category')) ? tab.getAttribute('data-faq-category') : '상품구매';
    }

    /**
     * FAQ 목록 렌더링
     */
    function renderFaqList() {
        var listEl = document.getElementById('faqAccordionList');
        var emptyEl = document.getElementById('faqEmpty');
        if (!listEl || !emptyEl) return;

        var category = getCurrentFaqCategory();
        var searchKw = (document.getElementById('faqSearchInput') && document.getElementById('faqSearchInput').value) 
            ? document.getElementById('faqSearchInput').value.trim().toLowerCase() 
            : '';

        var list = _faqListCache.filter(function(p) {
            var cat = (p.faqCategory || '상품구매').trim();
            if (cat !== category) return false;
            if (p.status === 'draft') return false;
            if (searchKw) {
                var title = (p.title || '').toLowerCase();
                var content = (p.content || '').toLowerCase();
                if (title.indexOf(searchKw) === -1 && content.indexOf(searchKw) === -1) return false;
            }
            return true;
        });

        listEl.innerHTML = '';
        emptyEl.style.display = list.length ? 'none' : 'block';

        var htmlParts = [];
        list.forEach(function(p) {
            var title = (p.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            var content = (p.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
            var pdfHtml = '';
            if (p.pdfUrl) {
                var pdfName = (p.pdfFileName || '첨부파일.pdf').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                pdfHtml = '<div class="faq-a-attachment" style="margin-top: 10px;">' +
                    '<a href="' + p.pdfUrl + '" target="_blank" rel="noopener noreferrer" class="faq-pdf-download" style="color: #1565c0; font-weight: 600; text-decoration: none;">' +
                    '<i class="fas fa-file-pdf" style="color:#c62828;margin-right:8px;"></i>' + pdfName + ' <span style="font-weight:400;color:#666;">(PDF 다운로드)</span>' +
                    '</a>' +
                    '</div>';
            }
            htmlParts.push(
                '<li class="faq-accordion-item" data-faq-id="' + (p.id || '') + '" style="display: block; width: 100%; max-width: 100%; overflow: hidden; box-sizing: border-box;">' +
                '<div class="faq-accordion-q" style="display: flex; width: 100%; max-width: 100%; overflow: hidden; box-sizing: border-box;">' +
                '<span class="faq-q-icon">Q</span>' +
                '<span class="faq-q-text" style="display: block; width: 0; flex: 1 1 0%; min-width: 0; max-width: calc(100% - 80px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; box-sizing: border-box; word-break: break-all;">' + title + '</span>' +
                '<span class="faq-accordion-toggle"><i class="fas fa-chevron-down"></i></span>' +
                '</div>' +
                '<div class="faq-accordion-a" style="display: none;">' +
                '<span class="faq-a-icon">A</span>' +
                '<div class="faq-a-text">' + content + pdfHtml + '</div>' +
                '</div>' +
                '</li>'
            );
        });
        listEl.innerHTML = htmlParts.join('\n');
    }

    /**
     * FAQ 데이터 로드 (Firestore에서)
     */
    function loadFaqData() {
        if (!db) {
            console.warn('⚠️ FAQ: Firestore를 사용할 수 없습니다.');
            _faqListCache = [];
            renderFaqList();
            return;
        }

        Promise.all([
            db.collection('posts').where('boardType', '==', 'qna').get(),
            db.collection('posts').where('boardType', '==', 'faq').get()
        ])
            .then(function(results) {
                var qnaSnap = results[0];
                var legacyFaqSnap = results[1];
                var mergedMap = {};

                qnaSnap.docs.forEach(function(d) {
                    mergedMap[d.id] = { id: d.id, ...d.data() };
                });
                legacyFaqSnap.docs.forEach(function(d) {
                    if (!mergedMap[d.id]) {
                        mergedMap[d.id] = Object.assign({}, d.data(), { id: d.id, boardType: 'qna' });
                    }
                });

                var list = Object.keys(mergedMap).map(function(key) { return mergedMap[key]; });
                list.sort(function(a, b) {
                    var at = (a.createdAt && a.createdAt.seconds != null) ? a.createdAt.seconds : 0;
                    var bt = (b.createdAt && b.createdAt.seconds != null) ? b.createdAt.seconds : 0;
                    return bt - at;
                });
                _faqListCache = list;
                console.log('✅ FAQ: 데이터 로드 완료', list.length, '개');
                renderFaqList();
            })
            .catch(function(error) {
                console.error('❌ FAQ: 데이터 로드 오류', error);
                _faqListCache = [];
                renderFaqList();
            });
    }

    /**
     * FAQ 섹션 이벤트 바인딩
     */
    function bindFaqSection() {
        var wrap = document.getElementById('faqAccordionWrap');
        if (!wrap) return;

        // 카테고리 탭 클릭 이벤트
        document.querySelectorAll('.faq-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.faq-tab').forEach(function(t) { 
                    t.classList.remove('active'); 
                });
                tab.classList.add('active');
                renderFaqList();
            });
        });

        // 검색 입력 이벤트
        var searchInput = document.getElementById('faqSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function() { 
                renderFaqList(); 
            });
            searchInput.addEventListener('keyup', function(e) { 
                if (e.key === 'Enter') renderFaqList(); 
            });
        }

        // 아코디언 토글 이벤트
        wrap.addEventListener('click', function(e) {
            var qEl = e.target && e.target.closest ? e.target.closest('.faq-accordion-q') : null;
            if (!qEl) return;
            var item = qEl.closest('.faq-accordion-item');
            if (!item) return;
            var aEl = item.querySelector('.faq-accordion-a');
            if (!aEl) return;
            var isOpen = aEl.style.display !== 'none';
            aEl.style.display = isOpen ? 'none' : 'block';
            
            // 아이콘 회전
            var icon = qEl.querySelector('.faq-accordion-toggle i');
            if (icon) {
                if (isOpen) {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                } else {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            }
        });
    }

    /**
     * 페이지 초기화
     */
    function init() {
        console.log('🔵 FAQ 페이지 초기화 시작');
        
        // Firebase 초기화
        initFirebase().then(function() {
            // FAQ 데이터 로드
            loadFaqData();
        });

        // 이벤트 바인딩
        bindFaqSection();
    }

    // DOM 로드 완료 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();



