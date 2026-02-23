import { View, Text } from 'react-native';
import { Card } from '../ui';
import { BarChart3 } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';

interface DayActivity {
  date: string;
  count: number;
}

interface ActivityChartProps {
  data: DayActivity[];
}

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return DAY_LABELS[d.getDay()];
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

const BAR_MAX_HEIGHT = 40;
const CHART_HEIGHT = BAR_MAX_HEIGHT + 16;

export function ActivityChart({ data }: ActivityChartProps) {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <View className="px-4 mt-5">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <BarChart3 size={18} color={COLORS.primary[600]} />
          <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">Activité</Text>
        </View>
        <Text className="text-sm text-gray-400 dark:text-gray-500">
          {total} EDL · 14j
        </Text>
      </View>

      <Card>
        {/* Chart area */}
        <View style={{ height: CHART_HEIGHT }} className="flex-row items-end">
          {data.map((day) => {
            const barHeight = day.count > 0
              ? Math.max(6, Math.round((day.count / maxCount) * BAR_MAX_HEIGHT))
              : 3;
            const today = isToday(day.date);
            const hasActivity = day.count > 0;

            return (
              <View key={day.date} className="flex-1 items-center justify-end" style={{ height: CHART_HEIGHT }}>
                <View
                  style={{
                    height: barHeight,
                    width: 10,
                    borderRadius: 5,
                    backgroundColor: hasActivity
                      ? (today ? COLORS.primary[600] : COLORS.primary[300])
                      : (today ? COLORS.gray[300] : COLORS.gray[200]),
                  }}
                />
              </View>
            );
          })}
        </View>

        {/* Day labels */}
        <View className="flex-row mt-2">
          {data.map((day) => {
            const today = isToday(day.date);
            return (
              <View key={day.date} className="flex-1 items-center">
                <Text
                  style={{ fontSize: 9 }}
                  className={today ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-gray-400 dark:text-gray-500'}
                >
                  {getDayLabel(day.date)}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}
