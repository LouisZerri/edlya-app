import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedPhoto {
  id: string;
  elementId: string;
  localPath: string;
  uploadType: 'element' | 'compteur';
  legende?: string;
  latitude?: number;
  longitude?: number;
  ordre: number;
  status: 'pending' | 'uploading' | 'failed';
  retryCount: number;
}

interface PhotoQueueStore {
  queue: QueuedPhoto[];
  addToQueue: (photo: Omit<QueuedPhoto, 'status' | 'retryCount'>) => void;
  removeFromQueue: (id: string) => void;
  updateStatus: (id: string, status: QueuedPhoto['status'], retryCount?: number) => void;
  getPending: () => QueuedPhoto[];
  getQueueLength: () => number;
  clearQueue: () => void;
}

export const usePhotoQueueStore = create<PhotoQueueStore>()(
  persist(
    (set, get) => ({
      queue: [],

      addToQueue: (photo) => {
        set(state => ({
          queue: [...state.queue, { ...photo, status: 'pending', retryCount: 0 }],
        }));
      },

      removeFromQueue: (id) => {
        set(state => ({
          queue: state.queue.filter(p => p.id !== id),
        }));
      },

      updateStatus: (id, status, retryCount) => {
        set(state => ({
          queue: state.queue.map(p =>
            p.id === id
              ? { ...p, status, ...(retryCount !== undefined ? { retryCount } : {}) }
              : p
          ),
        }));
      },

      getPending: () => {
        return get().queue.filter(p => p.status === 'pending' || p.status === 'failed');
      },

      getQueueLength: () => get().queue.length,

      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'photo_upload_queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
