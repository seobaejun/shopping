// 회원가입 페이지 JavaScript

// 개발 모드 (인증번호 요청 없이 진행)
const DEV_MODE = true; // 개발 완료 후 false로 변경

// 현재 단계
let currentStep = 1;
const totalSteps = 4;

// 회원가입 데이터 저장
let signupData = {};

// Firebase 초기화
let db = null;
const firebaseConfig = {
    apiKey: "AIzaSyBGQdEiVOl_49oVfb8TPWkc47uaFxV55Xg",
    authDomain: "shopping-31dce.firebaseapp.com",
    projectId: "shopping-31dce",
    storageBucket: "shopping-31dce.firebasestorage.app",
    messagingSenderId: "344605730776",
    appId: "1:344605730776:web:925f9d6206b1ff2e0374ad",
    measurementId: "G-B7V6HK8Z7X"
};

// Firebase 초기화 함수
async function initFirebase() {
    if (db) {
        console.log('Firebase 이미 초기화됨');
        return db;
    }
    
    try {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK가 로드되지 않았습니다.');
            return null;
        }
        
        // Firebase 앱 초기화
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase 앱 초기화 완료');
        }
        
        // Firestore 인스턴스 가져오기
        db = firebase.firestore();
        console.log('Firestore 초기화 완료');
        
        return db;
    } catch (error) {
        console.error('Firebase 초기화 오류:', error);
        return null;
    }
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    initSignup();
});

// 초기화 함수
function initSignup() {
    // 약관 동의 체크박스 이벤트
    setupTermsCheckboxes();
    
    // 다음 단계 버튼 이벤트
    setupNextButtons();
    
    // 닉네임 중복확인
    setupNicknameCheck();
    
    // 인증번호 요청
    setupVerification();
    
    // 캡차 생성
    generateCaptcha();
    
    // 최종 회원가입 폼 제출
    setupFinalSignup();
    
    // 주소 검색 초기화
    initAddressSearch();
    
    // 약관 모달
    setupTermsModal();
}

// 약관 체크박스 설정
function setupTermsCheckboxes() {
    const agreeAll = document.getElementById('agreeAll');
    const agreeService = document.getElementById('agreeService');
    const agreePrivacy = document.getElementById('agreePrivacy');
    const nextBtn = document.getElementById('nextToStep2');
    
    // 전체 동의
    agreeAll.addEventListener('change', (e) => {
        const checked = e.target.checked;
        agreeService.checked = checked;
        agreePrivacy.checked = checked;
        updateNextButton();
    });
    
    // 개별 약관 체크
    [agreeService, agreePrivacy].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // 전체 동의 체크박스 상태 업데이트
            agreeAll.checked = agreeService.checked && agreePrivacy.checked;
            updateNextButton();
        });
    });
    
    // 다음 버튼 활성화/비활성화
    function updateNextButton() {
        if (agreeService.checked && agreePrivacy.checked) {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
        } else {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
        }
    }
    
    updateNextButton();
}

// 다음 단계 버튼 설정
function setupNextButtons() {
    // 단계 1 -> 단계 2
    document.getElementById('nextToStep2').addEventListener('click', () => {
        goToStep(2);
    });
    
    // 단계 2 -> 단계 3
    document.getElementById('nextToStep3').addEventListener('click', () => {
        if (validateStep2()) {
            saveStep2Data();
            goToStep(3);
        }
    });
}

// 단계 이동 함수
function goToStep(step) {
    // 현재 단계 숨기기
    document.querySelectorAll('.signup-step').forEach(el => {
        el.classList.remove('active');
    });
    
    // 새 단계 표시
    const stepElement = document.getElementById(`step${step}`);
    if (stepElement) {
        stepElement.classList.add('active');
        currentStep = step;
        
        // 스크롤 맨 위로
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 단계별 초기화
        if (step === 3) {
            generateCaptcha();
        }
    }
}

// 단계 2 유효성 검사
function validateStep2() {
    const userName = document.getElementById('userName').value.trim();
    const nickname = document.getElementById('nickname').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!userName) {
        alert('이름을 입력해주세요.');
        document.getElementById('userName').focus();
        return false;
    }
    
    if (!nickname) {
        alert('닉네임을 입력해주세요.');
        document.getElementById('nickname').focus();
        return false;
    }
    
    // 닉네임 형식 검사
    const nicknamePattern = /^[가-힣a-zA-Z0-9]+$/;
    if (!nicknamePattern.test(nickname)) {
        alert('닉네임은 공백 없이 한글, 영문, 숫자만 입력 가능합니다.');
        return false;
    }
    
    // 한글 2자 이상 또는 영문 4자 이상
    const koreanCount = (nickname.match(/[가-힣]/g) || []).length;
    const englishCount = (nickname.match(/[a-zA-Z]/g) || []).length;
    
    if (koreanCount > 0 && koreanCount < 2) {
        alert('닉네임은 한글 2자 이상이어야 합니다.');
        return false;
    }
    
    if (englishCount > 0 && englishCount < 4) {
        alert('닉네임은 영문 4자 이상이어야 합니다.');
        return false;
    }
    
    if (!email) {
        alert('이메일을 입력해주세요.');
        document.getElementById('email').focus();
        return false;
    }
    
    // 이메일 형식 검사
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert('올바른 이메일 형식을 입력해주세요.');
        return false;
    }
    
    // 휴대폰번호 필수 검사
    const mobile = document.getElementById('mobile').value.trim();
    if (!mobile) {
        alert('휴대폰번호를 입력해주세요.');
        document.getElementById('mobile').focus();
        return false;
    }
    
    // 휴대폰번호 형식 검사
    const mobilePattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!mobilePattern.test(mobile.replace(/-/g, ''))) {
        alert('올바른 휴대폰번호 형식을 입력해주세요.');
        return false;
    }
    
    // 개발 모드에서는 인증번호 검증 건너뛰기
    if (!DEV_MODE) {
        // 인증번호 확인 (필수)
        const verifyCode = document.getElementById('verifyCode').value.trim();
        if (!verifyCode) {
            alert('인증번호를 입력해주세요.');
            document.getElementById('verifyCode').focus();
            return false;
        }
        
        // 휴대폰번호 인증 완료 확인
        if (!window.phoneVerified) {
            alert('휴대폰번호 인증을 완료해주세요.');
            return false;
        }
    } else {
        // 개발 모드: 인증 완료 플래그 자동 설정
        window.phoneVerified = true;
    }
    
    return true;
}

// 단계 2 데이터 저장
function saveStep2Data() {
    signupData = {
        userName: document.getElementById('userName').value.trim(),
        nickname: document.getElementById('nickname').value.trim(),
        email: document.getElementById('email').value.trim(),
        postcode: document.getElementById('postcode').value.trim(),
        address: document.getElementById('address').value.trim(),
        detailAddress: document.getElementById('detailAddress').value.trim(),
        mobile: document.getElementById('mobile').value.trim(),
        verifyCode: document.getElementById('verifyCode').value.trim()
    };
}

// 닉네임 중복확인
function setupNicknameCheck() {
    const checkBtn = document.getElementById('checkNickname');
    const nicknameInput = document.getElementById('nickname');
    
    checkBtn.addEventListener('click', async () => {
        const nickname = nicknameInput.value.trim();
        
        if (!nickname) {
            alert('닉네임을 입력해주세요.');
            nicknameInput.focus();
            return;
        }
        
        // 닉네임 형식 검사
        const nicknamePattern = /^[가-힣a-zA-Z0-9]+$/;
        if (!nicknamePattern.test(nickname)) {
            alert('닉네임은 공백 없이 한글, 영문, 숫자만 입력 가능합니다.');
            return;
        }
        
        // 한글 2자 이상 또는 영문 4자 이상
        const koreanCount = (nickname.match(/[가-힣]/g) || []).length;
        const englishCount = (nickname.match(/[a-zA-Z]/g) || []).length;
        
        if (koreanCount > 0 && koreanCount < 2) {
            alert('닉네임은 한글 2자 이상이어야 합니다.');
            return;
        }
        
        if (englishCount > 0 && englishCount < 4) {
            alert('닉네임은 영문 4자 이상이어야 합니다.');
            return;
        }
        
        // 중복확인 (실제로는 Firebase에서 확인)
        checkBtn.disabled = true;
        checkBtn.textContent = '확인중...';
        
        try {
            // TODO: Firebase에서 닉네임 중복 확인
            await new Promise(resolve => setTimeout(resolve, 500)); // 시뮬레이션
            
            alert('사용 가능한 닉네임입니다.');
            checkBtn.textContent = '중복확인 완료';
            checkBtn.style.background = '#4caf50';
        } catch (error) {
            alert('이미 사용 중인 닉네임입니다.');
            checkBtn.disabled = false;
            checkBtn.textContent = '중복확인';
        }
    });
}

// 인증번호 요청 (솔라피 API 사용)
let verificationCode = null; // 생성된 인증번호 저장
let verificationExpiry = null; // 인증번호 만료 시간
let verificationMobile = null; // 인증 요청한 전화번호

// 솔라피 API 설정 (환경 변수 또는 설정에서 가져오기)
const SOLAPI_CONFIG = {
    apiKey: window.SOLAPI_API_KEY || '', // .env 파일이나 설정에서 가져오기
    apiSecret: window.SOLAPI_API_SECRET || '',
    sender: window.SOLAPI_SENDER || '01012345678' // 발신번호 (등록된 번호)
};

// 6자리 랜덤 인증번호 생성
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 솔라피 API로 SMS 전송
async function sendSMSviaSolapi(mobile, code) {
    // 솔라피 API 엔드포인트
    const apiUrl = 'https://api.solapi.com/messages/v4/send';
    
    // Base64 인코딩 (API Key:API Secret)
    const credentials = btoa(`${SOLAPI_CONFIG.apiKey}:${SOLAPI_CONFIG.apiSecret}`);
    
    // SMS 메시지 내용
    const message = {
        message: {
            to: mobile,
            from: SOLAPI_CONFIG.sender,
            text: `[10쇼핑게임] 인증번호는 ${code}입니다. 5분 내에 입력해주세요.`
        }
    };
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        });
        
        const result = await response.json();
        
        if (response.ok && result.successCount > 0) {
            return { success: true, messageId: result.messageId };
        } else {
            throw new Error(result.errorMessage || 'SMS 전송 실패');
        }
    } catch (error) {
        console.error('솔라피 API 오류:', error);
        throw error;
    }
}

function setupVerification() {
    const requestBtn = document.getElementById('requestVerify');
    const mobileInput = document.getElementById('mobile');
    const verifyCodeGroup = document.getElementById('verifyCodeGroup');
    const verifyCodeInput = document.getElementById('verifyCode');
    const verifyBtn = document.getElementById('verifyCodeBtn');
    
    // 개발 모드: 인증번호 요청 버튼 비활성화 및 안내 표시
    if (DEV_MODE) {
        if (requestBtn) {
            requestBtn.disabled = true;
            requestBtn.textContent = '개발모드 (인증 생략)';
            requestBtn.style.opacity = '0.6';
            requestBtn.style.cursor = 'not-allowed';
        }
        // 인증번호 입력 필드 숨기기
        if (verifyCodeGroup) {
            verifyCodeGroup.style.display = 'none';
        }
        return; // 개발 모드에서는 인증 로직 실행 안 함
    }
    
    // 인증번호 요청 버튼 클릭
    requestBtn.addEventListener('click', async () => {
        const mobile = mobileInput.value.trim();
        
        if (!mobile) {
            alert('휴대폰번호를 입력해주세요.');
            mobileInput.focus();
            return;
        }
        
        // 휴대폰번호 형식 검사
        const mobilePattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
        const cleanMobile = mobile.replace(/-/g, '');
        
        if (!mobilePattern.test(cleanMobile)) {
            alert('올바른 휴대폰번호 형식을 입력해주세요. (예: 010-1234-5678)');
            mobileInput.focus();
            return;
        }
        
        // 솔라피 API 설정 확인
        if (!SOLAPI_CONFIG.apiKey || !SOLAPI_CONFIG.apiSecret) {
            alert('솔라피 API 설정이 필요합니다. 관리자에게 문의해주세요.');
            console.error('솔라피 API 키가 설정되지 않았습니다.');
            return;
        }
        
        requestBtn.disabled = true;
        requestBtn.textContent = '전송중...';
        
        try {
            // 인증번호 생성
            const code = generateVerificationCode();
            verificationCode = code;
            verificationExpiry = Date.now() + (5 * 60 * 1000); // 5분 후 만료
            verificationMobile = cleanMobile;
            
            // 솔라피 API로 SMS 전송
            await sendSMSviaSolapi(cleanMobile, code);
            
            alert('인증번호가 전송되었습니다. SMS를 확인해주세요.');
            verifyCodeGroup.style.display = 'block';
            verifyCodeInput.required = true;
            requestBtn.textContent = '재전송';
            requestBtn.disabled = false;
            
        } catch (error) {
            console.error('인증번호 전송 오류:', error);
            
            let errorMessage = '인증번호 전송에 실패했습니다.';
            
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                errorMessage = 'API 인증에 실패했습니다. API 키를 확인해주세요.';
            } else if (error.message.includes('400')) {
                errorMessage = '잘못된 요청입니다. 전화번호를 확인해주세요.';
            } else if (error.message.includes('429')) {
                errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(errorMessage);
            requestBtn.disabled = false;
            requestBtn.textContent = '인증요청';
            
            // 인증번호 초기화
            verificationCode = null;
            verificationExpiry = null;
            verificationMobile = null;
        }
    });
    
    // 인증번호 확인 버튼 클릭
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const verifyCode = verifyCodeInput.value.trim();
            
            if (!verifyCode) {
                alert('인증번호를 입력해주세요.');
                verifyCodeInput.focus();
                return;
            }
            
            if (!verificationCode || !verificationMobile) {
                alert('먼저 인증번호를 요청해주세요.');
                return;
            }
            
            // 만료 시간 확인
            if (Date.now() > verificationExpiry) {
                alert('인증번호가 만료되었습니다. 다시 요청해주세요.');
                verificationCode = null;
                verificationExpiry = null;
                verificationMobile = null;
                return;
            }
            
            verifyBtn.disabled = true;
            verifyBtn.textContent = '확인중...';
            
            // 인증번호 확인
            if (verifyCode === verificationCode) {
                // 인증 성공
                alert('인증이 완료되었습니다.');
                verifyBtn.textContent = '인증완료';
                verifyBtn.style.background = '#4caf50';
                verifyBtn.disabled = true;
                requestBtn.disabled = true;
                mobileInput.readOnly = true;
                verifyCodeInput.readOnly = true;
                
                // 인증 완료 플래그 저장
                window.phoneVerified = true;
                
                // 인증번호 정보 초기화 (보안)
                verificationCode = null;
                verificationExpiry = null;
            } else {
                // 인증 실패
                alert('인증번호가 올바르지 않습니다. 다시 확인해주세요.');
                verifyCodeInput.value = '';
                verifyCodeInput.focus();
                verifyBtn.disabled = false;
                verifyBtn.textContent = '인증확인';
            }
        });
    }
}

// 캡차 생성
let captchaAnswer = '';

function generateCaptcha() {
    const canvas = document.getElementById('captchaCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 배경
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, width, height);
    
    // 랜덤 숫자 생성
    captchaAnswer = '';
    for (let i = 0; i < 6; i++) {
        captchaAnswer += Math.floor(Math.random() * 10);
    }
    
    // 숫자 그리기
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 각 숫자를 약간씩 회전시키고 위치 변경
    for (let i = 0; i < captchaAnswer.length; i++) {
        ctx.save();
        const x = (width / captchaAnswer.length) * i + (width / captchaAnswer.length) / 2;
        const y = height / 2;
        ctx.translate(x, y);
        ctx.rotate((Math.random() - 0.5) * 0.3);
        ctx.fillText(captchaAnswer[i], 0, 0);
        ctx.restore();
    }
    
    // 노이즈 라인 추가
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.stroke();
    }
}

// 캡차 새로고침
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshCaptcha');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            generateCaptcha();
        });
    }
});

// 최종 회원가입 폼 제출
function setupFinalSignup() {
    const form = document.getElementById('finalSignupForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 캡차 확인
        const captchaInput = document.getElementById('captchaInput').value.trim();
        if (captchaInput !== captchaAnswer) {
            alert('자동등록방지 숫자를 올바르게 입력해주세요.');
            generateCaptcha();
            document.getElementById('captchaInput').value = '';
            return;
        }
        
        // 최종 데이터 수집
        const finalData = {
            ...signupData,
            referralCode: document.getElementById('referralCode').value.trim(),
            agreeEmail: document.getElementById('agreeEmail').checked,
            agreeSMS: document.getElementById('agreeSMS').checked,
            agreePublic: document.getElementById('agreePublic').checked
        };
        
        // 회원가입 처리
        const signupBtn = form.querySelector('.btn-signup');
        signupBtn.disabled = true;
        signupBtn.textContent = '가입 중...';
        
        try {
            // Firebase 초기화
            await initFirebase();
            if (!db) {
                throw new Error('Firebase 초기화에 실패했습니다.');
            }
            
            // 회원 데이터 형식 변환 (memberService 형식에 맞춤)
            const memberData = {
                userId: finalData.email || finalData.nickname, // 이메일 또는 닉네임을 userId로 사용
                name: finalData.userName,
                nickname: finalData.nickname,
                email: finalData.email,
                phone: finalData.mobile,
                postcode: finalData.postcode,
                address: finalData.address,
                detailAddress: finalData.detailAddress,
                referralCode: finalData.referralCode || '',
                agreeEmail: finalData.agreeEmail || false,
                agreeSMS: finalData.agreeSMS || false,
                agreePublic: finalData.agreePublic || false,
                status: '정상', // 기본 상태
                recommender: finalData.referralCode || '관리자',
                joinDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD 형식
            };
            
            // Firestore에 회원 데이터 저장
            const docRef = await db.collection('members').add({
                ...memberData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ 회원가입 완료 - Firestore에 저장됨:', docRef.id);
            
            // 가입완료 페이지로 이동
            document.getElementById('welcomeName').textContent = finalData.userName;
            goToStep(4);
        } catch (error) {
            console.error('회원가입 오류:', error);
            alert('회원가입 중 오류가 발생했습니다: ' + error.message + '\n다시 시도해주세요.');
            signupBtn.disabled = false;
            signupBtn.textContent = '회원가입';
        }
    });
}

// 약관 모달
function setupTermsModal() {
    // 모달 외부 클릭 시 닫기
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeTermsModal();
            }
        });
    }
}

// 약관 보기
function viewTerms(type) {
    const modal = document.getElementById('termsModal');
    const title = document.getElementById('termsModalTitle');
    const body = document.getElementById('termsModalBody');
    
    if (type === 'service') {
        title.textContent = '서비스이용약관';
        body.innerHTML = `
            <h4>제 1조 (약관의 목적)</h4>
            <p>본 약관은 ㈜딩펫 씨큐리티(이하 "회사"라 합니다)이 제공하는 "10shoppinggame" 서비스를 이용함에 있어 회사와 이용자의 권리 및 의무 등에 대한 기본적인 사항을 규정함을 목적으로 합니다.</p>

            <h4>제 2조 (용어의 정의)</h4>
            <p>① "10shoppinggame"서비스(이하 "서비스")란 ㈜딩펫 씨큐리티가 제공하는 서비스 관련된 일체의 부가서비스를 말합니다.</p>
            <p>② "10shoppinggame"서비스(이하 "서비스") 어플리케이션이란 "서비스"를 이용하기 위하여 "이용자"의 스마트폰에 설치하는 어플리케이션등을 말합니다.</p>
            <p>③ "이용자"란 본 약관에 따라 "서비스"를 이용하는 자를 말합니다.</p>

            <h4>제 3조 (서비스의 내용)</h4>
            <p>① "이용자"가 이용할 수 있는 "서비스"의 내용은 아래와 같습니다. "서비스" 상세 내용은 "10shoppinggame" 쇼핑몰에서 물건을 구매하고 자 하는 구매자들을 10명을 1개 조로 나누어 조별로 추첨하여 2명에게만 물건을 구매할 수 있는 권리를 주며 물건을 구매하지 못한 각 조의 8명에게는 물건을 구매한 구매자의 매출 중에 일정 금액을 비율에 따라 분배하는 것을 말한다.</p>
            <p>② "서비스"의 내용 및 범위 등은 지역 또는 국가별로 달라질 수 있습니다.</p>
            <p>③ "이용자"가 "서비스"에 활용하는 소프트웨어는 수시로 업데이트를 내려받아 설치할 수 있습니다. "이용자"는 "서비스"사용의 하나로 이러한 업데이트 다운로드와 설치에 동의합니다.</p>
            <p>④ "이용자"가 "10shoppinggame" 어플리케이션을 삭제하면 어플리케이션에 저장된 정보들이 전부 삭제될 수도 있습니다.</p>
            <p>⑤ "회사"가 제공하는 "서비스"의 종류 및 내용은 서비스 개시 후 최대 1년 동안 보장하며, "회사"의 내부정책 등에 따라 변경될 수 있습니다.</p>
            <p>⑥ "회사"는 편리한 서비스 제공을 위하여 법정대리인의 동의하에 14세 미만 앱사용자에 대해 동의를 구하고 사용을 할 수 있습니다. 14세 미만 사용자에 대해서는 법정대리인께서 보다 주의를 기울여 주시기 바랍니다. 보호자의 부주의로 인해 발생한 문제에 대해서는 책임지지 않습니다.</p>

            <h4>제 4조 (서비스 개시 및 해지)</h4>
            <p>① 서비스는 "이용자"의 서비스 이용약관에 대한 동의 후 관리자가 승인하여야 이용할 수 있습니다.</p>
            <p>② 더 이상 서비스를 원하지 않으면 서비스 내의 마이페이지 항목, 서비스 탈퇴를 통해 서비스를 해지할 수 있습니다.</p>
            <p>③ 서비스 해지 시 기존 이용자 데이터는 개인정보 보호법에 따라 일정 기간 후 일괄 삭제됩니다.</p>

            <h4>제 5조 (책임 제한)</h4>
            <p>① "회사"는 서비스 이용에 관련하여 "회사"의 중대한 고의 또는 과실로 인하여 "이용자"에게 발생한 손해 중 직접손해(App 서비스)에 대하여만 책임을 지며, 모든 간접, 부수적, 특별 또는 결과적 손해에 대해서는 책임을 지지 않습니다.</p>
            <p>② 스마트폰 네트워크 불안(통신망, 인터넷망, 블루투스) 또는 통신사의 사정으로 인해 "서비스"의 메시지 알람이 지연 또는 분실될 수 있습니다. 이로 인한 "이용자"가 입는 피해에 대해서 "회사"는 책임지지 않습니다.</p>
            <p>④ "회사"는 이용자의 본 약관 또는 관련 법령 위반 등 이용자 본인의 귀책 사유로 인한 서비스 이용의 장애 또는 발생하는 피해에 대하여는 책임을 지지 않습니다.</p>
            <p>⑤ "회사"는 천재지변 또는 이에 따르는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에 이용자에게 발생한 손해에 대하여 책임을 지지 않습니다.</p>
            <p>⑥ "회사"는 사용상의 부주의 및 패스워드의 분실, 비밀번호의 오남용 등 사용자의 직, 간접적인 물질적 피해에 대하여는 책임을 지지 않습니다.</p>

            <h4>제 6조 (회사의 의무)</h4>
            <p>① "회사"는 특별한 사유가 없는 한, 서비스 제공 설비를 항상 운용 가능한 상태로 유지보수하여야 하며, 안정적으로 서비스를 제공하여야 합니다.</p>
            <p>② "회사"는 이용자로부터 서비스를 이용하지 못하는 사실을 통지받은 경우 서비스 재개를 위해 가능한 조처를 하며, 서비스를 다시 이용할 수 있게 된 경우에도 이 사실을 이용자에게 통보합니다.</p>
            <p>③ "회사"는 서비스 제공과 관련하여 알고 있는 이용자의 개인정보를 본인의 승낙 없이 제 3자에게 누설, 배포하지 않습니다. 다만, 관계 법령에의한 관계기관으로부터의 요청 등 법률의 규정에 따른 적법한 절차에 의하면 그러하지 않습니다.</p>
            <p>④ "회사"는 개인정보 보호 방침에서 규정하고 있는 수집항목 및 이용 목적하에 이용자 정보를 수집할 수 있습니다.</p>
            <p>⑤ "회사"는 시스템의 유지보수 및 중대한 결함 발생으로 인해 서비스의 일시 중지가 필요하다고 판단되는 경우 이 사실을 사용자에게 사전 고지 후 서비스를 중지하며, 서비스가 재개되는 시점에서 사용자에게 다시 고지 할 의무가 있습니다.</p>

            <h4>제 7조 (이용자의 의무)</h4>
            <p>① 이용자는 이 "10shoppinggame" 서비스를 물품구매 이외의 다른 목적으로 사용해서는 안 됩니다.</p>
            <p>② 이용자는 이 서비스 이용을 위해 이용자의 부담으로 스마트폰 통신이 정상적으로 운영되도록 관리하여야 합니다.</p>
            <p>③ "서비스"를 사용하려면 "이용자"는 "서비스"사용과 관련하여 통신에 대해 발생할 수 있는 모든 비용을 전적으로 책임집니다.</p>
        `;
    } else if (type === 'privacy') {
        title.textContent = '개인정보처리방침';
        body.innerHTML = `
            <p>㈜딩펫 씨큐리티 (이하 "회사"라 함)는 통신비밀보호법, 전기통신사업법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 정보통신서비스제공자가 준수하여야 할 관련 법령상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한 개인정보취급방침을 정하여 이용자 권익 보호에 최선을 다하고 있습니다. 회사의 개인정보취급방침은 다음과 같은 내용을 담고 있습니다.</p>

            <h4>1. "회사"가 수집하고 있는 이용자의 개인정보</h4>
            <p><strong>• 가. 수집하는 개인정보의 항목</strong></p>
            <p>- 필수항목: 성명, ID(이메일계정), 비밀번호 등의 정보는 "회사"의 개인정보 취급 방침에 동의하는 경우 수집됩니다.</p>
            <p>- 기타 추가 서비스 및 설문조사를 통해 다양한 정보 수집 및 제공에 필요시 "회사"의 개인정보 취급 방침에 동의하는 경우 추가로 수집될 수 있습니다.</p>
            <p>- "회사"에서는 또한 아래의 항목들에 대해서도 안정된 서비스 제공을 위해 합법적인 절차와 회원의 동의를 거쳐 추가로 수집할 수 있습니다.</p>
            <ul>
                <li>1) IP Address, 쿠키, 방문 일시, 서비스 이용 기록, 불량 이용 기록</li>
                <li>2) 이메일, 휴대전화 번호, 비밀번호, 로그인 ID, 나이, 성별, 이름</li>
                <li>3) 접속 로그, 쿠키, 접속 IP 정보</li>
                <li>4) 신용카드 결제 시: 카드사명, 카드번호 등</li>
                <li>5) 휴대전화 결제 시: 이동전화번호, 통신사, 결제승인번호 등</li>
                <li>6) 계좌이체로 결제 시: 은행명, 계좌번호 등</li>
                <li>7) 상품권 이용 시: 상품권 번호 등</li>
            </ul>
            <p><strong>• 나. 개인정보 수집 방법</strong></p>
            <p>"회사"는 다음과 같은 방법으로 개인정보를 수집하고 있습니다.</p>
            <ul>
                <li>- 홈페이지, 모바일앱, 모바일웹, 서면양식, 팩스, 전화, 상담 게시판, 이메일, 이벤트 응모</li>
                <li>- 협력회사로부터 공동 제휴 및 협력을 통한 정보 수집</li>
                <li>- 생성정보 수집 툴을 통한 정보 수집</li>
            </ul>

            <h4>2. "회사"의 개인정보의 수집 및 이용목적</h4>
            <p><strong>• 가. 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산 정보를 활용합니다</strong></p>
            <p>- 컨텐츠 제공, 특정 맞춤 서비스 제공, 본인인증, 구매 및 요금 결제, 요금추심</p>
            <p><strong>• 나. 회원관리를 위한 일부 회원 정보를 활용합니다</strong></p>
            <p>- 회원제 서비스 이용 및 인증 서비스에 따른 본인확인, 개인식별, 불량회원(서비스 이용약관 의무 각항을 위반하거나 성실히 수행하지 않은 회원)의 부정 이용방지와 비인가 사용방지, 가입의사 확인, 가입 및 가입횟 수 제한, 분쟁 조정을 위한 기록보존, 불만처리 등 민원처리, 고지사항 전달</p>
            <p><strong>• 다. 신규 서비스 개발 및 마케팅, 광고에 활용합니다</strong></p>
            <p>- 신규 서비스 개발 및 인증 서비스, 맞춤 서비스 제공, 통계학적 특성에 따른 서비스 제공 및 광고 게재, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 접속 빈도 파악, 회원의 서비스 이용에 대한 통계, 서비스의 유효성 확인</p>

            <h4>3. "회사"에서 개인정보를 수집하는 방법</h4>
            <p>모든 회원이 "회사"로부터 서비스를 제공 받기 위해서는 회원님의 개인정보가 필요하며 개인정보는 회원가입 시 회원가입 양식에 사용자의 동의를 통해 수집됩니다.</p>

            <h4>4. 개인정보의 취급위탁</h4>
            <p>"회사"는 동의 없이 귀하의 개인정보를 외부에 위탁처리 하지 않습니다. 하지만 서비스 향상 및 안정적인 개인정보 취급을 위해서 귀하의 개인정보를 외부에 위탁하여 처리할 수 있습니다.</p>
            <p><strong>• 가. 개인정보의 처리를 위탁할 때는 미리 그 사실을 귀하에게 고지 하겠습니다.</strong></p>
            <p><strong>• 나. 개인정보의 처리를 위탁할 때는 위탁계약 등을 통하여 서비스제공자의 개인정보보호 관련 지시 엄수, 개인정보에 관한 비밀 유지, 제3자 제공의 금지 및 사고시의 책임부담 등을 명확히 규정하고 당해 계약 내용을 서면 또는 전자적으로 보관하겠습니다.</strong></p>

            <h4>5. 개인정보의 보유 및 이용기간</h4>
            <p>회원의 개인정보는 회원가입 후 서비스 이용기간이 종료되거나 회원이 계약 해지, 탈퇴 등의 사유로 이메일이나 서면을 통해 개인정보 삭제를 요구하는 경우에는 제3자의 열람과 이용이 불가능한 상태로 처리되며, '전자상거래 등에서의 소비자보호에 관한 법률' 제6조(거래기록의 보존 등)에 의하여 아래의 명시기간 동안 보관관리 합니다.</p>
            <p><strong>• 가. 계약, 청약철회, 회원서비스 제공 등의 거래에 관한 기록: 5년</strong></p>
            <p><strong>• 나. 대금결제 및 재화 등의 공급에 관한 기록: 5년</strong></p>
            <p><strong>• 다. 소비자 불만 또는 분쟁처리에 관한 기록: 3년</strong></p>

            <h4>6. 개인정보 파기 절차 및 방법</h4>
            <p>이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기하며 "회사"의 개인정보 파기절차 및 방법은 다음과 같습니다.</p>
            <p><strong>• 가. 파기절차</strong></p>
            <p>- 이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간 참조)일정 기간 저장된 후 파기됩니다.</p>
            <p>- 동 개인정보는 법률에 의한 경우가 아니고서는 보유되는 이외의 다른 목적으로 이용되지 않습니다.</p>
            <p><strong>• 나. 파기방법</strong></p>
            <p>- 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</p>
            <p>- 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</p>

            <h4>7. "회사"의 이용자 개인정보 정확성을 위한 내용</h4>
            <p>"회사"는 회원이 최선의 개인정보로 상태로 유지하도록 정기적으로 갱신을 유도합니다. 일부 정보에 대해서는 "회사"에서 정기적으로 확인작업이 이루어 집니다. 이용자의 부정확한 개인정보로 인하여 사용상의 불편을 줄 수 있으므로 개인정보 관리자가 판단하기에 확연히 부정확한 개인정보를 기입한 경우에는 정확하지 않은 개인정보를 파기할 수 있습니다.</p>

            <h4>8. "회사"의 이용자 개인정보 안전을 위하여 서비스의 일시적 중단</h4>
            <p>"회사"는 이용자의 안전한 서비스 이용을 위해서 최선을 다하고 있습니다. 그러나, 원하지 않는 방법에 의하여 저희의 서비스가 훼손을 당하는 경우에는 이용자들의 개인정보의 보호를 위하여, 문제가 완전하게 해결될 때까지 이용자의 개인정보를 이용한 서비스를 일시 중단 할 수도 있습니다.</p>

            <h4>9. "회사"의 제3 자와의 정보공유 및 제공 관련</h4>
            <p>"회사"는 정보통신망 이용촉진 및 정보보호 등에 관한 법률 제24조의2(개인정보의 제공 동의 등)에 따라 이용자의 개인정보를 규정에 의하여 고지 또는 명시한 범위를 초과하여 이용하거나 제3자에게 제공하지 않습니다. 또한 정보통신망 이용촉진 및 정보보호 등에 관한 법률 제66조 (비밀 유지 등)에 따라 "회사"의 서비스 제공을 위하여 이용자의 개인정보를 취급하거나 취급하였던 자는 직무상 알게 된 개인정보를 타인에게 누설하거나 제공하지 않습니다.</p>

            <h4>10. "회사"의 이용자의 개인정보 비밀 유지를 위한 내용</h4>
            <p>"회사"는 이용자의 개인정보의 비밀을 유지하기 위하여 제3 자에게는 이용자의 동의 없이 개인정보를 유출하지 않습니다. 또한 이용자가 동의를 하였다 하더라도, 제3 자를 통하여 재유출이 될 확률이 있는 자에게는 이용자의 개인정보를 유출하지 않습니다. "회사"는 각종정부기관의 이용자 개인정보의 일방적 제공 요구에 대하여는 이용자의 개인정보를 제공하지 않습니다. 법령에 따른 정부기관이 법령에 따른 공식 절차를 완벽하게 거쳐 자료를 요구하는 경우에 한하여 이용자의 개인정보를 제공합니다. "회사"는 이용자의 개인정보를 "회사"가 정한 기본서비스 및 기타의 서비스 활동 이외에는 이용하지 않습니다. 위의 활동에 따라 이용자의 정보가 필요할 시에는 별도의 양식을 통한 수집 및 동의의 절차를 거쳐서 이용자의 개인정보를 이용합니다.</p>

            <h4>11. 회원들이 자신의 개인정보를 보호하기 위해 알아야 할 사항</h4>
            <p>PC방 등 외부 장소에서 서비스를 사용하실 경우 완전히 로그아웃 하신 후 웹 브라우저의 창을 닫아 주십시오. 정상적으로 로그아웃을 하시지 않은 경우 회원님의 정보가 고스란히 남을 수 있습니다. "회사"는 개인정보보호에 최선을 다하지만 사용자 개인의 실수나 인터넷 상의 문제로 인한 일들에 대해서는 책임을 지지 않습니다. 이 점 양해해 주시면 감사하겠습니다.</p>

            <h4>12. "회사"가 인지못한 이용자의 개인정보 및 기타의 불만 사항에 관한 처리</h4>
            <p>"회사"가 인지하지 못하고 있는 이용자의 개인정보 이용 및 기타의 불만 사항에 관하여 이용자 불만 처리를 전담하는 관리자를 배정하여 지속적이고, 신속하게 이용자의 불만 사항을 처리하고, 처리한 결과에 대하여 즉시 응대합니다.</p>

            <h4>13. "회사"의 개인정보 취급자의 제한에 관한 내용</h4>
            <p>"회사"는 이용자의 개인정보를 취급할 권한이 있는 제한된 소수의 직원에게만 권한을 부여하고, 취급 권한을 가진 직원들에게는 개인 아이디(ID)와 비밀번호(Password)를 부여하고, 이를 수시로 변경하여 이용자의 개인정보를 보호 하는데 최선을 다합니다.</p>

            <h4>14. 이용자 및 법정대리인의 권리와 그 행사 방법</h4>
            <p><strong>• 가. 이용자 및 법정 대리인은 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수도 있습니다.</strong></p>
            <p><strong>• 나. 회원의 개인정보 조회, 수정을 위해서는 '개인정보 변경'(또는 '회원 정보수정' 등)을, 가입 해지(동의 철회)를 위해서는 "서비스 탈퇴"를 통하여 계약 해지 및 탈퇴가 가능합니다.</strong></p>
            <p><strong>• 다. 고객센터나 개인정보 책임자에게 서면, 전화 또는 이메일로 연락하시면 지체 없이 조치하겠습니다.</strong></p>
            <p><strong>• 라. 이용자가 개인정보의 오류에 대한 정정을 요청하신 경우에는 정정을 완료하기 전까지 해당 개인정보를 이용 또는 제공하지 않습니다. 또한 잘못된 개인정보를 제3 자에게 이미 제공한 경우에는 정정 처리결과를 제3자에게 지체 없이 통지하여 정정이 이루어지도록 하겠습니다.</strong></p>
            <p><strong>• 마. "회사"는 이용자 혹은 법정 대리인의 요청에 의해 해지 또는 삭제된 개인정보는 개인정보 취급방침 "5. 개인정보의 보유 및 이용기간"에 명시된 바에 따라 처리하고 그 외의 용도로 열람 또는 이용할 수 없도록 처리하고 있습니다.</strong></p>

            <h4>15. 개인정보 자동 수집 장치의 설치/운영 및 거부에 관한 사항</h4>
            <p>"회사"는 이용자들에게 특화된 맞춤 서비스를 제공하기 위해서 이용자들의 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다. 쿠키는 웹사이트를 운영하는데 이용되는 서버(HTTP)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.</p>
            <p><strong>• 가. 쿠키의 사용 목적</strong></p>
            <p>이용자들의 로그인 및 최근 접속기록을 토대로 "회사"와 유저간 상호 커뮤니케이션 시의 편리한 기능을 제공하기 위하여 활용됩니다.</p>
            <p><strong>• 나. 쿠키의 설치/운영 및 거부</strong></p>
            <p>- 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서, 이용자는 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.</p>
            <p>- 쿠키 설정을 거부하는 방법으로는 이용자가 사용하는 웹 브라우저의 옵션을 선택함으로써 모든 쿠키를 허용하거나 쿠키를 저장할 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다.</p>
            <p>- 설정방법 예(인터넷 익스플로러의 경우): 웹 브라우저 상단의 도구 > 인터넷 옵션 > 개인정보</p>
            <p>- 다만, 쿠키의 저장을 거부할 경우에는 이용에 어려움이 있을 수 있습니다.</p>

            <h4>16. 개인정보 관리 책임자 및 담당자의 연락처</h4>
            <p>귀하께서는 "회사"의 서비스를 이용하시며 발생하는 모든 개인정보보호 관련 민원을 개인정보 관리담당자 혹은 담당 부서로 신고하실 수 있습니다.</p>
            <p>"회사"는 이용자들의 신고사항에 대해 신속하게 충분한 답변을 드릴 것입니다.</p>
            <p><strong>• 개인정보 관리책임자</strong></p>
            <ul>
                <li>이름: 송건회</li>
                <li>직위: 관리담당자</li>
                <li>전화: 042-822-4521</li>
                <li>메일: ceo@shoppinggame.co.kr</li>
            </ul>
        `;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 약관 모달 닫기
function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// 주소 검색 초기화
function initAddressSearch() {
    const searchBtn = document.getElementById('searchAddress');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            openAddressSearch();
        });
    }
}

// 주소 검색 팝업 열기
function openAddressSearch() {
    new daum.Postcode({
        oncomplete: function(data) {
            // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.
            
            // 각 주소의 노출 규칙에 따라 주소를 조합한다.
            let addr = ''; // 주소 변수
            let extraAddr = ''; // 참고항목 변수
            
            // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
            if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
                addr = data.roadAddress;
            } else { // 사용자가 지번 주소를 선택했을 경우(J)
                addr = data.jibunAddress;
            }
            
            // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
            if(data.userSelectedType === 'R'){
                // 법정동명이 있을 경우 추가한다. (법정리는 제외)
                // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
                if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                    extraAddr += data.bname;
                }
                // 건물명이 있고, 공동주택일 경우 추가한다.
                if(data.buildingName !== '' && data.apartment === 'Y'){
                    extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                }
                // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
                if(extraAddr !== ''){
                    extraAddr = ' (' + extraAddr + ')';
                }
            }
            
            // 우편번호와 주소 정보를 해당 필드에 넣는다.
            document.getElementById('postcode').value = data.zonecode;
            document.getElementById('address').value = addr + extraAddr;
            
            // 커서를 상세주소 필드로 이동한다.
            document.getElementById('detailAddress').focus();
        }
    }).open();
}

