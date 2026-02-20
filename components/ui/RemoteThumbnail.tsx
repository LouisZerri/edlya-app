import { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { ImageIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { COLORS, DARK_COLORS } from '../../utils/constants';

interface RemoteThumbnailProps {
  source: ImageSource;
  size?: number;
  borderRadius?: number;
}

export function RemoteThumbnail({ source, size = 64, borderRadius = 8 }: RemoteThumbnailProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const placeholderBg = isDark ? DARK_COLORS.surfaceAlt : COLORS.gray[100];

  if (error) {
    return (
      <View style={[styles.placeholder, { width: size, height: size, borderRadius, backgroundColor: placeholderBg }]}>
        <ImageIcon size={size * 0.3} color={COLORS.gray[400]} />
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loader, { backgroundColor: placeholderBg }]}>
          <ActivityIndicator size="small" color={COLORS.primary[500]} />
        </View>
      )}
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius }}
        contentFit="cover"
        transition={200}
        cachePolicy="disk"
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
