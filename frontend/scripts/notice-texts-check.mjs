// Prüft sichtbare Hinweistexte auf Methodenseite und Rebalancing in DE und EN.
//
// Die App rechnet aus, was zu den selbst gesetzten Zielen führt; Hinweise
// sprechen deshalb von Lage zum Ziel und von rechnerischen Beträgen, nicht
// von „günstig“ oder von Vorschlägen. Das Skript liest die Texte aus der
// laufenden Oberfläche, vergleicht sie mit den erwarteten Sätzen und endet
// bei jeder Abweichung mit Exit-Code 1.
//
// Voraussetzung ist der lokale Teststack mit synthetischen Konten:
//   .venv/bin/python scripts/stockinfo-test-server.py --stack --run --demo-accounts --stockinfo-root ../StockInfo
//   npm --prefix frontend run check:notice-texts -- <data_dir>/demo-accounts.json [Bildordner]
//
// Ohne Bildordner entstehen keine Bilder. Der Browser läuft sichtbar auf dem
// Hauptmonitor; links bleiben 100 px frei.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const origin = 'http://127.0.0.1:5175'
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const viewport = { width: 1440, height: 1000 }
const credentialsPath = process.argv[2]
const imageDir = process.argv[3] ? resolve(process.argv[3]) : undefined
if (!credentialsPath) {
  console.error('Aufruf: npm --prefix frontend run check:notice-texts -- <data_dir>/demo-accounts.json [Bildordner]')
  process.exit(2)
}
const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'))

/**
 * Erwartete und ausgeschlossene Wortlaute je Sprache.
 *
 * `required` muss vorkommen, `forbidden` darf nirgends auf der Seite stehen.
 */
const expectations = {
  de: {
    saveLabel: 'Passwort speichern',
    method: {
      required: ['Ein gefallener Anteil liegt unter deinem Ziel, ein gestiegener darüber.'],
      forbidden: ['günstig', 'Vorschlag', 'vorschläge', 'Empfehlung'],
    },
    coverHint: {
      required: ['nennt der Plan die Stückzahl'],
      forbidden: ['Vorschlag'],
    },
  },
  en: {
    saveLabel: 'Save password',
    method: {
      required: ['a share that has fallen is below your target, one that has risen is above it.'],
      forbidden: ['cheap', 'suggestion', 'recommend'],
    },
    coverHint: {
      required: ['the plan gives the units'],
      forbidden: ['suggestion'],
    },
  },
}

const failures = []

/** Vergleicht einen gelesenen Text mit den Erwartungen und sammelt Abweichungen. */
function verify(label, text, { required, forbidden }) {
  for (const phrase of required) {
    if (!text.includes(phrase)) failures.push(`${label}: erwarteter Text fehlt: „${phrase}“`)
  }
  for (const phrase of forbidden) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) failures.push(`${label}: ausgeschlossener Text gefunden: „${phrase}“`)
  }
  if (!failures.some((failure) => failure.startsWith(`${label}:`))) console.log(`OK  ${label}`)
}

const browser = await chromium.launch({ executablePath: chromePath, headless: false, args: ['--no-first-run'] })
try {
  for (const [locale, expected] of Object.entries(expectations)) {
    const context = await browser.newContext({ viewport, locale: locale === 'de' ? 'de-AT' : 'en-US' })
    await context.addInitScript((value) => localStorage.setItem('stockportfolio.locale', value), locale)
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
    await page.locator('form').first().evaluate((form) => form.requestSubmit())
    await page.waitForFunction((label) => document.querySelector('.dashboard__kpis, .dashboard__empty') ||
      document.body.textContent?.includes(label), expected.saveLabel, { timeout: 20000 })
    const changeButton = page.getByRole('button', { name: expected.saveLabel })
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

    // Methodenseite: ganzer Fließtext.
    await page.goto(`${origin}/#/method`)
    await page.locator('.method').waitFor({ timeout: 20000 })
    verify(`${locale} · Methodenseite`, await page.locator('.method').innerText(), expected.method)
    if (imageDir) await page.screenshot({ path: resolve(imageDir, `notice-method-${locale}.png`), fullPage: true })

    // Rebalancing: Erklärung zu „Deckung aus“, aufgeklappt.
    await page.goto(`${origin}/#/rebalancing`)
    const trigger = page.locator('.reb__figure--cover .ux-hint__trigger').first()
    await trigger.waitFor({ timeout: 20000 })
    verify(`${locale} · Rebalancing-Hinweis`, (await trigger.getAttribute('aria-label')) ?? '', expected.coverHint)
    await trigger.hover()
    await page.locator('.ux-hint__body').first().waitFor({ timeout: 5000 })
    if (imageDir) await page.screenshot({ path: resolve(imageDir, `notice-rebalancing-${locale}.png`) })

    await context.close()
  }
} finally {
  await browser.close()
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FEHLER  ${failure}`)
  process.exit(1)
}
console.log('Alle Hinweistexte wie erwartet.')
