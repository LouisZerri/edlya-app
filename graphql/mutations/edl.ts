import { gql } from '@apollo/client';

export const CREATE_ETAT_DES_LIEUX = gql`
  mutation CreateEtatDesLieux($input: createEtatDesLieuxInput!) {
    createEtatDesLieux(input: $input) {
      etatDesLieux {
        id
        type
        dateRealisation
        locataireNom
        statut
      }
    }
  }
`;

export const UPDATE_ETAT_DES_LIEUX = gql`
  mutation UpdateEtatDesLieux($input: updateEtatDesLieuxInput!) {
    updateEtatDesLieux(input: $input) {
      etatDesLieux {
        id
        type
        dateRealisation
        locataireNom
        locataireEmail
        locataireTelephone
        observationsGenerales
        statut
        signatureBailleur
        signatureLocataire
        dateSignatureBailleur
        dateSignatureLocataire
      }
    }
  }
`;

export const DELETE_ETAT_DES_LIEUX = gql`
  mutation DeleteEtatDesLieux($input: deleteEtatDesLieuxInput!) {
    deleteEtatDesLieux(input: $input) {
      etatDesLieux {
        id
      }
    }
  }
`;

export const CREATE_PIECE = gql`
  mutation CreatePiece($input: createPieceInput!) {
    createPiece(input: $input) {
      piece {
        id
        nom
        ordre
      }
    }
  }
`;

export const CREATE_ELEMENT = gql`
  mutation CreateElement($input: createElementInput!) {
    createElement(input: $input) {
      element {
        id
        type
        nom
        etat
        observations
      }
    }
  }
`;

export const UPDATE_ELEMENT = gql`
  mutation UpdateElement($input: updateElementInput!) {
    updateElement(input: $input) {
      element {
        id
        type
        nom
        etat
        observations
        degradations
      }
    }
  }
`;

export const CREATE_COMPTEUR = gql`
  mutation CreateCompteur($input: createCompteurInput!) {
    createCompteur(input: $input) {
      compteur {
        id
        type
        numero
        indexValue
      }
    }
  }
`;

export const UPDATE_COMPTEUR = gql`
  mutation UpdateCompteur($input: updateCompteurInput!) {
    updateCompteur(input: $input) {
      compteur {
        id
        type
        numero
        indexValue
        commentaire
      }
    }
  }
`;

export const CREATE_CLE = gql`
  mutation CreateCle($input: createCleInput!) {
    createCle(input: $input) {
      cle {
        id
        type
        nombre
      }
    }
  }
`;

export const UPDATE_CLE = gql`
  mutation UpdateCle($input: updateCleInput!) {
    updateCle(input: $input) {
      cle {
        id
        type
        nombre
        commentaire
      }
    }
  }
`;

export const DELETE_PIECE = gql`
  mutation DeletePiece($input: deletePieceInput!) {
    deletePiece(input: $input) {
      piece {
        id
      }
    }
  }
`;

export const DELETE_COMPTEUR = gql`
  mutation DeleteCompteur($input: deleteCompteurInput!) {
    deleteCompteur(input: $input) {
      compteur {
        id
      }
    }
  }
`;

export const DELETE_CLE = gql`
  mutation DeleteCle($input: deleteCleInput!) {
    deleteCle(input: $input) {
      cle {
        id
      }
    }
  }
`;

export const DELETE_ELEMENT = gql`
  mutation DeleteElement($input: deleteElementInput!) {
    deleteElement(input: $input) {
      element {
        id
      }
    }
  }
`;
