// Prüft sichtbare Hinweistexte auf Methodenseite und Rebalancing in DE und EN,
// dazu die Handelstabelle: gekürzter Kopf „± Stück“, Bandkurse unter dem Kurs
// ohne Umbruch, ihr Hinweis im Spaltenkopf (Text, fokussierbar, auch schmal
// erreichbar, führt zur Erklärung auf der Methodenseite, ohne dass der Plan
// verloren geht) und die Tabelle ohne waagrechtes Scrollen (T-108),
// außerdem die Zielsumme in der Fußzeile der Rebalancing-Tabelle (T-97).
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
    bandPricesMethod: {
      required: ['Bandkurse:', 'alle anderen Kurse gleich bleiben'],
      forbidden: ['Zielkurs', 'Kursziel', 'Empfehlung', 'günstig', 'Vorschlag'],
    },
    targetSum: { balanced: 'Ziele ergeben 100 %', over: 'zu viel', toast: 'Die Ziele ergeben zusammen' },
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
    bandPricesMethod: {
      required: ['Band prices:', 'all other prices stay the same'],
      forbidden: ['target price', 'price target', 'recommend', 'cheap', 'suggestion'],
    },
    targetSum: { balanced: 'Targets add up to 100 %', over: 'too much', toast: 'The targets add up to' },
  },
}

const failures = []

/** Zahlen eines Zellentexts in Reihenfolge; Dezimalkomma im Deutschen, Minus auch als U+2212. */
function numbersIn(text, locale) {
  const normalized = locale === 'de' ? text.replaceAll('.', '').replaceAll(',', '.') : text.replaceAll(',', '')
  return [...normalized.replaceAll('−', '-').matchAll(/[+-]?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]))
}

/**
 * Hebt das erste Ziel probeweise um einen Prozentpunkt und prüft die
 * Fußzeile: Summe steigt um genau 1, Abweichung passt zur Summe, Zustand
 * „über 100 %“, und der Toast nennt dieselbe Summe.
 */
async function verifyTargetSum(page, locale, expected) {
  const label = `${locale} · Zielsumme Fußzeile`
  const cell = page.locator('tfoot .reb__foot-target')
  await cell.waitFor({ timeout: 20000 })
  const [before] = numbersIn(await cell.innerText(), locale)
  // Fehlt eine Zahl, wird jede Rechnung NaN und jeder Vergleich falsch; das wäre ein stilles OK.
  if (!Number.isFinite(before)) {
    failures.push(`${label}: keine Summe in „${await cell.innerText()}“`)
    return
  }
  const startsBalanced = Math.abs(before - 100) < 0.005
  if (startsBalanced && !(await cell.innerText()).includes(expected.balanced)) {
    failures.push(`${label}: ausgeglichene Summe ohne „${expected.balanced}“`)
  }
  const display = page.locator('tbody tr.reb__row .reb__target .inline-number__display').first()
  await display.click()
  const input = page.locator('tbody tr.reb__row .reb__target input').first()
  const current = Number(await input.inputValue())
  await input.fill(String(current + 1))
  await input.press('Enter')
  await page.waitForFunction((previous) => document.querySelector('tfoot .reb__foot-target')?.textContent?.trim().split(/\s/)[0] !== previous,
    (await cell.innerText()).trim().split(/\s/)[0], { timeout: 5000 }).catch(() => {})
  const text = await cell.innerText()
  const [after, deviation] = numbersIn(text, locale)
  const classes = (await cell.getAttribute('class')) ?? ''
  if (!Number.isFinite(after)) failures.push(`${label}: keine Summe nach der Änderung in „${text}“`)
  else if (after > 100.005 && !Number.isFinite(deviation)) failures.push(`${label}: keine Abweichung in „${text}“`)
  else if (Math.abs(after - before - 1) > 0.05) failures.push(`${label}: Summe ${before} → ${after}, erwartet +1`)
  else if (after > 100.005) {
    if (Math.abs(deviation - (after - 100)) > 0.05) failures.push(`${label}: Abweichung ${deviation} passt nicht zur Summe ${after}`)
    if (!text.includes(expected.over)) failures.push(`${label}: „${expected.over}“ fehlt in „${text}“`)
    if (!classes.includes('reb__flow--out')) failures.push(`${label}: Zustand „über 100 %“ nicht markiert`)
    const sumText = text.trim().split('\n')[0].trim()
    const toast = page.locator('.n-notification', { hasText: expected.toast })
    await toast.first().waitFor({ timeout: 5000 }).catch(() => {})
    if (!(await toast.first().innerText().catch(() => '')).includes(sumText)) failures.push(`${label}: Toast nennt nicht „${sumText}“`)
  }
  if (!failures.some((failure) => failure.startsWith(`${label}:`))) console.log(`OK  ${label}: ${before} → ${after}`)
}

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
  await closeHints(page)

  if (imageDir) await page.locator('.reb__table').screenshot({ path: resolve(imageDir, `trade-table-${locale}.png`) })

  // Schmalste Breite: Die Tabelle scrollt dort in ihrem Bereich; die Kurs-Spalte
  // kommt ins Bild, und auch hier bricht kein Bandkurs um.
  await page.setViewportSize(narrowViewport)
  await closeHints(page)
  await hint.scrollIntoViewIfNeeded()
  if (!(await hint.isVisible())) failures.push(`${label}: Hinweis zu den Bandkursen in schmaler Breite nicht erreichbar`)
  await bands.first().scrollIntoViewIfNeeded()
  const wrappedNarrow = await countWrapped(bands)
  if (wrappedNarrow > 0) failures.push(`${label}: ${wrappedNarrow} Bandkurs-Zeilen brechen in schmaler Breite um`)
  await closeHints(page)
  if (imageDir) await page.screenshot({ path: resolve(imageDir, `trade-table-${locale}-narrow.png`) })
  await page.setViewportSize(viewport)

  await checkPlanSurvivesHint(page, label, hint, expected)
}

/**
 * Der Hinweis im Kurs-Kopf führt per Tastatur auf die Methodenseite (#bands). Dort
 * steht die Erklärung der Bandkurse, und nach dem Zurückgehen ist der Plan noch da:
 * Eine eingetragene Stückzahl darf der Abstecher nicht verwerfen.
 */
async function checkPlanSurvivesHint(page, label, hint, expected) {
  const tradeCell = () => page.locator('.reb__table tbody tr')
    .filter({ has: page.locator('.reb__band-prices') }).first()
    .locator('.inline-number').nth(1)
  await tradeCell().locator('.inline-number__display').click()
  await tradeCell().locator('.inline-number__field').fill('5')
  await tradeCell().locator('.inline-number__field').press('Enter')
  const before = (await tradeCell().locator('.inline-number__display').innerText()).trim()
  if (before !== '5') failures.push(`${label}: Stückzahl 5 nicht eingetragen („${before}“)`)

  await hint.focus()
  await page.keyboard.press('Enter')
  await page.locator('#bands').waitFor({ timeout: 10000 })
  verify(`${label} · Methodenseite`, await page.locator('#bands').innerText(), expected.bandPricesMethod)

  await page.goBack()
  await page.locator('.reb__band-prices').first().waitFor({ timeout: 10000 })
  const after = (await tradeCell().locator('.inline-number__display').innerText()).trim()
  if (after !== before) failures.push(`${label}: Plan nach der Methodenseite verloren („${before}“ → „${after}“)`)
  else console.log(`OK  ${label} · Plan bleibt nach der Methodenseite`)
}

/** Schließt offene Hinweise (Fokus und Maus weg), damit sie auf den Bildern nichts verdecken. */
async function closeHints(page) {
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur())
  await page.mouse.move(0, 0)
  await page.waitForFunction(() => !document.querySelector('.ux-hint__body'), null, { timeout: 5000 })
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
    await page.mouse.move(0, 0)
    await verifyTargetSum(page, locale, expected.targetSum)
    if (imageDir) await page.locator('tfoot').screenshot({ path: resolve(imageDir, `target-sum-${locale}.png`) })

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
