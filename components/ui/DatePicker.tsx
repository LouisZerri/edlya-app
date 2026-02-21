import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated, Pressable,
  FlatList, useColorScheme, StyleSheet, Platform,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { hapticMedium } from '../../utils/haptics';
import { DARK_COLORS } from '../../utils/constants';

interface DatePickerProps {
  label: string;
  value: string; // DD/MM/YYYY
  onChange: (value: string) => void;
  error?: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

function parseDateValue(value: string): { day: number; month: number; year: number } {
  const now = new Date();
  if (!value) {
    return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
  }
  const parts = value.split('/');
  if (parts.length !== 3) {
    return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
  }
  return {
    day: parseInt(parts[0], 10) || now.getDate(),
    month: parseInt(parts[1], 10) || now.getMonth() + 1,
    year: parseInt(parts[2], 10) || now.getFullYear(),
  };
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function formatTwoDigits(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function WheelColumn({ data, selectedIndex, onSelect, formatItem }: {
  data: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatItem: (item: number) => string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const flatListRef = useRef<FlatList>(null);
  const isUserScroll = useRef(true);

  useEffect(() => {
    if (flatListRef.current && selectedIndex >= 0) {
      isUserScroll.current = false;
      flatListRef.current.scrollToOffset({
        offset: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
      setTimeout(() => { isUserScroll.current = true; }, 100);
    }
  }, [selectedIndex, data.length]);

  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, flex: 1 }}>
      {/* Highlight bar */}
      <View
        pointerEvents="none"
        style={[
          styles.highlightBar,
          { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)' },
        ]}
      />
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => item.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          if (!isUserScroll.current) return;
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          const clampedIdx = Math.max(0, Math.min(idx, data.length - 1));
          onSelect(clampedIdx);
        }}
        renderItem={({ item, index }) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                hapticMedium();
                onSelect(index);
                flatListRef.current?.scrollToOffset({
                  offset: index * ITEM_HEIGHT,
                  animated: true,
                });
              }}
              style={[styles.wheelItem, { height: ITEM_HEIGHT }]}
            >
              <Text style={[
                styles.wheelText,
                isDark && { color: '#9CA3AF' },
                isSelected && styles.wheelTextSelected,
                isSelected && isDark && { color: '#FFFFFF' },
              ]}>
                {formatItem(item)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

export function DatePicker({ label, value, onChange, error }: DatePickerProps) {
  const [visible, setVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const parsed = parseDateValue(value);
  const [tempDay, setTempDay] = useState(parsed.day);
  const [tempMonth, setTempMonth] = useState(parsed.month);
  const [tempYear, setTempYear] = useState(parsed.year);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const days = Array.from(
    { length: getDaysInMonth(tempMonth, tempYear) },
    (_, i) => i + 1,
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const openPicker = useCallback(() => {
    const p = parseDateValue(value);
    setTempDay(p.day);
    setTempMonth(p.month);
    setTempYear(p.year);
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
    ]).start();
  }, [value, fadeAnim, slideAnim]);

  const closePicker = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 300, duration: 150, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [fadeAnim, slideAnim]);

  const confirmDate = useCallback(() => {
    const maxDay = getDaysInMonth(tempMonth, tempYear);
    const finalDay = Math.min(tempDay, maxDay);
    const formatted = `${formatTwoDigits(finalDay)}/${formatTwoDigits(tempMonth)}/${tempYear}`;
    onChange(formatted);
    hapticMedium();
    closePicker();
  }, [tempDay, tempMonth, tempYear, onChange, closePicker]);

  const displayValue = value || 'Sélectionner une date';

  return (
    <View className="mb-4">
      <Text className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</Text>
      <TouchableOpacity
        onPress={openPicker}
        activeOpacity={0.7}
        style={[
          styles.field,
          isDark && { backgroundColor: DARK_COLORS.inputBg, borderColor: DARK_COLORS.inputBorder },
          error && styles.fieldError,
        ]}
      >
        <Calendar size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
        <Text style={[
          styles.fieldText,
          isDark && { color: DARK_COLORS.text },
          !value && styles.fieldPlaceholder,
        ]}>
          {displayValue}
        </Text>
      </TouchableOpacity>
      {error && (
        <Text className="text-sm text-red-600 dark:text-red-400 mt-1.5">{error}</Text>
      )}

      <Modal visible={visible} transparent animationType="none">
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePicker} />
          <Animated.View style={[
            styles.sheet,
            isDark && styles.sheetDark,
            { transform: [{ translateY: slideAnim }] },
          ]}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={closePicker}>
                <Text style={[styles.sheetAction, { color: '#9CA3AF' }]}>Annuler</Text>
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, isDark && { color: '#F3F4F6' }]}>Date</Text>
              <TouchableOpacity onPress={confirmDate}>
                <Text style={[styles.sheetAction, { color: '#6366F1' }]}>OK</Text>
              </TouchableOpacity>
            </View>

            {/* Wheels */}
            <View style={styles.wheelsContainer}>
              <WheelColumn
                data={days}
                selectedIndex={Math.min(tempDay - 1, days.length - 1)}
                onSelect={(idx) => setTempDay(days[idx])}
                formatItem={(d) => formatTwoDigits(d)}
              />
              <WheelColumn
                data={months}
                selectedIndex={tempMonth - 1}
                onSelect={(idx) => setTempMonth(months[idx])}
                formatItem={(m) => MONTHS[m - 1]}
              />
              <WheelColumn
                data={years}
                selectedIndex={years.indexOf(tempYear)}
                onSelect={(idx) => setTempYear(years[idx])}
                formatItem={(y) => y.toString()}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldError: {
    borderColor: '#FCA5A5',
  },
  fieldText: {
    fontSize: 16,
    color: '#111827',
  },
  fieldPlaceholder: {
    color: '#9CA3AF',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  sheetDark: {
    backgroundColor: '#1F2937',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  sheetAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  wheelsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  highlightBar: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderRadius: 10,
    zIndex: 1,
  },
  wheelItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelText: {
    fontSize: 18,
    color: '#6B7280',
  },
  wheelTextSelected: {
    fontWeight: '700',
    fontSize: 20,
    color: '#111827',
  },
});
