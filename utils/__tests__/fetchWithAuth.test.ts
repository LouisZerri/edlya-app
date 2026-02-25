import { fetchWithAuth } from '../fetchWithAuth';

// Mock storage
jest.mock('../storage', () => ({
  getToken: jest.fn(),
}));
import { getToken } from '../storage';
const mockGetToken = jest.mocked(getToken);

// Mock authStore (import dynamique dans fetchWithAuth)
const mockLogout = jest.fn();
jest.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ logout: mockLogout }),
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  mockLogout.mockResolvedValue(undefined);
});

describe('fetchWithAuth', () => {
  it('injecte le header Authorization si un token existe', async () => {
    mockGetToken.mockResolvedValue('my-jwt-token');
    mockFetch.mockResolvedValue({ status: 200 } as Response);

    await fetchWithAuth('https://api.test/me');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-jwt-token',
        }),
      }),
    );
  });

  it('n\'injecte pas Authorization si pas de token', async () => {
    mockGetToken.mockResolvedValue(null);
    mockFetch.mockResolvedValue({ status: 200 } as Response);

    await fetchWithAuth('https://api.test/me');

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBeUndefined();
  });

  it('merge les headers custom avec Authorization', async () => {
    mockGetToken.mockResolvedValue('tok');
    mockFetch.mockResolvedValue({ status: 200 } as Response);

    await fetchWithAuth('https://api.test/data', {
      headers: { 'Content-Type': 'application/json' },
    });

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer tok',
    });
  });

  it('retourne la Response si status != 401', async () => {
    mockGetToken.mockResolvedValue('tok');
    const mockResponse = { status: 200 } as Response;
    mockFetch.mockResolvedValue(mockResponse);

    const result = await fetchWithAuth('https://api.test/me');

    expect(result).toBe(mockResponse);
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('appelle logout et throw sur 401', async () => {
    mockGetToken.mockResolvedValue('expired-token');
    mockFetch.mockResolvedValue({ status: 401 } as Response);

    await expect(fetchWithAuth('https://api.test/me'))
      .rejects
      .toThrow('Session expirée, veuillez vous reconnecter');

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('passe les options (method, body) au fetch', async () => {
    mockGetToken.mockResolvedValue('tok');
    mockFetch.mockResolvedValue({ status: 200 } as Response);

    await fetchWithAuth('https://api.test/data', {
      method: 'POST',
      body: '{"key":"value"}',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test/data',
      expect.objectContaining({
        method: 'POST',
        body: '{"key":"value"}',
      }),
    );
  });

  it('ne catch pas les erreurs reseau (les propage)', async () => {
    mockGetToken.mockResolvedValue('tok');
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    await expect(fetchWithAuth('https://api.test/me'))
      .rejects
      .toThrow('Network request failed');

    expect(mockLogout).not.toHaveBeenCalled();
  });
});
