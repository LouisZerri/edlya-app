import type { LogementNode } from '../types/graphql';

export const mockLogement: LogementNode = {
  id: '/api/logements/1',
  nom: 'Appart T3 Centre',
  adresse: '12 rue de la Paix',
  codePostal: '75001',
  ville: 'Paris',
  type: 'appartement',
  surface: 65,
  nbPieces: 3,
  createdAt: '2025-01-15T10:00:00+00:00',
};

export const mockLogements: LogementNode[] = [
  mockLogement,
  {
    id: '/api/logements/2',
    nom: 'Studio Belleville',
    adresse: '5 boulevard de Belleville',
    codePostal: '75020',
    ville: 'Paris',
    type: 'studio',
    surface: 25,
    nbPieces: 1,
    createdAt: '2025-02-01T14:30:00+00:00',
  },
  {
    id: '/api/logements/3',
    nom: 'Maison Lyon',
    adresse: '8 avenue Jean Jaurès',
    codePostal: '69007',
    ville: 'Lyon',
    type: 'maison',
    surface: 120,
    nbPieces: 5,
    createdAt: '2025-03-10T09:00:00+00:00',
  },
];
