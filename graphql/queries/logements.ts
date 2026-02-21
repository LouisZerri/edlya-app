import { gql } from '@apollo/client';

export const GET_LOGEMENTS = gql`
  query GetLogements($first: Int, $after: String) {
    logements(first: $first, after: $after) {
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
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
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
            locataireEmail
            locataireTelephone
          }
        }
      }
    }
  }
`;
