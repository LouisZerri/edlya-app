import { View, Text } from 'react-native';
import { BadgeVariant } from '../../types';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
  green: { bg: 'bg-green-100', text: 'text-green-700' },
  red: { bg: 'bg-red-100', text: 'text-red-700' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700' },
};

export function Badge({ label, variant = 'gray' }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View className={`px-2.5 py-1 rounded-full ${styles.bg} items-center justify-center`}>
      <Text className={`text-xs font-medium ${styles.text}`} style={{ lineHeight: 16 }}>{label}</Text>
    </View>
  );
}
