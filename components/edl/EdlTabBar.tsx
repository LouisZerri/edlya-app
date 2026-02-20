import { View, Text, TouchableOpacity } from 'react-native';

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
}

export function EdlTabBar({ activeTab, onTabChange }: EdlTabBarProps) {
  return (
    <View className="bg-white dark:bg-gray-900 flex-row border-b border-gray-100 dark:border-gray-700">
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => onTabChange(tab.key)}
          className={`flex-1 py-4 items-center border-b-2 ${
            activeTab === tab.key ? 'border-primary-600' : 'border-transparent'
          }`}
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
  );
}
