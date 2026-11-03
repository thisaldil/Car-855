import { useQuery } from '@tanstack/react-query';
import { get } from '../services/api.js';
export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: () => get('/settings').then((r) => r.data) }).data || {};
export function useTitle(title, description) {
  document.title = title ? `${title} | Cars@855` : 'Cars@855';
  if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
}
