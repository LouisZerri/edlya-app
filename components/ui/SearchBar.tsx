import { View, TextInput, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Rechercher...' }: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
      <Search size={18} color={COLORS.gray[400]} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray[400]}
        className="flex-1 ml-2 text-gray-900 dark:text-gray-100"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <X size={18} color={COLORS.gray[400]} />
        </TouchableOpacity>
      )}
    </View>
  );
}
