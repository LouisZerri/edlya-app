import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink } from '@apollo/client/core';
import { ErrorLink } from '@apollo/client/link/error';
import { ServerError } from '@apollo/client/errors';
import { tap } from 'rxjs';
import { GRAPHQL_URL } from '../utils/constants';
import { getToken } from '../utils/storage';
import { restoreCache, persistCacheOnWrite } from '../utils/cachePersistence';

export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        logements: { merge: true },
        etatDesLieuxes: { merge: true },
      },
    },
  },
});

const errorLink = new ErrorLink(({ error }) => {
  if (ServerError.is(error) && error.statusCode === 401) {
    import('../stores/authStore').then(({ useAuthStore }) => {
      useAuthStore.getState().logout();
    });
  }
});

const persistLink = new ApolloLink((operation, forward) => {
  return forward(operation).pipe(
    tap(() => {
      persistCacheOnWrite(cache);
    })
  );
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
  link: from([errorLink, persistLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export async function initializeApollo(): Promise<void> {
  await restoreCache(cache);
}
