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

const fileLoads = new Map();
const recentFiles = new Map();

export async function loadDocumentFile(url, title) {
  if (Platform.OS === 'web') return loadDocumentBytes(url, title);
  const session = await StorageUtils.getItem('userData');
  const token = session?.token || session?.data?.token || session?.accessToken || session?.data?.accessToken;
  const key = JSON.stringify([token, resolveMediaUrl(url), title]);
  const cached = recentFiles.get(key);
  if (cached && Date.now() - cached.time < 60000 && cached.file.exists && cached.file.size) return cached.file;
  if (fileLoads.has(key)) return fileLoads.get(key);
  const request = loadDocumentBytes(url, title, token).then(file => {
    recentFiles.delete(key);
    recentFiles.set(key, { file, time: Date.now() });
    if (recentFiles.size > 50) recentFiles.delete(recentFiles.keys().next().value);
    return file;
  }).finally(() => fileLoads.delete(key));
  fileLoads.set(key, request);
  return request;
}

async function loadDocumentBytes(url, title, token) {
  url = resolveMediaUrl(url);
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) throw new Error('This document does not have a valid download URL.');
  if (Platform.OS === 'web') { await Linking.openURL(url); return { browser: true }; }
  const drive = googleDriveDocument(url);
  const folder = new Directory(Paths.document, 'project-documents');
  folder.create({ idempotent: true, intermediates: true });
  const target = new File(folder, documentFileName(url, title));
  let saved;
  try {
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
      await saved.move(corrected);
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

export function documentMimeType(name) {
  if (/\.png$/i.test(name)) return 'image/png';
  if (/\.webp$/i.test(name)) return 'image/webp';
  if (/\.jpe?g$/i.test(name)) return 'image/jpeg';
  return 'application/pdf';
}

export async function shareDocument(url, title) {
  if (Platform.OS === 'web') {
    if (!globalThis.navigator?.share) throw new Error('Sharing is not supported by this browser. Please download the file instead.');
    await globalThis.navigator.share({ title, url: resolveMediaUrl(url) });
    return;
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is not available on this device.');
  const file = await loadDocumentFile(url, title);
  await Sharing.shareAsync(file.uri, { dialogTitle: `Share ${title || 'file'}`, mimeType: documentMimeType(file.name), ...(file.name.endsWith('.pdf') ? { UTI: 'com.adobe.pdf' } : {}) });
}

export async function saveDocumentFile(url, title) {
  if (Platform.OS === 'web') {
    const resolved = resolveMediaUrl(url);
    if (!resolved) throw new Error('This file does not have a valid download URL.');
    const session = await StorageUtils.getItem('userData');
    const token = session?.token || session?.accessToken || session?.data?.token || session?.data?.accessToken;
    const headers = token && new URL(resolved).origin === new URL(resolveMediaUrl('/')).origin ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(googleDriveDocument(resolved)?.downloadUrl || resolved, { headers });
    if (!response.ok) throw new Error('Unable to download this file.');
    const blob = await response.blob();
    if (!/^(application\/pdf|image\/(png|jpeg|webp))\b/i.test(blob.type)) throw new Error('The link did not return a PDF or supported photo.');
    const objectUrl = URL.createObjectURL(blob);
    const link = globalThis.document.createElement('a');
    link.href = objectUrl;
    link.download = documentFileName(resolved, title).replace(/\.[^.]+$/, `.${blob.type === 'application/pdf' ? 'pdf' : blob.type.split('/')[1]}`);
    globalThis.document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    return { browser: true };
  }
  const file = await loadDocumentFile(url, title);
  // The system folder picker provides access without broad storage permissions.
  const folder = await Directory.pickDirectoryAsync();
  const name = file.name.replace(/(\.[^.]+)$/, `-${Date.now()}$1`);
  const destination = folder.createFile(name, documentMimeType(file.name));
  try { await file.copy(destination, { overwrite: true }); }
  catch (error) { if (destination.exists) destination.delete(); throw error; }
  return { uri: destination.uri };
}
