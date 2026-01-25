import { gql } from '@apollo/client';

export const GET_ETATS_DES_LIEUX = gql`
  query GetEtatsDesLieux {
    etatDesLieuxes {
      edges {
        node {
          id
          type
          dateRealisation
          locataireNom
          statut
          logement {
            id
            nom
            adresse
            ville
          }
          pieces {
            totalCount
          }
        }
      }
    }
  }
`;

export const GET_ETAT_DES_LIEUX = gql`
  query GetEtatDesLieux($id: ID!) {
    etatDesLieux(id: $id) {
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
      logement {
        id
        nom
        adresse
        codePostal
        ville
      }
      pieces {
        edges {
          node {
            id
            nom
            ordre
            observations
            elements {
              edges {
                node {
                  id
                  type
                  nom
                  etat
                  observations
                  degradations
                  photos {
                    edges {
                      node {
                        id
                        chemin
                        legende
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      compteurs {
        edges {
          node {
            id
            type
            numero
            indexValue
            commentaire
          }
        }
      }
      cles {
        edges {
          node {
            id
            type
            nombre
            commentaire
          }
        }
      }
    }
  }
`;

export const GET_RECENT_EDL = gql`
  query GetRecentEdl {
    etatDesLieuxes(first: 3, order: { createdAt: "DESC" }) {
      edges {
        node {
          id
          type
          dateRealisation
          locataireNom
          statut
          logement {
            nom
          }
        }
      }
    }
  }
`;
