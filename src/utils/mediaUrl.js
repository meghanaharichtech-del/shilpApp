import { BASEURL } from './ApiHelper';

// Project media belongs to the backend selected by the app, even when older
// records contain localhost or a previous deployment host.
export function resolveMediaUrl(resource, baseUrl = BASEURL) {
  const raw = typeof resource === 'string' ? resource : resource?.url || resource?.fileUrl || resource?.uri;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const value = raw.trim();
  try {
    const base = new URL(baseUrl);
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (/^\/api\/media\/[a-f0-9]{24}(?:\.[a-z0-9]+)?$/i.test(url.pathname)) {
      return `${base.origin}${url.pathname}${url.search}${url.hash}`;
    }
    return url.href;
  } catch { return null; }
}
