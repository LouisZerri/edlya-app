import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';

interface CustomDegradationModalProps {
  visible: boolean;
  text: string;
  onChangeText: (text: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function CustomDegradationModal({
  visible,
  text,
  onChangeText,
  onConfirm,
  onClose,
}: CustomDegradationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/50 justify-center items-center p-4"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 w-full max-w-sm"
        >
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Nouvelle dégradation
          </Text>
          <TextInput
            value={text}
            onChangeText={onChangeText}
            placeholder="Décrivez la dégradation..."
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-base text-gray-900 dark:text-gray-100 mb-4"
            autoFocus
          />
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 items-center"
            >
              <Text className="text-gray-600 dark:text-gray-300 font-medium">Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className="flex-1 py-2.5 rounded-lg bg-primary-600 items-center"
            >
              <Text className="text-white font-medium">Ajouter</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
