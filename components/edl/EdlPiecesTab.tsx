import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Plus, ChevronDown, ChevronUp, Trash2, Scan } from 'lucide-react-native';
import { Card, Badge, Input, Select } from '../ui';
import type { ElementType} from '../../types';
import { ELEMENT_TYPE_LABELS } from '../../types';
import type { ElementNode, GraphQLEdge } from '../../types/graphql';
import { COLORS } from '../../utils/constants';
import { ElementCard } from './ElementCard';
import { useEdlEditContext } from '../../contexts/EdlEditContext';

const typeOptions = Object.entries(ELEMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function EdlPiecesTab() {
  const {
    localPieces,
    expandedPieces,
    togglePiece,
    isRoomAnalyzing,
    handleScanRoom,
    handleDeletePiece,
    handleAddElement,
    showAddElement,
    setShowAddElement,
    newElementName,
    setNewElementName,
    newElementType,
    setNewElementType,
    showAddPiece,
    setShowAddPiece,
    newPieceName,
    setNewPieceName,
    handleAddPiece,
    confirmAddPiece,
  } = useEdlEditContext();

  return (
    <View className="p-4">
      {/* Indicateur scan en cours */}
      {isRoomAnalyzing && (
        <View className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl p-4 mb-4 flex-row items-center">
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
                <Text className="font-semibold text-gray-900 dark:text-gray-100 mr-2">{piece.nom}</Text>
                <Badge label={`${elements.length}`} variant="gray" />
              </TouchableOpacity>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => handleScanRoom(piece)}
                  disabled={isRoomAnalyzing}
                  className={`p-2 mr-1 rounded-lg ${isRoomAnalyzing ? 'bg-gray-100 dark:bg-gray-800' : 'bg-purple-50 dark:bg-purple-900/30'}`}
                >
                  <Scan size={18} color={isRoomAnalyzing ? COLORS.gray[400] : '#9333EA'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePiece(piece.id, piece.nom)}
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
                  />
                ))}

                {/* Add element form */}
                {showAddElement === piece.id ? (
                  <View className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Text className="font-medium text-gray-900 dark:text-gray-100 mb-3">Nouvel élément</Text>
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
                        className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 items-center"
                      >
                        <Text className="text-gray-600 dark:text-gray-300 font-medium">Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleAddElement(piece.id)}
                        className="flex-1 py-2.5 rounded-lg bg-primary-600 items-center"
                      >
                        <Text className="text-white font-medium">Ajouter</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowAddElement(piece.id)}
                    className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 items-center mt-3 flex-row justify-center"
                  >
                    <Plus size={16} color={COLORS.gray[400]} />
                    <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1">Ajouter un élément</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Card>
        );
      })}

      {/* Add piece form */}
      {showAddPiece ? (
        <View className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600">
          <Text className="font-medium text-gray-900 dark:text-gray-100 mb-3">Nouvelle pièce</Text>
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
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 items-center"
            >
              <Text className="text-gray-600 dark:text-gray-300 font-medium">Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmAddPiece}
              className="flex-1 py-2.5 rounded-lg bg-primary-600 items-center"
            >
              <Text className="text-white font-medium">Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handleAddPiece}
          className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 items-center flex-row justify-center"
        >
          <Plus size={20} color={COLORS.gray[400]} />
          <Text className="text-gray-500 dark:text-gray-400 ml-2">Ajouter une pièce</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
