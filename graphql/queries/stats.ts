import { gql } from '@apollo/client';

export const GET_USER_STATS = gql`
  query GetUserStats {
    logements {
      totalCount
    }
    etatDesLieuxes {
      totalCount
    }
  }
`;
