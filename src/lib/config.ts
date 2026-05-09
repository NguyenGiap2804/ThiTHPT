const DEFAULT_API_BASE_URL = 'https://thithpt-backend.onrender.com/api';

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = trimTrailingSlashes(
  configuredApiBaseUrl || DEFAULT_API_BASE_URL
);

const configuredAssetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL?.trim();
const inferredAssetBaseUrl = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;

export const ASSET_BASE_URL = trimTrailingSlashes(
  configuredAssetBaseUrl || inferredAssetBaseUrl
);
