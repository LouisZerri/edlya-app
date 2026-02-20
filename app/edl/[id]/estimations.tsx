import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Download, Info, Sparkles, AlertCircle, Send, X, Plus, Trash2, List, ChevronRight } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { useEffect, useState, useCallback } from 'react';
import { Header, Card, Button } from '../../../components/ui';
import { COLORS } from '../../../utils/constants';
import { formatCurrency } from '../../../utils/format';
import { useEstimations } from '../../../hooks/useEstimations';
import { useDevis, LigneDevis, CoutSuggestion } from '../../../hooks/useDevis';
import { usePdfExport } from '../../../hooks/usePdfExport';
import { useShareEdl } from '../../../hooks/useShareEdl';

const UNITE_LABELS: Record<string, string> = {
  m2: 'm\u00B2',
  unite: 'unit\u00E9',
  ml: 'ml',
  forfait: 'forfait',
};

const TYPE_LABELS: Record<string, string> = {
  sol: 'Sol',
  mur: 'Mur',
  plafond: 'Plafond',
  menuiserie: 'Menuiserie',
  electricite: '\u00C9lectricit\u00E9',
  plomberie: 'Plomberie',
  chauffage: 'Chauffage',
  equipement: '\u00C9quipement',
  autre: 'Autre',
};

export default function EstimationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isLoading, estimations, generateEstimations } = useEstimations();
  const devis = useDevis();
  const { isExporting, exportPdf } = usePdfExport();
  const { isSharing, shareByEmail } = useShareEdl();

  const [refreshing, setRefreshing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLigne, setEditingLigne] = useState<LigneDevis | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Chargement initial
  useEffect(() => {
    if (id) {
      generateEstimations(id);
      devis.loadSuggestions();
    }
  }, [id]);

  // Pré-remplir les lignes de devis depuis les dégradations
  useEffect(() => {
    if (estimations && !initialized) {
      const degradations = estimations.degradations || [];
      if (degradations.length > 0) {
        devis.setLignesFromDegradations(
          degradations.map(d => ({
            piece: d.piece,
            element: d.element,
            type: d.type_element,
            intervention: d.intervention || '',
            cout_brut: d.montant_brut || 0,
            observations: d.degradation,
          }))
        );
      }
      setInitialized(true);
    }
  }, [estimations, initialized]);

  const onRefresh = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    setInitialized(false);
    await generateEstimations(id);
    setRefreshing(false);
  }, [id, generateEstimations]);

  const handleAffinerIA = async () => {
    if (!id) return;
    await devis.analyserAvecIA(id);
  };

  const handleEditLigne = (ligne: LigneDevis) => {
    setEditingLigne({ ...ligne });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingLigne) return;
    devis.updateLigne(editingLigne.id, {
      piece: editingLigne.piece,
      description: editingLigne.description,
      quantite: editingLigne.quantite,
      unite: editingLigne.unite,
      prix_unitaire: editingLigne.prix_unitaire,
    });
    setShowEditModal(false);
    setEditingLigne(null);
  };

  const handleAddFromSuggestion = (suggestion: CoutSuggestion) => {
    devis.addLigne({
      piece: '',
      description: suggestion.nom,
      quantite: 1,
      unite: suggestion.unite,
      prix_unitaire: suggestion.prix_unitaire,
    });
    setShowSuggestions(false);
  };

  // Calculs
  const totalCles = estimations?.cles_manquantes?.reduce((sum, c) => sum + c.total, 0) || 0;
  const totalRetenues = devis.totalHT + totalCles;
  const depotGarantie = estimations?.depot_garantie || 0;
  const aRestituer = Math.max(0, depotGarantie - totalRetenues);

  // Loading state
  if (isLoading && !estimations) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
        <Header title="Devis" showBack />
        <View className="flex-1 items-center justify-center">
          <View className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full items-center justify-center mb-4">
            <Sparkles size={40} color={COLORS.amber[600]} />
          </View>
          <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">Analyse en cours...</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 px-8">
            Calcul des estimations et dégradations
          </Text>
          <ActivityIndicator size="large" color={COLORS.amber[600]} className="mt-6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!estimations) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
        <Header title="Devis" showBack />
        <View className="flex-1 items-center justify-center p-4">
          <View className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-4">
            <AlertCircle size={40} color={COLORS.gray[400]} />
          </View>
          <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">Aucune estimation</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
            Impossible de générer les estimations pour cet état des lieux
          </Text>
          <View className="mt-6">
            <Button
              label="Réessayer"
              onPress={() => id && generateEstimations(id)}
              variant="primary"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <Header title="Devis" showBack />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero - Total TTC */}
        <LinearGradient
          colors={isDark ? ['#92400E', '#9A3412'] : ['#F59E0B', '#EA580C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-4 mt-4 rounded-2xl"
          style={{ padding: 20 }}
        >
          <View className="flex-row items-center">
            <Sparkles size={20} color="rgba(255,255,255,0.8)" />
            <Text className="text-amber-100 text-sm ml-2">Total TTC du devis</Text>
          </View>
          <Text className="text-white text-4xl font-bold mt-1">
            {formatCurrency(devis.totalTTC + totalCles)}
          </Text>

          <View className="flex-row mt-4">
            <View className="bg-white/20 rounded-lg px-3 py-2 flex-1 mr-2">
              <Text className="text-white/80 text-xs">Dépôt de garantie</Text>
              <Text className="text-white font-bold">
                {formatCurrency(depotGarantie)}
              </Text>
            </View>
            <View className="bg-white/20 rounded-lg px-3 py-2 flex-1 ml-2">
              <Text className="text-white/80 text-xs">À restituer</Text>
              <Text className="text-white font-bold">
                {formatCurrency(Math.max(0, depotGarantie - devis.totalTTC - totalCles))}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Bouton Affiner avec IA */}
        <View className="mx-4 mt-4">
          <TouchableOpacity
            onPress={handleAffinerIA}
            disabled={devis.isAnalyzing}
            className="bg-primary-600 rounded-xl py-3.5 flex-row items-center justify-center"
            style={{ backgroundColor: devis.isAnalyzing ? COLORS.gray[300] : COLORS.primary[600] }}
          >
            {devis.isAnalyzing ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-semibold ml-2">L'IA analyse les dégradations...</Text>
              </>
            ) : (
              <>
                <Sparkles size={18} color="white" />
                <Text className="text-white font-semibold ml-2">Affiner avec IA</Text>
              </>
            )}
          </TouchableOpacity>
          <Text className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
            Analyse les photos côté serveur et génère des lignes précises
          </Text>
        </View>

        {/* Lignes de devis */}
        <View className="p-4">
          <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Lignes de devis ({devis.lignes.length})
          </Text>

          {devis.lignes.length === 0 && (
            <View className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl p-6 items-center">
              <List size={32} color={COLORS.gray[300]} />
              <Text className="text-gray-400 dark:text-gray-500 text-sm mt-2">Aucune ligne de devis</Text>
              <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Utilisez "Affiner avec IA" ou ajoutez des lignes manuellement
              </Text>
            </View>
          )}

          {devis.lignes.map((ligne) => (
            <TouchableOpacity
              key={ligne.id}
              onPress={() => handleEditLigne(ligne)}
              activeOpacity={0.7}
            >
              <Card className="mb-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    {ligne.piece ? (
                      <Text className="text-xs text-primary-600 font-medium mb-0.5">{ligne.piece}</Text>
                    ) : null}
                    <Text className="font-medium text-gray-900 dark:text-gray-100" numberOfLines={2}>
                      {ligne.description || 'Sans description'}
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {ligne.quantite} {UNITE_LABELS[ligne.unite] || ligne.unite} × {formatCurrency(ligne.prix_unitaire)}
                    </Text>
                  </View>
                  <View className="items-end flex-row">
                    <Text className="text-lg font-bold text-amber-600 mr-3">
                      {formatCurrency(ligne.total)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => devis.removeLigne(ligne.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={18} color={COLORS.red[500]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}

          {/* Boutons ajouter */}
          <View className="flex-row gap-3 mt-1">
            <TouchableOpacity
              onPress={() => {
                setEditingLigne({
                  id: '',
                  piece: '',
                  description: '',
                  quantite: 1,
                  unite: 'forfait',
                  prix_unitaire: 0,
                  total: 0,
                });
                setShowEditModal(true);
              }}
              className="flex-1 border border-dashed border-primary-300 rounded-xl py-3 flex-row items-center justify-center"
            >
              <Plus size={18} color={COLORS.primary[600]} />
              <Text className="text-primary-600 font-medium ml-2">Ajouter une ligne</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowSuggestions(true)}
              className="flex-1 border border-dashed border-amber-300 rounded-xl py-3 flex-row items-center justify-center"
            >
              <List size={18} color={COLORS.amber[600]} />
              <Text className="text-amber-600 font-medium ml-2">Suggestions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clés manquantes */}
        {estimations.cles_manquantes && estimations.cles_manquantes.length > 0 && (
          <View className="px-4">
            <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Clés manquantes
            </Text>
            {estimations.cles_manquantes.map((cle, index) => (
              <Card key={index} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-medium text-gray-900 dark:text-gray-100">{cle.type}</Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      {cle.manquantes} x {formatCurrency(cle.cout_unitaire)}
                    </Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(cle.total)}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Récapitulatif */}
        <View className="p-4">
          <Text className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Récapitulatif
          </Text>
          <Card>
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <Text className="text-gray-700 dark:text-gray-300">Total HT</Text>
              <Text className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(devis.totalHT)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <Text className="text-gray-700 dark:text-gray-300">TVA 20%</Text>
              <Text className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(devis.tva)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <Text className="text-gray-700 dark:text-gray-300 font-semibold">Total TTC</Text>
              <Text className="font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(devis.totalTTC)}
              </Text>
            </View>
            {totalCles > 0 && (
              <View className="flex-row items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <Text className="text-gray-700 dark:text-gray-300">Clés manquantes</Text>
                <Text className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(totalCles)}
                </Text>
              </View>
            )}
            <View className="flex-row items-center justify-between py-3 mt-2 bg-amber-50 dark:bg-amber-900/30 -mx-4 -mb-4 px-4 rounded-b-xl">
              <Text className="text-amber-800 dark:text-amber-300 font-semibold">Total retenues</Text>
              <Text className="text-xl font-bold text-amber-700 dark:text-amber-300">
                {formatCurrency(devis.totalTTC + totalCles)}
              </Text>
            </View>
          </Card>

          {/* Dépôt / Reste */}
          <Card className="mt-3">
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <Text className="text-gray-700 dark:text-gray-300">Dépôt de garantie</Text>
              <Text className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(depotGarantie)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-gray-700 dark:text-gray-300 font-semibold">
                {depotGarantie >= devis.totalTTC + totalCles ? 'À restituer' : 'Reste à charge'}
              </Text>
              <Text className={`font-bold text-lg ${
                depotGarantie >= devis.totalTTC + totalCles ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(Math.abs(depotGarantie - devis.totalTTC - totalCles))}
              </Text>
            </View>
          </Card>
        </View>

        {/* Grille vétusté */}
        {estimations.grille_vetuste && estimations.grille_vetuste.length > 0 && (
          <View className="px-4">
            <View className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <View className="flex-row items-center mb-3">
                <Info size={18} color={COLORS.blue[600]} />
                <Text className="text-blue-800 dark:text-blue-300 font-medium ml-2">Grille de vétusté</Text>
              </View>
              {estimations.duree_location_mois && (
                <Text className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Durée de location : {estimations.duree_location_mois} mois
                </Text>
              )}
              {estimations.grille_vetuste.map((item, index) => (
                <View key={index} className="flex-row items-center justify-between py-1.5 border-b border-blue-100 dark:border-blue-800">
                  <Text className="text-blue-700 dark:text-blue-300 text-sm">{item.element}</Text>
                  <Text className="text-blue-800 dark:text-blue-200 font-medium text-sm">{item.taux_applique}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info IA */}
        <View className="px-4 mt-4 mb-4">
          <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex-row items-start">
            <Sparkles size={16} color={COLORS.gray[500]} />
            <Text className="text-gray-500 dark:text-gray-400 text-xs ml-2 flex-1">
              Ce devis est indicatif. Les montants réels peuvent varier selon les devis professionnels.
            </Text>
          </View>
        </View>

        <View className="h-4" />
      </ScrollView>

      {/* Footer */}
      <View className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
        <Button
          label={isExporting ? "Export en cours..." : "Exporter PDF"}
          onPress={() => id && exportPdf(id, 'estimations', {
            lignes: devis.lignes.map(l => ({
              piece: l.piece,
              description: l.description,
              quantite: l.quantite,
              unite: l.unite,
              prix_unitaire: l.prix_unitaire,
            }))
          })}
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

      {/* Modal édition ligne */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
            className="flex-1 bg-black/50 justify-end"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              className="bg-white dark:bg-gray-900 rounded-t-2xl p-5"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {editingLigne?.id ? 'Modifier la ligne' : 'Nouvelle ligne'}
                </Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <X size={24} color={COLORS.gray[400]} />
                </TouchableOpacity>
              </View>

              {editingLigne && (
                <View>
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pièce</Text>
                  <TextInput
                    value={editingLigne.piece}
                    onChangeText={(t) => setEditingLigne(prev => prev ? { ...prev, piece: t } : null)}
                    placeholder="Ex: Salon, Cuisine..."
                    style={{ borderWidth: 1, borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200], borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 12, color: isDark ? '#F9FAFB' : COLORS.gray[900], backgroundColor: isDark ? '#1F2937' : undefined }}
                  />

                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</Text>
                  <TextInput
                    value={editingLigne.description}
                    onChangeText={(t) => setEditingLigne(prev => prev ? { ...prev, description: t } : null)}
                    placeholder="Ex: Peinture murale 2 couches"
                    style={{ borderWidth: 1, borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200], borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 12, color: isDark ? '#F9FAFB' : COLORS.gray[900], backgroundColor: isDark ? '#1F2937' : undefined }}
                    multiline
                  />

                  <View className="flex-row gap-3 mb-3">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantité</Text>
                      <TextInput
                        value={String(editingLigne.quantite)}
                        onChangeText={(t) => setEditingLigne(prev => prev ? { ...prev, quantite: parseFloat(t) || 0 } : null)}
                        keyboardType="decimal-pad"
                        style={{ borderWidth: 1, borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200], borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: isDark ? '#F9FAFB' : COLORS.gray[900], backgroundColor: isDark ? '#1F2937' : undefined }}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unité</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {['m2', 'unite', 'ml', 'forfait'].map(u => (
                          <TouchableOpacity
                            key={u}
                            onPress={() => setEditingLigne(prev => prev ? { ...prev, unite: u } : null)}
                            className={`px-3 py-2.5 rounded-lg border ${
                              editingLigne.unite === u
                                ? 'bg-primary-50 border-primary-300'
                                : 'border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <Text className={editingLigne.unite === u ? 'text-primary-700 font-medium' : 'text-gray-600 dark:text-gray-300'}>
                              {UNITE_LABELS[u]}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix unitaire</Text>
                  <TextInput
                    value={String(editingLigne.prix_unitaire)}
                    onChangeText={(t) => setEditingLigne(prev => prev ? { ...prev, prix_unitaire: parseFloat(t) || 0 } : null)}
                    keyboardType="decimal-pad"
                    style={{ borderWidth: 1, borderColor: isDark ? COLORS.gray[700] : COLORS.gray[200], borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 12, color: isDark ? '#F9FAFB' : COLORS.gray[900], backgroundColor: isDark ? '#1F2937' : undefined }}
                  />

                  <View className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3 mb-4">
                    <Text className="text-amber-800 dark:text-amber-300 font-semibold text-center">
                      Total : {formatCurrency((editingLigne.quantite || 0) * (editingLigne.prix_unitaire || 0))}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      if (editingLigne.id) {
                        handleSaveEdit();
                      } else {
                        devis.addLigne({
                          piece: editingLigne.piece,
                          description: editingLigne.description,
                          quantite: editingLigne.quantite,
                          unite: editingLigne.unite,
                          prix_unitaire: editingLigne.prix_unitaire,
                        });
                        setShowEditModal(false);
                        setEditingLigne(null);
                      }
                    }}
                    className="rounded-xl py-3.5 items-center"
                    style={{ backgroundColor: COLORS.primary[600] }}
                  >
                    <Text className="text-white font-semibold">
                      {editingLigne.id ? 'Enregistrer' : 'Ajouter'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal suggestions tarifs */}
      <Modal
        visible={showSuggestions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowSuggestions(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="bg-white dark:bg-gray-900 rounded-t-2xl"
            style={{ maxHeight: '80%' }}
          >
            <View className="flex-row items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">Suggestions tarifs</Text>
              <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                <X size={24} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 py-3">
              {Object.entries(devis.suggestions).map(([type, items]) => (
                <View key={type} className="mb-4">
                  <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {TYPE_LABELS[type] || type}
                  </Text>
                  {items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleAddFromSuggestion(item)}
                      className="flex-row items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800"
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-gray-900 dark:text-gray-100 font-medium">{item.nom}</Text>
                        {item.description && (
                          <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-amber-600 font-bold mr-1">
                          {formatCurrency(item.prix_unitaire)}
                        </Text>
                        <Text className="text-gray-400 text-xs mr-2">
                          /{UNITE_LABELS[item.unite] || item.unite}
                        </Text>
                        <ChevronRight size={16} color={COLORS.gray[300]} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}

              {Object.keys(devis.suggestions).length === 0 && (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color={COLORS.primary[600]} />
                  <Text className="text-gray-500 dark:text-gray-400 mt-3">Chargement des tarifs...</Text>
                </View>
              )}

              <View className="h-8" />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
              Le locataire recevra un email avec le détail du devis.
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
                    const result = await shareByEmail(id, emailInput);
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
