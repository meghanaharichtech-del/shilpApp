const listeners = new Set();

export function onDataChanged(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyDataChanged() {
  listeners.forEach((listener) => listener());
}
