import { ENV } from './env.js';

export const firebaseConfig = {
  projectId: ENV.FIREBASE_PROJECT_ID,
  isConfigured: Boolean(ENV.FIREBASE_PROJECT_ID && ENV.FIREBASE_PROJECT_ID !== 'your-firebase-project')
};

/**
 * Production Firebase Hook:
 * When connecting production Firestore, initialize Firebase Admin SDK here.
 */
export function getFirestoreDb() {
  if (!firebaseConfig.isConfigured) {
    return null;
  }
  // Optional: initialize firebase-admin when service account json is supplied
  return null;
}
