export interface LocalStorageMock extends Storage {
  getStore(): Record<string, string>;
}

export function createLocalStorageMock(initialStore: Record<string, string> = {}): LocalStorageMock {
  const store = new Map(Object.entries(initialStore));

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    getStore() {
      return Object.fromEntries(store);
    }
  };
}

export function createWindowWithLocalStorage(localStorage = createLocalStorageMock()) {
  return {
    localStorage
  } as unknown as Window & typeof globalThis;
}
