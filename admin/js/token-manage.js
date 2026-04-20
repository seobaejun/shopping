/**
 * 관리자 - 토큰 관리 페이지
 * 입금 대기: 확인 시 회원 tokenBalance 증가
 * 출금 대기: 확인 시 완료 처리 + 회원 tokenBalance 감소
 * 구매/입금/출금 내역: 20개씩 페이징 (상품목록과 동일 스타일)
 */
(function () {
    'use strict';

    const TOKEN_HISTORY_PER_PAGE = 20;
    const MAX_PAGINATION_BUTTONS = 9;
    var allOrdersData = [];
    var allDepositsData = [];
    var allTokenPurchaseHistoryData = [];
    var allWithdrawalsData = [];
    var tokenMemberMap = {};
    var currentOrdersPage = 1;
    var currentDepositsPage = 1;
    var currentTokenPurchaseHistoryPage = 1;
    var currentWithdrawalsPage = 1;


    async function loadTokenManagePage() {
        var depositBody = document.getElementById('tokenDepositTableBody');
        var withdrawalBody = document.getElementById('tokenWithdrawalTableBody');
        if (!depositBody || !withdrawalBody) return;

        depositBody.innerHTML = '<tr><td colspan="6" class="empty-message">불러오는 중...</td></tr>';
        withdrawalBody.innerHTML = '<tr><td colspan="6" class="empty-message">불러오는 중...</td></tr>';

        var admin = window.firebaseAdmin;
        if (!admin || !admin.tokenService) {
            depositBody.innerHTML = '<tr><td colspan="6" class="empty-message">토큰 서비스를 사용할 수 없습니다.</td></tr>';
            withdrawalBody.innerHTML = '<tr><td colspan="6" class="empty-message">토큰 서비스를 사용할 수 없습니다.</td></tr>';
            return;
        }

        try {
            var deposits = await admin.tokenService.getPendingDeposits();
            var withdrawals = await admin.tokenService.getPendingWithdrawals();
            
            
            renderDeposits(deposits, depositBody);
            renderWithdrawals(withdrawals, withdrawalBody);
        } catch (err) {
            console.error('토큰 관리 데이터 로드 오류:', err);
            depositBody.innerHTML = '<tr><td colspan="6" class="empty-message">로드 실패: ' + (err.message || '알 수 없음') + '</td></tr>';
            withdrawalBody.innerHTML = '<tr><td colspan="6" class="empty-message">로드 실패: ' + (err.message || '알 수 없음') + '</td></tr>';
        }

        loadAllOrdersTable();
        loadAllTokenHistoryTable();
    }

    function formatDate(ts) {
        if (!ts) return '-';
        if (ts.seconds != null) {
            var d = new Date(ts.seconds * 1000);
            return d.toLocaleString('ko-KR');
        }
        if (ts.toDate && typeof ts.toDate === 'function') {
            return ts.toDate().toLocaleString('ko-KR');
        }
        return '-';
    }

    function renderDeposits(list, tbody) {
        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-message">대기 건이 없습니다.</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(function (d) {
            var dateStr = formatDate(d.createdAt);
            var userName = (d.userName || d.userId || '-');
            var qty = Number(d.quantity) || 0;
            var amount = Number(d.amount) || 0;
            
            // 토큰 구매하기 vs 토큰가져오기 구분
            var typeLabel = '';
            var typeClass = '';
            if (d.type === 'import') {
                typeLabel = '토큰가져오기';
                typeClass = 'token-import';
            } else {
                typeLabel = '토큰구매하기';
                typeClass = 'token-purchase';
            }
            
            // 토큰가져오기인 경우 보낸주소와 회원정보 표시
            var userInfo = '';
            if (d.type === 'import') {
                userInfo = '<strong>보낸주소:</strong> ' + escapeHtml(d.fromAddress || '-') + '<br>' +
                          '<strong>회원(아이디):</strong> ' + escapeHtml(userName) + ' (' + escapeHtml(String(d.userId || '')) + ')';
            } else {
                // 기존 토큰구매하기는 원래대로
                userInfo = escapeHtml(userName) + ' (' + escapeHtml(String(d.userId || '')) + ')';
            }
            
            return '<tr data-id="' + d.id + '">' +
                '<td>' + dateStr + '</td>' +
                '<td>' + userInfo + '</td>' +
                '<td><span class="type-badge ' + typeClass + '">' + typeLabel + '</span></td>' +
                '<td>' + qty.toLocaleString() + '</td>' +
                '<td>' + amount.toLocaleString() + '원</td>' +
                '<td><span class="status-badge status-pending">대기</span></td>' +
                '<td class="token-action-cell">' +
                '<button type="button" class="btn btn-sm btn-primary btn-approve-deposit">확인</button> ' +
                '<button type="button" class="btn btn-sm btn-default btn-cancel-deposit">취소</button>' +
                '</td></tr>';
        }).join('');

        tbody.querySelectorAll('.btn-approve-deposit').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var row = btn.closest('tr');
                var id = row && row.getAttribute('data-id');
                if (!id) return;
                if (!confirm('이 입금 건을 승인하여 회원 보유 토큰에 반영하시겠습니까?')) return;
                btn.disabled = true;
                var cancelBtn = row.querySelector('.btn-cancel-deposit');
                if (cancelBtn) cancelBtn.disabled = true;
                window.firebaseAdmin.tokenService.approveDeposit(id).then(function () {
                    return loadTokenManagePage();
                }).catch(function (err) {
                    alert(err && err.message ? err.message : '승인 처리에 실패했습니다.');
                    btn.disabled = false;
                    if (cancelBtn) cancelBtn.disabled = false;
                });
            });
        });
        tbody.querySelectorAll('.btn-cancel-deposit').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var row = btn.closest('tr');
                var id = row && row.getAttribute('data-id');
                if (!id) return;
                if (!confirm('이 입금 건을 취소하시겠습니까?')) return;
                btn.disabled = true;
                var approveBtn = row.querySelector('.btn-approve-deposit');
                if (approveBtn) approveBtn.disabled = true;
                window.firebaseAdmin.tokenService.cancelDeposit(id).then(function () {
                    return loadTokenManagePage();
                }).catch(function (err) {
                    alert(err && err.message ? err.message : '취소 처리에 실패했습니다.');
                    btn.disabled = false;
                    if (approveBtn) approveBtn.disabled = false;
                });
            });
        });
    }

    function renderWithdrawals(list, tbody) {
        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-message">대기 건이 없습니다.</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(function (w) {
            var dateStr = formatDate(w.createdAt);
            var userName = (w.userName || w.userId || '-');
            var addr = (w.walletAddress || '').toString();
            if (addr.length > 20) addr = addr.substring(0, 18) + '…';
            var qty = Number(w.quantity) || 0;
            return '<tr data-id="' + w.id + '">' +
                '<td>' + dateStr + '</td>' +
                '<td>' + escapeHtml(userName) + ' (' + escapeHtml(String(w.userId || '')) + ')</td>' +
                '<td class="wallet-cell">' + escapeHtml(w.walletAddress || '') + '</td>' +
                '<td>' + qty.toLocaleString('ko-KR', {maximumFractionDigits: 8}) + '</td>' +
                '<td><span class="status-badge status-pending">대기</span></td>' +
                '<td class="token-action-cell">' +
                '<button type="button" class="btn btn-sm btn-primary btn-complete-withdrawal">확인</button> ' +
                '<button type="button" class="btn btn-sm btn-default btn-cancel-withdrawal">취소</button>' +
                '</td></tr>';
        }).join('');

        tbody.querySelectorAll('.btn-complete-withdrawal').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var row = btn.closest('tr');
                var id = row && row.getAttribute('data-id');
                if (!id) return;
                if (!confirm('이 출금 건을 완료 처리하시겠습니까? (회원 보유 토큰에서 차감됩니다)')) return;
                btn.disabled = true;
                var cancelBtn = row.querySelector('.btn-cancel-withdrawal');
                if (cancelBtn) cancelBtn.disabled = true;
                window.firebaseAdmin.tokenService.completeWithdrawal(id).then(function () {
                    return loadTokenManagePage();
                }).catch(function (err) {
                    alert(err && err.message ? err.message : '완료 처리에 실패했습니다.');
                    btn.disabled = false;
                    if (cancelBtn) cancelBtn.disabled = false;
                });
            });
        });
        tbody.querySelectorAll('.btn-cancel-withdrawal').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var row = btn.closest('tr');
                var id = row && row.getAttribute('data-id');
                if (!id) return;
                if (!confirm('이 출금 건을 취소하시겠습니까?')) return;
                btn.disabled = true;
                var completeBtn = row.querySelector('.btn-complete-withdrawal');
                if (completeBtn) completeBtn.disabled = true;
                window.firebaseAdmin.tokenService.cancelWithdrawal(id).then(function () {
                    return loadTokenManagePage();
                }).catch(function (err) {
                    alert(err && err.message ? err.message : '취소 처리에 실패했습니다.');
                    btn.disabled = false;
                    if (completeBtn) completeBtn.disabled = false;
                });
            });
        });
    }

    function escapeHtml(s) {
        if (s == null) return '';
        var str = String(s);
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function orderStatusLabel(status) {
        var map = { 'ordered': '주문', '주문': '주문', '입금확인': '입금확인', 'approved': '입금확인', 'preparing': '준비', '준비': '준비', 'shipping': '배송', '배송': '배송', 'completed': '완료', '완료': '완료', 'cancelled': '취소', '취소': '취소' };
        return map[status] || status || '-';
    }

    function depositStatusLabel(status) {
        var map = { 'pending': '대기', 'approved': '승인', 'cancelled': '취소' };
        return map[status] || status || '-';
    }

    function withdrawalStatusLabel(status) {
        var map = { 'pending': '대기', 'completed': '완료', 'cancelled': '취소' };
        return map[status] || status || '-';
    }

    function renderTokenPagination(totalItems, currentPage, containerId, goToFnName) {
        var container = document.getElementById(containerId);
        if (!container) return;
        var totalPages = Math.max(1, Math.ceil(totalItems / TOKEN_HISTORY_PER_PAGE));
        container.style.display = 'flex';
        var half = Math.floor(MAX_PAGINATION_BUTTONS / 2);
        var start = Math.max(1, currentPage - half);
        var end = Math.min(totalPages, start + MAX_PAGINATION_BUTTONS - 1);
        if (end - start + 1 < MAX_PAGINATION_BUTTONS) start = Math.max(1, end - MAX_PAGINATION_BUTTONS + 1);
        var html = '';
        html += '<button type="button" class="product-list-page-btn" ' + (currentPage <= 1 ? 'disabled' : 'onclick="' + goToFnName + '(1)"') + ' title="처음">&lt;&lt;</button>';
        html += '<button type="button" class="product-list-page-btn" ' + (currentPage <= 1 ? 'disabled' : 'onclick="' + goToFnName + '(' + (currentPage - 1) + ')"') + ' title="이전">&lt;</button>';
        if (start > 1) html += '<button type="button" class="product-list-page-btn" disabled>...</button>';
        for (var p = start; p <= end; p++) {
            var active = p === currentPage;
            html += '<button type="button" class="product-list-page-btn' + (active ? ' active' : '') + '" onclick="' + goToFnName + '(' + p + ')">' + p + '</button>';
        }
        if (end < totalPages) html += '<button type="button" class="product-list-page-btn" disabled>...</button>';
        html += '<button type="button" class="product-list-page-btn" ' + (currentPage >= totalPages ? 'disabled' : 'onclick="' + goToFnName + '(' + (currentPage + 1) + ')"') + ' title="다음">&gt;</button>';
        html += '<button type="button" class="product-list-page-btn" ' + (currentPage >= totalPages ? 'disabled' : 'onclick="' + goToFnName + '(' + totalPages + ')"') + ' title="마지막">&gt;&gt;</button>';
        container.innerHTML = html;
    }

    function isTokenPurchaseDeposit(d) {
        return d && d.type !== 'import';
    }

    function renderTokenPurchaseHistoryTable() {
        var tbody = document.getElementById('tokenPurchaseHistoryTableBody');
        if (!tbody) return;
        var total = allTokenPurchaseHistoryData.length;
        if (total === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-message">토큰 구매 내역이 없습니다.</td></tr>';
            renderTokenPagination(0, 1, 'tokenPurchaseHistoryPagination', 'goToTokenPurchaseHistoryPage');
            return;
        }
        var start = (currentTokenPurchaseHistoryPage - 1) * TOKEN_HISTORY_PER_PAGE;
        var slice = allTokenPurchaseHistoryData.slice(start, start + TOKEN_HISTORY_PER_PAGE);
        tbody.innerHTML = slice.map(function (d) {
            var dateStr = formatDate(d.createdAt);
            var userName = escapeHtml(d.userName || d.userId || '-');
            var userId = escapeHtml(String(d.userId || ''));
            var qty = Number(d.quantity) || 0;
            var amount = Number(d.amount) || 0;
            var status = depositStatusLabel(d.status);
            return '<tr><td>' + dateStr + '</td><td>' + userName + ' (' + userId + ')</td><td>' + qty.toLocaleString() + '</td><td>' + amount.toLocaleString() + '원</td><td>' + escapeHtml(status) + '</td></tr>';
        }).join('');
        renderTokenPagination(total, currentTokenPurchaseHistoryPage, 'tokenPurchaseHistoryPagination', 'goToTokenPurchaseHistoryPage');
    }

    function renderOrdersPage() {
        var tbody = document.getElementById('tokenAllOrdersTableBody');
        if (!tbody) return;
        var total = allOrdersData.length;
        if (total === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-message">구매 내역이 없습니다.</td></tr>';
            renderTokenPagination(0, 1, 'tokenAllOrdersPagination', 'goToTokenOrdersPage');
            return;
        }
        var start = (currentOrdersPage - 1) * TOKEN_HISTORY_PER_PAGE;
        var slice = allOrdersData.slice(start, start + TOKEN_HISTORY_PER_PAGE);
        tbody.innerHTML = slice.map(function (o) {
            var dateStr = formatDate(o.createdAt);
            var info = tokenMemberMap[o.memberId] || { userId: o.memberId || o.userId || '-', name: '' };
            var memberStr = escapeHtml(info.name) + ' (' + escapeHtml(info.userId) + ')';
            var name = escapeHtml((o.productName || '-').replace(/</g, '&lt;'));
            var amount = Number(o.totalPrice ?? o.productPrice ?? o.amount ?? 0) || (Number(o.price || 0) * Number(o.quantity || 1));
            var priceStr = amount.toLocaleString();
            var supportNum = Number(o.supportAmount ?? o.support ?? o.productSupport ?? 0);
            var support = supportNum.toLocaleString();
            var status = orderStatusLabel(o.status);
            return '<tr><td>' + dateStr + '</td><td>' + memberStr + '</td><td>' + name + '</td><td>' + priceStr + '원</td><td>' + support + ' trix</td><td>' + escapeHtml(status) + '</td></tr>';
        }).join('');
        renderTokenPagination(total, currentOrdersPage, 'tokenAllOrdersPagination', 'goToTokenOrdersPage');
    }

    function renderDepositsPage() {
        var tbody = document.getElementById('tokenAllDepositsTableBody');
        if (!tbody) return;
        var total = allDepositsData.length;
        if (total === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-message">입금 내역이 없습니다.</td></tr>';
            renderTokenPagination(0, 1, 'tokenAllDepositsPagination', 'goToTokenDepositsPage');
            return;
        }
        var start = (currentDepositsPage - 1) * TOKEN_HISTORY_PER_PAGE;
        var slice = allDepositsData.slice(start, start + TOKEN_HISTORY_PER_PAGE);
        tbody.innerHTML = slice.map(function (d) {
            var dateStr = formatDate(d.createdAt);
            
            var userName = escapeHtml(d.userName || d.userId || '-');
            var userId = escapeHtml(String(d.userId || ''));
            
            var qty = Number(d.quantity) || 0;
            var amount = Number(d.amount) || 0;
            var status = depositStatusLabel(d.status);
            
            // 토큰 구매하기 vs 토큰가져오기 구분
            var typeLabel = '';
            var typeClass = '';
            if (d.type === 'import') {
                typeLabel = '토큰가져오기';
                typeClass = 'token-import';
            } else {
                typeLabel = '토큰구매하기';
                typeClass = 'token-purchase';
            }
            
            return '<tr><td>' + dateStr + '</td><td>' + userName + ' (' + userId + ')</td><td><span class="type-badge ' + typeClass + '">' + typeLabel + '</span></td><td>' + qty.toLocaleString() + '</td><td>' + amount.toLocaleString() + '원</td><td>' + escapeHtml(status) + '</td></tr>';
        }).join('');
        renderTokenPagination(total, currentDepositsPage, 'tokenAllDepositsPagination', 'goToTokenDepositsPage');
    }

    function renderWithdrawalsPage() {
        var tbody = document.getElementById('tokenAllWithdrawalsTableBody');
        if (!tbody) return;
        var total = allWithdrawalsData.length;
        if (total === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-message">출금 내역이 없습니다.</td></tr>';
            renderTokenPagination(0, 1, 'tokenAllWithdrawalsPagination', 'goToTokenWithdrawalsPage');
            return;
        }
        var start = (currentWithdrawalsPage - 1) * TOKEN_HISTORY_PER_PAGE;
        var slice = allWithdrawalsData.slice(start, start + TOKEN_HISTORY_PER_PAGE);
        tbody.innerHTML = slice.map(function (w) {
            var dateStr = formatDate(w.createdAt);
            var userName = escapeHtml(w.userName || w.userId || '-');
            var userId = escapeHtml(String(w.userId || ''));
            var qty = Number(w.quantity) || 0;
            var status = withdrawalStatusLabel(w.status);
            return '<tr><td>' + dateStr + '</td><td>' + userName + ' (' + userId + ')</td><td class="wallet-cell">' + escapeHtml(w.walletAddress || '') + '</td><td>' + qty.toLocaleString('ko-KR', {maximumFractionDigits: 8}) + '</td><td>' + escapeHtml(status) + '</td></tr>';
        }).join('');
        renderTokenPagination(total, currentWithdrawalsPage, 'tokenAllWithdrawalsPagination', 'goToTokenWithdrawalsPage');
    }

    window.goToTokenOrdersPage = function (p) {
        var totalPages = Math.max(1, Math.ceil(allOrdersData.length / TOKEN_HISTORY_PER_PAGE));
        if (p < 1 || p > totalPages) return;
        currentOrdersPage = p;
        renderOrdersPage();
    };

    window.goToTokenPurchaseHistoryPage = function (p) {
        var totalPages = Math.max(1, Math.ceil(allTokenPurchaseHistoryData.length / TOKEN_HISTORY_PER_PAGE));
        if (p < 1 || p > totalPages) return;
        currentTokenPurchaseHistoryPage = p;
        renderTokenPurchaseHistoryTable();
    };

    window.goToTokenDepositsPage = function (p) {
        var totalPages = Math.max(1, Math.ceil(allDepositsData.length / TOKEN_HISTORY_PER_PAGE));
        if (p < 1 || p > totalPages) return;
        currentDepositsPage = p;
        renderDepositsPage();
    };

    window.goToTokenWithdrawalsPage = function (p) {
        var totalPages = Math.max(1, Math.ceil(allWithdrawalsData.length / TOKEN_HISTORY_PER_PAGE));
        if (p < 1 || p > totalPages) return;
        currentWithdrawalsPage = p;
        renderWithdrawalsPage();
    };

    async function loadAllOrdersTable() {
        var tbody = document.getElementById('tokenAllOrdersTableBody');
        if (!tbody) return;
        var admin = window.firebaseAdmin;
        if (!admin || !admin.orderService || !admin.memberService) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-message">서비스를 사용할 수 없습니다.</td></tr>';
            return;
        }
        tbody.innerHTML = '<tr><td colspan="6" class="empty-message">불러오는 중...</td></tr>';
        try {
            var orders = await admin.orderService.getOrders({});
            var members = await admin.memberService.getMembers();
            tokenMemberMap = {};
            members.forEach(function (m) { tokenMemberMap[m.id] = { userId: m.userId || '', name: m.name || '' }; });
            allOrdersData = orders || [];
            currentOrdersPage = 1;
            renderOrdersPage();
        } catch (err) {
            console.error('전체 구매내역 로드 오류:', err);
            tbody.innerHTML = '<tr><td colspan="6" class="empty-message">로드 실패: ' + (err.message || '알 수 없음') + '</td></tr>';
            allOrdersData = [];
            currentOrdersPage = 1;
            renderTokenPagination(0, 1, 'tokenAllOrdersPagination', 'goToTokenOrdersPage');
        }
    }

    async function loadAllTokenHistoryTable() {
        var depositsBody = document.getElementById('tokenAllDepositsTableBody');
        var purchaseHistoryBody = document.getElementById('tokenPurchaseHistoryTableBody');
        var withdrawalsBody = document.getElementById('tokenAllWithdrawalsTableBody');
        if (!depositsBody || !withdrawalsBody) return;
        var admin = window.firebaseAdmin;
        if (!admin || !admin.tokenService) {
            depositsBody.innerHTML = '<tr><td colspan="5" class="empty-message">서비스를 사용할 수 없습니다.</td></tr>';
            withdrawalsBody.innerHTML = '<tr><td colspan="5" class="empty-message">서비스를 사용할 수 없습니다.</td></tr>';
            if (purchaseHistoryBody) {
                purchaseHistoryBody.innerHTML = '<tr><td colspan="5" class="empty-message">서비스를 사용할 수 없습니다.</td></tr>';
            }
            renderTokenPagination(0, 1, 'tokenPurchaseHistoryPagination', 'goToTokenPurchaseHistoryPage');
            return;
        }
        depositsBody.innerHTML = '<tr><td colspan="5" class="empty-message">불러오는 중...</td></tr>';
        if (purchaseHistoryBody) {
            purchaseHistoryBody.innerHTML = '<tr><td colspan="5" class="empty-message">불러오는 중...</td></tr>';
        }
        withdrawalsBody.innerHTML = '<tr><td colspan="5" class="empty-message">불러오는 중...</td></tr>';
        try {
            var deposits = await admin.tokenService.getAllDeposits(500);
            var withdrawals = await admin.tokenService.getAllWithdrawals(500);
            allDepositsData = deposits || [];
            allWithdrawalsData = withdrawals || [];
            allTokenPurchaseHistoryData = allDepositsData.filter(isTokenPurchaseDeposit);

            currentDepositsPage = 1;
            currentTokenPurchaseHistoryPage = 1;
            currentWithdrawalsPage = 1;
            renderTokenPurchaseHistoryTable();
            renderDepositsPage();
            renderWithdrawalsPage();
        } catch (err) {
            console.error('전체 토큰 내역 로드 오류:', err);
            depositsBody.innerHTML = '<tr><td colspan="6" class="empty-message">로드 실패: ' + (err.message || '알 수 없음') + '</td></tr>';
            if (purchaseHistoryBody) {
                purchaseHistoryBody.innerHTML = '<tr><td colspan="5" class="empty-message">로드 실패: ' + (err.message || '알 수 없음') + '</td></tr>';
            }
            withdrawalsBody.innerHTML = '<tr><td colspan="5" class="empty-message">로드 실패: ' + (err.message || '알 수 없음') + '</td></tr>';
            allDepositsData = [];
            allTokenPurchaseHistoryData = [];
            allWithdrawalsData = [];
            currentDepositsPage = 1;
            currentTokenPurchaseHistoryPage = 1;
            currentWithdrawalsPage = 1;
            renderTokenPagination(0, 1, 'tokenPurchaseHistoryPagination', 'goToTokenPurchaseHistoryPage');
            renderTokenPagination(0, 1, 'tokenAllDepositsPagination', 'goToTokenDepositsPage');
            renderTokenPagination(0, 1, 'tokenAllWithdrawalsPagination', 'goToTokenWithdrawalsPage');
        }
    }

    window.loadTokenManagePage = loadTokenManagePage;
})();
