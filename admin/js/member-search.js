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

// 회원 목록 로드 함수 (settings.js의 loadSettings와 동일한 패턴)
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
        
        // 테이블 렌더링 (renderMemberTable 함수 사용)
        renderMemberTable(members);
        
        return members;
        
    } catch (error) {
        console.error('❌ 회원조회: 데이터 로드 오류:', error);
        console.error('오류 상세:', error.message, error.stack);
        
        const tbody = document.getElementById('memberTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="12" class="empty-message">오류 발생: ${error.message}</td></tr>`;
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
    console.log('🔵🔵🔵 searchMemberInfo 함수 호출됨');
    
    const searchId = document.getElementById('memberSearchId')?.value.trim() || '';
    const searchName = document.getElementById('memberSearchName')?.value.trim() || '';
    const searchReferrer = document.getElementById('memberSearchReferrer')?.value.trim() || '';
    const searchStatus = document.getElementById('memberSearchStatus')?.value || '';
    
    console.log('검색 조건:', { searchId, searchName, searchReferrer, searchStatus });
    
    try {
        // Firebase Admin 초기화 대기 (전체회원과 동일)
        const firebaseAdmin = await waitForFirebaseAdmin();
        console.log('✅ 회원검색: Firebase Admin 초기화 완료');
        
        // Firestore에서 회원 데이터 가져오기 (전체회원과 동일)
        console.log('🔵 회원검색: Firestore에서 회원 데이터 가져오기 시작...');
        const members = await firebaseAdmin.memberService.getMembers();
        console.log('✅ 회원검색: Firestore에서 데이터 가져오기 완료:', members.length, '명');
        
        if (members && members.length > 0) {
            console.log('✅ 회원검색: 첫 번째 회원 샘플:', members[0]);
        } else {
            console.warn('⚠️ 회원검색: 데이터가 없습니다.');
        }
        
        // 전역 변수에 저장 (무조건 설정 - 전체회원과 동일)
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
        
        // 검색 결과 영역 표시
        const searchResultsContainer = document.getElementById('searchResultsContainer');
        const searchResultCount = document.getElementById('searchResultCount');
        
        if (!searchResultsContainer) {
            console.error('❌ searchResultsContainer를 찾을 수 없습니다!');
            alert('검색 결과 영역을 찾을 수 없습니다. 페이지를 새로고침해주세요.');
            return;
        }
        
        // 검색 결과 영역 표시
        searchResultsContainer.style.display = 'block';
        searchResultsContainer.style.visibility = 'visible';
        searchResultsContainer.style.marginTop = '20px';
        searchResultsContainer.style.marginBottom = '30px';
        console.log('✅ 검색 결과 영역 표시됨');
        
        if (searchResultCount) {
            searchResultCount.textContent = window.filteredMembersData.length;
        }
        
        // 검색 결과 테이블 렌더링 (전체회원과 동일한 패턴 - renderMemberTable처럼 직접 호출)
        console.log('🔵 회원검색: 검색 결과 테이블 렌더링 시작');
        renderSearchResultsTable(window.filteredMembersData);
        console.log('✅ 회원검색: 검색 결과 테이블 렌더링 완료');
        
    } catch (error) {
        console.error('❌ 회원검색: 데이터 로드 오류:', error);
        console.error('오류 상세:', error.message, error.stack);
        
        const tbody = document.getElementById('searchResultsBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="12" class="empty-message">오류 발생: ${error.message}</td></tr>`;
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

// 검색 결과 테이블 렌더링 함수
function renderSearchResultsTable(membersToRender) {
    console.log('🔵 renderSearchResultsTable 호출됨, 데이터:', membersToRender?.length || 0, '명');
    
    const tbody = document.getElementById('searchResultsBody');
    if (!tbody) {
        console.error('❌ searchResultsBody를 찾을 수 없습니다.');
        console.error('HTML에 id="searchResultsBody"가 있는지 확인하세요.');
        return;
    }
    
    console.log('✅ searchResultsBody 찾음');
    
    if (!membersToRender || membersToRender.length === 0) {
        console.warn('⚠️ 렌더링할 데이터가 없습니다.');
        tbody.innerHTML = '<tr><td colspan="12" class="empty-message">검색 결과가 없습니다.</td></tr>';
        
        // 페이지네이션 초기화
        const paginationEl = document.getElementById('searchResultsPagination');
        if (paginationEl) {
            paginationEl.innerHTML = '';
        }
        return;
    }
    
    console.log('✅ 렌더링할 데이터 있음:', membersToRender.length, '명');
    
    // HTML 이스케이프 함수
    const escapeHtml = (str) => {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, (m) => {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[m];
        });
    };
    
    // 페이지네이션 계산
    const membersPerPage = 10;
    const totalPages = Math.ceil(membersToRender.length / membersPerPage);
    const startIndex = (window.currentMemberPage - 1) * membersPerPage;
    const endIndex = startIndex + membersPerPage;
    const pageMembers = membersToRender.slice(startIndex, endIndex);
    
    // 테이블 HTML 생성
    const tableHTML = pageMembers.map((member, index) => {
        const memberId = member.userId || member.id || '';
        const name = member.name || '';
        const phone = member.phone || '';
        
        // 가입일 처리
        let joinDate = '';
        if (member.joinDate) {
            joinDate = member.joinDate;
        } else if (member.createdAt) {
            if (member.createdAt.seconds) {
                const date = new Date(member.createdAt.seconds * 1000);
                joinDate = date.toISOString().replace('T', ' ').substring(0, 19);
            } else if (member.createdAt.toDate) {
                const date = member.createdAt.toDate();
                joinDate = date.toISOString().replace('T', ' ').substring(0, 19);
            }
        }
        
        // 주소
        const address = [member.postcode, member.address, member.detailAddress]
            .filter(Boolean)
            .join(' ') || '';
        
        // 추천인 코드
        const referralCode = member.referralCode || member.recommender || '';
        
        // 상태
        const status = member.status || '정상';
        
        // 마스킹
        const maskedPhone = phone ? phone.replace(/(\d{3})-?(\d{4})-?(\d{4})/, '$1-****-$3') : '';
        const maskedName = name && name.length > 1 ? name.substring(0, 1) + '**' : name;
        
        return `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td>${escapeHtml(memberId)}</td>
                <td>${escapeHtml(maskedName)}</td>
                <td>${escapeHtml(maskedPhone)}</td>
                <td>${escapeHtml(joinDate)}</td>
                <td>${escapeHtml(address)}</td>
                <td>${escapeHtml(member.accountNumber || '')}</td>
                <td>${escapeHtml(referralCode)}</td>
                <td>${(member.purchaseAmount || 0).toLocaleString()}</td>
                <td>${(member.supportAmount || 0).toLocaleString()} / ${(member.accumulatedSupport || 0).toLocaleString()}</td>
                <td>
                    <select class="status-select" onchange="changeMemberStatus('${member.id || memberId}', this.value)">
                        <option value="정상" ${status === '정상' ? 'selected' : ''}>정상</option>
                        <option value="대기" ${status === '대기' ? 'selected' : ''}>대기</option>
                        <option value="정지" ${status === '정지' ? 'selected' : ''}>정지</option>
                    </select>
                </td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editMemberInfo('${member.id || memberId}')" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteMemberInfo('${member.id || memberId}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('🔵 테이블 HTML 생성 완료, 길이:', tableHTML.length);
    if (tableHTML.length > 0) {
        console.log('🔵 테이블 HTML 샘플 (처음 500자):', tableHTML.substring(0, 500));
    } else {
        console.error('❌ 테이블 HTML이 비어있습니다!');
    }
    
    if (!tableHTML || tableHTML.trim() === '') {
        console.error('❌ 테이블 HTML이 비어있습니다!');
        tbody.innerHTML = '<tr><td colspan="12" class="empty-message">테이블 생성 오류가 발생했습니다.</td></tr>';
        return;
    }
    
    tbody.innerHTML = tableHTML;
    console.log('✅✅✅ 테이블 HTML 삽입 완료, tbody 자식 요소:', tbody.children.length);
    
    // 페이지네이션 렌더링
    const paginationEl = document.getElementById('searchResultsPagination');
    if (paginationEl) {
        if (totalPages > 1) {
            let paginationHTML = '';
            paginationHTML += `<button class="page-btn" ${window.currentMemberPage === 1 ? 'disabled' : ''} onclick="changeSearchResultsPage(${window.currentMemberPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>`;
            
            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `<button class="page-num ${i === window.currentMemberPage ? 'active' : ''}" onclick="changeSearchResultsPage(${i})">${i}</button>`;
            }
            
            paginationHTML += `<button class="page-btn" ${window.currentMemberPage === totalPages ? 'disabled' : ''} onclick="changeSearchResultsPage(${window.currentMemberPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>`;
            
            paginationEl.innerHTML = paginationHTML;
        } else {
            paginationEl.innerHTML = '';
        }
    }
}

// 테이블 렌더링 함수 (전체 회원용)
function renderMemberTable(membersToRender) {
    const tbody = document.getElementById('memberTableBody');
    if (!tbody) {
        console.error('❌ memberTableBody를 찾을 수 없습니다.');
        return;
    }
    
    if (!membersToRender || membersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="empty-message">검색 결과가 없습니다.</td></tr>';
        
        // 페이지네이션 초기화
        const paginationEl = document.getElementById('memberPagination');
        if (paginationEl) {
            paginationEl.innerHTML = '';
        }
        return;
    }
    
    // HTML 이스케이프 함수
    const escapeHtml = (str) => {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, (m) => {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[m];
        });
    };
    
    // 페이지네이션 계산
    const membersPerPage = 10;
    const totalPages = Math.ceil(membersToRender.length / membersPerPage);
    const startIndex = (window.currentMemberPage - 1) * membersPerPage;
    const endIndex = startIndex + membersPerPage;
    const pageMembers = membersToRender.slice(startIndex, endIndex);
    
    // 테이블 HTML 생성
    const tableHTML = pageMembers.map((member, index) => {
        const memberId = member.userId || member.id || '';
        const name = member.name || '';
        const phone = member.phone || '';
        
        // 가입일 처리
        let joinDate = '';
        if (member.joinDate) {
            joinDate = member.joinDate;
        } else if (member.createdAt) {
            if (member.createdAt.seconds) {
                const date = new Date(member.createdAt.seconds * 1000);
                joinDate = date.toISOString().replace('T', ' ').substring(0, 19);
            } else if (member.createdAt.toDate) {
                const date = member.createdAt.toDate();
                joinDate = date.toISOString().replace('T', ' ').substring(0, 19);
            }
        }
        
        // 주소
        const address = [member.postcode, member.address, member.detailAddress]
            .filter(Boolean)
            .join(' ') || '';
        
        // 추천인 코드
        const referralCode = member.referralCode || member.recommender || '';
        
        // 상태
        const status = member.status || '정상';
        
        // 마스킹
        const maskedPhone = phone ? phone.replace(/(\d{3})-?(\d{4})-?(\d{4})/, '$1-****-$3') : '';
        const maskedName = name && name.length > 1 ? name.substring(0, 1) + '**' : name;
        
        return `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td>${escapeHtml(memberId)}</td>
                <td>${escapeHtml(maskedName)}</td>
                <td>${escapeHtml(maskedPhone)}</td>
                <td>${escapeHtml(joinDate)}</td>
                <td>${escapeHtml(address)}</td>
                <td>${escapeHtml(member.accountNumber || '')}</td>
                <td>${escapeHtml(referralCode)}</td>
                <td>${(member.purchaseAmount || 0).toLocaleString()}</td>
                <td>${(member.supportAmount || 0).toLocaleString()} / ${(member.accumulatedSupport || 0).toLocaleString()}</td>
                <td>
                    <select class="status-select" onchange="changeMemberStatus('${member.id || memberId}', this.value)">
                        <option value="정상" ${status === '정상' ? 'selected' : ''}>정상</option>
                        <option value="대기" ${status === '대기' ? 'selected' : ''}>대기</option>
                        <option value="정지" ${status === '정지' ? 'selected' : ''}>정지</option>
                    </select>
                </td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editMemberInfo('${member.id || memberId}')" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteMemberInfo('${member.id || memberId}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = tableHTML;
    
    // 페이지네이션 렌더링
    const paginationEl = document.getElementById('memberPagination');
    if (paginationEl) {
        if (totalPages > 1) {
            let paginationHTML = '';
            paginationHTML += `<button class="page-btn" ${window.currentMemberPage === 1 ? 'disabled' : ''} onclick="changeMemberPage(${window.currentMemberPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>`;
            
            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `<button class="page-num ${i === window.currentMemberPage ? 'active' : ''}" onclick="changeMemberPage(${i})">${i}</button>`;
            }
            
            paginationHTML += `<button class="page-btn" ${window.currentMemberPage === totalPages ? 'disabled' : ''} onclick="changeMemberPage(${window.currentMemberPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>`;
            
            paginationEl.innerHTML = paginationHTML;
        } else {
            paginationEl.innerHTML = '';
        }
    }
}

// 엑셀 다운로드 함수
function exportMembersToExcel() {
    if (!window.allMembersData || window.allMembersData.length === 0) {
        alert('다운로드할 회원 데이터가 없습니다.');
        return;
    }
    
    // CSV 형식으로 변환
    const headers = ['번호', '아이디', '이름', '전화번호', '이메일', '가입날짜', '우편번호', '주소', '상세주소', '계좌번호', '추천인코드', 'MD코드', '구매금액', '지원금', '누적지원금', '상태'];
    
    const csvRows = [headers.join(',')];
    
    window.allMembersData.forEach((member, index) => {
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
        
        const row = [
            index + 1,
            `"${memberId}"`,
            `"${name}"`,
            `"${phone}"`,
            `"${email}"`,
            `"${joinDate}"`,
            `"${member.postcode || ''}"`,
            `"${member.address || ''}"`,
            `"${member.detailAddress || ''}"`,
            `"${member.accountNumber || ''}"`,
            `"${referralCode}"`,
            `"${member.mdCode || ''}"`,
            member.purchaseAmount || 0,
            member.supportAmount || 0,
            member.accumulatedSupport || 0,
            `"${status}"`
        ];
        
        csvRows.push(row.join(','));
    });
    
    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.join('\n');
    
    // Blob 생성 및 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `회원정보_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ 엑셀 다운로드 완료:', window.allMembersData.length, '명');
}

// 검색 결과 페이지 변경 함수
window.changeSearchResultsPage = function(page) {
    const dataToUse = window.filteredMembersData || [];
    if (!dataToUse || dataToUse.length === 0) return;
    
    const totalPages = Math.ceil(dataToUse.length / 10);
    if (page < 1 || page > totalPages) return;
    
    window.currentMemberPage = page;
    
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
            tbody.innerHTML = `<tr><td colspan="12" class="empty-message">오류 발생: ${error.message}</td></tr>`;
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

// 전역으로 export
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

// 페이지 로드 시 자동 초기화 (member-search 페이지가 활성화되어 있으면 즉시 로드)
(function() {
    console.log('🔵 member-search.js 로드 완료');
    
    // DOM이 준비되면 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndLoad);
    } else {
        checkAndLoad();
    }
    
    function checkAndLoad() {
        // member-search 페이지가 활성화되어 있는지 확인
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

