import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const source = readFileSync(new URL('../src/utils/propertyResources.js', import.meta.url), 'utf8');
const { propertyResources } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const resolve = value => value || null;
test('factsheet GET fields supply the Project Resources URL', () => {
  const url = '/api/media/factsheet.pdf';
  for (const field of ['factSheet', 'factsheet', 'factSheetUrl', 'factsheetUrl', 'fact_sheet']) {
    assert.equal(propertyResources({ [field]: url }, resolve).factSheet, url);
    assert.equal(propertyResources({ [field]: { fileUrl: url } }, resolve).factSheet, url);
  }
});
test('factsheet documents are used when the project field has no file', () => {
  const url = '/uploads/factsheet.pdf';
  for (const type of ['factSheet', 'factsheet', 'fact_sheet', 'fact-sheet', 'Fact Sheet']) {
    const project = { factSheet: {}, documents: [{ type: 'legal', fileUrl: '/legal.pdf' }, { type, fileUrl: url }] };
    assert.equal(propertyResources(project, resolve).factSheet, url);
  }
  assert.equal(propertyResources({ documents: [{ type: 'legal', fileUrl: url }] }, resolve).factSheet, null);
});
test('the project factsheet takes precedence over a document fallback', () => {
  assert.equal(propertyResources({ factSheet: '/current.pdf', documents: [{ type: 'factsheet', fileUrl: '/old.pdf' }] }, resolve).factSheet, '/current.pdf');
});
test('walkthrough opens YouTube separately from the map action', () => {
  const project = { virtualWalkthroughLink: 'https://youtu.be/abcdefghijk', directionLink: 'https://maps.google.com/project', brochure: 'https://files.test/brochure.pdf' };
  assert.deepEqual(propertyResources(project, resolve), { walkthrough: project.virtualWalkthroughLink, directions: project.directionLink, brochure: project.brochure, factSheet: null });
});
test('coordinates only supply the map, never a virtual walkthrough', () => {
  const result = propertyResources({ location: { lat: 23.03, lng: 72.51 } }, resolve);
  assert.equal(result.walkthrough, null);
  assert.ok(result.directions.includes('23.03,72.51'));
});
test('a walkthrough works without a map and missing video stays hidden', () => {
  const video = 'https://www.youtube.com/watch?v=abcdefghijk';
  const result = propertyResources({ virtualWalkthroughLink: video }, resolve);
  assert.equal(result.walkthrough, video);
  assert.equal(result.directions, null);
  assert.equal(propertyResources({ directionLink: 'https://maps.google.com/project' }, resolve).walkthrough, null);
});

test('missing coordinates do not generate an incorrect map location', () => {
  assert.equal(propertyResources({ location: { lat: null, lng: null } }, resolve).directions, null);
  assert.equal(propertyResources({ location: { lat: ' ', lng: ' ' } }, resolve).directions, null);
  assert.ok(propertyResources({ location: { lat: 0, lng: 0 } }, resolve).directions.includes('0,0'));
});
