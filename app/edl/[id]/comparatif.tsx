import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, Animated, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, AlertTriangle, ArrowRight, AlertCircle, CheckCircle, Info, Send, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Header, Card, Badge, Button } from '../../../components/ui';
import { COLORS } from '../../../utils/constants';
import type { ElementEtat, CleType } from '../../../types';
import { COMPTEUR_CONFIG, ELEMENT_ETAT_LABELS, CLE_LABELS } from '../../../types';
import { formatDate } from '../../../utils/format';
import { useComparatif } from '../../../hooks/useComparatif';
import { usePdfExport } from '../../../hooks/usePdfExport';
import { useShareEdl } from '../../../hooks/useShareEdl';

export default function ComparatifScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isLoading, comparatif, loadComparatif } = useComparatif();
  const { isExporting, exportPdf } = usePdfExport();
  const { isSharing, shareComparatif } = useShareEdl();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // Page entrance animation
  const pageOpacity = useRef(new Animated.Value(0)).current;
  const pageSlide = useRef(new Animated.Value(30)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (id) {
      loadComparatif(id);
    }
  }, [id]);

  // Trigger page animation when data arrives
  useEffect(() => {
    if (comparatif && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.parallel([
        Animated.timing(pageOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(pageSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [comparatif]);

  const onRefresh = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    await loadComparatif(id);
    setRefreshing(false);
  }, [id, loadComparatif]);

  if (isLoading && !comparatif) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
        <Header title="Comparatif" showBack />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary[600]} />
          <Text className="text-gray-500 dark:text-gray-400 mt-4">Chargement du comparatif...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!comparatif) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
        <Header title="Comparatif" showBack />
        <View className="flex-1 items-center justify-center p-4">
          <View className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-4">
            <AlertCircle size={40} color={COLORS.gray[400]} />
          </View>
          <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">Comparatif indisponible</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
            Impossible de charger le comparatif pour cet état des lieux
          </Text>
          <View className="mt-6">
            <Button
              label="Réessayer"
              onPress={() => id && loadComparatif(id)}
              variant="primary"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const getEtatVariant = (etat?: string): 'green' | 'amber' | 'red' | 'gray' => {
    if (!etat) return 'gray';
    if (etat === 'neuf' || etat === 'tres_bon' || etat === 'bon') return 'green';
    if (etat === 'usage') return 'amber';
    return 'red';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <Header
        title="Comparatif"
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => id && exportPdf(id, 'comparatif', { logement: comparatif?.logement?.nom, locataire: comparatif?.sortie?.locataireNom || comparatif?.entree?.locataireNom })}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={COLORS.primary[600]} />
            ) : (
              <Download size={22} color={COLORS.primary[600]} />
            )}
          </TouchableOpacity>
        }
      />

      <Animated.ScrollView
        className="flex-1"
        style={{ opacity: pageOpacity, transform: [{ translateY: pageSlide }] }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Résumé */}
        <View className="bg-white dark:bg-gray-900 p-4 border-b border-gray-100 dark:border-gray-700">
          {/* Logement */}
          <Text className="font-semibold text-gray-900 dark:text-gray-100 text-center">
            {comparatif.logement.nom}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
            {comparatif.logement.adresse}, {comparatif.logement.ville}
          </Text>

          {/* Dates */}
          <View className="flex-row items-center justify-center mt-4">
            <View className="items-center flex-1">
              <Text className="text-xs text-gray-500 dark:text-gray-400">Entrée</Text>
              <Text className="font-semibold text-gray-900 dark:text-gray-100">
                {comparatif.date_entree ? formatDate(comparatif.date_entree) : '-'}
              </Text>
            </View>
            <ArrowRight size={20} color={COLORS.gray[400]} />
            <View className="items-center flex-1">
              <Text className="text-xs text-gray-500 dark:text-gray-400">Sortie</Text>
              <Text className="font-semibold text-gray-900 dark:text-gray-100">
                {formatDate(comparatif.date_sortie)}
              </Text>
            </View>
          </View>

          {/* Durée */}
          {comparatif.duree_location_mois !== undefined && comparatif.duree_location_mois > 0 && (
            <Text className="text-center text-gray-500 dark:text-gray-400 text-sm mt-2">
              Durée : {comparatif.duree_location_mois} mois
            </Text>
          )}

          {/* Alerte pas d'EDL entrée */}
          {!comparatif.has_edl_entree && (
            <View className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4 flex-row items-center">
              <Info size={20} color={COLORS.blue[600]} />
              <Text className="text-blue-700 dark:text-blue-300 ml-2 flex-1 text-sm">
                Aucun état des lieux d'entrée trouvé pour ce logement
              </Text>
            </View>
          )}

          {/* Statistiques */}
          {comparatif.comparatif?.statistiques && (
            <View className="flex-row mt-4 gap-2">
              <View className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-2 items-center">
                <Text className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {comparatif.comparatif.statistiques.totalElements}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">Éléments</Text>
              </View>
              {comparatif.comparatif.statistiques.elementsDegrades > 0 && (
                <View className="flex-1 bg-red-50 dark:bg-red-900/30 rounded-lg p-2 items-center">
                  <Text className="text-lg font-bold text-red-600">
                    {comparatif.comparatif.statistiques.elementsDegrades}
                  </Text>
                  <Text className="text-xs text-red-500 dark:text-red-400">Dégradés</Text>
                </View>
              )}
              {comparatif.comparatif.statistiques.elementsAmeliores > 0 && (
                <View className="flex-1 bg-green-50 dark:bg-green-900/30 rounded-lg p-2 items-center">
                  <Text className="text-lg font-bold text-green-600">
                    {comparatif.comparatif.statistiques.elementsAmeliores}
                  </Text>
                  <Text className="text-xs text-green-500 dark:text-green-400">Améliorés</Text>
                </View>
              )}
            </View>
          )}

          {/* Résumé dégradations */}
          {comparatif.nb_total_degradations > 0 && (
            <View className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4 flex-row items-center">
              <AlertTriangle size={20} color={COLORS.amber[600]} />
              <Text className="text-amber-700 dark:text-amber-300 ml-2 flex-1">
                {comparatif.nb_total_degradations} élément{comparatif.nb_total_degradations > 1 ? 's' : ''} dégradé{comparatif.nb_total_degradations > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {comparatif.nb_total_degradations === 0 && comparatif.has_edl_entree && (
            <View className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-4 flex-row items-center">
              <CheckCircle size={20} color={COLORS.green[600]} />
              <Text className="text-green-700 dark:text-green-300 ml-2 flex-1">
                Aucune dégradation constatée
              </Text>
            </View>
          )}
        </View>

        {/* Compteurs */}
        {comparatif.compteurs_formatted && comparatif.compteurs_formatted.length > 0 && (
          <View className="p-4">
            <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Évolution des compteurs
            </Text>
            {comparatif.compteurs_formatted.map((compteur, index) => {
              const config = COMPTEUR_CONFIG[compteur.type as keyof typeof COMPTEUR_CONFIG];
              return (
                <Card key={index} className="mb-3">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-xl">{config?.icon || '📊'}</Text>
                    <Text className="font-medium text-gray-800 dark:text-gray-200 ml-2">{config?.label || compteur.type}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-600 dark:text-gray-300">{compteur.index_entree || '-'}</Text>
                    <ArrowRight size={16} color={COLORS.gray[400]} />
                    <Text className="text-gray-900 dark:text-gray-100 font-medium">{compteur.index_sortie || '-'}</Text>
                    {compteur.consommation && (
                      <Badge label={compteur.consommation} variant="blue" />
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* Clés */}
        {comparatif.cles_formatted && comparatif.cles_formatted.length > 0 && (
          <View className="px-4">
            <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">Clés</Text>
            {comparatif.cles_formatted.map((cle, index) => (
              <Card key={index} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 dark:text-gray-300 flex-1">
                    {CLE_LABELS[cle.type as CleType] || cle.type}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-gray-600 dark:text-gray-300">{cle.nombre_entree}</Text>
                    <ArrowRight size={16} color={COLORS.gray[400]} />
                    <Text className="text-gray-900 dark:text-gray-100 font-medium">{cle.nombre_sortie}</Text>
                    <Badge
                      label={cle.ok ? 'OK' : `${Math.abs(cle.difference)} manquante${Math.abs(cle.difference) > 1 ? 's' : ''}`}
                      variant={cle.ok ? 'green' : 'red'}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* État par pièce */}
        {comparatif.pieces_formatted && comparatif.pieces_formatted.length > 0 && (
          <View className="p-4">
            <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
              État par pièce
            </Text>
            {comparatif.pieces_formatted.map((piece, index) => {
              const hasDegradations = piece.nb_degradations > 0;
              return (
                <Card key={index} className="mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className={`w-3 h-3 rounded-sm ${hasDegradations ? 'bg-red-500' : 'bg-green-500'}`} />
                      <Text className="font-semibold text-gray-900 dark:text-gray-100 ml-2">{piece.nom}</Text>
                    </View>
                    {hasDegradations ? (
                      <Badge label={`${piece.nb_degradations} dégradé${piece.nb_degradations > 1 ? 's' : ''}`} variant="red" />
                    ) : (
                      <Badge label="OK" variant="green" />
                    )}
                  </View>

                  {piece.elements.map((element, idx) => (
                    <View key={idx} className="py-2 border-t border-gray-50 dark:border-gray-800">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-gray-700 dark:text-gray-300 flex-1" numberOfLines={1}>{element.nom}</Text>
                        <View className="flex-row items-center gap-1">
                          {element.etat_entree && (
                            <>
                              <Badge
                                label={ELEMENT_ETAT_LABELS[element.etat_entree as ElementEtat] || element.etat_entree}
                                variant={getEtatVariant(element.etat_entree)}
                              />
                              <ArrowRight size={12} color={COLORS.gray[400]} />
                            </>
                          )}
                          <Badge
                            label={ELEMENT_ETAT_LABELS[element.etat_sortie as ElementEtat] || element.etat_sortie}
                            variant={getEtatVariant(element.etat_sortie)}
                          />
                        </View>
                      </View>
                      {element.degradations && element.degradations.length > 0 && (
                        <View className="mt-2 gap-1">
                          {element.degradations.map((deg, i) => (
                            <Text key={i} className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 rounded-lg px-2.5 py-1.5">
                              {deg}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}

                  {piece.elements.length === 0 && (
                    <Text className="text-gray-500 dark:text-gray-400 text-sm py-2">
                      Aucun élément dans cette pièce
                    </Text>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        <View className="h-4" />
      </Animated.ScrollView>

      <View className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
        <Button
          label="Voir les estimations détaillées"
          onPress={() => router.push(`/edl/${id}/estimations`)}
          fullWidth
          variant="primary"
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
            className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Envoyer au locataire
              </Text>
              <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                <X size={24} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Le locataire recevra un email avec le comparatif en pièce jointe.
            </Text>

            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email du locataire
            </Text>
            <TextInput
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="exemple@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={{
                height: 52,
                borderWidth: 1,
                borderColor: isDark ? '#374151' : '#E5E7EB',
                borderRadius: 12,
                paddingHorizontal: 16,
                fontSize: 16,
                color: isDark ? '#F9FAFB' : '#111827',
                backgroundColor: isDark ? '#1F2937' : '#ffffff',
                textAlignVertical: 'center',
                marginBottom: 16,
              }}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowEmailModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 items-center"
              >
                <Text className="text-gray-600 dark:text-gray-300 font-medium">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (id && emailInput && emailInput.includes('@')) {
                    const result = await shareComparatif(id, emailInput);
                    if (result) {
                      setShowEmailModal(false);
                      setEmailInput('');
                    }
                  }
                }}
                disabled={!emailInput || !emailInput.includes('@') || isSharing}
                className="flex-1 py-3 rounded-xl items-center flex-row justify-center"
                style={{
                  backgroundColor: emailInput && emailInput.includes('@') ? COLORS.primary[600] : COLORS.gray[300],
                }}
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
