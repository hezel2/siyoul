import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  ensureUserProfile,
  subscribeUserReadings,
} from '../services/sajuRepository';
import type { SavedSajuReading } from '../types/saju';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  readings: SavedSajuReading[];
  readingsLoading: boolean;
  readingsError: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  clearAuthError: () => void;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

function formatFirebaseErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('Quota exceeded')) {
    return '일일 데이터베이스 무료 사용량 한도에 도달했습니다. 내일 다시 시도하거나 Firebase 요금제를 확인해주세요.';
  }
  if (raw.includes('popup-closed-by-user') || raw.includes('cancelled-popup-request')) {
    return 'Google 로그인이 취소되었습니다.';
  }
  if (raw.includes('popup-blocked')) {
    return '브라우저에서 로그인 팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.';
  }
  return '저장소 연결 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [readings, setReadings] = useState<SavedSajuReading[]>([]);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [readingsError, setReadingsError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) {
      setReadings([]);
      setReadingsLoading(false);
      setReadingsError(null);
      return;
    }

    let active = true;
    let unsubscribeSnapshot: (() => void) | null = null;
    setReadingsLoading(true);
    setReadingsError(null);

    ensureUserProfile(user)
      .then(() => {
        if (!active) return;
        unsubscribeSnapshot = subscribeUserReadings(
          user,
          (list) => {
            if (!active) return;
            setReadings(list);
            setReadingsLoading(false);
            setReadingsError(null);
          },
          (err) => {
            if (!active) return;
            setReadingsLoading(false);
            setReadingsError(formatFirebaseErrorMessage(err));
          }
        );
      })
      .catch((err) => {
        if (!active) return;
        setReadingsLoading(false);
        setReadingsError(formatFirebaseErrorMessage(err));
      });

    return () => {
      active = false;
      unsubscribeSnapshot?.();
    };
  }, [authReady, user]);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      return cred.user;
    } catch (err) {
      setAuthError(formatFirebaseErrorMessage(err));
      return null;
    } finally {
      setAuthBusy(false);
    }
  };

  const signOutUser = async (): Promise<void> => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setAuthError(formatFirebaseErrorMessage(err));
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        authBusy,
        authError,
        readings,
        readingsLoading,
        readingsError,
        signInWithGoogle,
        signOutUser,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside FirebaseProvider');
  }
  return ctx;
}
