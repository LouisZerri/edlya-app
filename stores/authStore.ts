import { create } from 'zustand';
import { User } from '../types';
import { getToken, setToken, getUser, setUser, clearAuth } from '../utils/storage';
import { API_URL } from '../utils/constants';

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
        set({ token, user, isAuthenticated: true, isLoading: false });
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
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Identifiants incorrects');
    }

    const { token } = await response.json();
    await setToken(token);
    set({ token, isAuthenticated: true });

    await get().fetchUser();
  },

  register: async (data: RegisterData) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
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
    await clearAuth();
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    const { token } = get();
    if (!token) return;

    const response = await fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (response.ok) {
      const user = await response.json();
      await setUser(user);
      set({ user });
    }
  },

  updateProfile: async (data: { name: string; telephone?: string }) => {
    const { token, user } = get();
    if (!token) throw new Error('Non authentifié');

    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
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
