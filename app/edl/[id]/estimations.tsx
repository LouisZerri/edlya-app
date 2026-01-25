import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Download, Info, Sparkles, RefreshCw, AlertCircle, Send, X, Wrench, Camera } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, useCallback } from 'react';
import { Header, Card, Badge, Button } from '../../../components/ui';
import { COLORS, BASE_URL, UPLOADS_URL } from '../../../utils/constants';
import { formatCurrency } from '../../../utils/format';
import { useEstimations } from '../../../hooks/useEstimations';
import { usePdfExport } from '../../../hooks/usePdfExport';
import { useShareEdl } from '../../../hooks/useShareEdl';

// Helper pour construire l'URL de la photo
const getPhotoUrl = (chemin: string) => {
  if (!chemin) return '';
  if (chemin.startsWith('http')) return chemin;
  if (chemin.startsWith('/uploads/')) return `${BASE_URL}${chemin}`;
  if (chemin.startsWith('uploads/')) return `${BASE_URL}/${chemin}`;
  if (chemin.startsWith('/')) return `${UPLOADS_URL}${chemin}`;
  return `${UPLOADS_URL}/${chemin}`;
};

export default function EstimationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoading, estimations, generateEstimations, refreshEstimations } = useEstimations();
  const { isExporting, exportPdf } = usePdfExport();
  const { isSharing, shareByEmail } = useShareEdl();
  const [refreshing, setRefreshing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    if (id) {
      generateEstimations(id);
    }
  }, [id]);

  const onRefresh = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    await refreshEstimations(id);
    setRefreshing(false);
  }, [id, refreshEstimations]);

  const handleRegenerate = async () => {
    if (!id) return;
    await refreshEstimations(id);
  };

  if (isLoading && !estimations) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <Header title="Estimations" showBack />
        <View className="flex-1 items-center justify-center">
          <View className="w-20 h-20 bg-amber-100 rounded-full items-center justify-center mb-4">
            <Sparkles size={40} color={COLORS.amber[600]} />
          </View>
          <Text className="text-lg font-semibold text-gray-800">Analyse en cours...</Text>
          <Text className="text-gray-500 text-center mt-2 px-8">
            L'IA analyse les dégradations et calcule les estimations
          </Text>
          <ActivityIndicator size="large" color={COLORS.amber[600]} className="mt-6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!estimations) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <Header title="Estimations" showBack />
        <View className="flex-1 items-center justify-center p-4">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <AlertCircle size={40} color={COLORS.gray[400]} />
          </View>
          <Text className="text-lg font-semibold text-gray-800">Aucune estimation</Text>
          <Text className="text-gray-500 text-center mt-2">
            Impossible de générer les estimations pour cet état des lieux
          </Text>
          <Button
            label="Réessayer"
            onPress={() => id && generateEstimations(id)}
            variant="primary"
            className="mt-6"
          />
        </View>
      </SafeAreaView>
    );
  }

  const hasDegradations = estimations.degradations && estimations.degradations.length > 0;
  const hasClesManquantes = estimations.cles_manquantes && estimations.cles_manquantes.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <Header
        title="Estimations"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleRegenerate} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary[600]} />
            ) : (
              <RefreshCw size={22} color={COLORS.primary[600]} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero */}
        <LinearGradient
          colors={['#F59E0B', '#EA580C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-4 mt-4 rounded-2xl"
          style={{ padding: 20 }}
        >
          <View className="flex-row items-center">
            <Sparkles size={20} color="rgba(255,255,255,0.8)" />
            <Text className="text-amber-100 text-sm ml-2">Estimation IA des retenues</Text>
          </View>
          <Text className="text-white text-4xl font-bold mt-1">
            {formatCurrency(estimations.total_retenues)}
          </Text>

          <View className="flex-row mt-4">
            <View className="bg-white/20 rounded-lg px-3 py-2 flex-1 mr-2">
              <Text className="text-white/80 text-xs">Dépôt de garantie</Text>
              <Text className="text-white font-bold">
                {formatCurrency(estimations.depot_garantie || 0)}
              </Text>
            </View>
            <View className="bg-white/20 rounded-lg px-3 py-2 flex-1 ml-2">
              <Text className="text-white/80 text-xs">À restituer</Text>
              <Text className="text-white font-bold">
                {formatCurrency(estimations.a_restituer)}
              </Text>
            </View>
          </View>

          {estimations.duree_location_mois && (
            <Text className="text-white/70 text-xs mt-3">
              Durée de location : {estimations.duree_location_mois} mois
            </Text>
          )}
        </LinearGradient>

        {/* No degradations message */}
        {!hasDegradations && !hasClesManquantes && estimations.nettoyage === 0 && (
          <View className="mx-4 mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                <Text className="text-xl">✨</Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-green-800">Aucune retenue</Text>
                <Text className="text-green-700 text-sm">
                  Le logement est en bon état, pas de dégradation constatée
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Dégradations */}
        {hasDegradations && (
          <View className="p-4">
            <Text className="text-base font-semibold text-gray-800 mb-3">
              Dégradations locatives ({estimations.degradations.length})
            </Text>
            {estimations.degradations.map((deg, index) => (
              <Card key={index} className="mb-3">
                {/* Header: Element + Prix */}
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 pr-3">
                    <Text className="font-semibold text-gray-900">{deg.element}</Text>
                    <Text className="text-sm text-gray-500">{deg.piece}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-lg font-bold text-amber-600">
                      {formatCurrency(deg.montant_net)}
                    </Text>
                    {deg.taux_vetuste < 100 && (
                      <Text className="text-xs text-gray-400">
                        {formatCurrency(deg.montant_brut)} - {deg.taux_vetuste}% vétusté
                      </Text>
                    )}
                  </View>
                </View>

                {/* Dégât constaté */}
                <View className="bg-red-50 rounded-lg p-2 mb-2">
                  <Text className="text-xs text-red-600 font-medium mb-1">Dégât constaté</Text>
                  <Text className="text-red-800">{deg.degradation}</Text>
                  {deg.etat_entree && deg.etat_sortie && (
                    <Text className="text-xs text-red-600 mt-1">
                      État : {deg.etat_entree} → {deg.etat_sortie}
                    </Text>
                  )}
                </View>

                {/* Réparation à faire */}
                {deg.intervention && (
                  <View className="bg-blue-50 rounded-lg p-2 mb-2">
                    <View className="flex-row items-center mb-1">
                      <Wrench size={14} color={COLORS.blue[600]} />
                      <Text className="text-xs text-blue-600 font-medium ml-1">Réparation à faire</Text>
                    </View>
                    <Text className="text-blue-800">{deg.intervention}</Text>
                  </View>
                )}

                {/* Photos preuves */}
                {deg.photos && deg.photos.length > 0 && (
                  <View className="mt-2">
                    <View className="flex-row items-center mb-2">
                      <Camera size={14} color={COLORS.gray[500]} />
                      <Text className="text-xs text-gray-500 font-medium ml-1">
                        Photos ({deg.photos.length})
                      </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {deg.photos.map((photo, photoIndex) => (
                        <View key={photo.id || photoIndex} className="mr-2">
                          <Image
                            source={{ uri: getPhotoUrl(photo.chemin) }}
                            style={{ width: 80, height: 80, borderRadius: 8 }}
                            resizeMode="cover"
                          />
                          {photo.legende && (
                            <Text className="text-xs text-gray-500 mt-1 w-20" numberOfLines={1}>
                              {photo.legende}
                            </Text>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Justification */}
                {deg.justification && (
                  <Text className="text-xs text-gray-500 mt-2 italic">
                    {deg.justification}
                  </Text>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* Clés manquantes */}
        {hasClesManquantes && (
          <View className="px-4">
            <Text className="text-base font-semibold text-gray-800 mb-3">
              Clés manquantes
            </Text>
            {estimations.cles_manquantes.map((cle, index) => (
              <Card key={index} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-medium text-gray-900">{cle.type}</Text>
                    <Text className="text-sm text-gray-500">
                      {cle.manquantes} x {formatCurrency(cle.cout_unitaire)}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      Entrée: {cle.nombre_entree} → Sortie: {cle.nombre_sortie}
                    </Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900">
                    {formatCurrency(cle.total)}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Nettoyage */}
        {estimations.nettoyage > 0 && (
          <View className="px-4">
            <Card>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-medium text-gray-900">Nettoyage</Text>
                  <Text className="text-sm text-gray-500">Remise en état de propreté</Text>
                </View>
                <Text className="text-lg font-bold text-gray-900">
                  {formatCurrency(estimations.nettoyage)}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Grille vétusté */}
        {estimations.grille_vetuste && estimations.grille_vetuste.length > 0 && (
          <View className="px-4 mt-4">
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <View className="flex-row items-center mb-3">
                <Info size={18} color={COLORS.blue[600]} />
                <Text className="text-blue-800 font-medium ml-2">Grille de vétusté appliquée</Text>
              </View>
              {estimations.duree_location_mois && (
                <Text className="text-sm text-blue-700 mb-3">
                  Durée de location : {estimations.duree_location_mois} mois
                </Text>
              )}
              {estimations.grille_vetuste.map((item, index) => (
                <View key={index} className="flex-row items-center justify-between py-1.5 border-b border-blue-100 last:border-0">
                  <View className="flex-1">
                    <Text className="text-blue-700">{item.element}</Text>
                    <Text className="text-blue-500 text-xs">{item.duree_vie}</Text>
                  </View>
                  <Text className="text-blue-800 font-medium">{item.taux_applique}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Compteurs */}
        {estimations.compteurs && estimations.compteurs.length > 0 && (
          <View className="px-4 mt-4">
            <Text className="text-base font-semibold text-gray-800 mb-3">
              Relevés compteurs
            </Text>
            <Card>
              {estimations.compteurs.map((compteur, index) => (
                <View
                  key={index}
                  className={`flex-row items-center justify-between py-2 ${
                    index < estimations.compteurs.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <Text className="text-gray-700 font-medium">{compteur.type}</Text>
                  <View className="items-end">
                    <Text className="text-gray-600 text-sm">
                      {compteur.index_entree || '-'} → {compteur.index_sortie || '-'}
                    </Text>
                    {compteur.consommation && (
                      <Text className="text-gray-500 text-xs">
                        Conso: {compteur.consommation}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Récapitulatif */}
        <View className="p-4">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Récapitulatif
          </Text>
          <Card>
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-700">Dégradations (brut)</Text>
              <Text className="font-medium text-gray-900">
                {formatCurrency(estimations.total_brut)}
              </Text>
            </View>
            {estimations.total_abattement_vetuste > 0 && (
              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <Text className="text-green-700">- Abattement vétusté</Text>
                <Text className="font-medium text-green-700">
                  -{formatCurrency(estimations.total_abattement_vetuste)}
                </Text>
              </View>
            )}
            {estimations.total_cles > 0 && (
              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-700">Clés manquantes</Text>
                <Text className="font-medium text-gray-900">
                  {formatCurrency(estimations.total_cles)}
                </Text>
              </View>
            )}
            {estimations.nettoyage > 0 && (
              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <Text className="text-gray-700">Nettoyage</Text>
                <Text className="font-medium text-gray-900">
                  {formatCurrency(estimations.nettoyage)}
                </Text>
              </View>
            )}
            <View className="flex-row items-center justify-between py-3 mt-2 bg-amber-50 -mx-4 -mb-4 px-4 rounded-b-xl">
              <Text className="text-amber-800 font-semibold">Total retenues</Text>
              <Text className="text-xl font-bold text-amber-700">
                {formatCurrency(estimations.total_retenues)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Info IA */}
        <View className="px-4 mb-4">
          <View className="bg-gray-100 rounded-lg p-3 flex-row items-start">
            <Sparkles size={16} color={COLORS.gray[500]} />
            <Text className="text-gray-500 text-xs ml-2 flex-1">
              Ces estimations sont générées par IA et sont indicatives.
              Les montants réels peuvent varier selon les devis professionnels.
            </Text>
          </View>
        </View>

        <View className="h-4" />
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-100">
        <Button
          label={isExporting ? "Export en cours..." : "Exporter le détail PDF"}
          onPress={() => id && exportPdf(id, 'estimations')}
          fullWidth
          loading={isExporting}
          icon={!isExporting ? <Download size={18} color="white" /> : undefined}
        />
        <View className="h-2" />
        <Button
          label={isSharing ? "Envoi en cours..." : "Envoyer au locataire"}
          onPress={() => setShowEmailModal(true)}
          fullWidth
          variant="secondary"
          loading={isSharing}
          icon={!isSharing ? <Send size={18} color={COLORS.gray[700]} /> : undefined}
        />
      </View>

      {/* Modal Email */}
      <Modal
        visible={showEmailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowEmailModal(false)}
          className="flex-1 bg-black/50 justify-center items-center p-4"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="bg-white rounded-2xl p-5 w-full max-w-sm"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Envoyer au locataire
              </Text>
              <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                <X size={24} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 text-sm mb-4">
              Le locataire recevra un email avec un lien pour consulter les estimations.
            </Text>

            <Text className="text-sm font-medium text-gray-700 mb-1">
              Email du locataire
            </Text>
            <TextInput
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="exemple@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              className="border border-gray-200 rounded-lg px-4 py-3 text-base mb-4"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowEmailModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 items-center"
              >
                <Text className="text-gray-600 font-medium">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (id && emailInput && emailInput.includes('@')) {
                    const result = await shareByEmail(id, emailInput);
                    if (result) {
                      setShowEmailModal(false);
                      setEmailInput('');
                    }
                  }
                }}
                disabled={!emailInput || !emailInput.includes('@') || isSharing}
                className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${
                  emailInput && emailInput.includes('@') ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Send size={18} color="white" />
                    <Text className="text-white font-medium ml-2">Envoyer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
