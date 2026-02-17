import { useInternetIdentity } from '../hooks/useInternetIdentity';

export function formatCurrency(amount: number, currencyCode?: string): string {
  const currency = currencyCode || getCurrency();
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getCurrency(): string {
  if (typeof window === 'undefined') return 'USD';
  
  try {
    const identity = (window as any).__identity;
    if (!identity) return 'USD';
    
    const storageKey = `firefly-settings-${identity.getPrincipal().toString()}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const settings = JSON.parse(stored);
      return settings.currency || 'USD';
    }
  } catch (e) {
    console.error('Failed to get currency', e);
  }
  
  return 'USD';
}
