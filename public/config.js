/**
 * Laufzeit-Konfiguration.
 *
 * Diese Fassung ist der Platzhalter für Entwicklung und Vorschau: Der leere
 * Wert lässt die App auf `VITE_STOCKINFO_API_URL` aus dem `.env` zurückfallen.
 *
 * Im Container überschreibt der Entrypoint die Datei mit dem Wert aus
 * `STOCKINFO_API_URL` — dadurch spricht dasselbe Abbild je nach Umgebung ein
 * anderes Backend an, ohne neu gebaut zu werden.
 */
window.__STOCKPORTFOLIO_CONFIG__ = { apiUrl: '' }
