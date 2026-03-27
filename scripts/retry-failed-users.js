const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Firebase 웹 SDK 사용
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
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

// 파일 경로
const excelFile = path.join(__dirname, '..', '회원정보.xlsx');
const logFile = path.join(__dirname, '..', 'retry-migration-log.txt');

// 실패한 사용자 목록 (로그에서 추출)
const failedUsers = [
    'choco49213', 'ydy125', 'nkh66633', 'gdemonicg', 'chn8537', 'opera', 'bummy123', '1020game', 'gldldls'
    // 나머지 실패한 사용자들도 추가 (로그에서 확인 필요)
];

// 로그 함수
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, logMessage);
}

// 임시 비밀번호 생성
function generateTempPassword(userId, phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    const last4 = phoneDigits.slice(-4) || '0000';
    return `${userId}${last4}`;
}

// 기존 회원 확인
async function checkExistingUser(email, userId) {
    try {
        if (userId) {
            const q = query(collection(db, 'members'), where('userId', '==', userId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return true;
            }
        }
        
        if (email) {
            const q = query(collection(db, 'members'), where('email', '==', email));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        log(`기존 회원 확인 오류 (${email || userId}): ${error.message}`);
        return true;
    }
}

// 사용자 생성 (더 긴 대기 시간 적용)
async function createUserWithRetry(userData, retryCount = 0) {
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
            if (authError.code === 'auth/too-many-requests') {
                if (retryCount < 3) {
                    log(`⏳ API 제한으로 재시도 대기 중... (${retryCount + 1}/3): ${userId}`);
                    // 더 긴 대기 시간 (10초)
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    return await createUserWithRetry(userData, retryCount + 1);
                }
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
            mdCode: '',
            accountNumber: accountNumber || '',
            status: '정상',
            joinDate: joinDate ? new Date(joinDate) : new Date(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            purchaseAmount: 0,
            supportAmount: 0,
            tempPassword: tempPassword,
            migrated: true,
            migratedAt: serverTimestamp(),
            retryMigration: true // 재시도 표시
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

// 실패한 사용자들 재시도
async function retryFailedUsers() {
    try {
        // 로그 파일 초기화
        fs.writeFileSync(logFile, `실패 사용자 재시도 시작: ${new Date().toISOString()}\n`);
        
        // 엑셀 파일 읽기
        log('📊 엑셀 파일에서 실패한 사용자 데이터 로드 중...');
        const workbook = XLSX.readFile(excelFile);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        
        // 실패한 사용자들만 필터링
        const failedUsersData = rawData
            .map(parseExcelData)
            .filter(userData => {
                // 162번째부터 172번째까지 (인덱스 161-171)
                const userIndex = rawData.findIndex(row => 
                    parseExcelData(row).userId === userData.userId
                );
                return userIndex >= 161 && userData.userId && userData.userId.trim() !== '';
            });
        
        log(`🔄 재시도할 사용자: ${failedUsersData.length}명`);
        
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        
        // 순차 처리 (API 제한 방지를 위해 3초 간격)
        for (let i = 0; i < failedUsersData.length; i++) {
            const userData = failedUsersData[i];
            
            log(`\n🔄 재시도 ${i + 1}/${failedUsersData.length}: ${userData.userId}`);
            
            const result = await createUserWithRetry(userData);
            
            if (result.success) {
                if (result.skipped) {
                    skipCount++;
                } else {
                    successCount++;
                }
            } else {
                errorCount++;
            }
            
            // API 제한 방지를 위한 긴 대기 (3초)
            if (i < failedUsersData.length - 1) {
                log(`⏳ 다음 처리까지 3초 대기...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        log(`\n🎉 재시도 완료!`);
        log(`✅ 성공: ${successCount}명`);
        log(`⏭️  스킵: ${skipCount}명`);
        log(`❌ 실패: ${errorCount}명`);
        log(`📊 총 재시도: ${successCount + skipCount + errorCount}명`);
        
        // 전체 마이그레이션 결과
        const totalSuccess = 98 + successCount;
        const totalSkip = 3 + skipCount;
        const totalFailed = 71 - successCount + errorCount;
        
        log(`\n📊 전체 마이그레이션 최종 결과:`);
        log(`✅ 총 성공: ${totalSuccess}명`);
        log(`⏭️  총 스킵: ${totalSkip}명`);
        log(`❌ 총 실패: ${totalFailed}명`);
        
    } catch (error) {
        log(`💥 재시도 전체 실패: ${error.message}`);
        console.error(error);
    }
}

// 실행
if (require.main === module) {
    retryFailedUsers().then(() => {
        log('재시도 프로세스 종료');
        process.exit(0);
    }).catch(error => {
        log(`치명적 오류: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { retryFailedUsers };