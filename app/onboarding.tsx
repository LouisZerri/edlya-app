import { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, Dimensions, TouchableOpacity, FlatList, Animated, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, FileText, Upload, Shield, Key } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, API_URL } from '../utils/constants';
import { fetchWithAuth } from '../utils/fetchWithAuth';

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
  isActivation?: boolean;
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
  {
    icon: <Key size={40} color="#fff" />,
    iconBg: COLORS.primary[600],
    title: 'Activez votre compte',
    subtitle: 'Entrez le code d\'activation qui vous a été fourni pour accéder à l\'application.',
    isActivation: true,
  },
];

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (err) {
    if (__DEV__) console.warn('[Onboarding] Failed to check onboarding status:', err);
    return false;
  }
}

async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (err) {
    if (__DEV__) console.warn('[Onboarding] Failed to mark onboarding seen:', err);
  }
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activationCode, setActivationCode] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationLoading, setActivationLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Vérifier si l'utilisateur est déjà vérifié
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/me`);
        if (res.ok) {
          const data = await res.json();
          setIsVerified(data.isVerified ?? false);
        }
      } catch {
        setIsVerified(false);
      }
    })();
  }, []);

  const handleComplete = useCallback(async () => {
    await markOnboardingSeen();
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    const currentSlide = slides[activeIndex];
    if (currentSlide.isActivation) {
      return; // Le bouton d'activation gère ça
    }
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  }, [activeIndex]);

  const handleActivate = useCallback(async () => {
    if (!activationCode.trim()) {
      setActivationError('Veuillez entrer votre code');
      return;
    }

    setActivationError('');
    setActivationLoading(true);

    try {
      const res = await fetchWithAuth(`${API_URL}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activationCode.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsVerified(true);
        await handleComplete();
      } else {
        setActivationError(data.error || 'Code invalide');
      }
    } catch {
      setActivationError('Erreur de connexion');
    } finally {
      setActivationLoading(false);
    }
  }, [activationCode, handleComplete]);

  // Si déjà vérifié, le slide d'activation est remplacé par "Commencer"
  const effectiveSlides = isVerified ? slides.filter(s => !s.isActivation) : slides;

  const renderSlide = useCallback(({ item }: { item: Slide }) => (
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

      {item.isActivation && (
        <View className="w-full mt-8">
          <TextInput
            value={activationCode}
            onChangeText={(text) => {
              setActivationCode(text.toUpperCase());
              setActivationError('');
            }}
            placeholder="XXXXXXXX"
            placeholderTextColor={COLORS.gray[400]}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            style={{
              backgroundColor: '#fff',
              borderWidth: 2,
              borderColor: activationError ? COLORS.red[500] : COLORS.gray[200],
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 20,
              textAlign: 'center',
              letterSpacing: 4,
              fontWeight: '600',
              color: COLORS.gray[900],
            }}
          />
          {activationError ? (
            <Text style={{ color: COLORS.red[600], fontSize: 14, marginTop: 8, textAlign: 'center' }}>
              {activationError}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  ), [activationCode, activationError]);

  const isLast = activeIndex === effectiveSlides.length - 1;
  const isActivationSlide = effectiveSlides[activeIndex]?.isActivation;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      {activeIndex === 0 && <Confetti />}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-row justify-end px-4 pt-2">
          {!isLast && !isActivationSlide && (
            <TouchableOpacity
              onPress={() => {
                // Passer va au dernier slide avant activation (ou compléter si vérifié)
                if (isVerified) {
                  handleComplete();
                } else {
                  flatListRef.current?.scrollToIndex({ index: effectiveSlides.length - 1, animated: true });
                }
              }}
              className="py-2 px-3"
            >
              <Text className="text-sm text-gray-400">Passer</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={effectiveSlides}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!isActivationSlide}
          keyExtractor={(_, i) => i.toString()}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActiveIndex(index);
          }}
        />

        {/* Dots + Button */}
        <View className="px-6 pb-6">
          {/* Dots */}
          <View className="flex-row items-center justify-center mb-8">
            {effectiveSlides.map((_, i) => (
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
          {isActivationSlide ? (
            <TouchableOpacity
              onPress={handleActivate}
              disabled={activationLoading}
              style={{ backgroundColor: activationLoading ? COLORS.gray[400] : COLORS.primary[600] }}
              className="py-4 rounded-xl flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              {activationLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base text-center">
                  Activer mon compte
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={isLast ? handleComplete : handleNext}
              style={{ backgroundColor: COLORS.primary[600] }}
              className="py-4 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base text-center">
                {isLast ? 'Commencer' : 'Suivant'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
