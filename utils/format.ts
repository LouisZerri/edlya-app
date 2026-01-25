import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, pattern, { locale: fr });
  } catch {
    return '';
  }
}

// Convertir YYYY-MM-DD (API) → DD/MM/YYYY (affichage)
export function apiDateToDisplay(apiDate: string): string {
  if (!apiDate) return '';
  try {
    // Enlever le timestamp si présent
    const dateOnly = apiDate.includes('T') ? apiDate.split('T')[0] : apiDate;
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return apiDate;
  }
}

// Convertir DD/MM/YYYY (affichage) → YYYY-MM-DD (API)
export function displayDateToApi(displayDate: string): string {
  if (!displayDate) return '';
  try {
    const [day, month, year] = displayDate.split('/');
    return `${year}-${month}-${day}`;
  } catch {
    return displayDate;
  }
}

export function formatDateLong(date: string | Date): string {
  return formatDate(date, 'd MMMM yyyy');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatSurface(surface: number): string {
  return `${surface} m²`;
}
