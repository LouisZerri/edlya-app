import { useCallback, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePhotoStore } from '../stores/photoStore';
import { useToastStore } from '../stores/toastStore';
import { LocalPhoto } from '../types';
import { API_URL } from '../utils/constants';

type UploadType = 'element' | 'compteur';

interface PhotoUploadResult {
  success: boolean;
  remoteId?: string;
  remoteUrl?: string;
  error?: string;
}

interface UsePhotoUploadReturn {
  isUploading: boolean;
  uploadPhoto: (entityId: string, photo: LocalPhoto, type?: UploadType) => Promise<PhotoUploadResult>;
  uploadAllPending: (entityId: string, type?: UploadType) => Promise<void>;
  retryFailed: (entityId: string, photoId: string, type?: UploadType) => Promise<PhotoUploadResult>;
}

export function usePhotoUpload(): UsePhotoUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const token = useAuthStore(state => state.token);
  const { updateUploadProgress, setUploadStatus, getPhotosForElement } = usePhotoStore();
  const { success, error: showError } = useToastStore();

  const uploadPhoto = useCallback(async (
    entityId: string,
    photo: LocalPhoto,
    type: UploadType = 'element'
  ): Promise<PhotoUploadResult> => {
    if (!token) {
      return { success: false, error: 'Non authentifie' };
    }

    try {
      setUploadStatus(entityId, photo.id, 'uploading');
      updateUploadProgress(entityId, photo.id, 0);

      // Extract numeric ID from IRI (e.g., "/api/elements/123" -> "123")
      const numericId = entityId.includes('/')
        ? entityId.split('/').pop()
        : entityId;

      // Determine endpoint and ID field based on type
      const endpoint = type === 'compteur'
        ? `${API_URL}/upload/compteur-photo`
        : `${API_URL}/upload/photo`;
      const idField = type === 'compteur' ? 'compteur_id' : 'element_id';

      // Create FormData
      const formData = new FormData();
      formData.append(idField, numericId || entityId);

      // Get file extension and mime type
      const uriParts = photo.localUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';

      formData.append('photo', {
        uri: photo.localUri,
        name: `photo_${photo.id}.${fileType}`,
        type: mimeType,
      } as any);

      if (photo.legende) {
        formData.append('legende', photo.legende);
      }
      if (photo.latitude !== undefined) {
        formData.append('latitude', photo.latitude.toString());
      }
      if (photo.longitude !== undefined) {
        formData.append('longitude', photo.longitude.toString());
      }
      formData.append('ordre', photo.ordre.toString());

      // Use XMLHttpRequest for progress tracking
      const result = await new Promise<PhotoUploadResult>((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            updateUploadProgress(entityId, photo.id, progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({
                success: true,
                remoteId: response.id,
                remoteUrl: response.chemin || response.url,
              });
            } catch {
              resolve({
                success: true,
                remoteId: undefined,
                remoteUrl: undefined,
              });
            }
          } else {
            resolve({
              success: false,
              error: `Erreur serveur: ${xhr.status}`,
            });
          }
        };

        xhr.onerror = () => {
          resolve({
            success: false,
            error: 'Erreur reseau',
          });
        };

        xhr.open('POST', endpoint);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      if (result.success) {
        setUploadStatus(entityId, photo.id, 'uploaded');
        success('Photo uploadee');
        return result;
      } else {
        setUploadStatus(entityId, photo.id, 'error', result.error);
        return result;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur upload';
      setUploadStatus(entityId, photo.id, 'error', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [token, updateUploadProgress, setUploadStatus, success]);

  const uploadAllPending = useCallback(async (entityId: string, type: UploadType = 'element') => {
    setIsUploading(true);

    const photos = getPhotosForElement(entityId);
    const pendingPhotos = photos.filter(p =>
      p.uploadStatus === 'pending' || p.uploadStatus === 'error'
    );

    for (const photo of pendingPhotos) {
      await uploadPhoto(entityId, photo, type);
    }

    setIsUploading(false);
  }, [getPhotosForElement, uploadPhoto]);

  const retryFailed = useCallback(async (
    entityId: string,
    photoId: string,
    type: UploadType = 'element'
  ): Promise<PhotoUploadResult> => {
    const photos = getPhotosForElement(entityId);
    const photo = photos.find(p => p.id === photoId);

    if (!photo) {
      return { success: false, error: 'Photo non trouvee' };
    }

    return uploadPhoto(entityId, photo, type);
  }, [getPhotosForElement, uploadPhoto]);

  return {
    isUploading,
    uploadPhoto,
    uploadAllPending,
    retryFailed,
  };
}
