import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Header, Input, Select, Button } from '../../components/ui';
import { GET_LOGEMENTS } from '../../graphql/queries/logements';
import { CREATE_ETAT_DES_LIEUX } from '../../graphql/mutations/edl';
import { GET_ETATS_DES_LIEUX } from '../../graphql/queries/edl';
import { useToastStore } from '../../stores/toastStore';
import { apiDateToDisplay, displayDateToApi } from '../../utils/format';
import { API_URL } from '../../utils/constants';
import { useAuthStore } from '../../stores/authStore';

interface LogementsData {
  logements?: {
    edges: Array<{ node: { id: string; nom: string } }>;
  };
}

interface CreateEdlData {
  createEtatDesLieux?: {
    etatDesLieux?: {
      id: string;
    };
  };
}

const edlSchema = z.object({
  logement: z.string().min(1, 'Logement requis'),
  type: z.enum(['entree', 'sortie']),
  dateRealisation: z.string().min(1, 'Date requise'),
  locataireNom: z.string().min(1, 'Nom du locataire requis'),
  locataireEmail: z.email({ message: 'Email invalide' }).optional(),
  locataireTelephone: z.string().optional(),
  typologie: z.string().optional(),
});

type EdlForm = z.infer<typeof edlSchema>;

const typologieOptions = [
  { value: '', label: 'Aucun pré-remplissage' },
  { value: 'studio', label: 'Studio' },
  { value: 'f1', label: 'F1' },
  { value: 'f2', label: 'F2' },
  { value: 'f3', label: 'F3' },
  { value: 'f4', label: 'F4' },
  { value: 'f5', label: 'F5' },
  { value: 't1', label: 'T1' },
  { value: 't2', label: 'T2' },
  { value: 't3', label: 'T3' },
  { value: 't4', label: 'T4' },
  { value: 't5', label: 'T5' },
  { value: 'maison_t3', label: 'Maison T3' },
  { value: 'maison_t4', label: 'Maison T4' },
  { value: 'maison_t5', label: 'Maison T5' },
];

export default function CreateEdlScreen() {
  const router = useRouter();
  const { logementId } = useLocalSearchParams<{ logementId?: string }>();
  const { success, error: showError } = useToastStore();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { data: logementsData } = useQuery<LogementsData>(GET_LOGEMENTS);
  const logements = logementsData?.logements?.edges?.map((e) => ({
    value: e.node.id,
    label: e.node.nom,
  })) || [];

  const [createEdl] = useMutation<CreateEdlData>(CREATE_ETAT_DES_LIEUX, {
    refetchQueries: [{ query: GET_ETATS_DES_LIEUX }],
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<EdlForm>({
    resolver: zodResolver(edlSchema),
    defaultValues: {
      logement: logementId ? `/api/logements/${logementId}` : '',
      type: 'entree',
      dateRealisation: apiDateToDisplay(new Date().toISOString().split('T')[0]),
      locataireNom: '',
      locataireEmail: '',
      locataireTelephone: '',
      typologie: '',
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: EdlForm) => {
    setLoading(true);
    try {
      const result = await createEdl({
        variables: {
          input: {
            logement: data.logement,
            type: data.type,
            dateRealisation: displayDateToApi(data.dateRealisation),
            locataireNom: data.locataireNom,
            locataireEmail: data.locataireEmail || null,
            locataireTelephone: data.locataireTelephone || null,
            statut: 'brouillon',
          },
        },
      });

      const newEdlId = result.data?.createEtatDesLieux?.etatDesLieux?.id;
      if (newEdlId) {
        const id = newEdlId.split('/').pop();

        // Générer les pièces si une typologie est sélectionnée
        if (data.typologie) {
          try {
            await fetch(`${API_URL}/edl/${id}/generer-pieces`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ typologie: data.typologie }),
            });
          } catch {
            // silently fail - typologie pre-fill is optional
          }
        }

        success('État des lieux créé avec succès !');
        router.replace(`/edl/${id}`);
      } else {
        router.back();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Header title="Nouvel état des lieux" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4">
          <Controller
            control={control}
            name="logement"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Logement *"
                value={value}
                options={logements}
                onChange={onChange}
                placeholder="Sélectionner un logement"
                error={errors.logement?.message}
              />
            )}
          />

          {/* Type Toggle */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Type *</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setValue('type', 'entree')}
                className={`flex-1 p-4 rounded-xl border-2 flex-row items-center justify-center ${
                  selectedType === 'entree'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <Text className="text-2xl mr-2">📥</Text>
                <Text className={selectedType === 'entree' ? 'text-blue-700 font-medium' : 'text-gray-600'}>
                  Entrée
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setValue('type', 'sortie')}
                className={`flex-1 p-4 rounded-xl border-2 flex-row items-center justify-center ${
                  selectedType === 'sortie'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <Text className="text-2xl mr-2">📤</Text>
                <Text className={selectedType === 'sortie' ? 'text-orange-700 font-medium' : 'text-gray-600'}>
                  Sortie
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Controller
            control={control}
            name="dateRealisation"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Date *"
                value={value}
                onChangeText={onChange}
                placeholder="25/01/2024"
                error={errors.dateRealisation?.message}
              />
            )}
          />

          <Text className="text-base font-semibold text-gray-800 mt-4 mb-3">Locataire</Text>

          <Controller
            control={control}
            name="locataireNom"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nom complet *"
                value={value}
                onChangeText={onChange}
                placeholder="Jean Dupont"
                error={errors.locataireNom?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="locataireEmail"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                value={value || ''}
                onChangeText={onChange}
                placeholder="jean@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.locataireEmail?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="locataireTelephone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Téléphone"
                value={value || ''}
                onChangeText={onChange}
                placeholder="06 12 34 56 78"
                keyboardType="phone-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="typologie"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Pré-remplissage par typologie"
                value={value || ''}
                options={typologieOptions}
                onChange={onChange}
                placeholder="Sélectionner une typologie"
              />
            )}
          />

          <Text className="text-xs text-gray-500 mt-1 mb-4">
            Génère automatiquement les pièces standard pour ce type de logement
          </Text>
        </ScrollView>

        <View className="p-4 border-t border-gray-100">
          <Button
            label="Créer l'état des lieux"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
