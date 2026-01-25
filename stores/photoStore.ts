import { create } from 'zustand';
import { LocalPhoto, PhotoUploadStatus } from '../types';

interface PhotoStore {
  // Photos par elementId
  photosByElement: Record<string, LocalPhoto[]>;

  // Queue d'upload
  uploadQueue: string[]; // IDs des photos en attente
  isUploading: boolean;

  // Actions
  addPhoto: (elementId: string, photo: LocalPhoto) => void;
  removePhoto: (elementId: string, photoId: string) => void;
  updatePhoto: (elementId: string, photoId: string, updates: Partial<LocalPhoto>) => void;
  updateUploadProgress: (elementId: string, photoId: string, progress: number) => void;
  setUploadStatus: (elementId: string, photoId: string, status: PhotoUploadStatus, errorMessage?: string) => void;
  reorderPhotos: (elementId: string, photos: LocalPhoto[]) => void;
  getPhotosForElement: (elementId: string) => LocalPhoto[];
  initPhotosForElement: (elementId: string, photos: LocalPhoto[]) => void;
  clearPhotosForElement: (elementId: string) => void;

  // Upload queue management
  addToUploadQueue: (photoId: string) => void;
  removeFromUploadQueue: (photoId: string) => void;
  setIsUploading: (uploading: boolean) => void;

  // Get pending uploads for an element
  getPendingUploads: (elementId: string) => LocalPhoto[];
}

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photosByElement: {},
  uploadQueue: [],
  isUploading: false,

  addPhoto: (elementId, photo) => {
    set(state => {
      const currentPhotos = state.photosByElement[elementId] || [];
      return {
        photosByElement: {
          ...state.photosByElement,
          [elementId]: [...currentPhotos, photo],
        },
      };
    });
  },

  removePhoto: (elementId, photoId) => {
    set(state => {
      const currentPhotos = state.photosByElement[elementId] || [];
      const filteredPhotos = currentPhotos.filter(p => p.id !== photoId);
      // Reorder remaining photos
      const reorderedPhotos = filteredPhotos.map((p, index) => ({
        ...p,
        ordre: index + 1,
      }));
      return {
        photosByElement: {
          ...state.photosByElement,
          [elementId]: reorderedPhotos,
        },
        uploadQueue: state.uploadQueue.filter(id => id !== photoId),
      };
    });
  },

  updatePhoto: (elementId, photoId, updates) => {
    set(state => {
      const currentPhotos = state.photosByElement[elementId] || [];
      const updatedPhotos = currentPhotos.map(p =>
        p.id === photoId ? { ...p, ...updates } : p
      );
      return {
        photosByElement: {
          ...state.photosByElement,
          [elementId]: updatedPhotos,
        },
      };
    });
  },

  updateUploadProgress: (elementId, photoId, progress) => {
    get().updatePhoto(elementId, photoId, { uploadProgress: progress });
  },

  setUploadStatus: (elementId, photoId, status, errorMessage) => {
    get().updatePhoto(elementId, photoId, {
      uploadStatus: status,
      errorMessage: status === 'error' ? errorMessage : undefined,
      uploadProgress: status === 'uploaded' ? 100 : undefined,
    });
  },

  reorderPhotos: (elementId, photos) => {
    set(state => ({
      photosByElement: {
        ...state.photosByElement,
        [elementId]: photos.map((p, index) => ({ ...p, ordre: index + 1 })),
      },
    }));
  },

  getPhotosForElement: (elementId) => {
    return get().photosByElement[elementId] || [];
  },

  initPhotosForElement: (elementId, photos) => {
    set(state => ({
      photosByElement: {
        ...state.photosByElement,
        [elementId]: photos,
      },
    }));
  },

  clearPhotosForElement: (elementId) => {
    set(state => {
      const { [elementId]: _, ...rest } = state.photosByElement;
      return { photosByElement: rest };
    });
  },

  addToUploadQueue: (photoId) => {
    set(state => ({
      uploadQueue: [...state.uploadQueue, photoId],
    }));
  },

  removeFromUploadQueue: (photoId) => {
    set(state => ({
      uploadQueue: state.uploadQueue.filter(id => id !== photoId),
    }));
  },

  setIsUploading: (uploading) => {
    set({ isUploading: uploading });
  },

  getPendingUploads: (elementId) => {
    const photos = get().photosByElement[elementId] || [];
    return photos.filter(p => p.uploadStatus === 'pending' || p.uploadStatus === 'error');
  },
}));
