import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { X, AlertCircle, RotateCcw } from 'lucide-react-native';
import { LocalPhoto } from '../../types';
import { COLORS } from '../../utils/constants';

type ThumbnailSize = 'small' | 'medium' | 'large';

const SIZES: Record<ThumbnailSize, number> = {
  small: 64,
  medium: 96,
  large: 120,
};

interface PhotoThumbnailProps {
  photo: LocalPhoto;
  index: number;
  size?: ThumbnailSize;
  onPress?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
  showBadge?: boolean;
}

export function PhotoThumbnail({
  photo,
  index,
  size = 'medium',
  onPress,
  onDelete,
  onRetry,
  showBadge = true,
}: PhotoThumbnailProps) {
  const dimension = SIZES[size];
  const isUploading = photo.uploadStatus === 'uploading';
  const hasError = photo.uploadStatus === 'error';
  const progress = photo.uploadProgress ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, { width: dimension, height: dimension }]}
    >
      <Image
        source={{ uri: photo.localUri }}
        style={[styles.image, { width: dimension, height: dimension }]}
        resizeMode="cover"
      />

      {/* Badge numero */}
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </View>
      )}

      {/* Bouton supprimer */}
      {onDelete && !isUploading && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <X size={12} color="white" />
        </TouchableOpacity>
      )}

      {/* Overlay upload en cours */}
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="small" color="white" />
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      )}

      {/* Overlay erreur */}
      {hasError && (
        <TouchableOpacity
          style={styles.errorOverlay}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <AlertCircle size={20} color={COLORS.red[500]} />
          {onRetry && (
            <View style={styles.retryButton}>
              <RotateCcw size={12} color="white" />
            </View>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    position: 'relative',
    backgroundColor: COLORS.gray[100],
  },
  image: {
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.red[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    marginTop: 4,
    backgroundColor: COLORS.primary[600],
    borderRadius: 8,
    padding: 4,
  },
});
