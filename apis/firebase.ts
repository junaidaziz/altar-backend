import admin from 'firebase-admin';

type GridRow = { cells: string[] };

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  if (
    !firebaseConfig.projectId ||
    !firebaseConfig.clientEmail ||
    !firebaseConfig.privateKey
  ) {
    console.warn(
      'Firebase credentials are not fully provided. Realtime updates will be disabled.'
    );
  } else {
    admin.initializeApp({ credential: admin.credential.cert(firebaseConfig) });
  }
}

const db = admin.apps.length ? admin.firestore() : null;

export async function pushGridUpdate(grid: string[][], code: string) {
  if (!db) return;
  // turn each inner array into an object, so Firestore sees:
  // updates/current → { rows: [ { cells: […] }, { cells: […] }, … ], code: "...", timestamp: … }
  const rows: GridRow[] = grid.map((row) => ({ cells: row }));

  await db.collection('updates')
          .doc('current')
          .set({
            rows,
            code,
            timestamp: new Date(),
          });
}

export async function pushPayment(payment: any) {
  if (!db) return;
  await db.collection('payments').add(payment);
}

export async function fetchPayments() {
  if (!db) return [];
  const snapshot = await db.collection('payments').orderBy('timestamp', 'asc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
}

export async function fetchCurrentGrid() {
  if (!db) return null;
  const doc = await db.collection('updates').doc('current').get();
  if (!doc.exists) return null;

  type Stored = {
    rows: { cells: string[] }[];
    code: string;
    timestamp: any;
  };

  const data = doc.data() as Stored;
  // reconstruct the original grid shape:
  const grid: string[][] = data.rows.map((r) => r.cells);

  return { grid, code: data.code, timestamp: data.timestamp };
}