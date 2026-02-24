import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X, UserPlus } from 'lucide-react-native';
import { Input, InputWithVoice, DatePicker } from '../ui';
import { COLORS } from '../../utils/constants';
import { useEdlEditContext } from '../../contexts/EdlEditContext';

export function EdlInfosTab() {
  const { formData, setFormData } = useEdlEditContext();
  const [newLocataire, setNewLocataire] = useState('');
  const [showColocInput, setShowColocInput] = useState(false);
  const hasLocataires = formData.autresLocataires.length > 0;

  const addLocataire = () => {
    const nom = newLocataire.trim();
    if (!nom) return;
    setFormData(prev => ({
      ...prev,
      autresLocataires: [...prev.autresLocataires, nom],
    }));
    setNewLocataire('');
  };

  const removeLocataire = (index: number) => {
    setFormData(prev => {
      const updated = prev.autresLocataires.filter((_, i) => i !== index);
      if (updated.length === 0) setShowColocInput(false);
      return { ...prev, autresLocataires: updated };
    });
  };

  return (
    <View className="p-4">
      <Input
        label="Nom du locataire *"
        value={formData.locataireNom}
        onChangeText={(text) => setFormData(prev => ({ ...prev, locataireNom: text }))}
      />
      <Input
        label="Email"
        value={formData.locataireEmail}
        onChangeText={(text) => setFormData(prev => ({ ...prev, locataireEmail: text }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Téléphone"
        value={formData.locataireTelephone}
        onChangeText={(text) => setFormData(prev => ({ ...prev, locataireTelephone: text }))}
        keyboardType="phone-pad"
      />

      {/* Autres locataires (colocation) */}
      <View className="mb-4">
        {hasLocataires && (
          <View className="flex-row flex-wrap gap-2 mb-3">
            {formData.autresLocataires.map((nom, index) => (
              <View
                key={index}
                className="flex-row items-center bg-primary-50 dark:bg-primary-900/30 rounded-full pl-3 pr-1.5 py-1.5"
              >
                <Text className="text-sm text-primary-700 dark:text-primary-300">{nom}</Text>
                <TouchableOpacity
                  onPress={() => removeLocataire(index)}
                  className="ml-1.5 w-5 h-5 rounded-full bg-primary-200 dark:bg-primary-800 items-center justify-center"
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <X size={12} color={COLORS.primary[600]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {(showColocInput || hasLocataires) ? (
          <View>
            <Input
              label="Ajouter un colocataire"
              value={newLocataire}
              onChangeText={setNewLocataire}
              placeholder="Nom du colocataire"
              onSubmitEditing={addLocataire}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={addLocataire}
              className="flex-row items-center justify-center bg-primary-600 rounded-xl py-2.5 -mt-2 mb-2"
            >
              <UserPlus size={16} color="white" />
              <Text className="text-white font-medium text-sm ml-1.5">Ajouter</Text>
            </TouchableOpacity>
            <Text className="text-xs text-gray-400 dark:text-gray-500">
              Le locataire principal signera pour tous
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowColocInput(true)}
            className="flex-row items-center py-2"
          >
            <UserPlus size={16} color={COLORS.primary[600]} />
            <Text className="text-sm text-primary-600 dark:text-primary-400 font-medium ml-2">
              Ajouter un colocataire
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <DatePicker
        label="Date de réalisation"
        value={formData.dateRealisation}
        onChange={(text) => setFormData(prev => ({ ...prev, dateRealisation: text }))}
      />
      <InputWithVoice
        label="Observations generales"
        value={formData.observationsGenerales}
        onChangeText={(text) => setFormData(prev => ({ ...prev, observationsGenerales: text }))}
        placeholder="Dictez ou saisissez vos observations..."
        numberOfLines={4}
      />
    </View>
  );
}
