import { View } from 'react-native';
import { Input, InputWithVoice } from '../ui';
import { EdlFormData } from '../../hooks/useEdlInitializer';

interface EdlInfosTabProps {
  formData: EdlFormData;
  setFormData: React.Dispatch<React.SetStateAction<EdlFormData>>;
}

export function EdlInfosTab({ formData, setFormData }: EdlInfosTabProps) {
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
      <Input
        label="Date de réalisation"
        value={formData.dateRealisation}
        onChangeText={(text) => setFormData(prev => ({ ...prev, dateRealisation: text }))}
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
