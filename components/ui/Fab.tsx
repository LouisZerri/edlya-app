import { TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { hapticLight } from '../../utils/haptics';

interface FabProps {
  onPress: () => void;
}

export function Fab({ onPress }: FabProps) {
  return (
    <TouchableOpacity
      onPress={() => { hapticLight(); onPress(); }}
      activeOpacity={0.8}
      className="absolute bottom-6 right-5 w-14 h-14 bg-primary-600 rounded-full items-center justify-center"
      style={{
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Plus size={26} color="#ffffff" />
    </TouchableOpacity>
  );
}
