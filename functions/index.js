const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

const db = getFirestore();
const auth = getAuth();

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

exports.qrSignIn = onCall(async (request) => {
  const data = request.data || {};
  const value = clean(data.value);
  const kind = data.kind === 'student' ? 'student' : data.kind === 'servant' ? 'servant' : '';

  if (!value || !kind) {
    throw new HttpsError('invalid-argument', 'بيانات QR غير مكتملة.');
  }

  let uid;
  let claims;

  if (kind === 'student') {
    const snapshot = await db.collection('students').where('studentCode', '==', value).limit(1).get();
    if (snapshot.empty) {
      throw new HttpsError('permission-denied', 'QR الطالب غير مسجل.');
    }
    const doc = snapshot.docs[0];
    uid = `student:${doc.id}`;
    claims = { appRole: 'student', studentId: doc.id };
  } else {
    const byId = await db.collection('servants').doc(value).get();
    let servantDoc = byId.exists ? byId : null;

    if (!servantDoc) {
      const byCode = await db.collection('servants').where('secretCode', '==', value).limit(1).get();
      if (!byCode.empty) servantDoc = byCode.docs[0];
    }

    if (!servantDoc) {
      const byQr = await db.collection('servants').where('qrCode', '==', value).limit(1).get();
      if (!byQr.empty) servantDoc = byQr.docs[0];
    }

    if (!servantDoc) {
      throw new HttpsError('permission-denied', 'QR الخادم غير مسجل.');
    }

    const servant = servantDoc.data() || {};
    if (servant.isActive === false) {
      throw new HttpsError('permission-denied', 'حساب الخادم غير نشط.');
    }

    uid = `servant:${servantDoc.id}`;
    claims = {
      appRole: servant.role || 'junior_servant',
      servantId: servantDoc.id,
    };
  }

  const token = await auth.createCustomToken(uid, claims);
  return { token };
});
