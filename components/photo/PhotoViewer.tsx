import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  Animated,
  PanResponder,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Trash2, MapPin, Calendar } from 'lucide-react-native';
import { LocalPhoto } from '../../types';
import { COLORS } from '../../utils/constants';
import { PhotoCaptionEditor } from './PhotoCaptionEditor';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhotoViewerProps {
  visible: boolean;
  photos: LocalPhoto[];
  initialIndex: number;
  onClose: () => void;
  onUpdateCaption?: (photoId: string, caption: string) => void;
  onDelete?: (photoId: string) => void;
}

export function PhotoViewer({
  visible,
  photos,
  initialIndex,
  onClose,
  onUpdateCaption,
  onDelete,
}: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [captionEditorVisible, setCaptionEditorVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Animation values for swipe-to-dismiss
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Update current index when initialIndex changes (when modal opens)
  const onLayout = useCallback(() => {
    setCurrentIndex(initialIndex);
    // Scroll to initial position
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: initialIndex * SCREEN_WIDTH,
        animated: false,
      });
    }, 0);
  }, [initialIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dx) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          const newOpacity = Math.max(0, 1 - gestureState.dy / 300);
          opacity.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Dismiss
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: SCREEN_HEIGHT,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose();
            translateY.setValue(0);
            opacity.setValue(1);
          });
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < photos.length) {
      setCurrentIndex(index);
    }
  };

  const handleDelete = () => {
    const currentPhoto = photos[currentIndex];
    if (!currentPhoto || !onDelete) return;

    Alert.alert('Supprimer', 'Supprimer cette photo ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          onDelete(currentPhoto.id);
          // Adjust index if needed
          if (currentIndex >= photos.length - 1 && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
          }
        },
      },
    ]);
  };

  const handleCaptionSave = (caption: string) => {
    const currentPhoto = photos[currentIndex];
    if (currentPhoto && onUpdateCaption) {
      onUpdateCaption(currentPhoto.id, caption);
    }
    setCaptionEditorVisible(false);
  };

  const currentPhoto = photos[currentIndex];
  const hasCoords = currentPhoto?.latitude && currentPhoto?.longitude;

  if (!visible || photos.length === 0) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <Animated.View
        style={[
          styles.container,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
        onLayout={onLayout}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="white" />
          </TouchableOpacity>

          <Text style={styles.counter}>
            Photo {currentIndex + 1}/{photos.length}
          </Text>

          {onDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Trash2 size={22} color={COLORS.red[500]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Photos */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
          style={styles.scrollView}
        >
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.imageContainer}>
              <Image
                source={{ uri: photo.localUri }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>

        {/* Pagination dots */}
        {photos.length > 1 && photos.length <= 8 && (
          <View style={styles.pagination}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Footer */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {/* Caption */}
          <TouchableOpacity
            onPress={() => setCaptionEditorVisible(true)}
            style={styles.captionContainer}
          >
            <Text
              style={[
                styles.caption,
                !currentPhoto?.legende && styles.captionPlaceholder,
              ]}
            >
              {currentPhoto?.legende || 'Ajouter une legende...'}
            </Text>
          </TouchableOpacity>

          {/* Metadata */}
          <View style={styles.metadata}>
            {hasCoords && (
              <View style={styles.metaItem}>
                <MapPin size={14} color={COLORS.gray[400]} />
                <Text style={styles.metaText}>
                  {currentPhoto.latitude?.toFixed(4)}, {currentPhoto.longitude?.toFixed(4)}
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>

        {/* Caption Editor */}
        <PhotoCaptionEditor
          visible={captionEditorVisible}
          currentCaption={currentPhoto?.legende || ''}
          onSave={handleCaptionSave}
          onClose={() => setCaptionEditorVisible(false)}
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  pagination: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: 'white',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
  },
  captionContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  caption: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  captionPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.gray[400],
    fontSize: 12,
  },
});
