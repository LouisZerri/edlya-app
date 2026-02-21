import { useMemo } from 'react';
import { View, Text, Animated, useColorScheme } from 'react-native';
import { ElementEtat } from '../../types';
import { PieceNode, CompteurNode, CleNode, GraphQLEdge, ElementNode } from '../../types/graphql';
import { EdlFormData } from '../../hooks/useEdlInitializer';

interface EdlProgressBarProps {
  formData: EdlFormData;
  localPieces: PieceNode[];
  localCompteurs: CompteurNode[];
  localCles: CleNode[];
  compteurValues: Record<string, string>;
  cleValues: Record<string, number>;
  elementStates: Record<string, ElementEtat>;
}

export function EdlProgressBar({
  formData,
  localPieces,
  localCompteurs,
  localCles,
  compteurValues,
  cleValues,
  elementStates,
}: EdlProgressBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { progress, filled, total } = useMemo(() => {
    let filled = 0;
    let total = 0;

    // Infos : locataireNom + dateRealisation (2 champs obligatoires)
    total += 2;
    if (formData.locataireNom.trim()) filled++;
    if (formData.dateRealisation.trim()) filled++;

    // Compteurs : chaque compteur avec un index rempli
    localCompteurs.forEach((c) => {
      total++;
      if (compteurValues[c.id]?.trim()) filled++;
    });

    // Clés : chaque clé avec nombre > 0
    localCles.forEach((c) => {
      total++;
      if ((cleValues[c.id] || 0) > 0) filled++;
    });

    // Éléments : chaque élément avec un état défini
    localPieces.forEach((p) => {
      const elements = p.elements?.edges?.map((e: GraphQLEdge<ElementNode>) => e.node) || [];
      elements.forEach((el) => {
        total++;
        if (elementStates[el.id]) filled++;
      });
    });

    // Minimum 1 pour éviter division par 0
    const progress = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { progress, filled, total };
  }, [formData, localPieces, localCompteurs, localCles, compteurValues, cleValues, elementStates]);

  const barColor = progress === 100 ? '#10B981' : progress >= 50 ? '#6366F1' : '#F59E0B';

  return (
    <View className="bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Progression
        </Text>
        <Text style={{ color: barColor }} className="text-sm font-bold">
          {progress}%
        </Text>
      </View>
      <View
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: isDark ? '#374151' : '#E5E7EB' }}
      >
        <View
          style={{
            width: `${progress}%`,
            backgroundColor: barColor,
            height: '100%',
            borderRadius: 9999,
          }}
        />
      </View>
      <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {filled}/{total} champs remplis
      </Text>
    </View>
  );
}
