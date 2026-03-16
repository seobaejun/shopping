/**
 * Firebase Cloud Functions
 * - sendSMS: 솔라피(Solapi) 연동 문자 발송
 * - requestVerificationCode: 회원가입 휴대폰 인증번호 요청 (6자리 생성 → 저장 → SMS 발송)
 * - verifyVerificationCode: 인증번호 확인
 */

const crypto = require("crypto");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const SOLAPI_URL = "https://api.solapi.com/messages/v4/send";
const VERIFICATION_EXPIRY_MINUTES = 5;
const VERIFICATION_COLLECTION = "verificationCodes";

function getSolapiCredentials() {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = process.env.SOLAPI_SENDER;
  if (!apiKey || !apiSecret || !sender) return null;
  return { apiKey, apiSecret, sender };
}

/** 솔라피 API는 Basic이 아니라 HMAC-SHA256 인증만 허용 */
function createSolapiAuthHeader(apiKey, apiSecret) {
  const dateTime = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const data = dateTime + salt;
  const signature = crypto.createHmac("sha256", apiSecret).update(data).digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}`;
}

async function sendSMSViaSolapi(to, text) {
  const cred = getSolapiCredentials();
  if (!cred) throw new Error("문자 발송 설정이 되어 있지 않습니다.");
  const from = cred.sender.replace(/\D/g, "");
  const toTrimmed = String(to).replace(/\D/g, "");
  const authHeader = createSolapiAuthHeader(cred.apiKey, cred.apiSecret);
  const res = await fetch(SOLAPI_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: { to: toTrimmed, from: from, text: text.trim() },
    }),
  });
  const result = await res.json();
  if (!res.ok) {
    console.error("Solapi sendSMSViaSolapi HTTP 오류:", res.status, result);
    throw new Error(result.errorMessage || result.message || "SMS 전송에 실패했습니다.");
  }
  if (result.successCount != null && result.successCount < 1) {
    console.error("Solapi sendSMSViaSolapi 발송 실패:", result);
    throw new Error(result.errorMessage || result.message || "SMS 전송에 실패했습니다.");
  }
  return result;
}

/**
 * Callable: 문자 발송
 * @param {Object} data - { to: 수신번호, text: 메시지 내용 }
 * @returns {Object} - { success: true, messageId?: string } 또는 throw HttpsError
 */
exports.sendSMS = onCall(
  {
    region: "asia-northeast3",
  },
  async (request) => {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    const sender = process.env.SOLAPI_SENDER;

    if (!apiKey || !apiSecret || !sender) {
      console.error("Solapi env 미설정: SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER");
      throw new HttpsError("failed-precondition", "문자 발송 설정이 되어 있지 않습니다.");
    }

    const { to, text } = request.data || {};
    const toTrimmed = typeof to === "string" ? to.replace(/\D/g, "") : "";
    const textTrimmed = typeof text === "string" ? text.trim() : "";

    if (!toTrimmed || toTrimmed.length < 10) {
      throw new HttpsError("invalid-argument", "수신번호를 올바르게 입력해주세요.");
    }
    if (!textTrimmed) {
      throw new HttpsError("invalid-argument", "메시지 내용이 비어 있습니다.");
    }

    const from = sender.replace(/\D/g, "");
    const authHeader = createSolapiAuthHeader(apiKey, apiSecret);

    const body = {
      message: {
        to: toTrimmed,
        from: from,
        text: textTrimmed,
      },
    };

    try {
      const res = await fetch(SOLAPI_URL, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Solapi API 오류:", result);
        throw new HttpsError("internal", result.errorMessage || "문자 발송에 실패했습니다.");
      }

      const successCount = result.successCount != null ? result.successCount : 0;
      if (successCount < 1) {
        console.error("Solapi 발송 실패:", result);
        throw new HttpsError("internal", result.errorMessage || "문자 발송에 실패했습니다.");
      }

      return {
        success: true,
        messageId: result.messageId || null,
      };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error("sendSMS 예외:", err);
      throw new HttpsError("internal", err.message || "문자 발송 중 오류가 발생했습니다.");
    }
  }
);

/**
 * Callable: 회원가입 휴대폰 인증번호 요청
 * @param {Object} data - { phone: '01012345678' }
 * @returns {Object} - { success: true }
 */
exports.requestVerificationCode = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    try {
      const phone = request.data && request.data.phone;
      const phoneTrimmed = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
      if (!phoneTrimmed || phoneTrimmed.length < 10) {
        throw new HttpsError("invalid-argument", "올바른 휴대폰번호를 입력해주세요.");
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_MINUTES * 60 * 1000);
      await db.collection(VERIFICATION_COLLECTION).doc(phoneTrimmed).set({
        code,
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const text = `[10쇼핑게임] 인증번호는 ${code}입니다. ${VERIFICATION_EXPIRY_MINUTES}분 내에 입력해주세요.`;
      await sendSMSViaSolapi(phoneTrimmed, text);
      return { success: true };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error("requestVerificationCode 예외:", err);
      const msg = err && err.message ? err.message : "인증번호 발송 중 오류가 발생했습니다.";
      throw new HttpsError("internal", msg);
    }
  }
);

/**
 * Callable: 인증번호 확인
 * @param {Object} data - { phone: '01012345678', code: '123456' }
 * @returns {Object} - { success: true }
 */
exports.verifyVerificationCode = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    try {
      const { phone, code } = request.data || {};
      const phoneTrimmed = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
      const codeTrimmed = typeof code === "string" ? code.trim() : "";
      if (!phoneTrimmed || !codeTrimmed) {
        throw new HttpsError("invalid-argument", "휴대폰번호와 인증번호를 입력해주세요.");
      }
      const ref = db.collection(VERIFICATION_COLLECTION).doc(phoneTrimmed);
      const snap = await ref.get();
      if (!snap.exists) {
        throw new HttpsError("failed-precondition", "인증번호를 먼저 요청해주세요.");
      }
      const data = snap.data();
      const expiresAt = data.expiresAt && data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(0);
      if (Date.now() > expiresAt.getTime()) {
        await ref.delete();
        throw new HttpsError("failed-precondition", "인증번호가 만료되었습니다. 다시 요청해주세요.");
      }
      if (data.code !== codeTrimmed) {
        throw new HttpsError("invalid-argument", "인증번호가 올바르지 않습니다.");
      }
      await ref.delete();
      return { success: true };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error("verifyVerificationCode 예외:", err);
      const msg = err && err.message ? err.message : "인증번호 확인 중 오류가 발생했습니다.";
      throw new HttpsError("internal", msg);
    }
  }
);

/**
 * Callable: Firebase Auth 사용자 삭제 (관리자 회원 삭제 시 Firestore와 함께 호출)
 * @param {Object} data - { uid: string } Firebase Auth UID (members 문서 ID와 동일)
 * @returns {Object} - { success: true } 또는 user-not-found 시에도 성공 처리
 */
exports.deleteAuthUser = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    const uid = request.data && request.data.uid;
    const uidTrimmed = typeof uid === "string" ? uid.trim() : "";
    if (!uidTrimmed) {
      throw new HttpsError("invalid-argument", "uid가 필요합니다.");
    }
    try {
      await admin.auth().deleteUser(uidTrimmed);
      return { success: true };
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        return { success: true };
      }
      console.error("deleteAuthUser 예외:", err);
      throw new HttpsError("internal", err.message || "Auth 사용자 삭제에 실패했습니다.");
    }
  }
);

/**
 * Callable: Auth에는 있으나 members에 없는 사용자를 members 문서로 복구
 * @returns {Object} - { restored: number }
 */
exports.restoreAuthUsersToMembers = onCall(
  { region: "asia-northeast3" },
  async (request) => {
    let restored = 0;
    let pageToken;
    const membersRef = db.collection("members");
    do {
      const listResult = await admin.auth().listUsers(1000, pageToken);
      for (const user of listResult.users) {
        const uid = user.uid;
        const doc = await membersRef.doc(uid).get();
        if (!doc.exists) {
          const email = user.email || "";
          const displayName = (user.displayName || "").trim();
          const phone = (user.phoneNumber || "").trim();
          await membersRef.doc(uid).set({
            uid,
            userId: email || uid,
            email,
            name: displayName || email || uid,
            phone,
            status: "정상",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          restored++;
        }
      }
      pageToken = listResult.pageToken;
    } while (pageToken);
    return { restored };
  }
);
