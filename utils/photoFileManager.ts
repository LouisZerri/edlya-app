import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  deleteAsync,
} from 'expo-file-system/legacy';

const PHOTO_DIR = `${documentDirectory}edlya_photos/`;

async function ensureDir(): Promise<void> {
  const info = await getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export async function persistPhoto(tempUri: string, photoId: string): Promise<string> {
  await ensureDir();
  const ext = tempUri.split('.').pop()?.split('?')[0] || 'jpg';
  const destPath = `${PHOTO_DIR}${photoId}.${ext}`;
  await copyAsync({ from: tempUri, to: destPath });
  return destPath;
}

export async function deletePersistedPhoto(photoId: string): Promise<void> {
  try {
    for (const ext of ['jpg', 'jpeg', 'png']) {
      const path = `${PHOTO_DIR}${photoId}.${ext}`;
      const info = await getInfoAsync(path);
      if (info.exists) {
        await deleteAsync(path, { idempotent: true });
        return;
      }
    }
  } catch {
    // silently fail
  }
}

export async function getPersistedPhotoPath(photoId: string): Promise<string | null> {
  for (const ext of ['jpg', 'jpeg', 'png']) {
    const path = `${PHOTO_DIR}${photoId}.${ext}`;
    const info = await getInfoAsync(path);
    if (info.exists) return path;
  }
  return null;
}
