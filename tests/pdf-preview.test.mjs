import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const html = readFileSync(new URL('../src/assets/pdf-viewer/viewer.html', import.meta.url), 'utf8');
const code = html.match(/<script type="module">([\s\S]*)<\/script>/)[1]
  .replace(/globalThis\.pdfjsWorker = await import\(moduleUrl\('[^']+'\)\);/, '')
  .replace(/const pdfjs = await import\(moduleUrl\('[^']+'\)\);/, '');
async function reader() {
  const rendered = [];
  const container = { replaceChildren() { rendered.length = 0; }, appendChild() {} };
  const status = { style: {} };
  const document = {
    body: { classList: { toggle() {} } },
    getElementById: id => id === 'pages' ? container : status,
    createElement: () => ({ style: {}, getContext: () => ({}) }),
  };
  const window = { innerWidth: 360, innerHeight: 300, devicePixelRatio: 1 };
  const pdfjs = { getDocument: () => ({ promise: Promise.resolve({ numPages: 3, getPage: async number => ({
    getViewport: ({scale}) => ({ width: 600 * scale, height: 800 * scale }),
    render: () => ({ promise: Promise.resolve().then(() => rendered.push(number)) }), cleanup() {},
  }) }) }) };
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  await new AsyncFunction('window', 'document', 'pdfjs', code)(window, document, pdfjs);
  return { window, rendered };
}
test('preview renders only the first page, with no navigation or zoom toolbar', async () => {
  const {window, rendered} = await reader();
  await window.renderPdf('JVBERg==', true);
  assert.deepEqual(rendered, [1]);
  assert.ok(!html.includes('<nav>'));
  assert.ok(html.includes('body.preview #toolbar{display:none}'));
  assert.ok(html.includes('aria-label="Zoom in"')); 
});
test('opened PDF renders all pages in sequence for scrolling', async () => {
  const {window, rendered} = await reader();
  await window.renderPdf('JVBERg==', false);
  assert.deepEqual(rendered, [1, 2, 3]);
});
