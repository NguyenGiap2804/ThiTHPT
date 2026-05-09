import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ASSET_BASE_URL } from './config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
export function formatScore(score: any, decimals: number = 1): string {
  const num = Number(score);
  return isNaN(num) ? '0.0' : num.toFixed(decimals);
}

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${ASSET_BASE_URL}${cleanPath}`;
}
