/**
 * .env 기반 SFTP 접속 후 루트 디렉터리 목록만 출력.
 * 비밀번호는 로그/출력에 넣지 않음.
 */
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
        throw new Error('.env 파일 없음: ' + envPath);
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eq = trimmed.indexOf('=');
        if (eq <= 0) return;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        env[key] = val;
    });
    return env;
}

async function main() {
    const env = loadEnv();
    const host = env.SFTP_HOST || env.IMAGE_SERVER_HOST;
    const port = parseInt(env.SFTP_PORT || env.IMAGE_SERVER_PORT || '10010', 10);
    const username = env.SFTP_USER;
    const password = env.SFTP_PASSWORD;
    if (!host || !username || !password) {
        console.error(' .env에 SFTP_HOST, SFTP_USER, SFTP_PASSWORD 필요');
        process.exit(1);
    }
    let SftpClient;
    try {
        SftpClient = require('ssh2-sftp-client');
    } catch (e) {
        console.error('ssh2-sftp-client 설치 필요: npm install ssh2-sftp-client');
        process.exit(1);
    }
    const sftp = new SftpClient();
    try {
        await sftp.connect({ host, port, username, password });
        console.log('접속 성공:', host + ':' + port);
        const list = await sftp.list('/');
        console.log('루트 디렉터리 항목 수:', list.length);
        list.forEach(entry => console.log(' -', entry.type, entry.name));
        await sftp.end();
    } catch (err) {
        console.error('접속 실패:', err.message);
        process.exit(1);
    }
}

main();
