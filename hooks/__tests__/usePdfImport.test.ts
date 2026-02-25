import { renderHook, act } from '@testing-library/react-native';
import { usePdfImport } from '../usePdfImport';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';

// Mock fetchWithTimeout
jest.mock('../../utils/fetchWithTimeout', () => ({
  fetchWithTimeout: jest.fn(),
}));
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
const mockFetchWithTimeout = jest.mocked(fetchWithTimeout);

// Mock fetchWithAuth
jest.mock('../../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}));
import { fetchWithAuth } from '../../utils/fetchWithAuth';

// Mock appendFile
jest.mock('../../utils/formData', () => ({
  appendFile: jest.fn(),
}));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  useAuthStore.setState({ token: 'test-token', isAuthenticated: true });
  useToastStore.setState({ toasts: [] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('usePdfImport', () => {
  describe('importPdf', () => {
    it('retourne null si pas de token', async () => {
      useAuthStore.setState({ token: null });

      const { result } = renderHook(() => usePdfImport());

      let response: unknown;
      await act(async () => {
        response = await result.current.importPdf('file:///test.pdf', 'test.pdf');
      });

      expect(response).toBeNull();
      expect(mockFetchWithTimeout).not.toHaveBeenCalled();
    });

    it('POST FormData avec fetchWithAuth comme fetchFn', async () => {
      mockFetchWithTimeout.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, donnees_extraites: {}, import_id: 'imp-1' }),
      } as Response);

      const { result } = renderHook(() => usePdfImport());

      await act(async () => {
        await result.current.importPdf('file:///test.pdf', 'test.pdf');
      });

      expect(mockFetchWithTimeout).toHaveBeenCalledWith(
        expect.stringContaining('/ai/import-pdf'),
        expect.objectContaining({
          method: 'POST',
        }),
        120_000,
        fetchWithAuth,
      );
    });

    it('retourne les donnees si succes', async () => {
      const mockData = {
        success: true,
        donnees_extraites: { type_edl: 'entree' },
        import_id: 'imp-1',
      };
      mockFetchWithTimeout.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const { result } = renderHook(() => usePdfImport());

      let response: unknown;
      await act(async () => {
        response = await result.current.importPdf('file:///test.pdf', 'test.pdf');
      });

      expect(response).toEqual(mockData);
    });

    it('toast erreur + retourne null si echec reseau', async () => {
      mockFetchWithTimeout.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePdfImport());

      let response: unknown;
      await act(async () => {
        response = await result.current.importPdf('file:///test.pdf', 'test.pdf');
      });

      expect(response).toBeNull();
      // Toast erreur emis
      const toasts = useToastStore.getState().toasts;
      expect(toasts.some(t => t.type === 'error')).toBe(true);
    });

    it('toggle isImporting (true pendant, false apres)', async () => {
      let resolvePromise: (v: Response) => void;
      mockFetchWithTimeout.mockReturnValue(
        new Promise(resolve => { resolvePromise = resolve; }),
      );

      const { result } = renderHook(() => usePdfImport());

      expect(result.current.isImporting).toBe(false);

      let importPromise: Promise<unknown>;
      act(() => {
        importPromise = result.current.importPdf('file:///test.pdf', 'test.pdf');
      });

      // Pendant le fetch, isImporting est true
      expect(result.current.isImporting).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response);
        await importPromise;
      });

      expect(result.current.isImporting).toBe(false);
    });
  });

  describe('createEdlFromData', () => {
    it('retourne null si pas de token', async () => {
      useAuthStore.setState({ token: null });

      const { result } = renderHook(() => usePdfImport());

      let response: unknown;
      await act(async () => {
        response = await result.current.createEdlFromData({}, '1');
      });

      expect(response).toBeNull();
    });

    it('gere erreur 410 avec message specifique photos expirees', async () => {
      mockFetchWithTimeout.mockResolvedValue({
        ok: false,
        status: 410,
        text: () => Promise.resolve('Gone'),
      } as Response);

      const { result } = renderHook(() => usePdfImport());

      let response: unknown;
      await act(async () => {
        response = await result.current.createEdlFromData({}, '1', 'imp-1');
      });

      expect(response).toBeNull();
      const toasts = useToastStore.getState().toasts;
      expect(toasts.some(t => t.message.includes('expir'))).toBe(true);
    });

    it('extrait ID numerique d un IRI (/api/logements/5 => 5)', async () => {
      mockFetchWithTimeout.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, edl: { id: 99 } }),
      } as Response);

      const { result } = renderHook(() => usePdfImport());

      await act(async () => {
        await result.current.createEdlFromData({}, '/api/logements/5');
      });

      // Verifie que le body envoye contient logement_id: "5"
      const callArgs = mockFetchWithTimeout.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.logement_id).toBe('5');
    });

    it('retourne le resultat si succes', async () => {
      const mockResult = {
        success: true,
        edl: { id: 42, type: 'entree', statut: 'brouillon', locataireNom: 'Jean', nbPieces: 3 },
      };
      mockFetchWithTimeout.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResult),
      } as Response);

      const { result } = renderHook(() => usePdfImport());

      let response: unknown;
      await act(async () => {
        response = await result.current.createEdlFromData(
          { type_edl: 'entree' },
          '1',
          'imp-1',
        );
      });

      expect(response).toEqual(mockResult);
    });

    it('gere erreur serveur non-410', async () => {
      mockFetchWithTimeout.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({ message: 'Erreur interne' })),
      } as Response);

      const { result } = renderHook(() => usePdfImport());

      let response: unknown;
      await act(async () => {
        response = await result.current.createEdlFromData({}, '1');
      });

      expect(response).toBeNull();
      const toasts = useToastStore.getState().toasts;
      expect(toasts.some(t => t.message === 'Erreur interne')).toBe(true);
    });

    it('envoie import_id dans le body si fourni', async () => {
      mockFetchWithTimeout.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const { result } = renderHook(() => usePdfImport());

      await act(async () => {
        await result.current.createEdlFromData({}, '1', 'imp-42');
      });

      const callArgs = mockFetchWithTimeout.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.import_id).toBe('imp-42');
    });

    it('omet import_id du body si non fourni', async () => {
      mockFetchWithTimeout.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const { result } = renderHook(() => usePdfImport());

      await act(async () => {
        await result.current.createEdlFromData({}, '1');
      });

      const callArgs = mockFetchWithTimeout.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.import_id).toBeUndefined();
    });

    it('passe fetchWithAuth comme fetchFn a fetchWithTimeout', async () => {
      mockFetchWithTimeout.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const { result } = renderHook(() => usePdfImport());

      await act(async () => {
        await result.current.createEdlFromData({}, '1');
      });

      expect(mockFetchWithTimeout).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        120_000,
        fetchWithAuth,
      );
    });
  });
});
