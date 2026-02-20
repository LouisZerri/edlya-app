import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import { DARK_COLORS } from '../../utils/constants';

interface InputProps extends Omit<TextInputProps, 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export function Input({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  multiline,
  numberOfLines,
  ...props
}: InputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isMultiline = multiline || (numberOfLines && numberOfLines > 1);

  return (
    <View className="mb-4">
      <Text className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          isDark && darkStyles.input,
          isMultiline ? styles.multiline : styles.singleLine,
          error ? styles.inputError : (isDark ? darkStyles.inputNormal : styles.inputNormal),
        ]}
        {...props}
      />
      {error && (
        <Text className="text-sm text-red-600 dark:text-red-400 mt-1.5">{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  singleLine: {
    height: 52,
    textAlignVertical: 'center',
  },
  multiline: {
    minHeight: 100,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: 'top',
  },
  inputNormal: {
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#FCA5A5',
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
