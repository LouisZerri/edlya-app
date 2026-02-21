import { useState, useEffect, useRef } from 'react';

export interface AddressSuggestion {
  label: string;
  adresse: string;
  codePostal: string;
  ville: string;
}

interface GeoFeature {
  properties: {
    label: string;
    name: string;
    postcode: string;
    city: string;
  };
}

const API_URL = 'https://api-adresse.data.gouv.fr/search';
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 4;

export function useAddressSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Nettoyer le timer précédent
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Pas assez de caractères → vider les suggestions
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    timerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query.trim(), limit: '5' });
        const response = await fetch(`${API_URL}?${params}`);
        const data = await response.json();

        const results: AddressSuggestion[] = (data.features || []).map(
          (feature: GeoFeature) => ({
            label: feature.properties.label,
            adresse: feature.properties.name,
            codePostal: feature.properties.postcode,
            ville: feature.properties.city,
          })
        );

        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query]);

  const clearSuggestions = () => setSuggestions([]);

  return { query, setQuery, suggestions, isSearching, clearSuggestions };
}
