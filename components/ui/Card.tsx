import { ReactNode } from 'react';
import { View, TouchableOpacity } from 'react-native';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  className?: string;
}

export function Card({ children, onPress, onLongPress, className = '' }: CardProps) {
  const baseStyles = `bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-700 ${className}`;

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        className={baseStyles}
        activeOpacity={0.7}
        delayLongPress={400}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View className={baseStyles}>{children}</View>;
}
