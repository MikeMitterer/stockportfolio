// Prüft den Referenzindex im Gesamtwert-Diagramm sichtbar im Browser (T-143).
//
// Erwartet wird der Teststack mit synthetischen Konten, ohne --demo-details —
// der Lauf braucht die Randfälle des Testdienstes (Listing ohne ISIN,
// mehrdeutiges Symbol, USD-Listing):
//   1. Ein leeres Depot bekommt das Beispiel-Depot. Es enthält nur Papiere in
//      EUR, deshalb steht der Rückblick, an dem sich die Vergleichslinie
//      ausrichtet.
//   2. Einstellungen → Daten: Eine unbekannte ISIN (IE00BK5BQT80) und ein
//      mehrdeutiger Ticker (DUAL) werden mit Meldung abgewiesen; danach ist
//      weiterhin kein Referenzindex festgelegt.
//   3. VTI (USD) wird übernommen. Das Diagramm zeigt die Depotlinie und einen
//      Hinweis statt einer Vergleichslinie, ohne Legende — StockInfo liefert
//      keine historischen Wechselkurse.
//   4. NOSI (Ticker eines EUR-Listings ohne ISIN, nicht im Depot) wird
//      übernommen und steht nach einem Neuladen noch da.
//   5. Das Diagramm zeigt den Index als eigene Linie, in der Legende benannt.
//      In 1M, 3M und Max beginnt sie auf dem ersten Punkt der Depotlinie, an
//      der die Achse hängt: normiert auf den ersten gezeigten Tag, mit dem
//      Zeitraum wechselnd.
//   6. Nach „Entfernen“ zeigt das Diagramm weder Legende noch Vergleichslinie.
//   7. Der Browser fragt während des ganzen Laufs nur StockPortfolio an.
// Bei jeder Abweichung endet das Skript mit Exit-Code 1.
//
// Voraussetzung:
//   scripts/test-stack.py --stack --run --demo-accounts --stockinfo-root ../StockInfo
//   npm --prefix frontend run check:reference-index -- <data_dir>/demo-accounts.json [Bildordner]
//
// Ohne Bildordner entstehen keine Bilder. Deutsche Oberfläche; der Browser
// läuft sichtbar auf dem Hauptmonitor, links bleiben 100 px frei.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { testStackOrigin } from './teststack/address.mjs'

const origin = testStackOrigin
const chromePath =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const viewport = { width: 1440, height: 1000 }
const credentialsPath = process.argv[2]
const imageDir = process.argv[3] ? resolve(process.argv[3]) : undefined
if (!credentialsPath) {
  console.error(
    'Aufruf: npm --prefix frontend run check:reference-index -- <data_dir>/demo-accounts.json [Bildordner]',
  )
  process.exit(2)
}
const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'))

/** Name des EUR-Listings ohne ISIN im Testdienst. */
const indexName = 'T39 Listed ohne ISIN'

const failures = []
function fail(label, message) {
  failures.push(`${label}: ${message}`)
}
function passed(label) {
  return !failures.some((failure) => failure.startsWith(`${label}:`))
}

/** Erster Punkt eines SVG-Pfads `M x y L …` als Zahlenpaar. */
function firstPoint(path) {
  const match = /^M\s*(-?[\d.]+)\s+(-?[\d.]+)/.exec(path ?? '')
  return match ? [Number(match[1]), Number(match[2])] : null
}

/** Anfragen an andere Herkünfte als StockPortfolio (Schritt 7). */
const foreignRequests = new Set()

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: false,
  args: ['--no-first-run'],
})
try {
  const context = await browser.newContext({ viewport, locale: 'de-AT' })
  await context.addInitScript(() => localStorage.setItem('stockportfolio.locale', 'de'))
  const page = await context.newPage()
  page.on('request', (request) => {
    const url = new URL(request.url())
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== origin) {
      foreignRequests.add(`${request.method()} ${url.origin}${url.pathname}`)
    }
  })
  const session = await context.newCDPSession(page)
  const { windowId } = await session.send('Browser.getWindowForTarget')
  await session.send('Browser.setWindowBounds', { windowId, bounds: { left: 100, top: 0 } })

  const card = page.locator('.reference-index')

  /** Öffnet Einstellungen → Daten und wartet auf die Karte „Referenzindex“. */
  async function openSettings() {
    await page.goto(`${origin}/#/settings?tab=data`)
    await card.waitFor({ timeout: 20000 })
  }

  /** Gibt eine Eingabe ein, übernimmt sie und wartet, bis die Prüfung fertig ist. */
  async function submit(text) {
    await card.locator('input').fill(text)
    await card.getByRole('button', { name: 'Übernehmen' }).click()
    await page.waitForFunction(
      () => !document.querySelector('.reference-index button[type="submit"].n-button--loading'),
      undefined,
      { timeout: 20000 },
    )
    await page.waitForLoadState('networkidle')
  }

  /** Dashboard mit aufgeklapptem Wertverlauf; wartet auf den Rückblick. */
  async function openChart() {
    await page.goto(`${origin}/#/`)
    await page.locator('.dashboard__kpis').waitFor({ timeout: 30000 })
    await page.locator('.kpi--expandable').first().click()
    await page.locator('.value-chart__line--backtest').waitFor({ timeout: 30000 })
    await page.waitForLoadState('networkidle')
  }

  /** Wählt einen Zeitraum über der Linie. */
  async function choosePeriod(label) {
    await page
      .locator('.value-chart__head')
      .getByRole('button', { name: label, exact: true })
      .click()
    await page.waitForTimeout(200)
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

  // 1 · Beispiel-Depot, falls das Konto noch keines hat.
  const demoLabel = 'Beispiel-Depot'
  if (await page.locator('.dashboard__empty').isVisible()) {
    await page.getByRole('button', { name: 'Beispiel-Depot laden' }).click()
    await page.locator('.dashboard__kpis').waitFor({ timeout: 30000 })
    console.log(`OK  ${demoLabel}: geladen`)
  } else {
    console.log(`OK  ${demoLabel}: Depot vorhanden`)
  }

  // Ein Referenzindex aus einem früheren Lauf wird zuerst entfernt.
  await openSettings()
  const removeButton = card.getByRole('button', { name: 'Entfernen' })
  if (await removeButton.isVisible()) await removeButton.click()

  // 2 · Unbekannte und mehrdeutige Eingaben werden abgewiesen, nichts gespeichert.
  const rejectLabel = 'Abweisung'
  try {
    for (const [input, expected] of [
      ['IE00BK5BQT80', 'ist in StockInfo nicht bekannt'],
      ['DUAL', 'passt zu mehreren Listings'],
    ]) {
      await submit(input)
      const message = (await card.locator('.reference-index__error').innerText()).trim()
      if (!message.includes(expected)) fail(rejectLabel, `${input}: Meldung „${message}“`)
      const state = (await card.innerText()).trim()
      if (!state.includes('Kein Referenzindex festgelegt.'))
        fail(rejectLabel, `${input}: trotzdem gespeichert`)
    }
    if (passed(rejectLabel))
      console.log(`OK  ${rejectLabel}: unbekannte ISIN und mehrdeutiger Ticker`)
  } catch (error) {
    fail(rejectLabel, `Ablauf abgebrochen: ${String(error.message).split('\n')[0]}`)
  }

  // 3 · USD-Index: Hinweis statt Vergleichslinie.
  const currencyLabel = 'Fremdwährung'
  try {
    await openSettings()
    await submit('VTI')
    const current = (await card.locator('.reference-index__current').innerText()).trim()
    if (!current.includes('USD')) fail(currencyLabel, `übernommen als „${current}“`)
    await openChart()
    const note = (await page.locator('.value-chart__note').innerText()).trim()
    if (!note.includes('notiert in USD')) fail(currencyLabel, `Hinweis „${note}“`)
    if (await page.locator('.value-chart__line--reference').count())
      fail(currencyLabel, 'Vergleichslinie trotz anderer Währung')
    if (await page.locator('.value-chart__legend').count())
      fail(currencyLabel, 'Legende ohne Vergleichslinie')
    if (!(await page.locator('.value-chart__line--backtest').count()))
      fail(currencyLabel, 'Depotlinie fehlt')
    if (passed(currencyLabel)) console.log(`OK  ${currencyLabel}: ${note}`)
    if (imageDir)
      await page
        .locator('.dashboard__value')
        .screenshot({ path: resolve(imageDir, 'reference-index-currency.png') })
  } catch (error) {
    fail(currencyLabel, `Ablauf abgebrochen: ${String(error.message).split('\n')[0]}`)
  }

  // 4 · Ticker eines Papiers außerhalb des Depots; bleibt nach dem Neuladen.
  const storeLabel = 'Festlegen'
  try {
    await openSettings()
    await submit('NOSI')
    await page.reload()
    await card.waitFor({ timeout: 20000 })
    const current = (await card.locator('.reference-index__current').innerText()).trim()
    if (current !== `${indexName} (NOSI.DE, EUR)`) fail(storeLabel, `nach Neuladen „${current}“`)
    if (passed(storeLabel)) console.log(`OK  ${storeLabel}: ${current}, auch nach Neuladen`)
  } catch (error) {
    fail(storeLabel, `Ablauf abgebrochen: ${String(error.message).split('\n')[0]}`)
  }

  // 5 · Vergleichslinie: benannt, normiert, mit dem Zeitraum wechselnd.
  const lineLabel = 'Vergleichslinie'
  try {
    await openChart()
    await page.locator('.value-chart__line--reference').waitFor({ timeout: 20000 })
    const legend = (await page.locator('.value-chart__legend').innerText()).trim()
    if (!legend.includes(`${indexName} (normiert)`)) fail(lineLabel, `Legende „${legend}“`)
    const starts = []
    for (const period of ['1M', '3M', 'Max']) {
      await choosePeriod(period)
      const depot = firstPoint(await page.locator('.value-chart__line--backtest').getAttribute('d'))
      const index = firstPoint(
        await page.locator('.value-chart__line--reference').getAttribute('d'),
      )
      if (!depot || !index) {
        fail(lineLabel, `${period}: Linie fehlt`)
        continue
      }
      if (Math.abs(depot[0] - index[0]) > 0.6 || Math.abs(depot[1] - index[1]) > 0.6)
        fail(lineLabel, `${period}: Index beginnt bei ${index} statt ${depot}`)
      starts.push(`${period} ${index.map((value) => value.toFixed(1)).join('/')}`)
    }
    if (passed(lineLabel))
      console.log(`OK  ${lineLabel}: beginnt auf der Depotlinie (${starts.join(', ')})`)
    if (imageDir)
      await page
        .locator('.dashboard__value')
        .screenshot({ path: resolve(imageDir, 'reference-index.png') })
  } catch (error) {
    fail(lineLabel, `Ablauf abgebrochen: ${String(error.message).split('\n')[0]}`)
  }

  // 6 · Entfernen: Diagramm wie ohne Referenzindex.
  const removeLabel = 'Entfernen'
  try {
    await openSettings()
    await card.getByRole('button', { name: 'Entfernen' }).click()
    await card.getByText('Kein Referenzindex festgelegt.').waitFor({ timeout: 20000 })
    await openChart()
    if (await page.locator('.value-chart__legend').count()) fail(removeLabel, 'Legende noch da')
    if (await page.locator('.value-chart__line--reference').count())
      fail(removeLabel, 'Vergleichslinie noch da')
    if (passed(removeLabel)) console.log(`OK  ${removeLabel}: Diagramm wie ohne Referenzindex`)
  } catch (error) {
    fail(removeLabel, `Ablauf abgebrochen: ${String(error.message).split('\n')[0]}`)
  }
} catch (error) {
  fail('Ablauf', String(error.message).split('\n')[0])
} finally {
  await browser.close()
}

// 7 · Nur Anfragen an StockPortfolio.
const requestLabel = 'Anfragen des Browsers'
for (const entry of foreignRequests) fail(requestLabel, `nicht an StockPortfolio: ${entry}`)
if (passed(requestLabel)) console.log(`OK  ${requestLabel}: nur ${origin}`)

if (failures.length > 0) {
  for (const failure of failures) console.error(`FEHLER  ${failure}`)
  process.exit(1)
}
console.log('Referenzindex wie erwartet.')
