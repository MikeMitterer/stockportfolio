// Prüft sichtbare Hinweistexte auf Methodenseite und Rebalancing in DE und EN,
// dazu die Handelstabelle: gekürzter Kopf „± Stück“, Bandkurse unter dem Kurs
// ohne Umbruch, ihr Hinweis im Spaltenkopf (Text, fokussierbar, auch schmal
// erreichbar) und die Tabelle ohne waagrechtes Scrollen (T-108).
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
// Schmalste unterstützte Breite für das Bild der Handelstabelle.
const narrowViewport = { width: 360, height: 800 }
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
      required: [
        'Die beiden Bänder sind getrennt einstellbar, weil die beiden Richtungen Verschiedenes auslösen.',
        'Liegt ein Anteil unter deinem Ziel, wäre rechnerisch ein Kauf nötig; liegt er darüber, ein Verkauf,',
      ],
      forbidden: ['günstig', 'Vorschlag', 'vorschläge', 'Empfehlung', 'aus gutem Grund'],
    },
    coverHint: {
      required: ['nennt der Plan die Stückzahl'],
      forbidden: ['Vorschlag'],
    },
    tradeHeader: '± Stück',
    bandPrices: {
      required: ['Bandkurse', 'alle anderen Kurse gleich bleiben'],
      forbidden: ['Zielkurs', 'Kursziel', 'Empfehlung', 'günstig', 'Vorschlag'],
    },
  },
  en: {
    saveLabel: 'Save password',
    method: {
      required: [
        'The two bands are set separately because the two directions lead to different steps.',
        'A share below your target would, by the numbers, call for a purchase; one above it for a sale,',
      ],
      forbidden: ['cheap', 'suggestion', 'recommend', 'for good reason'],
    },
    coverHint: {
      required: ['the plan gives the units'],
      forbidden: ['suggestion'],
    },
    tradeHeader: '± Units',
    bandPrices: {
      required: ['Band prices', 'all other prices stay the same'],
      forbidden: ['target price', 'price target', 'recommend', 'cheap', 'suggestion'],
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

/**
 * Handelstabelle (T-108): Kopf der Stückzahl-Spalte, Bandkurse in der
 * Kurs-Zelle ohne Umbruch, ihr Hinweis im Kopf der Kurs-Spalte und kein
 * waagrechtes Scrollen bei Desktop-Breite. Mit Bildordner je ein Bild in Desktop- und schmalster Breite.
 */
async function checkTradeTable(page, locale, expected) {
  const label = `${locale} · Handelstabelle`
  // Der Kopf steht per CSS in Großbuchstaben; innerText liefert ihn so.
  const head = await page.locator('.reb__table thead').innerText()
  if (!head.toLowerCase().includes(expected.tradeHeader.toLowerCase())) failures.push(`${label}: Spaltenkopf „${expected.tradeHeader}“ fehlt`)

  const bands = page.locator('.reb__band-prices')
  await bands.first().waitFor({ timeout: 10000 })
  const texts = await bands.allInnerTexts()
  if (texts.length === 0 || !texts.every((text) => /↓\s*\S.*↑\s*\S/s.test(text))) {
    failures.push(`${label}: Bandkurse fehlen oder sind unvollständig: ${JSON.stringify(texts)}`)
  }
  const wrapped = await countWrapped(bands)
  if (wrapped > 0) failures.push(`${label}: ${wrapped} Bandkurs-Zeilen brechen um`)
  const overflow = await page.locator('.reb__workspace').evaluate((element) => element.scrollWidth - element.clientWidth)
  if (overflow > 1) failures.push(`${label}: Tabelle scrollt waagrecht um ${overflow} px`)

  // Die Erklärung steht als bedienbarer Hinweis (UxInfoHint) im Kopf der Kurs-Spalte:
  // Text im aria-label, der Auslöser ist per Tastatur fokussierbar.
  const hint = page
    .locator(`.reb__table thead .ux-hint__trigger[aria-label*="${expected.bandPrices.required[0]}"]`)
    .first()
  await hint.waitFor({ timeout: 5000 })
  verify(label, (await hint.getAttribute('aria-label')) ?? '', expected.bandPrices)
  await hint.focus()
  if (!(await hint.evaluate((element) => element === document.activeElement))) {
    failures.push(`${label}: Hinweis zu den Bandkursen ist nicht fokussierbar`)
  }
  await page.locator('body').click({ position: { x: 1, y: 1 } })

  if (imageDir) await page.locator('.reb__table').screenshot({ path: resolve(imageDir, `trade-table-${locale}.png`) })

  // Schmalste Breite: Die Tabelle scrollt dort in ihrem Bereich; die Kurs-Spalte
  // kommt ins Bild, und auch hier bricht kein Bandkurs um.
  await page.setViewportSize(narrowViewport)
  await hint.scrollIntoViewIfNeeded()
  if (!(await hint.isVisible())) failures.push(`${label}: Hinweis zu den Bandkursen in schmaler Breite nicht erreichbar`)
  await bands.first().scrollIntoViewIfNeeded()
  const wrappedNarrow = await countWrapped(bands)
  if (wrappedNarrow > 0) failures.push(`${label}: ${wrappedNarrow} Bandkurs-Zeilen brechen in schmaler Breite um`)
  if (imageDir) await page.screenshot({ path: resolve(imageDir, `trade-table-${locale}-narrow.png`) })
  await page.setViewportSize(viewport)
}

/** Zählt Bandkurs-Zeilen, deren untere und obere Grenze nicht auf einer Linie stehen. */
async function countWrapped(bands) {
  return bands.evaluateAll((cells) => cells.filter((cell) => {
    const [lower, upper] = cell.querySelectorAll('.reb__band-price')
    return !lower || !upper || Math.abs(lower.getBoundingClientRect().top - upper.getBoundingClientRect().top) > 1
  }).length)
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

    await checkTradeTable(page, locale, expected)

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
