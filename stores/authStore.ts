import { create } from 'zustand';
import type { User } from '../types';
import { getToken, setToken, setRefreshToken, getUser, setUser, clearAuth } from '../utils/storage';
import { API_URL } from '../utils/constants';
import { fetchWithAuth } from '../utils/fetchWithAuth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (data: { name: string; telephone?: string }) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  telephone?: string;
  role?: string;
  entreprise?: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const [token, user] = await Promise.all([
        getToken(),
        getUser<User>(),
      ]);

      if (token && user) {
        // Vérifier que le token est encore valide AVANT de déverrouiller l'app
        try {
          const res = await fetch(`${API_URL}/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              ...(__DEV__ ? { 'ngrok-skip-browser-warning': 'true' } : {}),
            },
          });

          if (res.ok) {
            const freshUser = await res.json();
            await setUser(freshUser);
            set({ token, user: freshUser, isAuthenticated: true, isLoading: false });
          } else if (res.status === 401) {
            await clearAuth();
            set({ isLoading: false });
          } else {
            // Serveur en erreur mais token peut-être valide → utiliser le cache
            set({ token, user, isAuthenticated: true, isLoading: false });
          }
        } catch {
          // Réseau indisponible → utiliser le cache (mode offline)
          set({ token, user, isAuthenticated: true, isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(__DEV__ ? { 'ngrok-skip-browser-warning': 'true' } : {}),
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Email ou mot de passe incorrect');
    }

    const data = await response.json();
    await setToken(data.token);
    if (data.refresh_token) {
      await setRefreshToken(data.refresh_token);
    }
    set({ token: data.token, isAuthenticated: true });

    await get().fetchUser();
  },

  register: async (data: RegisterData) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(__DEV__ ? { 'ngrok-skip-browser-warning': 'true' } : {}),
      },
      body: JSON.stringify({
        ...data,
        role: data.role || 'bailleur',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }

    const result = await response.json();

    // Si l'API renvoie un token, l'utiliser directement
    if (result.token) {
      await setToken(result.token);
      set({ token: result.token, isAuthenticated: true });
      await get().fetchUser();
    } else {
      // Sinon, se connecter automatiquement après l'inscription
      await get().login(data.email, data.password);
    }
  },

  logout: async () => {
    const { clearAllLocalData } = await import('../utils/storage');
    await clearAllLocalData();
    // Vider le cache Apollo
    try {
      const { apolloClient } = await import('../graphql/client');
      await apolloClient.clearStore();
    } catch {
      // Ignorer si le client n'est pas initialisé
    }
    // Vider la queue de photos
    try {
      const { usePhotoQueueStore } = await import('./photoQueueStore');
      usePhotoQueueStore.getState().clearQueue();
    } catch {
      // Ignorer
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) return;

    const response = await fetchWithAuth(`${API_URL}/me`);

    if (response.ok) {
      const user = await response.json();
      await setUser(user);
      set({ user });
    }
    // Le 401 est géré par fetchWithAuth (logout automatique)
  },

  updateProfile: async (data: { name: string; telephone?: string }) => {
    const { token, user } = get();
    if (!token) throw new Error('Non authentifié');

    const response = await fetchWithAuth(`${API_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour du profil');
    }

    const updatedUser = { ...user, ...data } as User;
    await setUser(updatedUser);
    set({ user: updatedUser });
  },
}));
