import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: 'bg-primary-600', text: 'text-white' },
  secondary: { bg: 'bg-white', text: 'text-gray-700', border: 'border border-gray-300' },
  danger: { bg: 'bg-red-600', text: 'text-white' },
  success: { bg: 'bg-green-600', text: 'text-white' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  fullWidth = false,
  disabled = false,
  loading = false,
}: ButtonProps) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`
        flex-row items-center justify-center py-3.5 px-4 rounded-xl
        ${styles.bg} ${styles.border || ''}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : ''}
      `}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#374151' : '#ffffff'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`font-semibold text-base ${styles.text}`}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
