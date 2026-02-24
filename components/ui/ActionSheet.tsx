import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { hapticMedium } from '../../utils/haptics';

export interface ActionSheetItem {
  label: string;
  icon: LucideIcon;
  color?: string;
  variant?: 'default' | 'danger';
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  actions: ActionSheetItem[];
  onClose: () => void;
}

export function ActionSheet({ visible, title, subtitle, actions, onClose }: ActionSheetProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
          toValue: 400,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleAction = (action: ActionSheetItem) => {
    hapticMedium();
    onClose();
    // Small delay so the sheet closes before navigating
    setTimeout(() => action.onPress(), 150);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Pressable
            className="bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-5 pb-10"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-4" />

            {/* Header */}
            {title && (
              <View className="mb-3 px-1">
                <Text className="text-base font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>
                  {title}
                </Text>
                {subtitle && (
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>
            )}

            {/* Separator */}
            {title && <View className="h-px bg-gray-100 dark:bg-gray-700 mb-1" />}

            {/* Actions */}
            {actions.map((action, index) => {
              const isDanger = action.variant === 'danger';
              const iconColor = action.color || (isDanger ? '#DC2626' : '#4B5563');
              const Icon = action.icon;

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAction(action)}
                  className={`flex-row items-center px-3 py-3.5 rounded-xl ${
                    index < actions.length - 1 ? '' : ''
                  }`}
                  activeOpacity={0.6}
                >
                  <View className={`w-9 h-9 rounded-lg items-center justify-center ${
                    isDanger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Icon size={18} color={iconColor} />
                  </View>
                  <Text className={`ml-3 text-base font-medium ${
                    isDanger ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Cancel button */}
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-100 dark:bg-gray-800 py-3.5 rounded-xl mt-3"
              activeOpacity={0.8}
            >
              <Text className="text-gray-700 dark:text-gray-300 font-medium text-center text-base">
                Annuler
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
