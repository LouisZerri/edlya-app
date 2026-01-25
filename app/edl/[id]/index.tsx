import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState, useCallback } from 'react';
import { Edit, Pen, BarChart3, Download, User, Zap, Key, DoorOpen, Trash2, Camera, CheckCircle } from 'lucide-react-native';
import { Header, Card, Badge, IconButton } from '../../../components/ui';
import { GET_ETAT_DES_LIEUX, GET_ETATS_DES_LIEUX } from '../../../graphql/queries/edl';
import { DELETE_ETAT_DES_LIEUX } from '../../../graphql/mutations/edl';
import { STATUT_BADGE, TYPE_CONFIG, COMPTEUR_CONFIG, CLE_LABELS, ELEMENT_ETAT_LABELS } from '../../../types';
import { COLORS } from '../../../utils/constants';
import { formatDate } from '../../../utils/format';
import { useToastStore } from '../../../stores/toastStore';
import { usePdfExport } from '../../../hooks/usePdfExport';

interface EdlDetailData {
  etatDesLieux?: any;
}

export default function EdlDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { success, error: showError } = useToastStore();
  const { isExporting, exportPdf } = usePdfExport();
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch, loading } = useQuery<EdlDetailData>(GET_ETAT_DES_LIEUX, {
    variables: { id: `/api/etat_des_lieuxes/${id}` },
    fetchPolicy: 'network-only',
  });

  const [deleteEdl] = useMutation(DELETE_ETAT_DES_LIEUX, {
    refetchQueries: [{ query: GET_ETATS_DES_LIEUX }],
  });

  const handleDelete = () => {
    Alert.alert(
      'Supprimer',
      'Etes-vous sur de vouloir supprimer cet etat des lieux ? Cette action est irreversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEdl({
                variables: { input: { id: `/api/etat_des_lieuxes/${id}` } },
              });
              success('Etat des lieux supprime !');
              router.replace('/(tabs)/edl');
            } catch (err: any) {
              showError(err.message || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  // Recharger les données quand on revient sur la page
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const edl = data?.etatDesLieux;
  const typeConfig = edl ? TYPE_CONFIG[edl.type as keyof typeof TYPE_CONFIG] : null;
  const statutBadge = edl ? STATUT_BADGE[edl.statut as keyof typeof STATUT_BADGE] : null;

  const pieces = edl?.pieces?.edges?.map((e: any) => e.node) || [];
  const compteurs = edl?.compteurs?.edges?.map((e: any) => e.node) || [];
  const cles = edl?.cles?.edges?.map((e: any) => e.node) || [];

  // Calcul du total de photos
  const totalPhotos = pieces.reduce((acc: number, piece: any) => {
    const elements = piece.elements?.edges?.map((e: any) => e.node) || [];
    return acc + elements.reduce((elAcc: number, el: any) => {
      return elAcc + (el.photos?.edges?.length || 0);
    }, 0);
  }, 0) + compteurs.reduce((acc: number, c: any) => {
    return acc + (Array.isArray(c.photos) ? c.photos.length : 0);
  }, 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  if (loading && !edl) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <Header title="Etat des lieux" showBack />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header title="Etat des lieux" showBack />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero */}
        <View className="bg-white p-4 border-b border-gray-100">
          <View className="flex-row items-start">
            <View className={`w-14 h-14 rounded-xl items-center justify-center ${typeConfig?.bg || 'bg-gray-100'}`}>
              <Text className="text-3xl">{typeConfig?.icon || '📋'}</Text>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-bold text-gray-900">{edl?.logement?.nom}</Text>
              <Text className="text-gray-500 text-sm mt-0.5">
                {edl?.logement?.adresse}, {edl?.logement?.ville}
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                <Badge label={typeConfig?.label || edl?.type} variant={edl?.type === 'entree' ? 'blue' : 'orange'} />
                <Badge label={statutBadge?.label || edl?.statut} variant={statutBadge?.variant || 'gray'} />
              </View>
            </View>
          </View>
          {/* Stats */}
          <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <View className="flex-row items-center">
              <DoorOpen size={14} color={COLORS.gray[400]} />
              <Text className="text-sm text-gray-500 ml-1">{pieces.length} pièces</Text>
            </View>
            <View className="flex-row items-center">
              <Camera size={14} color={COLORS.gray[400]} />
              <Text className="text-sm text-gray-500 ml-1">{totalPhotos} photos</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <View className="flex-row justify-around">
            <IconButton
              icon={<Edit size={20} color="white" />}
              label="Modifier"
              variant="primary"
              onPress={() => router.push(`/edl/${id}/edit`)}
            />
            {edl?.statut !== 'signe' && (
              <IconButton
                icon={<Pen size={20} color="white" />}
                label="Signer"
                variant="success"
                onPress={() => router.push(`/edl/${id}/signature`)}
              />
            )}
            {edl?.type === 'sortie' && (
              <IconButton
                icon={<BarChart3 size={20} color="white" />}
                label="Comparatif"
                variant="warning"
                onPress={() => router.push(`/edl/${id}/comparatif`)}
              />
            )}
            <IconButton
              icon={<Download size={20} color="white" />}
              label={isExporting ? '...' : 'PDF'}
              variant="dark"
              onPress={() => id && exportPdf(id, 'edl')}
            />
          </View>
        </View>

        {/* Locataire */}
        <Card className="mx-4 mt-4">
          <View className="flex-row items-center mb-3">
            <User size={20} color={COLORS.primary[600]} />
            <Text className="text-base font-semibold text-gray-800 ml-2">Locataire</Text>
          </View>
          <Text className="font-medium text-gray-900">{edl?.locataireNom}</Text>
          {edl?.locataireEmail && (
            <Text className="text-sm text-gray-500 mt-1">{edl.locataireEmail}</Text>
          )}
          {edl?.locataireTelephone && (
            <Text className="text-sm text-gray-500 mt-0.5">{edl.locataireTelephone}</Text>
          )}
          <Text className="text-xs text-gray-400 mt-2">
            Date: {formatDate(edl?.dateRealisation)}
          </Text>
        </Card>

        {/* Signatures */}
        {(edl?.signatureBailleur || edl?.signatureLocataire) && (
          <Card className="mx-4 mt-4">
            <View className="flex-row items-center mb-3">
              <Pen size={20} color={COLORS.green[600]} />
              <Text className="text-base font-semibold text-gray-800 ml-2">Signatures</Text>
            </View>
            <View className="space-y-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600">Bailleur</Text>
                {edl?.signatureBailleur ? (
                  <View className="flex-row items-center">
                    <CheckCircle size={16} color={COLORS.green[600]} />
                    <Text className="text-green-600 text-sm ml-1">
                      {edl?.dateSignatureBailleur ? formatDate(edl.dateSignatureBailleur) : 'Signé'}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-400 text-sm">En attente</Text>
                )}
              </View>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-gray-600">Locataire</Text>
                {edl?.signatureLocataire ? (
                  <View className="flex-row items-center">
                    <CheckCircle size={16} color={COLORS.green[600]} />
                    <Text className="text-green-600 text-sm ml-1">
                      {edl?.dateSignatureLocataire ? formatDate(edl.dateSignatureLocataire) : 'Signé'}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-400 text-sm">En attente</Text>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Compteurs */}
        {compteurs.length > 0 && (
          <Card className="mx-4 mt-4">
            <View className="flex-row items-center mb-3">
              <Zap size={20} color={COLORS.amber[500]} />
              <Text className="text-base font-semibold text-gray-800 ml-2">Compteurs</Text>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {compteurs.map((compteur: any) => {
                const config = COMPTEUR_CONFIG[compteur.type as keyof typeof COMPTEUR_CONFIG];
                const compteurPhotos = Array.isArray(compteur.photos) ? compteur.photos.length : 0;
                return (
                  <View key={compteur.id} className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[45%]">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Text className="text-lg">{config?.icon || '📊'}</Text>
                        <Text className="text-sm text-gray-600 ml-2">{config?.label || compteur.type}</Text>
                      </View>
                      {compteurPhotos > 0 && (
                        <View className="flex-row items-center bg-white rounded-full px-1.5 py-0.5">
                          <Camera size={10} color={COLORS.gray[500]} />
                          <Text className="text-xs text-gray-500 ml-0.5">{compteurPhotos}</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-lg font-bold text-gray-900 mt-1">
                      {compteur.indexValue || '-'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Cles */}
        {cles.length > 0 && (
          <Card className="mx-4 mt-4">
            <View className="flex-row items-center mb-3">
              <Key size={20} color={COLORS.gray[600]} />
              <Text className="text-base font-semibold text-gray-800 ml-2">Cles</Text>
            </View>
            {cles.map((cle: any) => (
              <View key={cle.id} className="flex-row items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <Text className="text-gray-700">
                  {CLE_LABELS[cle.type as keyof typeof CLE_LABELS] || cle.type}
                </Text>
                <Badge label={`x${cle.nombre}`} variant="gray" />
              </View>
            ))}
          </Card>
        )}

        {/* Pieces */}
        <View className="mx-4 mt-4">
          <View className="flex-row items-center mb-3">
            <DoorOpen size={20} color={COLORS.primary[600]} />
            <Text className="text-base font-semibold text-gray-800 ml-2">
              Pieces ({pieces.length})
            </Text>
          </View>
          {pieces.map((piece: any) => {
            const elements = piece.elements?.edges?.map((e: any) => e.node) || [];
            const totalPhotos = elements.reduce((acc: number, el: any) => {
              return acc + (el.photos?.edges?.length || 0);
            }, 0);
            return (
              <Card key={piece.id} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-900">{piece.nom}</Text>
                  <View className="flex-row items-center gap-2">
                    {totalPhotos > 0 && (
                      <View className="flex-row items-center bg-primary-50 rounded-full px-2 py-0.5">
                        <Camera size={12} color={COLORS.primary[500]} />
                        <Text className="text-xs text-primary-600 ml-1">{totalPhotos}</Text>
                      </View>
                    )}
                    <Badge label={`${elements.length} elements`} variant="gray" />
                  </View>
                </View>
                {elements.slice(0, 3).map((element: any) => {
                  const photoCount = element.photos?.edges?.length || 0;
                  return (
                    <View key={element.id} className="mt-2 pt-2 border-t border-gray-50">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-gray-600 flex-1">{element.nom}</Text>
                        <View className="flex-row items-center gap-2">
                          {photoCount > 0 && (
                            <View className="flex-row items-center bg-gray-100 rounded-full px-2 py-0.5">
                              <Camera size={12} color={COLORS.gray[500]} />
                              <Text className="text-xs text-gray-500 ml-1">{photoCount}</Text>
                            </View>
                          )}
                          <Badge
                            label={ELEMENT_ETAT_LABELS[element.etat as keyof typeof ELEMENT_ETAT_LABELS] || element.etat}
                            variant={element.etat === 'bon' || element.etat === 'neuf' || element.etat === 'tres_bon' ? 'green' : element.etat === 'mauvais' || element.etat === 'hors_service' ? 'red' : 'amber'}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
                {elements.length > 3 && (
                  <Text className="text-xs text-gray-400 mt-2">
                    + {elements.length - 3} autres elements
                  </Text>
                )}
              </Card>
            );
          })}
        </View>

        {/* Supprimer */}
        <View className="mx-4 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleDelete}
            className="flex-row items-center justify-center py-4 rounded-xl border border-red-200 bg-red-50"
          >
            <Trash2 size={20} color={COLORS.red[600]} />
            <Text className="text-red-600 font-medium ml-2">Supprimer cet etat des lieux</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
