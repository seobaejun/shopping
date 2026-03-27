const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Firebase 웹 SDK 사용 (서비스 계정 키 없이)
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, doc, setDoc, query, where, getDocs, serverTimestamp } = require('firebase/firestore');

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBGQdEiVOl_49oVfb8TPWkc47uaFxV55Xg",
    authDomain: "shopping-31dce.firebaseapp.com",
    projectId: "shopping-31dce",
    storageBucket: "shopping-31dce.firebasestorage.app",
    messagingSenderId: "344605730776",
    appId: "1:344605730776:web:925f9d6206b1ff2e0374ad"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 엑셀 파일 경로
const excelFile = path.join(__dirname, '..', '회원정보.xlsx');
const logFile = path.join(__dirname, '..', 'migration-log.txt');

// 로그 함수
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, logMessage);
}

// 임시 비밀번호 생성 (아이디 + 핸드폰 뒤 4자리)
function generateTempPassword(userId, phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    const last4 = phoneDigits.slice(-4) || '0000';
    return `${userId}${last4}`;
}

// 기존 회원 확인 (Firestore만)
async function checkExistingUser(email, userId) {
    try {
        // Firestore에서 userId로 확인
        if (userId) {
            const q = query(collection(db, 'members'), where('userId', '==', userId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return true; // 이미 존재
            }
        }
        
        // 이메일로도 확인
        if (email) {
            const q = query(collection(db, 'members'), where('email', '==', email));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return true; // 이미 존재
            }
        }
        
        return false; // 신규 사용자
    } catch (error) {
        log(`기존 회원 확인 오류 (${email || userId}): ${error.message}`);
        return true; // 오류 시 안전하게 스킵
    }
}

// 사용자 생성
async function createUser(userData) {
    const { userId, email, name, phone, address, detailAddress, postcode, referralCode, joinDate, accountNumber } = userData;
    
    try {
        // 기존 회원 확인
        const exists = await checkExistingUser(email, userId);
        if (exists) {
            log(`⏭️  기존 회원 스킵: ${userId} (${email || 'no-email'})`);
            return { success: true, skipped: true };
        }
        
        // 임시 비밀번호 생성
        const tempPassword = generateTempPassword(userId, phone);
        
        // 유효한 이메일 생성
        const validEmail = email && email.includes('@') ? email : `${userId}@temp10shopping.com`;
        
        // Firebase Auth 계정 생성
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, validEmail, tempPassword);
            log(`✅ Auth 계정 생성: ${userId} -> ${userCredential.user.uid}`);
        } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
                log(`⏭️  이메일 이미 사용 중: ${validEmail}`);
                return { success: true, skipped: true };
            }
            throw authError;
        }
        
        // Firestore 문서 생성
        const memberData = {
            userId: userId,
            uid: userCredential.user.uid,
            email: validEmail,
            name: name || '',
            userName: name || '',
            phone: phone || '',
            postcode: postcode || '',
            address: address || '',
            detailAddress: detailAddress || '',
            referralCode: referralCode || '',
            recommender: referralCode || '관리자',
            mdCode: '', // MD 코드는 나중에 설정
            accountNumber: accountNumber || '',
            status: '정상',
            joinDate: joinDate ? new Date(joinDate) : new Date(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            purchaseAmount: 0,
            supportAmount: 0,
            tempPassword: tempPassword, // 임시 비밀번호 기록
            migrated: true, // 마이그레이션 표시
            migratedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'members', userCredential.user.uid), memberData);
        log(`✅ Firestore 문서 생성: ${userId} -> ${userCredential.user.uid}`);
        
        return { success: true, uid: userCredential.user.uid, tempPassword };
        
    } catch (error) {
        log(`❌ 사용자 생성 실패 (${userId}): ${error.message}`);
        return { success: false, error: error.message };
    }
}

// 엑셀 데이터 파싱
function parseExcelData(row) {
    // 엑셀 컬럼 매핑 (실제 컬럼명에 따라 조정)
    return {
        userId: (row.UserID || row['사용자ID'] || row['ID'] || '').toString().trim(),
        email: (row.Email || row['이메일'] || '').toString().trim(),
        name: (row.Name || row['이름'] || row['실명'] || '').toString().trim(),
        phone: (row.Phone1 || row.Phone2 || row['전화번호'] || row['휴대폰'] || '').toString().trim(),
        address: (row.Address || row['주소'] || '').toString().trim(),
        detailAddress: (row.DetailAddress || row['상세주소'] || '').toString().trim(),
        postcode: (row.PostCode1 || row['우편번호'] || '').toString().trim(),
        referralCode: (row.ReferralCode || row['추천인코드'] || '').toString().trim(),
        joinDate: row.JoinDate || row['가입일'] || '',
        accountNumber: (row.AccountNumber || row['계좌번호'] || '').toString().trim()
    };
}

// 메인 마이그레이션 함수
async function migrateUsers() {
    try {
        // 로그 파일 초기화
        fs.writeFileSync(logFile, `마이그레이션 시작: ${new Date().toISOString()}\n`);
        
        // 엑셀 파일 읽기
        log('📊 엑셀 파일 읽는 중...');
        const workbook = XLSX.readFile(excelFile);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        
        log(`📋 총 ${rawData.length}개 회원 데이터 로드됨`);
        
        // 데이터 정제
        const validData = rawData
            .map(parseExcelData)
            .filter(userData => userData.userId && userData.userId.trim() !== '');
        
        log(`✅ 유효한 데이터: ${validData.length}개`);
        
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        
        // 순차 처리 (Auth API 제한 고려)
        for (let i = 0; i < validData.length; i++) {
            const userData = validData[i];
            
            log(`\n🔄 처리 중 ${i + 1}/${validData.length}: ${userData.userId}`);
            
            const result = await createUser(userData);
            
            if (result.success) {
                if (result.skipped) {
                    skipCount++;
                } else {
                    successCount++;
                }
            } else {
                errorCount++;
            }
            
            // API 제한 방지를 위한 대기
            if (i < validData.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        log(`\n🎉 마이그레이션 완료!`);
        log(`✅ 성공: ${successCount}명`);
        log(`⏭️  스킵: ${skipCount}명`);
        log(`❌ 실패: ${errorCount}명`);
        log(`📊 총 처리: ${successCount + skipCount + errorCount}명`);
        
    } catch (error) {
        log(`💥 마이그레이션 전체 실패: ${error.message}`);
        console.error(error);
    }
}

// 실행
if (require.main === module) {
    migrateUsers().then(() => {
        log('마이그레이션 프로세스 종료');
        process.exit(0);
    }).catch(error => {
        log(`치명적 오류: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { migrateUsers };