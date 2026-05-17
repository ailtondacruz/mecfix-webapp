import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../../services/firebase';
import { AuthContext, readJsonSafely } from '../../../shared';
import type { User, Workshop } from '../../../shared';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const [user, setUser] = useState<User | null>(null);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Recupera dados de usuário do Firestore baseado no UID
  const fetchUserData = useCallback(async (uid: string, token: string): Promise<User | null> => {
    try {
      const response = await fetch(`/api/users/${uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch user data:', response.statusText);
        return null;
      }

      const data = await readJsonSafely(response);
      return data?.data || null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, []);

  const fetchWorkshopData = useCallback(async (workshopId: string, token: string): Promise<Workshop | null> => {
    try {
      const response = await fetch(`/api/workshops/${workshopId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await readJsonSafely(response);
      return data?.data || null;
    } catch (error) {
      console.error('Error fetching workshop data:', error);
      return null;
    }
  }, []);

  // Restaura sessão ao inicializar
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          const userData = await fetchUserData(firebaseUser.uid, token);
          if (userData) {
            setUser(userData);
            if (userData.workshopId) {
              const workshopData = await fetchWorkshopData(userData.workshopId, token);
              setWorkshop(workshopData);
            } else {
              setWorkshop(null);
            }
          } else {
            // Mesmo sem dados no Firestore, cria um user básico
            setUser({
              userId: firebaseUser.uid,
              workshopId: '',
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role: 'attendant', // default, será sobrescrito com dados reais
              permissions: [],
              createdAt: new Date(),
            });
          }
        } else {
          setUser(null);
          setWorkshop(null);
        }
      } finally {
        setIsInitializing(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserData, fetchWorkshopData]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setWorkshop(null);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshWorkshop = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    const token = await firebaseUser.getIdToken();
    const userData = user ?? await fetchUserData(firebaseUser.uid, token);
    if (userData?.workshopId) {
      const workshopData = await fetchWorkshopData(userData.workshopId, token);
      setWorkshop(workshopData);
    }
  }, [user, fetchUserData, fetchWorkshopData]);

  const value = useMemo(() => ({
    user,
    workshop,
    isLoading: isLoading || isInitializing,
    login,
    logout,
    refreshWorkshop,
    isAuthenticated: !!user,
  }), [user, workshop, isLoading, isInitializing, login, logout, refreshWorkshop]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-mecfix-orange border-t-transparent" />
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
