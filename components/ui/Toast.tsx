import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';
import { useToastStore, ToastType } from '../../stores/toastStore';

const toastConfig: Record<ToastType, { bg: string; icon: typeof CheckCircle; iconColor: string; textColor: string }> = {
  success: {
    bg: 'bg-green-600 dark:bg-green-800',
    icon: CheckCircle,
    iconColor: '#ffffff',
    textColor: 'text-white',
  },
  error: {
    bg: 'bg-red-600 dark:bg-red-800',
    icon: AlertCircle,
    iconColor: '#ffffff',
    textColor: 'text-white',
  },
  info: {
    bg: 'bg-blue-600 dark:bg-blue-800',
    icon: Info,
    iconColor: '#ffffff',
    textColor: 'text-white',
  },
  warning: {
    bg: 'bg-amber-500 dark:bg-amber-700',
    icon: AlertTriangle,
    iconColor: '#ffffff',
    textColor: 'text-white',
  },
};

interface ToastItemProps {
  id: string;
  message: string;
  type: ToastType;
}

function ToastItem({ id, message, type }: ToastItemProps) {
  const hideToast = useToastStore(state => state.hideToast);
  const config = toastConfig[type];
  const Icon = config.icon;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => hideToast(id));
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
      className={`mx-4 mb-2 ${config.bg} rounded-xl px-4 py-3.5 flex-row items-center shadow-lg`}
    >
      <Icon size={22} color={config.iconColor} />
      <Text className={`flex-1 ml-3 text-base font-medium ${config.textColor}`}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={handleDismiss}
        className="ml-2 p-1"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={20} color={config.iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const toasts = useToastStore(state => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <View className="absolute top-14 left-0 right-0 z-50">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
        />
      ))}
    </View>
  );
}
