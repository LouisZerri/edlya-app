import { apolloClient } from '../graphql/client';
import { MUTATION_MAP } from '../graphql/mutations/mutationMap';
import { getQueue, removeFromQueue, updateInQueue, QueuedMutation } from './offlineMutationQueue';

const BACKOFF_DELAYS = [1000, 2000, 5000, 15000, 30000];
const MAX_RETRIES = 5;

type SyncListener = (remaining: number) => void;
const listeners: Set<SyncListener> = new Set();

let isSyncing = false;

export function onSyncProgress(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(remaining: number) {
  listeners.forEach(fn => fn(remaining));
}

async function executeMutation(entry: QueuedMutation): Promise<boolean> {
  const mutation = MUTATION_MAP[entry.mutationName];
  if (!mutation) {
    // Unknown mutation — remove from queue to avoid infinite loop
    await removeFromQueue(entry.id);
    return true;
  }

  try {
    await apolloClient.mutate({ mutation, variables: entry.variables });
    await removeFromQueue(entry.id);
    return true;
  } catch {
    const newRetryCount = entry.retryCount + 1;
    if (newRetryCount >= MAX_RETRIES) {
      // Max retries reached — remove from queue
      await removeFromQueue(entry.id);
      return true;
    }
    await updateInQueue(entry.id, { retryCount: newRetryCount });
    // Wait with exponential backoff
    const delay = BACKOFF_DELAYS[Math.min(newRetryCount - 1, BACKOFF_DELAYS.length - 1)];
    await new Promise(resolve => setTimeout(resolve, delay));
    return false;
  }
}

export async function processQueue(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    let queue = await getQueue();
    notifyListeners(queue.length);

    for (const entry of queue) {
      const success = await executeMutation(entry);
      if (success) {
        queue = await getQueue();
        notifyListeners(queue.length);
      } else {
        // Retry failed — re-fetch queue and continue
        queue = await getQueue();
        notifyListeners(queue.length);
      }
    }
  } finally {
    isSyncing = false;
    const remaining = await getQueue();
    notifyListeners(remaining.length);
  }
}

export function isSyncInProgress(): boolean {
  return isSyncing;
}
