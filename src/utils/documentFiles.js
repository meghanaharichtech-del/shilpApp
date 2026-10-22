import { StorageUtils } from './StorageUtils';
import { resolveMediaUrl } from './mediaUrl';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

// Drive share URLs point to an HTML page, not the document bytes.
export function googleDriveDocument(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || !['drive.google.com', 'www.drive.google.com', 'drive.usercontent.google.com'].includes(parsed.hostname)) return null;
    const id = parsed.pathname.match(/^\/file\/d\/([\w-]+)(?:\/|$)/)?.[1]
      || (/^\/(?:open|uc|download)\/?$/.test(parsed.pathname) ? parsed.searchParams.get('id') : null);
    if (!id || !/^[\w-]+$/.test(id)) return null;
    const resourceKey = parsed.searchParams.get('resourcekey');
    const keyQuery = resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : '';
    return {
      previewUrl: `https://drive.google.com/file/d/${id}/preview${resourceKey ? `?resourcekey=${encodeURIComponent(resourceKey)}` : ''}`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${id}${keyQuery}`,
    };
  } catch { return null; }
}

export function documentFileName(url, title) {
  const extension = url.split(/[?#]/)[0].match(/\.(pdf|png|jpe?g|webp)$/i)?.[1]?.toLowerCase() || 'pdf';
  const name = String(title || 'Project document').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'document';
  let hash = 0;
  for (const char of url) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  return `${name}-${(hash >>> 0).toString(16)}.${extension}`;
}

export async function loadDocumentFile(url, title) {
  url = resolveMediaUrl(url);
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) throw new Error('This document does not have a valid download URL.');
  if (Platform.OS === 'web') { await Linking.openURL(url); return { browser: true }; }
  const drive = googleDriveDocument(url);
  const folder = new Directory(Paths.document, 'project-documents');
  folder.create({ idempotent: true, intermediates: true });
  const target = new File(folder, documentFileName(url, title));
  let saved;
  try {
    const session = await StorageUtils.getItem('userData');
    const token = session?.token || session?.data?.token || session?.accessToken || session?.data?.accessToken;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    saved = await File.downloadFileAsync(drive?.downloadUrl || url, target, {
      idempotent: true,
      headers,
    });
    if (!saved.exists || !saved.size) throw new Error('The downloaded file is empty.');
    const handle = saved.open();
    let bytes;
    try { bytes = handle.readBytes(12); } finally { handle.close(); }
    const signature = String.fromCharCode(...bytes);
    const extension = signature.startsWith('%PDF-') ? 'pdf'
      : bytes[0] === 137 && signature.slice(1, 4) === 'PNG' ? 'png'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg'
      : signature.startsWith('RIFF') && signature.slice(8, 12) === 'WEBP' ? 'webp'
      : null;
    if (!extension) throw new Error('The API link did not return a PDF or supported image. Please ask the admin to check this upload.');
    if (!saved.name.toLowerCase().endsWith(`.${extension}`)) {
      const corrected = new File(folder, saved.name.replace(/\.[^.]+$/, `.${extension}`));
      if (corrected.exists) corrected.delete();
      saved.move(corrected);
      saved = corrected;
    }
  } catch (error) {
    if (target.exists) target.delete();
    if (drive) throw new Error('Unable to download this Google Drive document. Check your connection and ask the owner to allow access to anyone with the link and enable downloads. You can still try viewing it in the app.');
    throw error;
  }
  return saved;
}

export async function downloadDocument(url, title) {
  const saved = await loadDocumentFile(url, title);
  if (saved.browser) return saved;
  // Files stay in the app's documents folder; the system sheet lets users export them.
  if (await Sharing.isAvailableAsync()) {
    const pdf = saved.name.toLowerCase().endsWith('.pdf');
    await Sharing.shareAsync(saved.uri, { dialogTitle: `Save ${title || 'document'}`, ...(pdf ? { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' } : {}) });
  }
  return { uri: saved.uri };
}
