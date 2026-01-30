import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core';
import { GRAPHQL_URL } from '../utils/constants';
import { getToken } from '../utils/storage';

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
  fetch: async (uri, options) => {
    const token = await getToken();
    const headers = {
      ...((options?.headers as Record<string, string>) || {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      'ngrok-skip-browser-warning': 'true',
      'Bypass-Tunnel-Reminder': 'true',
    };
    return fetch(uri, {
      ...options,
      headers,
    });
  },
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
