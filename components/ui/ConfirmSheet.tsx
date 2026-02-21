import { View, Text, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react-native';
import { hapticMedium } from '../../utils/haptics';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  danger: {
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: '#DC2626',
    buttonBg: 'bg-red-600',
    buttonPress: 'bg-red-700',
  },
  warning: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: '#D97706',
    buttonBg: 'bg-amber-600',
    buttonPress: 'bg-amber-700',
  },
  info: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: '#2563EB',
    buttonBg: 'bg-blue-600',
    buttonPress: 'bg-blue-700',
  },
};

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const config = variantConfig[variant];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    hapticMedium();
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onCancel}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Pressable
            className="bg-white dark:bg-gray-900 rounded-t-3xl px-6 pt-6 pb-10"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-5" />

            {/* Icon */}
            <View className={`w-14 h-14 rounded-full items-center justify-center self-center mb-4 ${config.iconBg}`}>
              <AlertTriangle size={28} color={config.iconColor} />
            </View>

            {/* Title & Message */}
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
              {title}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 leading-5">
              {message}
            </Text>

            {/* Buttons */}
            <TouchableOpacity
              onPress={handleConfirm}
              className={`${config.buttonBg} py-3.5 rounded-xl mb-3`}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-center text-base">{confirmLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCancel}
              className="bg-gray-100 dark:bg-gray-800 py-3.5 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-gray-700 dark:text-gray-300 font-medium text-center text-base">{cancelLabel}</Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
