import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStore {
  isConnected: boolean;
  initialize: () => () => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  isConnected: true,
  initialize: () => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      set({ isConnected: state.isConnected ?? false });
    });
    return unsubscribe;
  },
}));
