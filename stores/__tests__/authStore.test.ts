import { useAuthStore } from '../authStore';
import * as storage from '../../utils/storage';
import { mockUser } from '../../__fixtures__/user';

// Mock storage
jest.mock('../../utils/storage');
const mockedStorage = jest.mocked(storage);

// Mock fetchWithAuth — il appelle global.fetch en interne,
// mais on le mock directement pour isoler les tests authStore
jest.mock('../../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}));
import { fetchWithAuth } from '../../utils/fetchWithAuth';
const mockFetchWithAuth = jest.mocked(fetchWithAuth);

// Mock global fetch (utilisé par initialize, login, register qui n'utilisent PAS fetchWithAuth)
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Reset store entre chaque test
function resetStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });
}

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
});

describe('authStore', () => {
  describe('initialize', () => {
    it('charge token+user depuis storage + /me OK => isAuthenticated=true', async () => {
      mockedStorage.getToken.mockResolvedValue('valid-token');
      mockedStorage.getUser.mockResolvedValue(mockUser);
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockUser) });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.token).toBe('valid-token');
      expect(state.user).toEqual(mockUser);
    });

    it('pas de token => isLoading=false, isAuthenticated=false', async () => {
      mockedStorage.getToken.mockResolvedValue(null);
      mockedStorage.getUser.mockResolvedValue(null);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    it('token valide => /me met a jour user depuis serveur', async () => {
      const freshUser = { ...mockUser, name: 'Jean MAJ' };
      mockedStorage.getToken.mockResolvedValue('valid-token');
      mockedStorage.getUser.mockResolvedValue(mockUser);
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(freshUser) });

      await useAuthStore.getState().initialize();

      expect(mockedStorage.setUser).toHaveBeenCalledWith(freshUser);
      expect(useAuthStore.getState().user).toEqual(freshUser);
    });

    it('token invalide (401) => deconnexion, isAuthenticated=false', async () => {
      mockedStorage.getToken.mockResolvedValue('expired-token');
      mockedStorage.getUser.mockResolvedValue(mockUser);
      mockFetch.mockResolvedValue({ ok: false, status: 401 });

      await useAuthStore.getState().initialize();

      expect(mockedStorage.clearAuth).toHaveBeenCalled();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('erreur serveur (500) => utilise le cache (mode degradé)', async () => {
      mockedStorage.getToken.mockResolvedValue('valid-token');
      mockedStorage.getUser.mockResolvedValue(mockUser);
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
    });

    it('erreur reseau => utilise le cache (mode offline)', async () => {
      mockedStorage.getToken.mockResolvedValue('valid-token');
      mockedStorage.getUser.mockResolvedValue(mockUser);
      mockFetch.mockRejectedValue(new TypeError('Network request failed'));

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('POST /login, stocke token, appelle fetchUser', async () => {
      // login response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'new-token' }),
      });
      // fetchUser uses fetchWithAuth
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      } as Response);

      await useAuthStore.getState().login('jean@test.fr', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(mockedStorage.setToken).toHaveBeenCalledWith('new-token');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('erreur serveur => throw avec message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Email inconnu' }),
      });

      await expect(
        useAuthStore.getState().login('bad@test.fr', 'wrong'),
      ).rejects.toThrow('Email inconnu');
    });

    it('login ok mais fetchUser 401 => logout via fetchWithAuth', async () => {
      // login response OK
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'new-token' }),
      });
      // fetchUser: fetchWithAuth throws on 401
      mockFetchWithAuth.mockRejectedValueOnce(
        new Error('Session expirée, veuillez vous reconnecter'),
      );

      // login devrait throw car fetchUser echoue
      await expect(
        useAuthStore.getState().login('jean@test.fr', 'pass'),
      ).rejects.toThrow('Session expirée');
    });
  });

  describe('register', () => {
    it('si token retourne => utilise directement', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'reg-token' }),
      });
      // fetchUser after register
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      } as Response);

      await useAuthStore.getState().register({
        email: 'jean@test.fr',
        password: 'pass',
        name: 'Jean',
      });

      expect(mockedStorage.setToken).toHaveBeenCalledWith('reg-token');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('si pas de token => auto-login avec email/password', async () => {
      // register response (sans token)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      // login response (auto-login)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'auto-token' }),
      });
      // fetchUser
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      } as Response);

      await useAuthStore.getState().register({
        email: 'jean@test.fr',
        password: 'pass',
        name: 'Jean',
      });

      // register + login = 2 fetch calls, fetchUser = 1 fetchWithAuth call
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetchWithAuth).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('erreur serveur register => throw avec message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Email d\u00e9j\u00e0 utilis\u00e9' }),
      });

      await expect(
        useAuthStore.getState().register({
          email: 'jean@test.fr',
          password: 'pass',
          name: 'Jean',
        }),
      ).rejects.toThrow('Email d\u00e9j\u00e0 utilis\u00e9');
    });
  });

  describe('logout', () => {
    it('clearAuth + reset state', async () => {
      useAuthStore.setState({ user: mockUser, token: 'tok', isAuthenticated: true });

      await useAuthStore.getState().logout();

      expect(mockedStorage.clearAuth).toHaveBeenCalled();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('fetchUser', () => {
    it('utilise fetchWithAuth pour GET /me', async () => {
      useAuthStore.setState({ token: 'tok', isAuthenticated: true });
      mockFetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      } as Response);

      await useAuthStore.getState().fetchUser();

      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/me'),
      );
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('ne fait rien si pas de token', async () => {
      useAuthStore.setState({ token: null });

      await useAuthStore.getState().fetchUser();

      expect(mockFetchWithAuth).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('throw si non authentifie', async () => {
      useAuthStore.setState({ token: null });

      await expect(
        useAuthStore.getState().updateProfile({ name: 'Nouveau' }),
      ).rejects.toThrow('Non authentifi\u00e9');
    });

    it('PUT /profile via fetchWithAuth, update local', async () => {
      useAuthStore.setState({ user: mockUser, token: 'tok', isAuthenticated: true });
      mockFetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await useAuthStore.getState().updateProfile({ name: 'Jean MAJ', telephone: '0699999999' });

      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/profile'),
        expect.objectContaining({ method: 'PUT' }),
      );
      expect(useAuthStore.getState().user?.name).toBe('Jean MAJ');
      expect(mockedStorage.setUser).toHaveBeenCalled();
    });
  });
});
