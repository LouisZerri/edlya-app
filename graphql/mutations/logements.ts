import { gql } from '@apollo/client';

export const CREATE_LOGEMENT = gql`
  mutation CreateLogement($input: createLogementInput!) {
    createLogement(input: $input) {
      logement {
        id
        nom
        adresse
        codePostal
        ville
        type
        surface
        nbPieces
      }
    }
  }
`;

export const UPDATE_LOGEMENT = gql`
  mutation UpdateLogement($input: updateLogementInput!) {
    updateLogement(input: $input) {
      logement {
        id
        nom
        adresse
        codePostal
        ville
        type
        surface
        nbPieces
        description
      }
    }
  }
`;

export const DELETE_LOGEMENT = gql`
  mutation DeleteLogement($input: deleteLogementInput!) {
    deleteLogement(input: $input) {
      logement {
        id
      }
    }
  }
`;
