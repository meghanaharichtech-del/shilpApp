export const projectId = project => String(typeof project === 'string' ? project : project?._id || project?.id || '');

// One store owns all hearts. Mutations are optimistic and stale GETs cannot undo them.
export function createFavoritesStore(api) {
  let projects = {}, pending = new Set(), loaded = false, loading = false, error = '';
  let epoch = 0, revision = 0, request = null, ownerToken;
  const listeners = new Set();
  let snapshot;
  const emit = () => {
    snapshot = { projects: Object.values(projects), pending: new Set(pending), loaded, loading, error };
    listeners.forEach(listener => listener(snapshot));
  };
  emit();
  const reset = token => {
    ownerToken = token;
    epoch++; revision++; projects = {}; pending = new Set(); loaded = false; loading = false; error = ''; request = null; emit();
  };
  const refresh = async () => {
    if (request) return request;
    const version = epoch, token = ownerToken, started = revision, hadPending = pending.size > 0;
    loading = true; error = ''; emit();
    const task = (async () => {
      try {
        const rows = await api.list(token);
        if (version === epoch && started === revision && !hadPending && pending.size === 0) {
          projects = Object.fromEntries(rows.map(row => row.project).filter(project => project && projectId(project)).map(project => [projectId(project), project]));
          loaded = true;
        }
      } catch (failure) {
        if (version === epoch) error = failure.message || 'Unable to load favourites';
        throw failure;
      } finally {
        if (version === epoch) { loading = false; emit(); }
      }
    })();
    request = task;
    try { return await task; } finally { if(request === task) request = null; }
  };
  const toggle = async project => {
    const id = projectId(project);
    if (!id) throw new Error('This property does not have an ID');
    const version = epoch;
    if (!loaded) await refresh();
    if (version !== epoch || pending.has(id)) return;
    pending.add(id); revision++;
    const token = ownerToken;
    const previous = projects[id];
    if (previous) { projects = { ...projects }; delete projects[id]; }
    else projects = { [id]: project, ...projects };
    error = ''; emit();
    try {
      if (previous) await api.remove(id, token); else await api.add(id, token);
    } catch (failure) {
      if (version === epoch) {
        projects = { ...projects };
        if (previous) projects[id] = previous; else delete projects[id];
        error = failure.message || 'Unable to update favourite';
      }
      throw failure;
    } finally {
      if (version === epoch) { pending.delete(id); emit(); }
    }
  };
  return { getSnapshot: () => snapshot, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); }, refresh, toggle, reset, isFavorite: project => Boolean(projects[projectId(project)]) };
}
