import { gql } from '@apollo/client';

export const GET_USER_STATS = gql`
  query GetUserStats {
    logements {
      totalCount
    }
    etatDesLieuxes {
      totalCount
    }
    enAttente: etatDesLieuxes(statut_list: ["brouillon", "en_cours"]) {
      totalCount
    }
    signes: etatDesLieuxes(statut: "signe") {
      totalCount
    }
    entrees: etatDesLieuxes(type: "entree") {
      totalCount
    }
    sorties: etatDesLieuxes(type: "sortie") {
      totalCount
    }
  }
`;
