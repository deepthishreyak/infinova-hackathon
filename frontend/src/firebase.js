import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC5f9y34o2QknHipEnMUZ6B2Y6TtmkMPmk',
  authDomain: 'cyphers-united-infinova-h.firebaseapp.com',
  projectId: 'cyphers-united-infinova-h',
  storageBucket: 'cyphers-united-infinova-h.firebasestorage.app',
  messagingSenderId: '478612862380',
  appId: '1:478612862380:web:e50d2c02610696a24db609',
  measurementId: 'G-Z3GEJM0DFH',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

let analytics = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
const signOutUser = () => signOut(auth);

export { app, analytics, auth, signInWithGoogle, signOutUser };