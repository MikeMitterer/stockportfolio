// Nimmt die Bilder für README, Docker Hub und Unraid gleichbleibend auf.
//
// Voraussetzung ist der lokale Teststack mit synthetischen Konten:
//   ./scripts/stockinfo-test-server.sh --stack --run --demo-accounts --stockinfo-root ../StockInfo
//   npm --prefix frontend run screenshots -- <data_dir>/demo-accounts.json
//
// Englische Oberfläche, Theme MangoLila, Bildgröße 1440 × 1000; die
// aufgeklappte Position wird als Ausschnitt aufgenommen. Das Depot ist
// das eingebaute Beispiel-Depot; echte Daten kommen nie auf ein Bild. Der
// Browser läuft sichtbar, damit der Ablauf nachvollziehbar bleibt.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const origin = 'http://127.0.0.1:5175'
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const viewport = { width: 1440, height: 1000 }
const scriptDir = dirname(fileURLToPath(import.meta.url))
const outputDir = resolve(process.argv[3] ?? resolve(scriptDir, '../../docs/images'))
const credentialsPath = process.argv[2]
if (!credentialsPath) {
  console.error('Aufruf: npm --prefix frontend run screenshots -- <data_dir>/demo-accounts.json [Zielordner]')
  process.exit(2)
}
const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'))

const browser = await chromium.launch({ executablePath: chromePath, headless: false, args: ['--no-first-run'] })
const context = await browser.newContext({ viewport, locale: 'en-US', colorScheme: 'dark' })
await context.addInitScript(() => {
  localStorage.setItem('stockportfolio.locale', 'en')
  localStorage.setItem('stockportfolio.theme', 'mangolila')
})
const page = await context.newPage()
const session = await context.newCDPSession(page)
const { windowId } = await session.send('Browser.getWindowForTarget')
await session.send('Browser.setWindowBounds', { windowId, bounds: { left: 80, top: 0 } })

/** Bild ohne Mauszeiger-Hover und ohne laufende Animation aufnehmen. */
async function capture(name) {
  await page.mouse.move(0, viewport.height - 1)
  await page.waitForTimeout(800)
  const path = resolve(outputDir, name)
  await page.screenshot({ path })
  console.log(`Aufgenommen: ${path}`)
}

/** Wartet, bis keine Kurse mehr laden und die Verlaufsgrafiken stehen. */
async function settle() {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
}

try {
  // 1 · Login-Dialog mit Hinweis und Pflicht-Checkbox, leer.
  await page.goto(origin)
  await page.locator('form [role="checkbox"]').waitFor({ timeout: 20000 })
  await capture('login.png')

  // Anmelden als synthetischer Admin; ein erzwungener Passwortwechsel wird erledigt.
  await page.locator('input[type="text"]').first().fill(credentials.admin.username)
  await page.locator('input[type="password"]').first().fill(credentials.admin.password)
  await page.locator('form [role="checkbox"]').click()
  await page.locator('form').first().evaluate((form) => form.requestSubmit())
  await page.waitForFunction(() => document.querySelector('.dashboard__kpis, .dashboard__empty') ||
    document.body.textContent?.includes('Save password'), undefined, { timeout: 20000 })
  const changeButton = page.getByRole('button', { name: 'Save password' })
  if (await changeButton.isVisible()) {
    const nextPassword = `${credentials.admin.password}2`
    await page.locator('input[type="password"]').first().fill(nextPassword)
    await changeButton.click()
    credentials.admin.password = nextPassword
    writeFileSync(credentialsPath, JSON.stringify(credentials))
  }
  await page.locator('.dashboard__kpis, .dashboard__empty').first().waitFor({ timeout: 20000 })

  // 2 · Dashboard mit dem Beispiel-Depot.
  const demo = page.getByRole('button', { name: 'Load sample portfolio' })
  if (await demo.isVisible()) await demo.click()
  await page.locator('td .badge__pill').first().waitFor({ timeout: 30000 })
  await settle()
  await capture('dashboard.png')

  // 3 · Aufgeklappte Position mit Details und Kursverlauf.
  const firstRow = page.locator('.n-data-table-tr').filter({ hasText: 'VGWL.DE' }).first()
  await firstRow.locator('td').first().click()
  const drill = page.locator('.drill').first()
  await drill.waitFor({ timeout: 20000 })
  await settle()
  await page.mouse.move(0, viewport.height - 1)
  await drill.scrollIntoViewIfNeeded()
  await drill.screenshot({ path: resolve(outputDir, 'drilldown.png') })
  console.log(`Aufgenommen: ${resolve(outputDir, 'drilldown.png')}`)
  await firstRow.locator('td').first().click()

  // 4 · Rebalancing.
  await page.getByRole('link', { name: 'Rebalancing' }).first().click()
  await page.locator('.reb__status-head').first().waitFor({ timeout: 20000 })
  await settle()
  // Eine kleine Simulation: zwei Vorschläge aus der Delta-Spalte übernehmen.
  for (const symbol of ['VGWL.DE', 'IUSN.DE']) {
    await page.locator('tr').filter({ hasText: symbol }).first().locator('.reb__delta').click()
  }
  await settle()
  await capture('rebalancing.png')

  // 5 · Einstellungen, Registerkarte Berechnung.
  await page.goto(`${origin}/#/settings?tab=calc`)
  await page.getByText('Tolerance bands', { exact: false }).first().waitFor({ timeout: 20000 })
  await settle()
  await capture('settings-calculation.png')

  // 6 · Benutzerverwaltung mit den beiden synthetischen Konten.
  await page.goto(`${origin}/#/admin/users`)
  await page.getByText(credentials.user.username).first().waitFor({ timeout: 20000 })
  await settle()
  await capture('user-admin.png')
} finally {
  await browser.close()
}
