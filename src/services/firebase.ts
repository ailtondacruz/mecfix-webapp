import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const useEmulator = import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true';
const emulatorProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-mecfix';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (useEmulator ? 'demo-api-key' : ''),
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    (useEmulator ? `${emulatorProjectId}.firebaseapp.com` : ''),
  projectId: emulatorProjectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    (useEmulator ? `${emulatorProjectId}.appspot.com` : ''),
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (useEmulator ? '000000000000' : ''),
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    (useEmulator ? '1:000000000000:web:demo-mecfix' : ''),
};

if (!useEmulator && !firebaseConfig.apiKey) {
  throw new Error(
    'Firebase Web config missing. Set VITE_FIREBASE_API_KEY (or enable VITE_FIREBASE_USE_EMULATOR=true).',
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

if (useEmulator) {
  const host = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1';
  const authPort = Number(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT || 9099);
  const firestorePort = Number(
    import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8080,
  );
  const storagePort = Number(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || 9199);

  const globalKey = '__mecfixFirebaseEmulatorConnected__';
  const globalScope = globalThis as typeof globalThis & Record<string, boolean>;

  if (!globalScope[globalKey]) {
    connectAuthEmulator(auth, `http://${host}:${authPort}`, {
      disableWarnings: true,
    });
    connectFirestoreEmulator(firestore, host, firestorePort);
    connectStorageEmulator(storage, host, storagePort);
    globalScope[globalKey] = true;
  }
}
