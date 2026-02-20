import { useState, useEffect, useRef } from 'react';
import { ElementEtat, LocalPhoto } from '../types';
import { PieceNode, CompteurNode, CleNode, EdlNode, GraphQLEdge, ElementNode, PhotoNode } from '../types/graphql';
import { BASE_URL, UPLOADS_URL } from '../utils/constants';
import { apiDateToDisplay } from '../utils/format';

export interface EdlFormData {
  locataireNom: string;
  locataireEmail: string;
  locataireTelephone: string;
  dateRealisation: string;
  observationsGenerales: string;
}

export interface EdlInitializerState {
  formData: EdlFormData;
  setFormData: React.Dispatch<React.SetStateAction<EdlFormData>>;
  localPieces: PieceNode[];
  setLocalPieces: React.Dispatch<React.SetStateAction<PieceNode[]>>;
  localCompteurs: CompteurNode[];
  setLocalCompteurs: React.Dispatch<React.SetStateAction<CompteurNode[]>>;
  localCles: CleNode[];
  setLocalCles: React.Dispatch<React.SetStateAction<CleNode[]>>;
  compteurValues: Record<string, string>;
  setCompteurValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  compteurNumeros: Record<string, string>;
  setCompteurNumeros: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  compteurComments: Record<string, string>;
  setCompteurComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  cleValues: Record<string, number>;
  setCleValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  elementStates: Record<string, ElementEtat>;
  setElementStates: React.Dispatch<React.SetStateAction<Record<string, ElementEtat>>>;
  elementObservations: Record<string, string>;
  setElementObservations: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  elementDegradations: Record<string, string[]>;
  setElementDegradations: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  elementPhotos: Record<string, LocalPhoto[]>;
  setElementPhotos: React.Dispatch<React.SetStateAction<Record<string, LocalPhoto[]>>>;
  compteurPhotos: Record<string, LocalPhoto[]>;
  setCompteurPhotos: React.Dispatch<React.SetStateAction<Record<string, LocalPhoto[]>>>;
}

function buildPhotoUrl(chemin: string): string {
  if (chemin?.startsWith('http')) return chemin;
  if (chemin?.startsWith('/')) return `${BASE_URL}${chemin}`;
  return `${UPLOADS_URL}/${chemin}`;
}

export function useEdlInitializer(edl: EdlNode | undefined): EdlInitializerState {
  const [formData, setFormData] = useState<EdlFormData>({
    locataireNom: '',
    locataireEmail: '',
    locataireTelephone: '',
    dateRealisation: '',
    observationsGenerales: '',
  });

  const [localPieces, setLocalPieces] = useState<PieceNode[]>([]);
  const [localCompteurs, setLocalCompteurs] = useState<CompteurNode[]>([]);
  const [localCles, setLocalCles] = useState<CleNode[]>([]);
  const [compteurValues, setCompteurValues] = useState<Record<string, string>>({});
  const [compteurNumeros, setCompteurNumeros] = useState<Record<string, string>>({});
  const [compteurComments, setCompteurComments] = useState<Record<string, string>>({});
  const [cleValues, setCleValues] = useState<Record<string, number>>({});
  const [elementStates, setElementStates] = useState<Record<string, ElementEtat>>({});
  const [elementObservations, setElementObservations] = useState<Record<string, string>>({});
  const [elementDegradations, setElementDegradations] = useState<Record<string, string[]>>({});
  const [elementPhotos, setElementPhotos] = useState<Record<string, LocalPhoto[]>>({});
  const [compteurPhotos, setCompteurPhotos] = useState<Record<string, LocalPhoto[]>>({});

  // Only initialize state ONCE from server data.
  // Subsequent edl changes (from Apollo cache updates after auto-save)
  // must NOT overwrite local state, or locally-added photos get lost.
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!edl || isInitialized.current) return;
    isInitialized.current = true;

    const pieces = edl.pieces?.edges?.map((e: GraphQLEdge<PieceNode>) => e.node) || [];
    const compteurs = edl.compteurs?.edges?.map((e: GraphQLEdge<CompteurNode>) => e.node) || [];
    const cles = edl.cles?.edges?.map((e: GraphQLEdge<CleNode>) => e.node) || [];

    setLocalPieces(pieces);
    setLocalCompteurs(compteurs);
    setLocalCles(cles);

    setFormData({
      locataireNom: edl.locataireNom || '',
      locataireEmail: edl.locataireEmail || '',
      locataireTelephone: edl.locataireTelephone || '',
      dateRealisation: apiDateToDisplay(edl.dateRealisation),
      observationsGenerales: edl.observationsGenerales || '',
    });

    // Initialize compteur values
    const cValues: Record<string, string> = {};
    const cNumeros: Record<string, string> = {};
    const cComments: Record<string, string> = {};
    compteurs.forEach((c) => {
      cValues[c.id] = c.indexValue || '';
      cNumeros[c.id] = c.numero || '';
      cComments[c.id] = c.commentaire || '';
    });
    setCompteurValues(cValues);
    setCompteurNumeros(cNumeros);
    setCompteurComments(cComments);

    // Initialize cle values
    const clValues: Record<string, number> = {};
    cles.forEach((c) => {
      clValues[c.id] = c.nombre || 0;
    });
    setCleValues(clValues);

    // Initialize element states, observations, degradations, and photos
    const eStates: Record<string, ElementEtat> = {};
    const eObservations: Record<string, string> = {};
    const eDegradations: Record<string, string[]> = {};
    const ePhotos: Record<string, LocalPhoto[]> = {};

    pieces.forEach((p) => {
      const elements = p.elements?.edges?.map((e: GraphQLEdge<ElementNode>) => e.node) || [];
      elements.forEach((el) => {
        eStates[el.id] = el.etat;
        eObservations[el.id] = el.observations || '';
        eDegradations[el.id] = Array.isArray(el.degradations) ? el.degradations : [];

        const photos = el.photos?.edges?.map((pe: GraphQLEdge<PhotoNode>) => pe.node) || [];
        if (photos.length > 0) {
          ePhotos[el.id] = photos.map((photo, index) => ({
            id: photo.id,
            localUri: buildPhotoUrl(photo.chemin),
            remoteId: photo.id,
            remoteUrl: photo.chemin,
            legende: photo.legende,
            ordre: index + 1,
            uploadStatus: 'uploaded' as const,
          }));
        }
      });
    });
    setElementStates(eStates);
    setElementObservations(eObservations);
    setElementDegradations(eDegradations);
    setElementPhotos(ePhotos);

    // Initialize compteur photos (JSON array format)
    const cPhotos: Record<string, LocalPhoto[]> = {};
    compteurs.forEach((c) => {
      const photos = c.photos || [];
      if (photos.length > 0) {
        cPhotos[c.id] = photos.map((photo, index) => {
          const chemin = typeof photo === 'string' ? photo : photo.chemin;
          const legende = typeof photo === 'object' ? photo.legende : undefined;
          return {
            id: `${c.id}_photo_${index}`,
            localUri: buildPhotoUrl(chemin),
            remoteId: `${c.id}_photo_${index}`,
            remoteUrl: chemin,
            legende,
            ordre: index + 1,
            uploadStatus: 'uploaded' as const,
          };
        });
      }
    });
    setCompteurPhotos(cPhotos);
  }, [edl]);

  return {
    formData, setFormData,
    localPieces, setLocalPieces,
    localCompteurs, setLocalCompteurs,
    localCles, setLocalCles,
    compteurValues, setCompteurValues,
    compteurNumeros, setCompteurNumeros,
    compteurComments, setCompteurComments,
    cleValues, setCleValues,
    elementStates, setElementStates,
    elementObservations, setElementObservations,
    elementDegradations, setElementDegradations,
    elementPhotos, setElementPhotos,
    compteurPhotos, setCompteurPhotos,
  };
}
