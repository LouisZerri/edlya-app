import { LogementNode } from '../types';

interface LogementExtrait {
  adresse?: string;
  code_postal?: string;
  ville?: string;
  type?: string;
  surface?: number;
}

export function similarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return 1;
  if (str1.includes(str2) || str2.includes(str1)) return 0.8;

  // Jaccard similarity sur les mots
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

export function findBestMatch(
  extractedLogement: LogementExtrait,
  logements: LogementNode[]
): { logement: LogementNode; score: number } | null {
  if (!extractedLogement || logements.length === 0) return null;

  let bestMatch: { logement: LogementNode; score: number } | null = null;

  for (const logement of logements) {
    let score = 0;
    let factors = 0;

    if (extractedLogement.adresse && logement.adresse) {
      score += similarity(extractedLogement.adresse, logement.adresse) * 3;
      factors += 3;
    }

    if (extractedLogement.ville && logement.ville) {
      score += similarity(extractedLogement.ville, logement.ville) * 2;
      factors += 2;
    }

    if (extractedLogement.code_postal && logement.codePostal) {
      score += (extractedLogement.code_postal === logement.codePostal ? 1 : 0);
      factors += 1;
    }

    if (factors > 0) {
      const normalizedScore = score / factors;
      if (!bestMatch || normalizedScore > bestMatch.score) {
        bestMatch = { logement, score: normalizedScore };
      }
    }
  }

  return bestMatch && bestMatch.score > 0.5 ? bestMatch : null;
}
