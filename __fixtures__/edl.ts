import type { PieceNode, CompteurNode, CleNode, ElementNode } from '../types/graphql';

export const mockElement: ElementNode = {
  id: '/api/elements/1',
  nom: 'Sol carrelage',
  type: 'sol',
  etat: 'bon',
  observations: 'Quelques rayures',
  degradations: ['rayure'],
  photos: { edges: [], totalCount: 0 },
};

export const mockPiece: PieceNode = {
  id: '/api/pieces/1',
  nom: 'Salon',
  ordre: 1,
  elements: {
    edges: [{ node: mockElement }],
    totalCount: 1,
  },
};

export const mockCompteur: CompteurNode = {
  id: '/api/compteurs/1',
  type: 'electricite',
  numero: 'EDF-123',
  indexValue: '45230',
  commentaire: '',
};

export const mockCle: CleNode = {
  id: '/api/cles/1',
  type: 'porte_entree',
  nombre: 2,
  commentaire: '',
};
