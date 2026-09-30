# T-61: Private Depotdaten über die Konto-API

**Ziel:** Der StockPortfolio-Server speichert Depots, Einstellungen, Instrumentauswahl und Tageswerte je Konto. Der Browser lädt sie per REST. Ein veralteter Schreibstand führt zu einem sichtbaren Konflikt. Der besitzerlose IndexedDB-Altbestand bleibt bis zur ausdrücklichen Entscheidung des Setup-Kontos erhalten.

**Grundlage:** T-61 und Claudes Konzeptprüfung Runde 2; T-60-Architekturspezifikation. T-62 folgt auf dieser REST-Schnittstelle.

## Arbeitsschritte

1. **Schema und Konten:** Setup-Konto in derselben Transaktion wie `setup()` markieren, Importmarker und private Datentabellen migrieren. Sitzungsantwort um die beiden Marker ergänzen. Deaktiviertes Setup-Konto durch Admin reaktivierbar machen. Tests für Setup, weitere Admins und Deaktivierung.
2. **REST-Datenhaltung:** Eigentümerprüfung für alle privaten Routen, getrennte Revisionen für Depots und Einstellungen, atomare Schreiboperationen, 409 bei veralteten Revisionen. Import und Restore in Transaktionen. Tests mit zwei Nutzern, fremden IDs, Konkurrenz und Fehlversuchen.
3. **Browserzugriff:** Server-Client und Repositories für alle privaten Daten. Stores laden nach Anmeldung ausschließlich Serverdaten; Fehler und Konflikte werden sichtbar. Ein normales Benutzerkonto erhält die App. Bei Logout/Kontowechsel private Store-Zustände und Caches bereinigen.
4. **Altbestand und Backup:** Nur Setup-Konto erhält eine Vorschau des alten IndexedDB-Bestands. Import erst nach Bestätigung, Marker atomar. Vorher bleibt der Altbestand bei Logout; nach Import/Verwerfen wird er entfernt. Nach einem Import stehen für weitere Altbrowser Dateiexporte je Depot bereit. Regulärer Export/Restore arbeitet mit dem Serverkonto.
5. **Prüfung und Dokumentation:** Frontend- und API-Tests, Lint, Typecheck, Builds und Browserprobe mit zwei Konten und zwei Browsern. README, Docker-README, Unraid, AGENTS.md und zentrale Vorlage auf tatsächliches Verhalten prüfen. Ergebnisse im T-61-Ticket dokumentieren, danach einmalige technische Übergabe an Claude.

**Schnitt zu T-62:** Private REST-Schreibvorgänge liefern Ressourcentyp, Kennung und neue Revision für eine spätere Benachrichtigung nach Commit. T-62 ergänzt SSE und gezieltes Nachladen nach der T-61-Freigabe.
