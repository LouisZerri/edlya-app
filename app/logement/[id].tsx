import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Ruler, DoorOpen, Trash2, Edit3, Save, X, Home, Plus, FileText, ChevronRight, Calendar } from 'lucide-react-native';
import { Header, Card, Badge, Input, Select, Button, AddressAutocomplete } from '../../components/ui';
import { GET_LOGEMENT, GET_LOGEMENTS } from '../../graphql/queries/logements';
import { UPDATE_LOGEMENT, DELETE_LOGEMENT } from '../../graphql/mutations/logements';
import { COLORS } from '../../utils/constants';
import { formatSurface, formatDate } from '../../utils/format';
import { STATUT_BADGE, TYPE_CONFIG, EdlType, EdlStatut } from '../../types';
import { useToastStore } from '../../stores/toastStore';

const TYPE_OPTIONS = [
  { value: '', label: 'Non renseigné' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'studio', label: 'Studio' },
  { value: 'loft', label: 'Loft' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'parking', label: 'Parking' },
  { value: 'autre', label: 'Autre' },
];

interface EdlNode {
  id: string;
  type: string;
  statut: string;
  dateRealisation: string;
  locataireNom: string;
  locataireEmail?: string;
  locataireTelephone?: string;
}

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
  etatDesLieux?: {
    totalCount: number;
    edges: Array<{ node: EdlNode }>;
  };
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

  // Page entrance animation
  const pageOpacity = useRef(new Animated.Value(0)).current;
  const pageSlide = useRef(new Animated.Value(30)).current;
  const hasAnimated = useRef(false);

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
    fetchPolicy: 'cache-and-network',
  });

  const [updateLogement, { loading: saving }] = useMutation(UPDATE_LOGEMENT, {
    refetchQueries: [{ query: GET_LOGEMENTS }],
  });

  const [deleteLogement] = useMutation(DELETE_LOGEMENT, {
    refetchQueries: [{ query: GET_LOGEMENTS }],
  });

  const logement = data?.logement;

  // Trigger page animation when data arrives
  useEffect(() => {
    if (logement && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.parallel([
        Animated.timing(pageOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(pageSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [logement]);

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
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
        <Header title="Logement" showBack />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 dark:text-gray-400">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const edlCount = logement?.etatDesLieux?.totalCount || 0;
  const edlList = logement?.etatDesLieux?.edges?.map(e => e.node) || [];
  const typeLabel = TYPE_OPTIONS.find(o => o.value === logement?.type)?.label || logement?.type;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
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

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        style={{ opacity: pageOpacity, transform: [{ translateY: pageSlide }] }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isEditing ? (
          /* Mode édition */
          <View className="p-4">
            <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-1 tracking-wide">INFORMATIONS</Text>
            <Card className="mb-5">
              <Input
                label="Nom du logement"
                value={editNom}
                onChangeText={setEditNom}
                placeholder="Ex: Appartement Rue de la Paix"
              />
              <AddressAutocomplete
                label="Adresse"
                value={editAdresse}
                onChangeText={setEditAdresse}
                onSelect={(suggestion) => {
                  setEditAdresse(suggestion.adresse);
                  setEditCodePostal(suggestion.codePostal);
                  setEditVille(suggestion.ville);
                }}
                placeholder="12 rue de la Paix"
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Code postal"
                    value={editCodePostal}
                    onChangeText={setEditCodePostal}
                    placeholder="75001"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Ville"
                    value={editVille}
                    onChangeText={setEditVille}
                    placeholder="Paris"
                  />
                </View>
              </View>
            </Card>

            <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-1 tracking-wide">CARACTÉRISTIQUES</Text>
            <Card className="mb-5">
              <Select
                label="Type de bien"
                value={editType}
                options={TYPE_OPTIONS}
                onChange={setEditType}
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label="Surface (m²)"
                    value={editSurface}
                    onChangeText={setEditSurface}
                    placeholder="50"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Nombre de pièces"
                    value={editNbPieces}
                    onChangeText={setEditNbPieces}
                    placeholder="3"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Input
                label="Description"
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Notes, particularités du logement..."
                multiline
                numberOfLines={3}
              />
            </Card>

            {/* Actions édition */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="flex-1 flex-row items-center justify-center py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl"
              >
                <X size={18} color={COLORS.gray[500]} />
                <Text className="text-gray-600 dark:text-gray-300 font-medium ml-2">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className={`flex-1 flex-row items-center justify-center py-3.5 rounded-xl ${saving ? 'bg-primary-400' : 'bg-primary-600'}`}
              >
                <Save size={18} color="white" />
                <Text className="text-white font-semibold ml-2">
                  {saving ? 'Sauvegarde...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Mode lecture */
          <>
            {/* Hero */}
            <View className="bg-white dark:bg-gray-900 px-4 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <View className="flex-row items-center">
                <View
                  className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl items-center justify-center"
                >
                  <Home size={28} color={COLORS.primary[600]} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">{logement?.nom}</Text>
                  <View className="flex-row items-center mt-1">
                    <MapPin size={14} color={COLORS.gray[400]} />
                    <Text className="text-gray-500 dark:text-gray-400 ml-1 text-sm flex-1" numberOfLines={1}>
                      {logement?.adresse}, {logement?.codePostal} {logement?.ville}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats */}
              <View className="flex-row mt-4 gap-2">
                {logement?.surface ? (
                  <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                    <Ruler size={15} color={COLORS.primary[500]} />
                    <Text className="text-gray-700 dark:text-gray-300 ml-1.5 text-sm font-medium">
                      {formatSurface(logement.surface)}
                    </Text>
                  </View>
                ) : null}
                {logement?.nbPieces ? (
                  <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                    <DoorOpen size={15} color={COLORS.primary[500]} />
                    <Text className="text-gray-700 dark:text-gray-300 ml-1.5 text-sm font-medium">
                      {logement.nbPieces} pièce{logement.nbPieces > 1 ? 's' : ''}
                    </Text>
                  </View>
                ) : null}
                {typeLabel ? (
                  <View className="bg-primary-50 dark:bg-primary-900/30 px-3 py-2 rounded-lg">
                    <Text className="text-primary-700 dark:text-primary-300 text-sm font-medium">{typeLabel}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View className="p-4">
              {/* Description */}
              {logement?.description ? (
                <>
                  <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-1 tracking-wide">DESCRIPTION</Text>
                  <Card className="mb-5">
                    <Text className="text-gray-600 dark:text-gray-300 leading-5">{logement.description}</Text>
                  </Card>
                </>
              ) : null}

              {/* EDL liés */}
              <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-1 tracking-wide">
                ÉTATS DES LIEUX ({edlCount})
              </Text>
              {edlCount > 0 ? (
                edlList.map((edl, index) => {
                  const edlId = edl.id.split('/').pop();
                  const typeConfig = TYPE_CONFIG[edl.type as EdlType];
                  const statutBadge = STATUT_BADGE[edl.statut as EdlStatut];
                  return (
                    <Card key={edl.id} className={index < edlList.length - 1 ? 'mb-2' : 'mb-5'}>
                      <TouchableOpacity
                        onPress={() => router.push(`/edl/${edlId}`)}
                        className="flex-row items-center"
                      >
                        <View className={`w-10 h-10 rounded-xl items-center justify-center ${typeConfig?.bg || 'bg-gray-100'}`}>
                          <Text className="text-lg">{typeConfig?.icon || '📋'}</Text>
                        </View>
                        <View className="flex-1 ml-3">
                          <View className="flex-row items-center gap-2">
                            <Text className="font-medium text-gray-800 dark:text-gray-200 flex-1" numberOfLines={1}>
                              {edl.locataireNom}
                            </Text>
                            <Badge label={statutBadge?.label || edl.statut} variant={statutBadge?.variant || 'gray'} />
                          </View>
                          <View className="flex-row items-center mt-1 gap-2">
                            <Badge label={typeConfig?.label || edl.type} variant={edl.type === 'entree' ? 'blue' : 'orange'} />
                            <View className="flex-row items-center">
                              <Calendar size={12} color={COLORS.gray[400]} />
                              <Text className="text-sm text-gray-400 ml-1">{formatDate(edl.dateRealisation)}</Text>
                            </View>
                          </View>
                        </View>
                        <ChevronRight size={20} color={COLORS.gray[400]} />
                      </TouchableOpacity>
                    </Card>
                  );
                })
              ) : (
                <Card className="mb-5">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center">
                      <FileText size={20} color={COLORS.gray[400]} />
                    </View>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 ml-3">Aucun EDL pour ce logement</Text>
                  </View>
                </Card>
              )}

              {/* Actions */}
              <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-1 tracking-wide">ACTIONS</Text>
              <Card className="mb-5">
                <TouchableOpacity
                  onPress={() => router.push(`/edl/create?logementId=${id}`)}
                  className="flex-row items-center py-1"
                >
                  <View className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-full items-center justify-center">
                    <Plus size={20} color={COLORS.green[600]} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-medium text-gray-800 dark:text-gray-200">Créer un état des lieux</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">Nouveau EDL pour ce logement</Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
              </Card>

              {/* Zone danger */}
              <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-1 tracking-wide">ZONE DANGER</Text>
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-row items-center justify-center py-4 rounded-xl bg-red-50 dark:bg-red-900/20"
              >
                <Trash2 size={20} color={COLORS.red[600]} />
                <Text className="text-red-600 font-semibold ml-2">Supprimer ce logement</Text>
              </TouchableOpacity>
            </View>

            <View className="h-4" />
          </>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
