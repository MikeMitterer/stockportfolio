/**
 * Ersatz für den `localStorage`.
 *
 * Die jsdom-Umgebung dieses Projekts bringt keinen mit — `window.localStorage`
 * ist dort schlicht `undefined`. Wer Theme, Sprache oder eingeklappte Gruppen
 * testet, braucht also einen.
 *
 * Stand einmal wortgleich in `stores/theme.spec.ts` und `stores/locale.spec.ts`;
 * mit der dritten Kopie wäre es der Fall aus den Hausregeln geworden — die
 * Kopie, die man beim zweiten Mal duldet, ist beim dritten auseinandergelaufen.
 */

/** Ein `Storage` im Arbeitsspeicher, ohne Bindung ans Fenster. */
export function fakeStorage(): Storage {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size
    },
  } as Storage
}

/**
 * Hängt einen frischen Speicher ans Fenster und gibt ihn zurück.
 *
 * `configurable`, damit der nächste `beforeEach` ihn wieder ersetzen kann.
 */
export function installFakeStorage(): Storage {
  const storage = fakeStorage()
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
  return storage
}
