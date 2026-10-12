import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const source = readFileSync(new URL('../src/utils/propertyResources.js', import.meta.url), 'utf8');
const { propertyResources } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const resolve = value => value || null;
test('Virtual Walkthrough opens the same project map as the location icon', () => {
  const project = { virtualTourUrl: 'https://files.test/tour.mp4', directionLink: 'https://maps.google.com/project', brochure: 'https://files.test/brochure.pdf' };
  assert.deepEqual(propertyResources(project, resolve), { walkthrough: project.directionLink, directions: project.directionLink, brochure: project.brochure });
});
test('walkthrough uses location coordinates when a directions URL is missing', () => {
  const result = propertyResources({ location: { lat: 23.03, lng: 72.51 } }, resolve);
  assert.equal(result.walkthrough, result.directions);
  assert.ok(result.walkthrough.includes('23.03,72.51'));
});
test('video URL cannot become the walkthrough destination when location is missing', () => {
  assert.equal(propertyResources({ virtualTourUrl: 'https://files.test/tour.mp4' }, resolve).walkthrough, null);
});

test('missing coordinates do not generate an incorrect map location', () => {
  assert.equal(propertyResources({ location: { lat: null, lng: null } }, resolve).directions, null);
  assert.equal(propertyResources({ location: { lat: ' ', lng: ' ' } }, resolve).directions, null);
  assert.ok(propertyResources({ location: { lat: 0, lng: 0 } }, resolve).directions.includes('0,0'));
});
