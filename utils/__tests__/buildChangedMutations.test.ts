import { buildChangedMutations } from '../buildChangedMutations';
import { mockPiece, mockCompteur, mockCle, mockElement } from '../../__fixtures__/edl';

type BuildParams = Parameters<typeof buildChangedMutations>[0];

// Params de base : tout identique a l'original => aucune mutation sauf EDL
function baseParams(overrides: Partial<BuildParams> = {}): BuildParams {
  return {
    edlId: '42',
    formData: {
      locataireNom: 'Jean Dupont',
      locataireEmail: 'jean@test.fr',
      locataireTelephone: '0612345678',
      autresLocataires: [],
      dateRealisation: '15/01/2025',
      observationsGenerales: '',
    },
    localPieces: [mockPiece],
    localCompteurs: [mockCompteur],
    localCles: [mockCle],
    elementStates: { [mockElement.id]: mockElement.etat },
    elementObservations: { [mockElement.id]: mockElement.observations || '' },
    elementDegradations: { [mockElement.id]: mockElement.degradations || [] },
    compteurValues: { [mockCompteur.id]: mockCompteur.indexValue || '' },
    compteurNumeros: { [mockCompteur.id]: mockCompteur.numero || '' },
    compteurComments: { [mockCompteur.id]: mockCompteur.commentaire || '' },
    cleValues: { [mockCle.id]: mockCle.nombre },
    ...overrides,
  };
}

describe('buildChangedMutations', () => {
  it('inclut toujours UPDATE_ETAT_DES_LIEUX meme sans changement', () => {
    const mutations = buildChangedMutations(baseParams());

    const edlMutations = mutations.filter(m => m.mutationName === 'UPDATE_ETAT_DES_LIEUX');
    expect(edlMutations).toHaveLength(1);
    expect(edlMutations[0].variables.input.id).toBe('/api/etat_des_lieuxes/42');
  });

  it('convertit la date via displayDateToApi dans input EDL', () => {
    const mutations = buildChangedMutations(baseParams());

    const edlInput = mutations[0].variables.input;
    // 15/01/2025 -> 2025-01-15
    expect(edlInput.dateRealisation).toBe('2025-01-15');
  });

  it('emet UPDATE_ELEMENT si etat change', () => {
    const mutations = buildChangedMutations(baseParams({
      elementStates: { [mockElement.id]: 'mauvais' },
    }));

    const elMutations = mutations.filter(m => m.mutationName === 'UPDATE_ELEMENT');
    expect(elMutations).toHaveLength(1);
    expect(elMutations[0].variables.input.etat).toBe('mauvais');
  });

  it('emet UPDATE_ELEMENT si observations changent', () => {
    const mutations = buildChangedMutations(baseParams({
      elementObservations: { [mockElement.id]: 'Nouvelles observations' },
    }));

    const elMutations = mutations.filter(m => m.mutationName === 'UPDATE_ELEMENT');
    expect(elMutations).toHaveLength(1);
    expect(elMutations[0].variables.input.observations).toBe('Nouvelles observations');
  });

  it('emet UPDATE_ELEMENT si degradations changent', () => {
    const mutations = buildChangedMutations(baseParams({
      elementDegradations: { [mockElement.id]: ['rayure', 'tache'] },
    }));

    const elMutations = mutations.filter(m => m.mutationName === 'UPDATE_ELEMENT');
    expect(elMutations).toHaveLength(1);
    expect(elMutations[0].variables.input.degradations).toEqual(['rayure', 'tache']);
  });

  it('pas de UPDATE_ELEMENT si rien ne change', () => {
    const mutations = buildChangedMutations(baseParams());

    const elMutations = mutations.filter(m => m.mutationName === 'UPDATE_ELEMENT');
    expect(elMutations).toHaveLength(0);
  });

  it('emet UPDATE_COMPTEUR si indexValue change', () => {
    const mutations = buildChangedMutations(baseParams({
      compteurValues: { [mockCompteur.id]: '99999' },
    }));

    const cptMutations = mutations.filter(m => m.mutationName === 'UPDATE_COMPTEUR');
    expect(cptMutations).toHaveLength(1);
    expect(cptMutations[0].variables.input.indexValue).toBe('99999');
  });

  it('emet UPDATE_COMPTEUR si numero change', () => {
    const mutations = buildChangedMutations(baseParams({
      compteurNumeros: { [mockCompteur.id]: 'EDF-999' },
    }));

    const cptMutations = mutations.filter(m => m.mutationName === 'UPDATE_COMPTEUR');
    expect(cptMutations).toHaveLength(1);
    expect(cptMutations[0].variables.input.numero).toBe('EDF-999');
  });

  it('pas de UPDATE_COMPTEUR si valeurs identiques', () => {
    const mutations = buildChangedMutations(baseParams());

    const cptMutations = mutations.filter(m => m.mutationName === 'UPDATE_COMPTEUR');
    expect(cptMutations).toHaveLength(0);
  });

  it('emet UPDATE_CLE si nombre change', () => {
    const mutations = buildChangedMutations(baseParams({
      cleValues: { [mockCle.id]: 5 },
    }));

    const cleMutations = mutations.filter(m => m.mutationName === 'UPDATE_CLE');
    expect(cleMutations).toHaveLength(1);
    expect(cleMutations[0].variables.input.nombre).toBe(5);
  });

  it('pas de UPDATE_CLE si nombre identique', () => {
    const mutations = buildChangedMutations(baseParams());

    const cleMutations = mutations.filter(m => m.mutationName === 'UPDATE_CLE');
    expect(cleMutations).toHaveLength(0);
  });

  it('emet UPDATE_COMPTEUR si commentaire change', () => {
    const mutations = buildChangedMutations(baseParams({
      compteurComments: { [mockCompteur.id]: 'Compteur difficile acces' },
    }));

    const cptMutations = mutations.filter(m => m.mutationName === 'UPDATE_COMPTEUR');
    expect(cptMutations).toHaveLength(1);
    expect(cptMutations[0].variables.input.commentaire).toBe('Compteur difficile acces');
  });

  it('gere plusieurs elements dans une meme piece', () => {
    const element2 = {
      ...mockElement,
      id: '/api/elements/2',
      nom: 'Mur peinture',
      etat: 'bon' as const,
      observations: '',
      degradations: [],
    };

    const pieceMulti = {
      ...mockPiece,
      elements: {
        edges: [{ node: mockElement }, { node: element2 }],
        totalCount: 2,
      },
    };

    const mutations = buildChangedMutations(baseParams({
      localPieces: [pieceMulti],
      // Element 1 : pas de changement, Element 2 : etat change
      elementStates: {
        [mockElement.id]: mockElement.etat,
        [element2.id]: 'mauvais',
      },
      elementObservations: {
        [mockElement.id]: mockElement.observations || '',
        [element2.id]: '',
      },
      elementDegradations: {
        [mockElement.id]: mockElement.degradations || [],
        [element2.id]: [],
      },
    }));

    const elMutations = mutations.filter(m => m.mutationName === 'UPDATE_ELEMENT');
    // Seul element2 a change
    expect(elMutations).toHaveLength(1);
    expect(elMutations[0].variables.input.id).toBe('/api/elements/2');
  });

  it('gere plusieurs pieces avec elements modifies dans chacune', () => {
    const element2 = {
      ...mockElement,
      id: '/api/elements/2',
      nom: 'Sol parquet',
      etat: 'bon' as const,
    };
    const piece2 = {
      ...mockPiece,
      id: '/api/pieces/2',
      nom: 'Chambre',
      elements: {
        edges: [{ node: element2 }],
        totalCount: 1,
      },
    };

    const mutations = buildChangedMutations(baseParams({
      localPieces: [mockPiece, piece2],
      elementStates: {
        [mockElement.id]: 'mauvais',
        [element2.id]: 'usage',
      },
      elementObservations: {
        [mockElement.id]: mockElement.observations || '',
        [element2.id]: element2.observations || '',
      },
      elementDegradations: {
        [mockElement.id]: mockElement.degradations || [],
        [element2.id]: element2.degradations || [],
      },
    }));

    const elMutations = mutations.filter(m => m.mutationName === 'UPDATE_ELEMENT');
    expect(elMutations).toHaveLength(2);
    const ids = elMutations.map(m => m.variables.input.id);
    expect(ids).toContain('/api/elements/1');
    expect(ids).toContain('/api/elements/2');
  });
});
