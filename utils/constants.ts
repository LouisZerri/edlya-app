// Pour téléphone physique, utiliser l'IP locale du PC
// Pour émulateur Android: 10.0.2.2
// Pour simulateur iOS: 127.0.0.1
// Pour test distant: utiliser ngrok

// URL locale (développement)
// export const BASE_URL = 'http://192.168.1.135:8000';

// URL locale (version web / dev)
// export const BASE_URL = 'http://localhost:8000';

// URL tunnel (test distant / téléphone)
export const BASE_URL = 'https://dorathy-perspectiveless-besiegingly.ngrok-free.dev';

export const API_URL = `${BASE_URL}/api`;
export const GRAPHQL_URL = `${API_URL}/graphql`;
export const UPLOADS_URL = `${BASE_URL}/uploads`;

export const COLORS = {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
  },
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  green: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  orange: {
    100: '#FFEDD5',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
  },
  blue: {
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

export const SPACING = {
  screenPadding: 16,
  cardPadding: 16,
  gap: 12,
};
