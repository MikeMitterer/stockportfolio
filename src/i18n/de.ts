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
    historyFailed: 'Kursverlauf konnte nicht geladen werden',
    assetsFailed: 'Instrumente konnten nicht geladen werden',
    noClient: 'Kein API-Client verfügbar',
    unknownError: 'Unbekannter Fehler',
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
      language: 'Sprache',
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
    positionsShort: 'Positionen',
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
    unknownType: 'unbekannt',
    newLink: 'Neuer Verweis',
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

  method: {
    title: 'Die Methode',
    intro:
      'Diese Seite erklärt, wonach die App rechnet. Sie ist zum Nachschlagen da — die App lässt sich auch ohne sie bedienen.',
    more: 'Mehr dazu →',

    bandsHeading: 'Toleranzbänder',
    bandsBody:
      'Ein Depot soll eine bestimmte Aufteilung haben. Kurse verschieben sie laufend, aber nicht jede Abweichung ist ein Handlungsbedarf: Wer bei jedem Prozentpunkt umschichtet, zahlt Gebühren und Steuern für eine Genauigkeit, die am nächsten Tag wieder dahin ist.',
    bandsBody2:
      'Die Bänder ziehen eine Grenze. Erst wenn ein Anteil relativ zu seinem Ziel um mehr als das untere oder obere Band abweicht, springt der Status auf Buy oder Sell. Relativ heißt: Bei einem Ziel von 10 % und einem unteren Band von 6 % beginnt der Handlungsbedarf bei 9,4 % — nicht bei 4 %.',
    bandsBody3:
      'Die beiden Bänder sind getrennt einstellbar, und das aus gutem Grund: Nach unten reagiert man üblicherweise früher als nach oben. Ein gefallener Anteil bedeutet, dass man günstig nachkaufen kann; ein gestiegener bedeutet nur, dass etwas gut gelaufen ist.',
    bandsBody4:
      'Der Unterschied zum verbreiteten Kalender-Rebalancing: Dort schichtet man zu festen Terminen um, unabhängig davon, ob es nötig ist. Nach Bändern geschieht es, wenn es etwas zu tun gibt — in ruhigen Jahren gar nicht, in bewegten mehrmals.',

    classesHeading: 'Fünf Assetklassen',
    classesBody:
      'Aktien/ETFs, Anleihen, Edelmetalle, Geldmarkt und Cash. Die Trennung von Anleihen und Geldmarkt ist kein Detail: Laufzeit-Anleihen schwanken und taugen nicht als Reserve, geldmarktnahe Papiere tun das kaum. Nur Geldmarkt und Cash zählen deshalb zur verfügbaren Liquidität.',

    reserveHeading: 'Sicherheitspuffer und Investitionsreserve',
    reserveBody:
      'Der Sicherheitspuffer ist der Betrag, der unangetastet bleiben soll — ein Notgroschen, kein Anlagebetrag. Was an Geldmarkt und Cash darüber liegt, ist die Investitionsreserve.',
    reserveBody2:
      'Sie ist rein informativ: Sie sagt, wie viel bei einem Rückgang höchstens eingesetzt werden könnte, nicht wie viel eingesetzt werden soll. Diese Entscheidung nimmt die App niemandem ab.',
    reserveBody3:
      'Den Puffer gibt es als festen Betrag oder als Anteil am Gesamtwert. Beide Lesarten sind berechtigt: Ein Notgroschen von drei Monatsausgaben wächst nicht mit dem Depot, ein Liquiditätsanteil schon.',

    planHeading: 'Der Rebalancing-Plan',
    planBody:
      'Der Plan rechnet, er bucht nicht. Man trägt Stückzahlen ein und sieht sofort, was das kostet oder einbringt und wo die Anteile danach liegen. Die Aufträge gibt man bei seiner Bank auf und pflegt die Bestände danach selbst nach.',
    planBody2:
      'Die Delta-Spalte nennt die Stückzahl bis zum Ziel. Ergeben die Ziel-Anteile zusammen 100 %, heben sich alle Deltas in Euro gegenseitig auf — wer allen folgt, bekommt einen Plan, der von selbst aufgeht. Jeder Euro, der gekauft wird, muss sichtbar herkommen: aus einem Verkauf oder aus Cash bzw. Geldmarkt.',

    limitsHeading: 'Was die App bewusst nicht tut',
    limitsCurrency:
      'Sie rechnet in einer einzigen Währung und wandelt nichts um. Ein fremd notiertes Papier bleibt sichtbar, zählt aber in keine Summe — 10.000 USD plus 10.000 EUR ergibt keine 20.000 von irgendetwas.',
    limitsRisk:
      'Sie sagt nichts über Währungsrisiko. Ein EUR-notierter MSCI World steckt zu zwei Dritteln in US-Dollar; das ist eine andere Frage als die Notierungswährung.',
    limitsAdvice:
      'Sie gibt keine Anlageberatung. Sie rechnet aus, was aus der eingegebenen Zielverteilung folgt — ob diese Verteilung sinnvoll ist, entscheidet der Nutzer.',
    limitsData:
      'Sie speichert nichts außerhalb des Browsers. Kein Server kennt die Bestände; die Kursquelle erfährt nur, welche Papiere abgefragt werden.',
  },

  hints: {
    bands:
      'Erst wenn ein Anteil relativ zu seinem Ziel um mehr als das Band abweicht, entsteht Handlungsbedarf. Kleine Ausschläge bleiben unbeachtet — sie kosten sonst Gebühren für eine Genauigkeit, die nicht hält.',
    investmentReserve:
      'Geldmarkt und Cash abzüglich Sicherheitspuffer. Sagt, wie viel bei einem Rückgang höchstens eingesetzt werden könnte — nicht, wie viel eingesetzt werden soll.',
    securityBuffer:
      'Der Betrag, der unangetastet bleiben soll — ein Notgroschen, kein Anlagebetrag. Wählbar als fester Betrag oder als Anteil am Gesamtwert.',
    delta:
      'Abweichung vom Ziel, relativ zum Ziel selbst: −10 % heißt „ein Zehntel unter dem Zielwert", nicht „zehn Prozentpunkte". Die Farbe zeigt, ob die Position im Band liegt.',
    coverFrom:
      'Jeder Euro, der gekauft wird, muss sichtbar herkommen. Der Vorschlag nennt die Stückzahl, mit der Cash oder Geldmarkt die offene Lücke schließt.',
    moneymarket:
      'Geldmarktnahe Papiere schwanken kaum und zählen deshalb zusammen mit Cash zur verfügbaren Liquidität. Laufzeit-Anleihen tun das nicht.',
  },

  backupErrors: {
    invalidJson: 'Die Datei enthält kein gültiges JSON.',
    notAnObject: 'Die Datei enthält kein Objekt.',
    wrongKind: 'Das ist keine StockPortfolio-Sicherung — die Kennung fehlt oder passt nicht.',
    noSchemaVersion: 'Der Datei fehlt die Format-Angabe (schemaVersion).',
    newerFormat:
      'Die Datei stammt aus einer neueren Fassung (Format {found}, diese App kennt {known}). Bitte die App aktualisieren.',
    noSettings: 'Der Datei fehlen die Einstellungen.',
    noPortfolio: 'Der Datei fehlt das Depot.',
    noPortfolioId: 'Dem Depot fehlt die Kennung.',
    noPortfolioName: 'Dem Depot fehlt der Name.',
    noPositions: 'Dem Depot fehlt die Liste der Positionen.',
    duplicateId: 'Position {at}: Die Kennung „{id}“ kommt mehrfach vor.',
    positionNotAnObject: 'Position {at}: kein Objekt.',
    positionNoId: 'Position {at}: Kennung fehlt.',
    positionNoSymbol: 'Position {at}: Symbol fehlt.',
    positionGroup: 'Position {at}: Unbekannte Assetklasse „{group}“.',
    positionUnits: 'Position {at}: Bestand ist keine Zahl.',
    positionTarget: 'Position {at}: Ziel-Anteil ist keine Zahl.',
    positionTargetRange: 'Position {at}: Ziel-Anteil liegt außerhalb von 0–100 %.',
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
