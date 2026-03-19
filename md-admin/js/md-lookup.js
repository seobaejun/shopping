/**
 * MD 관리자 — MD조회 페이지: MD 코드로 소속 회원 목록 (getMembersByMdCode + 권한은 md-firebase와 동일)
 */
(function () {
    'use strict';

    var PAGE_SIZE = 10;

    window.mdLookupMembers = [];
    window.mdLookupCurrentPage = 1;
    window.mdLookupHasSearched = false;
    window.mdLookupLastCode = '';

    function escapeHtml(str) {
        if (str == null || str === '') return '';
        return String(str).replace(/[&<>"']/g, function (m) {
            var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[m] || m;
        });
    }

    function formatTrixVal(value) {
        if (window.mdFirebase && typeof window.mdFirebase.formatTrix === 'function') {
            return window.mdFirebase.formatTrix(value);
        }
        var num = Number(value) || 0;
        var truncated = Math.floor(num * 1e8) / 1e8;
        return truncated.toFixed(8);
    }

    function updateMdLookupStatsPanel(members, opts) {
        opts = opts || {};
        var elC = document.getElementById('mdLookupStatCount');
        var elP = document.getElementById('mdLookupStatPurchase');
        var elS = document.getElementById('mdLookupStatSupport');
        if (!elC || !elP || !elS) return;
        if (opts.loading) {
            elC.textContent = elP.textContent = elS.textContent = '조회 중…';
            return;
        }
        members = members || [];
        if (!window.mdLookupHasSearched && members.length === 0) {
            elC.textContent = elP.textContent = elS.textContent = '—';
            return;
        }
        var n = members.length;
        var totalPurchase = 0;
        var totalSupport = 0;
        members.forEach(function (m) {
            totalPurchase += Number(m.purchaseAmount || 0);
            totalSupport += Number(m.supportAmount || 0);
        });
        elC.textContent = n.toLocaleString() + '명';
        elP.textContent = totalPurchase.toLocaleString() + '원';
        elS.textContent = formatTrixVal(totalSupport) + ' trix';
    }

    function buildPaginationHtml(page, totalPages) {
        var html = '<button type="button" class="page-btn" data-md-lookup-page="' + (page - 1) + '" ' + (page === 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
        var i;
        for (i = 1; i <= totalPages; i++) {
            html += '<button type="button" class="page-num' + (i === page ? ' active' : '') + '" data-md-lookup-page="' + i + '">' + i + '</button>';
        }
        html += '<button type="button" class="page-btn" data-md-lookup-page="' + (page + 1) + '" ' + (page === totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
        return html;
    }

    function renderMdLookupTable() {
        var tbody = document.getElementById('mdLookupTableBody');
        var pagEl = document.getElementById('mdLookupPagination');
        var countEl = document.getElementById('mdLookupResultCount');
        if (!tbody) return;

        var members = window.mdLookupMembers || [];
        updateMdLookupStatsPanel(members);
        if (countEl) countEl.textContent = String(members.length);

        if (members.length === 0) {
            var emptyMsg = window.mdLookupHasSearched ? '조회된 회원이 없습니다.' : 'MD 코드를 입력하고 검색하세요.';
            tbody.innerHTML = '<tr><td colspan="8" class="empty-message">' + emptyMsg + '</td></tr>';
            if (pagEl) pagEl.innerHTML = '';
            return;
        }

        var totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
        var page = Math.min(Math.max(1, window.mdLookupCurrentPage || 1), totalPages);
        window.mdLookupCurrentPage = page;
        var start = (page - 1) * PAGE_SIZE;
        var slice = members.slice(start, start + PAGE_SIZE);

        var rows = slice.map(function (member, index) {
            var memberId = member.userId || member.id || '';
            var nameRaw = (member.name || member.userName || '').toString().trim();
            var name = (!nameRaw || nameRaw.indexOf('@') !== -1) ? '이름 없음' : nameRaw;
            var joinDate = '';
            if (member.joinDate) joinDate = member.joinDate;
            else if (member.createdAt) {
                if (member.createdAt.seconds) joinDate = new Date(member.createdAt.seconds * 1000).toISOString().replace('T', ' ').substring(0, 19);
                else if (member.createdAt.toDate) joinDate = member.createdAt.toDate().toISOString().replace('T', ' ').substring(0, 19);
            }
            var referralCode = member.referralCode || member.recommender || '';
            var mdCodeDisp = (member.mdCode || '').toString().trim();
            return '<tr><td>' + (start + index + 1) + '</td><td>' + escapeHtml(memberId) + '</td><td>' + escapeHtml(name) + '</td><td>' + escapeHtml(joinDate) + '</td><td>' + escapeHtml(referralCode) + '</td><td>' + escapeHtml(mdCodeDisp) + '</td><td>' + Number(member.purchaseAmount || 0).toLocaleString() + '</td><td>' + formatTrixVal(Number(member.supportAmount || 0)) + ' trix</td></tr>';
        }).join('');

        tbody.innerHTML = rows;

        if (pagEl) {
            pagEl.innerHTML = buildPaginationHtml(page, totalPages);
        }
    }

    /** 페이지 진입 시 포커스만 (자동 검색 없음) */
    window.initMdLookupPage = function () {
        if (!isMdLookupAdminOnlyOk()) return;
        var input = document.getElementById('mdLookupCode');
        if (input) {
            setTimeout(function () {
                try {
                    input.focus();
                } catch (e) { /* ignore */ }
            }, 100);
        }
    };

    window.resetMdLookupPage = function () {
        if (!isMdLookupAdminOnlyOk()) {
            alert('MD조회는 관리자 페이지에서 MD 바로가기로 들어온 경우에만 이용할 수 있습니다.');
            return;
        }
        var input = document.getElementById('mdLookupCode');
        if (input) input.value = '';
        var sub = document.getElementById('mdLookupSubtitle');
        if (sub) sub.textContent = 'MD 코드(4~5자리)를 입력하면 해당 코드에 소속된 회원이 표시됩니다.';
        window.mdLookupMembers = [];
        window.mdLookupCurrentPage = 1;
        window.mdLookupHasSearched = false;
        window.mdLookupLastCode = '';
        renderMdLookupTable();
        window.initMdLookupPage();
    };

    window.changeMdLookupPage = function (page) {
        if (!isMdLookupAdminOnlyOk()) return;
        var members = window.mdLookupMembers || [];
        var totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
        var p = parseInt(page, 10);
        if (isNaN(p) || p < 1 || p > totalPages) return;
        window.mdLookupCurrentPage = p;
        renderMdLookupTable();
    };

    function isMdLookupAdminOnlyOk() {
        return typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mdAdminFromAdmin') === 'true';
    }

    window.searchMdLookupMembers = async function () {
        if (!isMdLookupAdminOnlyOk()) {
            alert('MD조회는 관리자 페이지에서 MD 바로가기로 들어온 경우에만 이용할 수 있습니다.');
            return;
        }
        var input = document.getElementById('mdLookupCode');
        var code = (input && input.value ? String(input.value) : '').trim();
        if (!code) {
            alert('MD 코드를 입력하세요.');
            return;
        }
        if (!/^\d{4,5}$/.test(code)) {
            alert('MD 코드는 4자리 또는 5자리 숫자여야 합니다.');
            return;
        }
        if (!window.mdFirebase || typeof window.mdFirebase.getMembersByMdCode !== 'function') {
            alert('MD 조회 기능을 불러올 수 없습니다. 페이지를 새로고침해 주세요.');
            return;
        }

        var tbody = document.getElementById('mdLookupTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="empty-message">조회 중...</td></tr>';
        var pagEl = document.getElementById('mdLookupPagination');
        if (pagEl) pagEl.innerHTML = '';
        updateMdLookupStatsPanel(null, { loading: true });

        try {
            var members = await window.mdFirebase.getMembersByMdCode(code);
            members = (members || []).map(function (m) {
                return Object.assign({}, m, {
                    purchaseAmount: Number(m.purchaseAmount || 0),
                    supportAmount: Number(m.supportAmount || 0)
                });
            });

            if (members.length > 0 && window.firebaseAdmin && typeof window.firebaseAdmin.enrichMembersWithOrderStats === 'function') {
                try {
                    members = await window.firebaseAdmin.enrichMembersWithOrderStats(members) || members;
                } catch (en) {
                    console.warn('MD조회: 구매/지원 집계 보강 실패', en);
                }
            }
            if (members.length > 0 && window.enrichMembersWithOrderStatsMdFallback && window.db) {
                var allZeros = members.every(function (m) {
                    return Number(m.purchaseAmount || 0) === 0 && Number(m.supportAmount || 0) === 0;
                });
                if (allZeros) {
                    members = await window.enrichMembersWithOrderStatsMdFallback(members);
                }
            }

            window.mdLookupMembers = members;
            window.mdLookupCurrentPage = 1;
            window.mdLookupHasSearched = true;
            window.mdLookupLastCode = code;

            var sub = document.getElementById('mdLookupSubtitle');
            if (sub) sub.textContent = 'MD 코드 ' + code + '에 소속된 회원입니다. (4자리 MD는 하위 5자리 코드 회원 포함)';

            renderMdLookupTable();
        } catch (err) {
            console.error('MD조회 오류:', err);
            alert(err && err.message ? err.message : String(err));
            window.mdLookupMembers = [];
            window.mdLookupHasSearched = true;
            renderMdLookupTable();
        }
    };

    document.body.addEventListener('click', function (e) {
        var btn = e.target && e.target.closest && e.target.closest('[data-md-lookup-page]');
        if (!btn) return;
        var p = btn.getAttribute('data-md-lookup-page');
        if (p == null) return;
        e.preventDefault();
        window.changeMdLookupPage(p);
    });

    console.log('md-lookup.js 로드됨');
})();
