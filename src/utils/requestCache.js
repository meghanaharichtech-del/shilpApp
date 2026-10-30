// Bounded, session-scoped memory cache. Nothing survives an app restart.
export function createRequestCache({ ttl = 60000, limit = 50, now = Date.now } = {}) {
  const entries = new Map();
  const pending = new Map();
  let generation = 0;
  const keyFor = (scope, key) => JSON.stringify([scope, key]);
  return {
    clear() { generation += 1; entries.clear(); pending.clear(); },
    peek(scope, key) { return entries.get(keyFor(scope, key))?.value; },
    async load(scope, key, loader, { force = false } = {}) {
      const id = keyFor(scope, key);
      const cached = entries.get(id);
      if (!force && cached && now() - cached.time < ttl) return cached.value;
      if (pending.has(id)) return pending.get(id);
      const version = generation;
      const request = Promise.resolve().then(loader).then(value => {
        if (version === generation) {
          entries.delete(id);
          entries.set(id, { value, time: now() });
          if (entries.size > limit) entries.delete(entries.keys().next().value);
        }
        return value;
      }).finally(() => { if (pending.get(id) === request) pending.delete(id); });
      pending.set(id, request);
      return request;
    },
  };
}
export const projectRequestCache = createRequestCache();
