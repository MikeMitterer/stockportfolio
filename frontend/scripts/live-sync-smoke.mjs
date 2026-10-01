// Sichtbarer Browser-Smoketest für den Live-Abgleich (T-62).
//
// Voraussetzung: laufender Teststack mit synthetischen Konten:
//   ../StockInfo/.venv/bin/python -B scripts/stockinfo-test-server.py --stack --run --demo-accounts --stockinfo-root ../StockInfo
// Aufruf aus dem Repository-Root mit der dort gemeldeten Datei:
//   npm --prefix frontend run smoke:live-sync -- <data_dir>/demo-accounts.json
//
// Der Test öffnet Chrome sichtbar: A und B gehören demselben Konto, C einem
// zweiten Konto. Beim ersten Lauf ersetzt C sein temporäres Passwort; das neue
// Passwort wird in dieselbe Datei im temporären Testverzeichnis geschrieben.
// Die Fenster bleiben offen, bis Enter gedrückt wird.

import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const origin = 'http://127.0.0.1:5175'
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const dockSpace = 80
const credentialsPath = process.argv[2]
if (!credentialsPath) {
  console.error('Aufruf: npm --prefix frontend run smoke:live-sync -- <data_dir>/demo-accounts.json')
  process.exit(2)
}
const credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'))
const dashboardSelector = '.dashboard__empty,.dashboard__kpis'
const cashName = (suffix) => `Verrechnungskonto ${suffix}`

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: false,
  slowMo: 300,
  args: ['--no-first-run'],
})

function step(message) {
  console.log(`· ${message}`)
}

function passed(message) {
  console.log(`BESTANDEN: ${message}`)
}

async function login(account) {
  const context = await browser.newContext({ viewport: null })
  const page = await context.newPage()
  await page.goto(origin)
  await page.locator('input[type="text"]').first().fill(credentials[account].username)
  await page.locator('input[type="password"]').first().fill(credentials[account].password)
  await page.locator('form').first().evaluate((form) => form.requestSubmit())
  await page.waitForFunction((selector) => document.querySelector(selector) ||
    document.body.textContent?.includes('Neues Passwort'), dashboardSelector, { timeout: 20000 })
  const changeButton = page.getByRole('button', { name: 'Passwort speichern' })
  if (await changeButton.isVisible()) {
    const nextPassword = `${credentials[account].password}2`
    await page.locator('input[type="password"]').first().fill(nextPassword)
    const changed = page.waitForResponse((response) => response.url().endsWith('/api/auth/change-password'))
    await changeButton.click()
    if ((await changed).status() !== 200) throw new Error(`Konto ${account}: temporäres Passwort wurde nicht ersetzt`)
    credentials[account].password = nextPassword
    writeFileSync(credentialsPath, JSON.stringify(credentials))
    step(`Konto ${account}: erzwungener Passwortwechsel ausgeführt`)
  }
  await page.waitForSelector(dashboardSelector, { timeout: 20000 })
  return page
}

/**
 * Hauptbildschirm bestimmen. `window.screen` meldet nur den Bildschirm, auf
 * dem das Fenster gerade liegt; bei mehreren Monitoren ist das oft nicht der
 * große. Die Screen-Details-API kennt alle und braucht dafür eine Freigabe.
 */
async function primaryScreen(page) {
  await page.context().grantPermissions(['window-management'], { origin }).catch(() => undefined)
  return page.evaluate(async () => {
    try {
      const details = await window.getScreenDetails()
      const screen = details.screens.find((entry) => entry.isPrimary) ?? details.currentScreen
      return { left: screen.availLeft, top: screen.availTop, width: screen.availWidth, height: screen.availHeight }
    } catch {
      return { left: 0, top: 0, width: window.screen.availWidth, height: window.screen.availHeight }
    }
  })
}

/** Zwei Hauptfenster 50:50, links etwa 80 Pixel Platz für das Dock. */
async function place(page, index, screen) {
  const width = Math.floor((screen.width - dockSpace) / 2)
  const session = await page.context().newCDPSession(page)
  const { windowId } = await session.send('Browser.getWindowForTarget')
  await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'normal' } })
  await session.send('Browser.setWindowBounds', {
    windowId,
    bounds: { left: screen.left + dockSpace + index * width, top: screen.top, width, height: screen.height },
  })
}

/**
 * Trennt den Live-Abgleich von B wie ein Proxy-Ausfall: Neue Verbindungen
 * erhalten 502, die offene schließt `window.stop()`. Die Offline-Emulation des
 * Browsers allein beendet eine bereits offene SSE-Verbindung nicht.
 */
async function interruptLiveSync(page) {
  await page.route('**/api/data/events', (route) => route.fulfill({ status: 502, body: '' }))
  await page.evaluate(() => window.stop())
  await page.locator('.status__sync--offline').waitFor({ timeout: 15000 })
}

async function restoreLiveSync(page) {
  await page.unroute('**/api/data/events')
}

/** Öffnet den Editor einer Position; eine bereits aufgeklappte Zeile bleibt offen. */
async function openEditor(page, label) {
  const row = page.locator('.n-data-table-tr').filter({ hasText: label }).last()
  const editButton = page.getByRole('button', { name: 'Position bearbeiten' }).last()
  await row.locator('td').first().click()
  if (!await editButton.isVisible()) await row.locator('td').first().click()
  await editButton.click()
  return page.locator('[data-position-editor]')
}

async function renameCash(page, from, to) {
  const editor = await openEditor(page, from)
  await editor.locator('label').filter({ hasText: 'Bezeichnung' }).locator('input').fill(to)
  const write = page.waitForResponse((response) => response.url().includes('/api/data/portfolio/') &&
    response.request().method() === 'PUT')
  await editor.getByRole('button', { name: 'Speichern' }).click()
  return (await write).status()
}

async function deletePosition(page, symbol) {
  const editor = await openEditor(page, symbol)
  await editor.getByRole('button', { name: 'Löschen' }).click()
  const write = page.waitForResponse((response) => response.url().includes('/api/data/portfolio/') &&
    response.request().method() === 'PUT')
  await page.locator('.n-popconfirm__action button').last().click()
  if ((await write).status() !== 200) throw new Error(`Löschen von ${symbol} nicht gespeichert`)
}

async function positionCount(page) {
  const text = await page.locator('.status__context').innerText()
  return Number(/(\d+) Position/.exec(text)?.[1] ?? Number.NaN)
}

async function waitForPositions(page, count) {
  await page.waitForFunction((expected) => document.querySelector('.status__context')?.textContent
    ?.includes(`${expected} Position`), count, { timeout: 20000 })
}

async function openSettingsTab(page, tab) {
  await page.goto(`${origin}/#/settings?tab=${tab}`)
}

async function openDashboard(page) {
  await page.getByRole('link', { name: 'Dashboard' }).first().click()
  await page.locator('.dashboard__kpis').waitFor({ timeout: 20000 })
}

/** Liest den Ereignisstrom über den Vite-Proxy roh mit, wie ihn ein Reverse-Proxy sieht. */
async function openRawStream(page) {
  await page.evaluate(() => {
    const state = { frames: [], ended: false, endedAt: 0 }
    window.__liveSmoke = state
    void fetch('/api/data/events').then(async (response) => {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        state.frames.push(decoder.decode(value))
      }
    }).catch(() => undefined).finally(() => {
      state.ended = true
      state.endedAt = Date.now()
    })
  })
  await page.waitForFunction(() => window.__liveSmoke.frames.join('').includes(': connected'), undefined, { timeout: 10000 })
}

let pages = {}
try {
  step('Anmeldung: A und B mit Konto admin, C mit Konto user')
  pages.A = await login('admin')
  const screen = await primaryScreen(pages.A)
  step(`Hauptbildschirm ${screen.width} × ${screen.height}; Fenster je ${Math.floor((screen.width - dockSpace) / 2)} px breit`)
  const demoButton = pages.A.getByRole('button', { name: 'Beispiel-Depot laden' })
  if (await demoButton.isVisible()) await demoButton.click()
  await pages.A.locator('.dashboard__kpis').waitFor({ timeout: 20000 })
  pages.B = await login('admin')
  pages.C = await login('user')
  await place(pages.A, 0, screen)
  await place(pages.B, 1, screen)
  await place(pages.C, 1, screen)
  await pages.B.bringToFront()
  await pages.A.bringToFront()

  await pages.C.evaluate(() => {
    window.__foreignEvents = []
    window.__foreignSource = new EventSource('/api/data/events')
    window.__foreignSource.addEventListener('resource', (event) => window.__foreignEvents.push(event.data))
  })
  const contextA = (await pages.A.locator('.status__context').innerText()).trim()
  const contextB = (await pages.B.locator('.status__context').innerText()).trim()
  if (contextA !== contextB) throw new Error(`A und B zeigen verschiedene Depots: ${contextA} / ${contextB}`)

  const startName = (await pages.A.locator('.n-data-table-tr').filter({ hasText: 'Verrechnungskonto' }).last()
    .locator('td').first().innerText()).trim().split('\n')[0]
  const run = Date.now().toString(36)

  // ── Prüfpunkt 1 und 2 ──────────────────────────────────────────────────────
  step('Prüfpunkt 1/2: A benennt das Verrechnungskonto um')
  let navigationsB = 0
  pages.B.on('framenavigated', () => { navigationsB += 1 })
  const firstName = cashName(`${run}-1`)
  const readB = pages.B.waitForResponse((response) => response.url().endsWith('/api/data/portfolio') &&
    response.request().method() === 'GET')
  if (await renameCash(pages.A, startName, firstName) !== 200) throw new Error('Umbenennung in A nicht gespeichert')
  await readB
  await pages.B.getByText(firstName, { exact: true }).first().waitFor({ timeout: 10000 })
  if (navigationsB !== 0) throw new Error('B hat die Seite neu geladen')
  passed('B zeigt die Änderung aus A nach REST-Nachladen ohne Seiten-Refresh')
  await pages.C.waitForTimeout(1000)
  const foreignEvents = await pages.C.evaluate(() => window.__foreignEvents)
  const foreignData = await pages.C.evaluate(async () => JSON.stringify(await (await fetch('/api/data/portfolio')).json()))
  if (foreignEvents.length || foreignData.includes(run)) throw new Error('Konto C erhielt ein fremdes Ereignis oder fremde Daten')
  passed('Konto C erhielt weder Ereignis noch Daten des anderen Kontos')

  // ── Kurs-Hinweis an andere Fenster ─────────────────────────────────────────
  step('Kurs-Hinweis: A versucht ihn zu löschen und klickt danach Aktualisieren; B holt selbst Kurse')
  const deleteStatus = await pages.A.evaluate(async () => {
    const current = await (await fetch('/api/data/quote-refresh/current')).json().catch(() => null)
    const response = await fetch('/api/data/quote-refresh/current', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revision: current?.revision ?? 0 }),
    })
    return response.status
  })
  if (deleteStatus !== 405) throw new Error(`Löschen des Kurs-Hinweises ergab ${deleteStatus} statt 405`)
  passed('Der interne Kurs-Hinweis lässt sich nicht löschen (405)')
  const quoteRequestsB = []
  await pages.B.route('**/quote/**', async (route) => {
    quoteRequestsB.push(route.request().url())
    await route.continue()
  })
  const announced = pages.A.waitForResponse((response) => response.url().endsWith('/api/data/quote-refresh/current') &&
    response.request().method() === 'PUT')
  await pages.A.getByRole('button', { name: 'Aktualisieren' }).first().click()
  if ((await announced).status() !== 200) throw new Error('Kurs-Hinweis in A nicht gespeichert')
  for (let waited = 0; quoteRequestsB.length === 0 && waited < 20000; waited += 250) await pages.B.waitForTimeout(250)
  await pages.B.unroute('**/quote/**')
  if (quoteRequestsB.length === 0) throw new Error('B holte nach dem Kurs-Hinweis keine Kurse')
  if (navigationsB !== 0) throw new Error('B hat die Seite neu geladen')
  passed(`B holte nach dem Kursabruf in A ${quoteRequestsB.length} Kurse ohne Seiten-Refresh`)

  // ── Backup und Wiederherstellung ───────────────────────────────────────────
  step('Backup: A sichert das Depot, löscht die Hälfte der Positionen und spielt die Sicherung wieder ein')
  const originalCount = await positionCount(pages.A)
  await openSettingsTab(pages.A, 'backup')
  const download = pages.A.waitForEvent('download')
  await pages.A.getByRole('button', { name: 'Backup', exact: true }).click()
  const backupPath = join(tmpdir(), `live-sync-smoke-backup-${run}.json`)
  await (await download).saveAs(backupPath)
  await openDashboard(pages.A)
  const removable = ['EQQQ.DE', 'IUSN.DE', 'IS3M.DE']
  for (const symbol of removable) await deletePosition(pages.A, symbol)
  await waitForPositions(pages.B, originalCount - removable.length)
  for (const symbol of removable) {
    if (await pages.B.getByText(symbol, { exact: true }).count()) throw new Error(`B zeigt gelöschte Position ${symbol}`)
  }
  passed(`B zeigt nach dem Löschen ${originalCount - removable.length} statt ${originalCount} Positionen ohne Seiten-Refresh`)
  await openSettingsTab(pages.A, 'backup')
  await pages.A.locator('.backup__file').setInputFiles(backupPath)
  await pages.A.locator('.backup__preview').waitFor({ timeout: 10000 })
  await pages.A.getByRole('button', { name: 'Jetzt ersetzen' }).click()
  const restored = pages.A.waitForResponse((response) => response.url().endsWith('/api/data/restore'))
  await pages.A.locator('.n-popconfirm__action button').last().click()
  if ((await restored).status() !== 200) throw new Error('Wiederherstellung in A fehlgeschlagen')
  await waitForPositions(pages.B, originalCount)
  for (const symbol of removable) await pages.B.getByText(symbol, { exact: true }).first().waitFor({ timeout: 10000 })
  if (navigationsB !== 0) throw new Error('B hat die Seite neu geladen')
  passed(`B zeigt nach dem Einspielen wieder alle ${originalCount} Positionen ohne Seiten-Refresh`)
  await openDashboard(pages.A)

  // ── Prüfpunkt 3 ────────────────────────────────────────────────────────────
  step('Prüfpunkt 3: Live-Abgleich von B fällt aus, A ändert währenddessen, B verbindet sich wieder')
  await interruptLiveSync(pages.B)
  passed('B zeigt die unterbrochene Live-Verbindung an')
  const secondName = cashName(`${run}-2`)
  if (await renameCash(pages.A, firstName, secondName) !== 200) throw new Error('Zweite Umbenennung in A nicht gespeichert')
  await pages.B.waitForTimeout(2000)
  if (await pages.B.getByText(secondName, { exact: true }).count()) throw new Error('B war nicht wirklich getrennt')
  await restoreLiveSync(pages.B)
  await pages.B.getByText(secondName, { exact: true }).first().waitFor({ timeout: 45000 })
  await pages.B.locator('.status__sync').waitFor({ state: 'detached', timeout: 20000 })
  if (navigationsB !== 0) throw new Error('B hat die Seite neu geladen')
  passed('B verbindet sich selbst wieder und lädt den verpassten Stand ohne Seiten-Refresh')

  step('Prüfpunkt 3: Ereignisstrom über den Proxy 35 Sekunden ohne Änderungen offen halten')
  await openRawStream(pages.C)
  await pages.C.waitForTimeout(35000)
  const raw = await pages.C.evaluate(() => window.__liveSmoke)
  const keepAlives = raw.frames.join('').split(': keep-alive').length - 1
  if (raw.ended || keepAlives < 2) throw new Error(`Stream beendet: ${raw.ended}, Keep-Alives: ${keepAlives}`)
  passed(`Stream blieb offen, ${keepAlives} Keep-Alive-Kommentare über den Proxy`)

  // ── Prüfpunkt 4 ────────────────────────────────────────────────────────────
  step('Prüfpunkt 4: B verliert den Live-Abgleich, A ändert, B speichert mit altem Stand')
  await interruptLiveSync(pages.B)
  const thirdName = cashName(`${run}-3`)
  if (await renameCash(pages.A, secondName, thirdName) !== 200) throw new Error('Dritte Umbenennung in A nicht gespeichert')
  const staleStatus = await renameCash(pages.B, secondName, cashName(`${run}-B`))
  if (staleStatus !== 409) throw new Error(`Veralteter Schreibstand in B ergab ${staleStatus} statt 409`)
  const conflict = pages.B.locator('.private-data-alert')
  await conflict.getByText('in einem anderen Browser geändert').waitFor({ timeout: 5000 })
  passed('Veralteter Schreibstand wird als sichtbarer Konflikt abgewiesen')
  await restoreLiveSync(pages.B)
  step('B verbindet sich wieder; der Konflikthinweis muss stehen bleiben')
  await pages.B.waitForResponse((response) => response.url().endsWith('/api/data/portfolio') &&
    response.request().method() === 'GET', { timeout: 45000 })
  await pages.B.waitForTimeout(1000)
  if (!await conflict.isVisible()) throw new Error('Konflikthinweis verschwand nach dem Nachladen')
  passed('Nachladen hebt den sichtbaren Konflikt nicht stillschweigend auf')

  step('Prüfpunkt 4: C meldet sich bei offenem Stream ab')
  await openRawStream(pages.C)
  const loggedOutAt = await pages.C.evaluate(async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!response.ok) throw new Error(`Logout ${response.status}`)
    return Date.now()
  })
  await pages.C.waitForFunction(() => window.__liveSmoke.ended, undefined, { timeout: 20000 })
  const closedAfter = await pages.C.evaluate((start) => window.__liveSmoke.endedAt - start, loggedOutAt)
  const dataStatus = await pages.C.evaluate(async () => (await fetch('/api/data/portfolio')).status)
  if (dataStatus !== 401) throw new Error(`Daten nach Logout: ${dataStatus} statt 401`)
  passed(`Stream endete ${(closedAfter / 1000).toFixed(1)} s nach dem Logout; Datenabruf danach 401`)

  console.log('\nAlle Prüfschritte bestanden.')
} catch (error) {
  console.error(error)
  for (const [label, page] of Object.entries(pages)) {
    const path = join(tmpdir(), `live-sync-smoke-${label}.png`)
    if (await page.screenshot({ path }).then(() => true, () => false)) console.error(`Bildschirmfoto: ${path}`)
  }
  process.exitCode = 1
} finally {
  console.log('Die Fenster bleiben zur Sichtprüfung offen. Enter beendet den Test.')
  process.stdin.resume()
  await new Promise((resolve) => {
    process.stdin.once('data', resolve)
    process.stdin.once('end', resolve)
  })
  await browser.close()
}
