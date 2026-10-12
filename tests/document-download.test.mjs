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
    delete() { this.exists = false; calls.push(['delete']); }
  }
  const Sharing = { isAvailableAsync: async () => true, shareAsync: async (...args) => calls.push(['share', ...args]) };
  const api = new Function('Directory', 'File', 'Paths', 'Sharing', 'Linking', 'Platform', `${source}\nreturn { downloadDocument, loadDocumentFile, documentFileName };`)(Directory, File, { document: 'file:///documents' }, Sharing, {}, { OS: 'android' });
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
