import admin from 'firebase-admin';

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
    console.warn('Firebase credentials are not fully provided. Realtime updates will be disabled.');
  } else {
    admin.initializeApp({ credential: admin.credential.cert(firebaseConfig) });
  }
}

const db = admin.apps.length ? admin.firestore() : null;

export async function pushGridUpdate(grid: string[][], code: string) {
  if (!db) return;
  await db.collection('updates').doc('current').set({ grid, code, timestamp: new Date() });
}

export async function pushPayment(payment: any) {
  if (!db) return;
  await db.collection('payments').add(payment);
}
