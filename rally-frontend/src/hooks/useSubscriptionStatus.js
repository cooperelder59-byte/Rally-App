import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export default function useSubscriptionStatus() {
  const [status, setStatus] = useState('loading'); // loading | active | inactive

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setStatus('inactive');
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      const data = snap.data() || {};
      const subscriptionStatus = data.subscriptionStatus;
      setStatus(subscriptionStatus === 'active' ? 'active' : 'inactive');
    });

    return () => unsubscribe();
  }, []); // run once on mount

  return status;
}

