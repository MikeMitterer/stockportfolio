// Prüft das Info-Fenster am Einrichtungscode im Dialog für das erste
// Admin-Konto (T-91), in DE und EN.
//
// Der Hinweis erklärt, wo der Code steht: im Container-Log, unter Unraid über
// den Docker-Reiter, sonst mit docker logs. Entwicklungsbefehle wie
// make dev-up gehören nicht hinein; sie stehen im README. Das Skript öffnet
// den Hinweis wie ein Nutzer per Mauszeiger, liest den sichtbaren Text und
// endet bei jeder Abweichung mit Exit-Code 1. Es legt kein Konto an.
//
// Voraussetzung ist der Teststack ohne synthetische Konten, damit der
// Einrichtungsdialog erscheint:
//   .venv/bin/python scripts/stockinfo-test-server.py --stack --run --stockinfo-root ../StockInfo
//   npm --prefix frontend run check:setup-dialog
//
// Der Browser läuft sichtbar auf dem Hauptmonitor; links bleiben 100 px frei.
import { chromium } from 'playwright-core'

const origin = 'http://127.0.0.1:5175'
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const viewport = { width: 1280, height: 900 }
const dockSpace = 100

/** Erwartete und ausgeschlossene Wortlaute im Hinweis am Einrichtungscode. */
const expectations = {
  de: {
    title: 'Erstes Admin-Konto einrichten',
    required: [
      'im Log von StockPortfolio in der Zeile „StockPortfolio setup code: …“',
      'Unter Unraid: Reiter „Docker“, auf das StockPortfolio-Symbol klicken, „Logs“ wählen.',
      'docker logs stockportfolio',
      'bei jedem Neustart ein neuer Code',
    ],
  },
  en: {
    title: 'Set up the first admin account',
    required: [
      'in the StockPortfolio log, on the line “StockPortfolio setup code: …”',
      'On Unraid: open the “Docker” tab, click the StockPortfolio icon, choose “Logs”.',
      'docker logs stockportfolio',
      'every restart creates a new code',
    ],
  },
}
const forbidden = ['make dev-up', 'overmind', 'Ctrl-B']

const failures = []

function fail(label, message) {
  failures.push(`${label}: ${message}`)
}

function verifyText(label, text, required) {
  const before = failures.length
  for (const phrase of required) {
    if (!text.includes(phrase)) fail(label, `erwarteter Text fehlt: „${phrase}“`)
  }
  for (const phrase of forbidden) {
    if (text.includes(phrase)) fail(label, `ausgeschlossener Text gefunden: „${phrase}“`)
  }
  if (failures.length === before) console.log(`OK  ${label}`)
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: false,
  args: ['--no-first-run', `--window-position=${dockSpace},0`, `--window-size=${viewport.width},${viewport.height + 100}`],
})
try {
  for (const [locale, expected] of Object.entries(expectations)) {
    const context = await browser.newContext({ viewport, locale: locale === 'de' ? 'de-AT' : 'en-US' })
    await context.addInitScript((value) => localStorage.setItem('stockportfolio.locale', value), locale)
    const page = await context.newPage()
    await page.goto(origin)
    try {
      await page.getByRole('heading', { name: expected.title }).waitFor({ timeout: 15000 })
    } catch {
      fail(`${locale} · Einrichtungsdialog`, 'nicht sichtbar; Teststack frisch und ohne --demo-accounts starten')
      await context.close()
      continue
    }

    // Den Hinweis wie ein Nutzer öffnen und den sichtbaren Text lesen.
    const trigger = page.locator('.auth-panel__field-label .ux-hint__trigger')
    await trigger.hover()
    const tooltip = page.locator('.ux-hint__body')
    await tooltip.waitFor({ state: 'visible', timeout: 5000 })
    verifyText(`${locale} · Hinweis Einrichtungscode`, await tooltip.innerText(), expected.required)
    await page.waitForTimeout(1500)
    await context.close()
  }
} finally {
  await browser.close()
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FEHLER  ${failure}`)
  process.exit(1)
}
console.log('Info-Fenster am Einrichtungscode geprüft.')
