/** Deutscher Message-Katalog. Source of Truth für Key-Struktur. */
export const de = {
  app: {
    title: 'StockPortfolio',
    subtitle: 'Tolerance-Band Rebalancing',
  },
  nav: {
    dashboard: 'Dashboard',
    rebalancing: 'Rebalancing',
    instruments: 'Assets',
    settings: 'Einstellungen',
  },
  actions: {
    refresh: 'Aktualisieren',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    apply: 'Übernehmen',
    close: 'Schließen',
    toggleTheme: 'Theme wechseln',
    addPosition: 'Position hinzufügen',
    exportJson: 'JSON exportieren',
    importJson: 'JSON importieren',
  },
  groups: {
    stocks: 'Aktien / ETFs',
    bonds: 'Anleihen',
    metals: 'Edelmetalle',
    moneymarket: 'Geldmarkt',
    cash: 'Cash',
  },
  // Bewusst englische Kürzel, auch im deutschen UI: „Kaufen"/„Verkaufen"
  // sind unterschiedlich lang und ließen die Spalte von Zeile zu Zeile
  // wandern. Buy/Sell/OK sind kurz, gleich lang und im Börsenkontext geläufig.
  suggestion: {
    buy: 'Buy',
    sell: 'Sell',
    ok: 'OK',
    near: 'Near',
  },
  kpi: {
    total: 'Gesamtwert',
    investmentReserve: 'Investitionsreserve',
    investmentReserveHint: 'Geldmarkt + Cash − Sicherheitspuffer',
    investmentReservePercent: 'Reserve in %',
    securityBufferHint: 'Sicherheitspuffer: {buffer}',
    warnings: 'Warnungen',
    warningsNone: 'Keine',
  },
  table: {
    symbol: 'Symbol',
    name: 'Bezeichnung',
    units: 'Bestand',
    price: 'Kurs',
    marketValue: 'Marktwert',
    actualPercent: 'IST %',
    targetPercent: 'Ziel %',
    delta: 'Delta',
    status: 'Status',
    quoteAge: 'Kurs vor {minutes} Min.',
    quoteAgeStale: 'Kurs veraltet',
    quoteMissing: 'Kein Kurs verfügbar',
  },
  drilldown: {
    editHeading: 'Position bearbeiten',
    tradeSimulator: 'Trade-Simulator',
    tradeSimulatorHint: 'Positive Anzahl = Kauf, negative = Verkauf',
    tradeUnits: 'Stück',
    tradeApply: 'Übernehmen',
    projectedActual: 'Neues IST',
    projectedDelta: 'Neues Delta',
    volatility: 'Volatilität',
    optimalUnits: 'Bestand optimal',
    deltaEuro: 'Delta €',
    lowerBand: 'Lower Band',
    upperBand: 'Upper Band',
    meldefondCheck: 'myOEKB — Meldefond-Check',
    notes: 'Notizen',
    displayName: 'Bezeichnung',
    group: 'Gruppe',
    enabled: 'Aktiv',
  },
  bands: {
    lower: 'Lower Band',
    upper: 'Upper Band',
    unit: '%',
  },
  refresh: {
    justNow: 'gerade eben',
    ago: 'vor {value}',
    minutesShort: '{n} Min',
    hoursShort: '{n} Std',
    never: 'noch nie',
  },
  views: {
    instrumentsTitle: 'Assets',
    instrumentsComingSoon:
      'Hier wird bald der Katalog aller Papiere aus dem StockInfo-API angezeigt — inkl. Whitelist-Toggle für die Portfolio-Auswahl.',
    settingsTitle: 'Einstellungen',
    settingsComingSoon:
      'Bänder, Save-Asset-Grenze, Investitionsreserve, Portfolio-Verwaltung, Refresh-Verhalten, Anzeige-Spalten, Export/Import und API-Health-Check kommen hier hinein.',
  },
} as const

export type MessageSchema = typeof de
