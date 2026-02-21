import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Header, Input, Select, Button, AddressAutocomplete } from '../../components/ui';
import { CREATE_LOGEMENT } from '../../graphql/mutations/logements';
import { GET_LOGEMENTS } from '../../graphql/queries/logements';
import { useToastStore } from '../../stores/toastStore';

const logementSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  adresse: z.string().min(1, 'Adresse requise'),
  codePostal: z.string().min(5, 'Code postal invalide'),
  ville: z.string().min(1, 'Ville requise'),
  type: z.string().optional(),
  surface: z.string().optional(),
  nbPieces: z.string().optional(),
  description: z.string().optional(),
});

type LogementForm = z.infer<typeof logementSchema>;

const typeOptions = [
  { value: 'studio', label: 'Studio' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'loft', label: 'Loft' },
  { value: 'autre', label: 'Autre' },
];

export default function CreateLogementScreen() {
  const router = useRouter();
  const { success, error: showError } = useToastStore();
  const [loading, setLoading] = useState(false);

  const [createLogement] = useMutation(CREATE_LOGEMENT, {
    refetchQueries: [{ query: GET_LOGEMENTS }],
  });

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<LogementForm>({
    resolver: zodResolver(logementSchema),
    defaultValues: {
      nom: '',
      adresse: '',
      codePostal: '',
      ville: '',
      type: '',
      surface: '',
      nbPieces: '',
      description: '',
    },
  });

  const onSubmit = async (data: LogementForm) => {
    setLoading(true);
    try {
      await createLogement({
        variables: {
          input: {
            nom: data.nom,
            adresse: data.adresse,
            codePostal: data.codePostal,
            ville: data.ville,
            type: data.type || null,
            surface: data.surface ? parseFloat(data.surface) : null,
            nbPieces: data.nbPieces ? parseInt(data.nbPieces) : 1,
            description: data.description || null,
          },
        },
      });
      success('Logement créé avec succès !');
      router.back();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <Header title="Nouveau logement" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4">
          <Controller
            control={control}
            name="nom"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nom du logement *"
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Appartement Centre-Ville"
                error={errors.nom?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="adresse"
            render={({ field: { onChange, value } }) => (
              <AddressAutocomplete
                label="Adresse *"
                value={value}
                onChangeText={onChange}
                onSelect={(suggestion) => {
                  onChange(suggestion.adresse);
                  setValue('codePostal', suggestion.codePostal);
                  setValue('ville', suggestion.ville);
                }}
                placeholder="10 rue de la Paix"
                error={errors.adresse?.message}
              />
            )}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="codePostal"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Code postal *"
                    value={value}
                    onChangeText={onChange}
                    placeholder="75001"
                    keyboardType="numeric"
                    error={errors.codePostal?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="ville"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Ville *"
                    value={value}
                    onChangeText={onChange}
                    placeholder="Paris"
                    error={errors.ville?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Type de logement"
                value={value || ''}
                options={typeOptions}
                onChange={onChange}
                placeholder="Sélectionner un type"
              />
            )}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="surface"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Surface (m²)"
                    value={value || ''}
                    onChangeText={onChange}
                    placeholder="65"
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="nbPieces"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Nb de pièces"
                    value={value || ''}
                    onChangeText={onChange}
                    placeholder="3"
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Description (optionnel)"
                value={value || ''}
                onChangeText={onChange}
                placeholder="Notes supplémentaires..."
                multiline
                numberOfLines={3}
              />
            )}
          />
        </ScrollView>

        <View className="p-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            label="Créer le logement"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
