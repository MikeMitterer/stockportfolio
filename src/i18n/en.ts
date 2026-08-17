/**
 * Englischer Message-Katalog.
 *
 * Schlüssel und Struktur kommen aus `de.ts` — dort steht die Wahrheit. Fehlt
 * hier ein Schlüssel, meckert der Typecheck; das ist die Absicht.
 */
import type { MessageSchema } from './de'

export const en: MessageSchema = {
  app: {
    title: 'StockPortfolio',
    subtitle: 'Tolerance-Band Rebalancing',
    brandLead: 'Stock',
    brandAccent: 'Portfolio',
  },
  nav: {
    dashboard: 'Dashboard',
    rebalancing: 'Rebalancing',
    instruments: 'Assets',
    settings: 'Settings',
  },
  actions: {
    refresh: 'Refresh',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    apply: 'Apply',
    close: 'Close',
    toggleTheme: 'Switch theme',
    addPosition: 'Add position',
    exportJson: 'Export JSON',
    importJson: 'Import JSON',
  },
  groups: {
    stocks: 'Stocks / ETFs',
    bonds: 'Bonds',
    metals: 'Precious metals',
    moneymarket: 'Money market',
    cash: 'Cash',
  },
  // Bewusst englische Kürzel, auch im deutschen UI: „Kaufen"/„Verkaufen"
  // sind unterschiedlich lang und ließen die Spalte von Zeile zu Zeile
  // wandern. Buy/Sell/OK sind kurz, gleich lang und im Börsenkontext geläufig.
  startup: {
    noApiUrlTitle: 'No API address configured',
    noApiUrlBody:
      'StockPortfolio gets its prices from a StockInfo instance; without its address there is nothing to calculate. In the container it is set through the environment variable STOCKINFO_API_URL, in development through VITE_STOCKINFO_API_URL in the .env file.',
    noApiUrlRepo: 'StockInfo: https://github.com/MikeMitterer/stockinfo',
  },

  valueHistory: {
    heading: 'Value history',
    empty: 'No history yet — it appears once prices are loaded.',
    captionFrom:
      'Solid from {date}: actually recorded daily values. Dashed before that: today’s holdings valued at past prices — not the portfolio’s history but a look back at today’s allocation.',
    captionBacktestOnly:
      'Dashed: today’s holdings valued at past prices — not the portfolio’s history but a look back at today’s allocation. From today on, the app also records the actual daily value.',
  },

  seed: {
    portfolioName: 'My portfolio',
    demoName: 'Sample portfolio',
    cashAccount: 'Cash account',
  },

  suggestion: {
    buy: 'Buy',
    sell: 'Sell',
    ok: 'OK',
    near: 'Near',
    belowMinTradeMark: 'min',
    belowMinTrade: 'Outside the band, but below the minimum trade size.',
  },
  kpi: {
    total: 'Total value',
    investmentReserve: 'Investable reserve',
    investmentReserveHint: 'Money market + cash − safety buffer',
    investmentReservePercent: 'Reserve in %',
    securityBufferHint: 'Safety buffer: {buffer}',
    dataStatus: 'Data status',
    dataComplete: 'Complete',
    dataIncomplete: '{count} incomplete',
  },
  table: {
    symbol: 'Symbol',
    name: 'Name',
    units: 'Holding',
    price: 'Price',
    marketValue: 'Market value',
    actualPercent: 'Actual %',
    targetPercent: 'Target %',
    delta: 'Delta',
    status: 'Status',
    quoteAge: 'Price {minutes} min ago',
    quoteAgeStale: 'Price stale',
    openDetails: 'Show details',
    quoteMissing: 'No price available',
  },
  drilldown: {
    editHeading: 'Edit position',
    tradeSimulator: 'Trade simulator',
    tradeSimulatorHint: 'Positive means buy, negative means sell',
    tradeUnits: 'Units',
    tradeApply: 'Apply',
    projectedActual: 'New actual',
    projectedDelta: 'New delta',
    volatility: 'Volatility',
    optimalUnits: 'Units at target',
    deltaEuro: 'Delta €',
    lowerBand: 'Lower band',
    upperBand: 'Upper band',
    meldefondCheck: 'myOEKB — reporting fund check',
    notes: 'Notes',
    displayName: 'Name',
    group: 'Group',
    enabled: 'Active',
  },
  bands: {
    lower: 'Lower band',
    upper: 'Upper band',
    unit: '%',
  },
  refresh: {
    justNow: 'just now',
    ago: '{value} ago',
    minutesShort: '{n} min',
    hoursShort: '{n} h',
    never: 'never',
  },
  views: {
    instrumentsTitle: 'Assets',
    instrumentsComingSoon: 'The catalogue of all instruments from the StockInfo API will appear here — including the allow-list toggle for portfolio selection.',
    settingsTitle: 'Settings',
  },

  /**
   * Anzahl mit Einheit. Die Pluralform gehört in den Katalog, nicht in den
   * Code — welche Formen eine Sprache hat, weiß nur die Sprache selbst.
   */
  units: {
    positions: '{count} position | {count} positions',
    days: '{count} day | {count} days',
    quotes: '{count} price | {count} prices',
    assets: '{count} asset | {count} assets',
  },

  history: {
    heading: 'Price history',
    columnTitle: 'History {period}',
    short: { d1: '1D', w1: '1W', m1: '1M', m3: '3M', y1: '1Y', max: 'Max' },
    periodNames: { day: 'One day', week: 'One week', month: 'One month' },
    periodHeading: 'History in the table',
    periodHint:
      'Period of the small line next to the price. “One day” shows no line but the change from the last trading day to today.',
    none: 'No history available for this instrument.',
    sinceStart: '{value} since start',
    axisHint: 'Prices on the left, change since {date} on the right.',
  },

  currency: {
    badgeTitle: 'Quoted in {currency} — excluded from totals',
    statusForeign: 'foreign currency',
    notCounted: 'not counted',
    inactive: 'inactive',
    warningTitle: 'Foreign currency',
    warningBody: '{positions} {verb} not in {base} and therefore {counts} not counted: {list}. Totals and shares refer to the rest only — the app calculates in a single currency and converts nothing.',
    verb: 'is quoted | are quoted',
    counts: 'is | are',
  },

  notify: {
    quotesMissingTitle: 'Prices missing',
    historyFailed: 'Price history could not be loaded',
    assetsFailed: 'Instruments could not be loaded',
    noClient: 'No API client available',
    unknownError: 'Unknown error',
    quotesMissingBody: '{quotes} could not be loaded — {details}',
    targetsExceededTitle: 'Targets above 100 %',
    targetsExceededBody: 'Target shares add up to {sum} — more than 100 %. While that is the case, the buy and sell suggestions do not add up either.',
    assetsFailedTitle: 'Assets could not be loaded',
    backupTitle: 'Backup',
    doneTitle: 'Done',
  },

  settings: {
    tabs: {
      calc: 'Calculation',
      theme: 'Theme',
      language: 'Language',
      links: 'Links',
      notifications: 'Messages',
      data: 'Data',
      status: 'Status',
    },
    triggerHeading: 'Trigger',
    trigger: {
      bands: 'Tolerance bands',
      calendar: 'Fixed schedule',
      both: 'Bands and schedule',
    },
    triggerHint: {
      bands: 'Rebalance as soon as a share leaves its band — continuously, no calendar.',
      calendar: 'Rebalance only on the due date, but then every deviation from target.',
      both: 'Bands apply continuously; the due date additionally picks up the smaller deviations.',
    },
    intervalMonths: 'Interval (months)',
    intervalHint: '12 = yearly, 6 = twice a year, 3 = quarterly.',
    lastRebalanced: 'Last rebalanced ({depot})',
    markToday: 'Today',
    neverRebalanced: 'Never rebalanced — the review counts as due.',
    dueSince: 'Due for {days} days.',
    dueIn: '{days} days to go — next review {date}.',
    bandsHeading: 'Tolerance bands',
    lowerHint: 'Market value below target by more than this share → buy.',
    upperHint: 'Market value above target by more than this share → sell.',
    metricsHeading: 'Liquidity',
    securityBuffer: 'Safety buffer',
    minTradeSize: 'Minimum trade size',
    minTradeUnset: 'Off — every deviation outside the band is reported.',
    bufferPercent: '% of total value',
    bufferAbsolute: 'Fixed amount (€)',
    bufferUnset: 'Not set — all liquidity counts as reserve.',
    bufferEquals: 'Currently equals {amount}.',
    notificationsHeading: 'Display duration',
    notificationSeconds: 'Dismiss messages after (s)',
    notificationKeep: 'They stay until the cause is fixed or you dismiss them.',
    notificationAuto: 'They dismiss themselves — sooner if the cause disappears first.',
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
      classic: 'Dark, neutral grey',
      macos: 'Dark in the macOS system colours — bars lighter than the content',
      slate: 'Dark, cool blue-grey — bars sit below the content',
      ocean: 'Dark, blueish',
      forest: 'Dark, greenish',
      mangolila: 'Dark, warm anthracite — light header, deep footer, coral the only colour',
      petrol: 'Dark, cool blue-green — warm accent',
      amber: 'Dark, warm amber — violet accent',
      aurora: 'Dark, violet — bars carry a colour wash',
      carbon: 'Near black, high contrast — bars lighter than the content',
      paper: 'Light, warm off-white',
      sepia: 'Light content between dark bars',
      meadow: 'Light, cool green — bars in deep green',
      mono: 'Light, almost colourless',
    },
    themeActive: 'active',
    languageHeading: 'Language',
    languageHint: 'Applies to labels, numbers and dates. The choice is kept in this browser; without one, the browser language decides.',
    linksHeading: 'External links',
    apiHeading: 'StockInfo API',
    apiRecheck: 'Check again',
    apiAddress: 'Address',
    apiState: 'State',
    apiVersion: 'Version',
    apiLatency: 'Response time',
    apiLatencyUnit: '{ms} ms',
    apiChecked: 'Checked',
    apiReason: 'Reason',
    apiReports: '— reports “{status}”',
    apiOfflineHint: 'Without the API there are no prices and therefore no key figures. The prices loaded last remain stored and are still used — their age is shown in the header.',
    apiStates: {
      unknown: 'not checked yet',
      checking: 'checking …',
      online: 'reachable',
      offline: 'unreachable',
    },
  },

  portfolios: {
    heading: 'Portfolios',
    intro: 'Several portfolios side by side — one for the kids, say, or a variant to think through. Only the active one is used for calculations; its name is shown in the status bar. Tolerance bands, safety buffer and appearance apply to all of them.',
    active: 'active',
    namePlaceholder: 'Portfolio name',
    newPlaceholder: 'Name of the new portfolio',
    create: 'Create portfolio',
    switch: 'Switch',
    lastRemains: 'The last portfolio stays',
    changed: 'changed {age}',
    confirmDelete: 'Delete “{name}” with {positions} for good?',
  },

  backup: {
    heading: 'Backup and restore',
    intro: 'Portfolio and settings live in this browser only. A backup is the only way to move them to another device or to get them back after the site data has been cleared. Prices are not included — the app fetches those anyway.',
    download: 'Download backup',
    restore: 'Restore backup …',
    confirmHeading: 'Restore this backup?',
    portfolio: 'Portfolio',
    positions: 'Positions',
    hidden: 'Hidden',
    valueHistory: 'Daily values',
    ofWhichCash: 'of which cash',
    savedAt: 'Saved on',
    appVersion: 'App version',
    unknown: 'unknown',
    replaceWarning: 'The current portfolio with {positions} and all settings will be replaced. This cannot be undone — if in doubt, download your own backup first.',
    replaceNow: 'Replace now',
    confirmReplace: 'Really overwrite the current portfolio?',
    saved: 'Saved: {file}',
    restored: 'Restored: “{name}” with {positions}.',
    exportFailed: 'The backup could not be created: {reason}',
    importFailed: 'Restoring failed: {reason}',
  },

  rebalancing: {
    heading: 'Sell and buy — enter unit counts',
    freed: 'Freed up',
    freedHint: 'Sales and withdrawals',
    spent: 'Committed',
    spentHint: 'Purchases',
    balance: 'Balance',
    nothingPlanned: 'nothing planned yet',
    underfunded: 'not covered',
    balanced: 'adds up',
    leftOver: 'left over',
    coverFrom: 'Cover from',
    coverNothing: 'nothing open',
    coverHint: 'Cash and money market',
    coverTitle: '{label}: take {units} units into the plan',
    reserve: 'Available from reserve',
    reserveHint: 'Cash + money market above the buffer',
    simulationNote: 'Everything here is a simulation — neither holdings nor targets are changed.',
    clearPlan: 'Clear plan',
    empty: 'No instruments in this portfolio yet',
    bandsLabel: 'Bands: −{lower} / +{upper}',
    columns: {
      delta: 'Delta',
      trade: 'Buy / sell',
      value: 'Value',
      shareAfter: 'Share after',
      deviation: 'Off target',
    },
    deltaTooltip:
      'Units to reach the target: positive means buy, negative means sell. Click to put the value into the input.',
    deltaTooltipMore:
      'If the target shares add up to 100 %, all deltas cancel each other out — follow them all and the plan adds up by itself.',
    adoptDelta: 'Take into the input',
    targetProbe: 'Changed for this run only — the portfolio says {target}',
    footerQuestion: 'Does the plan add up?',
    footerNothing: 'Nothing planned yet.',
    footerBalanced: 'Purchases and sales cancel out.',
    footerLeftOver: '{amount} left over.',
    footerShort: '{amount} comes from the reserve.',
    underfundedTitle: 'Plan not covered',
    underfundedBody:
      '{amount} is missing for the planned purchases. Sell an instrument or withdraw from cash or money market — enter the withdrawal there as a negative number.',
    targetSumTitle: 'Targets do not add up to 100 %',
    targetSumBody:
      'The targets add up to {sum} instead of 100 %. What one position gains, another has to give up.',
    bufferTitle: 'Safety buffer breached',
    bufferBody:
      'The plan lowers cash and money market to {liquid}, breaching the safety buffer of {buffer}.',
  },

  dashboard: {
    positionsHeading: 'Positions — holdings and targets are editable in place',
    positionsShort: 'Positions',
    assetClasses: 'Asset classes',
    targetDistribution: 'Target allocation',
    bands: 'Bands: −{lower} / +{upper}',
    scheduleDue: 'Review due',
    scheduleNext: 'Next review {date}',
    emptyTitle: 'No instruments in this portfolio yet',
    emptyHint: 'Add your first position — or load a sample portfolio to try the app.',
    loadDemo: 'Load sample portfolio',
    reloadQuote: 'Reload price',
    noMatchingLinks: 'No matching links — configurable under “Settings”.',
    confirmRemove: 'Really delete position “{name}”?',
    kind: 'Kind',
    kindEtf: 'ETF',
    kindStock: 'Stock',
    isin: 'ISIN',
    quoteAge: 'Price age',
    details: 'Details',
    amountEuro: 'Amount (€)',
    unitsDelta: 'Δ holding (units)',
    ter: 'TER',
    targetValue: 'Target value',
  },

  instruments: {
    countLabel: '{shown} of {total}',
    hint: 'The “In selection” switch controls which instruments are offered when adding a position.',
    searchPlaceholder: 'Symbol, ISIN or name',
    allTypes: 'All types',
    type: 'Type',
    points: 'Price points',
    inSelection: 'In selection',
    inPortfolio: 'held',
    unknownType: 'unknown',
    newLink: 'New link',
  },

  addPosition: {
    heading: 'Add position',
    allInPortfolio:
      'All enabled instruments are already in the portfolio. More can be enabled under “Assets”.',
    instrument: 'Instrument',
    searchPlaceholder: 'Symbol, ISIN or name',
    group: 'Group',
    targetExceeds: 'That pushes the sum of target shares above 100 %.',
    add: 'Add',
    remaining: 'still free: {value}',
    groupHint: 'Suggested from the name — change if needed.',
    volatility: 'Volatility',
  },

  links: {
    hint: 'In the address, {isin} and {symbol} are substituted. Leaving “Applies to” empty means: all kinds. A link using {isin} does not appear for positions without one.',
    labelPlaceholder: 'Label',
    urlPlaceholder: 'https://…/{isin}',
    appliesTo: 'Applies to',
    add: 'Add link',
    reset: 'Reset to defaults',
    confirmReset: 'Reset all links to the defaults?',
    confirmDelete: 'Delete link “{label}”?',
    etf: 'ETF / fund',
    stock: 'Stock',
    noneConfigured: 'No links configured — the drilldown then shows none.',
    confirmDeleteShort: 'Remove link “{label}”?',
    confirmResetShort: 'Replace all links with the defaults?',
  },

  common: {
    edit: 'Click to edit',
    clear: 'Clear value',
    none: '—',
    version: 'v{version}',
    units: '{count} units',
    loading: '· loading …',
    overHundred: '· over 100 %',
  },

  method: {
    title: 'The method',
    intro:
      'This page explains what the app calculates. It is here to look things up — the app works without reading it.',
    openSetting: 'Open setting →',
    more: 'Read more →',

    bandsHeading: 'Tolerance bands',
    bandsBody:
      'A portfolio is meant to have a certain allocation. Prices keep shifting it, but not every deviation calls for action: rebalancing on every percentage point costs fees and taxes for a precision that is gone again the next day.',
    bandsBody2:
      'The bands draw a line. Only when a share deviates from its target by more than the lower or upper band does the status switch to Buy or Sell. Relative, that is: with a target of 10 % and a lower band of 6 %, action starts at 9.4 % — not at 4 %.',
    bandsDelta:
      'The delta column shows this deviation — relative to the target, not in percentage points. The difference is not hair-splitting: with a target of 10 %, −10 % does not mean “down to zero” but a tenth below the target value, that is 9 %. In percentage points, −10 would indeed be zero.',
    bandsDelta2:
      'The relative reading makes one band mean the same for every position. With a target of 45 %, 6 percentage points would be about an eighth of the position; with a target of 5 %, more than all of it — the same number would mean something different in every row. As a share of the target, “6 %” is the same call to action everywhere.',
    bandsBody3:
      'The two bands are set separately, and for good reason: one usually reacts sooner on the way down than on the way up. A share that has fallen means you can buy in cheaply; one that has risen only means something went well.',
    bandsBody4:
      'The difference to the common calendar rebalancing: there you rebalance on fixed dates, whether or not it is needed. With bands it happens when there is something to do — in quiet years not at all, in turbulent ones several times.',

    bandsMinTrade:
      'Bands relative to the target have a flip side. They do fix the blindness towards small positions — 6 % of 2 % is 6 % of 2 %, however small the share — but they make them oversensitive in euro terms: in a €100,000 portfolio a 2 % target already signals at €120 of deviation. No order is worth that; the fee eats the benefit.',
    bandsMinTrade2:
      'The minimum trade size in the settings counters this. If a position sits outside its band but the missing amount is smaller than that limit, the status stays “OK” and the row gets a small “min”. The deviation does not disappear — it remains in the delta column — only the call to action does. The default is 0, i.e. off.',

    triggerHeading: 'Bands, schedule — or both',
    triggerBody:
      'The app knows three triggers. “Tolerance bands” is what is described above: something happens when there is something to do. “Fixed schedule” is the common calendar rebalancing: once a year, regardless of where the shares stand — but then every deviation, not just the large ones.',
    triggerBody2:
      'Pure calendar rebalancing has a known weakness: if the market drops in March, the allocation shifts at once, but the date is in December. For nine months nothing happens. Conversely a year can be so quiet that the date would only shuffle rounding remainders.',
    triggerBody3:
      'Hence the third option, “Bands and schedule”: the bands keep running and report any coarse shift immediately; the date is an additional occasion on which the smaller deviations are picked up as well. The minimum trade size still applies — otherwise every rounding remainder would carry an order on the due date.',
    triggerBody4:
      'The date belongs to the portfolio, not to the settings: every portfolio has its own date of last rebalancing. It is set by hand — only whoever placed an order knows whether it was actually filled.',

    classesHeading: 'Five asset classes',
    classesBody:
      'Stocks/ETFs, bonds, precious metals, money market and cash. Separating bonds from money market is not a detail: bonds with a maturity fluctuate and make a poor reserve, money-market instruments barely move. Only money market and cash therefore count as available liquidity.',

    reserveHeading: 'Safety buffer and investable reserve',
    reserveBody:
      'The safety buffer is the amount meant to stay untouched — an emergency fund, not an investment. Whatever money market and cash hold above it is the investable reserve.',
    reserveBody2:
      'It is purely informational: it says how much could at most be invested in a downturn, not how much should be. The app does not take that decision from anyone.',
    reserveBody3:
      'The buffer comes as a fixed amount or as a share of total value. Both readings are legitimate: an emergency fund of three months of expenses does not grow with the portfolio, a liquidity share does.',

    planHeading: 'The rebalancing plan',
    planBody:
      'The plan calculates, it does not book. You enter unit counts and see at once what that costs or brings in and where the shares end up. You place the orders with your bank and update the holdings yourself afterwards.',
    planBody2:
      'The delta column gives the units to reach the target. If the target shares add up to 100 %, all deltas cancel each other out in euro terms — follow them all and the plan adds up by itself. Every euro spent has to come from somewhere visible: from a sale, or from cash or money market.',

    limitsHeading: 'What the app deliberately does not do',
    limitsCurrency:
      'It calculates in a single currency and converts nothing. An instrument quoted elsewhere stays visible but counts towards no total — 10,000 USD plus 10,000 EUR is not 20,000 of anything.',
    limitsRisk:
      'It says nothing about currency risk. A EUR-quoted MSCI World holds two thirds in US dollars; that is a different question from the quoting currency.',
    limitsAdvice:
      'It gives no investment advice. It works out what follows from the target allocation you entered — whether that allocation makes sense is your call.',
    limitsData:
      'It stores nothing outside the browser. No server knows the holdings; the price source only learns which instruments are queried.',
  },

  hints: {
    bands:
      'Action is only called for once a share deviates from its target by more than the band. Small swings are ignored — otherwise they cost fees for a precision that does not hold.',
    investmentReserve:
      'Money market and cash minus the safety buffer. Says how much could at most be invested in a downturn — not how much should be.',
    securityBuffer:
      'The amount meant to stay untouched — an emergency fund, not an investment. Either a fixed amount or a share of total value.',
    trigger:
      'What decides a rebalance: the bands continuously, a fixed date, or both. Pure calendar rebalancing leaves a March crash unattended until the end of the year.',
    minTradeSize:
      'Smallest amount for which an order is worthwhile. A deviation below it reports no action — it stays visible all the same. 0 switches the limit off.',
    delta:
      'Deviation from the target, relative to the target itself: −10 % means “a tenth below the target value”, not “ten percentage points”. The colour shows whether the position is inside the band.',
    coverFrom:
      'Purchases have to be paid for within the plan — there is no pot to draw from. If money is missing, the suggestion gives the units with which cash or money market closes the gap.',
    historyPeriod:
      'Period of the small line next to the price. A month, a week or a day — with “one day” it shows the change from the last trading day to today.',
    dataStatus:
      'Complete means: every position has a current price in the base currency and counts towards the totals. Incomplete are securities whose price could not be loaded or that are quoted in another currency — they stay visible but count towards nothing. Whether a position should be bought or sold is not shown here but in the status column of each row.',
    moneymarket:
      'Money-market instruments barely fluctuate and therefore count, together with cash, as available liquidity. Bonds with a maturity do not.',
  },

  backupErrors: {
    invalidJson: 'The file does not contain valid JSON.',
    notAnObject: 'The file does not contain an object.',
    wrongKind: 'This is not a StockPortfolio backup — the marker is missing or does not match.',
    noSchemaVersion: 'The file has no format version (schemaVersion).',
    newerFormat:
      'The file comes from a newer version (format {found}, this app knows {known}). Please update the app.',
    noSettings: 'The file has no settings.',
    noPortfolio: 'The file has no portfolio.',
    noPortfolioId: 'The portfolio has no id.',
    noPortfolioName: 'The portfolio has no name.',
    noPositions: 'The portfolio has no list of positions.',
    duplicateId: 'Position {at}: the id “{id}” appears more than once.',
    positionNotAnObject: 'Position {at}: not an object.',
    positionNoId: 'Position {at}: id missing.',
    positionNoSymbol: 'Position {at}: symbol missing.',
    positionGroup: 'Position {at}: unknown asset class “{group}”.',
    positionUnits: 'Position {at}: holding is not a number.',
    positionTarget: 'Position {at}: target share is not a number.',
    positionTargetRange: 'Position {at}: target share outside 0–100 %.',
  },

  status: {
    poweredBy: 'powered by',
    quotes: 'Prices',
    quotesLoading: 'loading …',
    quotesMissing: '{quotes} missing',
    apiDetails: '{state} — details in settings',
    apiUnknown: 'API not checked',
    apiChecking: 'API being checked',
    apiOnline: 'API reachable',
    apiOffline: 'API unreachable',
  },
}
