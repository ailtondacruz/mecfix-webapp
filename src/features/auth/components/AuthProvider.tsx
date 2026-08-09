import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../../services/firebase';
import {
  AuthContext,
  buildHttpError,
  getUserFacingErrorMessage,
  readJsonSafely,
} from '../../../shared';
import type { User, Workshop } from '../../../shared';

interface AuthProviderProps {
  children: ReactNode;
}

function resolveRoleFromClaims(claims: Record<string, unknown> | undefined): User['role'] {
  const role = claims?.role;

  if (role === 'root' || role === 'admin' || role === 'owner' || role === 'mechanic' || role === 'attendant') {
    return role;
  }

  if (claims?.isAdmin === true) {
    return 'admin';
  }

  return 'attendant';
}

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const [user, setUser] = useState<User | null>(null);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFetchingSession, setIsFetchingSession] = useState(false);
  const [authError, setAuthError] = useState('');

  const clearAuthError = useCallback(() => {
    setAuthError('');
  }, []);

  // Recupera dados de usuário do Firestore baseado no UID
  const fetchUserData = useCallback(async (uid: string, token: string): Promise<User | null> => {
    try {
      const response = await fetch(`/api/users/${uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw await buildHttpError(
          response,
          'Nao foi possivel carregar seu perfil de acesso.',
          'AUTH-USER-PROFILE-FETCH',
        );
      }

      const data = await readJsonSafely(response);
      if (!data?.data) {
        return null;
      }

      return data.data;
    } catch (error) {
      const uiMessage = getUserFacingErrorMessage(
        error,
        'Falha ao obter dados de autenticacao.',
      );
      setAuthError(uiMessage);
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

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw await buildHttpError(
          response,
          'Nao foi possivel carregar os dados da oficina.',
          'AUTH-WORKSHOP-FETCH',
        );
      }

      const data = await readJsonSafely(response);
      return data?.data || null;
    } catch (error) {
      const uiMessage = getUserFacingErrorMessage(
        error,
        'Falha ao obter dados da oficina.',
      );
      setAuthError(uiMessage);
      console.error('Error fetching workshop data:', error);
      return null;
    }
  }, []);

  // Restaura sessão ao inicializar
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setIsFetchingSession(true);
      try {
        setAuthError('');

        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          const tokenResult = await firebaseUser.getIdTokenResult();
          const roleFromClaims = resolveRoleFromClaims(tokenResult.claims);
          const userData = await fetchUserData(firebaseUser.uid, token);

          if (userData) {
            const mergedUser: User = {
              ...userData,
              name: userData.name || firebaseUser.displayName || 'Usuário',
              email: userData.email || firebaseUser.email || '',
              role: userData.role || roleFromClaims,
            };

            setUser(mergedUser);
            if (userData.workshopId) {
              const workshopData = await fetchWorkshopData(userData.workshopId, token);
              setWorkshop(workshopData);
            } else {
              setWorkshop(null);
            }
          } else {
            // Fallback para ambientes onde o perfil pode não existir no Firestore.
            setUser({
              userId: firebaseUser.uid,
              workshopId: '',
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role: roleFromClaims,
              permissions: [],
              createdAt: new Date(),
            });
            setWorkshop(null);
          }
        } else {
          setUser(null);
          setWorkshop(null);
        }
      } catch (error) {
        setUser(null);
        setWorkshop(null);
        const uiMessage = getUserFacingErrorMessage(
          error,
          'Falha ao inicializar sessao de usuario.',
        );
        setAuthError(uiMessage);
        console.error('Session initialization error:', error);
      } finally {
        setIsInitializing(false);
        setIsFetchingSession(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserData, fetchWorkshopData]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      setAuthError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const uiMessage = getUserFacingErrorMessage(
        error,
        'Nao foi possivel realizar login.',
      );
      setAuthError(uiMessage);
      throw error;
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
      setAuthError('');
      localStorage.removeItem('authToken');
    } catch (error) {
      const uiMessage = getUserFacingErrorMessage(
        error,
        'Nao foi possivel encerrar sua sessao.',
      );
      setAuthError(uiMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshWorkshop = useCallback(async () => {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return;
      const token = await firebaseUser.getIdToken();
      const userData = user ?? await fetchUserData(firebaseUser.uid, token);
      if (userData?.workshopId) {
        const workshopData = await fetchWorkshopData(userData.workshopId, token);
        setWorkshop(workshopData);
      }
    } catch (error) {
      const uiMessage = getUserFacingErrorMessage(
        error,
        'Nao foi possivel atualizar os dados da oficina.',
      );
      setAuthError(uiMessage);
      throw error;
    }
  }, [user, fetchUserData, fetchWorkshopData]);

  const value = useMemo(() => ({
    user,
    workshop,
    authError,
    isLoading: isLoading || isInitializing || isFetchingSession,
    login,
    logout,
    refreshWorkshop,
    clearAuthError,
    isAuthenticated: !!user,
  }), [user, workshop, authError, isLoading, isInitializing, login, logout, refreshWorkshop, clearAuthError]);

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
      {authError ? (
        <div className="fixed left-4 right-4 top-4 z-[120] rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-lg sm:left-auto sm:right-4 sm:w-[32rem]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">Atencao na sessao</p>
              <p className="mt-1 text-sm text-amber-800">{authError}</p>
            </div>
            <button
              type="button"
              onClick={clearAuthError}
              className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-amber-900"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}
      {children}
    </AuthContext.Provider>
  );
}
