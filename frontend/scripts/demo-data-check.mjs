// Prüft die lesbaren Demodaten des Teststacks sichtbar im Browser.
//
// Erwartet wird der Stack mit --demo-details: Die Assets-Übersicht zeigt genau
// die Instrumente aus scripts/fixtures/demo-details.json mit echten Namen und
// ohne doppelte Symbole, und die aufgeklappten Positionen des Beispiel-Depots
// zeigen ihre Zusatzinformationen (TER, Volatilität, Fondsgröße, Anbieter …).
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
const fixtureDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../scripts/fixtures')
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

/** Erwarteter Name je Symbol: Beispiel-Depot, darüber die Demo-Namen. */
const expectedNames = new Map([
  ...demoQuotes.map((quote) => [quote.symbol, quote.name]),
  ...Object.entries(demoDetails.names),
])
const expectedSymbols = Object.keys(demoDetails.instruments)

const failures = []
function fail(label, message) {
  failures.push(`${label}: ${message}`)
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
  // Leeres Depot: zweite Schaltfläche lädt das Beispiel-Depot.
  const sample = page.locator('.dashboard__empty-buttons button').nth(1)
  if (await sample.isVisible()) await sample.click()
  await page.locator('td .badge__pill').first().waitFor({ timeout: 30000 })

  // 1 · Assets-Übersicht: genau die Demo-Instrumente, echte Namen, keine Dubletten.
  await page.goto(`${origin}/#/assets`)
  await page.locator('.instruments .cell-name').first().waitFor({ timeout: 20000 })
  await page.waitForLoadState('networkidle')
  const rows = await page.locator('.instruments tbody tr').evaluateAll((elements) =>
    elements.map((row) => ({
      symbol: row.querySelector('.cell-symbol')?.textContent?.trim() ?? '',
      name: row.querySelector('.cell-name')?.textContent?.trim() ?? '',
    })),
  )
  const label = 'Assets-Übersicht'
  if (rows.length !== expectedSymbols.length)
    fail(label, `${rows.length} Zeilen statt ${expectedSymbols.length}`)
  for (const row of rows) {
    if (/\bT\d+\b/.test(row.name)) fail(label, `Testfallname „${row.name}“`)
  }
  const listed = rows.map((row) => row.symbol).filter((symbol) => symbol !== '—')
  const duplicates = [...new Set(listed.filter((symbol, index) => listed.indexOf(symbol) !== index))]
  if (duplicates.length > 0) fail(label, `doppelte Symbole: ${duplicates.join(', ')}`)
  const shownNames = new Set(rows.map((row) => row.name))
  for (const symbol of expectedSymbols) {
    if (!shownNames.has(expectedNames.get(symbol)))
      fail(label, `„${expectedNames.get(symbol)}“ (${symbol}) fehlt`)
  }
  if (!failures.some((failure) => failure.startsWith(label)))
    console.log(`OK  ${label}: ${rows.length} lesbare Instrumente`)
  if (imageDir)
    await page.screenshot({ path: resolve(imageDir, 'demo-assets.png'), fullPage: true })

  // 2 · Zusatzinformationen jeder Marktposition des Beispiel-Depots.
  await page.getByRole('link', { name: 'Dashboard' }).first().click()
  await page.locator('td .badge__pill').first().waitFor({ timeout: 30000 })
  for (const quote of demoQuotes) {
    const detailLabel = `Details ${quote.symbol}`
    const expected = demoDetails.instruments[quote.symbol]
    const expectedKeys = Object.keys(expected)
      .filter((key) => key !== 'type')
      .map((key) => (key === 'manual_fund_size' ? 'fund_size' : key))
      .sort()
    const row = page.locator('.n-data-table-tr').filter({ hasText: quote.symbol }).first()
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
      if (shownKeys.join() !== expectedKeys.join())
        fail(detailLabel, `Felder ${shownKeys.join(', ')} statt ${expectedKeys.join(', ')}`)
      for (const [key, value] of Object.entries(fields)) {
        if (value === '—' || value === '') fail(detailLabel, `${key} ohne Wert`)
      }
      if (expected.provider && fields.provider !== expected.provider)
        fail(detailLabel, `Anbieter „${fields.provider}“ statt „${expected.provider}“`)
      if (expected.fund_size !== undefined) {
        // Deutsche Anzeige, etwa „€ 15.214,00 Mio.“: Zahl und Einheit müssen stimmen.
        const shown = fields.fund_size ?? ''
        const number = Number(
          (shown.match(/[\d.]+,\d+/)?.[0] ?? '').replaceAll('.', '').replace(',', '.'),
        )
        if (!/Mio\./.test(shown) || Math.abs(number - expected.fund_size) > 0.01) {
          fail(detailLabel, `Fondsgröße „${shown}“ statt ${expected.fund_size} Mio.`)
        }
      }
      if (!failures.some((failure) => failure.startsWith(detailLabel)))
        console.log(`OK  ${detailLabel}: ${shownKeys.join(', ')}`)
      if (imageDir && quote.symbol === demoQuotes[0].symbol) {
        await page.mouse.move(0, viewport.height - 1)
        await drill.scrollIntoViewIfNeeded()
        await page.waitForTimeout(800)
        await drill.screenshot({ path: resolve(imageDir, 'demo-details.png') })
      }
      await row.locator('td').first().click()
    } catch (error) {
      // Ein Ablauffehler ist ein Befund; die übrigen Positionen werden weiter geprüft.
      fail(detailLabel, `Ablauf abgebrochen: ${String(error.message).split('\n')[0]}`)
      await page.goto(`${origin}/#/`)
      await page.locator('td .badge__pill').first().waitFor({ timeout: 30000 })
    }
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
