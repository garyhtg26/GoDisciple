import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { createUserProfile } from './userService';

export async function registerWithEmail({ fullName, email, phone, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: fullName });
  await createUserProfile(credential.user.uid, {
    fullName,
    email,
    phone,
    photoURL: null,
    role: 'member',
    groupId: null,
    leaderClaimCode: null,
  });
  return credential.user;
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logout() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/*
  Google Sign-In requires a development build (not Expo Go).
  To set it up:
  1. Install expo-auth-session and expo-web-browser:
       npx expo install expo-auth-session expo-web-browser @react-native-google-signin/google-signin
  2. Create an OAuth client ID at console.firebase.google.com
  3. Add the clientId to your .env as EXPO_PUBLIC_GOOGLE_CLIENT_ID
  4. Use GoogleAuthProvider.credential() to sign in to Firebase

  Skeleton is in src/services/googleAuthService.js (not wired until dev build).
*/
