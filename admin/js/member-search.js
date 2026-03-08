// 회원조회 페이지 관리 (기본환경설정과 동일한 패턴)
console.log('🔵🔵🔵 member-search.js 로드됨 - 버전: 2026-02-06-12:55');

// 디버깅 함수 - 콘솔에서 직접 호출 가능
window.debugMemberTable = function() {
    console.log('=== 회원 테이블 디버깅 ===');
    console.log('memberTableBody:', document.getElementById('memberTableBody'));
    console.log('searchResultsBody:', document.getElementById('searchResultsBody'));
    console.log('allMembersData:', window.allMembersData?.length || 0);
    console.log('changeMemberStatus:', typeof window.changeMemberStatus);
    console.log('editMemberInfo:', typeof window.editMemberInfo);
    console.log('deleteMemberInfo:', typeof window.deleteMemberInfo);
    
    // 테이블 내용 확인
    const tbody = document.getElementById('memberTableBody');
    if (tbody) {
        console.log('테이블 행 수:', tbody.children.length);
        console.log('첫 번째 행 HTML:', tbody.children[0]?.innerHTML);
    }
};

// 강제 리렌더링 함수
window.forceReloadMembers = async function() {
    console.log('🔵 강제 리렌더링 시작...');
    if (window.loadAllMembers) {
        await window.loadAllMembers();
        console.log('✅ 강제 리렌더링 완료');
    } else {
        console.error('❌ loadAllMembers 함수를 찾을 수 없습니다');
    }
};

// Firebase 초기화 대기 함수 (settings.js와 동일)
async function waitForFirebaseAdmin(maxWait = 10000) {
    const startTime = Date.now();
    let waitCount = 0;
    
    console.log('🔵 회원조회: Firebase Admin 대기 시작...');
    
    while (!window.firebaseAdmin) {
        waitCount++;
        if (Date.now() - startTime > maxWait) {
            console.error('Firebase Admin 초기화 시간 초과');
            throw new Error('Firebase Admin이 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        }
        if (waitCount % 10 === 0) {
            console.log(`회원조회: Firebase Admin 대기 중... (${waitCount * 100}ms 경과)`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ 회원조회: Firebase Admin 발견됨');
    
    // Firebase 초기화 확인 및 실행
    if (!window.firebaseAdmin.db) {
        console.log('회원조회: Firebase DB 초기화 중...');
        if (window.firebaseAdmin.initFirebase) {
            await window.firebaseAdmin.initFirebase();
        } else {
            throw new Error('initFirebase 함수를 찾을 수 없습니다.');
        }
    }
    
    // memberService 확인
    if (!window.firebaseAdmin.memberService) {
        console.error('memberService가 없습니다.');
        throw new Error('Member Service가 로드되지 않았습니다. firebase-admin.js 파일을 확인하세요.');
    }
    
    console.log('✅ 회원조회: Firebase Admin 초기화 완료');
    return window.firebaseAdmin;
}

// trix 지원금 표시: 실제 값을 소수점 8자리까지 그대로 표시 (9번째 자리 버림)
function formatTrix(value) {
    var num = Number(value) || 0;
    var truncated = Math.floor(num * 1e8) / 1e8;
    return truncated.toFixed(8);
}

/** 구매금액은 orders 기준, 지원금/누적은 조별추첨 확정 후 지급완료(paid)된 추첨 지원금 기준으로 회원에 병합 */
async function enrichMembersWithOrderStats(firebaseAdmin, members) {
    console.log('🔵 구매금액·지원금 집계 시작 (enrichMembersWithOrderStats), 회원 수:', members ? members.length : 0);
    if (!members || members.length === 0) return members;
    var orderAgg = {};
    var paidSupport = {};
    try {
        if (firebaseAdmin.orderService && typeof firebaseAdmin.orderService.getMemberOrderAggregates === 'function') {
            orderAgg = await firebaseAdmin.orderService.getMemberOrderAggregates();
            console.log('🔵 주문 집계(orders) 키 수:', Object.keys(orderAgg).length, '샘플 키:', Object.keys(orderAgg).slice(0, 3));
        } else {
            console.warn('⚠️ orderService.getMemberOrderAggregates 없음');
        }
        if (firebaseAdmin.lotteryConfirmedService && typeof firebaseAdmin.lotteryConfirmedService.getPaidSupportByMember === 'function') {
            paidSupport = await firebaseAdmin.lotteryConfirmedService.getPaidSupportByMember();
            console.log('🔵 지원금 집계(paid) 키 수:', Object.keys(paidSupport).length, '샘플 키:', Object.keys(paidSupport).slice(0, 3));
        } else {
            console.warn('⚠️ lotteryConfirmedService.getPaidSupportByMember 없음');
        }
        var out = members.map(function (m) {
            var key1 = (m.userId || '').toString().trim();
            var key2 = (m.id != null && m.id !== '') ? String(m.id).trim() : '';
            var o = orderAgg[key1] || orderAgg[key2] || { purchaseAmount: 0 };
            var support = paidSupport[key1] != null ? paidSupport[key1] : (paidSupport[key2] != null ? paidSupport[key2] : 0);
            var purchaseAmount = m.purchaseAmount != null ? Number(m.purchaseAmount) : (Number(o.purchaseAmount) || 0);
            var supportAmount = m.supportAmount != null ? Number(m.supportAmount) : (Number(support) || 0);
            return Object.assign({}, m, {
                purchaseAmount: purchaseAmount,
                supportAmount: supportAmount,
                accumulatedSupport: m.accumulatedSupport != null ? Number(m.accumulatedSupport) : supportAmount
            });
        });
        if (out.length > 0) {
            console.log('✅ 구매금액·지원금 집계 반영 완료. 첫 회원:', out[0].userId || out[0].id, '구매금액:', out[0].purchaseAmount, '지원금:', out[0].supportAmount);
        }
        return out;
    } catch (e) {
        console.warn('회원 구매/지원금 집계 반영 실패:', e);
        return members.map(function (m) {
            return Object.assign({}, m, {
                purchaseAmount: m.purchaseAmount != null ? Number(m.purchaseAmount) : 0,
                supportAmount: m.supportAmount != null ? Number(m.supportAmount) : 0,
                accumulatedSupport: m.accumulatedSupport != null ? Number(m.accumulatedSupport) : 0
            });
        });
    }
}

// 회원 목록 로드 함수 (settings.js의 loadSettings와 동일한 패턴)
async function loadAllMembers() {
    console.log('🔵🔵🔵 loadAllMembers 함수 호출됨');
    
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        if (typeof firebaseAdmin.getInitPromise === 'function') {
            await firebaseAdmin.getInitPromise();
        }
        console.log('✅ 회원조회: Firebase Admin 초기화 완료');
        await new Promise(function(r){ setTimeout(r, 500); });
        
        console.log('🔵 회원조회: Firestore에서 회원 데이터 가져오기 시작...');
        let members = await firebaseAdmin.memberService.getMembers();
        console.log('✅ 회원조회: Firestore에서 데이터 가져오기 완료:', members.length, '명');
        
        if (members && members.length > 0) {
            console.log('✅ 회원조회: 첫 번째 회원 샘플:', members[0]);
        } else {
            console.warn('⚠️ 회원조회: 데이터가 없습니다.');
        }
        
        var membersArr = Array.isArray(members) ? members : [];
        if (membersArr.length > 0 && firebaseAdmin.enrichMembersWithOrderStats) {
            try {
                members = await firebaseAdmin.enrichMembersWithOrderStats(membersArr);
                console.log('✅ 회원조회: 구매금액·지원금 집계 반영 완료');
            } catch (enrichErr) {
                console.warn('회원조회: 구매/지원금 집계 실패:', enrichErr);
            }
        }
        members = members.map(function(m){ return Object.assign({}, m, { purchaseAmount: Number(m.purchaseAmount || 0), supportAmount: Number(m.supportAmount || 0) }); });
        if (members.length) console.log('회원조회 렌더 직전 첫 회원 구매금액/지원금:', members[0].purchaseAmount, members[0].supportAmount);
        
        window.allMembersData = members;
        window.filteredMembersData = members;
        window.currentMemberPage = 1;
        
        var totalCountEl = document.getElementById('totalMemberCount');
        if (totalCountEl) totalCountEl.textContent = members.length;
        
        renderMemberTable(members);
        
        // 첫 화면에서 집계가 전부 0이면 Firestore 준비 지연으로 간주 → 1.2초 후 구매/지원금만 다시 불러와 갱신
        var allZeros = members.length > 0 && members.every(function(m){ return (m.purchaseAmount || 0) === 0 && (m.supportAmount || 0) === 0; });
        if (allZeros && firebaseAdmin.orderService && firebaseAdmin.lotteryConfirmedService) {
            setTimeout(function(){
                (async function(){
                    try {
                        var orderAgg2 = await firebaseAdmin.orderService.getMemberOrderAggregates();
                        var paidSupport2 = await firebaseAdmin.lotteryConfirmedService.getPaidSupportByMember();
                        if (Object.keys(orderAgg2).length === 0 && Object.keys(paidSupport2).length === 0) return;
                        var base = window.allMembersData || [];
                        if (base.length === 0) return;
                        var enriched = base.map(function (m) {
                            var key1 = (m.userId || '').toString().trim();
                            var key2 = (m.id != null && m.id !== '') ? String(m.id).trim() : '';
                            var o = orderAgg2[key1] || orderAgg2[key2] || { purchaseAmount: 0 };
                            var support = paidSupport2[key1] != null ? paidSupport2[key1] : (paidSupport2[key2] != null ? paidSupport2[key2] : 0);
                            return Object.assign({}, m, {
                                purchaseAmount: Number(m.purchaseAmount || 0) || (o.purchaseAmount || 0),
                                supportAmount: Number(m.supportAmount || 0) || support,
                                accumulatedSupport: m.accumulatedSupport != null ? m.accumulatedSupport : support
                            });
                        });
                        window.allMembersData = enriched;
                        window.filteredMembersData = enriched;
                        window.currentMemberPage = 1;
                        renderMemberTable(enriched);
                        if (totalCountEl) totalCountEl.textContent = enriched.length;
                        console.log('✅ 회원조회: 첫 화면 지연 보강 완료 (구매금액·지원금 갱신)');
                    } catch (e) { console.warn('회원조회 지연 보강 실패:', e); }
                })();
            }, 1200);
        }
        
        return members;
        
    } catch (error) {
        console.error('❌ 회원조회: 데이터 로드 오류:', error);
        console.error('오류 상세:', error.message, error.stack);
        
        const tbody = document.getElementById('memberTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="13" class="empty-message">오류 발생: ${error.message}</td></tr>`;
        }
        
        throw error;
    }
}

// 페이지 변경 함수
window.changeMemberPage = function(page) {
    if (!window.allMembersData) return;
    const totalPages = Math.ceil(window.allMembersData.length / 10);
    if (page < 1 || page > totalPages) return;
    window.currentMemberPage = page;
    // 데이터 다시 로드
    if (window.loadAllMembers) {
        window.loadAllMembers();
    }
};

// 회원 검색 함수 (전체회원 loadAllMembers와 동일한 패턴)
async function searchMemberInfo() {
    if (!window._memberSearchRetryCount) window._memberSearchRetryCount = 0;
    console.log('🔵🔵🔵 searchMemberInfo 함수 호출됨');
    
    const searchId = document.getElementById('memberSearchId')?.value.trim() || '';
    const searchName = document.getElementById('memberSearchName')?.value.trim() || '';
    const searchReferrer = document.getElementById('memberSearchReferrer')?.value.trim() || '';
    const searchStatus = document.getElementById('memberSearchStatus')?.value || '';
    
    console.log('검색 조건:', { searchId, searchName, searchReferrer, searchStatus });
    
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        if (typeof firebaseAdmin.getInitPromise === 'function') {
            await firebaseAdmin.getInitPromise();
        }
        console.log('✅ 회원검색: Firebase Admin 초기화 완료');
        
        console.log('🔵 회원검색: Firestore에서 회원 데이터 가져오기 시작...');
        let members = await firebaseAdmin.memberService.getMembers();
        console.log('✅ 회원검색: Firestore에서 데이터 가져오기 완료:', members.length, '명');
        
        if (members && members.length > 0) {
            console.log('✅ 회원검색: 첫 번째 회원 샘플:', members[0]);
        } else {
            console.warn('⚠️ 회원검색: 데이터가 없습니다.');
        }
        
        var membersArrSearch = Array.isArray(members) ? members : [];
        if (membersArrSearch.length > 0 && firebaseAdmin.enrichMembersWithOrderStats) {
            try {
                members = await firebaseAdmin.enrichMembersWithOrderStats(membersArrSearch);
                console.log('✅ 회원검색: 구매금액·지원금 집계 반영 완료');
            } catch (enrichErr) {
                console.warn('회원검색: 구매/지원금 집계 실패:', enrichErr);
            }
        }
        members = members.map(function(m){ return Object.assign({}, m, { purchaseAmount: Number(m.purchaseAmount || 0), supportAmount: Number(m.supportAmount || 0) }); });
        
        window.allMembersData = members;
        window.currentMemberPage = 1;
        
        // 검색 조건이 모두 비어있으면 전체 데이터 표시
        const hasSearchCondition = searchId || searchName || searchReferrer || searchStatus;
        
        if (!hasSearchCondition) {
            console.log('⚠️ 검색 조건이 없어서 전체 데이터 표시');
            window.filteredMembersData = window.allMembersData;
        } else {
            // 필터링 적용
            window.filteredMembersData = window.allMembersData.filter(member => {
                // 아이디 또는 이름 검색
                if (searchId || searchName) {
                    const memberId = (member.userId || member.id || '').toLowerCase();
                    const memberName = (member.name || '').toLowerCase();
                    const searchIdLower = searchId.toLowerCase();
                    const searchNameLower = searchName.toLowerCase();
                    
                    const idMatch = searchId && memberId.includes(searchIdLower);
                    const nameMatch = searchName && memberName.includes(searchNameLower);
                    
                    if (searchId && searchName) {
                        if (!idMatch && !nameMatch) {
                            return false;
                        }
                    } else if (searchId) {
                        if (!idMatch) {
                            return false;
                        }
                    } else if (searchName) {
                        if (!nameMatch) {
                            return false;
                        }
                    }
                }
                
                // 추천인 검색
                if (searchReferrer) {
                    const referralCode = (member.referralCode || member.recommender || '').toLowerCase();
                    if (!referralCode.includes(searchReferrer.toLowerCase())) {
                        return false;
                    }
                }
                
                // 상태 필터
                if (searchStatus && (member.status || '정상') !== searchStatus) {
                    return false;
                }
                
                return true;
            });
        }
        
        console.log('필터링된 회원 데이터:', window.filteredMembersData.length, '명');
        
        // 총 회원 수 업데이트
        const totalCountEl = document.getElementById('totalMemberCount');
        if (totalCountEl) {
            totalCountEl.textContent = window.filteredMembersData.length;
        }
        
        const searchResultsContainer = document.getElementById('searchResultsContainer');
        const searchResultCount = document.getElementById('searchResultCount');
        
        if (!searchResultsContainer) {
            console.error('❌ searchResultsContainer를 찾을 수 없습니다!');
            return;
        }
        
        window.currentSearchResultsPage = 1;
        window.currentMemberPage = 1;
        
        if (hasSearchCondition) {
            searchResultsContainer.style.display = 'block';
            searchResultsContainer.style.visibility = 'visible';
            searchResultsContainer.style.marginTop = '20px';
            searchResultsContainer.style.marginBottom = '30px';
            if (searchResultCount) searchResultCount.textContent = window.filteredMembersData.length;
            const searchResultsTbody = searchResultsContainer.querySelector('tbody');
            if (searchResultsTbody) {
                renderMembersIntoBody(window.filteredMembersData, searchResultsTbody, {
                    currentPage: 1,
                    paginationElId: 'searchResultsPagination',
                    isSearchResults: true
                });
            }
            searchResultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            searchResultsContainer.style.display = 'none';
        }
        
        renderMemberTable(window.allMembersData || []);
        
        var data = window.allMembersData || [];
        var allZeros = data.length > 0 && data.every(function(m){ return (m.purchaseAmount || 0) === 0 && (m.supportAmount || 0) === 0; });
        if (allZeros && !hasSearchCondition && (window._memberSearchRetryCount || 0) < 1) {
            window._memberSearchRetryCount = (window._memberSearchRetryCount || 0) + 1;
            setTimeout(function(){ searchMemberInfo(); }, 1200);
        } else if (!allZeros) {
            window._memberSearchRetryCount = 0;
        }
        
    } catch (error) {
        console.error('❌ 회원검색: 데이터 로드 오류:', error);
        console.error('오류 상세:', error.message, error.stack);
        
        const tbody = document.getElementById('searchResultsBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="13" class="empty-message">오류 발생: ${error.message}</td></tr>`;
        }
        
        alert('회원 검색 중 오류가 발생했습니다: ' + error.message);
    }
}

// 회원 검색 초기화
async function resetMemberSearch() {
    const idEl = document.getElementById('memberSearchId');
    const nameEl = document.getElementById('memberSearchName');
    const referrerEl = document.getElementById('memberSearchReferrer');
    const statusEl = document.getElementById('memberSearchStatus');
    
    if (idEl) idEl.value = '';
    if (nameEl) nameEl.value = '';
    if (referrerEl) referrerEl.value = '';
    if (statusEl) statusEl.value = '';
    
    // 검색 결과 영역 숨기기
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    if (searchResultsContainer) {
        searchResultsContainer.style.display = 'none';
    }
    
    // 전체 데이터 다시 로드
    await loadAllMembers();
}

// 공통: 회원 목록을 지정한 tbody에 그리는 함수 (전체회원·검색결과 동일 로직)
function renderMembersIntoBody(membersToRender, tbody, options) {
    options = options || {};
    const membersPerPage = 10;
    const currentPage = options.currentPage != null ? options.currentPage : 1;
    const paginationElId = options.paginationElId || null;
    const isSearchResults = options.isSearchResults === true;

    if (!tbody) return;
    if (!membersToRender || membersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="empty-message">검색 결과가 없습니다.</td></tr>';
        if (paginationElId) {
            const paginationEl = document.getElementById(paginationElId);
            if (paginationEl) {
                const changeFn = isSearchResults ? 'changeSearchResultsPage' : 'changeMemberPage';
                paginationEl.innerHTML = '<button type="button" class="page-btn" disabled><i class="fas fa-chevron-left"></i></button><button type="button" class="page-num active" data-page="1">1</button><button type="button" class="page-btn" disabled><i class="fas fa-chevron-right"></i></button>';
                paginationEl.dataset.changeFn = changeFn;
            }
        }
        return;
    }

    const totalPages = Math.max(1, Math.ceil(membersToRender.length / membersPerPage));
    const page = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (page - 1) * membersPerPage;
    const endIndex = Math.min(startIndex + membersPerPage, membersToRender.length);
    const pageMembers = membersToRender.slice(startIndex, endIndex);

    const escapeHtml = (str) => {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, (m) => {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[m];
        });
    };

    const tableHTML = pageMembers.map((member, index) => {
        const memberId = member.userId || member.id || '';
        const name = member.name || '';
        const phone = member.phone || '';
        let joinDate = '';
        if (member.joinDate) joinDate = member.joinDate;
        else if (member.createdAt) {
            if (member.createdAt.seconds) joinDate = new Date(member.createdAt.seconds * 1000).toISOString().replace('T', ' ').substring(0, 19);
            else if (member.createdAt.toDate) joinDate = member.createdAt.toDate().toISOString().replace('T', ' ').substring(0, 19);
        }
        const address = [member.postcode, member.address, member.detailAddress].filter(Boolean).join(' ') || '';
        const referralCode = member.referralCode || member.recommender || '';
        const status = member.status || '정상';
        const statusDisplay = status === 'withdrawn' ? '탈퇴' : status;
        const safeId = String(member.id || memberId).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const statusCell = status === 'withdrawn'
            ? `<span class="badge badge-secondary">탈퇴</span>`
            : `<select class="status-select" data-member-id="${safeId}" onchange="changeMemberStatus(this.dataset.memberId, this.value)">
                        <option value="정상" ${status === '정상' ? 'selected' : ''}>정상</option>
                        <option value="대기" ${status === '대기' ? 'selected' : ''}>대기</option>
                        <option value="정지" ${status === '정지' ? 'selected' : ''}>정지</option>
                    </select>`;
        return `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td>${escapeHtml(memberId)}</td>
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(phone)}</td>
                <td>${escapeHtml(joinDate)}</td>
                <td>${escapeHtml(address)}</td>
                <td>${escapeHtml(member.bank || '')}</td>
                <td>${escapeHtml(member.accountNumber || '')}</td>
                <td>${escapeHtml(referralCode)}</td>
                <td>${Number(member.purchaseAmount || 0).toLocaleString()}</td>
                <td>${formatTrix(Number(member.supportAmount || 0))} trix</td>
                <td>${statusCell}</td>
                <td>
                    <button class="btn-icon btn-edit" data-member-id="${safeId}" onclick="editMemberInfo(this.dataset.memberId)" title="수정"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-delete" data-member-id="${safeId}" onclick="deleteMemberInfo(this.dataset.memberId)" title="삭제"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = tableHTML;

    if (paginationElId) {
        const paginationEl = document.getElementById(paginationElId);
        if (paginationEl) {
            const changeFn = isSearchResults ? 'changeSearchResultsPage' : 'changeMemberPage';
            let html = `<button type="button" class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
            for (let i = 1; i <= totalPages; i++) html += `<button type="button" class="page-num ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
            html += `<button type="button" class="page-btn" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
            paginationEl.innerHTML = html;
            paginationEl.dataset.changeFn = changeFn;
        }
    }
}

// 검색 결과 테이블: searchResultsContainer 안의 tbody에 그리기 (전체회원과 동일 로직)
function renderSearchResultsTable(membersToRender) {
    const container = document.getElementById('searchResultsContainer');
    const tbody = container ? container.querySelector('tbody') : document.getElementById('searchResultsBody');
    if (!tbody) return;
    const page = Math.max(1, parseInt(window.currentSearchResultsPage, 10) || 1);
    renderMembersIntoBody(membersToRender, tbody, {
        currentPage: page,
        paginationElId: 'searchResultsPagination',
        isSearchResults: true
    });
}

// 테이블 렌더링 함수 (전체 회원용) — renderMembersIntoBody 공통 사용
function renderMemberTable(membersToRender) {
    const tbody = document.getElementById('memberTableBody');
    if (!tbody) return;
    const page = Math.max(1, parseInt(window.currentMemberPage, 10) || 1);
    renderMembersIntoBody(membersToRender, tbody, {
        currentPage: page,
        paginationElId: 'memberPagination',
        isSearchResults: false
    });
}

// 엑셀 다운로드 함수 (검색 결과가 있으면 필터된 목록, 없으면 전체 회원)
function exportMembersToExcel() {
    const dataToExport = (window.filteredMembersData && window.filteredMembersData.length > 0)
        ? window.filteredMembersData
        : (window.allMembersData || []);
    if (dataToExport.length === 0) {
        alert('다운로드할 회원 데이터가 없습니다.');
        return;
    }
    
    const headers = ['번호', '아이디', '이름', '전화번호', '이메일', '가입날짜', '우편번호', '주소', '상세주소', '은행', '계좌번호', '추천인코드', 'MD코드', '구매금액', '지원금', '누적지원금', '상태'];
    const csvRows = [headers.join(',')];
    
    const escapeCsv = (val) => {
        if (val == null) return '""';
        const s = String(val).replace(/"/g, '""');
        return s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || /[\r\n]/.test(s) ? `"${s}"` : `"${s}"`;
    };
    
    dataToExport.forEach((member, index) => {
        const memberId = member.userId || member.id || '';
        const name = member.name || '';
        const phone = member.phone || '';
        const email = member.email || '';
        
        // 가입일 처리
        let joinDate = '';
        if (member.joinDate) {
            joinDate = member.joinDate;
        } else if (member.createdAt) {
            if (member.createdAt.seconds) {
                const date = new Date(member.createdAt.seconds * 1000);
                joinDate = date.toISOString().split('T')[0];
            } else if (member.createdAt.toDate) {
                const date = member.createdAt.toDate();
                joinDate = date.toISOString().split('T')[0];
            }
        }
        
        const referralCode = member.referralCode || member.recommender || '';
        const status = member.status || '정상';
        const statusDisplay = status === 'withdrawn' ? '탈퇴' : status;

        const row = [
            index + 1,
            escapeCsv(memberId),
            escapeCsv(name),
            escapeCsv(phone),
            escapeCsv(email),
            escapeCsv(joinDate),
            escapeCsv(member.postcode || ''),
            escapeCsv(member.address || ''),
            escapeCsv(member.detailAddress || ''),
            escapeCsv(member.bank || ''),
            escapeCsv(member.accountNumber || ''),
            escapeCsv(referralCode),
            escapeCsv(member.mdCode || ''),
            member.purchaseAmount || 0,
            member.supportAmount || 0,
            member.accumulatedSupport || 0,
            escapeCsv(statusDisplay)
        ];
        csvRows.push(row.join(','));
    });
    
    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const isFiltered = window.filteredMembersData && window.allMembersData &&
        window.filteredMembersData.length !== window.allMembersData.length;
    link.setAttribute('download', `회원정보_${isFiltered ? '검색결과_' : ''}${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('✅ 엑셀 다운로드 완료:', dataToExport.length, '명');
}

// 검색 결과 페이지 변경 함수
window.changeSearchResultsPage = function(page) {
    const dataToUse = window.filteredMembersData || [];
    if (!dataToUse || dataToUse.length === 0) return;
    
    const totalPages = Math.ceil(dataToUse.length / 10);
    if (page < 1 || page > totalPages) return;
    
    window.currentSearchResultsPage = page;
    
    // 검색 결과 테이블 렌더링
    renderSearchResultsTable(dataToUse);
    
    // 검색 결과 영역으로 스크롤
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    if (searchResultsContainer) {
        searchResultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// 전체 회원 페이지 변경 함수
window.changeMemberPage = function(page) {
    const dataToUse = window.allMembersData || [];
    if (!dataToUse || dataToUse.length === 0) return;
    
    const totalPages = Math.ceil(dataToUse.length / 10);
    if (page < 1 || page > totalPages) return;
    
    window.currentMemberPage = page;
    
    // 전체 회원 테이블 렌더링
    renderMemberTable(dataToUse);
    
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// loadAllMembers 함수 수정 (renderMemberTable 사용)
async function loadAllMembers() {
    console.log('🔵🔵🔵 loadAllMembers 함수 호출됨');
    
    try {
        // Firebase Admin 초기화 대기
        const firebaseAdmin = await waitForFirebaseAdmin();
        console.log('✅ 회원조회: Firebase Admin 초기화 완료');
        
        // Firestore에서 회원 데이터 가져오기
        console.log('🔵 회원조회: Firestore에서 회원 데이터 가져오기 시작...');
        const members = await firebaseAdmin.memberService.getMembers();
        console.log('✅ 회원조회: Firestore에서 데이터 가져오기 완료:', members.length, '명');
        
        if (members && members.length > 0) {
            console.log('✅ 회원조회: 첫 번째 회원 샘플:', members[0]);
        } else {
            console.warn('⚠️ 회원조회: 데이터가 없습니다.');
        }
        
        // 전역 변수에 저장 (무조건 설정)
        window.allMembersData = members;
        window.filteredMembersData = members;
        window.currentMemberPage = 1;
        
        // 총 회원 수 업데이트
        const totalCountEl = document.getElementById('totalMemberCount');
        if (totalCountEl) {
            totalCountEl.textContent = members.length;
        }
        
        // 테이블 렌더링
        renderMemberTable(members);
        
        return members;
        
    } catch (error) {
        console.error('❌ 회원조회: 데이터 로드 오류:', error);
        console.error('오류 상세:', error.message, error.stack);
        
        const tbody = document.getElementById('memberTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="13" class="empty-message">오류 발생: ${error.message}</td></tr>`;
        }
        
        throw error;
    }
}

// 회원 상태 변경 함수
window.changeMemberStatus = async function(memberId, newStatus) {
    try {
        console.log(`🔵 회원 상태 변경 함수 호출됨: ${memberId} -> ${newStatus}`);
        
        if (!confirm(`회원 상태를 "${newStatus}"로 변경하시겠습니까?`)) {
            // 취소하면 페이지 새로고침하여 원래 상태로 복원
            console.log('사용자가 취소함');
            await loadAllMembers();
            return;
        }
        
        console.log('Firebase Admin 초기화 대기 중...');
        // Firebase Admin 초기화 대기
        const firebaseAdmin = await waitForFirebaseAdmin();
        console.log('Firebase Admin 초기화 완료');
        
        // Firestore에서 회원 상태 업데이트
        console.log(`Firestore 업데이트 시작: ${memberId}, status: ${newStatus}`);
        await firebaseAdmin.memberService.updateMember(memberId, { status: newStatus });
        
        console.log('✅ 회원 상태 변경 완료');
        alert('회원 상태가 변경되었습니다.');
        
        // 데이터 새로고침
        console.log('데이터 새로고침 중...');
        await loadAllMembers();
        
    } catch (error) {
        console.error('❌ 회원 상태 변경 오류:', error);
        alert('회원 상태 변경 중 오류가 발생했습니다: ' + error.message);
        
        // 오류 발생 시에도 데이터 새로고침
        await loadAllMembers();
    }
};

// 회원 정보 수정 함수
window.editMemberInfo = async function(memberId) {
    try {
        console.log(`🔵 회원 정보 수정 함수 호출됨: ${memberId}`);
        
        // Firebase Admin 초기화 대기
        const firebaseAdmin = await waitForFirebaseAdmin();
        
        // 회원 정보 가져오기
        const members = await firebaseAdmin.memberService.getMembers();
        const member = members.find(m => (m.id || m.userId) === memberId);
        
        if (!member) {
            alert('회원 정보를 찾을 수 없습니다.');
            return;
        }
        
        // 모달 폼에 데이터 채우기
        document.getElementById('editMemberId').value = member.id || member.userId || '';
        document.getElementById('editMemberUserId').value = member.userId || member.id || '';
        document.getElementById('editMemberName').value = member.name || '';
        document.getElementById('editMemberPhone').value = member.phone || '';
        document.getElementById('editMemberPostcode').value = member.postcode || '';
        document.getElementById('editMemberAddress').value = member.address || '';
        document.getElementById('editMemberDetailAddress').value = member.detailAddress || '';
        document.getElementById('editMemberBank').value = member.bank || '';
        document.getElementById('editMemberAccountNumber').value = member.accountNumber || '';
        document.getElementById('editMemberReferralCode').value = member.referralCode || member.recommender || '';
        document.getElementById('editMemberStatus').value = member.status || '정상';
        
        // 모달 표시
        const modal = document.getElementById('editMemberModal');
        modal.style.display = 'flex';
        modal.classList.add('show');
        
    } catch (error) {
        console.error('❌ 회원 정보 수정 오류:', error);
        alert('회원 정보를 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
};

// 모달 닫기 함수
window.closeEditMemberModal = function() {
    const modal = document.getElementById('editMemberModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
};

// 회원 정보 저장 함수
window.saveEditMember = async function() {
    try {
        const memberId = document.getElementById('editMemberId').value;
        const name = document.getElementById('editMemberName').value.trim();
        const phone = document.getElementById('editMemberPhone').value.trim();
        
        // 필수 입력 확인
        if (!name) {
            alert('이름을 입력해주세요.');
            document.getElementById('editMemberName').focus();
            return;
        }
        
        if (!phone) {
            alert('전화번호를 입력해주세요.');
            document.getElementById('editMemberPhone').focus();
            return;
        }
        
        // 업데이트할 데이터 (계좌번호와 MD코드는 제외)
        const updateData = {
            name: name,
            phone: phone,
            postcode: document.getElementById('editMemberPostcode').value.trim(),
            address: document.getElementById('editMemberAddress').value.trim(),
            detailAddress: document.getElementById('editMemberDetailAddress').value.trim(),
            referralCode: document.getElementById('editMemberReferralCode').value.trim(),
            status: document.getElementById('editMemberStatus').value
        };
        
        console.log('업데이트 데이터:', updateData);
        
        // Firebase Admin 초기화 대기
        const firebaseAdmin = await waitForFirebaseAdmin();
        
        // Firestore 업데이트
        await firebaseAdmin.memberService.updateMember(memberId, updateData);
        
        console.log('✅ 회원 정보 수정 완료');
        alert('회원 정보가 수정되었습니다.');
        
        // 모달 닫기
        closeEditMemberModal();
        
        // 데이터 새로고침
        await loadAllMembers();
        
    } catch (error) {
        console.error('❌ 회원 정보 저장 오류:', error);
        alert('회원 정보 저장 중 오류가 발생했습니다: ' + error.message);
    }
};

// 회원 삭제 함수
window.deleteMemberInfo = async function(memberId) {
    try {
        console.log(`🔵 회원 삭제 함수 호출됨: ${memberId}`);
        
        if (!confirm('정말로 이 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            return;
        }
        
        // 한 번 더 확인
        if (!confirm('정말로 삭제하시겠습니까?')) {
            return;
        }
        
        // Firebase Admin 초기화 대기
        const firebaseAdmin = await waitForFirebaseAdmin();
        
        // Firestore에서 회원 삭제
        await firebaseAdmin.memberService.deleteMember(memberId);
        
        console.log('✅ 회원 삭제 완료');
        alert('회원이 삭제되었습니다.');
        
        // 데이터 새로고침
        await loadAllMembers();
        
    } catch (error) {
        console.error('❌ 회원 삭제 오류:', error);
        alert('회원 삭제 중 오류가 발생했습니다: ' + error.message);
    }
};

// 전역으로 export (admin.js에서 loadAllMembers 대신 이 enrichment만 사용할 수 있도록)
window.enrichMembersWithOrderStats = enrichMembersWithOrderStats;
window.loadAllMembers = loadAllMembers;
window.searchMemberInfo = searchMemberInfo;
window.resetMemberSearch = resetMemberSearch;
window.exportMembersToExcel = exportMembersToExcel;

// 함수들이 전역에 등록되었는지 확인
console.log('✅ 회원 관리 함수 전역 등록 완료:', {
    changeMemberStatus: typeof window.changeMemberStatus,
    editMemberInfo: typeof window.editMemberInfo,
    deleteMemberInfo: typeof window.deleteMemberInfo
});

// 페이지네이션 클릭 이벤트 위임 (버튼 눌러도 반응하도록)
(function() {
    function handlePaginationClick(e) {
        var btn = e.target.closest('button[data-page]');
        if (!btn || btn.disabled) return;
        var p = parseInt(btn.getAttribute('data-page'), 10);
        if (isNaN(p) || p < 1) return;
        var pagEl = e.target.closest('#memberPagination');
        var searchPagEl = e.target.closest('#searchResultsPagination');
        if (pagEl && typeof window.changeMemberPage === 'function') {
            e.preventDefault();
            window.changeMemberPage(p);
        } else if (searchPagEl && typeof window.changeSearchResultsPage === 'function') {
            e.preventDefault();
            window.changeSearchResultsPage(p);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            document.body.addEventListener('click', handlePaginationClick);
        });
    } else {
        document.body.addEventListener('click', handlePaginationClick);
    }
})();

// 페이지 로드 시 자동 초기화 (member-search 페이지가 활성화되어 있으면 즉시 로드)
(function() {
    console.log('🔵 member-search.js 로드 완료');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndLoad);
    } else {
        checkAndLoad();
    }
    
    function checkAndLoad() {
        const memberSearchPage = document.getElementById('member-search');
        if (memberSearchPage && memberSearchPage.classList.contains('active')) {
            console.log('🔵 member-search 페이지가 활성화되어 있음, 즉시 데이터 로드');
            setTimeout(() => {
                if (window.loadAllMembers) {
                    window.loadAllMembers().catch(error => {
                        console.error('초기 데이터 로드 오류:', error);
                    });
                }
            }, 500);
        }
    }
})();

