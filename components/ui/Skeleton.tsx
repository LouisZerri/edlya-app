import { useEffect, useRef } from 'react';
import { View, Animated, DimensionValue } from 'react-native';
import { useColorScheme } from 'nativewind';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ width, height = 16, borderRadius = 8, className }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View className={className}>
      <Animated.View
        style={{
          width: width ?? '100%',
          height,
          borderRadius,
          backgroundColor: isDark ? '#374151' : '#E5E7EB',
          opacity,
        }}
      />
    </View>
  );
}

/** Skeleton card mimicking an EDL or Logement list item */
export function SkeletonCard() {
  return (
    <View className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-3 border border-gray-100 dark:border-gray-800">
      <View className="flex-row items-center">
        <Skeleton width={48} height={48} borderRadius={12} />
        <View className="flex-1 ml-3">
          <Skeleton height={16} width="70%" />
          <Skeleton height={12} width="45%" className="mt-2" />
          <Skeleton height={12} width="55%" className="mt-2" />
        </View>
      </View>
    </View>
  );
}

/** Multiple skeleton cards for list loading */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View className="px-4 pt-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
