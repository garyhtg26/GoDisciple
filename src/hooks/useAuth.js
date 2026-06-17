import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile } from '../services/userService';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async firebaseUser => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const p = await getUserProfile(firebaseUser.uid);
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    // Fall back to auth.currentUser: right after sign-up the `user` state may
    // not have propagated yet, but auth.currentUser is already set.
    const uid = user?.uid || auth.currentUser?.uid;
    if (uid) {
      const p = await getUserProfile(uid);
      setProfile(p);
      return p;
    }
    return null;
  };

  return { user, profile, loading, refreshProfile };
}
