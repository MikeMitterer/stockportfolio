// Prüft die lesbaren Demodaten des Teststacks sichtbar im Browser.
//
// Erwartet wird der Stack mit --demo-details:
//   1. Das Skript spielt frontend/tests/fixtures/browser/demo-details.backup.json
//      ein. Das ersetzt das Depot des synthetischen Admins im temporären
//      Teststack; dadurch lässt sich der Lauf beliebig oft wiederholen.
//   2. Die Assets-Übersicht zeigt genau die Instrumente aus
//      scripts/fixtures/demo-details.json, mit echten Namen, übersetzter
//      Gattung, ohne doppelte Symbole und mit TER auf zwei Nachkommastellen.
//   3. Jede Position zeigt ihre Zusatzinformationen: ETF mit justETF-Fondsgröße,
//      ETF mit manueller Fondsgröße in USD, ETC, Aktie und Fonds (Volatilität
//      laut StockInfo T-89, Fondsgröße in Mio. laut T-88).
//   4. Der Reiter „Informationen“ einer offenen Position bleibt offen, wenn
//      „Aktualisieren“ die Kurse neu lädt und wenn der Live-Abgleich nach
//      30 Sekunden das Depot neu liefert (T-83). Dieser Schritt wartet
//      deshalb gut eine halbe Minute.
// Bei jeder Abweichung endet das Skript mit Exit-Code 1.
//
// Voraussetzung:
//   .venv/bin/python scripts/stockinfo-test-server.py --stack --run --demo-accounts --demo-details --stockinfo-root ../StockInfo
//   npm --prefix frontend run check:demo-data -- <data_dir>/demo-accounts.json [Bildordner]
//
// Ohne Bildordner entstehen keine Bilder. Deutsche Oberfläche; der Browser
// läuft sichtbar auf dem Hauptmonitor, links bleiben 100 px frei.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const origin = 'http://127.0.0.1:5175'
const chromePath =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const viewport = { width: 1440, height: 1000 }
const scriptDir = dirname(fileURLToPath(import.meta.url))
const fixtureDir = resolve(scriptDir, '../../scripts/fixtures')
const backupPath = resolve(scriptDir, '../tests/fixtures/browser/demo-details.backup.json')
const credentialsPath = process.argv[2]
const imageDir = process.argv[3] ? resolve(process.argv[3]) : undefined
if (!credentialsPath) {
  console.error(
    'Aufruf: npm --prefix frontend run check:demo-data -- <data_dir>/demo-accounts.json [Bildordner]',
  )
  process.exit(2)
}
const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'))
const demoDetails = JSON.parse(readFileSync(resolve(fixtureDir, 'demo-details.json'), 'utf8'))
const demoQuotes = JSON.parse(readFileSync(resolve(fixtureDir, 'demo-quotes.json'), 'utf8'))
const backup = JSON.parse(readFileSync(backupPath, 'utf8'))

/** Erwarteter Name je Symbol: Beispiel-Depot, darüber die Demo-Namen. */
const expectedNames = new Map([
  ...demoQuotes.map((quote) => [quote.symbol, quote.name]),
  ...Object.entries(demoDetails.names),
])
const expectedSymbols = Object.keys(demoDetails.instruments)
/** Deutsche Gattungsnamen wie in `dashboard.kind*`. */
const typeLabels = {
  stock: 'Aktie',
  etf: 'ETF',
  etc: 'ETC',
  fund: 'Fonds',
  bond: 'Anleihe',
  crypto: 'Krypto',
}

const failures = []
function fail(label, message) {
  failures.push(`${label}: ${message}`)
}
function passed(label) {
  return !failures.some((failure) => failure.startsWith(`${label}:`))
}
/** Deutsche Zahl wie „1.850.000,00“ als Zahl. */
function parseGerman(text) {
  return Number((text.match(/[\d.]+,\d+/)?.[0] ?? '').replaceAll('.', '').replace(',', '.'))
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: false,
  args: ['--no-first-run'],
})
try {
  const context = await browser.newContext({ viewport, locale: 'de-AT' })
  await context.addInitScript(() => localStorage.setItem('stockportfolio.locale', 'de'))
  const page = await context.newPage()
  const session = await context.newCDPSession(page)
  const { windowId } = await session.send('Browser.getWindowForTarget')
  await session.send('Browser.setWindowBounds', { windowId, bounds: { left: 100, top: 0 } })

  /** Wartet auf die Positionstabelle mit geladenen Kursen. */
  async function dashboardReady() {
    await page.locator('td .badge__pill').first().waitFor({ timeout: 30000 })
  }

  /**
   * Klappt eine Position auf, liest den Reiter „Informationen“ und vergleicht
   * ihn mit `demo-details.json`.
   */
  async function checkPositionDetails(symbol, screenshotName) {
    const label = `Details ${symbol}`
    const expected = demoDetails.instruments[symbol]
    if (!expected) {
      fail(label, 'nicht in demo-details.json')
      return
    }
    const expectedKeys = Object.keys(expected)
      .filter((name) => name !== 'type')
      .map((name) => (name === 'manual_fund_size' ? 'fund_size' : name))
      .sort()
    const row = page.locator('.n-data-table-tr').filter({ hasText: symbol }).first()
    try {
      await row.locator('td').first().click()
      const drill = page.locator('.drill').first()
      await drill.waitFor({ timeout: 20000 })
      // Erst nach dem Nachladen der Kurse steht der Reiter still.
      await page.waitForLoadState('networkidle')
      // Die Zusatzinformationen stehen im Reiter „Informationen“.
      await drill
        .locator('.position-details__tab button')
        .filter({ hasText: 'Informationen' })
        .first()
        .click()
      await drill.locator('.detail-fields [data-detail-field]').first().waitFor({ timeout: 20000 })
      const fields = await drill
        .locator('.detail-fields [data-detail-field]')
        .evaluateAll((items) =>
          Object.fromEntries(
            items.map((item) => [
              item.getAttribute('data-detail-field'),
              item.querySelector('.detail-fields__value')?.textContent?.trim() ?? '',
            ]),
          ),
        )
      const shownKeys = Object.keys(fields).sort()
      if (shownKeys.join() !== expectedKeys.join()) {
        fail(label, `Felder ${shownKeys.join(', ')} statt ${expectedKeys.join(', ')}`)
      }
      for (const [name, value] of Object.entries(fields)) {
        if (value === '—' || value === '') fail(label, `${name} ohne Wert`)
      }
      if (expected.provider && fields.provider !== expected.provider) {
        fail(label, `Anbieter „${fields.provider}“ statt „${expected.provider}“`)
      }
      const fundSize = expected.fund_size ?? expected.manual_fund_size?.value
      if (fundSize !== undefined) {
        // Wie StockInfo: „15.214,00 Mio. EUR“; eine manuelle Angabe in ihrer Währung.
        const currency = expected.manual_fund_size?.currency ?? 'EUR'
        const shown = fields.fund_size ?? ''
        if (
          !shown.endsWith(` Mio. ${currency}`) ||
          Math.abs(parseGerman(shown) - fundSize) > 0.01
        ) {
          fail(label, `Fondsgröße „${shown}“ statt ${fundSize} Mio. ${currency}`)
        }
      }
      if (
        expected.volatility !== undefined &&
        Math.abs(parseGerman(fields.volatility ?? '') - expected.volatility) > 0.01
      ) {
        fail(label, `Volatilität „${fields.volatility}“ statt ${expected.volatility} %`)
      }
      if (passed(label)) console.log(`OK  ${label}: ${shownKeys.join(', ')}`)
      if (imageDir && screenshotName) {
        await page.mouse.move(0, viewport.height - 1)
        await drill.scrollIntoViewIfNeeded()
        await page.waitForTimeout(800)
        await drill.screenshot({ path: resolve(imageDir, screenshotName) })
      }
      await row.locator('td').first().click()
    } catch (error) {
      // Ein Ablauffehler ist ein Befund; die übrigen Positionen werden weiter geprüft.
      fail(label, `Ablauf abgebrochen: ${String(error.message).split('\n')[0]}`)
      await page.goto(`${origin}/#/`)
      await dashboardReady()
    }
  }

  // Anmelden als synthetischer Admin; ein erzwungener Passwortwechsel wird erledigt.
  await page.goto(origin)
  await page.locator('form [role="checkbox"]').waitFor({ timeout: 20000 })
  await page.locator('input[type="text"]').first().fill(credentials.admin.username)
  await page.locator('input[type="password"]').first().fill(credentials.admin.password)
  await page.locator('form [role="checkbox"]').click()
  await page
    .locator('form')
    .first()
    .evaluate((form) => form.requestSubmit())
  await page.waitForFunction(
    () =>
      document.querySelector('.dashboard__kpis, .dashboard__empty') ||
      document.body.textContent?.includes('Passwort speichern'),
    undefined,
    { timeout: 20000 },
  )
  const changeButton = page.getByRole('button', { name: 'Passwort speichern' })
  if (await changeButton.isVisible()) {
    const nextPassword = `${credentials.admin.password}2`
    await page.locator('input[type="password"]').first().fill(nextPassword)
    await changeButton.click()
    credentials.admin.password = nextPassword
    writeFileSync(credentialsPath, JSON.stringify(credentials))
  }
  await page.locator('.dashboard__kpis, .dashboard__empty').first().waitFor({ timeout: 20000 })

  // 1 · Backup-Testdepot einspielen; danach ist der Ausgangszustand bekannt.
  await page.goto(`${origin}/#/settings?tab=backup`)
  await page.locator('.backup input[type="file"]').setInputFiles(backupPath)
  await page.getByRole('button', { name: 'Jetzt ersetzen' }).click()
  // Nach dem Einspielen lädt die App neu; auf genau diese Navigation warten.
  await Promise.all([
    page.waitForEvent('framenavigated', { timeout: 30000 }),
    page.locator('.n-popconfirm__action button').last().click(),
  ])
  await page.waitForLoadState('networkidle')

  // 2 · Assets-Übersicht: genau die Demo-Instrumente, echte Namen, keine Dubletten.
  await page.goto(`${origin}/#/assets`)
  await page.locator('.instruments .cell-name').first().waitFor({ timeout: 20000 })
  await page.waitForLoadState('networkidle')
  const rows = await page.locator('.instruments tbody tr').evaluateAll((elements) =>
    elements.map((row) => ({
      symbol: row.querySelector('.cell-symbol')?.textContent?.trim() ?? '',
      name: row.querySelector('.cell-name')?.textContent?.trim() ?? '',
      type: row.querySelector('td:nth-child(3)')?.textContent?.trim() ?? '',
      ter: row.querySelector('td:nth-child(5)')?.textContent?.trim() ?? '',
    })),
  )
  const label = 'Assets-Übersicht'
  if (rows.length !== expectedSymbols.length) {
    fail(label, `${rows.length} Zeilen statt ${expectedSymbols.length}`)
  }
  for (const row of rows) {
    if (/\bT\d+\b/.test(row.name)) fail(label, `Testfallname „${row.name}“`)
  }
  const listed = rows.map((row) => row.symbol).filter((symbol) => symbol !== '—')
  const duplicates = [
    ...new Set(listed.filter((symbol, index) => listed.indexOf(symbol) !== index)),
  ]
  if (duplicates.length > 0) fail(label, `doppelte Symbole: ${duplicates.join(', ')}`)
  const rowsByName = new Map(rows.map((row) => [row.name, row]))
  for (const symbol of expectedSymbols) {
    const name = expectedNames.get(symbol)
    const row = rowsByName.get(name)
    if (!row) {
      fail(label, `„${name}“ (${symbol}) fehlt`)
      continue
    }
    const values = demoDetails.instruments[symbol]
    if (row.type !== typeLabels[values.type])
      fail(label, `${symbol}: Typ „${row.type}“ statt „${typeLabels[values.type]}“`)
    // TER mit zwei Nachkommastellen; ohne TER-Deklaration für die Gattung „—“.
    const ter =
      values.ter === undefined
        ? '—'
        : `${values.ter.toFixed(2).replace(/0$/, '').replace('.', ',')} %`
    if (row.ter !== ter) fail(label, `${symbol}: TER „${row.ter}“ statt „${ter}“`)
  }
  if (passed(label)) console.log(`OK  ${label}: ${rows.length} lesbare Instrumente`)
  if (imageDir)
    await page.screenshot({ path: resolve(imageDir, 'demo-assets.png'), fullPage: true })

  // 3 · Zusatzinformationen jeder Marktposition des Backup-Testdepots.
  await page.goto(`${origin}/#/`)
  await dashboardReady()
  for (const position of backup.portfolio.positions.filter((entry) => entry.group !== 'cash')) {
    const screenshot = {
      'VGWL.DE': 'demo-details.png',
      VTI: 'demo-details-manual-usd.png',
      AAPL: 'demo-details-stock.png',
      '847652.F': 'demo-details-fund.png',
    }
    await checkPositionDetails(position.symbol, screenshot[position.symbol])
  }

  // 4 · Der gewählte Reiter übersteht Kursabruf und Live-Abgleich.
  const tabLabel = 'Reiter nach Aktualisierung'
  try {
    const symbol = backup.portfolio.positions.find((entry) => entry.group !== 'cash').symbol
    const row = page.locator('.n-data-table-tr').filter({ hasText: symbol }).first()
    await row.locator('td').first().click()
    const drill = page.locator('.drill').first()
    await drill.waitFor({ timeout: 20000 })
    await page.waitForLoadState('networkidle')
    await drill
      .locator('.position-details__tab button')
      .filter({ hasText: 'Informationen' })
      .first()
      .click()
    const assetSection = drill.locator('[data-position-section="asset"]')
    await assetSection.waitFor({ timeout: 20000 })
    await page.getByRole('button', { name: 'Aktualisieren' }).first().click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    if (!(await assetSection.isVisible()))
      fail(tabLabel, 'nach „Aktualisieren“ nicht mehr „Informationen“')
    // Der Live-Abgleich lädt spätestens nach 30 Sekunden neu.
    await page.waitForTimeout(35000)
    if (!(await assetSection.isVisible()))
      fail(tabLabel, 'nach dem Live-Abgleich nicht mehr „Informationen“')
    if (passed(tabLabel)) console.log(`OK  ${tabLabel}: „Informationen“ bleibt offen (${symbol})`)
  } catch (error) {
    fail(tabLabel, `Ablauf abgebrochen: ${String(error.message).split('\n')[0]}`)
  }
} catch (error) {
  fail('Ablauf', String(error.message).split('\n')[0])
} finally {
  await browser.close()
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FEHLER  ${failure}`)
  process.exit(1)
}
console.log('Demodaten wie erwartet.')
