import { DocumentNode } from '@apollo/client/core';
import {
  UPDATE_ETAT_DES_LIEUX,
  UPDATE_ELEMENT,
  UPDATE_COMPTEUR,
  UPDATE_CLE,
} from './edl';

export const MUTATION_MAP: Record<string, DocumentNode> = {
  UPDATE_ETAT_DES_LIEUX,
  UPDATE_ELEMENT,
  UPDATE_COMPTEUR,
  UPDATE_CLE,
};
