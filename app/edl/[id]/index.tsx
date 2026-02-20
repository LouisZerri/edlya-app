import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState, useCallback } from 'react';
import { Edit, Pen, BarChart3, Download, User, Zap, Key, DoorOpen, Trash2, Camera, CheckCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react-native';
import { Header, Card, Badge, IconButton, RemoteThumbnail } from '../../../components/ui';
import { GET_ETAT_DES_LIEUX, GET_ETATS_DES_LIEUX } from '../../../graphql/queries/edl';
import { DELETE_ETAT_DES_LIEUX } from '../../../graphql/mutations/edl';
import { STATUT_BADGE, TYPE_CONFIG, COMPTEUR_CONFIG, CLE_LABELS, ELEMENT_ETAT_LABELS } from '../../../types';
import { COLORS } from '../../../utils/constants';
import { formatDate } from '../../../utils/format';
import { useToastStore } from '../../../stores/toastStore';
import { usePdfExport } from '../../../hooks/usePdfExport';

import { GetEdlDetailData, PieceNode, CompteurNode, CleNode, ElementNode, PhotoNode, GraphQLEdge } from '../../../types/graphql';
import { BASE_URL, UPLOADS_URL } from '../../../utils/constants';

function photoUrl(chemin: string): string {
  if (chemin?.startsWith('http')) return chemin;
  if (chemin?.startsWith('/')) return `${BASE_URL}${chemin}`;
  return `${UPLOADS_URL}/${chemin}`;
}

function getEtatVariant(etat: string): 'green' | 'red' | 'amber' {
  if (etat === 'bon' || etat === 'neuf' || etat === 'tres_bon') return 'green';
  if (etat === 'mauvais' || etat === 'hors_service') return 'red';
  return 'amber';
}

export default function EdlDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { success, error: showError } = useToastStore();
  const { isExporting, exportPdf } = usePdfExport();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPieces, setExpandedPieces] = useState<string[]>([]);

  const { data, refetch, loading } = useQuery<GetEdlDetailData>(GET_ETAT_DES_LIEUX, {
    variables: { id: `/api/etat_des_lieuxes/${id}` },
    fetchPolicy: 'network-only',
  });

  const [deleteEdl] = useMutation(DELETE_ETAT_DES_LIEUX, {
    refetchQueries: [{ query: GET_ETATS_DES_LIEUX }],
  });

  const handleDelete = () => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer cet état des lieux ? Cette action est irréversible.',
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
              success('État des lieux supprimé !');
              router.replace('/(tabs)/edl');
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
              showError(msg);
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const togglePiece = useCallback((pieceId: string) => {
    setExpandedPieces(prev =>
      prev.includes(pieceId) ? prev.filter(p => p !== pieceId) : [...prev, pieceId]
    );
  }, []);

  const edl = data?.etatDesLieux;
  const typeConfig = edl ? TYPE_CONFIG[edl.type as keyof typeof TYPE_CONFIG] : null;
  const statutBadge = edl ? STATUT_BADGE[edl.statut as keyof typeof STATUT_BADGE] : null;

  const pieces = edl?.pieces?.edges?.map((e: GraphQLEdge<PieceNode>) => e.node) || [];
  const compteurs = edl?.compteurs?.edges?.map((e: GraphQLEdge<CompteurNode>) => e.node) || [];
  const cles = edl?.cles?.edges?.map((e: GraphQLEdge<CleNode>) => e.node) || [];

  const totalPhotos = pieces.reduce((acc: number, piece: PieceNode) => {
    const elements = piece.elements?.edges?.map((e: GraphQLEdge<ElementNode>) => e.node) || [];
    return acc + elements.reduce((elAcc: number, el: ElementNode) => {
      return elAcc + (el.photos?.edges?.length || 0);
    }, 0);
  }, 0) + compteurs.reduce((acc: number, c: CompteurNode) => {
    return acc + (Array.isArray(c.photos) ? c.photos.length : 0);
  }, 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  if (loading && !edl) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
        <Header title="État des lieux" showBack />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 dark:text-gray-400">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <Header title="État des lieux" showBack />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero */}
        <View className="bg-white dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-700">
          <View className="flex-row items-start">
            <View className={`w-14 h-14 rounded-xl items-center justify-center ${typeConfig?.bg || 'bg-gray-100'}`}>
              <Text className="text-3xl">{typeConfig?.icon || '📋'}</Text>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">{edl?.logement?.nom}</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                {edl?.logement?.adresse}, {edl?.logement?.ville}
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                <Badge label={typeConfig?.label || edl?.type || ''} variant={edl?.type === 'entree' ? 'blue' : 'orange'} />
                <Badge label={statutBadge?.label || edl?.statut || ''} variant={statutBadge?.variant || 'gray'} />
              </View>
            </View>
          </View>
          {/* Stats */}
          <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center">
              <DoorOpen size={14} color={COLORS.gray[400]} />
              <Text className="text-sm text-gray-500 dark:text-gray-400 ml-1">{pieces.length} pièces</Text>
            </View>
            <View className="flex-row items-center">
              <Camera size={14} color={COLORS.gray[400]} />
              <Text className="text-sm text-gray-500 dark:text-gray-400 ml-1">{totalPhotos} photos</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
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
            <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 ml-2">Locataire</Text>
          </View>
          <Text className="font-medium text-gray-900 dark:text-gray-100">{edl?.locataireNom}</Text>
          {edl?.locataireEmail && (
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{edl.locataireEmail}</Text>
          )}
          {edl?.locataireTelephone && (
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{edl.locataireTelephone}</Text>
          )}
          <Text className="text-sm text-gray-400 mt-2">
            Date: {edl?.dateRealisation ? formatDate(edl.dateRealisation) : '-'}
          </Text>
        </Card>

        {/* Signatures */}
        {(edl?.signatureBailleur || edl?.signatureLocataire) && (
          <Card className="mx-4 mt-4">
            <View className="flex-row items-center mb-3">
              <Pen size={20} color={COLORS.green[600]} />
              <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 ml-2">Signatures</Text>
            </View>
            <View className="space-y-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600 dark:text-gray-300">Bailleur</Text>
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
                <Text className="text-gray-600 dark:text-gray-300">Locataire</Text>
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
              <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 ml-2">Compteurs</Text>
            </View>
            {compteurs.map((compteur: CompteurNode, index: number) => {
              const config = COMPTEUR_CONFIG[compteur.type as keyof typeof COMPTEUR_CONFIG];
              const compteurPhotos = Array.isArray(compteur.photos) ? compteur.photos.length : 0;
              return (
                <View
                  key={compteur.id}
                  className={`bg-gray-50 dark:bg-gray-900 rounded-xl p-3 ${index > 0 ? 'mt-2' : ''}`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 items-center justify-center">
                        <Text className="text-base">{config?.icon || '📊'}</Text>
                      </View>
                      <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200 ml-2">{config?.label || compteur.type}</Text>
                    </View>
                    {compteurPhotos > 0 && (
                      <View className="flex-row items-center bg-white dark:bg-gray-800 rounded-full px-2 py-0.5">
                        <Camera size={10} color={COLORS.gray[500]} />
                        <Text className="text-xs text-gray-500 dark:text-gray-400 ml-0.5">{compteurPhotos}</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-baseline mt-2 gap-4">
                    <View className="flex-1">
                      <Text className="text-sm text-gray-400">Relevé</Text>
                      <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {compteur.indexValue || <Text className="text-gray-300 dark:text-gray-500 font-normal text-sm">Non relevé</Text>}
                      </Text>
                    </View>
                    {compteur.numero && (
                      <View className="flex-1">
                        <Text className="text-sm text-gray-400">N° compteur</Text>
                        <Text className="text-sm text-gray-700 dark:text-gray-300">{compteur.numero}</Text>
                      </View>
                    )}
                  </View>
                  {compteur.commentaire && (
                    <View className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <Text className="text-sm text-gray-500 dark:text-gray-400 italic">{compteur.commentaire}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </Card>
        )}

        {/* Clés */}
        {cles.length > 0 && (
          <Card className="mx-4 mt-4">
            <View className="flex-row items-center mb-3">
              <Key size={20} color={COLORS.gray[600]} />
              <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 ml-2">Clés</Text>
            </View>
            {cles.map((cle: CleNode, index: number) => (
              <View
                key={cle.id}
                className={`flex-row items-center justify-between py-2.5 ${index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}
              >
                <View className="flex-1">
                  <Text className="text-gray-800 dark:text-gray-200">
                    {CLE_LABELS[cle.type as keyof typeof CLE_LABELS] || cle.type}
                  </Text>
                  {cle.commentaire && (
                    <Text className="text-sm text-gray-400 mt-0.5">{cle.commentaire}</Text>
                  )}
                </View>
                <Badge label={`x${cle.nombre}`} variant="gray" />
              </View>
            ))}
          </Card>
        )}

        {/* Pièces */}
        <View className="mx-4 mt-4">
          <View className="flex-row items-center mb-3">
            <DoorOpen size={20} color={COLORS.primary[600]} />
            <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 ml-2">
              Pièces ({pieces.length})
            </Text>
          </View>
          {pieces.map((piece: PieceNode) => {
            const elements = piece.elements?.edges?.map((e: GraphQLEdge<ElementNode>) => e.node) || [];
            const piecePhotos = elements.reduce((acc: number, el: ElementNode) => {
              return acc + (el.photos?.edges?.length || 0);
            }, 0);
            const isExpanded = expandedPieces.includes(piece.id);
            const displayedElements = isExpanded ? elements : elements.slice(0, 3);
            const hasMore = elements.length > 3;

            return (
              <Card key={piece.id} className="mb-3">
                {/* Header pièce — cliquable */}
                <TouchableOpacity
                  onPress={() => togglePiece(piece.id)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <Text className="font-semibold text-gray-900 dark:text-gray-100">{piece.nom}</Text>
                    <View className="flex-row items-center gap-1.5 ml-2">
                      {piecePhotos > 0 && (
                        <View className="flex-row items-center bg-primary-50 rounded-full px-1.5 py-0.5">
                          <Camera size={10} color={COLORS.primary[500]} />
                          <Text className="text-xs text-primary-600 ml-0.5">{piecePhotos}</Text>
                        </View>
                      )}
                      <Badge label={`${elements.length}`} variant="gray" />
                    </View>
                  </View>
                  {hasMore && (
                    isExpanded
                      ? <ChevronUp size={18} color={COLORS.gray[400]} />
                      : <ChevronDown size={18} color={COLORS.gray[400]} />
                  )}
                </TouchableOpacity>

                {/* Éléments */}
                {displayedElements.map((element: ElementNode) => {
                  const photos = element.photos?.edges?.map((e: GraphQLEdge<PhotoNode>) => e.node) || [];
                  const hasObservations = !!element.observations;
                  const hasDegradations = Array.isArray(element.degradations) && element.degradations.length > 0;

                  return (
                    <View key={element.id} className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-gray-700 dark:text-gray-300 flex-1">{element.nom}</Text>
                        <Badge
                          label={ELEMENT_ETAT_LABELS[element.etat as keyof typeof ELEMENT_ETAT_LABELS] || element.etat}
                          variant={getEtatVariant(element.etat)}
                        />
                      </View>
                      {hasObservations && (
                        <Text className="text-sm text-gray-400 mt-1 italic">{element.observations}</Text>
                      )}
                      {hasDegradations && (
                        <View className="flex-row flex-wrap gap-1 mt-1">
                          {element.degradations!.map((deg, i) => (
                            <View key={i} className="bg-red-50 dark:bg-red-900/30 rounded px-1.5 py-0.5">
                              <Text className="text-xs text-red-600">{deg}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {isExpanded && photos.length > 0 && (
                        <View className="flex-row flex-wrap gap-1.5 mt-2">
                          {photos.map((photo) => (
                            <RemoteThumbnail
                              key={photo.id}
                              source={{ uri: photoUrl(photo.chemin) }}
                              size={44}
                              borderRadius={8}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Bouton voir plus / voir moins */}
                {hasMore && !isExpanded && (
                  <TouchableOpacity
                    onPress={() => togglePiece(piece.id)}
                    className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-800"
                  >
                    <Text className="text-xs text-primary-600 text-center font-medium">
                      Voir les {elements.length - 3} autres éléments
                    </Text>
                  </TouchableOpacity>
                )}
                {hasMore && isExpanded && (
                  <TouchableOpacity
                    onPress={() => togglePiece(piece.id)}
                    className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-800"
                  >
                    <Text className="text-xs text-primary-600 text-center font-medium">
                      Réduire
                    </Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          })}
        </View>

        {/* Observations générales */}
        {edl?.observationsGenerales && (
          <Card className="mx-4 mt-2">
            <View className="flex-row items-center mb-2">
              <MessageSquare size={18} color={COLORS.gray[500]} />
              <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 ml-2">Observations</Text>
            </View>
            <Text className="text-sm text-gray-600 dark:text-gray-300">{edl.observationsGenerales}</Text>
          </Card>
        )}

        {/* Supprimer */}
        <View className="mx-4 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleDelete}
            className="flex-row items-center justify-center py-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800"
          >
            <Trash2 size={20} color={COLORS.red[600]} />
            <Text className="text-red-600 font-medium ml-2">Supprimer cet état des lieux</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
