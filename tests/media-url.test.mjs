import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const source = readFileSync(new URL('../src/utils/mediaUrl.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '').replace(/export /g, '');
const resolve = new Function('BASEURL', `${source}; return resolveMediaUrl;`)('http://192.168.3.164:3000/');
const id = '6ace284addf080ed47c89c8f';
test('media URLs use the selected backend for local and production deployments', () => {
  assert.equal(resolve(`http://localhost:3000/api/media/${id}`), `http://192.168.3.164:3000/api/media/${id}`);
  assert.equal(resolve(`http://127.0.0.1:3000/api/media/${id}.pdf?download=1`, 'https://backend.up.railway.app/'), `https://backend.up.railway.app/api/media/${id}.pdf?download=1`);
  assert.equal(resolve({ url: `/api/media/${id}.png` }), `http://192.168.3.164:3000/api/media/${id}.png`);
});
test('external URLs remain intact and empty or unsafe URLs are rejected', () => {
  assert.equal(resolve('https://cdn.example.com/image.jpg'), 'https://cdn.example.com/image.jpg');
  assert.equal(resolve('https://maps.app.goo.gl/example'), 'https://maps.app.goo.gl/example');
  assert.equal(resolve(''), null);
  assert.equal(resolve('javascript:alert(1)'), null);
});
