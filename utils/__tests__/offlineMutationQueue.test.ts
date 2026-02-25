import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getQueue,
  addToQueue,
  removeFromQueue,
  updateInQueue,
  getQueueLength,
  clearQueue,
} from '../offlineMutationQueue';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('offlineMutationQueue', () => {
  it('getQueue retourne [] si AsyncStorage vide', async () => {
    const queue = await getQueue();
    expect(queue).toEqual([]);
  });

  it('addToQueue ajoute avec id auto, createdAt et retryCount=0', async () => {
    await addToQueue({
      mutationName: 'UPDATE_ELEMENT',
      variables: { input: { id: '/api/elements/1', etat: 'bon' } },
    });

    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toMatch(/^queue_/);
    expect(queue[0].createdAt).toBeGreaterThan(0);
    expect(queue[0].retryCount).toBe(0);
    expect(queue[0].mutationName).toBe('UPDATE_ELEMENT');
  });

  it('addToQueue accumule plusieurs mutations', async () => {
    await addToQueue({
      mutationName: 'UPDATE_ELEMENT',
      variables: { input: { id: '/api/elements/1' } },
    });
    await addToQueue({
      mutationName: 'UPDATE_COMPTEUR',
      variables: { input: { id: '/api/compteurs/1' } },
    });

    const queue = await getQueue();
    expect(queue).toHaveLength(2);
    expect(queue[0].mutationName).toBe('UPDATE_ELEMENT');
    expect(queue[1].mutationName).toBe('UPDATE_COMPTEUR');
  });

  it('removeFromQueue supprime par id et garde les autres', async () => {
    await addToQueue({
      mutationName: 'UPDATE_ELEMENT',
      variables: { input: { id: '/api/elements/1' } },
    });
    await addToQueue({
      mutationName: 'UPDATE_COMPTEUR',
      variables: { input: { id: '/api/compteurs/1' } },
    });

    const queue = await getQueue();
    await removeFromQueue(queue[0].id);

    const updated = await getQueue();
    expect(updated).toHaveLength(1);
    expect(updated[0].mutationName).toBe('UPDATE_COMPTEUR');
  });

  it('updateInQueue met a jour un champ', async () => {
    await addToQueue({
      mutationName: 'UPDATE_CLE',
      variables: { input: { id: '/api/cles/1' } },
    });

    const queue = await getQueue();
    await updateInQueue(queue[0].id, { retryCount: 3 });

    const updated = await getQueue();
    expect(updated[0].retryCount).toBe(3);
  });

  it('getQueueLength retourne le bon count', async () => {
    expect(await getQueueLength()).toBe(0);

    await addToQueue({
      mutationName: 'UPDATE_ELEMENT',
      variables: { input: { id: '/api/elements/1' } },
    });
    await addToQueue({
      mutationName: 'UPDATE_ELEMENT',
      variables: { input: { id: '/api/elements/2' } },
    });

    expect(await getQueueLength()).toBe(2);
  });

  it('clearQueue vide tout', async () => {
    await addToQueue({
      mutationName: 'UPDATE_ELEMENT',
      variables: { input: { id: '/api/elements/1' } },
    });
    await addToQueue({
      mutationName: 'UPDATE_CLE',
      variables: { input: { id: '/api/cles/1' } },
    });

    await clearQueue();

    const queue = await getQueue();
    expect(queue).toEqual([]);
  });
});
