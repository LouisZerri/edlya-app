export interface User {
  id: string;
  email: string;
  name: string;
  telephone?: string;
  role: 'admin' | 'agent' | 'bailleur';
  entreprise?: string;
}

export interface Logement {
  id: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  type?: string;
  surface?: number;
  nbPieces?: number;
  description?: string;
  photoPrincipale?: string;
  createdAt: string;
}

export type EdlType = 'entree' | 'sortie';
export type EdlStatut = 'brouillon' | 'en_cours' | 'termine' | 'signe';

export interface EtatDesLieux {
  id: string;
  logement: Logement;
  type: EdlType;
  dateRealisation: string;
  locataireNom: string;
  locataireEmail?: string;
  locataireTelephone?: string;
  observationsGenerales?: string;
  statut: EdlStatut;
  signatureBailleur?: string;
  signatureLocataire?: string;
  dateSignatureBailleur?: string;
  dateSignatureLocataire?: string;
  pieces: Piece[];
  compteurs: Compteur[];
  cles: Cle[];
  createdAt: string;
}

export interface Piece {
  id: string;
  nom: string;
  ordre: number;
  observations?: string;
  elements: Element[];
}

export type ElementType =
  | 'sol'
  | 'mur'
  | 'plafond'
  | 'menuiserie'
  | 'electricite'
  | 'plomberie'
  | 'chauffage'
  | 'equipement'
  | 'mobilier'
  | 'electromenager'
  | 'autre';

export type ElementEtat =
  | 'neuf'
  | 'tres_bon'
  | 'bon'
  | 'usage'
  | 'mauvais'
  | 'hors_service';

export interface Element {
  id: string;
  type: ElementType;
  nom: string;
  etat: ElementEtat;
  observations?: string;
  degradations?: string[];
  photos: Photo[];
}

export interface Photo {
  id: string;
  chemin: string;
  legende?: string;
  latitude?: number;
  longitude?: number;
  ordre: number;
}

export type PhotoUploadStatus = 'pending' | 'uploading' | 'uploaded' | 'error';

export interface LocalPhoto {
  id: string;                // UUID temporaire
  localUri: string;          // file://...
  remoteId?: string;         // ID API apres upload
  remoteUrl?: string;        // URL API apres upload
  legende?: string;
  latitude?: number;
  longitude?: number;
  ordre: number;
  uploadStatus: PhotoUploadStatus;
  uploadProgress?: number;   // 0-100
  errorMessage?: string;
}

export type CompteurType = 'electricite' | 'eau_froide' | 'eau_chaude' | 'gaz';

export interface Compteur {
  id: string;
  type: CompteurType;
  numero?: string;
  indexValue?: string;
  commentaire?: string;
  photos?: string[];
}

export type CleType =
  | 'porte_entree'
  | 'boite_lettres'
  | 'cave'
  | 'garage'
  | 'parking'
  | 'local_velo'
  | 'portail'
  | 'interphone'
  | 'badge'
  | 'telecommande'
  | 'autre';

export interface Cle {
  id: string;
  type: CleType;
  nombre: number;
  commentaire?: string;
  photo?: string;
}

export interface UserStats {
  totalLogements: number;
  edlCeMois: number;
}

export type BadgeVariant = 'gray' | 'amber' | 'green' | 'red' | 'blue' | 'orange';

export const STATUT_BADGE: Record<EdlStatut, { variant: BadgeVariant; label: string }> = {
  brouillon: { variant: 'gray', label: 'Brouillon' },
  en_cours: { variant: 'amber', label: 'En cours' },
  termine: { variant: 'blue', label: 'Termine' },
  signe: { variant: 'green', label: 'Signe' },
};

export const TYPE_CONFIG: Record<EdlType, { icon: string; bg: string; label: string }> = {
  entree: { icon: '📥', bg: 'bg-blue-100', label: 'Entree' },
  sortie: { icon: '📤', bg: 'bg-orange-100', label: 'Sortie' },
};

export const COMPTEUR_CONFIG: Record<CompteurType, { icon: string; label: string }> = {
  electricite: { icon: '⚡', label: 'Electricite' },
  eau_froide: { icon: '💧', label: 'Eau froide' },
  eau_chaude: { icon: '🔥', label: 'Eau chaude' },
  gaz: { icon: '🔵', label: 'Gaz' },
};

export const CLE_LABELS: Record<CleType, string> = {
  porte_entree: 'Porte entree',
  boite_lettres: 'Boite aux lettres',
  cave: 'Cave',
  garage: 'Garage',
  parking: 'Parking',
  local_velo: 'Local velo',
  portail: 'Portail',
  interphone: 'Interphone',
  badge: 'Badge',
  telecommande: 'Telecommande',
  autre: 'Autre',
};

export const ELEMENT_TYPE_LABELS: Record<ElementType, string> = {
  sol: 'Sol',
  mur: 'Mur',
  plafond: 'Plafond',
  menuiserie: 'Menuiserie',
  electricite: 'Electricite',
  plomberie: 'Plomberie',
  chauffage: 'Chauffage',
  equipement: 'Equipement',
  mobilier: 'Mobilier',
  electromenager: 'Electromenager',
  autre: 'Autre',
};

export const ELEMENT_ETAT_LABELS: Record<ElementEtat, string> = {
  neuf: 'Neuf',
  tres_bon: 'Tres bon',
  bon: 'Bon',
  usage: 'Usage',
  mauvais: 'Mauvais',
  hors_service: 'Hors service',
};
