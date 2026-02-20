import { Image as RNImage } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const DEFAULT_MAX_DIMENSION = 1200;
const DEFAULT_JPEG_QUALITY = 0.7;

interface CompressOptions {
  maxDimension?: number;
  quality?: number;
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

export async function compressPhoto(uri: string, options?: CompressOptions): Promise<string> {
  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options?.quality ?? DEFAULT_JPEG_QUALITY;

  try {
    const { width, height } = await getImageSize(uri);
    const needsResize = width > maxDimension || height > maxDimension;

    const context = ImageManipulator.manipulate(uri);

    if (needsResize) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      context.resize({
        width: Math.round(width * ratio),
        height: Math.round(height * ratio),
      });
    }

    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: quality });
    context.release();

    return saved.uri;
  } catch {
    return uri;
  }
}
