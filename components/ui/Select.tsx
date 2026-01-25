import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selectionner...',
  error,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View className="mb-4">
      <Text className="text-base font-medium text-gray-700 mb-1.5">{label}</Text>

      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className={`
          px-4 border rounded-xl flex-row items-center justify-between bg-white
          ${error ? 'border-red-300' : 'border-gray-200'}
        `}
        style={{ height: 52 }}
      >
        <Text className={`text-base ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown size={22} color={COLORS.gray[400]} />
      </TouchableOpacity>

      {error && (
        <Text className="text-sm text-red-600 mt-1.5">{error}</Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View className="bg-white rounded-t-2xl max-h-96">
            <View className="p-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-center">{label}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onChange(item.value);
                    setIsOpen(false);
                  }}
                  className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50"
                >
                  <Text className="text-base text-gray-900">{item.label}</Text>
                  {item.value === value && (
                    <Check size={22} color={COLORS.primary[600]} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
