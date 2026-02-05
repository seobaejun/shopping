// 자동 추첨 모드 관리

// 자동 추첨 스케줄러 변수
let autoLotteryInterval = null;
let autoLotterySettings = null;

// 기본 환경설정에서 추첨 시간 설정 가져오기
async function loadLotterySettings() {
    try {
        const firebaseAdmin = await waitForFirebaseAdmin();
        const settings = await firebaseAdmin.settingsService.getSettings();
        
        if (settings) {
            autoLotterySettings = {
                lotteryPeriod: settings.lotteryPeriod || 'daily', // 'daily', 'weekday', 'weekday-sat'
                lotteryStartTime: settings.lotteryStartTime || '09:00',
                lotteryEndTime: settings.lotteryEndTime || '18:00',
                lotteryInterval: parseInt(settings.lotteryInterval) || 30 // 분 단위
            };
            console.log('✅ 추첨 설정 로드 완료:', autoLotterySettings);
            return autoLotterySettings;
        } else {
            // 기본값 사용
            autoLotterySettings = {
                lotteryPeriod: 'daily',
                lotteryStartTime: '09:00',
                lotteryEndTime: '18:00',
                lotteryInterval: 30
            };
            console.log('⚠️ 저장된 설정이 없어 기본값 사용:', autoLotterySettings);
            return autoLotterySettings;
        }
    } catch (error) {
        console.error('추첨 설정 로드 오류:', error);
        // 기본값 사용
        autoLotterySettings = {
            lotteryPeriod: 'daily',
            lotteryStartTime: '09:00',
            lotteryEndTime: '18:00',
            lotteryInterval: 30
        };
        return autoLotterySettings;
    }
}

// Firebase 초기화 대기 함수 (settings.js와 동일)
async function waitForFirebaseAdmin(maxWait = 10000) {
    const startTime = Date.now();
    let waitCount = 0;
    
    while (!window.firebaseAdmin) {
        waitCount++;
        if (Date.now() - startTime > maxWait) {
            throw new Error('Firebase Admin이 로드되지 않았습니다.');
        }
        if (waitCount % 10 === 0) {
            console.log(`Firebase Admin 대기 중... (${waitCount * 100}ms 경과)`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!window.firebaseAdmin.db) {
        if (window.firebaseAdmin.initFirebase) {
            await window.firebaseAdmin.initFirebase();
        }
    }
    
    if (!window.firebaseAdmin.settingsService) {
        throw new Error('Settings Service가 로드되지 않았습니다.');
    }
    
    return window.firebaseAdmin;
}

// 현재 시간이 추첨 가능 시간인지 확인
function isLotteryTimeAvailable() {
    if (!autoLotterySettings) {
        console.warn('⚠️ 추첨 설정이 로드되지 않았습니다.');
        return false;
    }
    
    const now = new Date();
    const currentDay = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    const currentTime = now.getHours() * 60 + now.getMinutes(); // 분 단위로 변환
    
    // 추첨 주기 확인
    const period = autoLotterySettings.lotteryPeriod;
    let isAvailableDay = false;
    
    if (period === 'daily') {
        // 매일
        isAvailableDay = true;
    } else if (period === 'weekday') {
        // 월~금 (1~5)
        isAvailableDay = currentDay >= 1 && currentDay <= 5;
    } else if (period === 'weekday-sat') {
        // 월~토 (1~6)
        isAvailableDay = currentDay >= 1 && currentDay <= 6;
    }
    
    if (!isAvailableDay) {
        console.log('⚠️ 오늘은 추첨 가능한 요일이 아닙니다.');
        return false;
    }
    
    // 시작 시간과 종료 시간 확인
    const [startHour, startMin] = autoLotterySettings.lotteryStartTime.split(':').map(Number);
    const [endHour, endMin] = autoLotterySettings.lotteryEndTime.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (currentTime < startTime || currentTime > endTime) {
        console.log(`⚠️ 현재 시간(${now.getHours()}:${now.getMinutes()})은 추첨 가능 시간(${autoLotterySettings.lotteryStartTime}~${autoLotterySettings.lotteryEndTime})이 아닙니다.`);
        return false;
    }
    
    return true;
}

// 자동 추첨 실행 (10명 달성 시)
async function checkAndExecuteAutoLottery() {
    if (!isLotteryTimeAvailable()) {
        return;
    }
    
    // 모든 상품에 대해 10명 달성 여부 확인
    // LOTTERY_WAITING_DATA는 admin.js에 정의되어 있음
    if (typeof LOTTERY_WAITING_DATA === 'undefined') {
        console.warn('⚠️ LOTTERY_WAITING_DATA가 정의되지 않았습니다.');
        return;
    }
    
    const groupSize = parseInt(document.getElementById('groupSize')?.value || 10);
    const winnerCount = parseInt(document.getElementById('winnerCount')?.value || 2);
    
    for (const productId in LOTTERY_WAITING_DATA) {
        const waitingData = LOTTERY_WAITING_DATA[productId] || [];
        
        if (waitingData.length >= groupSize) {
            console.log(`🔵 자동 추첨 실행: ${productId}, 대기 인원: ${waitingData.length}명`);
            
            // 상품 선택 (전역 변수에 설정)
            if (typeof window !== 'undefined') {
                window.selectedProductId = productId;
            }
            
            // 자동 추첨 실행 (확인 없이)
            try {
                // 참가자 목록 (10명)
                const participants = waitingData.slice(0, groupSize);
                
                // 랜덤 추첨 (암호학적 난수 사용 시뮬레이션)
                const shuffled = [...participants].sort(() => Math.random() - 0.5);
                const winners = shuffled.slice(0, winnerCount); // 당첨자 2명
                const losers = shuffled.slice(winnerCount); // 미선정자 8명
                
                // 지원금 계산 (당첨자의 상품 표기 지원금 사용)
                const winnersSupport = winners.reduce((sum, w) => sum + (w.productSupport || 0), 0);
                const losersTotal = losers.reduce((sum, l) => sum + (l.amount || 0), 0);
                
                losers.forEach(loser => {
                    if (losersTotal > 0) {
                        // 공식: (당첨자 표기 지원금 합계 / 미선정자 총 구매금) × 나의 구매금
                        const supportAmount = (winnersSupport / losersTotal) * (loser.amount || 0);
                        // 10원 단위 절삭
                        loser.calculatedSupport = Math.floor(supportAmount / 10) * 10;
                    } else {
                        loser.calculatedSupport = 0;
                    }
                });
                
                // 결과 표시 (showLotteryResult 함수 사용)
                if (typeof showLotteryResult === 'function') {
                    showLotteryResult(winners, losers, participants.length);
                } else {
                    console.log('✅ 자동 추첨 완료:', {
                        productId,
                        winners: winners.length,
                        losers: losers.length,
                        total: participants.length
                    });
                }
                
                // ✅ 순환 구조: 당첨자 2명만 제거, 미선정자 8명은 다음 추첨에 포함
                // 당첨자 2명의 인덱스를 찾아서 제거
                const winnerIds = new Set(winners.map(w => w.id || w.userId));
                const remainingData = waitingData.filter(person => {
                    const personId = person.id || person.userId;
                    return !winnerIds.has(personId);
                });
                
                // 다음 대기 목록에서 2명 추가 (10명 유지)
                const nextWaitingCount = groupSize - remainingData.length; // 필요한 인원 수
                if (nextWaitingCount > 0 && waitingData.length > groupSize) {
                    // 대기 목록에 더 많은 인원이 있으면 추가
                    const additionalPeople = waitingData.slice(groupSize, groupSize + nextWaitingCount);
                    remainingData.push(...additionalPeople);
                }
                
                // 대기 목록 업데이트 (당첨자 제거 + 다음 인원 추가)
                LOTTERY_WAITING_DATA[productId] = remainingData;
                
                // UI 업데이트
                if (typeof renderLotteryStatus === 'function') {
                    renderLotteryStatus();
                }
                if (typeof renderWaitingList === 'function') {
                    renderWaitingList();
                }
                
                console.log(`✅ 자동 추첨 완료: ${productId}, 당첨자 ${winners.length}명 제거, 미선정자 ${losers.length}명 유지, 남은 대기 인원: ${remainingData.length}명`);
            } catch (error) {
                console.error('자동 추첨 실행 오류:', error);
            }
            
            // 한 번에 하나의 상품만 처리 (다음 간격에 다른 상품 처리)
            break;
        }
    }
}

// 자동 추첨 모드 시작
async function startAutoLottery() {
    // 기존 스케줄러가 있으면 중지
    if (autoLotteryInterval) {
        clearInterval(autoLotteryInterval);
        autoLotteryInterval = null;
    }
    
    // 설정 로드
    await loadLotterySettings();
    
    if (!autoLotterySettings) {
        alert('추첨 설정을 불러올 수 없습니다. 기본환경설정에서 추첨 시간을 설정해주세요.');
        return;
    }
    
    // 설정된 간격(분)을 밀리초로 변환
    const intervalMs = autoLotterySettings.lotteryInterval * 60 * 1000;
    
    console.log(`✅ 자동 추첨 모드 시작`);
    console.log(`  - 추첨 주기: ${autoLotterySettings.lotteryPeriod}`);
    console.log(`  - 추첨 시간: ${autoLotterySettings.lotteryStartTime} ~ ${autoLotterySettings.lotteryEndTime}`);
    console.log(`  - 추첨 간격: ${autoLotterySettings.lotteryInterval}분`);
    
    // 즉시 한 번 확인
    checkAndExecuteAutoLottery();
    
    // 설정된 간격마다 확인
    autoLotteryInterval = setInterval(() => {
        checkAndExecuteAutoLottery();
    }, intervalMs);
}

// 자동 추첨 모드 중지
function stopAutoLottery() {
    if (autoLotteryInterval) {
        clearInterval(autoLotteryInterval);
        autoLotteryInterval = null;
        console.log('⏹️ 자동 추첨 모드 중지');
    }
}

// 자동 추첨 모드 토글 (admin.js의 toggleAutoMode에서 호출)
async function toggleAutoLotteryMode() {
    const autoModeCheckbox = document.getElementById('autoLotteryMode');
    if (!autoModeCheckbox) {
        console.error('자동 추첨 모드 체크박스를 찾을 수 없습니다.');
        return;
    }
    
    const autoMode = autoModeCheckbox.checked;
    
    if (autoMode) {
        // 자동 모드 활성화
        try {
            await startAutoLottery();
            alert(`자동 추첨 모드가 활성화되었습니다.\n\n추첨 설정:\n- 주기: ${autoLotterySettings?.lotteryPeriod || '매일'}\n- 시간: ${autoLotterySettings?.lotteryStartTime || '09:00'} ~ ${autoLotterySettings?.lotteryEndTime || '18:00'}\n- 간격: ${autoLotterySettings?.lotteryInterval || 30}분마다\n\n10명 달성 시 자동으로 추첨이 실행됩니다.`);
        } catch (error) {
            console.error('자동 추첨 모드 시작 오류:', error);
            alert('자동 추첨 모드를 시작할 수 없습니다: ' + error.message);
            autoModeCheckbox.checked = false;
        }
    } else {
        // 자동 모드 비활성화
        stopAutoLottery();
        alert('자동 추첨 모드가 비활성화되었습니다.');
    }
}

// 전역으로 export
window.toggleAutoLotteryMode = toggleAutoLotteryMode;
window.startAutoLottery = startAutoLottery;
window.stopAutoLottery = stopAutoLottery;
window.loadLotterySettings = loadLotterySettings;

