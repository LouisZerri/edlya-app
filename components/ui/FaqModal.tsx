import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { COLORS } from '../../utils/constants';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Comment créer un état des lieux ?",
    answer: "Allez dans l'onglet EDL, appuyez sur le bouton '+' puis sélectionnez un logement, le type (entrée/sortie), renseignez les informations du locataire et choisissez une typologie pour pré-remplir les pièces.",
  },
  {
    question: "Comment importer un PDF existant ?",
    answer: "Depuis l'écran d'accueil, appuyez sur 'Importer un PDF'. Sélectionnez votre fichier PDF, l'IA analysera le document et extraira automatiquement les informations (pièces, éléments, compteurs, clés, photos).",
  },
  {
    question: "Comment ajouter des photos ?",
    answer: "Dans l'éditeur EDL, ouvrez une pièce puis un élément. Appuyez sur le bouton photo pour prendre une photo ou en sélectionner une depuis votre galerie. Vous pouvez ajouter jusqu'à 5 photos par élément.",
  },
  {
    question: "Comment fonctionne l'analyse IA ?",
    answer: "L'IA peut analyser vos photos pour détecter automatiquement l'état des éléments et les dégradations. Appuyez sur le bouton 'Analyser avec IA' sous les photos d'un élément. Vous pouvez aussi scanner une pièce entière.",
  },
  {
    question: "Comment signer un état des lieux ?",
    answer: "Allez dans le détail de l'EDL et appuyez sur 'Signer'. Le bailleur signe en premier sur l'écran tactile, puis un lien de signature est envoyé par email au locataire.",
  },
  {
    question: "Comment générer le comparatif entrée/sortie ?",
    answer: "Le comparatif est disponible uniquement pour les EDL de sortie. Allez dans le détail de l'EDL de sortie et appuyez sur 'Comparatif'. L'application trouvera automatiquement l'EDL d'entrée correspondant.",
  },
  {
    question: "Comment estimer les coûts de réparation ?",
    answer: "Depuis un EDL de sortie, appuyez sur 'Estimations'. L'application calculera automatiquement les coûts en fonction des dégradations constatées, avec application d'une grille de vétusté.",
  },
  {
    question: "Qu'est-ce que l'amélioration d'observation ?",
    answer: "Le bouton étincelle à côté de chaque champ d'observation permet à l'IA de reformuler votre texte en langage professionnel et concis (max 100 caractères), adapté aux états des lieux.",
  },
  {
    question: "Les données sont-elles sauvegardées automatiquement ?",
    answer: "Oui, l'éditeur sauvegarde automatiquement vos modifications après 3 secondes d'inactivité. Un indicateur en haut de l'écran vous montre le statut de sauvegarde.",
  },
  {
    question: "Comment partager un EDL ?",
    answer: "Depuis le detail d'un EDL, vous pouvez exporter en PDF ou envoyer directement par email au locataire via le bouton de partage.",
  },
];

interface FaqModalProps {
  visible: boolean;
  onClose: () => void;
}

function FaqItemComponent({ item }: { item: FaqItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      className="mb-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between p-4">
        <Text className="flex-1 font-medium text-gray-800 dark:text-gray-200 pr-3">{item.question}</Text>
        {expanded ? (
          <ChevronUp size={20} color={COLORS.gray[400]} />
        ) : (
          <ChevronDown size={20} color={COLORS.gray[400]} />
        )}
      </View>
      {expanded && (
        <View className="px-4 pb-4 pt-0">
          <View className="h-px bg-gray-100 dark:bg-gray-700 mb-3" />
          <Text className="text-gray-600 dark:text-gray-300 text-sm leading-5">{item.answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function FaqModal({ visible, onClose }: FaqModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
          <View className="flex-row items-center">
            <HelpCircle size={24} color={COLORS.primary[600]} />
            <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 ml-3">FAQ</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
          >
            <X size={20} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Questions fréquemment posées sur l'utilisation d'Edlya
          </Text>

          {FAQ_ITEMS.map((item, index) => (
            <FaqItemComponent key={index} item={item} />
          ))}

          <View className="h-8" />
        </ScrollView>
      </View>
    </Modal>
  );
}
