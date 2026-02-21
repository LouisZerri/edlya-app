import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, Dimensions } from 'react-native';
import { useState, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/constants';

const SCREEN_HEIGHT = Dimensions.get('window').height;

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
  searchable?: boolean;
}

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selectionner...',
  error,
  searchable,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const selectedOption = options.find(opt => opt.value === value);

  const showSearch = searchable ?? options.length > 6;

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(q));
  }, [options, search]);

  const handleClose = () => {
    setIsOpen(false);
    setSearch('');
  };

  const handleSelect = (val: string) => {
    onChange(val);
    handleClose();
  };

  return (
    <View className="mb-4">
      <Text className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</Text>

      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className={`
          px-4 border rounded-xl flex-row items-center justify-between bg-white dark:bg-gray-800
          ${error ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'}
        `}
        style={{ height: 52 }}
      >
        <Text className={`text-base ${selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown size={22} color={COLORS.gray[400]} />
      </TouchableOpacity>

      {error && (
        <Text className="text-sm text-red-600 dark:text-red-400 mt-1.5">{error}</Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center px-6"
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden"
            style={{ maxHeight: SCREEN_HEIGHT * 0.6 }}
          >
            {/* Header */}
            <View className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">{label}</Text>
              <TouchableOpacity onPress={handleClose} className="p-1">
                <X size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            {showSearch && (
              <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <Search size={16} color={COLORS.gray[400]} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Rechercher..."
                    placeholderTextColor={COLORS.gray[400]}
                    className="flex-1 ml-2 text-sm text-gray-900 dark:text-gray-100"
                    style={{ includeFontPadding: false, padding: 0 }}
                    autoFocus
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <X size={16} color={COLORS.gray[400]} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Options */}
            <FlatList
              data={filteredOptions}
              keyExtractor={item => item.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.value)}
                    className={`flex-row items-center justify-between px-4 py-3.5 border-b border-gray-50 dark:border-gray-800 ${
                      isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                  >
                    <Text className={`text-base ${
                      isSelected ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {item.label}
                    </Text>
                    {isSelected && <Check size={20} color={COLORS.primary[600]} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View className="py-8 items-center">
                  <Text className="text-gray-400 dark:text-gray-500">Aucun résultat</Text>
                </View>
              }
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
