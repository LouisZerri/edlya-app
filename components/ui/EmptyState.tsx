import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center py-16 px-8">
      <View className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-5">
        <Icon size={36} color={COLORS.gray[400]} />
      </View>
      <Text className="text-lg font-semibold text-gray-700 dark:text-gray-300 text-center mb-2">
        {title}
      </Text>
      <Text className="text-sm text-gray-400 dark:text-gray-500 text-center leading-5">
        {subtitle}
      </Text>
      {actionLabel && onAction && (
        <View className="mt-5">
          <Button label={actionLabel} onPress={onAction} variant="primary" />
        </View>
      )}
    </View>
  );
}
