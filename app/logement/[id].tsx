import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState, useCallback } from 'react';
import { MapPin, Ruler, DoorOpen, Trash2, Edit3, Save, X } from 'lucide-react-native';
import { Header, Card, Badge, Button } from '../../components/ui';
import { GET_LOGEMENT, GET_LOGEMENTS } from '../../graphql/queries/logements';
import { UPDATE_LOGEMENT } from '../../graphql/mutations/logements';
import { DELETE_LOGEMENT } from '../../graphql/mutations/logements';
import { COLORS } from '../../utils/constants';
import { formatSurface } from '../../utils/format';
import { useToastStore } from '../../stores/toastStore';

interface LogementData {
  id: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  type?: string;
  surface?: number;
  nbPieces?: number;
  description?: string;
  etatsDesLieux?: { totalCount: number };
}

interface LogementDetailData {
  logement?: LogementData;
}

export default function LogementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { success, error: showError } = useToastStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Champs éditables
  const [editNom, setEditNom] = useState('');
  const [editAdresse, setEditAdresse] = useState('');
  const [editCodePostal, setEditCodePostal] = useState('');
  const [editVille, setEditVille] = useState('');
  const [editType, setEditType] = useState('');
  const [editSurface, setEditSurface] = useState('');
  const [editNbPieces, setEditNbPieces] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { data, refetch, loading } = useQuery<LogementDetailData>(GET_LOGEMENT, {
    variables: { id: `/api/logements/${id}` },
  });

  const [updateLogement, { loading: saving }] = useMutation(UPDATE_LOGEMENT, {
    refetchQueries: [{ query: GET_LOGEMENTS }],
  });

  const [deleteLogement] = useMutation(DELETE_LOGEMENT, {
    refetchQueries: [{ query: GET_LOGEMENTS }],
  });

  const logement = data?.logement;

  const startEditing = () => {
    if (!logement) return;
    setEditNom(logement.nom || '');
    setEditAdresse(logement.adresse || '');
    setEditCodePostal(logement.codePostal || '');
    setEditVille(logement.ville || '');
    setEditType(logement.type || '');
    setEditSurface(logement.surface ? String(logement.surface) : '');
    setEditNbPieces(logement.nbPieces ? String(logement.nbPieces) : '');
    setEditDescription(logement.description || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateLogement({
        variables: {
          input: {
            id: `/api/logements/${id}`,
            nom: editNom || undefined,
            adresse: editAdresse || undefined,
            codePostal: editCodePostal || undefined,
            ville: editVille || undefined,
            type: editType || null,
            surface: editSurface ? parseFloat(editSurface) : null,
            nbPieces: editNbPieces ? parseInt(editNbPieces, 10) : null,
            description: editDescription || null,
          },
        },
      });
      await refetch();
      setIsEditing(false);
      success('Logement mis à jour !');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer ce logement ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLogement({
                variables: { input: { id: `/api/logements/${id}` } },
              });
              success('Logement supprimé !');
              router.replace('/(tabs)/logements');
            } catch (err: unknown) {
              showError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  if (loading && !logement) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <Header title="Logement" showBack />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header
        title="Logement"
        showBack
        rightAction={
          !isEditing ? (
            <TouchableOpacity onPress={startEditing} className="p-2">
              <Edit3 size={22} color={COLORS.primary[600]} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isEditing ? (
          /* Mode édition */
          <View className="p-4">
            <Card className="mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-4">Modifier le logement</Text>

              <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-1">Nom</Text>
                <TextInput
                  value={editNom}
                  onChangeText={setEditNom}
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                  placeholder="Nom du logement"
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-1">Adresse</Text>
                <TextInput
                  value={editAdresse}
                  onChangeText={setEditAdresse}
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                  placeholder="Adresse"
                />
              </View>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Code postal</Text>
                  <TextInput
                    value={editCodePostal}
                    onChangeText={setEditCodePostal}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                    placeholder="Code postal"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Ville</Text>
                  <TextInput
                    value={editVille}
                    onChangeText={setEditVille}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                    placeholder="Ville"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-1">Type</Text>
                <TextInput
                  value={editType}
                  onChangeText={setEditType}
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                  placeholder="appartement, maison, studio..."
                />
              </View>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Surface (m²)</Text>
                  <TextInput
                    value={editSurface}
                    onChangeText={setEditSurface}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                    placeholder="50"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Nb pièces</Text>
                  <TextInput
                    value={editNbPieces}
                    onChangeText={setEditNbPieces}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                    placeholder="3"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
                <TextInput
                  value={editDescription}
                  onChangeText={setEditDescription}
                  className="border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white"
                  placeholder="Description optionnelle"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  className="flex-1 flex-row items-center justify-center py-3 border border-gray-300 rounded-xl"
                >
                  <X size={18} color={COLORS.gray[600]} />
                  <Text className="text-gray-700 font-medium ml-2">Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${saving ? 'bg-primary-400' : 'bg-primary-600'}`}
                >
                  <Save size={18} color="white" />
                  <Text className="text-white font-medium ml-2">
                    {saving ? 'Sauvegarde...' : 'Enregistrer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        ) : (
          /* Mode lecture */
          <>
            {/* Hero */}
            <View className="bg-white p-4 border-b border-gray-100">
              <View className="flex-row items-start">
                <View className="w-16 h-16 bg-primary-100 rounded-2xl items-center justify-center">
                  <Text className="text-4xl">🏠</Text>
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-xl font-bold text-gray-900">{logement?.nom}</Text>
                  <View className="flex-row items-center mt-1">
                    <MapPin size={14} color={COLORS.gray[500]} />
                    <Text className="text-gray-500 ml-1">{logement?.adresse}</Text>
                  </View>
                  <Text className="text-gray-400 text-sm">
                    {logement?.codePostal} {logement?.ville}
                  </Text>
                </View>
              </View>

              {/* Infos */}
              <View className="flex-row flex-wrap mt-4 gap-3">
                <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
                  <Ruler size={16} color={COLORS.gray[500]} />
                  <Text className="text-gray-700 ml-2 font-medium">
                    {logement?.surface ? formatSurface(logement.surface) : 'Non renseigné'}
                  </Text>
                </View>
                <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
                  <DoorOpen size={16} color={COLORS.gray[500]} />
                  <Text className="text-gray-700 ml-2 font-medium">
                    {logement?.nbPieces ? `${logement.nbPieces} pièces` : 'Non renseigné'}
                  </Text>
                </View>
                {logement?.type && (
                  <Badge label={logement.type} variant="gray" />
                )}
              </View>
            </View>

            {/* Description */}
            {logement?.description && (
              <Card className="mx-4 mt-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
                <Text className="text-gray-600">{logement.description}</Text>
              </Card>
            )}

            {/* Actions */}
            <View className="px-4 mt-6 gap-3">
              <Button
                label="Créer un état des lieux"
                onPress={() => router.push(`/edl/create?logementId=${id}`)}
                fullWidth
              />
              <TouchableOpacity
                onPress={startEditing}
                className="flex-row items-center justify-center py-3 rounded-xl border border-primary-200 bg-primary-50"
              >
                <Edit3 size={20} color={COLORS.primary[600]} />
                <Text className="text-primary-600 font-medium ml-2">Modifier le logement</Text>
              </TouchableOpacity>
            </View>

            {/* Supprimer */}
            <View className="px-4 mt-6">
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-row items-center justify-center py-4 rounded-xl border border-red-200 bg-red-50"
              >
                <Trash2 size={20} color={COLORS.red[600]} />
                <Text className="text-red-600 font-medium ml-2">Supprimer ce logement</Text>
              </TouchableOpacity>
            </View>

            <View className="h-8" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
