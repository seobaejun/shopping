const admin = require('firebase-admin');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Firebase Admin 초기화
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'shopping-31dce'
});

const auth = admin.auth();
const db = admin.firestore();

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
    const last4 = phoneDigits.slice(-4);
    return `${userId}${last4}`;
}

// 기존 회원 확인
async function checkExistingUser(email, userId) {
    try {
        // Firebase Auth에서 이메일로 확인
        if (email) {
            try {
                await auth.getUserByEmail(email);
                return true; // 이미 존재
            } catch (error) {
                if (error.code !== 'auth/user-not-found') {
                    throw error;
                }
            }
        }
        
        // Firestore에서 userId로 확인
        if (userId) {
            const userDoc = await db.collection('members').where('userId', '==', userId).limit(1).get();
            if (!userDoc.empty) {
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
        
        // Firebase Auth 계정 생성
        let authUser;
        try {
            authUser = await auth.createUser({
                uid: userId, // userId를 UID로 사용
                email: email || `${userId}@temp.local`, // 이메일이 없으면 임시 이메일
                password: tempPassword,
                displayName: name,
                phoneNumber: phone ? `+82${phone.replace(/\D/g, '').substring(1)}` : undefined
            });
            log(`✅ Auth 계정 생성: ${userId}`);
        } catch (authError) {
            if (authError.code === 'auth/email-already-exists' || authError.code === 'auth/uid-already-exists') {
                log(`⏭️  Auth 계정 이미 존재: ${userId}`);
                return { success: true, skipped: true };
            }
            throw authError;
        }
        
        // Firestore 문서 생성
        const memberData = {
            userId: userId,
            uid: authUser.uid,
            email: email || '',
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
            joinDate: joinDate ? admin.firestore.Timestamp.fromDate(new Date(joinDate)) : admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            purchaseAmount: 0,
            supportAmount: 0,
            tempPassword: tempPassword // 임시 비밀번호 기록 (나중에 삭제 가능)
        };
        
        await db.collection('members').doc(authUser.uid).set(memberData);
        log(`✅ Firestore 문서 생성: ${userId} -> ${authUser.uid}`);
        
        return { success: true, uid: authUser.uid, tempPassword };
        
    } catch (error) {
        log(`❌ 사용자 생성 실패 (${userId}): ${error.message}`);
        return { success: false, error: error.message };
    }
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
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        log(`📋 총 ${data.length}개 회원 데이터 로드됨`);
        
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        
        // 배치 처리 (10개씩)
        const batchSize = 10;
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            
            log(`\n🔄 배치 ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)} 처리 중...`);
            
            // 배치 내 병렬 처리
            const promises = batch.map(async (row) => {
                // 엑셀 데이터 매핑 (컬럼 순서에 따라 조정 필요)
                const userData = {
                    userId: row.UserID || row['UserID'] || '',
                    email: row.Email || row['Email'] || '',
                    name: row.Name || row['Name'] || '',
                    phone: row.Phone1 || row.Phone2 || row['Phone1'] || row['Phone2'] || '',
                    address: row.Address || row['Address'] || '',
                    detailAddress: row.DetailAddress || row['DetailAddress'] || '',
                    postcode: row.PostCode1 || row['PostCode1'] || '',
                    referralCode: row.ReferralCode || row['ReferralCode'] || '',
                    joinDate: row.JoinDate || row['JoinDate'] || '',
                    accountNumber: row.AccountNumber || row['AccountNumber'] || ''
                };
                
                // 필수 필드 확인
                if (!userData.userId || userData.userId.trim() === '') {
                    log(`⚠️  UserID 없음, 스킵: ${JSON.stringify(userData)}`);
                    return { success: true, skipped: true };
                }
                
                return await createUser(userData);
            });
            
            const results = await Promise.all(promises);
            
            // 결과 집계
            results.forEach(result => {
                if (result.success) {
                    if (result.skipped) {
                        skipCount++;
                    } else {
                        successCount++;
                    }
                } else {
                    errorCount++;
                }
            });
            
            // 배치 간 잠시 대기 (API 제한 방지)
            if (i + batchSize < data.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
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