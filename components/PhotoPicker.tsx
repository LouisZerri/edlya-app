import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, Plus } from 'lucide-react-native';
import { COLORS } from '../utils/constants';

interface PhotoPickerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
}

export function PhotoPicker({
  photos,
  onPhotosChange,
  maxPhotos = 5,
  label,
}: PhotoPickerProps) {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions requises',
        'L\'application a besoin d\'acceder a votre camera et galerie pour ajouter des photos.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async (useCamera: boolean) => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    setLoading(true);
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        const newPhoto = result.assets[0].uri;
        onPhotosChange([...photos, newPhoto]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de selectionner l\'image');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert('Supprimer', 'Supprimer cette photo ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          const newPhotos = [...photos];
          newPhotos.splice(index, 1);
          onPhotosChange(newPhotos);
        },
      },
    ]);
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

  return (
    <View>
      {label && (
        <Text className="text-base font-medium text-gray-700 mb-2">{label}</Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {photos.map((photo, index) => (
            <View key={index} className="relative">
              <Image
                source={{ uri: photo }}
                className="w-20 h-20 rounded-lg"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => removePhoto(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
              >
                <X size={14} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          {photos.length < maxPhotos && (
            <TouchableOpacity
              onPress={showOptions}
              disabled={loading}
              className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center bg-gray-50"
            >
              <Plus size={24} color={COLORS.gray[400]} />
              <Text className="text-xs text-gray-400 mt-1">Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {photos.length > 0 && (
        <Text className="text-xs text-gray-400 mt-2">
          {photos.length}/{maxPhotos} photos
        </Text>
      )}
    </View>
  );
}

// Version compacte pour les listes
export function PhotoPickerCompact({
  photos,
  onPhotosChange,
  maxPhotos = 3,
}: Omit<PhotoPickerProps, 'label'>) {
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    return cameraStatus === 'granted' && libraryStatus === 'granted';
  };

  const pickImage = async (useCamera: boolean) => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert('Permissions requises', 'Acces camera/galerie necessaire');
      return;
    }

    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        onPhotosChange([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const showOptions = () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limite', `Max ${maxPhotos} photos`);
      return;
    }

    Alert.alert('Photo', '', [
      { text: 'Camera', onPress: () => pickImage(true) },
      { text: 'Galerie', onPress: () => pickImage(false) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onPhotosChange(newPhotos);
  };

  return (
    <View className="flex-row gap-2">
      {photos.map((photo, index) => (
        <View key={index} className="relative">
          <Image
            source={{ uri: photo }}
            className="w-16 h-16 rounded-lg"
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => removePhoto(index)}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center"
          >
            <X size={12} color="white" />
          </TouchableOpacity>
        </View>
      ))}

      {photos.length < maxPhotos && (
        <TouchableOpacity
          onPress={showOptions}
          className="w-16 h-16 border border-dashed border-gray-300 rounded-lg items-center justify-center"
        >
          <Camera size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>
      )}
    </View>
  );
}
