// 기본환경설정 관리

// Firebase 초기화 대기 함수
async function waitForFirebaseAdmin(maxWait = 10000) {
    const startTime = Date.now();
    let waitCount = 0;
    
    console.log('Firebase Admin 대기 시작...');
    console.log('현재 window.firebaseAdmin:', window.firebaseAdmin);
    
    while (!window.firebaseAdmin) {
        waitCount++;
        if (Date.now() - startTime > maxWait) {
            console.error('Firebase Admin 초기화 시간 초과');
            console.error('대기 횟수:', waitCount);
            throw new Error('Firebase Admin이 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        }
        if (waitCount % 10 === 0) {
            console.log(`Firebase Admin 대기 중... (${waitCount * 100}ms 경과)`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Firebase Admin 발견됨:', window.firebaseAdmin);
    
    // Firebase 초기화 확인 및 실행
    if (!window.firebaseAdmin.db) {
        console.log('Firebase DB 초기화 중...');
        if (window.firebaseAdmin.initFirebase) {
            await window.firebaseAdmin.initFirebase();
        } else {
            throw new Error('initFirebase 함수를 찾을 수 없습니다.');
        }
    }
    
    // settingsService 확인
    if (!window.firebaseAdmin.settingsService) {
        console.error('settingsService가 없습니다. window.firebaseAdmin:', window.firebaseAdmin);
        throw new Error('Settings Service가 로드되지 않았습니다. firebase-admin.js 파일을 확인하세요.');
    }
    
    console.log('Firebase Admin 초기화 완료');
    return window.firebaseAdmin;
}

// 설정 저장 함수
async function saveSettings() {
    console.log('🔵 saveSettings 함수 호출됨');
    
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';
    }
    
    try {
        console.log('Firebase 초기화 확인 중...');
        
        // Firebase Admin 초기화 대기
        const firebaseAdmin = await waitForFirebaseAdmin();
        console.log('Firebase Admin 초기화 완료');
        
        console.log('설정 데이터 수집 중...');
        
        // 설정 데이터 수집
        const settingsData = {
            // 사이트 기본 정보
            siteName: document.getElementById('siteName')?.value || '',
            siteUrl: document.getElementById('siteUrl')?.value || '',
            adminEmail: document.getElementById('adminEmail')?.value || '',
            customerPhone: document.getElementById('customerPhone')?.value || '',
            
            // 지원금 설정
            supportRate: parseInt(document.getElementById('supportRate')?.value || 5),
            minPurchaseAmount: parseInt(document.getElementById('minPurchaseAmount')?.value || 1000),
            maxSupportAmount: parseInt(document.getElementById('maxSupportAmount')?.value || 100000),
            lotteryWinRate: parseInt(document.getElementById('lotteryWinRate')?.value || 10),
            
            // 추첨 시간 설정
            lotteryStartTime: document.getElementById('lotteryStartTime')?.value || '09:00',
            lotteryEndTime: document.getElementById('lotteryEndTime')?.value || '18:00',
            lotteryInterval: parseInt(document.getElementById('lotteryInterval')?.value || 30),
            lotteryPeriod: document.getElementById('lotteryPeriod')?.value || 'daily'
        };
        
        console.log('설정 데이터:', settingsData);
        console.log('Firestore에 저장 중...');
        
        // Firestore에 저장
        await firebaseAdmin.settingsService.saveSettings(settingsData);
        
        console.log('✅ 설정 저장 완료');
        alert('✅ 설정이 저장되었습니다!');
        
    } catch (error) {
        console.error('설정 저장 오류:', error);
        alert('❌ 설정 저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> 설정 저장';
        }
    }
}

// 설정 초기화 함수
function resetSettings() {
    if (confirm('설정을 초기값으로 되돌리시겠습니까?')) {
        // 기본값으로 복원
        document.getElementById('siteName').value = '10쇼핑게임';
        document.getElementById('siteUrl').value = 'https://10-2market.com';
        document.getElementById('adminEmail').value = 'admin@10market.com';
        document.getElementById('customerPhone').value = '1588-0000';
        document.getElementById('supportRate').value = 5;
        document.getElementById('minPurchaseAmount').value = 1000;
        document.getElementById('maxSupportAmount').value = 100000;
        document.getElementById('lotteryWinRate').value = 10;
        document.getElementById('lotteryStartTime').value = '09:00';
        document.getElementById('lotteryEndTime').value = '18:00';
        document.getElementById('lotteryInterval').value = 30;
        document.getElementById('lotteryPeriod').value = 'daily';
        
        alert('설정이 초기값으로 복원되었습니다.');
    }
}

// 설정 로드 함수
async function loadSettings() {
    try {
        // Firebase Admin 초기화 대기
        const firebaseAdmin = await waitForFirebaseAdmin();
        
        const settings = await firebaseAdmin.settingsService.getSettings();
        
        if (settings) {
            // 저장된 설정값으로 폼 채우기
            if (settings.siteName) document.getElementById('siteName').value = settings.siteName;
            if (settings.siteUrl) document.getElementById('siteUrl').value = settings.siteUrl;
            if (settings.adminEmail) document.getElementById('adminEmail').value = settings.adminEmail;
            if (settings.customerPhone) document.getElementById('customerPhone').value = settings.customerPhone;
            if (settings.supportRate !== undefined) document.getElementById('supportRate').value = settings.supportRate;
            if (settings.minPurchaseAmount !== undefined) document.getElementById('minPurchaseAmount').value = settings.minPurchaseAmount;
            if (settings.maxSupportAmount !== undefined) document.getElementById('maxSupportAmount').value = settings.maxSupportAmount;
            if (settings.lotteryWinRate !== undefined) document.getElementById('lotteryWinRate').value = settings.lotteryWinRate;
            if (settings.lotteryStartTime) document.getElementById('lotteryStartTime').value = settings.lotteryStartTime;
            if (settings.lotteryEndTime) document.getElementById('lotteryEndTime').value = settings.lotteryEndTime;
            if (settings.lotteryInterval !== undefined) document.getElementById('lotteryInterval').value = settings.lotteryInterval;
            if (settings.lotteryPeriod) document.getElementById('lotteryPeriod').value = settings.lotteryPeriod;
            
            console.log('설정 로드 완료');
        } else {
            console.log('저장된 설정이 없습니다. 기본값 사용');
        }
    } catch (error) {
        console.error('설정 로드 오류:', error);
    }
}

// 전역으로 export
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.loadSettings = loadSettings;

// 이벤트 위임을 사용하여 항상 작동하도록 설정
let settingsEventInitialized = false;

function initSettingsEvents() {
    if (settingsEventInitialized) {
        console.log('설정 이벤트는 이미 초기화되었습니다.');
        return;
    }
    
    // 설정 저장 버튼 클릭 이벤트 (이벤트 위임)
    document.addEventListener('click', async (e) => {
        // 설정 저장 버튼 클릭 확인 (버튼 자체 또는 내부 요소)
        const saveBtn = e.target.closest('#saveSettingsBtn');
        if (saveBtn) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔵 설정 저장 버튼 클릭됨 (이벤트 위임)');
            console.log('클릭된 요소:', e.target);
            console.log('saveSettings 함수 존재:', typeof window.saveSettings);
            
            if (window.saveSettings) {
                try {
                    await window.saveSettings();
                } catch (error) {
                    console.error('설정 저장 중 오류:', error);
                    alert('설정 저장 중 오류가 발생했습니다: ' + error.message);
                }
            } else {
                console.error('saveSettings 함수를 찾을 수 없습니다');
                alert('설정 저장 함수를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
            }
            return;
        }
        
        // 초기화 버튼 클릭 확인
        const resetBtn = e.target.closest('#resetSettingsBtn');
        if (resetBtn) {
            e.preventDefault();
            e.stopPropagation();
            console.log('초기화 버튼 클릭됨');
            if (window.resetSettings) {
                window.resetSettings();
            }
            return;
        }
    });
    
    settingsEventInitialized = true;
    console.log('✅ 설정 버튼 이벤트 위임 등록 완료');
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSettingsEvents();
    });
} else {
    initSettingsEvents();
}

// window.load 시에도 초기화 (스크립트가 나중에 로드될 경우 대비)
window.addEventListener('load', () => {
    initSettingsEvents();
});

