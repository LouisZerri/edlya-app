import { TouchableOpacity, Text, View } from 'react-native';
import { ReactNode } from 'react';

type IconButtonVariant = 'primary' | 'success' | 'warning' | 'dark';

interface IconButtonProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  variant?: IconButtonVariant;
}

const variantStyles: Record<IconButtonVariant, string> = {
  primary: 'bg-primary-600',
  success: 'bg-green-600',
  warning: 'bg-amber-500',
  dark: 'bg-gray-800',
};

export function IconButton({
  icon,
  label,
  onPress,
  variant = 'primary',
}: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="items-center"
      activeOpacity={0.7}
    >
      <View className={`p-3 rounded-xl ${variantStyles[variant]}`}>
        {icon}
      </View>
      <Text className="text-xs text-gray-600 mt-1.5 text-center">{label}</Text>
    </TouchableOpacity>
  );
}
