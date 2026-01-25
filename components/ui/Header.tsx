import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ReactNode } from 'react';
import { COLORS } from '../../utils/constants';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export function Header({ title, showBack = false, rightAction }: HeaderProps) {
  const router = useRouter();

  return (
    <View className="h-14 bg-white border-b border-gray-100 flex-row items-center px-4">
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <ChevronLeft size={24} color={COLORS.primary[600]} />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}

      <Text className="flex-1 text-center text-lg font-semibold text-gray-900">
        {title}
      </Text>

      <View className="w-10 items-end">
        {rightAction}
      </View>
    </View>
  );
}
