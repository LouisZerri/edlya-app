import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import { MapPin } from 'lucide-react-native';
import { useAddressSearch, AddressSuggestion } from '../../hooks/useAddressSearch';
import { COLORS, DARK_COLORS } from '../../utils/constants';

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  error?: string;
}

export function AddressAutocomplete({
  label,
  value,
  onChangeText,
  onSelect,
  placeholder,
  error,
}: AddressAutocompleteProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { query, setQuery, suggestions, isSearching, clearSuggestions } = useAddressSearch();

  const handleChangeText = (text: string) => {
    onChangeText(text);
    setQuery(text);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    onSelect(suggestion);
    onChangeText(suggestion.adresse);
    clearSuggestions();
  };

  return (
    <View className="mb-4" style={{ zIndex: 10 }}>
      <Text className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</Text>
      <View className="flex-row items-center">
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          style={[
            styles.input,
            isDark && darkStyles.input,
            error ? styles.inputError : (isDark ? darkStyles.inputNormal : styles.inputNormal),
          ]}
        />
        {isSearching && (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={COLORS.primary[600]} />
          </View>
        )}
      </View>

      {error && (
        <Text className="text-sm text-red-600 dark:text-red-400 mt-1.5">{error}</Text>
      )}

      {suggestions.length > 0 && (
        <View
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mt-1 overflow-hidden"
          style={styles.suggestionsContainer}
        >
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`${suggestion.label}-${index}`}
              onPress={() => handleSelect(suggestion)}
              className={`flex-row items-center px-3 py-3 ${
                index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
              }`}
              activeOpacity={0.6}
            >
              <MapPin size={16} color={COLORS.primary[500]} />
              <Text
                className="text-gray-800 dark:text-gray-200 ml-2.5 flex-1 text-sm"
                numberOfLines={1}
              >
                {suggestion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    height: 52,
    textAlignVertical: 'center',
  },
  inputNormal: {
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#FCA5A5',
  },
  loader: {
    position: 'absolute',
    right: 14,
  },
  suggestionsContainer: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

const darkStyles = StyleSheet.create({
  input: {
    backgroundColor: DARK_COLORS.inputBg,
    color: DARK_COLORS.text,
  },
  inputNormal: {
    borderColor: DARK_COLORS.inputBorder,
  },
});
