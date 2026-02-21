import { useRef, useCallback } from 'react';
import { View, Text, Animated, TouchableOpacity, useColorScheme, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2, Edit } from 'lucide-react-native';
import { hapticMedium } from '../../utils/haptics';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
  enabled?: boolean;
}

const ACTION_WIDTH = 80;

export function SwipeableRow({ children, onDelete, onEdit, enabled = true }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const colorScheme = useColorScheme();

  const cardBg = colorScheme === 'dark' ? '#111827' : '#FFFFFF';
  const borderColor = colorScheme === 'dark' ? '#374151' : '#F3F4F6';

  const handleDelete = useCallback(() => {
    hapticMedium();
    swipeableRef.current?.close();
    onDelete();
  }, [onDelete]);

  const handleEdit = useCallback(() => {
    hapticMedium();
    swipeableRef.current?.close();
    onEdit?.();
  }, [onEdit]);

  const renderRightActions = useCallback((_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-ACTION_WIDTH, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        onPress={handleDelete}
        activeOpacity={0.8}
        style={styles.deleteAction}
      >
        <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
          <Trash2 size={20} color="#ffffff" />
          <Text style={styles.actionText}>Supprimer</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }, [handleDelete]);

  const renderLeftActions = useCallback((_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    if (!onEdit) return null;

    const scale = dragX.interpolate({
      inputRange: [0, ACTION_WIDTH],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        onPress={handleEdit}
        activeOpacity={0.8}
        style={styles.editAction}
      >
        <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
          <Edit size={20} color="#ffffff" />
          <Text style={styles.actionText}>Modifier</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }, [handleEdit, onEdit]);

  if (!enabled) return <>{children}</>;

  return (
    <View style={[styles.container, { borderColor, borderRadius: 12, borderWidth: 1, overflow: 'hidden' }]}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        rightThreshold={40}
        leftThreshold={40}
        overshootRight={false}
        overshootLeft={false}
        childrenContainerStyle={{ backgroundColor: cardBg }}
      >
        {children}
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  deleteAction: {
    width: ACTION_WIDTH,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAction: {
    width: ACTION_WIDTH,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});
