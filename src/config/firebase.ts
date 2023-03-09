import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebase.config';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from '@firebase/firestore';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();
export const Providers = { google: new GoogleAuthProvider() };
