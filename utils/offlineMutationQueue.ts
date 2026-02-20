import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_mutation_queue';

export interface QueuedMutation {
  id: string;
  mutationName: string;
  variables: Record<string, any>;
  createdAt: number;
  retryCount: number;
}

export async function getQueue(): Promise<QueuedMutation[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addToQueue(mutation: Omit<QueuedMutation, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
  const queue = await getQueue();
  const entry: QueuedMutation = {
    ...mutation,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    retryCount: 0,
  };
  queue.push(entry);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter(m => m.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export async function updateInQueue(id: string, updates: Partial<QueuedMutation>): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map(m => m.id === id ? { ...m, ...updates } : m);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export async function getQueueLength(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
