import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState, useCallback } from 'react';
import { MapPin, Ruler, DoorOpen, Trash2 } from 'lucide-react-native';
import { Header, Card, Badge, Button } from '../../components/ui';
import { GET_LOGEMENT, GET_LOGEMENTS } from '../../graphql/queries/logements';
import { DELETE_LOGEMENT } from '../../graphql/mutations/logements';
import { COLORS } from '../../utils/constants';
import { formatSurface } from '../../utils/format';
import { useToastStore } from '../../stores/toastStore';

interface LogementDetailData {
  logement?: any;
}

export default function LogementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { success, error: showError } = useToastStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch, loading } = useQuery<LogementDetailData>(GET_LOGEMENT, {
    variables: { id: `/api/logements/${id}` },
  });

  const [deleteLogement] = useMutation(DELETE_LOGEMENT, {
    refetchQueries: [{ query: GET_LOGEMENTS }],
  });

  const logement = data?.logement;

  const handleDelete = () => {
    Alert.alert(
      'Supprimer',
      'Etes-vous sur de vouloir supprimer ce logement ? Cette action est irreversible.',
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
              success('Logement supprime !');
              router.replace('/(tabs)/logements');
            } catch (err: any) {
              showError(err.message || 'Erreur lors de la suppression');
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
          <View className="flex-row flex-wrap mt-4 gap-3">
            <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
              <Ruler size={16} color={COLORS.gray[500]} />
              <Text className="text-gray-700 ml-2 font-medium">
                {logement?.surface ? formatSurface(logement.surface) : 'Non renseigne'}
              </Text>
            </View>
            <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
              <DoorOpen size={16} color={COLORS.gray[500]} />
              <Text className="text-gray-700 ml-2 font-medium">
                {logement?.nbPieces ? `${logement.nbPieces} pieces` : 'Non renseigne'}
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
        <View className="px-4 mt-6">
          <Button
            label="Creer un etat des lieux"
            onPress={() => router.push(`/edl/create?logementId=${id}`)}
            fullWidth
          />
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
      </ScrollView>
    </SafeAreaView>
  );
}
