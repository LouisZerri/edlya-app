import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { useState, useCallback } from 'react';
import { Edit, Pen, BarChart3, Download, User, Zap, Key, DoorOpen } from 'lucide-react-native';
import { Header, Card, Badge, IconButton } from '../../../components/ui';
import { GET_ETAT_DES_LIEUX } from '../../../graphql/queries/edl';
import { STATUT_BADGE, TYPE_CONFIG, COMPTEUR_CONFIG, CLE_LABELS, ELEMENT_ETAT_LABELS } from '../../../types';
import { COLORS } from '../../../utils/constants';
import { formatDate } from '../../../utils/format';

interface EdlDetailData {
  etatDesLieux?: any;
}

export default function EdlDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch, loading } = useQuery<EdlDetailData>(GET_ETAT_DES_LIEUX, {
    variables: { id: `/api/etat_des_lieuxes/${id}` },
  });

  const edl = data?.etatDesLieux;
  const typeConfig = edl ? TYPE_CONFIG[edl.type as keyof typeof TYPE_CONFIG] : null;
  const statutBadge = edl ? STATUT_BADGE[edl.statut as keyof typeof STATUT_BADGE] : null;

  const pieces = edl?.pieces?.edges?.map((e: any) => e.node) || [];
  const compteurs = edl?.compteurs?.edges?.map((e: any) => e.node) || [];
  const cles = edl?.cles?.edges?.map((e: any) => e.node) || [];

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
            <IconButton
              icon={<Pen size={20} color="white" />}
              label="Signer"
              variant="success"
              onPress={() => router.push(`/edl/${id}/signature`)}
            />
            <IconButton
              icon={<BarChart3 size={20} color="white" />}
              label="Comparatif"
              variant="warning"
              onPress={() => router.push(`/edl/${id}/comparatif`)}
            />
            <IconButton
              icon={<Download size={20} color="white" />}
              label="PDF"
              variant="dark"
              onPress={() => {}}
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
                return (
                  <View key={compteur.id} className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[45%]">
                    <View className="flex-row items-center">
                      <Text className="text-lg">{config?.icon || '📊'}</Text>
                      <Text className="text-sm text-gray-600 ml-2">{config?.label || compteur.type}</Text>
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
        <View className="mx-4 mt-4 mb-8">
          <View className="flex-row items-center mb-3">
            <DoorOpen size={20} color={COLORS.primary[600]} />
            <Text className="text-base font-semibold text-gray-800 ml-2">
              Pieces ({pieces.length})
            </Text>
          </View>
          {pieces.map((piece: any) => {
            const elements = piece.elements?.edges?.map((e: any) => e.node) || [];
            return (
              <Card key={piece.id} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-900">{piece.nom}</Text>
                  <Badge label={`${elements.length} elements`} variant="gray" />
                </View>
                {elements.slice(0, 3).map((element: any) => (
                  <View key={element.id} className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <Text className="text-sm text-gray-600">{element.nom}</Text>
                    <Badge
                      label={ELEMENT_ETAT_LABELS[element.etat as keyof typeof ELEMENT_ETAT_LABELS] || element.etat}
                      variant={element.etat === 'bon' || element.etat === 'neuf' || element.etat === 'tres_bon' ? 'green' : element.etat === 'mauvais' || element.etat === 'hors_service' ? 'red' : 'amber'}
                    />
                  </View>
                ))}
                {elements.length > 3 && (
                  <Text className="text-xs text-gray-400 mt-2">
                    + {elements.length - 3} autres elements
                  </Text>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
