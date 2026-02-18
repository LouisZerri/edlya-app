import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { GRAPHQL_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const errorLink = onError(({ networkError }) => {
  if (networkError && 'statusCode' in networkError && networkError.statusCode === 401) {
    import('../stores/authStore').then(({ useAuthStore }) => {
      useAuthStore.getState().logout();
    });
  }
});

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
  fetch: async (uri, options) => {
    const token = await getToken();
    const headers = {
      ...((options?.headers as Record<string, string>) || {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    };
    return fetch(uri, {
      ...options,
      headers,
    });
  },
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
