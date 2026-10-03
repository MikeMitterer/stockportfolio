// Prüft sichtbar im Browser, dass StockPortfolio StockInfo über den eigenen
// Server abfragt, und dass jede dafür angelegte Server-Route im Browserlauf
// vorkommt (T-82).
//
// Vorbereitung (Normalfall): Das Skript spielt
// frontend/tests/fixtures/browser/stockinfo-routes.backup.json ein. Das Depot
// enthält Papiere mit ISIN, USD-Papiere (Devisenkurs) und NOSI.DE ohne ISIN
// (Abfragen über das Symbol). NOSI.DE gibt es nur im Teststack **ohne**
// `--demo-details`.
//
// Normalfall (StockInfo erreichbar):
//   1. Das Dashboard zeigt Kurse; jede Zeile hat eine Verlaufslinie
//      (Spalte „Verlauf 1M“).
//   2. Eine aufgeklappte Position zeigt den Kursverlauf als Grafik.
//   3. „Aktualisieren“ ruft für jede Marktposition StockInfo über den Server ab.
//   4. Assets-Übersicht und Einstellungen › Links laden Katalog, Felder und Typen.
//   5. Die Statusseite nennt die StockInfo-Adresse des Servers und meldet den
//      Dienst als erreichbar.
//   6. Routenabdeckung: `GET /api/stockinfo-target` und jedes Pfad-Muster der
//      Freigabeliste in api/src/stockinfo/proxy.ts kommen mit 200 vor. Die
//      Liste wird aus der Datei gelesen; eine neue Route ohne sichtbare
//      Prüfung fällt hier auf.
//   7. Ohne Sitzung antworten Weiterleitung und Zieladresse mit 401, ein Pfad
//      außerhalb der Freigabeliste mit 404.
// Fehlerfall (`--unreachable`, Server mit einer Adresse, die nicht auflöst):
//   1. Die StockInfo-Anfragen enden mit 502 `stockinfo_unreachable`.
//   2. Der Dialog „Dienst nicht erreichbar“ nennt den Grund vom Server.
//   3. Die Statusseite nennt die Adresse, meldet „nicht erreichbar“ und den
//      übersetzten Grund.
// In beiden Fällen fragt der Browser nur StockPortfolio an, nie StockInfo
// direkt. Bei jeder Abweichung endet das Skript mit Exit-Code 1.
//
// Gegen den Teststack (Vite auf 127.0.0.1:5175):
//   .venv/bin/python scripts/stockinfo-test-server.py --stack --run --demo-accounts --stockinfo-root ../StockInfo
//   npm --prefix frontend run check:stockinfo-proxy -- <data_dir>/demo-accounts.json
// Gegen einen Container ruft `docker/browser-check.sh` das Skript mit
// STOCKPORTFOLIO_ORIGIN und STOCKINFO_URL auf, einmal davon mit `--unreachable`.
//
// Umgebung: STOCKPORTFOLIO_ORIGIN (Vorgabe http://127.0.0.1:5175),
// STOCKINFO_URL = Adresse, die der Server nutzt (Vorgabe http://127.0.0.1:8899).
// Die Konten-Datei hat die Form von demo-accounts.json; verwendet wird `admin`.
// Deutsche Oberfläche; der Browser läuft sichtbar auf dem Hauptmonitor, links
// bleiben 100 px frei.
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const origin = process.env.STOCKPORTFOLIO_ORIGIN ?? 'http://127.0.0.1:5175'
const stockInfoUrl = process.env.STOCKINFO_URL ?? 'http://127.0.0.1:8899'
const chromePath =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const viewport = { width: 1440, height: 1000 }
const scriptDir = dirname(fileURLToPath(import.meta.url))
const backupPath = resolve(scriptDir, '../tests/fixtures/browser/stockinfo-routes.backup.json')
const proxySource = resolve(scriptDir, '../../api/src/stockinfo/proxy.ts')
const expectUnreachable = process.argv.includes('--unreachable')
const credentialsPath = process.argv.slice(2).find((argument) => !argument.startsWith('--'))
if (!credentialsPath) {
  console.error(
    'Aufruf: npm --prefix frontend run check:stockinfo-proxy -- <data_dir>/demo-accounts.json [--unreachable]',
  )
  process.exit(2)
}
const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'))
const proxyPrefix = `${origin}/api/stockinfo/`
const targetUrl = `${origin}/api/stockinfo-target`

/**
 * Pfad-Muster der Freigabeliste je Methode, gelesen aus proxy.ts. Jede Zeile
 * im Block `GET: [` beziehungsweise `POST: [` ist ein Regex-Literal.
 */
function allowedRoutes() {
  const source = readFileSync(proxySource, 'utf8')
  const routes = []
  for (const method of ['GET', 'POST']) {
    // Der Block endet an der Zeile mit der schließenden Klammer; `]` kommt auch
    // in den Mustern selbst vor.
    const block = source.match(new RegExp(`${method}: \\[\\n([\\s\\S]*?)\\n\\s*\\],`))?.[1] ?? ''
    for (const line of block.split('\n')) {
      const literal = line.trim().match(/^\/(.+)\/,?$/)?.[1]
      if (literal) routes.push({ method, pattern: new RegExp(literal) })
    }
  }
  if (routes.length === 0) throw new Error(`keine Freigabeliste in ${proxySource}`)
  return routes
}

const failures = []
function fail(label, message) {
  failures.push(`${label}: ${message}`)
}
function passed(label) {
  return !failures.some((failure) => failure.startsWith(`${label}:`))
}
/** Führt einen Prüfschritt aus; ein Ablauffehler ist ein Befund, kein Abbruch. */
async function check(label, run) {
  try {
    const summary = await run()
    if (passed(label)) console.log(`OK  ${label}: ${summary}`)
  } catch (error) {
    fail(label, `Ablauf abgebrochen: ${String(error.message).split('\n')[0]}`)
  }
}

/** Anfragen an andere Herkünfte als StockPortfolio. */
const foreignRequests = new Set()
/** Antworten der Weiterleitung: Methode, Pfad ohne Präfix und Abfrage, Status. */
const proxyResponses = []
/** Statuscodes von `GET /api/stockinfo-target`. */
const targetStatuses = []

let page
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: false,
  args: ['--no-first-run'],
})
try {
  const context = await browser.newContext({ viewport, locale: 'de-AT' })
  await context.addInitScript(() => localStorage.setItem('stockportfolio.locale', 'de'))
  page = await context.newPage()
  page.on('request', (request) => {
    const url = new URL(request.url())
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== origin) {
      foreignRequests.add(`${request.method()} ${url.origin}${url.pathname}`)
    }
  })
  page.on('response', (response) => {
    if (response.url() === targetUrl) targetStatuses.push(response.status())
    if (!response.url().startsWith(proxyPrefix)) return
    proxyResponses.push({
      method: response.request().method(),
      path: response.url().slice(proxyPrefix.length - 1).split('?')[0],
      status: response.status(),
      response,
    })
  })
  const session = await context.newCDPSession(page)
  const { windowId } = await session.send('Browser.getWindowForTarget')
  await session.send('Browser.setWindowBounds', { windowId, bounds: { left: 100, top: 0 } })

  // Anmelden; ein erzwungener Passwortwechsel wird erledigt.
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

  if (!expectUnreachable) {
    // Routen-Testdepot einspielen; das braucht StockInfo nicht.
    await page.goto(`${origin}/#/settings?tab=backup`)
    await page.locator('.backup input[type="file"]').setInputFiles(backupPath)
    await page.getByRole('button', { name: 'Jetzt ersetzen' }).click()
    await Promise.all([
      page.waitForEvent('framenavigated', { timeout: 30000 }),
      page.locator('.n-popconfirm__action button').last().click(),
    ])
    // Erst wenn die neu geladene App das eingespielte Depot nennt, ist das
    // Neuladen durch; ein früherer Seitenwechsel ginge darin unter.
    await page.waitForLoadState('load')
    await page.getByText('Routen-Testdepot').first().waitFor({ timeout: 20000 })
    await page.goto(`${origin}/#/`)
    await page.locator('.dashboard__kpis').waitFor({ timeout: 20000 })

    // 1 · Kurse und Verlaufslinien in der Tabelle.
    await check('Verlauf in der Tabelle', async () => {
      await page.locator('td .badge__pill').first().waitFor({ timeout: 30000 })
      await page.waitForLoadState('networkidle')
      const rows = page.locator('.n-data-table-tr').filter({ has: page.locator('.spark') })
      const count = await rows.count()
      if (count === 0) fail('Verlauf in der Tabelle', 'keine Zeile mit Verlaufsspalte')
      const drawn = await rows.locator('.spark .spark__chart').count()
      if (drawn !== count) fail('Verlauf in der Tabelle', `${drawn} von ${count} Linien gezeichnet`)
      return `${drawn} von ${count} Linien gezeichnet`
    })

    // 2 · Kursverlauf einer aufgeklappten Position.
    await check('Kursverlauf der Position', async () => {
      const row = page.locator('.n-data-table-tr').filter({ has: page.locator('.spark') }).first()
      // Die erste Zelle trägt nur den Aufklapp-Pfeil; das Symbol steht in der Zeile.
      const symbol = (await row.innerText())
        .split('\n')
        .map((line) => line.trim())
        .find(Boolean)
      await row.locator('td').first().click()
      const drill = page.locator('.drill').first()
      await drill.waitFor({ timeout: 20000 })
      const chart = drill.locator('.chart__svg')
      await chart.waitFor({ timeout: 20000 })
      const label = await chart.getAttribute('aria-label')
      if (await drill.locator('.chart__empty').count()) {
        fail('Kursverlauf der Position', 'Hinweis „kein Verlauf“ statt Grafik')
      }
      await row.locator('td').first().click()
      return `${symbol}: ${label}`
    })

    // 3 · „Aktualisieren“ läuft über die Weiterleitung.
    await check('Aktualisieren', async () => {
      const before = proxyResponses.length
      const announced = page.waitForResponse(
        (response) =>
          response.url().endsWith('/api/data/quote-refresh/current') &&
          response.request().method() === 'PUT',
        { timeout: 30000 },
      )
      await page.getByRole('button', { name: 'Aktualisieren' }).first().click()
      await announced
      await page.waitForLoadState('networkidle')
      const refreshes = proxyResponses
        .slice(before)
        .filter((entry) => entry.method === 'POST' && entry.path.startsWith('/refresh/'))
      if (refreshes.length === 0) fail('Aktualisieren', 'keine Abfrage POST /refresh/…')
      const failed = refreshes.filter((entry) => entry.status !== 200)
      if (failed.length) {
        fail('Aktualisieren', failed.map((entry) => `${entry.path} → ${entry.status}`).join(', '))
      }
      return `${refreshes.length} Kursabrufe mit 200`
    })

    // 4 · Katalog, Felder und Typen.
    await check('Assets und Einstellungen', async () => {
      await page.goto(`${origin}/#/assets`)
      await page.locator('.instruments .cell-name').first().waitFor({ timeout: 20000 })
      await page.waitForLoadState('networkidle')
      // Die Typen lädt nur der Reiter „Links“.
      await page.goto(`${origin}/#/settings?tab=links`)
      await page.getByRole('button', { name: 'Typen neu laden' }).first().waitFor({ timeout: 20000 })
      await page.waitForLoadState('networkidle')
      return 'Assets-Übersicht und Einstellungen › Links geladen'
    })
  } else {
    // 1 · Die Weiterleitung meldet StockInfo als nicht erreichbar.
    await check('Antworten der Weiterleitung', async () => {
      await page.waitForLoadState('networkidle')
      if (proxyResponses.length === 0) fail('Antworten der Weiterleitung', 'keine Abfrage')
      const unexpected = proxyResponses.filter((entry) => entry.status !== 502)
      if (unexpected.length) {
        fail(
          'Antworten der Weiterleitung',
          unexpected.map((entry) => `${entry.method} ${entry.path} → ${entry.status}`).join(', '),
        )
      }
      const codes = new Set()
      for (const entry of proxyResponses.filter((item) => item.status === 502)) {
        codes.add((await entry.response.json().catch(() => ({}))).error ?? 'ohne Code')
      }
      if ([...codes].join() !== 'stockinfo_unreachable') {
        fail('Antworten der Weiterleitung', `Codes ${[...codes].join(', ')}`)
      }
      return `${proxyResponses.length} × 502 stockinfo_unreachable`
    })

    // 2 · Der Dialog „Dienst nicht erreichbar“ erscheint einmal je Sitzung
    // und nennt den Grund vom Server; danach wird er geschlossen.
    await check('Hinweis im Dashboard', async () => {
      const dialog = page.locator('.apialert').first()
      await dialog.waitFor({ timeout: 20000 })
      const reason = (await dialog.locator('.apialert__reason').innerText()).trim()
      if (!reason.includes('vom StockPortfolio-Server aus nicht erreichbar')) {
        fail('Hinweis im Dashboard', `Grund „${reason}“ nennt nicht die Weiterleitung`)
      }
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'hidden', timeout: 5000 })
      return `Dialog „Dienst nicht erreichbar“: ${reason}`
    })
  }

  // 5 · Statusseite: Adresse des Servers und Zustand.
  await check('Statusseite', async () => {
    const expectedState = expectUnreachable ? 'nicht erreichbar' : 'erreichbar'
    await page.goto(`${origin}/#/status`)
    const address = page.locator('.status-page__address')
    await address.waitFor({ timeout: 20000 })
    await page
      .waitForFunction(
        (expected) =>
          document.querySelector('.status-page__state-label')?.textContent?.trim() === expected,
        expectedState,
        { timeout: 20000 },
      )
      .catch(() => undefined)
    const shown = (await address.innerText()).trim()
    if (shown !== stockInfoUrl) fail('Statusseite', `Adresse „${shown}“ statt „${stockInfoUrl}“`)
    const state = (await page.locator('.status-page__state-label').first().innerText()).trim()
    if (state !== expectedState) fail('Statusseite', `Zustand „${state}“ statt „${expectedState}“`)
    let reason = ''
    if (expectUnreachable) {
      reason = (await page.locator('.status-page__error').first().innerText({ timeout: 5000 })).trim()
      if (!reason.includes('vom StockPortfolio-Server aus nicht erreichbar')) {
        fail('Statusseite', `Grund „${reason}“ nennt nicht die Weiterleitung`)
      }
    }
    return `${shown}, ${state}${reason ? ` — ${reason}` : ''}`
  })

  if (!expectUnreachable) {
    // 6 · Jede Route der Weiterleitung kam im Lauf mit 200 vor.
    await check('Routenabdeckung', async () => {
      const covered = []
      if (!targetStatuses.includes(200)) {
        fail('Routenabdeckung', `GET /api/stockinfo-target ohne 200 (${targetStatuses.join(', ') || 'nie'})`)
      } else {
        covered.push('GET /api/stockinfo-target')
      }
      for (const route of allowedRoutes()) {
        const hits = proxyResponses.filter(
          (entry) => entry.method === route.method && route.pattern.test(entry.path),
        )
        const name = `${route.method} ${route.pattern.source}`
        if (!hits.some((entry) => entry.status === 200)) {
          const seen = hits.map((entry) => entry.status).join(', ') || 'nie aufgerufen'
          fail('Routenabdeckung', `${name}: ${seen}`)
        } else {
          covered.push(`${route.method} ${hits.find((entry) => entry.status === 200).path}`)
        }
      }
      return `${covered.length} Routen mit 200:\n      ${covered.join('\n      ')}`
    })

    // 7 · Abweisungen: ohne Sitzung 401, außerhalb der Freigabeliste 404.
    await check('Abweisungen', async () => {
      const outside = await page.evaluate(async () => {
        const result = {}
        for (const path of ['/api/stockinfo/quote/IE00B4L5Y983/history', '/api/stockinfo/docs']) {
          result[path] = (await fetch(path)).status
        }
        return result
      })
      for (const [path, status] of Object.entries(outside)) {
        if (status !== 404) fail('Abweisungen', `${path} → ${status} statt 404`)
      }
      const anonymous = await browser.newContext()
      const statuses = {}
      for (const path of ['/api/stockinfo/health', '/api/stockinfo-target']) {
        statuses[path] = (await anonymous.request.get(`${origin}${path}`)).status()
        if (statuses[path] !== 401) fail('Abweisungen', `${path} ohne Sitzung → ${statuses[path]} statt 401`)
      }
      await anonymous.close()
      return [
        ...Object.entries(outside).map(([path, status]) => `${path} → ${status}`),
        ...Object.entries(statuses).map(([path, status]) => `${path} ohne Sitzung → ${status}`),
      ].join(', ')
    })
  }
} catch (error) {
  fail('Ablauf', String(error.message).split('\n')[0])
  const path = join(tmpdir(), `stockinfo-proxy-check${expectUnreachable ? '-unreachable' : ''}.png`)
  if (page && (await page.screenshot({ path }).then(() => true, () => false))) {
    console.error(`Bildschirmfoto: ${path}`)
  }
  console.error(error.stack?.split('\n').slice(0, 4).join('\n'))
} finally {
  await browser.close()
}

// Nur Anfragen an StockPortfolio — auch nach einem Abbruch ausgewertet.
const requestLabel = 'Anfragen des Browsers'
for (const entry of foreignRequests) fail(requestLabel, `nicht an StockPortfolio: ${entry}`)
if (passed(requestLabel)) console.log(`OK  ${requestLabel}: nur ${origin}`)

if (failures.length > 0) {
  for (const failure of failures) console.error(`FEHLER  ${failure}`)
  process.exit(1)
}
console.log(
  expectUnreachable
    ? 'StockInfo-Ausfall wird über den Server gemeldet.'
    : 'StockInfo läuft über den eigenen Server; alle Routen geprüft.',
)
