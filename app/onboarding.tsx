import { View, Text, Dimensions, TouchableOpacity, FlatList, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useState, useCallback, useEffect } from 'react';
import { Home, FileText, Upload, Shield } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../utils/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6'];
const CONFETTI_COUNT = 40;

function Confetti() {
  const particles = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-20),
      rotate: new Animated.Value(0),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 6,
      isCircle: Math.random() > 0.5,
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map((p, i) => {
      const delay = i * 40;
      const duration = 2000 + Math.random() * 1500;
      const endX = (Math.random() - 0.5) * SCREEN_WIDTH * 0.8;

      return Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(p.y, {
            toValue: SCREEN_HEIGHT * 0.7,
            duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(p.x, {
            toValue: (SCREEN_WIDTH / 2) + endX,
            duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(p.rotate, {
            toValue: 3 + Math.random() * 5,
            duration,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.isCircle ? p.size : p.size * 2.5,
            borderRadius: p.isCircle ? p.size / 2 : 2,
            backgroundColor: p.color,
            transform: [
              { translateX: p.x },
              { translateY: p.y },
              { rotate: p.rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
            ],
            opacity: p.y.interpolate({
              inputRange: [0, SCREEN_HEIGHT * 0.5, SCREEN_HEIGHT * 0.7],
              outputRange: [1, 1, 0],
            }),
          }}
        />
      ))}
    </View>
  );
}

const ONBOARDING_KEY = 'has_seen_onboarding';

interface Slide {
  icon: React.ReactNode;
  iconBg: string;
  emoji?: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    icon: null,
    iconBg: '',
    emoji: '👋',
    title: 'Bienvenue sur Edlya',
    subtitle: 'Votre assistant pour réaliser des états des lieux professionnels, simplement et rapidement.',
  },
  {
    icon: <Home size={40} color="#fff" />,
    iconBg: COLORS.primary[600],
    title: 'Gérez vos logements',
    subtitle: 'Centralisez tous vos biens immobiliers en un seul endroit. Ajoutez, modifiez et suivez chaque logement facilement.',
  },
  {
    icon: <FileText size={40} color="#fff" />,
    iconBg: COLORS.blue[600],
    title: 'Créez vos états des lieux',
    subtitle: 'Réalisez des états des lieux complets avec photos, compteurs, clés et signatures numériques.',
  },
  {
    icon: <Upload size={40} color="#fff" />,
    iconBg: COLORS.amber[600],
    title: 'Importez vos PDF',
    subtitle: 'Notre IA analyse vos documents existants et les convertit automatiquement en états des lieux éditables.',
  },
  {
    icon: <Shield size={40} color="#fff" />,
    iconBg: COLORS.green[600],
    title: 'Travaillez hors-ligne',
    subtitle: 'Réalisez vos EDL même sans connexion. Vos données se synchronisent automatiquement dès le retour du réseau.',
  },
];

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {
    // silently fail
  }
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleComplete = useCallback(async () => {
    await markOnboardingSeen();
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      handleComplete();
    }
  }, [activeIndex, handleComplete]);

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-10">
      {item.emoji ? (
        <Text style={{ fontSize: 72 }} className="mb-10">{item.emoji}</Text>
      ) : (
        <View
          style={{ backgroundColor: item.iconBg, width: 96, height: 96, borderRadius: 28 }}
          className="items-center justify-center mb-10"
        >
          {item.icon}
        </View>
      )}
      <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
        {item.title}
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6">
        {item.subtitle}
      </Text>
    </View>
  );

  const isLast = activeIndex === slides.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      {activeIndex === 0 && <Confetti />}
      <View className="flex-row justify-end px-4 pt-2">
        {!isLast && (
          <TouchableOpacity onPress={handleComplete} className="py-2 px-3">
            <Text className="text-sm text-gray-400">Passer</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
      />

      {/* Dots + Button */}
      <View className="px-6 pb-6">
        {/* Dots */}
        <View className="flex-row items-center justify-center mb-8">
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === activeIndex ? COLORS.primary[600] : COLORS.gray[300],
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          onPress={handleNext}
          style={{ backgroundColor: COLORS.primary[600] }}
          className="py-4 rounded-xl"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base text-center">
            {isLast ? 'Commencer' : 'Suivant'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
