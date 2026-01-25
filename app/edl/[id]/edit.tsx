import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { Plus } from 'lucide-react-native';
import { Header, Card, Badge, Button, Input } from '../../../components/ui';
import { GET_ETAT_DES_LIEUX } from '../../../graphql/queries/edl';
import { UPDATE_ETAT_DES_LIEUX } from '../../../graphql/mutations/edl';
import { COMPTEUR_CONFIG, CLE_LABELS, ELEMENT_ETAT_LABELS } from '../../../types';
import { COLORS } from '../../../utils/constants';

interface EdlDetailData {
  etatDesLieux?: any;
}

type TabType = 'infos' | 'compteurs' | 'cles' | 'pieces';

export default function EditEdlScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('infos');
  const [saving, setSaving] = useState(false);

  const { data, refetch } = useQuery<EdlDetailData>(GET_ETAT_DES_LIEUX, {
    variables: { id: `/api/etat_des_lieuxes/${id}` },
  });

  const edl = data?.etatDesLieux;
  const pieces = edl?.pieces?.edges?.map((e: any) => e.node) || [];
  const compteurs = edl?.compteurs?.edges?.map((e: any) => e.node) || [];
  const cles = edl?.cles?.edges?.map((e: any) => e.node) || [];

  const [updateEdl] = useMutation(UPDATE_ETAT_DES_LIEUX);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'infos', label: 'Infos' },
    { key: 'compteurs', label: 'Compteurs' },
    { key: 'cles', label: 'Cles' },
    { key: 'pieces', label: 'Pieces' },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await refetch();
      router.back();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'infos':
        return (
          <View className="p-4">
            <Input
              label="Nom du locataire"
              value={edl?.locataireNom || ''}
              onChangeText={() => {}}
            />
            <Input
              label="Email"
              value={edl?.locataireEmail || ''}
              onChangeText={() => {}}
              keyboardType="email-address"
            />
            <Input
              label="Telephone"
              value={edl?.locataireTelephone || ''}
              onChangeText={() => {}}
              keyboardType="phone-pad"
            />
            <Input
              label="Date de realisation"
              value={edl?.dateRealisation || ''}
              onChangeText={() => {}}
            />
            <Input
              label="Observations generales"
              value={edl?.observationsGenerales || ''}
              onChangeText={() => {}}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'compteurs':
        return (
          <View className="p-4">
            <View className="flex-row flex-wrap gap-3">
              {compteurs.map((compteur: any) => {
                const config = COMPTEUR_CONFIG[compteur.type as keyof typeof COMPTEUR_CONFIG];
                return (
                  <View key={compteur.id} className="w-[48%]">
                    <Card>
                      <View className="flex-row items-center mb-2">
                        <Text className="text-xl">{config?.icon || '📊'}</Text>
                        <Text className="text-sm font-medium text-gray-700 ml-2">
                          {config?.label || compteur.type}
                        </Text>
                      </View>
                      <Input
                        label="Index"
                        value={compteur.indexValue || ''}
                        onChangeText={() => {}}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity className="border border-dashed border-gray-300 rounded-lg p-3 items-center mt-2">
                        <Text className="text-gray-500 text-sm">+ Photo</Text>
                      </TouchableOpacity>
                    </Card>
                  </View>
                );
              })}
            </View>
            {compteurs.length === 0 && (
              <Card>
                <Text className="text-gray-500 text-center py-4">
                  Aucun compteur configure
                </Text>
              </Card>
            )}
          </View>
        );

      case 'cles':
        return (
          <View className="p-4">
            {cles.map((cle: any) => (
              <Card key={cle.id} className="mb-3">
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">🔑</Text>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {CLE_LABELS[cle.type as keyof typeof CLE_LABELS] || cle.type}
                    </Text>
                  </View>
                  <View className="w-20">
                    <Input
                      label=""
                      value={String(cle.nombre)}
                      onChangeText={() => {}}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </Card>
            ))}
            <TouchableOpacity className="border border-dashed border-gray-300 rounded-xl p-4 items-center">
              <Plus size={20} color={COLORS.gray[400]} />
              <Text className="text-gray-500 mt-1">Ajouter une cle</Text>
            </TouchableOpacity>
          </View>
        );

      case 'pieces':
        return (
          <View className="p-4">
            {pieces.map((piece: any) => {
              const elements = piece.elements?.edges?.map((e: any) => e.node) || [];
              return (
                <Card key={piece.id} className="mb-3">
                  <TouchableOpacity className="flex-row items-center justify-between">
                    <Text className="font-semibold text-gray-900">{piece.nom}</Text>
                    <Badge label={`${elements.length} elements`} variant="gray" />
                  </TouchableOpacity>

                  <View className="mt-3">
                    {elements.map((element: any) => (
                      <View key={element.id} className="py-2 border-t border-gray-50">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-700">{element.nom}</Text>
                          <Badge
                            label={ELEMENT_ETAT_LABELS[element.etat as keyof typeof ELEMENT_ETAT_LABELS] || element.etat}
                            variant={element.etat === 'bon' || element.etat === 'neuf' ? 'green' : element.etat === 'mauvais' ? 'red' : 'amber'}
                          />
                        </View>
                        <Text className="text-xs text-gray-400 mt-0.5">{element.type}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity className="border border-dashed border-gray-300 rounded-lg p-2 items-center mt-3">
                    <Text className="text-gray-500 text-sm">+ Ajouter un element</Text>
                  </TouchableOpacity>
                </Card>
              );
            })}

            <TouchableOpacity className="border border-dashed border-gray-300 rounded-xl p-4 items-center">
              <Plus size={20} color={COLORS.gray[400]} />
              <Text className="text-gray-500 mt-1">Ajouter une piece</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header title="Modifier EDL" showBack />

      {/* Tabs */}
      <View className="bg-white flex-row border-b border-gray-100">
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === tab.key
                ? 'border-primary-600'
                : 'border-transparent'
            }`}
          >
            <Text
              className={
                activeTab === tab.key
                  ? 'text-primary-600 font-medium'
                  : 'text-gray-500'
              }
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1">
        {renderTabContent()}
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-100">
        <Button
          label="Enregistrer"
          onPress={handleSave}
          loading={saving}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
