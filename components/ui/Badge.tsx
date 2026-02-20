import { View, Text } from 'react-native';
import { BadgeVariant } from '../../types';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  gray: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
};

export function Badge({ label, variant = 'gray' }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View className={`px-2.5 py-1 rounded-full ${styles.bg} items-center justify-center`}>
      <Text className={`text-xs font-medium ${styles.text}`} style={{ lineHeight: 16 }}>{label}</Text>
    </View>
  );
}
