import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { useState, useCallback } from 'react';
import { MapPin, Ruler, DoorOpen, Calendar } from 'lucide-react-native';
import { Header, Card, Badge, Button } from '../../components/ui';
import { GET_LOGEMENT } from '../../graphql/queries/logements';
import { STATUT_BADGE, TYPE_CONFIG } from '../../types';
import { COLORS } from '../../utils/constants';
import { formatDate, formatSurface } from '../../utils/format';

interface LogementDetailData {
  logement?: any;
}

export default function LogementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch, loading } = useQuery<LogementDetailData>(GET_LOGEMENT, {
    variables: { id: `/api/logements/${id}` },
  });

  const logement = data?.logement;
  const edls = logement?.etatsDesLieux?.edges?.map((e: any) => e.node) || [];

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
      <Header title="Logement" showBack />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
          <View className="flex-row mt-4 gap-4">
            {logement?.surface && (
              <View className="flex-row items-center">
                <Ruler size={16} color={COLORS.gray[400]} />
                <Text className="text-gray-600 ml-1">{formatSurface(logement.surface)}</Text>
              </View>
            )}
            {logement?.nbPieces && (
              <View className="flex-row items-center">
                <DoorOpen size={16} color={COLORS.gray[400]} />
                <Text className="text-gray-600 ml-1">{logement.nbPieces} pieces</Text>
              </View>
            )}
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

        {/* Etats des lieux */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">Etats des lieux</Text>
            <Button
              label="Nouvel EDL"
              variant="secondary"
              onPress={() => router.push(`/edl/create?logementId=${id}`)}
            />
          </View>

          {edls.length === 0 ? (
            <Card>
              <Text className="text-gray-500 text-center py-4">
                Aucun etat des lieux pour ce logement
              </Text>
            </Card>
          ) : (
            edls.map((edl: any) => {
              const typeConfig = TYPE_CONFIG[edl.type as keyof typeof TYPE_CONFIG];
              const statutBadge = STATUT_BADGE[edl.statut as keyof typeof STATUT_BADGE];

              return (
                <Card
                  key={edl.id}
                  onPress={() => router.push(`/edl/${edl.id.split('/').pop()}`)}
                  className="mb-3"
                >
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-lg items-center justify-center ${typeConfig?.bg || 'bg-gray-100'}`}>
                      <Text className="text-xl">{typeConfig?.icon || '📋'}</Text>
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="font-medium text-gray-900">{edl.locataireNom}</Text>
                      <View className="flex-row items-center mt-1">
                        <Calendar size={12} color={COLORS.gray[400]} />
                        <Text className="text-xs text-gray-500 ml-1">
                          {formatDate(edl.dateRealisation)}
                        </Text>
                      </View>
                    </View>
                    <Badge label={statutBadge?.label || edl.statut} variant={statutBadge?.variant || 'gray'} />
                  </View>
                </Card>
              );
            })
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
