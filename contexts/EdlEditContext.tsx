import { createContext, useContext } from 'react';
import { ElementEtat, ElementType, LocalPhoto , CleType, CompteurType } from '../types';
import { PieceNode, CompteurNode, CleNode, ElementNode } from '../types/graphql';
import { EdlFormData } from '../hooks/useEdlInitializer';
import { AutoSaveStatus } from '../hooks/useEdlAutoSave';

export interface EdlEditContextValue {
  // State (useEdlInitializer)
  formData: EdlFormData;
  setFormData: React.Dispatch<React.SetStateAction<EdlFormData>>;
  localPieces: PieceNode[];
  localCompteurs: CompteurNode[];
  localCles: CleNode[];
  compteurValues: Record<string, string>;
  setCompteurValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  compteurNumeros: Record<string, string>;
  setCompteurNumeros: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  compteurComments: Record<string, string>;
  setCompteurComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  compteurPhotos: Record<string, LocalPhoto[]>;
  setCompteurPhotos: React.Dispatch<React.SetStateAction<Record<string, LocalPhoto[]>>>;
  cleValues: Record<string, number>;
  setCleValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  elementStates: Record<string, ElementEtat>;
  setElementStates: React.Dispatch<React.SetStateAction<Record<string, ElementEtat>>>;
  elementObservations: Record<string, string>;
  setElementObservations: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  elementDegradations: Record<string, string[]>;
  elementPhotos: Record<string, LocalPhoto[]>;
  setElementPhotos: React.Dispatch<React.SetStateAction<Record<string, LocalPhoto[]>>>;

  // Pièces
  expandedPieces: string[];
  togglePiece: (pieceId: string) => void;
  toggleDegradation: (elementId: string, degradation: string) => void;
  addCustomDegradation: (elementId: string) => void;

  // Mutations (useEdlMutations)
  saving: boolean;
  handleSave: () => void;
  handleAddPiece: () => void;
  confirmAddPiece: () => void;
  handleAddCompteur: (type: CompteurType) => void;
  handleAddCle: (type: CleType) => void;
  handleDeletePiece: (pieceId: string, nom: string) => void;
  handleDeleteCompteur: (compteurId: string, label: string) => void;
  handleDeleteCle: (cleId: string, label: string) => void;
  handleDeleteClePhoto: (cleId: string) => void;
  handleAddElement: (pieceId: string) => void;
  handleDeleteElement: (elementId: string, elementName: string, pieceId: string) => void;
  showAddPiece: boolean;
  setShowAddPiece: React.Dispatch<React.SetStateAction<boolean>>;
  newPieceName: string;
  setNewPieceName: React.Dispatch<React.SetStateAction<string>>;
  showAddElement: string | null;
  setShowAddElement: React.Dispatch<React.SetStateAction<string | null>>;
  newElementName: string;
  setNewElementName: React.Dispatch<React.SetStateAction<string>>;
  newElementType: ElementType;
  setNewElementType: React.Dispatch<React.SetStateAction<ElementType>>;

  // AI (useEdlAiAnalysis)
  isAnalyzing: boolean;
  isRoomAnalyzing: boolean;
  handleAnalyzeElement: (element: ElementNode) => void;
  handleScanRoom: (piece: PieceNode) => void;

  // Auto-save
  autoSaveStatus: AutoSaveStatus;
}

const EdlEditContext = createContext<EdlEditContextValue | null>(null);

export const EdlEditProvider = EdlEditContext.Provider;

export function useEdlEditContext(): EdlEditContextValue {
  const ctx = useContext(EdlEditContext);
  if (!ctx) throw new Error('useEdlEditContext must be used within EdlEditProvider');
  return ctx;
}
