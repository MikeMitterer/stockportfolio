/** Deutscher Message-Katalog. Source of Truth für Key-Struktur. */
export const de = {
  tradeNotice: 'Kauf- und Verkaufswerte sind rechnerische Orientierungshilfen auf Basis deiner Depotdaten und Ziele, keine Empfehlung zum Handeln. Prüfe Daten, Kurse und Kosten selbst, bevor du eine Order aufgibst.',
  fx: {
    baseCurrency: 'Basiswährung', invalidCurrency: 'Bitte eine gültige Basiswährung wählen.',
    changeTitle: 'Basiswährung ändern',
    changeHint: 'Die Basiswährung kann jederzeit geändert werden. Cash und absolute Geldschwellen werden dabei umgerechnet.',
    changeConfirm: 'Von {from} zu {to} wechseln? Cash und absolute Geldschwellen werden umgerechnet; Stückzahlen und Prozentgrenzen bleiben erhalten. Der Verlauf zeigt die Reihe der neuen Währung. Frühere Reihen bleiben gespeichert.',
    changeRate: '1 {from} = {rate} {to}, Kursstand {time}.',
    changeUnavailable: 'Kein gültiger Devisenkurs für die gespeicherten Geldbeträge. Die Basiswährung wurde nicht geändert.',
    title: 'Devisenkurse', retry: 'Devisenkurse erneut laden',
    stalePair: '{pair}: Veralteter Devisenkurs vom {time} wird weiterverwendet.',
    missingPair: '{pair}: Kein gültiger Devisenkurs. Betroffene Positionen zählen nicht in Summen und Handelsvorschläge.',
    converted: 'Bewertet mit {price} je Stück · {pair}',
    historyUnavailable: 'Für Fremdwährungspositionen fehlen historische Devisenkurse. Der Rückblick bleibt deshalb leer; aufgezeichnete Tageswerte werden in der Depotwährung angezeigt.',
    amountCurrency: 'Betrag in {currency}',
  },
  detailFields: {
    title: 'Zusatzinformationen',
    yes: 'Ja', no: 'Nein', ter: 'TER',
    ratio: 'Anteil', basisPoints: 'Basispunkte', millions: 'Mio.',
    provider: 'Quelle', manual: 'Manuell',
    asOf: 'Stand: {value}',
    shadowed: 'Manueller Wert (durch Quelle ersetzt): {value}',
    unavailable: 'Zusatzinformationen sind derzeit nicht verfügbar. Die Kurse bleiben nutzbar.',
    notLoaded: 'Zusatzwerte noch nicht geladen. Lade den Kurs neu.',
    empty: 'Keine weiteren Zusatzinformationen.',
    retry: 'Feldkatalog erneut laden',
  },
  app: {
    title: 'StockPortfolio',
    /*
     * Die Wortmarke in zwei Teilen, zusammengesetzt ergeben sie `title`. Der
     * zweite trägt die Kennfarbe: „Stock" teilen sich beide Apps, farbig gehört
     * der Teil, der sie unterscheidet. Getrennt im Katalog und nicht im
     * Template zerschnitten, damit die Teilung mit dem Namen wandert.
     */
    brandLead: 'Stock',
    brandAccent: 'Portfolio',
  },
  auth: {
    loading: 'Anmeldung wird geprüft …',
    setupTitle: 'Erstes Admin-Konto einrichten',
    setupHint: 'Lege das erste Admin-Konto für diese Installation an.',
    setupCode: 'Einrichtungscode',
    setupCodeHelp: 'Solange kein Admin-Konto existiert, erzeugt die Konto-API bei jedem Start einen neuen Code. Bei make dev steht er im Terminal hinter „StockPortfolio setup code:“; im Container findest du ihn mit docker logs stockportfolio. Nach dem Anlegen des Admin-Kontos erscheint dieser Dialog nicht mehr.',
    username: 'Benutzername',
    password: 'Passwort',
    newPassword: 'Neues Passwort',
    passwordRequirements: '12 bis 1024 Zeichen, mindestens ein Großbuchstabe, eine Zahl und ein Sonderzeichen.',
    createAdmin: 'Admin-Konto anlegen',
    loginTitle: 'Anmelden',
    login: 'Anmelden',
    investmentNotice: 'StockPortfolio berechnet Depotwerte und Abweichungen aus deinen Beständen, deinen selbst festgelegten Zielen und Toleranzbändern sowie externen Kursdaten. Die Statusanzeigen Below und Above zeigen, dass eine Position von deinen selbst gesetzten Zielen und Grenzwerten abweicht. Kauf- und Verkaufsbeträge und Stückzahlen zeigen, welche Änderungen rechnerisch nötig wären, um diese Ziele zu erreichen. Die App prüft nicht, ob ein Geschäft oder ein Finanzinstrument für dich geeignet ist, und führt keine Orders aus. Kurse und Berechnungen können verzögert, unvollständig oder fehlerhaft sein. Prüfe Daten, Kosten und Risiken, bevor du handelst.',
    investmentConfirm: 'Ich habe den Hinweis gelesen.',
    logout: 'Abmelden',
    accountMenu: 'Konto {username}: Menü öffnen',
    changeTitle: 'Passwort ändern',
    changeHint: 'Für dieses Konto ist vor der weiteren Nutzung ein neues Passwort nötig.',
    changePassword: 'Passwort speichern',
    unavailableTitle: 'Anmeldung nicht erreichbar',
    unavailableHint: 'Die StockPortfolio-API antwortet nicht. Prüfe den Dienst und versuche es erneut.',
    retry: 'Erneut versuchen',
    adminHint: 'Benutzerkonten und Zugänge dieser Instanz verwalten.',
    manageUsers: 'Benutzerverwaltung öffnen',
    usersTitle: 'Benutzerverwaltung',
    usersHint: 'Konten dieser Instanz anlegen, Passwörter zurücksetzen und Zugänge deaktivieren.',
    createUserTitle: 'Konto anlegen',
    createUserHint: 'Vergib einen Benutzernamen, ein vorläufiges Passwort und eine Rolle.',
    accountsTitle: 'Vorhandene Konten',
    createUser: 'Konto anlegen',
    temporaryPassword: 'Temporäres Passwort',
    temporaryPasswordHelp: 'Du vergibst dieses Passwort für die erste Anmeldung oder nach einem Zurücksetzen. Die Person muss es beim nächsten Login ändern.',
    role: 'Rolle',
    userRole: 'Nutzer',
    adminRole: 'Admin',
    active: 'Aktiv',
    inactive: 'Deaktiviert',
    passwordChangePending: 'Beim nächsten Login ist ein Passwortwechsel nötig.',
    resetPassword: 'Passwort zurücksetzen',
    saveTemporaryPassword: 'Neues Passwort setzen',
    yourAccount: 'Dein Konto',
    deactivate: 'Deaktivieren',
    reactivate: 'Reaktivieren',
    deactivateConfirm: 'Konto {username} deaktivieren?',
    loadingUsers: 'Konten werden geladen …',
    errors: {
      request_failed: 'Die Anfrage ist fehlgeschlagen. Bitte versuche es erneut.',
      invalid_credentials: 'Benutzername, Passwort oder Einrichtungscode stimmen nicht.',
      invalid_username: 'Der Benutzername muss 3 bis 64 Zeichen aus Buchstaben, Zahlen, Punkt, Bindestrich oder Unterstrich enthalten.',
      invalid_password: 'Das Passwort braucht 12 bis 1024 Zeichen, einen Großbuchstaben, eine Zahl und ein Sonderzeichen.',
      rate_limited: 'Zu viele Fehlversuche. Bitte warte und versuche es später erneut.',
      setup_closed: 'Die Ersteinrichtung ist bereits abgeschlossen.',
      invalid_origin: 'Die Browseradresse stimmt nicht mit der Serverkonfiguration überein.',
      username_taken: 'Dieser Benutzername ist bereits vergeben.',
      last_admin: 'Das letzte aktive Admin-Konto kann nicht deaktiviert werden.',
      forbidden: 'Für diese Aktion fehlen Admin-Rechte.',
      unauthorized: 'Die Sitzung ist abgelaufen. Bitte melde dich erneut an.',
    },
  },
  nav: {
    dashboard: 'Dashboard',
    rebalancing: 'Rebalancing',
    instruments: 'Assets',
    settings: 'Einstellungen',
    users: 'Benutzerverwaltung',
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
    stocks: 'Aktien',
    etfs: 'ETFs',
    bonds: 'Anleihen',
    metals: 'Edelmetalle',
    moneymarket: 'Geldmarkt',
    cash: 'Cash',
  },
  // Bewusst englische Kürzel, auch im deutschen UI: Deutsche Wörter wären
  // unterschiedlich lang und ließen die Spalte von Zeile zu Zeile wandern.
  // Below/Above/OK beschreiben eine Lage, keinen Auftrag (Mike, 2026-10-01).
  startup: {
    noApiUrlTitle: 'Keine API-Adresse gesetzt',
    noApiUrlBody:
      'StockPortfolio holt seine Kurse von einer StockInfo-Instanz; ohne deren Adresse gibt es nichts zu rechnen. Im Container wird sie über die Umgebungsvariable STOCKINFO_API_URL gesetzt, in der Entwicklung über VITE_STOCKINFO_API_URL in der Datei .env.',
    noApiUrlRepo: 'StockInfo: https://github.com/MikeMitterer/stockinfo',
  },

  privateData: {
    title: 'Depotdaten nicht gespeichert',
    conflict: 'Der Stand wurde in einem anderen Browser geändert. Deine letzte Änderung wurde nicht gespeichert. Lade den aktuellen Serverstand neu und wiederhole sie bei Bedarf.',
    unavailable: 'Die Konto-API ist nicht erreichbar oder die Sitzung ist abgelaufen. Änderungen sind derzeit nicht möglich. Lade die Seite neu, sobald die Verbindung wieder besteht.',
    rejected: 'Die Konto-API hat die Änderung abgelehnt. Sie wurde nicht gespeichert. Lade den Serverstand neu und prüfe deine Berechtigung und Eingabe.',
    reload: 'Serverstand neu laden',
  },

  legacy: {
    title: 'Vorhandene Browserdepots',
    intro: 'In diesem Browser liegen Depots aus der Zeit vor den Benutzerkonten. Nur das Einrichtungskonto darf sie übernehmen.',
    alreadyImported: 'Der einmalige Altimport wurde bereits durchgeführt. Weitere Depots aus diesem Browser kannst du einzeln als Datei sichern und anschließend im Konto wiederherstellen.',
    source: 'Quelle',
    browser: 'Dieses Browserprofil',
    target: 'Zielkonto',
    portfolios: 'Depots',
    positions: 'Positionen',
    importHint: 'Die Übernahme ergänzt die Depots auf dem Server. Vorhandene Serverdepots und Einstellungen bleiben erhalten. Der Vorgang ist nur einmal möglich. Ohne Übernahme bleiben die Daten in diesem Browserprofil über Browserwerkzeuge lesbar.',
    restoreHint: 'Ein weiterer pauschaler Import ist gesperrt. Exportiere jedes benötigte Depot und spiele die Datei über Backup/Wiederherstellung ein.',
    import: 'Depots jetzt übernehmen',
    export: 'Datei exportieren',
    later: 'Später entscheiden',
    discard: 'Lokale Depots verwerfen',
    discardConfirm: 'Lokale Depots und ihre Tageswerte in diesem Browser endgültig löschen?',
  },

  valueHistory: {
    heading: 'Wertverlauf',
    empty: 'Noch kein Verlauf — sobald Kurse geladen sind, entsteht er.',
    captionFrom:
      'Durchgezogen ab {date}: tatsächlich festgehaltene Tageswerte. Gestrichelt davor: der heutige Bestand gegen alte Kurse gerechnet — kein Verlauf des Depots, sondern ein Rückblick auf die heutige Aufteilung.',
    captionBacktestOnly:
      'Gestrichelt: der heutige Bestand gegen alte Kurse gerechnet — kein Verlauf des Depots, sondern ein Rückblick auf die heutige Aufteilung. Ab heute hält die App zusätzlich den tatsächlichen Tageswert fest.',
    captionReal:
      'Nur die tatsächlich festgehaltenen Tageswerte ab {date} — was hier steht, stand so auch da. Der gerechnete Rückblick bleibt in diesem Ausschnitt außen vor.',
    periodReal: 'Echt',
    periodRealDisabled:
      'Dieser Ausschnitt zeigt nur tatsächlich festgehaltene Tageswerte. Dafür braucht es mindestens zwei — aus einem einzigen entsteht keine Linie. Die App hält ab jetzt täglich einen fest.',
  },

  seed: {
    portfolioName: 'Mein Depot',
    demoName: 'Beispiel-Depot',
    cashAccount: 'Verrechnungskonto',
  },

  suggestion: {
    buy: 'Below',
    sell: 'Above',
    ok: 'OK',
    near: 'Near',
    belowMinTradeMark: 'min',
    belowMinTrade: 'Außerhalb des Bandes, aber unter dem Mindest-Handelsvolumen.',
  },
  kpi: {
    total: 'Gesamtwert',
    investmentReserve: 'Investitionsreserve',
    investmentReserveHint: 'Geldmarkt + Cash − Sicherheitspuffer',
    investmentReservePercent: 'Reserve in %',
    securityBufferHint: 'Sicherheitspuffer: {buffer}',
    dataStatus: 'Datenlage',
    dataComplete: 'Vollständig',
    dataIncomplete: '{count} unvollständig',
  },
  table: {
    symbol: 'Symbol',
    position: 'Position',
    name: 'Bezeichnung',
    units: 'Bestand',
    price: 'Kurs',
    marketValue: 'Marktwert',
    actualPercent: 'IST\u00a0%',
    targetPercent: 'Ziel\u00a0%',
    delta: 'Delta',
    status: 'Status',
    quoteAge: 'Kurs vor {minutes} Min.',
    quoteAgeStale: 'Kurs veraltet',
    openDetails: 'Details anzeigen',
    collapseAllGroups: 'Alle Gruppen schließen',
    expandAllGroups: 'Alle Gruppen öffnen',
    quoteMissing: 'Kein Kurs verfügbar',
  },
  drilldown: {
    editHeading: 'Position bearbeiten',
    openDetails: 'Positionsdetails anzeigen',
    closeDetails: 'Positionsdetails schließen',
    sections: 'Positionsdetails',
    sectionPortfolio: 'Bewertung',
    sectionHistory: 'Kursverlauf',
    sectionAsset: 'Informationen',
    sectionDetails: 'Zusatzinformationen',
    tradeSimulator: 'Trade-Simulator',
    tradeSimulatorHint: 'Positive Anzahl = Kauf, negative = Verkauf',
    tradeUnits: 'Stück',
    tradeApply: 'Übernehmen',
    projectedActual: 'Neues IST',
    projectedDelta: 'Neues Delta',
    volatility: 'Volatilität',
    optimalUnits: 'Bestand optimal',
    deltaEuro: 'Delta',
    lowerBand: 'Untergrenze',
    upperBand: 'Obergrenze',
    reportingFundCheck: 'myOEKB — Meldefond-Check',
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
    days: '{count} Tag | {count} Tage',
    quotes: '{count} Kurs | {count} Kurse',
    assets: '{count} Asset | {count} Assets',
  },

  history: {
    heading: 'Kursverlauf',
    columnTitle: 'Verlauf {period}',
    short: { d1: '1T', w1: '1W', m1: '1M', m3: '3M', y1: '1J', max: 'Max' },
    periodNames: { day: 'Ein Tag', week: 'Eine Woche', month: 'Ein Monat' },
    periodHeading: 'Verlauf in der Tabelle',
    periodHint:
      'Zeitraum der kleinen Linie neben dem Kurs. „Ein Tag" zeigt keinen Verlauf, sondern die Veränderung vom letzten Handelstag auf heute.',
    none: 'Für dieses Papier liegt kein Verlauf vor.',
    sinceStart: '{value} seit Beginn',
    axisHint: 'Links die Kurse, rechts die Veränderung seit dem {date}.',
  },

  currency: {
    badgeTitle: 'Kein verwendbarer Devisenkurs für {currency} — zählt nicht in die Summen',
    statusForeign: 'Devisenkurs fehlt',
    notCounted: 'zählt nicht mit',
    missingQuote: 'Kein gültiger Kurs — zählt nicht mit',
    inactive: 'inaktiv',
    warningTitle: 'Fremde Währung',
    warningBody:
      'Für die Umrechnung nach {base} fehlen gültige Devisenkurse: {list}. Betroffene Positionen zählen nicht in die Summen.',
    verb: 'notiert | notieren',
    counts: 'zählt | zählen',
  },

  /*
   * Woher die Adresse des Dienstes stammt. Steht in jeder Meldung, die eine
   * unerreichbare Adresse nennt — sonst weiß niemand, wo er sie ändert.
   */
  errors: {
    ambiguousSymbol: 'Symbol „{symbol}“ ist mehrdeutig. Kein eindeutiger Kurs verfügbar.',
    staleQuote: 'Ein veralteter Kurs wird verwendet.',
    invalidResponse: 'Ungültige StockInfo-Antwort: Feld „{field}“ fehlt oder ist ungültig. Der Kurs wird nicht übernommen.',
    unsupportedIdentity: 'StockInfo liefert eine nicht unterstützte Identität: „{kind}“. Der Kurs wird nicht übernommen.',
    urlFrom: {
      runtime: 'Adresse aus STOCKINFO_API_URL des Containers',
      'container-build':
        'STOCKINFO_API_URL ist am Container nicht gesetzt — es gilt der Wert aus dem Bau',
      build: 'Adresse aus .env beim Bauen (VITE_STOCKINFO_API_URL)',
    },
  },

  notify: {
    quotesMissingTitle: 'Kurse fehlen',
    historyFailed: 'Kursverlauf konnte nicht geladen werden',
    assetsFailed: 'Instrumente konnten nicht geladen werden',
    noClient: 'Kein API-Client verfügbar',
    apiOfflineTitle: 'Dienst nicht erreichbar',
    apiOfflineBody:
      'StockPortfolio holt seine Kurse von einer StockInfo-Instanz. Diese Adresse antwortet nicht — bis sie wieder erreichbar ist, gelten die zuletzt geladenen Kurse weiter, erkennbar am Alter in der Kopfzeile.',
    apiOfflineRetry: 'Erneut prüfen',
    apiOfflineSettings: 'Zur Statusseite',
    unknownError: 'Unbekannter Fehler',
    quotesMissingBody: '{quotes} konnten nicht geladen werden — {details}',
    targetsExceededTitle: 'Ziele über 100 %',
    targetsExceededBody:
      'Die Ziel-Anteile summieren sich auf {sum} — mehr als 100 %. Solange das so ist, sind die Kauf- und Verkaufsvorschläge nicht schlüssig.',
    assetsFailedTitle: 'Assets konnten nicht geladen werden',
    backupTitle: 'Backup',
    doneTitle: 'Erledigt',
    // Beschriftung der Restzeit am Balken einer Meldung. Steht hier einmal,
    // weil sie in der ganzen App gleich lautet — das Fundament nimmt sie
    // deshalb bewusst als eigenen Parameter und nicht je Meldung entgegen.
    closesIn: 'schließt in {n} s',
  },

  settings: {
    sectionLabel: 'Bereich der Einstellungen',
    tabs: {
      calc: 'Berechnung',
      theme: 'Theme',
      language: 'Sprache',
      links: 'Links',
      notifications: 'Meldungen',
      data: 'Daten',
      backup: 'Backup',
      about: 'About',
    },
    triggerHeading: 'Auslöser',
    trigger: {
      bands: 'Toleranzbänder',
      calendar: 'Fester Termin',
      both: 'Bänder und Termin',
    },
    triggerHint: {
      bands: 'Ausgleich, sobald ein Anteil sein Band verlässt — laufend, ohne Kalender.',
      calendar: 'Ausgleich nur zum Termin, dann aber jede Abweichung vom Ziel.',
      both: 'Bänder gelten laufend; der Termin nimmt zusätzlich die kleineren Abweichungen mit.',
    },
    intervalMonths: 'Abstand (Monate)',
    intervalHint: '12 = jährlich, 6 = halbjährlich, 3 = quartalsweise.',
    refreshHeading: 'Kurse aktualisieren',
    autoOnLoad: 'Beim Öffnen einer Ansicht aktualisieren',
    autoOnLoadHint:
      'Holt die Kurse, sobald das Depot oder der Ausgleich geöffnet wird. Abgeschaltet kommen neue Kurse nur noch auf Knopfdruck.',
    staleAfter: 'Kurse gelten als alt nach (Minuten)',
    staleAfterHint:
      'Jünger als das, wird beim Öffnen nichts geholt — sonst löste jeder Wechsel zwischen den Ansichten einen vollen Abruf aus. „Aktualisieren" in der Kopfzeile übergeht die Frist und holt immer frische Kurse.',
    lastRebalanced: 'Zuletzt ausgeglichen ({depot})',
    markToday: 'Heute',
    neverRebalanced: 'Noch nie ausgeglichen — der Termin gilt als fällig.',
    dueSince: 'Seit {days} Tagen fällig.',
    dueIn: 'Noch {days} Tage — nächster Termin {date}.',
    bandsHeading: 'Toleranzbänder',
    lowerHint: 'Unterschreitet der Marktwert das Ziel um mehr als diesen Anteil → Below.',
    upperHint: 'Überschreitet der Marktwert das Ziel um mehr als diesen Anteil → Above.',
    metricsHeading: 'Liquidität',
    securityBuffer: 'Sicherheitspuffer',
    minTradeSize: 'Mindest-Handelsvolumen',
    minTradeUnset: 'Aus — jede Abweichung außerhalb des Bandes wird gemeldet.',
    amountMode: 'Einheit für {label}',
    bufferPercent: '% vom Gesamtwert',
    bufferAbsolute: 'Fester Betrag (€)',
    bufferUnset: 'Nicht festgelegt — die ganze Liquidität gilt als Reserve.',
    bufferEquals: 'Entspricht derzeit {amount}.',
    notificationsHeading: 'Anzeigedauer',
    notificationSeconds: 'Meldungen ausblenden nach (s)',
    notificationKeep: 'Bleiben stehen, bis die Ursache behoben ist oder du sie wegklickst.',
    notificationAuto: 'Blenden sich selbst aus — früher, wenn die Ursache vorher wegfällt.',
    themeHeading: 'Theme',
    themeNames: {
      classic: 'Classic',
      macos: 'macOS',
      slate: 'Slate',
      ocean: 'Ocean',
      forest: 'Forest',
      mangolila: 'MangoLila',
      amber: 'Amber',
      petrol: 'Petrol',
      aurora: 'Aurora',
      carbon: 'Carbon',
      paper: 'Paper',
      sepia: 'Sepia',
      meadow: 'Meadow',
      mono: 'Mono',
    },
    themeHints: {
      classic: 'Dunkel, neutralgrau',
      macos: 'Dunkel in den Systemfarben von macOS — Leisten heller als der Inhalt',
      slate: 'Dunkel, kühles Blaugrau — Leisten tiefer als der Inhalt',
      ocean: 'Dunkel, blaustichig',
      forest: 'Dunkel, grünstichig',
      mangolila: 'Dunkel, warmes Anthrazit — Kopf hell, Fuß tief, Koralle als einzige Farbe',
      petrol: 'Dunkel, kühles Blaugrün — warmer Akzent',
      amber: 'Dunkel, warmes Bernstein — violetter Akzent',
      aurora: 'Dunkel, Violett — Leisten mit Farbschleier',
      carbon: 'Fast schwarz, kontraststark — Leisten heller als der Inhalt',
      paper: 'Hell, warmes Off-White',
      sepia: 'Heller Inhalt zwischen dunklen Leisten',
      meadow: 'Hell, kühles Grün — Leisten in Tannengrün',
      mono: 'Hell, nahezu farblos',
    },
    themeActive: 'aktiv',
    languageHeading: 'Sprache',
    languageHint:
      'Gilt für Beschriftungen, Zahlen und Datumsangaben. Die Wahl bleibt in diesem Browser gespeichert; ohne eigene Wahl entscheidet die Spracheinstellung des Browsers.',
    linksHeading: 'Externe Links',
  },

  statusPage: {
    title: 'Status',
    heading: 'StockInfo-API',
    recheck: 'Erneut prüfen',
    address: 'Adresse',
    noAddress: 'Keine Adresse konfiguriert',
    state: 'Zustand',
    version: 'Version',
    latency: 'Antwortzeit',
    latencyUnit: '{ms} ms',
    checked: 'Geprüft',
    reason: 'Grund',
    reports: '— meldet „{status}"',
    offlineHint: 'Ohne die API gibt es keine Kurse und damit keine Kennzahlen. Die zuletzt geladenen Kurse bleiben gespeichert und werden weiter verwendet — erkennbar am Alter in der Kopfzeile.',
    states: {
      unknown: 'noch nicht geprüft',
      checking: 'wird geprüft …',
      online: 'erreichbar',
      offline: 'nicht erreichbar',
    },
  },

  portfolios: {
    heading: 'Depots',
    intro:
      'Mehrere Depots nebeneinander — etwa eines für die Kinder oder eine Variante zum Durchrechnen. Gerechnet wird immer nur mit dem aktiven; sein Name steht in der Statuszeile am unteren Rand. Basiswährung, Sicherheitspuffer und Mindesthandelsbetrag gehören zum jeweiligen Depot. Toleranzbänder und Darstellung gelten gemeinsam.',
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
    heading: 'Backup und Wiederherstellung',
    intro:
      'Depot und Einstellungen liegen in deinem Konto auf dem Server. Die Backup-Datei ist eine zusätzliche Sicherung, die du selbst aufbewahrst. Kurse sind nicht enthalten — die holt die App ohnehin neu.',
    download: 'Backup',
    restore: 'Backup einspielen …',
    confirmHeading: 'Dieses Backup einspielen?',
    portfolio: 'Depot',
    positions: 'Positionen',
    hidden: 'Ausgeblendet',
    valueHistory: 'Tageswerte',
    ofWhichCash: 'davon Cash',
    savedAt: 'Backup vom',
    appVersion: 'App-Fassung',
    unknown: 'unbekannt',
    replaceWarning:
      'Das aktuelle Depot mit {positions} und alle Einstellungen werden dabei ersetzt. Das lässt sich nicht rückgängig machen — bei Zweifeln vorher ein eigenes Backup herunterladen.',
    replaceNow: 'Jetzt ersetzen',
    confirmReplace: 'Aktuelles Depot wirklich überschreiben?',
    saved: 'Backup erstellt: {file}',
    exportFailed: 'Das Backup konnte nicht erstellt werden: {reason}',
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
      relativeDeviationAfter: 'Rel. Abw.',
      relativePercent: 'Rel. %',
      deviation: 'Abw. Ziel',
    },
    shareAfterLabel: 'Anteil nachher: {share}',
    relativeUndefined: 'Bei Ziel 0 % nicht definiert',
    tradeTooltip: 'Positive Werte bedeuten Kauf, negative Werte Verkauf.',
    relativeDeviationTooltip: 'Relative Abweichung vom Ziel nach dem geplanten Handel. Beispiel: 9,5 % Anteil bei 10 % Ziel ergeben −5 % relative Abweichung. Die Zahl ist je nach Vorzeichen grün oder rot; die Balkenfarbe zeigt den Bandstatus.',
    deviationTooltip: 'Abweichung vom Ziel nach dem geplanten Handel in Prozentpunkten. Beispiel: 9,5 % Anteil minus 10 % Ziel ergeben −0,5 Prozentpunkte.',
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
    loading: 'Depot und Kurse werden geladen …',
    empty: 'Noch keine Wertpapiere im Depot',
    positionsHeading: 'Positionen — Bestand und Ziel sind direkt änderbar',
    positionsShort: 'Positionen',
    assetClasses: 'Depotgruppen',
    targetDistribution: 'Ziel-Verteilung',
    bands: 'Bänder: −{lower} / +{upper}',
    scheduleDue: 'Termin fällig',
    scheduleNext: 'Nächster Termin {date}',
    emptyTitle: 'Noch keine Wertpapiere im Depot',
    emptyHint: 'Lege deine erste Position an, lade ein Beispiel-Depot oder spiele ein vorhandenes Backup ein.',
    loadDemo: 'Beispiel-Depot laden',
    reloadQuote: 'Kurs neu laden',
    noMatchingLinks: 'Keine passenden Links — unter „Einstellungen" konfigurierbar.',
    confirmRemove: 'Position „{name}" wirklich löschen?',
    kind: 'Gattung',
    kindEtf: 'ETF',
    kindStock: 'Aktie',
    isin: 'ISIN',
    quoteAge: 'Kurs-Stand',
    details: 'Details',
    amountEuro: 'Betrag in {currency}',
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
    typesSource: 'Asset-Typen werden von StockInfo vorgegeben.',
    typesLoading: 'Asset-Typen werden geladen …',
    typesFailed: 'Asset-Typen konnten nicht geladen werden: {reason}. Gespeicherte Filter bleiben erhalten.',
    typesIncomplete: 'Die Typauskunft ist unvollständig. Bekannte Typen sind auswählbar; gespeicherte Filter bleiben erhalten.',
    typesEmpty: 'StockInfo bietet derzeit keine Asset-Typen an. Gespeicherte Filter bleiben erhalten.',
    reloadTypes: 'Typen neu laden',
    typeNotOffered: '{type} (nicht im aktuellen Katalog)',
    typeUnconfirmed: '{type} (gespeichert, derzeit unbestätigt)',
    newLink: 'Neuer Link',
    hint: "In der Adresse werden {'{isin}'} und {'{symbol}'} ersetzt. Leere Typ- oder Gruppenauswahl gilt jeweils für alle. Sind beide gesetzt, muss die Position beide erfüllen. Ein Link mit {'{isin}'} erscheint nicht bei Positionen ohne ISIN.",
    labelPlaceholder: 'Bezeichnung',
    url: 'Adresse',
    urlPlaceholder: "https://…/{'{isin}'}",
    appliesTo: 'Gilt für',
    appliesToKind: 'Asset-Typ',
    appliesToGroup: 'Depotgruppe',
    allKinds: 'Alle Typen',
    allGroups: 'Alle Gruppen',
    enabled: 'Link aktiv',
    add: 'Link hinzufügen',
    reset: 'Auf Vorgaben zurücksetzen',
    confirmReset: 'Alle Links auf die Vorgaben zurücksetzen?',
    confirmDelete: 'Link „{label}" löschen?',
    etf: 'ETF',
    stock: 'Aktie',
    noneConfigured: 'Keine Links konfiguriert — im Drilldown erscheinen dann keine externen Links.',
    confirmDeleteShort: 'Link „{label}“ entfernen?',
    confirmResetShort: 'Alle Links durch die Vorgaben ersetzen?',
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
    openSetting: 'Zur Einstellung →',
    more: 'Mehr dazu →',

    bandsHeading: 'Toleranzbänder',
    bandsBody:
      'Ein Depot soll eine bestimmte Aufteilung haben. Kurse verschieben sie laufend, aber nicht jede Abweichung ist ein Handlungsbedarf: Wer bei jedem Prozentpunkt umschichtet, zahlt Gebühren und Steuern für eine Genauigkeit, die am nächsten Tag wieder dahin ist.',
    bandsBody2:
      'Die Bänder ziehen eine Grenze. Erst wenn ein Anteil relativ zu seinem Ziel um mehr als das untere oder obere Band abweicht, springt der Status auf Below oder Above. Relativ heißt: Bei einem Ziel von 10 % und einem unteren Band von 6 % beginnt Below bei 9,4 % — nicht bei 4 %.',
    bandsDelta:
      'Die Delta-Spalte zeigt diese Abweichung — relativ zum Ziel, nicht in Prozentpunkten. Der Unterschied ist keine Spitzfindigkeit: Bei einem Ziel von 10 % heißt −10 % nicht „bei null angekommen", sondern ein Zehntel unter dem Zielwert, also 9 %. In Prozentpunkten gerechnet wären −10 dagegen tatsächlich null.',
    bandsDelta2:
      'Relativ gerechnet wird, damit ein Band für jede Position dasselbe bedeutet. Bei einem Ziel von 45 % wären 6 Prozentpunkte gut ein Achtel der Position, bei einem Ziel von 5 % mehr als die ganze — dieselbe Zahl hieße an jeder Zeile etwas anderes. Als Anteil des Ziels ist „6 %" überall dieselbe Schwelle.',
    bandsBody3:
      'Die beiden Bänder sind getrennt einstellbar, und das aus gutem Grund: Nach unten reagiert man üblicherweise früher als nach oben. Ein gefallener Anteil bedeutet, dass man günstig nachkaufen kann; ein gestiegener bedeutet nur, dass etwas gut gelaufen ist.',
    bandsBody4:
      'Der Unterschied zum verbreiteten Kalender-Rebalancing: Dort schichtet man zu festen Terminen um, unabhängig davon, ob es nötig ist. Nach Bändern geschieht es, wenn es etwas zu tun gibt — in ruhigen Jahren gar nicht, in bewegten mehrmals.',

    bandsMinTrade:
      'Dass die Bänder relativ zum Ziel gelten, hat eine Kehrseite. Es löst zwar die Blindheit bei kleinen Positionen — 6 % von 2 % sind 6 % von 2 %, egal wie klein der Anteil ist —, macht sie in Euro aber überempfindlich: Bei einem Depot von 100.000 € meldet sich ein Ziel von 2 % schon bei 120 € Abweichung. Für diesen Betrag lohnt keine Order; die Gebühr frisst den Nutzen.',
    bandsMinTrade2:
      'Dagegen steht das Mindest-Handelsvolumen in den Einstellungen. Liegt eine Position außerhalb ihres Bandes, ist die fehlende Summe aber kleiner als diese Grenze, bleibt der Status auf „OK" und die Zeile bekommt ein kleines „min". Die Abweichung verschwindet nicht — sie steht weiter in der Delta-Spalte —, nur die Anzeige Below oder Above unterbleibt. Vorgabe ist 0, also aus.',

    triggerHeading: 'Bänder, Termin — oder beides',
    triggerBody:
      'Die App kennt drei Auslöser. „Toleranzbänder" ist das oben Beschriebene: Es geschieht etwas, wenn etwas zu tun ist. „Fester Termin" ist das verbreitete Kalender-Rebalancing: einmal im Jahr, unabhängig davon, wie die Anteile stehen — dafür dann jede Abweichung, nicht nur die großen. Am fälligen Termin richtet sich der Status deshalb nach dem Zielwert: Below oder Above erscheint dann schon bei jeder Abweichung, nicht erst außerhalb der Bänder.',
    triggerBody2:
      'Reines Kalender-Rebalancing hat eine bekannte Schwäche: Bricht der Markt im März ein, verschiebt sich die Aufteilung sofort, der Termin aber liegt im Dezember. Neun Monate lang passiert nichts. Umgekehrt kann ein Jahr so ruhig verlaufen, dass am Termin nur Rundungsreste umzuschichten wären.',
    triggerBody3:
      'Deshalb die dritte Möglichkeit, „Bänder und Termin": Die Bänder laufen weiter und melden jede grobe Verschiebung sofort; der Termin ist ein zusätzlicher Anlass, bei dem auch die kleineren Abweichungen mitgenommen werden. Das Mindest-Handelsvolumen wirkt dabei weiter — am Stichtag stünde sonst hinter jedem Rundungsrest ein Auftrag.',
    triggerBody4:
      'Der Termin hängt am Depot, nicht an den Einstellungen: Jedes Depot hat sein eigenes Datum des letzten Ausgleichs. Gesetzt wird es von Hand — ob eine Order tatsächlich ausgeführt wurde, weiß nur, wer sie aufgegeben hat.',

    classesHeading: 'Sechs Depotgruppen',
    classesBody:
      'Aktien, ETFs, Anleihen, Edelmetalle, Geldmarkt und Cash. Die Gruppe eines Papiers kannst du beim Hinzufügen oder Bearbeiten wählen; auch ein Anleihe-ETF kann unter Anleihen stehen. Nur Geldmarkt und Cash zählen zur verfügbaren Liquidität.',

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
      'Die Delta-Spalte nennt die Stückzahl bis zum Ziel. Ergeben die Ziel-Anteile zusammen 100 %, heben sich alle Deltas in der Depotwährung gegenseitig auf — wer allen folgt, bekommt einen Plan, der von selbst aufgeht. Jeder Kauf muss im Plan bezahlt werden — aus einem Verkauf oder aus Cash beziehungsweise Geldmarkt. Einen abstrakten Topf, aus dem man schöpft, gibt es nicht.',

    limitsHeading: 'Was die App bewusst nicht tut',
    limitsCurrency:
      'Sie bewertet jedes Depot in seiner gewählten Basiswährung. Fremde Notierungen werden mit den Devisenkursen von StockInfo umgerechnet. Ohne gültigen Devisenkurs zählt die Position nicht mit; bei einem veralteten Kurs wird mit sichtbarer Warnung weitergerechnet.',
    limitsRisk:
      'Sie sagt nichts über Währungsrisiko. Ein EUR-notierter MSCI World steckt zu zwei Dritteln in US-Dollar; das ist eine andere Frage als die Notierungswährung.',
    limitsAdvice:
      'Sie gibt keine Anlageberatung. Sie rechnet aus, was aus der eingegebenen Zielverteilung folgt — ob diese Verteilung sinnvoll ist, entscheidet der Nutzer.',
    limitsData:
      'Sie speichert nichts außerhalb des Browsers. Kein Server kennt die Bestände; die Kursquelle erfährt nur, welche Papiere abgefragt werden.',
  },

  hints: {
    baseCurrency:
      'Währung, in der das aktive Depot bewertet wird. Positionen in anderen Währungen rechnet die App mit aktuellen Devisenkursen um. Jedes Depot hat seine eigene Basiswährung.',
    bands:
      'Erst wenn ein Anteil relativ zu seinem Ziel um mehr als das Band abweicht, zeigt die Position Below oder Above. Kleine Ausschläge bleiben unbeachtet — sie kosten sonst Gebühren für eine Genauigkeit, die nicht hält.',
    investmentReserve:
      'Geldmarkt und Cash abzüglich Sicherheitspuffer. Sagt, wie viel bei einem Rückgang höchstens eingesetzt werden könnte — nicht, wie viel eingesetzt werden soll.',
    securityBuffer:
      'Der Betrag, der unangetastet bleiben soll — ein Notgroschen, kein Anlagebetrag. Wählbar als fester Betrag oder als Anteil am Gesamtwert.',
    trigger:
      'Woran sich der Ausgleich entscheidet: laufend an den Bändern, an einem festen Termin, oder an beidem. Reines Kalender-Rebalancing lässt einen Einbruch im März bis zum Jahresende unbeachtet.',
    minTradeSize:
      'Kleinster Betrag, für den sich eine Order lohnt. Bleibt eine Abweichung darunter, zeigt die Position „OK" mit dem Zusatz „min" — die Abweichung bleibt trotzdem sichtbar. 0 schaltet die Grenze ab.',
    delta:
      'Abweichung vom Ziel, relativ zum Ziel selbst: −10 % heißt „ein Zehntel unter dem Zielwert", nicht „zehn Prozentpunkte". Die Farbe zeigt, ob die Position im Band liegt.',
    coverFrom:
      'Käufe müssen im Plan bezahlt werden — es gibt keinen Topf, aus dem man schöpft. Fehlt Geld, nennt der Vorschlag die Stückzahl, mit der Cash oder Geldmarkt die Lücke schließt.',
    historyPeriod:
      'Zeitraum der kleinen Linie neben dem Kurs. Ein Monat, eine Woche oder ein Tag — bei „ein Tag" steht dort die Veränderung vom letzten Handelstag auf heute.',
    dataStatus:
      'Vollständig heißt: Für jede Position sind Kurs und nötige Währungsumrechnung verfügbar. Fehlende Kurse oder Devisenkurse machen die Bewertung unvollständig. Betroffene Positionen bleiben sichtbar und werden aus den Summen ausgeschlossen; veraltete verwendbare Kurse sind gewarnt. Ob eine Position unter oder über ihrem Ziel liegt, steht nicht hier, sondern in der Status-Spalte jeder Zeile.',
    moneymarket:
      'Geldmarktnahe Papiere schwanken kaum und zählen deshalb zusammen mit Cash zur verfügbaren Liquidität. Laufzeit-Anleihen tun das nicht.',
  },

  backupErrors: {
    invalidAmountSettings: 'Ungültige Geldschwellen im Backup.',
    invalidCurrency: 'Ungültige Depotwährung im Backup.',
    invalidJson: 'Die Datei enthält kein gültiges JSON.',
    notAnObject: 'Die Datei enthält kein Objekt.',
    wrongKind: 'Das ist kein StockPortfolio-Backup — die Kennung fehlt oder passt nicht.',
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
    aboutLabel: 'Über StockPortfolio',
    poweredBy: 'powered by',
    repositoryLabel: 'StockPortfolio auf GitHub (öffnet einen neuen Tab)',
    quotes: 'Kurse',
    quotesLoading: 'werden geladen …',
    quotesMissing: '{quotes} fehlen',
    apiDetails: '{state} — Details auf der Statusseite',
    apiUnknown: 'API ungeprüft',
    apiChecking: 'API wird geprüft',
    apiOnline: 'API erreichbar',
    apiOffline: 'API nicht erreichbar',
    syncConnecting: 'Live-Abgleich verbindet …',
    syncDisconnected: 'Live-Verbindung unterbrochen',
    syncLoading: 'Depotänderungen werden geladen …',
  },
  about: {
    title: 'Über StockPortfolio',
    providerName: 'MangoLila GmbH',
    providerStreet: 'Dorfstraße 112',
    providerCity: '6363 Westendorf',
    providerCountry: 'Österreich',
    websiteLink: 'Website von MangoLila',
    intro: 'StockPortfolio übernimmt Kurse aus StockInfo und berechnet Werte aus deinen Beständen, Zielanteilen und Einstellungen.',
    data: 'Daten können fehlen, veraltet oder fehlerhaft sein. Angezeigte Kurse sind keine verbindlichen Handelskurse.',
    use: 'Kauf- und Verkaufswerte folgen deinen Zielwerten und Regeln. Sie dienen zur Orientierung und sind keine persönliche Empfehlung zum Handeln. Prüfe Daten, Kurse und Kosten vor einer Order bei den maßgeblichen Quellen.',
    legal: 'Die Software steht unter der EUPL 1.2. MangoLilas Erklärung für Verbraucher erläutert die geltenden Regeln zu Gewährleistung und Haftung.',
    licenseLink: 'EUPL 1.2 (Deutsch)',
    licensingLink: 'Lizenz- und Verbraucherklärung',
    sourceLink: 'Lizenzseite und Quellarchiv',
    financialContentLink: 'MangoLila: Hinweise zu Finanzinhalten',
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
