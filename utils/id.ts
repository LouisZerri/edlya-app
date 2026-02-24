/**
 * Génère un identifiant local unique avec un préfixe optionnel.
 * Format : `{prefix}_{timestamp}_{random7chars}`
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
