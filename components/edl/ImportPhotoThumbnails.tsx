import { View, Image } from 'react-native';
import { getImportPhotoUrl } from '../../hooks/usePdfImport';

interface ImportPhotoThumbnailsProps {
  photoIndices: number[];
  importId: string;
  token: string | null;
}

export function ImportPhotoThumbnails({ photoIndices, importId, token }: ImportPhotoThumbnailsProps) {
  if (!photoIndices || photoIndices.length === 0 || !importId) return null;

  return (
    <View className="flex-row flex-wrap mt-1.5 gap-1">
      {photoIndices.map((photoIdx: number) => (
        <Image
          key={photoIdx}
          source={{
            uri: getImportPhotoUrl(importId, photoIdx, true),
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }}
          className="w-16 h-16 rounded-lg"
          resizeMode="cover"
        />
      ))}
    </View>
  );
}
