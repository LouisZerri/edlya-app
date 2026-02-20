import { usePhotoQueueStore, QueuedPhoto } from '../stores/photoQueueStore';
import { deletePersistedPhoto, getPersistedPhotoPath } from './photoFileManager';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { API_URL } from '../utils/constants';

const MAX_RETRIES = 3;

interface UploadResult {
  success: boolean;
  detail?: string;
}

async function uploadQueuedPhoto(photo: QueuedPhoto, token: string): Promise<UploadResult> {
  // Verify the file still exists on disk
  const filePath = await getPersistedPhotoPath(photo.id);
  if (!filePath) {
    return { success: false, detail: `Fichier introuvable pour ${photo.id}` };
  }

  const numericId = photo.elementId.includes('/')
    ? photo.elementId.split('/').pop()
    : photo.elementId;

  const endpoint = photo.uploadType === 'compteur'
    ? `${API_URL}/upload/compteur-photo`
    : `${API_URL}/upload/photo`;
  const idField = photo.uploadType === 'compteur' ? 'compteur_id' : 'element_id';

  const formData = new FormData();
  formData.append(idField, numericId || photo.elementId);
  formData.append('photo', {
    uri: filePath,
    name: `photo_${photo.id}.jpg`,
    type: 'image/jpeg',
  } as any);

  if (photo.legende) formData.append('legende', photo.legende);
  if (photo.latitude !== undefined) formData.append('latitude', photo.latitude.toString());
  if (photo.longitude !== undefined) formData.append('longitude', photo.longitude.toString());
  formData.append('ordre', photo.ordre.toString());

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (response.ok) {
      return { success: true };
    }

    const text = await response.text().catch(() => '');
    return { success: false, detail: `HTTP ${response.status}: ${text.substring(0, 150)}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, detail: `Fetch error: ${msg}` };
  }
}

export async function processPhotoQueue(): Promise<void> {
  const { token } = useAuthStore.getState();
  if (!token) return;

  const store = usePhotoQueueStore.getState();
  const pending = store.getPending();

  if (pending.length === 0) return;

  let successCount = 0;

  for (const photo of pending) {
    store.updateStatus(photo.id, 'uploading');

    const result = await uploadQueuedPhoto(photo, token);

    if (result.success) {
      store.removeFromQueue(photo.id);
      await deletePersistedPhoto(photo.id);
      successCount++;
    } else {
      const newRetryCount = photo.retryCount + 1;
      store.updateStatus(photo.id, 'failed', newRetryCount);
      useToastStore.getState().error(`Photo échouée: ${result.detail}`);
    }
  }

  if (successCount > 0) {
    useToastStore.getState().success(`${successCount} photo(s) synchronisée(s)`);
  }
}
