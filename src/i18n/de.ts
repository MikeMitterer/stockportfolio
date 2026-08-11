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
    partial: 'Teilweise',
  },

  /**
   * Anzahl mit Einheit. Die Pluralform gehört in den Katalog, nicht in den
   * Code — welche Formen eine Sprache hat, weiß nur die Sprache selbst.
   */
  units: {
    positions: '{count} Position | {count} Positionen',
    quotes: '{count} Kurs | {count} Kurse',
    assets: '{count} Asset | {count} Assets',
  },

  history: {
    heading: 'Kursverlauf',
    columnTitle: 'Verlauf 1M',
    lastMonth: 'letzter Monat',
    none: 'Für dieses Papier liegt kein Verlauf vor.',
    sinceStart: '{value} seit Beginn',
    axisHint: 'Links die Kurse, rechts die Veränderung seit dem {date}.',
    periods: { m1: '1M', m3: '3M', y1: '1J', max: 'Max' },
  },

  currency: {
    badgeTitle: 'Notiert in {currency} — zählt nicht in die Summen',
    statusForeign: 'fremde Währung',
    notCounted: 'zählt nicht mit',
    inactive: 'inaktiv',
    warningTitle: 'Fremde Währung',
    warningBody:
      '{positions} {verb} nicht in {base} und {counts} deshalb nicht mit: {list}. Summen und Anteile beziehen sich nur auf den Rest — die App rechnet in einer einzigen Währung und wandelt nichts um.',
    verb: 'notiert | notieren',
    counts: 'zählt | zählen',
  },

  notify: {
    quotesMissingTitle: 'Kurse fehlen',
    quotesMissingBody: '{quotes} konnten nicht geladen werden — {details}',
    targetsExceededTitle: 'Ziele über 100 %',
    targetsExceededBody:
      'Die Ziel-Anteile summieren sich auf {sum} — mehr als 100 %. Solange das so ist, sind die Kauf- und Verkaufsvorschläge nicht schlüssig.',
    assetsFailedTitle: 'Assets konnten nicht geladen werden',
    backupTitle: 'Sicherung',
    doneTitle: 'Erledigt',
  },

  settings: {
    tabs: {
      calc: 'Berechnung',
      theme: 'Darstellung',
      links: 'Verweise',
      data: 'Daten',
      status: 'Status',
    },
    bandsHeading: 'Toleranzbänder',
    lowerHint: 'Unterschreitet der Marktwert das Ziel um mehr als diesen Anteil → Kaufen.',
    upperHint: 'Überschreitet der Marktwert das Ziel um mehr als diesen Anteil → Verkaufen.',
    metricsHeading: 'Kennzahlen',
    securityBuffer: 'Sicherheitspuffer',
    bufferPercent: '% vom Gesamtwert',
    bufferAbsolute: 'Fester Betrag (€)',
    bufferUnset: 'Nicht festgelegt — die ganze Liquidität gilt als Reserve.',
    bufferEquals: 'Entspricht derzeit {amount}.',
    notificationSeconds: 'Meldungen ausblenden nach (s)',
    notificationKeep: 'Bleiben stehen, bis die Ursache behoben ist oder du sie wegklickst.',
    notificationAuto: 'Blenden sich selbst aus — früher, wenn die Ursache vorher wegfällt.',
    themeHeading: 'Theme',
    themeNames: {
      classic: 'Classic',
      ocean: 'Ocean',
      forest: 'Forest',
      mangolila: 'MangoLila',
      paper: 'Paper',
      mono: 'Mono',
    },
    themeHints: {
      classic: 'Dunkel, neutralgrau',
      ocean: 'Dunkel, blaustichig',
      forest: 'Dunkel, grünstichig',
      mangolila: 'Wie das StockInfo-Backend — Pflaume mit Koralle',
      paper: 'Hell, warmes Off-White',
      mono: 'Hell, nahezu farblos',
    },
    themeActive: 'aktiv',
    languageHeading: 'Sprache',
    languageHint:
      'Gilt für Beschriftungen, Zahlen und Datumsangaben. Die Wahl bleibt in diesem Browser gespeichert; ohne eigene Wahl entscheidet die Spracheinstellung des Browsers.',
    linksHeading: 'Externe Verweise',
    apiHeading: 'StockInfo-API',
    apiRecheck: 'Erneut prüfen',
    apiAddress: 'Adresse',
    apiState: 'Zustand',
    apiVersion: 'Version',
    apiLatency: 'Antwortzeit',
    apiLatencyUnit: '{ms} ms',
    apiChecked: 'Geprüft',
    apiReason: 'Grund',
    apiReports: '— meldet „{status}"',
    apiOfflineHint:
      'Ohne die API gibt es keine Kurse und damit keine Kennzahlen. Die zuletzt geladenen Kurse bleiben gespeichert und werden weiter verwendet — erkennbar am Alter in der Kopfzeile.',
    apiStates: {
      unknown: 'noch nicht geprüft',
      checking: 'wird geprüft …',
      online: 'erreichbar',
      offline: 'nicht erreichbar',
    },
  },

  portfolios: {
    heading: 'Depots',
    intro:
      'Mehrere Depots nebeneinander — etwa eines für die Kinder oder eine Variante zum Durchrechnen. Gerechnet wird immer nur mit dem aktiven; sein Name steht in der Statuszeile am unteren Rand. Toleranzbänder, Sicherheitspuffer und Darstellung gelten für alle gemeinsam.',
    active: 'aktiv',
    namePlaceholder: 'Name des Depots',
    newPlaceholder: 'Name des neuen Depots',
    create: 'Depot anlegen',
    switch: 'Wechseln',
    lastRemains: 'Das letzte Depot bleibt bestehen',
    changed: 'geändert {age}',
    confirmDelete: '„{name}" mit {positions} endgültig löschen?',
  },

  backup: {
    heading: 'Sichern und Wiederherstellen',
    intro:
      'Depot und Einstellungen liegen ausschließlich in diesem Browser. Eine Sicherung ist die einzige Möglichkeit, sie auf ein anderes Gerät zu holen oder nach einem gelöschten Website-Speicher zurückzubekommen. Kurse sind nicht enthalten — die holt die App ohnehin neu.',
    download: 'Sicherung herunterladen',
    restore: 'Sicherung einspielen …',
    confirmHeading: 'Diese Sicherung einspielen?',
    portfolio: 'Depot',
    positions: 'Positionen',
    hidden: 'Ausgeblendet',
    ofWhichCash: 'davon Cash',
    savedAt: 'Gesichert am',
    appVersion: 'App-Fassung',
    unknown: 'unbekannt',
    replaceWarning:
      'Das aktuelle Depot mit {positions} und alle Einstellungen werden dabei ersetzt. Das lässt sich nicht rückgängig machen — bei Zweifeln vorher eine eigene Sicherung herunterladen.',
    replaceNow: 'Jetzt ersetzen',
    confirmReplace: 'Aktuelles Depot wirklich überschreiben?',
    saved: 'Gesichert: {file}',
    restored: 'Eingespielt: „{name}" mit {positions}.',
    exportFailed: 'Die Sicherung konnte nicht erstellt werden: {reason}',
    importFailed: 'Das Einspielen ist fehlgeschlagen: {reason}',
  },

  rebalancing: {
    heading: 'Verkaufen und kaufen — Stückzahlen eintragen',
    freed: 'Frei gemacht',
    freedHint: 'Verkäufe und Entnahmen',
    spent: 'Eingesetzt',
    spentHint: 'Käufe',
    balance: 'Bilanz',
    nothingPlanned: 'noch nichts geplant',
    underfunded: 'nicht gedeckt',
    balanced: 'geht auf',
    leftOver: 'bleibt übrig',
    coverFrom: 'Decken aus',
    coverNothing: 'nichts offen',
    coverHint: 'Cash und Geldmarkt',
    coverTitle: '{label}: {units} Stück in den Plan übernehmen',
    reserve: 'Aus Reserve entnehmbar',
    reserveHint: 'Cash + Geldmarkt über dem Puffer',
    simulationNote: 'Alles hier ist Simulation — weder Bestände noch Ziele werden geändert.',
    clearPlan: 'Plan leeren',
    empty: 'Noch keine Wertpapiere im Depot',
    bandsLabel: 'Bänder: −{lower} / +{upper}',
    columns: {
      delta: 'Delta',
      trade: 'Kauf / Verkauf',
      value: 'Wert',
      shareAfter: 'Anteil nachher',
      deviation: 'Abw. Ziel',
    },
    deltaTooltip: 'Stückzahl bis zum Ziel: positiv kaufen, negativ verkaufen. Anklicken übernimmt den Wert in die Eingabe.',
    deltaTooltipMore:
      'Ergeben die Ziel-Anteile zusammen 100 %, heben sich alle Deltas gegenseitig auf — wer allen folgt, bekommt einen Plan, der von selbst aufgeht.',
    adoptDelta: 'In die Eingabe übernehmen',
    targetProbe: 'Probeweise geändert — im Depot steht {target}',
    footerQuestion: 'Geht der Plan auf?',
    footerNothing: 'Noch nichts geplant.',
    footerBalanced: 'Käufe und Verkäufe gleichen sich aus.',
    footerLeftOver: '{amount} bleiben übrig.',
    footerShort: '{amount} kommen aus der Reserve.',
    underfundedTitle: 'Plan nicht gedeckt',
    underfundedBody:
      'Für die geplanten Käufe fehlen {amount}. Verkaufe ein Papier oder entnimm aus Cash bzw. Geldmarkt — trage die Entnahme dort als negative Zahl ein.',
    targetSumTitle: 'Ziele ergeben nicht 100 %',
    targetSumBody:
      'Die Ziele ergeben zusammen {sum} statt 100 %. Was eine Position zusätzlich bekommen soll, muss eine andere abgeben.',
    bufferTitle: 'Sicherheitspuffer unterschritten',
    bufferBody:
      'Der Plan senkt Cash und Geldmarkt auf {liquid} und unterschreitet damit den Sicherheitspuffer von {buffer}.',
  },

  dashboard: {
    positionsHeading: 'Positionen — Bestand und Ziel sind direkt änderbar',
    assetClasses: 'Assetklassen',
    targetDistribution: 'Ziel-Verteilung',
    bands: 'Bänder: −{lower} / +{upper}',
    emptyTitle: 'Noch keine Wertpapiere im Depot',
    emptyHint: 'Lege deine erste Position an — oder lade ein Beispiel-Depot, um die App auszuprobieren.',
    loadDemo: 'Beispiel-Depot laden',
    reloadQuote: 'Kurs neu laden',
    noMatchingLinks: 'Keine passenden Verweise — unter „Einstellungen" konfigurierbar.',
    confirmRemove: 'Position „{name}" wirklich löschen?',
    kind: 'Gattung',
    kindEtf: 'ETF',
    kindStock: 'Aktie',
    isin: 'ISIN',
    quoteAge: 'Kurs-Stand',
    details: 'Details',
    amountEuro: 'Betrag (€)',
    unitsDelta: 'Δ Bestand (Stück)',
    ter: 'TER',
    targetValue: 'Ziel-Wert',
  },

  instruments: {
    countLabel: '{shown} von {total}',
    hint: 'Der Schalter „In Auswahl" steuert, welche Papiere beim Hinzufügen einer Position angeboten werden.',
    searchPlaceholder: 'Symbol, ISIN oder Name',
    allTypes: 'Alle Typen',
    type: 'Typ',
    points: 'Kurspunkte',
    inSelection: 'In Auswahl',
    inPortfolio: 'im Depot',
  },

  addPosition: {
    heading: 'Position hinzufügen',
    allInPortfolio: 'Alle freigegebenen Papiere sind bereits im Depot. Weitere lassen sich unter „Assets" freischalten.',
    instrument: 'Wertpapier',
    searchPlaceholder: 'Symbol, ISIN oder Name',
    group: 'Gruppe',
    targetExceeds: 'Damit liegt die Summe der Ziel-Anteile über 100 %.',
    add: 'Hinzufügen',
    remaining: 'noch frei: {value}',
    groupHint: 'Vorschlag anhand des Namens — bei Bedarf ändern.',
    volatility: 'Volatilität',
  },

  links: {
    hint: 'In der Adresse werden {isin} und {symbol} ersetzt. „Gilt für" leer lassen heißt: für alle Gattungen. Ein Verweis mit {isin} erscheint nicht bei Positionen ohne ISIN.',
    labelPlaceholder: 'Bezeichnung',
    urlPlaceholder: 'https://…/{isin}',
    appliesTo: 'Gilt für',
    add: 'Verweis hinzufügen',
    reset: 'Auf Vorgaben zurücksetzen',
    confirmReset: 'Alle Verweise auf die Vorgaben zurücksetzen?',
    confirmDelete: 'Verweis „{label}" löschen?',
    etf: 'ETF / Fonds',
    stock: 'Aktie',
    noneConfigured: 'Keine Verweise konfiguriert — im Drilldown erscheinen dann keine externen Links.',
    confirmDeleteShort: 'Verweis „{label}“ entfernen?',
    confirmResetShort: 'Alle Verweise durch die Vorgaben ersetzen?',
  },

  common: {
    edit: 'Klicken zum Ändern',
    clear: 'Wert löschen',
    none: '—',
    version: 'v{version}',
    units: '{count} Stk',
    loading: '· lädt …',
    overHundred: '· über 100 %',
  },

  status: {
    poweredBy: 'powered by',
    quotes: 'Kurse',
    quotesLoading: 'werden geladen …',
    quotesMissing: '{quotes} fehlen',
    apiDetails: '{state} — Details in den Einstellungen',
    apiUnknown: 'API ungeprüft',
    apiChecking: 'API wird geprüft',
    apiOnline: 'API erreichbar',
    apiOffline: 'API nicht erreichbar',
  },
} as const

/**
 * Alle Werte auf `string` gelockert.
 *
 * Ohne das erzwänge `as const` in jedem weiteren Katalog wörtlich den
 * deutschen Text. Gefordert ist die **Struktur**: Fehlt ein Schlüssel, meckert
 * der Typecheck — welcher Text dahintersteht, ist Sache der Sprache.
 */
type Loosen<T> = {
  [K in keyof T]: T[K] extends string ? string : Loosen<T[K]>
}

export type MessageSchema = Loosen<typeof de>
