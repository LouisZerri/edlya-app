import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Plus } from 'lucide-react-native';
import { LocalPhoto } from '../../types';
import { COLORS } from '../../utils/constants';
import { PhotoThumbnail } from './PhotoThumbnail';
import { PhotoViewer } from './PhotoViewer';
import { useLocation } from '../../hooks/useLocation';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';

type ThumbnailSize = 'small' | 'medium' | 'large';
type LayoutType = 'scroll' | 'grid';

const SIZES: Record<ThumbnailSize, number> = {
  small: 64,
  medium: 96,
  large: 120,
};

type UploadType = 'element' | 'compteur';

interface PhotoGalleryProps {
  photos: LocalPhoto[];
  onPhotosChange: (photos: LocalPhoto[]) => void;
  elementId: string;
  maxPhotos?: number;
  thumbnailSize?: ThumbnailSize;
  label?: string;
  layout?: LayoutType;
  autoUpload?: boolean;
  uploadType?: UploadType; // Type d'entité pour l'upload
}

export function PhotoGallery({
  photos,
  onPhotosChange,
  elementId,
  maxPhotos = 5,
  thumbnailSize = 'medium',
  label,
  layout = 'scroll',
  autoUpload = false,
  uploadType = 'element',
}: PhotoGalleryProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const { getCurrentLocation } = useLocation();
  const { uploadPhoto } = usePhotoUpload();

  const dimension = SIZES[thumbnailSize];

  const generateId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions requises',
        "L'application a besoin d'acceder a votre camera et galerie pour ajouter des photos."
      );
      return false;
    }
    return true;
  };

  const pickImage = async (useCamera: boolean) => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        exif: true,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Get location if available
        let latitude: number | undefined;
        let longitude: number | undefined;

        if (useCamera) {
          const location = await getCurrentLocation();
          if (location) {
            latitude = location.latitude;
            longitude = location.longitude;
          }
        } else if (asset.exif) {
          // Try to get from EXIF data
          const exif = asset.exif as any;
          if (exif.GPSLatitude && exif.GPSLongitude) {
            latitude = exif.GPSLatitude;
            longitude = exif.GPSLongitude;
          }
        }

        const newPhoto: LocalPhoto = {
          id: generateId(),
          localUri: asset.uri,
          ordre: photos.length + 1,
          uploadStatus: 'pending',
          latitude,
          longitude,
        };

        const updatedPhotos = [...photos, newPhoto];
        onPhotosChange(updatedPhotos);

        // Auto-upload if enabled
        if (autoUpload) {
          uploadPhoto(elementId, newPhoto, uploadType);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', "Impossible de selectionner l'image");
    }
  };

  const showOptions = () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limite atteinte', `Maximum ${maxPhotos} photos autorisees`);
      return;
    }

    Alert.alert('Ajouter une photo', 'Choisissez une source', [
      {
        text: 'Camera',
        onPress: () => pickImage(true),
      },
      {
        text: 'Galerie',
        onPress: () => pickImage(false),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleDelete = (photoId: string) => {
    Alert.alert('Supprimer', 'Supprimer cette photo ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          const filteredPhotos = photos.filter(p => p.id !== photoId);
          // Reorder
          const reorderedPhotos = filteredPhotos.map((p, index) => ({
            ...p,
            ordre: index + 1,
          }));
          onPhotosChange(reorderedPhotos);
        },
      },
    ]);
  };

  const handleRetry = async (photo: LocalPhoto) => {
    // Update status to pending and retry
    const updatedPhotos = photos.map(p =>
      p.id === photo.id ? { ...p, uploadStatus: 'pending' as const } : p
    );
    onPhotosChange(updatedPhotos);
    uploadPhoto(elementId, { ...photo, uploadStatus: 'pending' }, uploadType);
  };

  const handlePhotoPress = (index: number) => {
    setViewerInitialIndex(index);
    setViewerVisible(true);
  };

  const handleUpdateCaption = (photoId: string, legende: string) => {
    const updatedPhotos = photos.map(p =>
      p.id === photoId ? { ...p, legende } : p
    );
    onPhotosChange(updatedPhotos);
  };

  const handleDeleteFromViewer = (photoId: string) => {
    const filteredPhotos = photos.filter(p => p.id !== photoId);
    const reorderedPhotos = filteredPhotos.map((p, index) => ({
      ...p,
      ordre: index + 1,
    }));
    onPhotosChange(reorderedPhotos);

    // Close viewer if no photos left
    if (reorderedPhotos.length === 0) {
      setViewerVisible(false);
    }
  };

  const renderAddButton = () => (
    <TouchableOpacity
      onPress={showOptions}
      style={[styles.addButton, { width: dimension, height: dimension }]}
    >
      <Camera size={dimension * 0.25} color={COLORS.gray[400]} />
      <Text style={styles.addText}>Photo</Text>
    </TouchableOpacity>
  );

  const renderPhotos = () => (
    <>
      {photos.map((photo, index) => (
        <View key={photo.id} style={styles.photoWrapper}>
          <PhotoThumbnail
            photo={photo}
            index={index}
            size={thumbnailSize}
            onPress={() => handlePhotoPress(index)}
            onDelete={() => handleDelete(photo.id)}
            onRetry={photo.uploadStatus === 'error' ? () => handleRetry(photo) : undefined}
          />
        </View>
      ))}
      {photos.length < maxPhotos && renderAddButton()}
    </>
  );

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}

      {layout === 'scroll' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderPhotos()}
        </ScrollView>
      ) : (
        <View style={styles.gridContent}>{renderPhotos()}</View>
      )}

      {photos.length > 0 && (
        <Text style={styles.counter}>
          {photos.length}/{maxPhotos} photos
        </Text>
      )}

      {/* Photo Viewer Modal */}
      <PhotoViewer
        visible={viewerVisible}
        photos={photos}
        initialIndex={viewerInitialIndex}
        onClose={() => setViewerVisible(false)}
        onUpdateCaption={handleUpdateCaption}
        onDelete={handleDeleteFromViewer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 4,
  },
  photoWrapper: {
    // Espace pour le badge et le bouton supprimer
  },
  addButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[50],
  },
  addText: {
    fontSize: 11,
    color: COLORS.gray[400],
    marginTop: 4,
  },
  counter: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 8,
  },
});
