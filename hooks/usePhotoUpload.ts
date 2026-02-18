import { useCallback, useState } from 'react';
import { Image as RNImage } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useAuthStore } from '../stores/authStore';
import { usePhotoStore } from '../stores/photoStore';
import { useToastStore } from '../stores/toastStore';
import { LocalPhoto } from '../types';
import { API_URL } from '../utils/constants';

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.7;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

async function compressPhoto(uri: string): Promise<string> {
  try {
    const { width, height } = await getImageSize(uri);
    const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;

    const context = ImageManipulator.manipulate(uri);

    if (needsResize) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      context.resize({
        width: Math.round(width * ratio),
        height: Math.round(height * ratio),
      });
    }

    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    context.release();

    return saved.uri;
  } catch (err) {
    return uri;
  }
}

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

      // Compress photo before upload
      const compressedUri = await compressPhoto(photo.localUri);

      // Create FormData
      const formData = new FormData();
      formData.append(idField, numericId || entityId);

      formData.append('photo', {
        uri: compressedUri,
        name: `photo_${photo.id}.jpg`,
        type: 'image/jpeg',
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
        success('Photo uploadée');
        return result;
      } else {
        setUploadStatus(entityId, photo.id, 'error', result.error);
        return result;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur upload';
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
