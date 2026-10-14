import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const source = readFileSync(new URL('../src/utils/documentFiles.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace(/export /g, '');
function runtime({ header = '%PDF-', fail = false } = {}) {
  const calls = []; let target;
  class Directory { create(options) { calls.push(['folder', options]); } }
  class File {
    constructor(folder, name) { target = this; this.name = name; this.uri = `file:///documents/${name}`; this.exists = false; this.size = 0; }
    static async downloadFileAsync(url, file, options) { calls.push(['download', url, options]); file.exists = true; file.size = 30; if (fail) throw new Error('Network failed'); return file; }
    open() { return { readBytes: () => Uint8Array.from([...header].map(c => c.charCodeAt(0))), close() { calls.push(['close']); } }; }
    move(file) { this.name = file.name; this.uri = file.uri; }
    delete() { this.exists = false; calls.push(['delete']); }
  }
  const Sharing = { isAvailableAsync: async () => true, shareAsync: async (...args) => calls.push(['share', ...args]) };
  const api = new Function('resolveMediaUrl', 'Directory', 'File', 'Paths', 'Sharing', 'Linking', 'Platform', `${source}\nreturn { downloadDocument, loadDocumentFile, documentFileName, googleDriveDocument };`)(value => value?.replace("http://localhost:3000", "http://192.168.3.164:3000"), Directory, File, { document: 'file:///documents' }, Sharing, {}, { OS: 'android' });
  return { ...api, calls, target: () => target };
}
test('downloads API URL to persistent local PDF and exports with PDF MIME', async () => {
  const r = runtime(); const url = 'https://storage.test/legal.pdf?token=abc';
  const result = await r.downloadDocument(url, 'RERA certificate');
  assert.equal(result.uri, r.target().uri);
  assert.equal(r.calls.find(c => c[0] === 'download')[1], url);
  assert.equal(r.calls.find(c => c[0] === 'share')[2].mimeType, 'application/pdf');
});
test('bad PDF and interrupted transfer are cleaned up and never shared', async () => {
  for (const options of [{ header: '<html' }, { fail: true }]) {
    const r = runtime(options); await assert.rejects(r.downloadDocument('https://storage.test/legal.pdf', 'Legal'));
    assert.ok(r.calls.some(c => c[0] === 'delete')); assert.ok(!r.calls.some(c => c[0] === 'share'));
  }
});
test('file names are safe, unique per URL and preserve image extensions', () => {
  const r = runtime();
  assert.notEqual(r.documentFileName('https://a.test/1.pdf', '../Legal'), r.documentFileName('https://a.test/2.pdf', '../Legal'));
  assert.ok(!r.documentFileName('https://a.test/1.pdf', '../Legal').includes('/'));
  assert.ok(r.documentFileName('https://a.test/plan.JPG', 'Plan').endsWith('.jpg'));
});

test('PDF preview loads the document without opening the save/share sheet', async () => {
  const r = runtime();
  const file = await r.loadDocumentFile('https://storage.test/brochure.pdf', 'Brochure');
  assert.equal(file.uri, r.target().uri);
  assert.ok(!r.calls.some(call => call[0] === 'share'));
});

test('legacy extensionless images are identified by bytes and renamed for preview', async () => {
  const r = runtime({ header: String.fromCharCode(137) + 'PNG\r\n' });
  const file = await r.loadDocumentFile('http://localhost:3000/api/media/6ace284addf080ed47c89c8f', 'Legal');
  assert.ok(file.name.endsWith('.png'));
  assert.ok(r.calls.find(call => call[0] === 'download')[1].startsWith('http://192.168.3.164:3000/'));
});

test('Drive share and download links download file bytes and preserve resource keys', async () => {
  for (const path of ['file/d/test_ID-123/view?usp=sharing&', 'open?id=test_ID-123&', 'uc?id=test_ID-123&']) {
    const r = runtime();
    await r.downloadDocument(`https://drive.google.com/${path}resourcekey=key-123`, 'Brochure');
    assert.equal(r.calls.find(call => call[0] === 'download')[1], 'https://drive.google.com/uc?export=download&id=test_ID-123&resourcekey=key-123');
    assert.ok(r.calls.some(call => call[0] === 'share'));
  }
});

test('Drive HTML and network failures give actionable errors and never share invalid files', async () => {
  for (const options of [{ header: '<html' }, { fail: true }]) {
    const r = runtime(options);
    await assert.rejects(r.downloadDocument('https://drive.google.com/file/d/test123/view', 'Brochure'), /anyone with the link/);
    assert.ok(r.calls.some(call => call[0] === 'delete'));
    assert.ok(!r.calls.some(call => call[0] === 'share'));
  }
});

test('unrelated hosts and Drive folders are not rewritten as file downloads', async () => {
  for (const url of ['https://drive.google.com.evil.test/file/d/test/view', 'https://drive.google.com/drive/folders/test']) {
    const r = runtime();
    await r.loadDocumentFile(url, 'Document');
    assert.equal(r.calls.find(call => call[0] === 'download')[1], url);
  }
});

test('Drive preview keeps the resource key and accepts download URLs', () => {
  const r = runtime();
  assert.equal(r.googleDriveDocument('https://drive.google.com/file/d/test123/view?resourcekey=a%2Bb').previewUrl,
    'https://drive.google.com/file/d/test123/preview?resourcekey=a%2Bb');
  assert.equal(r.googleDriveDocument('https://drive.usercontent.google.com/download?id=test123').previewUrl,
    'https://drive.google.com/file/d/test123/preview');
  for (const url of [null, 'invalid', 'https://drive.google.com/drive/folders/test', 'https://drive.google.com/open?id=../test']) {
    assert.equal(r.googleDriveDocument(url), null);
  }
});
