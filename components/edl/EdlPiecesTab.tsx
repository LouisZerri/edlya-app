import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Plus, ChevronDown, ChevronUp, Trash2, Scan } from 'lucide-react-native';
import { Card, Badge, Input, Select } from '../ui';
import { ElementType, ElementEtat, LocalPhoto, ELEMENT_TYPE_LABELS } from '../../types';
import { PieceNode, ElementNode, GraphQLEdge } from '../../types/graphql';
import { COLORS } from '../../utils/constants';
import { ElementCard } from './ElementCard';

const typeOptions = Object.entries(ELEMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface EdlPiecesTabProps {
  localPieces: PieceNode[];
  expandedPieces: string[];
  togglePiece: (pieceId: string) => void;
  elementStates: Record<string, ElementEtat>;
  setElementStates: React.Dispatch<React.SetStateAction<Record<string, ElementEtat>>>;
  elementObservations: Record<string, string>;
  setElementObservations: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  elementDegradations: Record<string, string[]>;
  toggleDegradation: (elementId: string, degradation: string) => void;
  addCustomDegradation: (elementId: string) => void;
  elementPhotos: Record<string, LocalPhoto[]>;
  setElementPhotos: React.Dispatch<React.SetStateAction<Record<string, LocalPhoto[]>>>;
  isAnalyzing: boolean;
  isRoomAnalyzing: boolean;
  onAnalyzeElement: (element: ElementNode) => void;
  onScanRoom: (piece: PieceNode) => void;
  onDeletePiece: (pieceId: string, nom: string) => void;
  onDeleteElement: (elementId: string, elementName: string, pieceId: string) => void;
  // Add element
  showAddElement: string | null;
  setShowAddElement: React.Dispatch<React.SetStateAction<string | null>>;
  newElementName: string;
  setNewElementName: React.Dispatch<React.SetStateAction<string>>;
  newElementType: ElementType;
  setNewElementType: React.Dispatch<React.SetStateAction<ElementType>>;
  onAddElement: (pieceId: string) => void;
  // Add piece
  showAddPiece: boolean;
  setShowAddPiece: React.Dispatch<React.SetStateAction<boolean>>;
  newPieceName: string;
  setNewPieceName: React.Dispatch<React.SetStateAction<string>>;
  onAddPiece: () => void;
  onConfirmAddPiece: () => void;
}

export function EdlPiecesTab({
  localPieces,
  expandedPieces,
  togglePiece,
  elementStates,
  setElementStates,
  elementObservations,
  setElementObservations,
  elementDegradations,
  toggleDegradation,
  addCustomDegradation,
  elementPhotos,
  setElementPhotos,
  isAnalyzing,
  isRoomAnalyzing,
  onAnalyzeElement,
  onScanRoom,
  onDeletePiece,
  onDeleteElement,
  showAddElement,
  setShowAddElement,
  newElementName,
  setNewElementName,
  newElementType,
  setNewElementType,
  onAddElement,
  showAddPiece,
  setShowAddPiece,
  newPieceName,
  setNewPieceName,
  onAddPiece,
  onConfirmAddPiece,
}: EdlPiecesTabProps) {
  return (
    <View className="p-4">
      {/* Indicateur scan en cours */}
      {isRoomAnalyzing && (
        <View className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 flex-row items-center">
          <ActivityIndicator size="small" color="#9333EA" />
          <View className="ml-3 flex-1">
            <Text className="font-medium text-purple-800">Analyse IA en cours...</Text>
            <Text className="text-purple-600 text-sm">Détection des éléments de la pièce</Text>
          </View>
        </View>
      )}

      {localPieces.map((piece) => {
        const elements = piece.elements?.edges?.map((e: GraphQLEdge<ElementNode>) => e.node) || [];
        const isExpanded = expandedPieces.includes(piece.id);

        return (
          <Card key={piece.id} className="mb-3">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => togglePiece(piece.id)}
                className="flex-row items-center flex-1"
              >
                <Text className="font-semibold text-gray-900 mr-2">{piece.nom}</Text>
                <Badge label={`${elements.length}`} variant="gray" />
              </TouchableOpacity>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => onScanRoom(piece)}
                  disabled={isRoomAnalyzing}
                  className={`p-2 mr-1 rounded-lg ${isRoomAnalyzing ? 'bg-gray-100' : 'bg-purple-50'}`}
                >
                  <Scan size={18} color={isRoomAnalyzing ? COLORS.gray[400] : '#9333EA'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDeletePiece(piece.id, piece.nom)}
                  className="p-2 mr-1"
                >
                  <Trash2 size={18} color={COLORS.red[500]} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => togglePiece(piece.id)} className="p-2">
                  {isExpanded ? (
                    <ChevronUp size={20} color={COLORS.gray[400]} />
                  ) : (
                    <ChevronDown size={20} color={COLORS.gray[400]} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {isExpanded && (
              <View className="mt-3">
                {elements.map((element: ElementNode) => (
                  <ElementCard
                    key={element.id}
                    element={element}
                    pieceId={piece.id}
                    elementStates={elementStates}
                    setElementStates={setElementStates}
                    elementObservations={elementObservations}
                    setElementObservations={setElementObservations}
                    elementDegradations={elementDegradations}
                    toggleDegradation={toggleDegradation}
                    addCustomDegradation={addCustomDegradation}
                    elementPhotos={elementPhotos}
                    setElementPhotos={setElementPhotos}
                    isAnalyzing={isAnalyzing}
                    onAnalyze={onAnalyzeElement}
                    onDelete={onDeleteElement}
                  />
                ))}

                {/* Add element form */}
                {showAddElement === piece.id ? (
                  <View className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <Text className="font-medium text-gray-900 mb-3">Nouvel élément</Text>
                    <Input
                      label="Nom *"
                      value={newElementName}
                      onChangeText={setNewElementName}
                      placeholder="Ex: Parquet, Fenêtre..."
                    />
                    <Select
                      label="Type"
                      value={newElementType}
                      options={typeOptions}
                      onChange={(value) => setNewElementType(value as ElementType)}
                    />
                    <View className="flex-row gap-2 mt-3">
                      <TouchableOpacity
                        onPress={() => {
                          setShowAddElement(null);
                          setNewElementName('');
                          setNewElementType('autre');
                        }}
                        className="flex-1 py-2.5 rounded-lg border border-gray-300 items-center"
                      >
                        <Text className="text-gray-600 font-medium">Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onAddElement(piece.id)}
                        className="flex-1 py-2.5 rounded-lg bg-primary-600 items-center"
                      >
                        <Text className="text-white font-medium">Ajouter</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowAddElement(piece.id)}
                    className="border border-dashed border-gray-300 rounded-lg p-3 items-center mt-3 flex-row justify-center"
                  >
                    <Plus size={16} color={COLORS.gray[400]} />
                    <Text className="text-gray-500 text-sm ml-1">Ajouter un élément</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Card>
        );
      })}

      {/* Add piece form */}
      {showAddPiece ? (
        <View className="p-4 bg-white rounded-xl border border-gray-200">
          <Text className="font-medium text-gray-900 mb-3">Nouvelle pièce</Text>
          <Input
            label="Nom de la pièce *"
            value={newPieceName}
            onChangeText={setNewPieceName}
            placeholder="Ex: Salon, Chambre 1..."
          />
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => {
                setShowAddPiece(false);
                setNewPieceName('');
              }}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 items-center"
            >
              <Text className="text-gray-600 font-medium">Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirmAddPiece}
              className="flex-1 py-2.5 rounded-lg bg-primary-600 items-center"
            >
              <Text className="text-white font-medium">Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onAddPiece}
          className="border border-dashed border-gray-300 rounded-xl p-4 items-center flex-row justify-center"
        >
          <Plus size={20} color={COLORS.gray[400]} />
          <Text className="text-gray-500 ml-2">Ajouter une pièce</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
