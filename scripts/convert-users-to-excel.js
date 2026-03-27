const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

// 텍스트 파일 읽기
const inputFile = path.join(__dirname, '..', '유저 정보 (9).txt');
const outputFile = path.join(__dirname, '..', '회원정보.xlsx');

try {
    // 파일 읽기
    const data = fs.readFileSync(inputFile, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    
    // 헤더 정의 (추정되는 필드명들)
    const headers = [
        'ID', 'UserID', 'Password', 'Name', 'Nickname', 'JoinDate', 'Email', 'Field7', 'Field8', 'Field9', 'Field10', 'Field11',
        'Phone1', 'Phone2', 'Field14', 'Field15', 'Field16', 'PostCode1', 'PostCode2', 'Address', 'DetailAddress', 'AddressExtra',
        'Field22', 'Field23', 'ReferralCode', 'Field25', 'Field26', 'Field27', 'LastLogin', 'LoginIP', 'RegisterDate', 'RegisterIP',
        'Field32', 'Field33', 'Field34', 'Field35', 'Field36', 'Field37', 'Field38', 'Field39', 'Field40', 'Field41', 'Field42',
        'Field43', 'Field44', 'Field45', 'Field46', 'Field47', 'AccountNumber', 'Field49', 'Field50', 'Field51', 'Field52',
        'Field53', 'Field54', 'Field55', 'Field56'
    ];
    
    // 데이터 파싱
    const rows = [];
    
    // 헤더 추가
    rows.push(headers);
    
    // 각 라인 파싱
    lines.forEach((line, index) => {
        try {
            // 파이프(|)로 분리
            const fields = line.split('|').map(field => field.trim());
            
            // 빈 필드 제거 (첫 번째와 마지막 빈 필드)
            if (fields.length > 0 && fields[0] === '') fields.shift();
            if (fields.length > 0 && fields[fields.length - 1] === '') fields.pop();
            
            if (fields.length > 0) {
                // 필드 수를 헤더 수에 맞춤
                while (fields.length < headers.length) {
                    fields.push('');
                }
                rows.push(fields.slice(0, headers.length));
            }
        } catch (err) {
            console.warn(`라인 ${index + 1} 파싱 오류:`, err.message);
        }
    });
    
    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    
    // 컬럼 너비 설정
    const colWidths = [
        { wch: 5 },   // ID
        { wch: 15 },  // UserID
        { wch: 20 },  // Password (해시)
        { wch: 10 },  // Name
        { wch: 15 },  // Nickname
        { wch: 12 },  // JoinDate
        { wch: 25 },  // Email
        { wch: 10 },  // 기타 필드들...
    ];
    
    // 나머지 컬럼들도 기본 너비 설정
    for (let i = colWidths.length; i < headers.length; i++) {
        colWidths.push({ wch: 12 });
    }
    
    ws['!cols'] = colWidths;
    
    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(wb, ws, '회원정보');
    
    // 엑셀 파일로 저장
    XLSX.writeFile(wb, outputFile);
    
    console.log(`✅ 변환 완료!`);
    console.log(`📁 입력 파일: ${inputFile}`);
    console.log(`📊 출력 파일: ${outputFile}`);
    console.log(`📋 총 ${rows.length - 1}개 회원 정보 변환됨`);
    
} catch (error) {
    console.error('❌ 변환 실패:', error.message);
    process.exit(1);
}