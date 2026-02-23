import { View, Text, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { useRef, useEffect } from 'react';

export type TabType = 'infos' | 'compteurs' | 'cles' | 'pieces';

const TABS: { key: TabType; label: string }[] = [
  { key: 'infos', label: 'Infos' },
  { key: 'compteurs', label: 'Compteurs' },
  { key: 'cles', label: 'Clés' },
  { key: 'pieces', label: 'Pièces' },
];

interface EdlTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  scrollPosition?: Animated.Value;
}

export function EdlTabBar({ activeTab, onTabChange, scrollPosition }: EdlTabBarProps) {
  const { width } = useWindowDimensions();
  const tabWidth = width / TABS.length;
  const fallbackAnim = useRef(new Animated.Value(0)).current;

  // Fallback animation when no scrollPosition (tap on tab)
  useEffect(() => {
    if (!scrollPosition) {
      const index = TABS.findIndex(t => t.key === activeTab);
      Animated.spring(fallbackAnim, {
        toValue: index,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }).start();
    }
  }, [activeTab, scrollPosition]);

  const animValue = scrollPosition || fallbackAnim;

  const translateX = animValue.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabWidth),
    extrapolate: 'clamp',
  });

  return (
    <View className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
      <View className="flex-row">
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            className="flex-1 py-4 items-center"
          >
            <Text
              className={`text-base ${
                activeTab === tab.key ? 'text-primary-600 font-semibold' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: tabWidth,
          height: 2,
          backgroundColor: '#4F46E5',
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}
