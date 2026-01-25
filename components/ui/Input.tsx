import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';

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
  const isMultiline = multiline || (numberOfLines && numberOfLines > 1);

  return (
    <View className="mb-4">
      <Text className="text-base font-medium text-gray-700 mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          isMultiline ? styles.multiline : styles.singleLine,
          error ? styles.inputError : styles.inputNormal,
        ]}
        {...props}
      />
      {error && (
        <Text className="text-sm text-red-600 mt-1.5">{error}</Text>
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
