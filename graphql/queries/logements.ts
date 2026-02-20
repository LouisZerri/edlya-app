import { gql } from '@apollo/client';

export const GET_LOGEMENTS = gql`
  query GetLogements {
    logements {
      edges {
        node {
          id
          nom
          adresse
          codePostal
          ville
          type
          surface
          nbPieces
          photoPrincipale
          createdAt
        }
      }
    }
  }
`;

export const GET_LOGEMENT = gql`
  query GetLogement($id: ID!) {
    logement(id: $id) {
      id
      nom
      adresse
      codePostal
      ville
      type
      surface
      nbPieces
      description
      photoPrincipale
      createdAt
      etatDesLieux {
        totalCount
        edges {
          node {
            id
            type
            statut
            dateRealisation
            locataireNom
          }
        }
      }
    }
  }
`;
