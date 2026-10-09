import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const source = readFileSync(new URL('../src/utils/propertyResources.js', import.meta.url), 'utf8');
const { propertyResources } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const resolve = value => value || null;
test('walkthrough, directions and brochure use their own canonical API fields', () => {
  const project = { virtualTourUrl: 'https://files.test/tour.mp4', virtualWalkthrough: 'https://maps.google.com/legacy', directionLink: 'https://maps.google.com/project', brochure: 'https://files.test/brochure.pdf' };
  assert.deepEqual(propertyResources(project, resolve), { walkthrough: project.virtualTourUrl, directions: project.directionLink, brochure: project.brochure });
});
test('missing walkthrough never opens map as fallback', () => {
  assert.equal(propertyResources({ directionLink: 'https://maps.google.com/project' }, resolve).walkthrough, null);
});
