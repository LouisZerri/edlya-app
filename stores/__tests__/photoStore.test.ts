import { usePhotoStore } from '../photoStore';
import type { LocalPhoto } from '../../types';

function makePhoto(overrides: Partial<LocalPhoto> = {}): LocalPhoto {
  return {
    id: 'photo-1',
    localUri: 'file:///mock/photo1.jpg',
    ordre: 1,
    uploadStatus: 'pending',
    ...overrides,
  };
}

function resetStore() {
  usePhotoStore.setState({
    photosByElement: {},
    uploadQueue: [],
    isUploading: false,
  });
}

beforeEach(() => {
  resetStore();
});

describe('photoStore', () => {
  it('addPhoto puis getPhotosForElement retourne la photo', () => {
    const photo = makePhoto();
    usePhotoStore.getState().addPhoto('el-1', photo);

    const photos = usePhotoStore.getState().getPhotosForElement('el-1');
    expect(photos).toHaveLength(1);
    expect(photos[0].id).toBe('photo-1');
  });

  it('removePhoto supprime et reordonne les photos restantes', () => {
    const p1 = makePhoto({ id: 'p1', ordre: 1 });
    const p2 = makePhoto({ id: 'p2', ordre: 2, localUri: 'file:///mock/photo2.jpg' });
    const p3 = makePhoto({ id: 'p3', ordre: 3, localUri: 'file:///mock/photo3.jpg' });

    const store = usePhotoStore.getState();
    store.addPhoto('el-1', p1);
    store.addPhoto('el-1', p2);
    store.addPhoto('el-1', p3);

    usePhotoStore.getState().removePhoto('el-1', 'p2');

    const photos = usePhotoStore.getState().getPhotosForElement('el-1');
    expect(photos).toHaveLength(2);
    expect(photos[0].id).toBe('p1');
    expect(photos[0].ordre).toBe(1);
    expect(photos[1].id).toBe('p3');
    expect(photos[1].ordre).toBe(2); // reordonne: 3 -> 2
  });

  it('removePhoto retire aussi de uploadQueue', () => {
    const photo = makePhoto({ id: 'p1' });
    const store = usePhotoStore.getState();
    store.addPhoto('el-1', photo);
    store.addToUploadQueue('p1');

    expect(usePhotoStore.getState().uploadQueue).toContain('p1');

    usePhotoStore.getState().removePhoto('el-1', 'p1');

    expect(usePhotoStore.getState().uploadQueue).not.toContain('p1');
  });

  it('setUploadStatus uploaded => efface errorMessage, met progress=100', () => {
    const photo = makePhoto({ id: 'p1', uploadStatus: 'error', errorMessage: 'timeout' });
    usePhotoStore.getState().addPhoto('el-1', photo);

    usePhotoStore.getState().setUploadStatus('el-1', 'p1', 'uploaded');

    const photos = usePhotoStore.getState().getPhotosForElement('el-1');
    expect(photos[0].uploadStatus).toBe('uploaded');
    expect(photos[0].uploadProgress).toBe(100);
    expect(photos[0].errorMessage).toBeUndefined();
  });

  it('setUploadStatus error => conserve errorMessage', () => {
    const photo = makePhoto({ id: 'p1' });
    usePhotoStore.getState().addPhoto('el-1', photo);

    usePhotoStore.getState().setUploadStatus('el-1', 'p1', 'error', 'Serveur indisponible');

    const photos = usePhotoStore.getState().getPhotosForElement('el-1');
    expect(photos[0].uploadStatus).toBe('error');
    expect(photos[0].errorMessage).toBe('Serveur indisponible');
  });

  it('getPendingUploads retourne les photos pending et error uniquement', () => {
    const store = usePhotoStore.getState();
    store.addPhoto('el-1', makePhoto({ id: 'p1', uploadStatus: 'pending' }));
    store.addPhoto('el-1', makePhoto({ id: 'p2', uploadStatus: 'uploaded' }));
    store.addPhoto('el-1', makePhoto({ id: 'p3', uploadStatus: 'error' }));
    store.addPhoto('el-1', makePhoto({ id: 'p4', uploadStatus: 'uploading' }));

    const pending = usePhotoStore.getState().getPendingUploads('el-1');
    const ids = pending.map(p => p.id);
    expect(ids).toEqual(['p1', 'p3']);
  });

  it('clearPhotosForElement supprime toutes les photos d un element', () => {
    const store = usePhotoStore.getState();
    store.addPhoto('el-1', makePhoto({ id: 'p1' }));
    store.addPhoto('el-1', makePhoto({ id: 'p2' }));
    store.addPhoto('el-2', makePhoto({ id: 'p3' }));

    usePhotoStore.getState().clearPhotosForElement('el-1');

    expect(usePhotoStore.getState().getPhotosForElement('el-1')).toEqual([]);
    // el-2 non touche
    expect(usePhotoStore.getState().getPhotosForElement('el-2')).toHaveLength(1);
  });

  it('initPhotosForElement initialise sans ecraser les autres elements', () => {
    const store = usePhotoStore.getState();
    store.addPhoto('el-1', makePhoto({ id: 'p1' }));

    const importedPhotos = [
      makePhoto({ id: 'p10', ordre: 1 }),
      makePhoto({ id: 'p11', ordre: 2 }),
    ];
    usePhotoStore.getState().initPhotosForElement('el-2', importedPhotos);

    // el-1 toujours la
    expect(usePhotoStore.getState().getPhotosForElement('el-1')).toHaveLength(1);
    // el-2 initialise
    expect(usePhotoStore.getState().getPhotosForElement('el-2')).toHaveLength(2);
  });
});
