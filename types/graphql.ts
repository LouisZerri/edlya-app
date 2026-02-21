import { ElementType, ElementEtat, EdlType, EdlStatut, CompteurType, CleType } from './index';

// Generic GraphQL connection types
export interface GraphQLEdge<T> {
  node: T;
  cursor?: string;
}

export interface GraphQLPageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
}

export interface GraphQLConnection<T> {
  edges: GraphQLEdge<T>[];
  totalCount?: number;
  pageInfo?: GraphQLPageInfo;
}

// Node types (as returned by GraphQL API)
export interface PhotoNode {
  id: string;
  chemin: string;
  legende?: string;
  latitude?: number;
  longitude?: number;
  ordre: number;
}

export interface ElementNode {
  id: string;
  nom: string;
  type: ElementType;
  etat: ElementEtat;
  observations?: string;
  degradations?: string[];
  photos: GraphQLConnection<PhotoNode>;
}

export interface PieceNode {
  id: string;
  nom: string;
  ordre: number;
  observations?: string;
  elements: GraphQLConnection<ElementNode>;
}

export interface CompteurNode {
  id: string;
  type: CompteurType;
  numero?: string;
  indexValue?: string;
  commentaire?: string;
  photos?: Array<string | { chemin: string; legende?: string }>;
}

export interface CleNode {
  id: string;
  type: CleType;
  nombre: number;
  commentaire?: string;
  photo?: string;
}

export interface LogementNode {
  id: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  type?: string;
  surface?: number;
  nbPieces?: number;
  photoPrincipale?: string;
  createdAt: string;
}

export interface EdlNode {
  id: string;
  type: EdlType;
  statut: EdlStatut;
  dateRealisation: string;
  locataireNom: string;
  locataireEmail?: string;
  locataireTelephone?: string;
  observationsGenerales?: string;
  signatureBailleur?: string;
  signatureLocataire?: string;
  dateSignatureBailleur?: string;
  dateSignatureLocataire?: string;
  logement?: LogementNode;
  pieces: GraphQLConnection<PieceNode>;
  compteurs: GraphQLConnection<CompteurNode>;
  cles: GraphQLConnection<CleNode>;
  createdAt: string;
}

// Query response types
export interface GetEdlDetailData {
  etatDesLieux?: EdlNode;
}

export interface GetEdlListData {
  etatDesLieuxes?: GraphQLConnection<EdlNode>;
}

export interface GetLogementsData {
  logements: GraphQLConnection<LogementNode>;
}

// Mutation response types
export interface CreatePieceData {
  createPiece: { piece: PieceNode };
}

export interface CreateElementData {
  createElement: { element: ElementNode };
}

export interface CreateCompteurData {
  createCompteur: { compteur: CompteurNode };
}

export interface CreateCleData {
  createCle: { cle: CleNode };
}

export interface CreateLogementData {
  createLogement: { logement: LogementNode };
}
